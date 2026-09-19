import type { AscClient } from './asc-client'
import type { AccessType, Granularity, ReportVariant } from './types'

/**
 * Report discovery for the App Store Connect Analytics Reports API:
 *
 *   apps/{id}/analyticsReportRequests → analyticsReportRequests/{id}/reports
 *   → analyticsReports/{id}/instances → analyticsReportInstances/{id}/segments
 *
 * Report names are matched at runtime (Apple's docs only name one report
 * explicitly). For SpawnOS, the live API lists "App Downloads Standard" and
 * "App Downloads Detailed" under the COMMERCE category (verified 2026-09-19).
 */

export interface ReportRequest {
  id: string
  accessType: AccessType
  stoppedDueToInactivity: boolean
}

export interface AnalyticsReport {
  id: string
  name: string
  category: string
}

export interface ReportInstance {
  id: string
  granularity: Granularity
  processingDate: string
}

export interface ReportSegment {
  id: string
  url: string
  checksum: string | null
  sizeInBytes: number | null
}

export async function listReportRequests(client: AscClient, appId: string): Promise<ReportRequest[]> {
  const rows = await client.getAll<{ accessType?: string; stoppedDueToInactivity?: boolean }>(
    `/v1/apps/${encodeURIComponent(appId)}/analyticsReportRequests?limit=50`,
  )
  return rows
    .filter((r) => r.attributes.accessType === 'ONGOING' || r.attributes.accessType === 'ONE_TIME_SNAPSHOT')
    .map((r) => ({
      id: r.id,
      accessType: r.attributes.accessType as AccessType,
      stoppedDueToInactivity: r.attributes.stoppedDueToInactivity === true,
    }))
}

export async function listCommerceReports(client: AscClient, requestId: string): Promise<AnalyticsReport[]> {
  const rows = await client.getAll<{ name?: string; category?: string }>(
    `/v1/analyticsReportRequests/${encodeURIComponent(requestId)}/reports?filter[category]=COMMERCE&limit=200`,
  )
  return rows.map((r) => ({ id: r.id, name: r.attributes.name ?? '', category: r.attributes.category ?? '' }))
}

/** Picks the Standard and Detailed "App Downloads" reports out of a request's report list. */
export function pickDownloadReports(reports: AnalyticsReport[]): Partial<Record<ReportVariant, AnalyticsReport>> {
  const out: Partial<Record<ReportVariant, AnalyticsReport>> = {}
  for (const report of reports) {
    const name = report.name.toLowerCase()
    if (!/\bdownloads?\b/.test(name) || !name.includes('app')) continue
    // Guard against look-alikes such as "Streaming Downloads Performance".
    if (name.includes('performance') || name.includes('streaming')) continue
    if (name.includes('detailed')) out.detailed ??= report
    else if (name.includes('standard')) out.standard ??= report
  }
  return out
}

export async function listInstances(
  client: AscClient,
  reportId: string,
  granularity: Granularity = 'DAILY',
): Promise<ReportInstance[]> {
  const rows = await client.getAll<{ granularity?: string; processingDate?: string }>(
    `/v1/analyticsReports/${encodeURIComponent(reportId)}/instances?filter[granularity]=${granularity}&limit=200`,
  )
  return rows
    .filter((r) => typeof r.attributes.processingDate === 'string')
    .map((r) => ({
      id: r.id,
      granularity: (r.attributes.granularity as Granularity) ?? granularity,
      processingDate: String(r.attributes.processingDate).slice(0, 10),
    }))
    .sort((a, b) => a.processingDate.localeCompare(b.processingDate))
}

export async function listSegments(client: AscClient, instanceId: string): Promise<ReportSegment[]> {
  const rows = await client.getAll<{ url?: string; checksum?: string; sizeInBytes?: number }>(
    `/v1/analyticsReportInstances/${encodeURIComponent(instanceId)}/segments?limit=200`,
  )
  return rows
    .filter((r) => typeof r.attributes.url === 'string')
    .map((r) => ({
      id: r.id,
      url: r.attributes.url as string,
      checksum: r.attributes.checksum ?? null,
      sizeInBytes: typeof r.attributes.sizeInBytes === 'number' ? r.attributes.sizeInBytes : null,
    }))
}
