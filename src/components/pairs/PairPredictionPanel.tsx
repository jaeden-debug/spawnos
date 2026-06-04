'use client'

import type { Fish } from '@/types/fish'
import type { PredictionOutput } from '@/types/genetics'
import { predictPairing } from '@/lib/genetics/predictionEngine'
import { useMemo } from 'react'
import { scoreColor, scoreBg } from '@/lib/utils'

interface PairPredictionPanelProps {
  male: Fish
  female: Fish
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 70 ? 'bg-emerald-400' :
    value >= 50 ? 'bg-cyan-400' :
    value >= 35 ? 'bg-amber-400' : 'bg-rose-400'

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-spawn-muted-text">{label}</span>
        <span className={`font-mono font-semibold ${scoreColor(value)}`}>{value}/100</span>
      </div>
      <div className="score-bar">
        <div className={`score-bar-fill ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function PairPredictionPanel({ male, female }: PairPredictionPanelProps) {
  const prediction: PredictionOutput = useMemo(() => predictPairing(male, female), [male, female])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest">Zylx.ai Prediction</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
          Powered by Zylx
        </span>
      </div>

      {/* Score bars */}
      <div className="space-y-3">
        <ScoreBar label="Compatibility Score" value={prediction.compatibilityScore} />
        <ScoreBar label="Predictability" value={prediction.predictabilityScore} />
        <ScoreBar label="Rare Trait Chance" value={prediction.rareTraitChance} />
        <ScoreBar label="High Value Potential" value={prediction.highValuePotential} />
      </div>

      {/* Breeder recommendation */}
      <div className="p-4 rounded-xl bg-spawn-surface border border-spawn-border">
        <div className="text-xs text-spawn-cyan font-medium mb-1.5">Breeder Recommendation</div>
        <p className="text-xs text-spawn-muted-text leading-relaxed">{prediction.breederRecommendation}</p>
      </div>

      {/* Warnings */}
      {prediction.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/20">
          <div className="text-xs text-amber-400 font-medium mb-2">⚠ Warnings</div>
          <ul className="space-y-1.5">
            {prediction.warnings.map((w, i) => (
              <li key={i} className="text-xs text-spawn-muted-text flex gap-2">
                <span className="text-amber-400 shrink-0">•</span> {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Likely outcomes */}
      {prediction.likelyOutcomes.length > 0 && (
        <div>
          <div className="text-xs text-spawn-muted-text uppercase tracking-wider mb-2">Likely Outcomes</div>
          <ul className="space-y-1.5">
            {prediction.likelyOutcomes.map((o, i) => (
              <li key={i} className="text-xs text-spawn-muted-text flex gap-2">
                <span className="text-spawn-cyan shrink-0">→</span> {o}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rare outcomes */}
      {prediction.rareOutcomes.length > 0 && (
        <div>
          <div className="text-xs text-amber-400 uppercase tracking-wider mb-2">⭐ Rare Outcomes</div>
          <ul className="space-y-1.5">
            {prediction.rareOutcomes.map((o, i) => (
              <li key={i} className="text-xs text-amber-400 flex gap-2">
                <span className="shrink-0">✦</span> {o}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selection tips */}
      {prediction.selectionTips.length > 0 && (
        <div>
          <div className="text-xs text-spawn-muted-text uppercase tracking-wider mb-2">Selection Tips</div>
          <ul className="space-y-1.5">
            {prediction.selectionTips.map((t, i) => (
              <li key={i} className="text-xs text-spawn-muted-text flex gap-2">
                <span className="text-emerald-400 shrink-0">✓</span> {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cull watch */}
      {prediction.cullWatchNotes.length > 0 && (
        <div>
          <div className="text-xs text-rose-400 uppercase tracking-wider mb-2">Cull Watch</div>
          <ul className="space-y-1.5">
            {prediction.cullWatchNotes.map((c, i) => (
              <li key={i} className="text-xs text-spawn-muted-text flex gap-2">
                <span className="text-rose-400 shrink-0">!</span> {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Holdback advice */}
      <div className="p-4 rounded-xl bg-cyan-400/5 border border-cyan-400/20">
        <div className="text-xs text-spawn-cyan font-medium mb-1.5">Holdback Advice</div>
        <p className="text-xs text-spawn-muted-text leading-relaxed">{prediction.holdbackAdvice}</p>
      </div>
    </div>
  )
}
