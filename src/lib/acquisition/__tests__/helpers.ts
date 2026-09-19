import crypto from 'node:crypto'
import zlib from 'node:zlib'
import { AscClient } from '../asc-client'
import type { Mailer, OutgoingEmail } from '../email'
import { md5Hex } from '../parser'
import { dailyFromFacts, sumByLabel, type AcquisitionStore, type ClaimResult, type RunPatch, type RunRecord } from '../store'
import type {
  ApplySegmentResult,
  DownloadRow,
  FunnelCounts,
  SegmentMeta,
  SyncErrorCode,
  SyncState,
} from '../types'

export const APP = '6803675364'

// ── Apple report fixtures ────────────────────────────────────────────────────

export const STANDARD_HEADER = [
  'Date', 'App Name', 'App Apple Identifier', 'Download Type', 'App Version', 'Device',
  'Platform Version', 'Source Type', 'Page Type', 'Pre-Order', 'Territory', 'Counts',
]
export const DETAILED_HEADER = [
  'Date', 'App Name', 'App Apple Identifier', 'Download Type', 'App Version', 'Device',
  'Platform Version', 'Source Type', 'Source Info', 'Campaign', 'Page Type', 'Page Title',
  'Pre-Order', 'Territory', 'Counts',
]

export interface FixtureRow {
  date: string
  type?: string
  territory?: string
  source?: string
  sourceInfo?: string
  campaign?: string
  counts: number
}

export function standardTsv(rows: FixtureRow[]): string {
  const lines = [STANDARD_HEADER.join('\t')]
  for (const r of rows) {
    lines.push([
      r.date, 'SpawnOS', APP, r.type ?? 'First-time download', '1.0', 'iPhone', 'iOS 26.6',
      r.source ?? 'App Store search', 'Product page', 'No', r.territory ?? 'CA', String(r.counts),
    ].join('\t'))
  }
  return lines.join('\n') + '\n'
}

export function detailedTsv(rows: FixtureRow[]): string {
  const lines = [DETAILED_HEADER.join('\t')]
  for (const r of rows) {
    lines.push([
      r.date, 'SpawnOS', APP, r.type ?? 'First-time download', '1.0', 'iPhone', 'iOS 26.6',
      r.source ?? 'Web referrer', r.sourceInfo ?? '', r.campaign ?? '', 'Product page', '',
      'No', r.territory ?? 'CA', String(r.counts),
    ].join('\t'))
  }
  return lines.join('\n') + '\n'
}

export const gz = (text: string) => zlib.gzipSync(Buffer.from(text))

// ── Fake App Store Connect API ──────────────────────────────────────────────

interface FakeSegment {
  id: string
  body: Buffer
  /** Override the advertised checksum (to simulate corruption). */
  checksum?: string
}
interface FakeInstance {
  id: string
  processingDate: string
  segments: FakeSegment[]
}
interface FakeReport {
  id: string
  name: string
  instances: FakeInstance[]
}
interface FakeRequest {
  id: string
  accessType: 'ONGOING' | 'ONE_TIME_SNAPSHOT'
  stopped?: boolean
  reports: FakeReport[]
}

export class FakeApple {
  requests: FakeRequest[] = []
  /** When set, every API (not download) call answers with this status. */
  failStatus: number | null = null
  /** Number of API calls to fail before recovering (with failStatus). */
  failCount = Infinity
  downloadFailStatus: number | null = null
  calls: Array<{ url: string; auth: string | null }> = []
  private seq = 0

  addRequest(accessType: 'ONGOING' | 'ONE_TIME_SNAPSHOT', opts: { stopped?: boolean } = {}): FakeRequest {
    const id = `req-${accessType}-${++this.seq}`
    const req: FakeRequest = {
      id,
      accessType,
      stopped: opts.stopped,
      reports: [
        { id: `r3-${id}`, name: 'App Downloads Standard', instances: [] },
        { id: `r4-${id}`, name: 'App Downloads Detailed', instances: [] },
        { id: `r34-${id}`, name: 'Streaming Downloads Performance', instances: [] },
      ],
    }
    this.requests.push(req)
    return req
  }

  addInstance(req: FakeRequest, variant: 'standard' | 'detailed', processingDate: string, body: string | Buffer, opts: { segmentId?: string; checksum?: string } = {}) {
    const report = req.reports[variant === 'standard' ? 0 : 1]
    const buf = typeof body === 'string' ? gz(body) : body
    const inst: FakeInstance = {
      id: `inst-${report.id}-${processingDate}-${++this.seq}`,
      processingDate,
      segments: [{ id: opts.segmentId ?? `seg-${++this.seq}`, body: buf, checksum: opts.checksum }],
    }
    report.instances.push(inst)
    return inst
  }

