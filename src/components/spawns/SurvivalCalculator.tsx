'use client'

import { calculateSurvivalStats } from '@/lib/genetics/scoringEngine'
import { formatPercent } from '@/lib/utils'

interface SurvivalCalculatorProps {
  estimatedEggs: number
  estimatedHatched: number
  currentFryCount: number
  stage: string
}

export default function SurvivalCalculator({
  estimatedEggs,
  estimatedHatched,
  currentFryCount,
  stage,
}: SurvivalCalculatorProps) {
  const stats = calculateSurvivalStats(estimatedEggs, estimatedHatched, currentFryCount, stage)

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-spawn-surface rounded-xl p-3 border border-spawn-border">
          <div className="text-xs text-spawn-muted-text mb-1">Hatch Rate</div>
          <div className={`text-lg font-black ${stats.hatchRate >= 70 ? 'text-emerald-400' : stats.hatchRate >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
            {formatPercent(stats.hatchRate)}
          </div>
        </div>
        <div className="bg-spawn-surface rounded-xl p-3 border border-spawn-border">
          <div className="text-xs text-spawn-muted-text mb-1">Survival Rate</div>
          <div className={`text-lg font-black ${stats.survivalRate >= 70 ? 'text-emerald-400' : stats.survivalRate >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
            {estimatedHatched > 0 ? formatPercent(stats.survivalRate) : '—'}
          </div>
        </div>
        <div className="bg-spawn-surface rounded-xl p-3 border border-spawn-border">
          <div className="text-xs text-spawn-muted-text mb-1">Fry Lost</div>
          <div className={`text-lg font-black ${stats.lossCount === 0 ? 'text-emerald-400' : stats.lossCount < 20 ? 'text-amber-400' : 'text-rose-400'}`}>
            {estimatedHatched > 0 ? stats.lossCount : '—'}
          </div>
        </div>
        <div className="bg-spawn-surface rounded-xl p-3 border border-spawn-border">
          <div className="text-xs text-spawn-muted-text mb-1">Health Status</div>
          <div className={`text-lg font-black ${stats.isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
            {stats.isHealthy ? 'Good' : 'Watch'}
          </div>
        </div>
      </div>

      {/* Stage notes */}
      <div className="p-4 rounded-xl bg-spawn-surface border border-spawn-border">
        <div className="text-xs font-medium text-spawn-cyan mb-1.5">Stage Guidance</div>
        <p className="text-xs text-spawn-muted-text leading-relaxed">{stats.stageNotes}</p>
      </div>

      {/* Warnings */}
      {stats.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/20">
          <div className="text-xs font-medium text-amber-400 mb-2">⚠ Survival Warnings</div>
          <ul className="space-y-1.5">
            {stats.warnings.map((w, i) => (
              <li key={i} className="text-xs text-spawn-muted-text flex gap-2">
                <span className="text-amber-400 shrink-0">•</span> {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
