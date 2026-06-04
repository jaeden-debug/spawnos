'use client'

function scoreWidthClass(value: number) {
  if (value >= 95) return 'w-[95%]'
  if (value >= 90) return 'w-[90%]'
  if (value >= 85) return 'w-[85%]'
  if (value >= 80) return 'w-[80%]'
  if (value >= 75) return 'w-[75%]'
  if (value >= 70) return 'w-[70%]'
  if (value >= 65) return 'w-[65%]'
  if (value >= 60) return 'w-[60%]'
  if (value >= 55) return 'w-[55%]'
  if (value >= 50) return 'w-[50%]'
  if (value >= 45) return 'w-[45%]'
  if (value >= 40) return 'w-[40%]'
  if (value >= 35) return 'w-[35%]'
  if (value >= 30) return 'w-[30%]'
  if (value >= 25) return 'w-[25%]'
  if (value >= 20) return 'w-[20%]'
  if (value >= 15) return 'w-[15%]'
  if (value >= 10) return 'w-[10%]'
  if (value > 0) return 'w-[5%]'
  return 'w-0'
}

import { useState } from 'react'
import { predictPairing } from '@/lib/genetics/predictionEngine'
import type { Fish, AggressionLevel, FertilityConfidence } from '@/types/fish'
import {
  TAIL_TYPE_OPTIONS,
  BASE_COLOR_OPTIONS,
  PATTERN_TYPE_OPTIONS,
  SCALE_TYPE_OPTIONS,
} from '@/types/fish'
import { slugToLabel, scoreColor } from '@/lib/utils'
import type { PredictionOutput } from '@/types/genetics'

function scoreWidthClass(value: number) {
  if (value >= 95) return 'w-[95%]'
  if (value >= 90) return 'w-[90%]'
  if (value >= 85) return 'w-[85%]'
  if (value >= 80) return 'w-[80%]'
  if (value >= 75) return 'w-[75%]'
  if (value >= 70) return 'w-[70%]'
  if (value >= 65) return 'w-[65%]'
  if (value >= 60) return 'w-[60%]'
  if (value >= 55) return 'w-[55%]'
  if (value >= 50) return 'w-[50%]'
  if (value >= 45) return 'w-[45%]'
  if (value >= 40) return 'w-[40%]'
  if (value >= 35) return 'w-[35%]'
  if (value >= 30) return 'w-[30%]'
  if (value >= 25) return 'w-[25%]'
  if (value >= 20) return 'w-[20%]'
  if (value >= 15) return 'w-[15%]'
  if (value >= 10) return 'w-[10%]'
  if (value > 0) return 'w-[5%]'
  return 'w-0'
}



function buildFishFromFields(fields: Record<string, string>, sex: 'male' | 'female'): Fish {
  return {
    id: `calc-${sex}`,
    user_id: 'calculator',
    name: fields.name || `${sex === 'male' ? 'Male' : 'Female'} Fish`,
    sex,
    species: 'betta',
    strain: fields.strain || null,
    tail_type: fields.tail_type as Fish['tail_type'] || null,
    color_base: fields.color_base as Fish['color_base'] || null,
    pattern_type: fields.pattern_type as Fish['pattern_type'] || null,
    scale_type: fields.scale_type as Fish['scale_type'] || null,
    finnage: fields.finnage as Fish['finnage'] || null,
    body_type: fields.body_type as Fish['body_type'] || null,
    eye_color: null,
    traits: {
      health_score: parseInt(fields.health_score) || 7,
      aggression_level: (fields.aggression_level as AggressionLevel) || 'medium',
      fertility_confidence: (fields.fertility_confidence as FertilityConfidence) || 'unknown',
    },
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
}

const FIELD_CONFIG = [
  { key: 'name', label: 'Fish Name', type: 'text', placeholder: 'Optional name' },
  { key: 'tail_type', label: 'Tail Type', type: 'select', options: TAIL_TYPE_OPTIONS },
  { key: 'color_base', label: 'Base Color', type: 'select', options: BASE_COLOR_OPTIONS },
  { key: 'pattern_type', label: 'Pattern', type: 'select', options: PATTERN_TYPE_OPTIONS },
  { key: 'scale_type', label: 'Scale Type', type: 'select', options: SCALE_TYPE_OPTIONS },
  {
    key: 'finnage', label: 'Finnage Quality', type: 'select',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'average', label: 'Average' },
      { value: 'strong', label: 'Strong' },
      { value: 'show-quality', label: 'Show Quality' },
    ],
  },
  {
    key: 'body_type', label: 'Body Quality', type: 'select',
    options: [
      { value: 'weak', label: 'Weak' },
      { value: 'average', label: 'Average' },
      { value: 'strong', label: 'Strong' },
      { value: 'show-quality', label: 'Show Quality' },
    ],
  },
  {
    key: 'health_score', label: 'Health Score (1–10)', type: 'number',
    min: 1, max: 10, placeholder: '7',
  },
  {
    key: 'aggression_level', label: 'Aggression', type: 'select',
    options: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }],
  },
  {
    key: 'fertility_confidence', label: 'Fertility Confidence', type: 'select',
    options: [
      { value: 'unknown', label: 'Unknown' },
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
  },
]

