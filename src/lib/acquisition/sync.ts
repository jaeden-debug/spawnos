import crypto from 'node:crypto'
import { AscError, type AscClient } from './asc-client'
import {
  ALERT_LOOKBACK_DAYS,
  DOWNLOADS_COMPLETENESS_DAYS,
  FAILURE_ALERT_COOLDOWN_HOURS,
  FAILURE_ALERT_MIN_CONSECUTIVE,
  STALE_AFTER_DAYS,
} from './config'
import { acquisitionSubject, buildAcquisitionEmail, buildFailureEmail, type Mailer } from './email'
import { md5Hex, parseDownloadsReport } from './parser'
import { listCommerceReports, listInstances, listReportRequests, listSegments, pickDownloadReports } from './reports'
import type { AcquisitionStore } from './store'
import type { DailyDownloads, FunnelCounts, SegmentMeta, SyncErrorCode, SyncState, SyncStatus, SyncTrigger } from './types'

/**
 * Daily App Store acquisition sync.
 *
 *   Apple (Analytics Reports API)
 *     → every available DAILY "App Downloads" instance (snapshot + ongoing)
 *     → download each segment not already imported with the same checksum
 *     → verify MD5, parse, upsert (a date's rows are REPLACED by newer Apple
 *       instances, never summed)
 *     → work out which report dates are now complete (Apple: downloads data
 *       is complete within 2 days of the newest instance)
 *     → email alerts@ ONLY for complete dates with first-time downloads > 0
 *       that have never been announced (claimed atomically in Postgres)
 *
 * Safe to run any number of times: a run lease stops overlap, imports are
 * idempotent, and each date can be announced once.
 */

export interface SyncDeps {
  appId: string
  /** null when Apple credentials are not configured. */
  client: AscClient | null
  store: AcquisitionStore
  /** null when no email provider is configured. */
  mailer: Mailer | null
  recipient: string
  sender: string
  trigger: SyncTrigger
  now?: () => Date
  runId?: string
  log?: (message: string, extra?: Record<string, unknown>) => void
}

export type EmailOutcome =
  | 'sent'
  | 'already_announced'
  | 'no_new_first_time_downloads'
  | 'no_complete_report_yet'
  | 'send_failed'
  | 'no_mailer'
  | 'failure_alert_sent'
  | 'failure_alert_suppressed'
  | 'none'

export interface SyncResult {
  runId: string
  status: SyncStatus
  segmentsSeen: number
  segmentsImported: number
  segmentsSkipped: number
  segmentsFailed: number
  rowsImported: number
  datesApplied: string[]
  latestAvailableProcessingDate: string | null
  latestCompleteReportDate: string | null
  email: EmailOutcome
  announcedDates: string[]
  errorCode?: SyncErrorCode
  error?: string
  warnings: string[]
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(
    (Date.parse(`${toIso.slice(0, 10)}T00:00:00Z`) - Date.parse(`${fromIso.slice(0, 10)}T00:00:00Z`)) / 86_400_000,
  )
}

export function datesInRange(from: string, to: string): string[] {
  const out: string[] = []
  for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(d)
  return out
}

const maxDate = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b)

function errorCodeOf(err: unknown): SyncErrorCode {
  if (err instanceof AscError) return err.code
  return 'unknown'
}

export async function sumFunnel(store: AcquisitionStore, dates: string[]): Promise<FunnelCounts> {
  const total: FunnelCounts = {
    bwImpressions: 0,
    bwToSpawnosClicks: 0,
    bwAppStoreClicks: 0,
    spawnosArrivalsFromBw: 0,
    spawnosAppStoreClicks: 0,
    spawnosAppStoreClicksFromBw: 0,
    paidAppStoreClicks: 0,
    appStoreClicksByCampaign: {},
  }
  for (const d of dates) {
    const f = await store.getFunnelCounts(d, d)
    total.bwImpressions += f.bwImpressions
    total.bwToSpawnosClicks += f.bwToSpawnosClicks
    total.bwAppStoreClicks += f.bwAppStoreClicks
    total.spawnosArrivalsFromBw += f.spawnosArrivalsFromBw
    total.spawnosAppStoreClicks += f.spawnosAppStoreClicks
    total.spawnosAppStoreClicksFromBw += f.spawnosAppStoreClicksFromBw
    total.paidAppStoreClicks += f.paidAppStoreClicks
    for (const [k, v] of Object.entries(f.appStoreClicksByCampaign)) {
      total.appStoreClicksByCampaign[k] = (total.appStoreClicksByCampaign[k] ?? 0) + v
    }
  }
  return total
}

