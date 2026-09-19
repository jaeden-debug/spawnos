import { APP_STORE_CONNECT_URL } from './config'
import type { DailyDownloads, DimensionCount, FunnelCounts, SyncErrorCode } from './types'

/**
 * Email rendering + delivery for App Store acquisition reporting.
 *
 * Wording rules (deliberate):
 *   - Apple's metric is "First-time downloads". Say that, not "installs" or
 *     "users", and always pair a number with the Apple report DATE it belongs
 *     to — never "today".
 *   - Never offer to show who downloaded. Apple provides no identities.
 *   - Our funnel counts sit NEXT to Apple's numbers for the same UTC day(s);
 *     they are never presented as the cause of a specific download.
 */

// ── delivery ────────────────────────────────────────────────────────────────

export interface OutgoingEmail {
  to: string
  from: string
  subject: string
  text: string
  html: string
  /** Provider-side dedupe (Resend honours it for 24h). */
  idempotencyKey?: string
}

export interface Mailer {
  send(email: OutgoingEmail): Promise<{ id: string | null }>
}

export class MailerError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message)
    this.name = 'MailerError'
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

/** Resend is the project's existing transactional provider (RESEND_API_KEY). */
export class ResendMailer implements Mailer {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: FetchLike = (i, init) => fetch(i, init),
  ) {}

  async send(email: OutgoingEmail) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
    if (email.idempotencyKey) headers['Idempotency-Key'] = email.idempotencyKey.slice(0, 256)
    const res = await this.fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({ from: email.from, to: [email.to], subject: email.subject, text: email.text, html: email.html }),
    })
    const body = await res.text()
    if (!res.ok) throw new MailerError(`Resend responded ${res.status}: ${body.slice(0, 200)}`, res.status)
    try {
      return { id: (JSON.parse(body) as { id?: string }).id ?? null }
    } catch {
      return { id: null }
    }
  }
}

// ── formatting helpers ──────────────────────────────────────────────────────

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return { y, m, d }
}

