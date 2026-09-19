/**
 * Shared types for App Store acquisition reporting.
 *
 * Everything here describes AGGREGATED counts Apple publishes in its App Store
 * Connect Analytics Reports. There is no per-user or per-device data anywhere
 * in this module, by design and because Apple does not provide any.
 */

export type AccessType = 'ONGOING' | 'ONE_TIME_SNAPSHOT'
export type Granularity = 'DAILY' | 'WEEKLY' | 'MONTHLY'

/**
 * Apple ships each report at two content levels:
 *   standard — no sensitive dimensions (no Source Info / Campaign / Page Title)
 *   detailed — every dimension, but privacy-thresholded (<5 users omitted)
 *              and noised (~±2) by Apple
 */
export type ReportVariant = 'standard' | 'detailed'

/** One normalized, aggregated row of an Apple "App Downloads" report. */
export interface DownloadRow {
  /** Apple's `Date` column, YYYY-MM-DD. The day the downloads happened. */
  report_date: string
  /** Lower-cased Apple value, e.g. 'first-time download', 'redownload'. */
  download_type: string
  source_type: string
  source_info: string
  /** Apple campaign token (`ct`). Only present in the detailed report. */
  campaign: string
  page_type: string
  page_title: string
  territory: string
  device: string
  platform_version: string
  app_version: string
  pre_order: string
  counts: number
}

/** Identifies one downloadable file segment and where it came from. */
export interface SegmentMeta {
  segment_id: string
  app_id: string
  request_id: string
  access_type: AccessType
  report_id: string
  report_name: string
  report_variant: ReportVariant
  instance_id: string
  granularity: Granularity
  /** YYYY-MM-DD — the day Apple generated the instance. */
  processing_date: string
  checksum: string | null
  size_bytes: number | null
}

export interface ApplySegmentResult {
  rowsInserted: number
  datesApplied: string[]
  datesSuperseded: string[]
}

export type SyncTrigger = 'cron' | 'manual' | 'backfill' | 'test'

export type SyncStatus =
  | 'running'
  | 'success'
  | 'partial'
  | 'failed'
  | 'not_configured'
  | 'skipped_locked'

export type SyncErrorCode =
  | 'not_configured'
  | 'auth'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'unavailable'
  | 'network'
  | 'bad_response'
  | 'checksum_mismatch'
  | 'incomplete_report'
  | 'request_stopped'
  | 'report_stale'
  | 'store'
  | 'unknown'

export interface SyncState {
  app_id: string
  last_attempt_at: string | null
  last_success_at: string | null
  latest_available_processing_date: string | null
  latest_imported_processing_date: string | null
  latest_complete_report_date: string | null
  latest_report_date_with_data: string | null
  consecutive_failures: number
  last_error_code: string | null
  last_error: string | null
  last_failure_alert_at: string | null
}

/** Apple-reported totals for one report date (standard report, DAILY). */
export interface DailyDownloads {
  report_date: string
  first_time_downloads: number
  redownloads: number
  total_downloads: number
}

export interface DimensionCount {
  label: string
  first_time_downloads: number
  redownloads: number
}

/**
 * First-party funnel counts over a UTC day range, test traffic excluded.
 * These are OUR events; they are never joined to Apple's downloads.
 */
export interface FunnelCounts {
  /** Blackwater: SpawnOS CTA unit was at least half visible. */
  bwImpressions: number
  /** Blackwater: "learn more" click toward spawnos.ca. */
  bwToSpawnosClicks: number
  /** Blackwater: App Store badge clicked directly on Blackwater. */
  bwAppStoreClicks: number
  /** spawnos.ca: sessions that arrived from Blackwater (once per session). */
  spawnosArrivalsFromBw: number
  /** spawnos.ca: App Store clicks, any origin. */
  spawnosAppStoreClicks: number
  /** spawnos.ca: App Store clicks in sessions that came from Blackwater. */
  spawnosAppStoreClicksFromBw: number
  /** App Store clicks (both sites) whose visit carried a Google Ads click id or paid UTM. */
  paidAppStoreClicks: number
  /** App Store clicks (both sites) that used an Apple campaign link, by ct. */
  appStoreClicksByCampaign: Record<string, number>
}