export async function runAppStoreSync(deps: SyncDeps): Promise<SyncResult> {
  const { appId, store } = deps
  const now = deps.now?.() ?? new Date()
  const today = now.toISOString().slice(0, 10)
  const runId = deps.runId ?? crypto.randomUUID()
  const log = deps.log ?? ((m: string, e?: Record<string, unknown>) => console.log(`[app-store-sync] ${m}`, e ?? ''))

  const result: SyncResult = {
    runId,
    status: 'running',
    segmentsSeen: 0,
    segmentsImported: 0,
    segmentsSkipped: 0,
    segmentsFailed: 0,
    rowsImported: 0,
    datesApplied: [],
    latestAvailableProcessingDate: null,
    latestCompleteReportDate: null,
    email: 'none',
    announcedDates: [],
    warnings: [],
  }

  if (!deps.client) {
    result.status = 'not_configured'
    result.errorCode = 'not_configured'
    result.error = 'App Store Connect credentials are not configured'
    await store.startRun({ run_id: runId, app_id: appId, trigger: deps.trigger, status: 'not_configured' })
    await store.finishRun(runId, { status: 'not_configured', error_code: 'not_configured', error: result.error })
    log('not configured; nothing to do')
    return result
  }
  const client = deps.client

  if (!(await store.acquireLock(appId, runId, 600))) {
    result.status = 'skipped_locked'
    await store.startRun({ run_id: runId, app_id: appId, trigger: deps.trigger, status: 'skipped_locked' })
    await store.finishRun(runId, { status: 'skipped_locked' })
    log('another sync holds the lease; skipping')
    return result
  }

  await store.startRun({ run_id: runId, app_id: appId, trigger: deps.trigger, status: 'running' })
  const applied = new Set<string>()
  const segmentErrors: string[] = []
  const problems: Array<{ code: SyncErrorCode; message: string }> = []

  try {
    // ── 1. Discover requests ────────────────────────────────────────────
    const requests = await listReportRequests(client, appId)
    const ongoing = requests.find((r) => r.accessType === 'ONGOING' && !r.stoppedDueToInactivity) ?? null
    const snapshots = requests.filter((r) => r.accessType === 'ONE_TIME_SNAPSHOT')
    if (!ongoing) {
      const stopped = requests.some((r) => r.accessType === 'ONGOING' && r.stoppedDueToInactivity)
      problems.push({
        code: 'request_stopped',
        message: stopped
          ? 'Apple stopped the ONGOING analytics report request due to inactivity'
          : 'No ONGOING analytics report request exists for this app',
      })
    }

    // Snapshots first, ongoing last: on equal processing dates the ongoing
    // instance is applied last, and Postgres only lets newer data replace older.
    const ordered = [...snapshots, ...(ongoing ? [ongoing] : [])]

    // ── 2. Import every segment we have not already stored ──────────────
    for (const request of ordered) {
      const reports = pickDownloadReports(await listCommerceReports(client, request.id))
      for (const variant of ['standard', 'detailed'] as const) {
        const report = reports[variant]
        if (!report) {
          result.warnings.push(`${request.accessType}: no "App Downloads ${variant}" report listed`)
          continue
        }
        const instances = await listInstances(client, report.id, 'DAILY')
        for (const instance of instances) {
          if (variant === 'standard' && request.accessType === 'ONGOING') {
            result.latestAvailableProcessingDate = maxDate(result.latestAvailableProcessingDate, instance.processingDate)
          }
          const segments = await listSegments(client, instance.id)
          for (const segment of segments) {
            result.segmentsSeen++
            const meta: SegmentMeta = {
              segment_id: segment.id,
              app_id: appId,
              request_id: request.id,
              access_type: request.accessType,
              report_id: report.id,
              report_name: report.name,
              report_variant: variant,
              instance_id: instance.id,
              granularity: instance.granularity,
              processing_date: instance.processingDate,
              checksum: segment.checksum,
              size_bytes: segment.sizeInBytes,
            }

            const existing = await store.getImportedSegment(segment.id)
            if (existing?.status === 'imported' && (!segment.checksum || existing.checksum === segment.checksum)) {
              result.segmentsSkipped++
              continue
            }

            try {
              const buf = await client.download(segment.url)
              if (segment.checksum && md5Hex(buf).toLowerCase() !== segment.checksum.toLowerCase()) {
                throw new AscError('Report segment failed its MD5 checksum', 'checksum_mismatch')
              }
              const parsed = parseDownloadsReport(buf, { appId })
              const res = await store.applyDownloadSegment(meta, parsed.rows)
              result.segmentsImported++
              result.rowsImported += res.rowsInserted
              res.datesApplied.forEach((d) => applied.add(d))
            } catch (err) {
              result.segmentsFailed++
              const message = `${variant} ${instance.processingDate} ${segment.id}: ${(err as Error).message}`
              segmentErrors.push(message)
              log('segment failed', { segment: segment.id, code: errorCodeOf(err) })
              await store.recordSegmentFailure(meta, (err as Error).message).catch(() => undefined)
            }
          }
        }
      }
    }

    // ── 3. Completeness ──────────────────────────────────────────────────
    const latestImported = await store.latestImportedProcessingDate(appId)
    result.latestCompleteReportDate = latestImported ? addDays(latestImported, -DOWNLOADS_COMPLETENESS_DAYS) : null
    if (latestImported && daysBetween(latestImported, today) > STALE_AFTER_DAYS) {
      problems.push({
        code: 'report_stale',
        message: `Newest Apple App Downloads instance is from ${latestImported} (${daysBetween(latestImported, today)} days old)`,
      })
    }
    if (result.segmentsFailed > 0) {
      problems.push({ code: 'incomplete_report', message: segmentErrors.slice(0, 3).join(' | ') })
    }
    result.datesApplied = [...applied].sort()

    const statePatch: Partial<SyncState> = {
      latest_available_processing_date: result.latestAvailableProcessingDate,
      latest_imported_processing_date: latestImported,
      latest_complete_report_date: result.latestCompleteReportDate,
    }

    // ── 4. Announce newly complete first-time downloads ─────────────────
    result.email = await announceNewDownloads(deps, result, log)
    if (result.latestCompleteReportDate) {
      const recent = await store.getDailyDownloads(appId, addDays(result.latestCompleteReportDate, -365), result.latestCompleteReportDate)
      const withData = recent.filter((d) => d.total_downloads > 0).map((d) => d.report_date)
      statePatch.latest_report_date_with_data = withData.length ? withData[withData.length - 1] : null
    }

    // ── 5. State + housekeeping ─────────────────────────────────────────
    if (problems.length === 0) {
      result.status = 'success'
      await store.recordSuccess(appId, statePatch)
    } else {
      result.status = 'partial'
      result.errorCode = problems[0].code
      result.error = problems.map((p) => p.message).join(' | ').slice(0, 1000)
      const state = await store.recordFailure(appId, result.errorCode, result.error, statePatch)
      const alert = await maybeSendFailureAlert(deps, state, result.errorCode, result.error)
      if (alert !== 'none') result.warnings.push(`failure alert: ${alert}`)
    }

    try {
      const purged = await store.purgeClickIds()
      if (purged > 0) log('purged expired Google Ads click ids', { purged })
    } catch (err) {
      result.warnings.push(`click-id purge failed: ${(err as Error).message}`)
    }
  } catch (err) {
    result.status = 'failed'
    result.errorCode = errorCodeOf(err)
    result.error = (err as Error).message.slice(0, 1000)
    log('sync failed', { code: result.errorCode, error: result.error })
    try {
      const state = await store.recordFailure(appId, result.errorCode, result.error)
      const alert = await maybeSendFailureAlert(deps, state, result.errorCode, result.error)
      result.email = alert === 'sent' ? 'failure_alert_sent' : 'failure_alert_suppressed'
    } catch (inner) {
      result.warnings.push(`could not record failure: ${(inner as Error).message}`)
    }
  } finally {
    try {
      await store.finishRun(runId, {
        status: result.status,
        segments_seen: result.segmentsSeen,
        segments_imported: result.segmentsImported,
        segments_skipped: result.segmentsSkipped,
        segments_failed: result.segmentsFailed,
        rows_imported: result.rowsImported,
        dates_applied: result.datesApplied,
        error_code: result.errorCode ?? null,
        error: result.error ?? null,
        email_outcome: result.email,
        details: {
          latest_available_processing_date: result.latestAvailableProcessingDate,
          latest_complete_report_date: result.latestCompleteReportDate,
          announced_dates: result.announcedDates,
          warnings: result.warnings,
        },
      })
    } finally {
      await store.releaseLock(appId, runId).catch(() => undefined)
    }
  }

  log('done', {
    status: result.status,
    imported: result.segmentsImported,
    skipped: result.segmentsSkipped,
    failed: result.segmentsFailed,
    email: result.email,
  })
  return result
}