function FishInputPanel({
  sex,
  fields,
  onChange,
}: {
  sex: 'male' | 'female'
  fields: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  const color = sex === 'male' ? 'text-cyan-400' : 'text-rose-400'
  const borderColor = sex === 'male' ? 'border-cyan-400/20' : 'border-rose-400/20'
  const bgColor = sex === 'male' ? 'bg-cyan-400/5' : 'bg-rose-400/5'

  return (
    <div className={`rounded-2xl border p-5 ${bgColor} ${borderColor}`}>
      <h3 className={`text-xs font-semibold uppercase tracking-widest mb-4 ${color}`}>
        {sex === 'male' ? '♂ Male' : '♀ Female'} Fish
      </h3>
      <div className="space-y-3">
        {FIELD_CONFIG.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1 uppercase tracking-wider">
              {field.label}
            </label>
            {field.type === 'select' && field.options ? (
              <select title="Select option" aria-label="Select option"
                value={fields[field.key] ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors appearance-none"
              >
                <option value="" className="bg-spawn-surface">Select...</option>
                {field.options.map((o) => (
                  <option key={o.value} value={o.value} className="bg-spawn-surface">{o.label}</option>
                ))}
              </select>
            ) : (
              <input title="Calculator input" aria-label="Calculator input"
                type={field.type}
                min={field.min}
                max={field.max}
                value={fields[field.key] ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TraitCalculator() {
  const [maleFields, setMaleFields] = useState<Record<string, string>>({ health_score: '7', aggression_level: 'medium', fertility_confidence: 'unknown' })
  const [femaleFields, setFemaleFields] = useState<Record<string, string>>({ health_score: '7', aggression_level: 'low', fertility_confidence: 'unknown' })
  const [result, setResult] = useState<PredictionOutput | null>(null)

  function handleCalculate() {
    const male = buildFishFromFields(maleFields, 'male')
    const female = buildFishFromFields(femaleFields, 'female')
    setResult(predictPairing(male, female))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FishInputPanel sex="male" fields={maleFields} onChange={(k, v) => setMaleFields((prev) => ({ ...prev, [k]: v }))} />
        <FishInputPanel sex="female" fields={femaleFields} onChange={(k, v) => setFemaleFields((prev) => ({ ...prev, [k]: v }))} />
      </div>

      <button
        onClick={handleCalculate}
        className="w-full py-3.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-base hover:bg-spawn-cyan-dim transition-colors"
      >
        Run Trait Prediction
      </button>

      {result && (
        <div className="space-y-5 animate-slide-up">
          <div className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest">
            Prediction Results
          </div>

          {/* Score bars */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Compatibility', value: result.compatibilityScore },
              { label: 'Predictability', value: result.predictabilityScore },
              { label: 'Rare Trait Chance', value: result.rareTraitChance },
              { label: 'Value Potential', value: result.highValuePotential },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-4 border border-spawn-border">
                <div className="text-xs text-spawn-muted-text mb-1">{s.label}</div>
                <div className={`text-2xl font-black ${scoreColor(s.value)}`}>{s.value}/100</div>
                <div className="score-bar mt-2">
                  <div
                    className={`score-bar-fill ${s.value >= 70 ? 'bg-emerald-400' : s.value >= 50 ? 'bg-cyan-400' : s.value >= 35 ? 'bg-amber-400' : 'bg-rose-400'}`}
                    style={{ width: `${s.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div className="p-4 rounded-xl bg-spawn-surface border border-spawn-border">
            <div className="text-xs text-spawn-cyan font-medium mb-2">Breeder Recommendation</div>
            <p className="text-sm text-spawn-muted-text leading-relaxed">{result.breederRecommendation}</p>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/20">
              <div className="text-xs text-amber-400 font-medium mb-2">⚠ Warnings</div>
              {result.warnings.map((w, i) => (
                <p key={i} className="text-xs text-spawn-muted-text flex gap-2 mb-1">
                  <span className="text-amber-400 shrink-0">•</span> {w}
                </p>
              ))}
            </div>
          )}

          {/* Outcomes */}
          {result.likelyOutcomes.length > 0 && (
            <div>
              <div className="text-xs text-spawn-muted-text uppercase tracking-wider mb-2">Likely Outcomes</div>
              {result.likelyOutcomes.map((o, i) => (
                <p key={i} className="text-xs text-spawn-muted-text flex gap-2 mb-1.5">
                  <span className="text-spawn-cyan shrink-0">→</span> {o}
                </p>
              ))}
            </div>
          )}

          {result.rareOutcomes.length > 0 && (
            <div>
              <div className="text-xs text-amber-400 uppercase tracking-wider mb-2">⭐ Rare Outcomes</div>
              {result.rareOutcomes.map((o, i) => (
                <p key={i} className="text-xs text-amber-400 flex gap-2 mb-1.5">
                  <span className="shrink-0">✦</span> {o}
                </p>
              ))}
            </div>
          )}

          {/* Holdback advice */}
          <div className="p-4 rounded-xl bg-cyan-400/5 border border-cyan-400/20">
            <div className="text-xs text-spawn-cyan font-medium mb-1.5">Holdback Advice</div>
            <p className="text-xs text-spawn-muted-text leading-relaxed">{result.holdbackAdvice}</p>
          </div>
        </div>
      )}
    </div>
  )
}
