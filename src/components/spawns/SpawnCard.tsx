import type { Database } from '@/types/database'
import { formatDate, stageLabel } from '@/lib/utils'

type SpawnRow = Database['public']['Tables']['spawns']['Row']

interface SpawnCardProps {
  spawn: SpawnRow & {
    pair?: { pair_name: string | null; male?: { name: string } | null; female?: { name: string } | null } | null
  }
  onClick?: () => void
}

export default function SpawnCard({ spawn, onClick }: SpawnCardProps) {
  const pairLabel = spawn.pair?.pair_name ?? `${spawn.pair?.male?.name ?? '?'} × ${spawn.pair?.female?.name ?? '?'}`

  const survivalColor =
    spawn.survival_rate === null ? 'text-spawn-muted-text' :
    spawn.survival_rate >= 70 ? 'text-emerald-400' :
    spawn.survival_rate >= 40 ? 'text-amber-400' : 'text-rose-400'

  return (
    <div
      className="glass-card rounded-2xl border border-spawn-border hover-card p-5 cursor-pointer"
      onClick={onClick}
    >
      {/* Stage badge + pair */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-bold text-spawn-text text-sm mb-0.5 truncate">{pairLabel}</div>
          {spawn.spawn_date && (
            <div className="text-xs text-spawn-muted-text">Spawned {formatDate(spawn.spawn_date)}</div>
          )}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 shrink-0 ml-2">
          {stageLabel(spawn.stage)}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-spawn-surface rounded-xl p-2.5 border border-spawn-border text-center">
          <div className="text-lg font-black text-spawn-text">{spawn.estimated_eggs ?? '—'}</div>
          <div className="text-[10px] text-spawn-muted-text">Eggs</div>
        </div>
        <div className="bg-spawn-surface rounded-xl p-2.5 border border-spawn-border text-center">
          <div className="text-lg font-black text-spawn-text">{spawn.current_fry_count ?? '—'}</div>
          <div className="text-[10px] text-spawn-muted-text">Fry</div>
        </div>
        <div className="bg-spawn-surface rounded-xl p-2.5 border border-spawn-border text-center">
          <div className={`text-lg font-black ${survivalColor}`}>
            {spawn.survival_rate !== null ? `${spawn.survival_rate.toFixed(0)}%` : '—'}
          </div>
          <div className="text-[10px] text-spawn-muted-text">Survival</div>
        </div>
      </div>
    </div>
  )
}