  fetch = async (input: string, init?: RequestInit): Promise<Response> => {
    const url = new URL(input)
    const auth = (init?.headers as Record<string, string> | undefined)?.Authorization ?? null
    this.calls.push({ url: input, auth })
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

    if (url.hostname === 'files.test') {
      if (this.downloadFailStatus) return new Response('nope', { status: this.downloadFailStatus })
      const seg = this.allSegments().find((s) => s.id === url.pathname.slice(1))
      return seg ? new Response(new Uint8Array(seg.body), { status: 200 }) : new Response('missing', { status: 404 })
    }

    if (this.failStatus && this.failCount > 0) {
      this.failCount--
      return json({ errors: [{ code: 'FAKE', title: `HTTP ${this.failStatus}` }] }, this.failStatus)
    }

    const p = url.pathname
    let m: RegExpExecArray | null
    if ((m = /^\/v1\/apps\/([^/]+)\/analyticsReportRequests$/.exec(p))) {
      return json({
        data: this.requests.map((r) => ({
          id: r.id,
          type: 'analyticsReportRequests',
          attributes: { accessType: r.accessType, stoppedDueToInactivity: Boolean(r.stopped) },
        })),
      })
    }
    if ((m = /^\/v1\/analyticsReportRequests\/([^/]+)\/reports$/.exec(p))) {
      const req = this.requests.find((r) => r.id === m![1])
      return json({
        data: (req?.reports ?? []).map((r) => ({ id: r.id, type: 'analyticsReports', attributes: { name: r.name, category: 'COMMERCE' } })),
      })
    }
    if ((m = /^\/v1\/analyticsReports\/([^/]+)\/instances$/.exec(p))) {
      const report = this.requests.flatMap((r) => r.reports).find((r) => r.id === m![1])
      return json({
        data: (report?.instances ?? []).map((i) => ({
          id: i.id,
          type: 'analyticsReportInstances',
          attributes: { granularity: 'DAILY', processingDate: i.processingDate },
        })),
      })
    }
    if ((m = /^\/v1\/analyticsReportInstances\/([^/]+)\/segments$/.exec(p))) {
      const inst = this.requests.flatMap((r) => r.reports).flatMap((r) => r.instances).find((i) => i.id === m![1])
      return json({
        data: (inst?.segments ?? []).map((s) => ({
          id: s.id,
          type: 'analyticsReportSegments',
          attributes: { url: `https://files.test/${s.id}`, checksum: s.checksum ?? md5Hex(s.body), sizeInBytes: s.body.length },
        })),
      })
    }
    return json({ errors: [{ code: 'NOT_FOUND' }] }, 404)
  }

  private allSegments() {
    return this.requests.flatMap((r) => r.reports).flatMap((r) => r.instances).flatMap((i) => i.segments)
  }
}

export function testKeyPem(): string {
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })
  return privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
}

export function fakeClient(apple: FakeApple): AscClient {
  return new AscClient(
    { issuerId: 'issuer-test', keyId: 'KEYTEST123', privateKey: testKeyPem() },
    { fetch: apple.fetch, sleep: async () => undefined, maxAttempts: 3 },
  )
}

// ── In-memory store mirroring the Postgres semantics ─────────────────────────

interface Fact extends DownloadRow {
  app_id: string
  report_variant: string
  granularity: string
  processing_date: string
  segment_id: string
}

export interface FunnelEventFixture {
  day: string
  site: 'blackwater' | 'spawnos'
  event: string
  from_blackwater?: boolean
  is_test?: boolean
  paid?: boolean
  app_store_ct?: string
}

export class MemoryStore implements AcquisitionStore {
  segments = new Map<string, { status: string; checksum: string | null; meta: SegmentMeta; error?: string }>()
  facts: Fact[] = []
  state = new Map<string, SyncState>()
  runs = new Map<string, RunRecord & RunPatch>()
  alerts: Array<{ id: number; kind: string; dedupeKey: string; dates: string[]; status: string; attempts: number; subject: string }> = []
  alertDates = new Map<string, number>()
  funnel: FunnelEventFixture[] = []
  lockOwner: string | null = null

