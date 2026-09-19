import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ApplySegmentResult,
  DailyDownloads,
  DimensionCount,
  DownloadRow,
  FunnelCounts,
  SegmentMeta,
  SyncErrorCode,
  SyncState,
  SyncStatus,
  SyncTrigger,
} from './types'

/**
 * Persistence boundary for acquisition reporting.
 *
 * The sync orchestrator only talks to this interface, so its behaviour
 * (idempotency, dedupe, failure accounting) is unit-tested against an
 * in-memory implementation, while the atomic parts live in Postgres functions
 * (see supabase/migrations/20260919151000_app_store_acquisition.sql).
 */
export interface RunRecord {
  run_id: string
  app_id: string
  trigger: SyncTrigger
  status: SyncStatus
}

export interface RunPatch {
  status: SyncStatus
  segments_seen?: number
  segments_imported?: number
  segments_skipped?: number
  segments_failed?: number
  rows_imported?: number
  dates_applied?: string[]
  error_code?: SyncErrorCode | null
  error?: string | null
  email_outcome?: string | null
  details?: Record<string, unknown>
}

export interface ClaimResult {
  alertId: number | null
  dedupeKey: string | null
  dates: string[]
}

export interface AcquisitionStore {
  acquireLock(appId: string, owner: string, ttlSeconds: number): Promise<boolean>
  releaseLock(appId: string, owner: string): Promise<void>
  startRun(run: RunRecord): Promise<void>
  finishRun(runId: string, patch: RunPatch): Promise<void>

  getImportedSegment(segmentId: string): Promise<{ status: string; checksum: string | null } | null>
  applyDownloadSegment(meta: SegmentMeta, rows: DownloadRow[]): Promise<ApplySegmentResult>
  recordSegmentFailure(meta: SegmentMeta, error: string): Promise<void>
  /** Newest processing date among successfully imported STANDARD DAILY segments. */
  latestImportedProcessingDate(appId: string): Promise<string | null>

  getSyncState(appId: string): Promise<SyncState | null>
  recordSuccess(appId: string, patch: Partial<SyncState>): Promise<void>
  /** Increments consecutive_failures; `patch` still records whatever progress was made. */
  recordFailure(appId: string, code: SyncErrorCode, message: string, patch?: Partial<SyncState>): Promise<SyncState>

  getDailyDownloads(appId: string, from: string, to: string): Promise<DailyDownloads[]>
  getTerritories(appId: string, dates: string[]): Promise<DimensionCount[]>
  getSourceTypes(appId: string, dates: string[]): Promise<DimensionCount[]>
  getCampaigns(appId: string, dates: string[]): Promise<DimensionCount[]>
  getFunnelCounts(from: string, to: string): Promise<FunnelCounts>

  claimAcquisitionAlert(appId: string, dates: string[], recipient: string, subject: string): Promise<ClaimResult>
  markAlertSent(alertId: number, providerId: string | null): Promise<void>
  failAcquisitionAlert(alertId: number, error: string): Promise<void>
  claimFailureAlert(appId: string, minFailures: number, cooldownHours: number): Promise<boolean>
  logAlert(entry: {
    appId: string
    kind: 'sync_failure' | 'test'
    dedupeKey: string
    recipient: string
    subject: string
    status: 'sent' | 'failed'
    providerId?: string | null
    error?: string | null
  }): Promise<void>

  purgeClickIds(): Promise<number>
}

// ── helpers ──────────────────────────────────────────────────────────────────

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0) || 0)

interface FactRow {
  report_date: string
  download_type: string
  source_type: string
  source_info: string
  campaign: string
  territory: string
  counts: number
}

export function sumByLabel(rows: FactRow[], label: (r: FactRow) => string): DimensionCount[] {
  const map = new Map<string, DimensionCount>()
  for (const r of rows) {
    const key = label(r)
    const entry = map.get(key) ?? { label: key, first_time_downloads: 0, redownloads: 0 }
    const type = r.download_type.toLowerCase()
    if (type === 'first-time download') entry.first_time_downloads += r.counts
    else if (type === 'redownload') entry.redownloads += r.counts
    map.set(key, entry)
  }
  return [...map.values()]
    .filter((d) => d.first_time_downloads > 0 || d.redownloads > 0)
    .sort((a, b) => b.first_time_downloads - a.first_time_downloads || b.redownloads - a.redownloads || a.label.localeCompare(b.label))
}

export function dailyFromFacts(rows: FactRow[]): DailyDownloads[] {
  const map = new Map<string, DailyDownloads>()
  for (const r of rows) {
    const d = map.get(r.report_date) ?? { report_date: r.report_date, first_time_downloads: 0, redownloads: 0, total_downloads: 0 }
    const type = r.download_type.toLowerCase()
    if (type === 'first-time download') d.first_time_downloads += r.counts
    else if (type === 'redownload') d.redownloads += r.counts
    d.total_downloads = d.first_time_downloads + d.redownloads
    map.set(r.report_date, d)
  }
  return [...map.values()].sort((a, b) => a.report_date.localeCompare(b.report_date))
}