/** "September 17, 2026" */
export function longDate(iso: string): string {
  const { y, m, d } = parts(iso)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

/** "Sep 17" / "Sep 16–17" / "Aug 31 – Sep 2" (always with year at the end of subjects). */
export function dateSpan(dates: string[]): string {
  const sorted = [...dates].sort()
  const a = parts(sorted[0])
  const b = parts(sorted[sorted.length - 1])
  if (sorted.length === 1 || sorted[0] === sorted[sorted.length - 1]) return `${SHORT[a.m - 1]} ${a.d}`
  if (a.y === b.y && a.m === b.m) return `${SHORT[a.m - 1]} ${a.d}–${b.d}`
  return `${SHORT[a.m - 1]} ${a.d} – ${SHORT[b.m - 1]} ${b.d}`
}

let regionNames: Intl.DisplayNames | null = null
export function territoryName(value: string): string {
  const v = value.trim()
  if (/^[A-Z]{2}$/.test(v)) {
    try {
      regionNames ??= new Intl.DisplayNames(['en'], { type: 'region' })
      return regionNames.of(v) ?? v
    } catch {
      return v
    }
  }
  return v || 'Unknown'
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

// ── acquisition email ───────────────────────────────────────────────────────

export interface AcquisitionEmailData {
  /** Apple standard-report totals for each newly announced date (first_time_downloads > 0). */
  days: DailyDownloads[]
  territories: DimensionCount[]
  sourceTypes: DimensionCount[]
  /** Detailed-report campaign rows (thresholded + noised by Apple). */
  campaigns: DimensionCount[]
  /** Our funnel over the same UTC day(s), test traffic excluded. */
  funnel: FunnelCounts
  test?: boolean
}

export function acquisitionSubject(data: Pick<AcquisitionEmailData, 'days' | 'test'>): string {
  const firstTime = data.days.reduce((s, d) => s + d.first_time_downloads, 0)
  const year = parts([...data.days.map((d) => d.report_date)].sort().slice(-1)[0]).y
  const subject = `SpawnOS — Apple reported ${plural(firstTime, 'first-time download', 'first-time downloads')} for ${dateSpan(data.days.map((d) => d.report_date))}, ${year}`
  return data.test ? `TEST — ${subject}` : subject
}

export function buildAcquisitionEmail(data: AcquisitionEmailData): { subject: string; text: string; html: string } {
  const subject = acquisitionSubject(data)
  const firstTime = data.days.reduce((s, d) => s + d.first_time_downloads, 0)
  const redownloads = data.days.reduce((s, d) => s + d.redownloads, 0)
  const f = data.funnel
  const appStoreClicks = f.bwAppStoreClicks + f.spawnosAppStoreClicks
  const campaignClicks = Object.entries(f.appStoreClicksByCampaign).sort((a, b) => b[1] - a[1])
  const dateLines = data.days.map((d) => `${longDate(d.report_date)}: ${d.first_time_downloads} first-time, ${d.redownloads} redownloads`)

  const lines: string[] = []
  if (data.test) lines.push('TEST EMAIL — sample data, not a real Apple report.', '')
  lines.push('SpawnOS App Store Report', '')
  lines.push('Apple reported:')
  lines.push(`First-time downloads: ${firstTime}`)
  lines.push(`Redownloads: ${redownloads}`, '')
  lines.push(data.days.length === 1 ? 'Reporting date:' : 'Reporting dates:')
  if (data.days.length === 1) lines.push(longDate(data.days[0].report_date))
  else lines.push(...dateLines)
  lines.push('(Apple report date, UTC. Apple finalizes download data within about 2 days, so this is not today.)', '')

  lines.push('Territories:')
  if (data.territories.length) {
    for (const t of data.territories) lines.push(`${territoryName(t.label)}: ${t.first_time_downloads}`)
  } else lines.push('Not reported')
  lines.push('')

  lines.push('Acquisition (Apple source type):')
  if (data.sourceTypes.length) {
    for (const s of data.sourceTypes) lines.push(`${s.label}: ${s.first_time_downloads}`)
  } else lines.push('Not reported')
  lines.push('')

  lines.push('Campaigns (Apple campaign links, Detailed report):')
  if (data.campaigns.length) {
    for (const c of data.campaigns) lines.push(`${c.label}: ${c.first_time_downloads}`)
  } else lines.push('None reported. Apple omits campaign rows from fewer than 5 users.')
  lines.push('Apple thresholds and noises campaign data (about ±2), so treat these as estimates.', '')

  lines.push('Our funnel, same UTC day(s). Aggregate only, not linked to individual downloads:')
  lines.push(`Blackwater SpawnOS CTA impressions: ${f.bwImpressions}`)
  lines.push(`Blackwater → SpawnOS clicks: ${f.bwToSpawnosClicks}`)
  lines.push(`Blackwater → App Store clicks: ${f.bwAppStoreClicks}`)
  lines.push(`spawnos.ca → App Store clicks: ${f.spawnosAppStoreClicks} (${f.spawnosAppStoreClicksFromBw} from Blackwater visits)`)
  lines.push(`App Store clicks, total: ${appStoreClicks} (${f.paidAppStoreClicks} from Google Ads)`)
  if (campaignClicks.length) {
    lines.push(`App Store clicks by campaign link: ${campaignClicks.map(([k, v]) => `${k} ${v}`).join(', ')}`)
  }
  lines.push('')
  lines.push(`Apple-attributed first-time downloads (campaign links): ${data.campaigns.reduce((s, c) => s + c.first_time_downloads, 0)}`)
  lines.push('')
  lines.push('VIEW APP STORE ANALYTICS')
  lines.push(`${APP_STORE_CONNECT_URL}  (Apps → SpawnOS → Analytics)`)
  lines.push('')
  lines.push('Apple reports aggregate counts only. It never identifies who downloaded.')

  const row = (label: string, value: string | number) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#475569">${escapeHtml(label)}</td><td style="padding:4px 0;font-weight:600;color:#0f172a;text-align:right">${escapeHtml(String(value))}</td></tr>`
  const table = (rows: string) => `<table role="presentation" style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table>`
  const section = (title: string, body: string, note?: string) =>
    `<h3 style="margin:22px 0 6px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#0e7490">${escapeHtml(title)}</h3>${body}${note ? `<p style="margin:6px 0 0;font-size:12px;color:#64748b">${escapeHtml(note)}</p>` : ''}`
  const listOrNone = (items: DimensionCount[], label: (d: DimensionCount) => string, none: string) =>
    items.length ? table(items.map((d) => row(label(d), d.first_time_downloads)).join('')) : `<p style="margin:0;font-size:14px;color:#64748b">${escapeHtml(none)}</p>`

  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#ffffff;border-radius:14px;padding:28px 24px;border:1px solid #e2e8f0">
${data.test ? '<p style="margin:0 0 16px;padding:8px 12px;background:#fef3c7;border-radius:8px;font-size:13px;color:#92400e"><strong>TEST EMAIL</strong>: sample data, not a real Apple report.</p>' : ''}
<p style="margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#0e7490">SpawnOS App Store Report</p>
<h1 style="margin:8px 0 4px;font-size:22px;color:#0f172a">Apple reported ${escapeHtml(plural(firstTime, 'first-time download', 'first-time downloads'))}</h1>
<p style="margin:0;font-size:14px;color:#475569">${data.days.length === 1 ? `For ${escapeHtml(longDate(data.days[0].report_date))}` : `For ${escapeHtml(dateSpan(data.days.map((d) => d.report_date)))}`} (Apple report date, UTC)</p>
${section('Apple reported', table(row('First-time downloads', firstTime) + row('Redownloads', redownloads) + (data.days.length > 1 ? data.days.map((d) => row(longDate(d.report_date), `${d.first_time_downloads} first-time`)).join('') : '')), 'Apple finalizes download data within about 2 days. This is not today\'s count.')}
${section('Territories', listOrNone(data.territories, (d) => territoryName(d.label), 'Not reported'))}
${section('Acquisition (Apple source type)', listOrNone(data.sourceTypes, (d) => d.label, 'Not reported'))}
${section('Campaigns (Apple campaign links)', listOrNone(data.campaigns, (d) => d.label, 'None reported. Apple omits campaign rows from fewer than 5 users.'), 'From Apple\'s Detailed report, which is thresholded and noised (about ±2). Treat as estimates.')}
${section('Our funnel, same UTC day(s)', table(
    row('Blackwater SpawnOS CTA impressions', f.bwImpressions) +
      row('Blackwater → SpawnOS clicks', f.bwToSpawnosClicks) +
      row('Blackwater → App Store clicks', f.bwAppStoreClicks) +
      row('spawnos.ca → App Store clicks', `${f.spawnosAppStoreClicks} (${f.spawnosAppStoreClicksFromBw} from Blackwater)`) +
      row('App Store clicks from Google Ads', f.paidAppStoreClicks),
  ), 'Aggregate counts from our own sites. Not linked to individual Apple downloads.')}
<p style="margin:26px 0 8px;text-align:center"><a href="${APP_STORE_CONNECT_URL}" style="display:inline-block;padding:13px 22px;background:#0e7490;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:.06em">VIEW APP STORE ANALYTICS</a></p>
<p style="margin:0;text-align:center;font-size:12px;color:#64748b">App Store Connect → Apps → SpawnOS → Analytics</p>
</div>
<p style="margin:14px 0 0;text-align:center;font-size:11px;color:#94a3b8">Apple reports aggregate counts only and never identifies who downloaded. Sent only when Apple reports new first-time downloads.</p>
</div></body></html>`

  return { subject, text: lines.join('\n'), html }
}

// ── operational failure email ───────────────────────────────────────────────

const FAILURE_EXPLANATIONS: Partial<Record<SyncErrorCode, string>> = {
  auth: 'Apple rejected the App Store Connect API key (authentication failed). The key may have been revoked, or APP_STORE_CONNECT_ISSUER_ID / KEY_ID / PRIVATE_KEY may be wrong.',
  forbidden: 'The App Store Connect API key lacks permission. Reading Analytics Reports needs the Sales and Reports, Finance or Admin role.',
  request_stopped: 'Apple stopped the ongoing Analytics Report request (inactivity), or it no longer exists. An Admin must create a new ONGOING request.',
  report_stale: 'Apple has not published a new App Downloads report for several days.',
  unavailable: 'Apple\'s App Store Connect API was unavailable.',
  rate_limited: 'Apple rate-limited the App Store Connect API.',
  network: 'The App Store Connect API could not be reached.',
  checksum_mismatch: 'An Apple report file failed its checksum (incomplete or corrupt download).',
  incomplete_report: 'An Apple report file was incomplete or in an unexpected format.',
  not_found: 'Apple returned "not found" for the SpawnOS analytics reports.',
  store: 'Saving the Apple report to the SpawnOS database failed.',
}

export interface FailureEmailData {
  lastSuccessAt: string | null
  latestReportDate: string | null
  errorCode: SyncErrorCode
  errorMessage: string
  consecutiveFailures: number
  test?: boolean
}

export function buildFailureEmail(data: FailureEmailData): { subject: string; text: string; html: string } {
  const subject = `${data.test ? 'TEST — ' : ''}SpawnOS App Store Reporting Failed`
  const explanation = FAILURE_EXPLANATIONS[data.errorCode] ?? 'The App Store sync failed.'
  const lastSuccess = data.lastSuccessAt ? longDate(data.lastSuccessAt) : 'Never'
  const latest = data.latestReportDate ? longDate(data.latestReportDate) : 'None yet'
  const lines = [
    ...(data.test ? ['TEST EMAIL — no real failure occurred.', ''] : []),
    'SpawnOS App Store Reporting Failed',
    '',
    'Last successful sync:',
    lastSuccess,
    '',
    'Latest complete Apple report date:',
    latest,
    '',
    'Failure:',
    explanation,
    `Detail: ${data.errorMessage.slice(0, 300)}`,
    '',
    `Consecutive failed runs: ${data.consecutiveFailures}`,
    '',
    'Until this is fixed, the absence of download emails does NOT mean zero downloads.',
    'This alert repeats at most once every 3 days while the problem persists.',
  ]
  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px 16px"><div style="background:#ffffff;border-radius:14px;padding:28px 24px;border:1px solid #fecaca">
${data.test ? '<p style="margin:0 0 16px;padding:8px 12px;background:#fef3c7;border-radius:8px;font-size:13px;color:#92400e"><strong>TEST EMAIL</strong>: no real failure occurred.</p>' : ''}
<h1 style="margin:0 0 14px;font-size:20px;color:#991b1b">SpawnOS App Store Reporting Failed</h1>
<p style="margin:0 0 4px;font-size:13px;color:#64748b">Last successful sync</p><p style="margin:0 0 12px;font-size:15px;color:#0f172a">${escapeHtml(lastSuccess)}</p>
<p style="margin:0 0 4px;font-size:13px;color:#64748b">Latest complete Apple report date</p><p style="margin:0 0 12px;font-size:15px;color:#0f172a">${escapeHtml(latest)}</p>
<p style="margin:0 0 4px;font-size:13px;color:#64748b">Failure</p><p style="margin:0 0 6px;font-size:15px;color:#0f172a">${escapeHtml(explanation)}</p>
<p style="margin:0 0 12px;font-size:12px;color:#64748b">${escapeHtml(data.errorMessage.slice(0, 300))}</p>
<p style="margin:0;font-size:13px;color:#0f172a">Consecutive failed runs: <strong>${data.consecutiveFailures}</strong></p>
<p style="margin:16px 0 0;font-size:13px;color:#991b1b">Until this is fixed, no download email does <strong>not</strong> mean zero downloads.</p>
<p style="margin:8px 0 0;font-size:12px;color:#64748b">This alert repeats at most once every 3 days while the problem persists.</p>
</div></div></body></html>`
  return { subject, text: lines.join('\n'), html }
}