async function announceNewDownloads(
  deps: SyncDeps,
  result: SyncResult,
  log: (message: string, extra?: Record<string, unknown>) => void,
): Promise<EmailOutcome> {
  const { store, appId } = deps
  const cutoff = result.latestCompleteReportDate
  if (!cutoff) return 'no_complete_report_yet'

  const from = addDays(cutoff, -(ALERT_LOOKBACK_DAYS - 1))
  const candidates = (await store.getDailyDownloads(appId, from, cutoff)).filter((d) => d.first_time_downloads > 0)
  if (candidates.length === 0) return 'no_new_first_time_downloads'
  if (!deps.mailer) return 'no_mailer'

  const claim = await store.claimAcquisitionAlert(
    appId,
    candidates.map((d) => d.report_date),
    deps.recipient,
    acquisitionSubject({ days: candidates }),
  )
  if (!claim.alertId || claim.dates.length === 0) return 'already_announced'

  const days: DailyDownloads[] = candidates.filter((d) => claim.dates.includes(d.report_date))
  try {
    const [territories, sourceTypes, campaigns, funnel] = await Promise.all([
      store.getTerritories(appId, claim.dates),
      store.getSourceTypes(appId, claim.dates),
      store.getCampaigns(appId, claim.dates),
      sumFunnel(store, claim.dates),
    ])
    const email = buildAcquisitionEmail({ days, territories, sourceTypes, campaigns, funnel })
    const sent = await deps.mailer.send({
      to: deps.recipient,
      from: deps.sender,
      subject: email.subject,
      text: email.text,
      html: email.html,
      idempotencyKey: claim.dedupeKey ?? undefined,
    })
    await store.markAlertSent(claim.alertId, sent.id)
    result.announcedDates = claim.dates
    log('acquisition email sent', { dates: claim.dates })
    return 'sent'
  } catch (err) {
    await store.failAcquisitionAlert(claim.alertId, (err as Error).message).catch(() => undefined)
    result.warnings.push(`acquisition email failed: ${(err as Error).message}`)
    log('acquisition email failed; dates released for retry', { dates: claim.dates })
    return 'send_failed'
  }
}