export function funnelFromJson(json: Record<string, unknown> | null | undefined): FunnelCounts {
  const j = json ?? {}
  const byCampaign: Record<string, number> = {}
  const raw = (j.app_store_clicks_by_campaign ?? {}) as Record<string, unknown>
  for (const [k, v] of Object.entries(raw)) byCampaign[k] = num(v)
  return {
    bwImpressions: num(j.bw_impressions),
    bwToSpawnosClicks: num(j.bw_to_spawnos_clicks),
    bwAppStoreClicks: num(j.bw_app_store_clicks),
    spawnosArrivalsFromBw: num(j.spawnos_arrivals_from_bw),
    spawnosAppStoreClicks: num(j.spawnos_app_store_clicks),
    spawnosAppStoreClicksFromBw: num(j.spawnos_app_store_clicks_from_bw),
    paidAppStoreClicks: num(j.paid_app_store_clicks),
    appStoreClicksByCampaign: byCampaign,
  }
}

// ── Supabase implementation ─────────────────────────────────────────────────

export class SupabaseAcquisitionStore implements AcquisitionStore {
  constructor(private readonly db: SupabaseClient) {}

  private async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.db.rpc(fn, args)
    if (error) throw new Error(`${fn}: ${error.message}`)
    return data as T
  }

  async acquireLock(appId: string, owner: string, ttlSeconds: number) {
    return this.rpc<boolean>('app_store_acquire_sync_lock', { p_app_id: appId, p_owner: owner, p_ttl_seconds: ttlSeconds })
  }

  async releaseLock(appId: string, owner: string) {
    await this.rpc('app_store_release_sync_lock', { p_app_id: appId, p_owner: owner })
  }

  async startRun(run: RunRecord) {
    const { error } = await this.db.from('app_store_sync_runs').insert(run)
    if (error) throw new Error(`startRun: ${error.message}`)
  }

  async finishRun(runId: string, patch: RunPatch) {
    const { error } = await this.db
      .from('app_store_sync_runs')
      .update({ ...patch, finished_at: new Date().toISOString() })
      .eq('run_id', runId)
    if (error) throw new Error(`finishRun: ${error.message}`)
  }

  async getImportedSegment(segmentId: string) {
    const { data, error } = await this.db
      .from('app_store_report_segments')
      .select('status, checksum')
      .eq('segment_id', segmentId)
      .maybeSingle()
    if (error) throw new Error(`getImportedSegment: ${error.message}`)
    return data ?? null
  }

  async applyDownloadSegment(meta: SegmentMeta, rows: DownloadRow[]): Promise<ApplySegmentResult> {
    const res = await this.rpc<{ rows_inserted: number; dates_applied: string[]; dates_superseded: string[] }>(
      'app_store_apply_download_segment',
      { p_segment: meta, p_rows: rows },
    )
    return {
      rowsInserted: num(res.rows_inserted),
      datesApplied: res.dates_applied ?? [],
      datesSuperseded: res.dates_superseded ?? [],
    }
  }

  async recordSegmentFailure(meta: SegmentMeta, error: string) {
    // Never downgrade a previously imported segment to failed.
    const existing = await this.getImportedSegment(meta.segment_id)
    if (existing?.status === 'imported') return
    const { error: dbError } = await this.db.from('app_store_report_segments').upsert(
      { ...meta, status: 'failed', error: error.slice(0, 1000), updated_at: new Date().toISOString() },
      { onConflict: 'segment_id' },
    )
    if (dbError) throw new Error(`recordSegmentFailure: ${dbError.message}`)
  }

  async latestImportedProcessingDate(appId: string) {
    const { data, error } = await this.db
      .from('app_store_report_segments')
      .select('processing_date')
      .eq('app_id', appId)
      .eq('status', 'imported')
      .eq('report_variant', 'standard')
      .eq('granularity', 'DAILY')
      .order('processing_date', { ascending: false })
      .limit(1)
    if (error) throw new Error(`latestImportedProcessingDate: ${error.message}`)
    return (data?.[0]?.processing_date as string | undefined) ?? null
  }

  async getSyncState(appId: string) {
    const { data, error } = await this.db.from('app_store_sync_state').select('*').eq('app_id', appId).maybeSingle()
    if (error) throw new Error(`getSyncState: ${error.message}`)
    return (data as SyncState | null) ?? null
  }

  async recordSuccess(appId: string, patch: Partial<SyncState>) {
    const { error } = await this.db.from('app_store_sync_state').upsert(
      {
        app_id: appId,
        ...patch,
        last_success_at: new Date().toISOString(),
        consecutive_failures: 0,
        last_error_code: null,
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'app_id' },
    )
    if (error) throw new Error(`recordSuccess: ${error.message}`)
  }

  async recordFailure(appId: string, code: SyncErrorCode, message: string, patch: Partial<SyncState> = {}): Promise<SyncState> {
    const current = await this.getSyncState(appId)
    const next = (current?.consecutive_failures ?? 0) + 1
    const { data, error } = await this.db
      .from('app_store_sync_state')
      .upsert(
        {
          app_id: appId,
          ...patch,
          consecutive_failures: next,
          last_error_code: code,
          last_error: message.slice(0, 1000),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'app_id' },
      )
      .select('*')
      .single()
    if (error) throw new Error(`recordFailure: ${error.message}`)
    return data as SyncState
  }

  /** `range` is either an inclusive [from, to] pair or an explicit list of dates. */
  private async facts(
    appId: string,
    variant: 'standard' | 'detailed',
    range: { from: string; to: string } | { dates: string[] },
  ): Promise<FactRow[]> {
    const out: FactRow[] = []
    if ('dates' in range && range.dates.length === 0) return out
    const pageSize = 1000
    for (let offset = 0; offset < 50_000; offset += pageSize) {
      let query = this.db
        .from('app_store_download_facts')
        .select('report_date, download_type, source_type, source_info, campaign, territory, counts')
        .eq('app_id', appId)
        .eq('report_variant', variant)
        .eq('granularity', 'DAILY')
      query = 'dates' in range ? query.in('report_date', range.dates) : query.gte('report_date', range.from).lte('report_date', range.to)
      const { data, error } = await query.order('id').range(offset, offset + pageSize - 1)
      if (error) throw new Error(`facts: ${error.message}`)
      out.push(...((data ?? []) as FactRow[]))
      if (!data || data.length < pageSize) break
    }
    return out
  }

  async getDailyDownloads(appId: string, from: string, to: string) {
    return dailyFromFacts(await this.facts(appId, 'standard', { from, to }))
  }

  async getTerritories(appId: string, dates: string[]) {
    return sumByLabel(await this.facts(appId, 'standard', { dates }), (r) => r.territory || 'Unknown')
  }

  async getSourceTypes(appId: string, dates: string[]) {
    return sumByLabel(await this.facts(appId, 'standard', { dates }), (r) => r.source_type || 'Unavailable')
  }

  async getCampaigns(appId: string, dates: string[]) {
    return sumByLabel(
      (await this.facts(appId, 'detailed', { dates })).filter((r) => r.campaign !== ''),
      (r) => r.campaign,
    )
  }

  async getFunnelCounts(from: string, to: string) {
    return funnelFromJson(await this.rpc<Record<string, unknown>>('funnel_counts', { p_from: from, p_to: to }))
  }

  async claimAcquisitionAlert(appId: string, dates: string[], recipient: string, subject: string): Promise<ClaimResult> {
    const res = await this.rpc<{ alert_id: number | null; dedupe_key?: string; dates: string[] }>(
      'app_store_claim_acquisition_alert',
      { p_app_id: appId, p_dates: dates, p_recipient: recipient, p_subject: subject },
    )
    return { alertId: res.alert_id ?? null, dedupeKey: res.dedupe_key ?? null, dates: res.dates ?? [] }
  }

  async markAlertSent(alertId: number, providerId: string | null) {
    const { error } = await this.db
      .from('app_store_alerts')
      .update({ status: 'sent', provider_id: providerId, sent_at: new Date().toISOString(), error: null })
      .eq('id', alertId)
    if (error) throw new Error(`markAlertSent: ${error.message}`)
  }

  async failAcquisitionAlert(alertId: number, error: string) {
    await this.rpc('app_store_fail_acquisition_alert', { p_alert_id: alertId, p_error: error })
  }

  async claimFailureAlert(appId: string, minFailures: number, cooldownHours: number) {
    return this.rpc<boolean>('app_store_claim_failure_alert', {
      p_app_id: appId,
      p_min_failures: minFailures,
      p_cooldown_hours: cooldownHours,
    })
  }

  async logAlert(entry: Parameters<AcquisitionStore['logAlert']>[0]) {
    const { error } = await this.db.from('app_store_alerts').insert({
      app_id: entry.appId,
      kind: entry.kind,
      dedupe_key: entry.dedupeKey,
      recipient: entry.recipient,
      subject: entry.subject,
      status: entry.status,
      provider_id: entry.providerId ?? null,
      error: entry.error ?? null,
      sent_at: entry.status === 'sent' ? new Date().toISOString() : null,
    })
    if (error) throw new Error(`logAlert: ${error.message}`)
  }

  async purgeClickIds() {
    return this.rpc<number>('purge_funnel_click_ids', {})
  }
}
