'use client'

import { useState } from 'react'
import type { BlueprintFormInput, BlueprintOutput } from '@/types/blueprint'

const GOALS = [
  { value: 'community', label: 'Community Tank', desc: 'Mixed peaceful species' },
  { value: 'biotope', label: 'Biotope', desc: 'Region-specific recreation' },
  { value: 'planted', label: 'Planted / Nature', desc: 'Plant-forward design' },
  { value: 'breeding', label: 'Breeding', desc: 'Species pair setup' },
  { value: 'species-only', label: 'Species Only', desc: 'Single species focus' },
  { value: 'nano', label: 'Nano / Desktop', desc: 'Small, compact setup' },
] as const

const EXPERIENCE = [
  { value: 'beginner', label: 'Beginner', desc: 'First or second tank' },
  { value: 'intermediate', label: 'Intermediate', desc: '2–5 years experience' },
  { value: 'advanced', label: 'Advanced', desc: '5+ years, confident with water chemistry' },
] as const

const MAINTENANCE = [
  { value: 'low', label: 'Low', desc: '15–20 min/week' },
  { value: 'moderate', label: 'Moderate', desc: '30–45 min/week' },
  { value: 'high', label: 'High', desc: '1+ hour/week' },
] as const

const BUDGET = [
  { value: 'budget', label: 'Budget', desc: 'Under $300 setup' },
  { value: 'mid-range', label: 'Mid-Range', desc: '$300–$800 setup' },
  { value: 'premium', label: 'Premium', desc: '$800+ setup' },
] as const

const DEFAULT_FORM: BlueprintFormInput = {
  tankSize: 29,
  waterType: 'freshwater',
  experience: 'intermediate',
  primaryGoal: 'community',
  budget: 'mid-range',
  maintenance: 'moderate',
  includeBreeding: false,
  notes: '',
}