async function maybeSendFailureAlert(
  deps: SyncDeps,
  state: SyncState,
  code: SyncErrorCode,
  message: string,
): Promise<'sent' | 'send_failed' | 'none'> {
  if (!deps.mailer) return 'none'
  const claimed = await deps.store.claimFailureAlert(deps.appId, FAILURE_ALERT_MIN_CONSECUTIVE, FAILURE_ALERT_COOLDOWN_HOURS)
  if (!claimed) return 'none'
  const email = buildFailureEmail({
    lastSuccessAt: state.last_success_at,
    latestReportDate: state.latest_complete_report_date,
    errorCode: code,
    errorMessage: message,
    consecutiveFailures: state.consecutive_failures,
  })
  const dedupeKey = `sync_failure:${deps.appId}:${(deps.now?.() ?? new Date()).toISOString().slice(0, 13)}`
  try {
    const sent = await deps.mailer.send({ to: deps.recipient, from: deps.sender, ...email, idempotencyKey: dedupeKey })
    await deps.store.logAlert({
      appId: deps.appId, kind: 'sync_failure', dedupeKey, recipient: deps.recipient, subject: email.subject, status: 'sent', providerId: sent.id,
    }).catch(() => undefined)
    return 'sent'
  } catch (err) {
    await deps.store.logAlert({
      appId: deps.appId, kind: 'sync_failure', dedupeKey, recipient: deps.recipient, subject: email.subject, status: 'failed', error: (err as Error).message,
    }).catch(() => undefined)
    return 'send_failed'
  }
}

