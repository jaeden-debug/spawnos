import { notFound } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/Card'
import { appStoreAppId, APP_STORE_CONNECT_URL, ascCredentialsFromEnv } from '@/lib/acquisition/config'
import { longDate, territoryName } from '@/lib/acquisition/email'
import { SupabaseAcquisitionStore } from '@/lib/acquisition/store'
import { addDays, datesInRange } from '@/lib/acquisition/sync'
import type { DimensionCount, FunnelCounts } from '@/lib/acquisition/types'
import { FOUNDER_EMAIL } from '@/lib/spawnos-app-ai'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Founder-only acquisition view: Apple's aggregate App Store downloads next to
 * our own Blackwater → SpawnOS → App Store funnel.
 *
 * Not linked from the breeder sidebar. Anyone but the founder gets a 404.
 * Everything shown is aggregate; nothing identifies a downloader.
 */

export const metadata = { title: 'Acquisition', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const pct = (num: number, den: number) => (den > 0 ? `${Math.round((num / den) * 1000) / 10}%` : '—')

function DimensionList({ items, empty, label }: { items: DimensionCount[]; empty: string; label?: (s: string) => string }) {
  if (!items.length) return <p className="text-sm text-spawn-muted-text">{empty}</p>
  return (
    <ul className="space-y-1.5 text-sm">
      {items.slice(0, 8).map((d) => (
        <li key={d.label} className="flex items-center justify-between gap-4">
          <span className="text-spawn-text truncate">{label ? label(d.label) : d.label}</span>
          <span className="text-spawn-muted-text tabular-nums shrink-0">
            {d.first_time_downloads} first-time · {d.redownloads} re
          </span>
        </li>
      ))}
    </ul>
  )
}

function FunnelRows({ f }: { f: FunnelCounts }) {
  const bwClicks = f.bwToSpawnosClicks + f.bwAppStoreClicks
  const rows: Array<[string, string | number, string?]> = [
    ['Blackwater SpawnOS CTA impressions', f.bwImpressions],
    ['Blackwater CTA clicks', bwClicks, `${f.bwToSpawnosClicks} to spawnos.ca · ${f.bwAppStoreClicks} straight to App Store`],
    ['Blackwater CTA CTR', pct(bwClicks, f.bwImpressions), 'CTA clicks ÷ CTA impressions'],
    ['Arrivals on spawnos.ca from Blackwater', f.spawnosArrivalsFromBw, 'once per browser session'],
    ['spawnos.ca → App Store clicks', f.spawnosAppStoreClicks, `${f.spawnosAppStoreClicksFromBw} in sessions from Blackwater`],
    ['App Store continuation (Blackwater visits)', pct(f.spawnosAppStoreClicksFromBw, f.spawnosArrivalsFromBw), 'App Store clicks ÷ arrivals from Blackwater'],
    ['All App Store clicks', f.bwAppStoreClicks + f.spawnosAppStoreClicks, `${f.paidAppStoreClicks} from Google Ads visits`],
  ]
  return (
    <dl className="divide-y divide-spawn-border/60 text-sm">
      {rows.map(([k, v, note]) => (
        <div key={k} className="flex items-start justify-between gap-4 py-2">
          <dt className="text-spawn-text">
            {k}
            {note && <span className="block text-xs text-spawn-muted-text">{note}</span>}
          </dt>
          <dd className="font-semibold text-spawn-text tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export default async function AcquisitionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.email?.toLowerCase() !== FOUNDER_EMAIL) notFound()

  const appId = appStoreAppId()
  const store = new SupabaseAcquisitionStore(createAdminClient())
  const admin = createAdminClient()

  const [state, lastRunRes] = await Promise.all([
    store.getSyncState(appId),
    admin
      .from('app_store_sync_runs')
      .select('status, started_at, email_outcome, error_code')
      .eq('app_id', appId)
      .order('started_at', { ascending: false })
      .limit(5),
  ])
  const runs = (lastRunRes.data ?? []) as Array<{ status: string; started_at: string; email_outcome: string | null; error_code: string | null }>

  const today = new Date().toISOString().slice(0, 10)
  const latest = state?.latest_complete_report_date ?? null
  // Apple windows end at the newest COMPLETE report date; our funnel is shown
  // for the same UTC days so the two columns describe the same period.
  const end = latest ?? today
  const from7 = addDays(end, -6)
  const from30 = addDays(end, -29)
  const days30 = datesInRange(from30, end)

  const [daily30, funnel7, funnel30, territories, sources, campaigns] = await Promise.all([
    store.getDailyDownloads(appId, from30, end),
    store.getFunnelCounts(from7, end),
    store.getFunnelCounts(from30, end),
    store.getTerritories(appId, days30),
    store.getSourceTypes(appId, days30),
    store.getCampaigns(appId, days30),
  ])
  const sum = (from: string, key: 'first_time_downloads' | 'redownloads') =>
    daily30.filter((d) => d.report_date >= from).reduce((s, d) => s + d[key], 0)

  const configured = Boolean(ascCredentialsFromEnv())

  return (
    <DashboardShell user={user} pageTitle="Acquisition">
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-black text-spawn-text">App Store acquisition</h1>
          <p className="text-sm text-spawn-muted-text mt-1">
            Apple&apos;s numbers are aggregate, delayed (download data is complete about 2 days after the fact) and
            never identify who downloaded. Our funnel counts are first-party, test traffic excluded.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Last Apple sync"
            value={state?.last_success_at ? longDate(state.last_success_at) : configured ? 'Not yet' : 'Not configured'}
            sub={state?.consecutive_failures ? `${state.consecutive_failures} failed run(s) since: ${state.last_error_code}` : undefined}
            accent={state?.consecutive_failures ? 'rose' : 'cyan'}
          />
          <StatCard
            label="Latest complete Apple report"
            value={latest ? longDate(latest) : 'None yet'}
            sub={state?.latest_available_processing_date ? `Newest instance processed ${longDate(state.latest_available_processing_date)}` : undefined}
          />
          <StatCard
            label="Apple data window"
            value={latest ? `${longDate(from30).replace(/, \d{4}$/, '')} – ${longDate(end).replace(/, \d{4}$/, '')}` : '—'}
            sub="30 Apple report days"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="7d first-time downloads" value={latest ? sum(from7, 'first_time_downloads') : '—'} sub="Apple, standard report" accent="emerald" />
          <StatCard label="7d redownloads" value={latest ? sum(from7, 'redownloads') : '—'} sub="Apple" />
          <StatCard label="7d App Store clicks" value={funnel7.bwAppStoreClicks + funnel7.spawnosAppStoreClicks} sub="ours, both sites" accent="amber" />
          <StatCard label="30d first-time downloads" value={latest ? sum(from30, 'first_time_downloads') : '—'} sub="Apple, standard report" accent="emerald" />
          <StatCard label="30d App Store clicks" value={funnel30.bwAppStoreClicks + funnel30.spawnosAppStoreClicks} sub="ours, both sites" accent="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="font-bold text-spawn-text">Blackwater → SpawnOS funnel (7 days)</h2>
              <p className="text-xs text-spawn-muted-text mt-1">Directly measured on our sites. Same UTC days as the Apple window.</p>
            </CardHeader>
            <CardBody>
              <FunnelRows f={funnel7} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-bold text-spawn-text">Blackwater → SpawnOS funnel (30 days)</h2>
              <p className="text-xs text-spawn-muted-text mt-1">No install rate is shown: Apple&apos;s downloads cannot be tied to these clicks.</p>
            </CardHeader>
            <CardBody>
              <FunnelRows f={funnel30} />
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <h2 className="font-bold text-spawn-text">Top territories (30d)</h2>
              <p className="text-xs text-spawn-muted-text mt-1">Apple standard report</p>
            </CardHeader>
            <CardBody>
              <DimensionList items={territories} empty="No downloads reported yet." label={territoryName} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-bold text-spawn-text">Acquisition sources (30d)</h2>
              <p className="text-xs text-spawn-muted-text mt-1">Apple source type, standard report</p>
            </CardHeader>
            <CardBody>
              <DimensionList items={sources} empty="No downloads reported yet." />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-bold text-spawn-text">Campaign links (30d)</h2>
              <p className="text-xs text-spawn-muted-text mt-1">
                Apple detailed report: rows under 5 users omitted, values noised about ±2. Estimates, not exact attribution.
              </p>
            </CardHeader>
            <CardBody>
              <DimensionList items={campaigns} empty="None reported (normal below ~5 first-time downloads per campaign)." />
              {Object.keys(funnel30.appStoreClicksByCampaign).length > 0 && (
                <p className="text-xs text-spawn-muted-text mt-3">
                  Our clicks by campaign link:{' '}
                  {Object.entries(funnel30.appStoreClicksByCampaign)
                    .map(([k, v]) => `${k} ${v}`)
                    .join(' · ')}
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="font-bold text-spawn-text">Recent sync runs</h2>
          </CardHeader>
          <CardBody>
            {runs.length ? (
              <ul className="text-sm space-y-1">
                {runs.map((r) => (
                  <li key={r.started_at} className="flex flex-wrap gap-x-4 text-spawn-muted-text">
                    <span className="text-spawn-text tabular-nums">{r.started_at.replace('T', ' ').slice(0, 16)} UTC</span>
                    <span>{r.status}</span>
                    {r.email_outcome && <span>email: {r.email_outcome}</span>}
                    {r.error_code && <span className="text-rose-400">{r.error_code}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-spawn-muted-text">No runs recorded yet.</p>
            )}
            <a
              href={APP_STORE_CONNECT_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex mt-4 px-4 py-2 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm"
            >
              View App Store Analytics
            </a>
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  )
}