  private blankState(appId: string): SyncState {
    return {
      app_id: appId, last_attempt_at: null, last_success_at: null, latest_available_processing_date: null,
      latest_imported_processing_date: null, latest_complete_report_date: null, latest_report_date_with_data: null,
      consecutive_failures: 0, last_error_code: null, last_error: null, last_failure_alert_at: null,
    }
  }

  async acquireLock(_appId: string, owner: string) {
    if (this.lockOwner && this.lockOwner !== owner) return false
    this.lockOwner = owner
    return true
  }
  async releaseLock(_appId: string, owner: string) {
    if (this.lockOwner === owner) this.lockOwner = null
  }
  async startRun(run: RunRecord) {
    this.runs.set(run.run_id, { ...run })
  }
  async finishRun(runId: string, patch: RunPatch) {
    this.runs.set(runId, { ...(this.runs.get(runId) as RunRecord & RunPatch), ...patch })
  }
  async getImportedSegment(id: string) {
    const s = this.segments.get(id)
    return s ? { status: s.status, checksum: s.checksum } : null
  }
  async applyDownloadSegment(meta: SegmentMeta, rows: DownloadRow[]): Promise<ApplySegmentResult> {
    this.segments.set(meta.segment_id, { status: 'imported', checksum: meta.checksum, meta })
    const applied: string[] = []
    const superseded: string[] = []
    let inserted = 0
    for (const date of [...new Set(rows.map((r) => r.report_date))].sort()) {
      const scope = (f: Fact) =>
        f.app_id === meta.app_id && f.report_variant === meta.report_variant && f.granularity === meta.granularity && f.report_date === date
      const existing = this.facts.filter(scope).map((f) => f.processing_date).sort().pop()
      if (existing && existing > meta.processing_date) {
        superseded.push(date)
        continue
      }
      this.facts = this.facts.filter((f) => !scope(f))
      for (const r of rows.filter((x) => x.report_date === date)) {
        this.facts.push({ ...r, app_id: meta.app_id, report_variant: meta.report_variant, granularity: meta.granularity, processing_date: meta.processing_date, segment_id: meta.segment_id })
        inserted++
      }
      applied.push(date)
    }
    return { rowsInserted: inserted, datesApplied: applied, datesSuperseded: superseded }
  }
  async recordSegmentFailure(meta: SegmentMeta, error: string) {
    if (this.segments.get(meta.segment_id)?.status === 'imported') return
    this.segments.set(meta.segment_id, { status: 'failed', checksum: meta.checksum, meta, error })
  }
  async latestImportedProcessingDate(appId: string) {
    const dates = [...this.segments.values()]
      .filter((s) => s.status === 'imported' && s.meta.app_id === appId && s.meta.report_variant === 'standard' && s.meta.granularity === 'DAILY')
      .map((s) => s.meta.processing_date)
      .sort()
    return dates.pop() ?? null
  }
  async getSyncState(appId: string) {
    return this.state.get(appId) ?? null
  }
  async recordSuccess(appId: string, patch: Partial<SyncState>) {
    this.state.set(appId, {
      ...(this.state.get(appId) ?? this.blankState(appId)),
      ...patch,
      last_success_at: new Date().toISOString(),
      consecutive_failures: 0,
      last_error_code: null,
      last_error: null,
    })
  }
  async recordFailure(appId: string, code: SyncErrorCode, message: string, patch: Partial<SyncState> = {}) {
    const cur = this.state.get(appId) ?? this.blankState(appId)
    const next = { ...cur, ...patch, consecutive_failures: cur.consecutive_failures + 1, last_error_code: code, last_error: message }
    this.state.set(appId, next)
    return next
  }
  private rows(appId: string, variant: string, dates: (d: string) => boolean) {
    return this.facts.filter((f) => f.app_id === appId && f.report_variant === variant && f.granularity === 'DAILY' && dates(f.report_date))
  }
  async getDailyDownloads(appId: string, from: string, to: string) {
    return dailyFromFacts(this.rows(appId, 'standard', (d) => d >= from && d <= to))
  }
  async getTerritories(appId: string, dates: string[]) {
    return sumByLabel(this.rows(appId, 'standard', (d) => dates.includes(d)), (r) => r.territory || 'Unknown')
  }
  async getSourceTypes(appId: string, dates: string[]) {
    return sumByLabel(this.rows(appId, 'standard', (d) => dates.includes(d)), (r) => r.source_type || 'Unavailable')
  }
  async getCampaigns(appId: string, dates: string[]) {
    return sumByLabel(this.rows(appId, 'detailed', (d) => dates.includes(d)).filter((r) => r.campaign !== ''), (r) => r.campaign)
  }
  async getFunnelCounts(from: string, to: string): Promise<FunnelCounts> {
    const e = this.funnel.filter((x) => !x.is_test && x.day >= from && x.day <= to)
    const count = (f: (x: FunnelEventFixture) => boolean) => e.filter(f).length
    const store = e.filter((x) => (x.site === 'blackwater' && x.event === 'spawnos_appstore_click') || (x.site === 'spawnos' && x.event === 'spawnos_app_store_click'))
    const byCampaign: Record<string, number> = {}
    for (const s of store) if (s.app_store_ct) byCampaign[s.app_store_ct] = (byCampaign[s.app_store_ct] ?? 0) + 1
    return {
      bwImpressions: count((x) => x.site === 'blackwater' && x.event === 'spawnos_impression'),
      bwToSpawnosClicks: count((x) => x.site === 'blackwater' && x.event === 'spawnos_cta_click'),
      bwAppStoreClicks: count((x) => x.site === 'blackwater' && x.event === 'spawnos_appstore_click'),
      spawnosArrivalsFromBw: count((x) => x.site === 'spawnos' && x.event === 'blackwater_to_spawnos_click'),
      spawnosAppStoreClicks: count((x) => x.site === 'spawnos' && x.event === 'spawnos_app_store_click'),
      spawnosAppStoreClicksFromBw: count((x) => x.site === 'spawnos' && x.event === 'spawnos_app_store_click' && Boolean(x.from_blackwater)),
      paidAppStoreClicks: store.filter((x) => x.paid).length,
      appStoreClicksByCampaign: byCampaign,
    }
  }
  async claimAcquisitionAlert(appId: string, dates: string[], _recipient: string, subject: string): Promise<ClaimResult> {
    const exhausted = (d: string) => this.alerts.some((a) => a.status === 'failed' && a.attempts >= 5 && a.dates.includes(d))
    const claimable = [...dates].sort().filter((d) => !this.alertDates.has(`${appId}:${d}`) && !exhausted(d))
    if (!claimable.length) return { alertId: null, dedupeKey: null, dates: [] }
    const dedupeKey = `acquisition:${appId}:${claimable.join(',')}`
    let alert = this.alerts.find((a) => a.dedupeKey === dedupeKey)
    if (alert) {
      alert.attempts++
      alert.status = 'sending'
    } else {
      alert = { id: this.alerts.length + 1, kind: 'acquisition', dedupeKey, dates: claimable, status: 'sending', attempts: 1, subject }
      this.alerts.push(alert)
    }
    for (const d of claimable) this.alertDates.set(`${appId}:${d}`, alert.id)
    return { alertId: alert.id, dedupeKey, dates: claimable }
  }
  async markAlertSent(alertId: number) {
    const a = this.alerts.find((x) => x.id === alertId)
    if (a) a.status = 'sent'
  }
  async failAcquisitionAlert(alertId: number) {
    for (const [k, v] of this.alertDates) if (v === alertId) this.alertDates.delete(k)
    const a = this.alerts.find((x) => x.id === alertId)
    if (a) a.status = 'failed'
  }
  failureAlertAt: number | null = null
  nowMs = () => Date.now()
  async claimFailureAlert(appId: string, minFailures: number, cooldownHours: number) {
    const s = this.state.get(appId)
    if (!s || s.consecutive_failures < minFailures) return false
    if (this.failureAlertAt !== null && this.nowMs() - this.failureAlertAt < cooldownHours * 3_600_000) return false
    this.failureAlertAt = this.nowMs()
    return true
  }
  loggedAlerts: Array<{ kind: string; status: string; subject: string }> = []
  async logAlert(entry: { kind: string; status: string; subject: string }) {
    this.loggedAlerts.push({ kind: entry.kind, status: entry.status, subject: entry.subject })
  }
  async purgeClickIds() {
    return 0
  }
}

// ── Fake mailer ──────────────────────────────────────────────────────────────

export class FakeMailer implements Mailer {
  sent: OutgoingEmail[] = []
  failNext = 0
  async send(email: OutgoingEmail) {
    if (this.failNext > 0) {
      this.failNext--
      throw new Error('Resend responded 503: temporarily unavailable')
    }
    this.sent.push(email)
    return { id: `email-${this.sent.length}` }
  }
}
