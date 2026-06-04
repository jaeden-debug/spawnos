'use client'

import { useState } from 'react'
import { calculateValuePotential } from '@/lib/genetics/scoringEngine'
import type { Fish } from '@/types/fish'
import { TAIL_TYPE_OPTIONS, BASE_COLOR_OPTIONS, PATTERN_TYPE_OPTIONS, SCALE_TYPE_OPTIONS } from '@/types/fish'
import type { ValuePotentialOutput } from '@/types/genetics'
import { TierBadge } from '@/components/ui/Badge'

export default function ValuePotentialCalculator() {
  const [fields, setFields] = useState<Record<string, string>>({
    name: '',
    tail_type: '',
    color_base: '',
    pattern_type: '',
    scale_type: '',
    finnage: '',
    body_type: '',
    health_score: '7',
  })
  const [result, setResult] = useState<ValuePotentialOutput | null>(null)

  function update(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  function handleCalculate() {
    const fish: Fish = {
      id: 'value-calc',
      user_id: 'calculator',
      name: fields.name || 'Test Fish',
      sex: 'male',
      species: 'betta',
      strain: null,
      tail_type: fields.tail_type as Fish['tail_type'] || null,
      color_base: fields.color_base as Fish['color_base'] || null,
      pattern_type: fields.pattern_type as Fish['pattern_type'] || null,
      scale_type: fields.scale_type as Fish['scale_type'] || null,
      finnage: fields.finnage as Fish['finnage'] || null,
      body_type: fields.body_type as Fish['body_type'] || null,
      eye_color: null,
      traits: { health_score: parseInt(fields.health_score) || 7 },
      genotype_notes: null,
      breeder_notes: null,
      rarity_score: null,
      estimated_value_range: null,
      photo_url: null,
      birth_date: null,
      acquired_date: null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setResult(calculateValuePotential(fish))
  }

  const inputClass = 'w-full px-3 py-2 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors appearance-none'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { key: 'tail_type', label: 'Tail Type', options: TAIL_TYPE_OPTIONS },
          { key: 'color_base', label: 'Base Color', options: BASE_COLOR_OPTIONS },
          { key: 'pattern_type', label: 'Pattern', options: PATTERN_TYPE_OPTIONS },
          { key: 'scale_type', label: 'Scale Type', options: SCALE_TYPE_OPTIONS },
          {
            key: 'finnage', label: 'Finnage Quality', options: [
              { value: 'low', label: 'Low' }, { value: 'average', label: 'Average' },
              { value: 'strong', label: 'Strong' }, { value: 'show-quality', label: 'Show Quality' },
            ],
          },
          {
            key: 'body_type', label: 'Body Quality', options: [
              { value: 'weak', label: 'Weak' }, { value: 'average', label: 'Average' },
              { value: 'strong', label: 'Strong' }, { value: 'show-quality', label: 'Show Quality' },
            ],
          },
        ].map(({ key, label, options }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1 uppercase tracking-wider">{label}</label>
            <select value={fields[key] ?? ''} onChange={(e) => update(key, e.target.value)} className={inputClass}>
              <option value="" className="bg-spawn-surface">Select...</option>
              {options.map((o) => <option key={o.value} value={o.value} className="bg-spawn-surface">{o.label}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-spawn-muted-text mb-1 uppercase tracking-wider">Health Score</label>
          <input type="number" min={1} max={10} value={fields.health_score} onChange={(e) => update('health_score', e.target.value)}
            className={inputClass} />
        </div>
      </div>

      <button onClick={handleCalculate} className="w-full py-3.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold hover:bg-spawn-cyan-dim transition-colors">
        Calculate Value Potential
      </button>

      {result && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <TierBadge tier={result.tier} />
            <span className="text-spawn-text font-bold">{result.score}/100</span>
          </div>
          <p className="text-sm text-spawn-muted-text leading-relaxed">{result.reasoning}</p>

          {result.bestSellingTraits.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/20">
              <div className="text-xs font-medium text-emerald-400 mb-2">Best Selling Traits</div>
              {result.bestSellingTraits.map((t, i) => (
                <p key={i} className="text-xs text-spawn-muted-text flex gap-2 mb-1"><span className="text-emerald-400">→</span> {t}</p>
              ))}
            </div>
          )}
          {result.holdbackTraits.length > 0 && (
            <div className="p-4 rounded-xl bg-cyan-400/5 border border-cyan-400/20">
              <div className="text-xs font-medium text-cyan-400 mb-2">Holdback Priorities</div>
              {result.holdbackTraits.map((t, i) => (
                <p key={i} className="text-xs text-spawn-muted-text flex gap-2 mb-1"><span className="text-cyan-400">→</span> {t}</p>
              ))}
            </div>
          )}
          {result.whatToLookFor.length > 0 && (
            <div>
              <div className="text-xs text-spawn-muted-text uppercase tracking-wider mb-2">What To Look For</div>
              {result.whatToLookFor.map((t, i) => (
                <p key={i} className="text-xs text-spawn-muted-text flex gap-2 mb-1"><span className="text-amber-400">→</span> {t}</p>
              ))}
            </div>
          )}
          {result.unstableTraits.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/20">
              <div className="text-xs font-medium text-amber-400 mb-2">⚠ Unstable Traits</div>
              {result.unstableTraits.map((t, i) => (
                <p key={i} className="text-xs text-spawn-muted-text flex gap-2 mb-1"><span className="text-amber-400">!</span> {t}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