/** Sends clearly-labelled TEST emails with sample data. Never touches report data. */
export async function sendTestEmails(
  deps: Pick<SyncDeps, 'appId' | 'store' | 'mailer' | 'recipient' | 'sender'>,
  kinds: Array<'acquisition' | 'failure'> = ['acquisition'],
): Promise<Array<{ kind: string; ok: boolean; id?: string | null; error?: string }>> {
  if (!deps.mailer) return kinds.map((kind) => ({ kind, ok: false, error: 'no mailer configured' }))
  const out: Array<{ kind: string; ok: boolean; id?: string | null; error?: string }> = []
  for (const kind of kinds) {
    const email =
      kind === 'acquisition'
        ? buildAcquisitionEmail({
            test: true,
            days: [{ report_date: '2026-09-17', first_time_downloads: 3, redownloads: 1, total_downloads: 4 }],
            territories: [
              { label: 'CA', first_time_downloads: 2, redownloads: 1 },
              { label: 'US', first_time_downloads: 1, redownloads: 0 },
            ],
            sourceTypes: [
              { label: 'Web referrer', first_time_downloads: 2, redownloads: 0 },
              { label: 'App Store search', first_time_downloads: 1, redownloads: 1 },
            ],
            campaigns: [],
            funnel: {
              bwImpressions: 150,
              bwToSpawnosClicks: 18,
              bwAppStoreClicks: 4,
              spawnosArrivalsFromBw: 17,
              spawnosAppStoreClicks: 5,
              spawnosAppStoreClicksFromBw: 5,
              paidAppStoreClicks: 0,
              appStoreClicksByCampaign: {},
            },
          })
        : buildFailureEmail({
            test: true,
            lastSuccessAt: '2026-09-17T15:00:00Z',
            latestReportDate: '2026-09-15',
            errorCode: 'auth',
            errorMessage: 'Sample: App Store Connect 401 NOT_AUTHORIZED',
            consecutiveFailures: 2,
          })
    const dedupeKey = `test:${kind}:${Date.now()}`
    try {
      const sent = await deps.mailer.send({ to: deps.recipient, from: deps.sender, ...email, idempotencyKey: dedupeKey })
      await deps.store.logAlert({ appId: deps.appId, kind: 'test', dedupeKey, recipient: deps.recipient, subject: email.subject, status: 'sent', providerId: sent.id }).catch(() => undefined)
      out.push({ kind, ok: true, id: sent.id })
    } catch (err) {
      out.push({ kind, ok: false, error: (err as Error).message })
    }
  }
  return out
}
