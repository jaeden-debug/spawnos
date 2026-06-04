import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import { StatCard } from '@/components/ui/Card'
import Link from 'next/link'
import { formatDate, slugToLabel, stageLabel } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Parallel data fetching
  const [fishRes, pairsRes, spawnsRes, logsRes] = await Promise.all([
    supabase.from('fish').select('id, name, status, updated_at').eq('user_id', user!.id),
    supabase.from('pairs').select('id, pair_name, status, compatibility_score, male_id, female_id').eq('user_id', user!.id),
    supabase.from('spawns').select('id, stage, current_fry_count, survival_rate, pair_id, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('spawn_logs').select('id, log_date, notes, fry_count, spawn_id').eq('user_id', user!.id).order('log_date', { ascending: false }).limit(5),
  ])

  const fish = (fishRes.data as any[]) ?? []
  const pairs = (pairsRes.data as any[]) ?? []
  const spawns = (spawnsRes.data as any[]) ?? []
  const recentLogs = (logsRes.data as any[]) ?? []

  const activeFish = fish.filter((f) => f.status === 'active').length
  const activePairs = pairs.filter((p) => p.status === 'active' || p.status === 'planned').length
  const activeSpawns = spawns.filter((s) => s.stage !== 'sold').length

  const survivals = spawns.filter((s) => s.survival_rate !== null).map((s) => s.survival_rate as number)
  const avgSurvival = survivals.length > 0
    ? (survivals.reduce((a, b) => a + b, 0) / survivals.length).toFixed(1)
    : null

  const bestPair = [...pairs]
    .filter((p) => p.compatibility_score !== null)
    .sort((a, b) => (b.compatibility_score as number) - (a.compatibility_score as number))[0]

  // Fish needing updates (not updated in 14+ days)
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const needingUpdate = fish.filter((f) => new Date(f.updated_at) < twoWeeksAgo && f.status === 'active')

  return (
    <DashboardShell user={user} pageTitle="Dashboard Overview">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-spawn-text">
            Welcome back{user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ''}
          </h1>
          <p className="text-spawn-muted-text text-sm mt-1">Here&apos;s what&apos;s happening with your breeding operation.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Fish" value={activeFish} sub={`${fish.length} total`} accent="cyan" />
          <StatCard label="Active Pairs" value={activePairs} sub={`${pairs.length} total`} accent="amber" />
          <StatCard label="Active Spawns" value={activeSpawns} sub={`${spawns.length} total`} accent="emerald" />
          <StatCard
            label="Avg Survival Rate"
            value={avgSurvival ? `${avgSurvival}%` : '—'}
            sub={`Across ${spawns.length} spawn${spawns.length === 1 ? '' : 's'}`}
            accent={avgSurvival && parseFloat(avgSurvival) >= 70 ? 'emerald' : avgSurvival ? 'amber' : 'cyan'}
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Best pair */}
          <div className="glass-card rounded-2xl border border-spawn-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-spawn-text">Best Pair</h3>
              <Link href="/dashboard/pairs" className="text-xs text-spawn-cyan hover:text-spawn-cyan-dim transition-colors">
                View All →
              </Link>
            </div>
            {bestPair ? (
              <Link href={`/dashboard/pairs/${bestPair.id}`} className="block">
                <div className="p-4 rounded-xl bg-spawn-surface border border-spawn-border hover:border-spawn-cyan/30 transition-colors">
                  <div className="font-bold text-spawn-text mb-1">
                    {bestPair.pair_name ?? 'Unnamed Pair'}
                  </div>
                  <div className="text-sm text-spawn-muted-text mb-3">
                    {bestPair.status.charAt(0).toUpperCase() + bestPair.status.slice(1)}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-spawn-muted-text">Compatibility</span>
                      <span className="text-spawn-cyan font-mono">{bestPair.compatibility_score}/100</span>
                    </div>
                    <div className="score-bar">
                      <div
                        className="score-bar-fill bg-spawn-cyan"
                        style={{ width: `${bestPair.compatibility_score ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="text-center py-8">
                <div className="text-spawn-muted text-xs mb-3">No pairs yet</div>
                <Link
                  href="/dashboard/pairs"
                  className="text-xs text-spawn-cyan hover:text-spawn-cyan-dim transition-colors"
                >
                  Create your first pair →
                </Link>
              </div>
            )}
          </div>

          {/* Recent spawn logs */}
          <div className="glass-card rounded-2xl border border-spawn-border p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-spawn-text">Recent Spawn Logs</h3>
              <Link href="/dashboard/spawns" className="text-xs text-spawn-cyan hover:text-spawn-cyan-dim transition-colors">
                View All →
              </Link>
            </div>
            {recentLogs.length > 0 ? (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex gap-3 p-3 rounded-xl bg-spawn-surface border border-spawn-border">
                    <span className="text-spawn-cyan font-mono text-xs shrink-0 mt-0.5">
                      {formatDate(log.log_date)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-spawn-muted-text truncate">
                        {log.notes ?? 'No note added'}
                      </p>
                      {log.fry_count !== null && (
                        <p className="text-xs text-spawn-text mt-0.5">
                          {log.fry_count} fry counted
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-spawn-muted text-xs mb-3">No spawn logs yet</div>
                <Link href="/dashboard/spawns" className="text-xs text-spawn-cyan hover:text-spawn-cyan-dim transition-colors">
                  Create your first spawn →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Active spawns */}
        {spawns.length > 0 && (
          <div className="glass-card rounded-2xl border border-spawn-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-spawn-text">Active Spawns</h3>
              <Link href="/dashboard/spawns" className="text-xs text-spawn-cyan hover:text-spawn-cyan-dim transition-colors">
                Manage →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {spawns.filter((s) => s.stage !== 'sold').slice(0, 6).map((spawn) => (
                <Link key={spawn.id} href={`/dashboard/spawns`}>
                  <div className="p-4 rounded-xl bg-spawn-surface border border-spawn-border hover:border-spawn-cyan/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-medium">
                        {stageLabel(spawn.stage)}
                      </span>
                      {spawn.survival_rate !== null && (
                        <span className="text-xs text-spawn-muted-text font-mono">
                          {spawn.survival_rate.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-spawn-muted-text">
                      {spawn.current_fry_count !== null ? `${spawn.current_fry_count} fry` : 'Tracking'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Fish needing updates */}
        {needingUpdate.length > 0 && (
          <div className="glass-card rounded-2xl border border-amber-400/20 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-amber-400 text-xs">⚠</span>
              <h3 className="text-sm font-semibold text-spawn-text">Fish Needing Updates</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                {needingUpdate.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {needingUpdate.map((f) => (
                <Link
                  key={f.id}
                  href={`/dashboard/fish/${f.id}`}
                  className="px-3 py-1.5 rounded-lg bg-spawn-surface border border-spawn-border text-spawn-muted-text text-xs hover:border-spawn-cyan/30 hover:text-spawn-text transition-colors"
                >
                  {f.name}
                  <span className="text-spawn-muted ml-2">{formatDate(f.updated_at)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h3 className="text-sm font-semibold text-spawn-text mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/dashboard/fish', icon: '🐟', label: 'Add Fish', desc: 'Register a new fish' },
              { href: '/dashboard/pairs', icon: '⚡', label: 'Create Pair', desc: 'Build a breeding pair' },
              { href: '/dashboard/spawns', icon: '📋', label: 'Log Spawn', desc: 'Track a spawn' },
              { href: '/dashboard/calculators', icon: '🧬', label: 'Trait Calculator', desc: 'Predict genetics' },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="glass-card rounded-2xl p-4 border border-spawn-border hover-card">
                  <div className="text-2xl mb-2">{action.icon}</div>
                  <div className="font-semibold text-spawn-text text-sm">{action.label}</div>
                  <div className="text-xs text-spawn-muted-text mt-0.5">{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
