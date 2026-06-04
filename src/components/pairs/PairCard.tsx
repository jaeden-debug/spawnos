import Link from 'next/link'
import type { Database } from '@/types/database'
import { StatusBadge } from '@/components/ui/Badge'
import { scoreColor } from '@/lib/utils'

type PairRow = Database['public']['Tables']['pairs']['Row']

interface PairWithFish extends PairRow {
  male?: { name: string; tail_type: string | null; color_base: string | null } | null
  female?: { name: string; tail_type: string | null; color_base: string | null } | null
}

interface PairCardProps {
  pair: PairWithFish
}

export default function PairCard({ pair }: PairCardProps) {
  return (
    <Link href={`/dashboard/pairs/${pair.id}`}>
      <div className="glass-card rounded-2xl border border-spawn-border hover-card p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-spawn-text">{pair.pair_name ?? 'Unnamed Pair'}</h3>
          <StatusBadge status={pair.status} />
        </div>

        {/* Fish names */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-1 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-medium">
            ♂ {pair.male?.name ?? 'Unknown'}
          </span>
          <span className="text-spawn-muted text-xs">×</span>
          <span className="text-xs px-2 py-1 rounded-lg bg-rose-400/10 border border-rose-400/20 text-rose-400 font-medium">
            ♀ {pair.female?.name ?? 'Unknown'}
          </span>
        </div>

        {/* Compatibility score */}
        {pair.compatibility_score !== null && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-spawn-muted-text">Compatibility</span>
              <span className={`font-mono font-semibold ${scoreColor(pair.compatibility_score)}`}>
                {pair.compatibility_score}/100
              </span>
            </div>
            <div className="score-bar">
              <div
                className={`score-bar-fill ${
                  pair.compatibility_score >= 70 ? 'bg-emerald-400' :
                  pair.compatibility_score >= 50 ? 'bg-cyan-400' :
                  pair.compatibility_score >= 35 ? 'bg-amber-400' : 'bg-rose-400'
                }`}
                style={{ width: `${pair.compatibility_score}%` }}
              />
            </div>
          </div>
        )}

        {pair.goal && (
          <p className="text-xs text-spawn-muted-text mt-3 truncate">
            Goal: {pair.goal}
          </p>
        )}
      </div>
    </Link>
  )
}