export default function BlueprintGenerator() {
  const [form, setForm] = useState<BlueprintFormInput>(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BlueprintOutput | null>(null)
  const [error, setError] = useState('')

  function update<K extends keyof BlueprintFormInput>(key: K, val: BlueprintFormInput[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function generate() {
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch('/api/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate blueprint.')
      } else {
        setResult(data as BlueprintOutput)
        // Scroll to result
        setTimeout(() => document.getElementById('blueprint-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-spawn-surface border border-spawn-border rounded-lg px-3 py-2.5 text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/60 transition-colors'
  const labelClass = 'text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-2 block'

  function OptionGrid<T extends string>({
    label, field, options,
  }: {
    label: string
    field: keyof BlueprintFormInput
    options: readonly { value: T; label: string; desc: string }[]
  }) {
    const current = form[field] as string
    return (
      <div>
        <div className={labelClass}>{label}</div>
        <div className={`grid gap-2 ${options.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update(field, opt.value as BlueprintFormInput[typeof field])}
              className={`text-left p-3 rounded-xl border transition-all ${
                current === opt.value
                  ? 'bg-spawn-cyan/10 border-spawn-cyan/40 text-spawn-cyan'
                  : 'bg-spawn-surface border-spawn-border text-spawn-muted-text hover:border-spawn-border/80 hover:text-spawn-text'
              }`}
            >
              <div className="font-semibold text-xs">{opt.label}</div>
              <div className="text-xs mt-0.5 opacity-70">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Form */}
      <div className="glass-card rounded-2xl border border-spawn-border/50 p-6 sm:p-8 space-y-7">
        {/* Tank size + water type */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Tank Size (gallons)</label>
            <input
              type="number"
              min="2"
              max="500"
              className={inputClass}
              value={form.tankSize}
              onChange={(e) => update('tankSize', parseInt(e.target.value) || 29)}
            />
          </div>
          <div>
            <label className={labelClass}>Water Type</label>
            <select className={inputClass} value={form.waterType} onChange={(e) => update('waterType', e.target.value as BlueprintFormInput['waterType'])}>
              <option value="freshwater">Freshwater</option>
              <option value="brackish">Brackish</option>
              <option value="saltwater">Saltwater / Marine</option>
            </select>
          </div>
        </div>

        <OptionGrid label="Primary Goal" field="primaryGoal" options={GOALS} />
        <OptionGrid label="Your Experience Level" field="experience" options={EXPERIENCE} />
        <OptionGrid label="Maintenance Commitment" field="maintenance" options={MAINTENANCE} />
        <OptionGrid label="Setup Budget" field="budget" options={BUDGET} />

        {/* Breeding toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.includeBreeding}
            onChange={(e) => update('includeBreeding', e.target.checked)}
            className="w-4 h-4 accent-cyan-400"
          />
          <div>
            <span className="text-sm font-semibold text-spawn-text">Include breeding setup recommendations</span>
            <span className="text-xs text-spawn-muted-text ml-2">(pairs, spawning triggers, fry care)</span>
          </div>
        </label>

        {/* Notes */}
        <div>
          <label className={labelClass}>Additional Notes (optional)</label>
          <textarea
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="e.g. I want a blackwater setup, prefer South American species, have hard tap water (GH 15), already have a canister filter..."
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-spawn-rose/10 border border-spawn-rose/30 rounded-xl p-4 text-sm text-spawn-rose">
            {error}
          </div>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-spawn-cyan text-spawn-bg font-black text-base hover:bg-opacity-90 transition-all glow-cyan disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating Blueprint...
            </>
          ) : (
            <>
              Generate Tank Blueprint
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 10H16M11 5L16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
        <p className="text-xs text-spawn-muted/50 text-center">
          Free · No account required · Powered by OpenAI GPT-4o mini
        </p>
      </div>

      {/* Result */}
      {result && (
        <div id="blueprint-result" className="mt-10 space-y-6">
          {result.mockMode && (
            <div className="bg-spawn-amber/10 border border-spawn-amber/30 rounded-xl p-4 text-sm text-spawn-amber">
              ⚠ Mock mode: Set <code className="font-mono bg-spawn-surface px-1 rounded">OPENAI_API_KEY</code> in your{' '}
              <code className="font-mono bg-spawn-surface px-1 rounded">.env.local</code> for real AI-generated blueprints.
            </div>
          )}

          {/* Header */}
          <div className="glass-card rounded-2xl border border-spawn-cyan/20 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spawn-cyan/10 border border-spawn-cyan/20 text-spawn-cyan text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-spawn-cyan" />
                AI Generated Blueprint
              </span>
              <span className="text-xs text-spawn-muted/50">
                {new Date(result.generatedAt).toLocaleString()}
              </span>
            </div>
            <h2 className="text-2xl font-black text-spawn-text mb-3">{result.title}</h2>
            <p className="text-spawn-muted-text leading-relaxed">{result.summary}</p>
          </div>

          {/* Parameters */}
          <div className="glass-card rounded-xl border border-spawn-border/50 p-5">
            <h3 className="text-sm font-bold text-spawn-text mb-4">Target Water Parameters</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(result.parameters).map(([key, val]) => (
                <div key={key} className="bg-spawn-surface rounded-lg p-3 text-center">
                  <div className="text-xs text-spawn-muted-text uppercase tracking-wide mb-1">{key === 'temp' ? 'Temp' : key === 'ph' ? 'pH' : key === 'gh' ? 'GH' : key === 'kh' ? 'KH' : 'Nitrate'}</div>
                  <div className="text-xs font-bold text-spawn-text">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stocking list */}
          <div className="glass-card rounded-xl border border-spawn-border/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-spawn-border/50 bg-spawn-surface/50">
              <h3 className="font-bold text-spawn-text">Stocking List</h3>
            </div>
            <div className="divide-y divide-spawn-border/30">
              {result.stockingList.map((fish, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div>
                      <span className="font-semibold text-spawn-text">{fish.commonName}</span>
                      <span className="text-xs text-spawn-muted-text italic ml-2">{fish.scientificName}</span>
                    </div>
                    <span className="text-sm font-bold text-spawn-cyan shrink-0">{fish.count}</span>
                  </div>
                  <div className="text-xs text-spawn-muted-text mb-1">Role: {fish.role}</div>
                  <div className="text-xs text-spawn-muted/70">{fish.notes}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Substrate, filtration, lighting */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Substrate', value: result.substrate },
              { label: 'Filtration', value: result.filtration },
              { label: 'Lighting', value: result.lighting },
            ].map((item) => (
              <div key={item.label} className="glass-card rounded-xl border border-spawn-border/50 p-4">
                <div className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-2">{item.label}</div>
                <p className="text-sm text-spawn-muted-text leading-relaxed">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Plants + hardscape */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl border border-spawn-border/50 p-4">
              <div className="text-xs font-semibold text-spawn-emerald uppercase tracking-wide mb-3">Recommended Plants</div>
              <ul className="space-y-1">
                {result.plants.map((p, i) => (
                  <li key={i} className="text-sm text-spawn-muted-text flex items-center gap-2">
                    <span className="text-spawn-emerald text-xs">✦</span>{p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-xl border border-spawn-border/50 p-4">
              <div className="text-xs font-semibold text-spawn-amber uppercase tracking-wide mb-3">Hardscape</div>
              <p className="text-sm text-spawn-muted-text leading-relaxed">{result.hardscape}</p>
            </div>
          </div>

          {/* Sections */}
          {result.sections.map((sec, i) => (
            <div key={i} className="glass-card rounded-xl border border-spawn-border/50 p-5">
              <h3 className="font-bold text-spawn-text mb-3">{sec.title}</h3>
              <p className="text-sm text-spawn-muted-text leading-relaxed">{sec.content}</p>
            </div>
          ))}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="glass-card rounded-xl border border-spawn-amber/30 bg-spawn-amber/5 p-5">
              <h3 className="font-bold text-spawn-amber mb-3 text-sm">Important Notes</h3>
              <ul className="space-y-2">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-spawn-muted-text flex gap-2"><span className="text-spawn-amber shrink-0">⚠</span>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Regenerate */}
          <div className="text-center pt-4">
            <button
              onClick={generate}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-spawn-border hover:border-spawn-cyan/40 text-spawn-muted-text hover:text-spawn-text text-sm font-semibold transition-all"
            >
              Regenerate Blueprint
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
