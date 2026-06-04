'use client'

import { useState } from 'react'

type FilterType = 'none' | 'hang-on-back' | 'canister' | 'sump' | 'sponge'
type BioloadType = 'light' | 'medium' | 'heavy'

interface StockResult {
  recommendedFishInches: number
  maxFishInches: number
  bioloadCapacity: number
  waterChangesNeeded: string
  warnings: string[]
  notes: string[]
}

const FILTER_MULTIPLIERS: Record<FilterType, number> = {
  'none': 0.5,
  'sponge': 0.8,
  'hang-on-back': 1.0,
  'canister': 1.4,
  'sump': 1.8,
}

const BIOLOAD_MULTIPLIERS: Record<BioloadType, number> = {
  'light': 1.2,
  'medium': 1.0,
  'heavy': 0.65,
}

export default function StockingCalculator() {
  const [volume, setVolume] = useState('')
  const [filter, setFilter] = useState<FilterType>('hang-on-back')
  const [bioload, setBioload] = useState<BioloadType>('medium')
  const [planted, setPlanted] = useState(false)
  const [result, setResult] = useState<StockResult | null>(null)

  function calculate() {
    const vol = parseFloat(volume)
    if (!vol || vol <= 0) return

    const filterMult = FILTER_MULTIPLIERS[filter]
    const bioloadMult = BIOLOAD_MULTIPLIERS[bioload]
    const plantedBonus = planted ? 1.2 : 1.0

    // Base: 1 inch of fish per gallon (conservative), adjusted by filtration and bioload
    const maxFishInches = vol * filterMult * bioloadMult * plantedBonus
    const recommendedFishInches = maxFishInches * 0.75 // 75% of max for stability buffer

    const warnings: string[] = []
    const notes: string[] = []

    if (filter === 'none') warnings.push('No filtration severely limits stocking capacity and requires daily water testing.')
    if (vol < 10) warnings.push('Tanks under 10 gallons are difficult to stock with most tropical species — water parameters fluctuate dangerously fast.')
    if (bioload === 'heavy') notes.push('Heavy bioload fish (goldfish, cichlids, large plecos) produce significantly more waste per inch of body length than typical community fish.')
    if (planted) notes.push('Live plants absorb nitrate and provide biological filtration, supporting higher stocking density.')

    notes.push('The "inches per gallon" metric is a rough guide only. Body shape, activity level, and species-specific space requirements matter significantly.')
    notes.push(`Recommended water change schedule: ${bioload === 'heavy' ? '30–40% twice weekly' : bioload === 'medium' ? '25–30% weekly' : '20–25% weekly or bi-weekly'}.`)

    const waterChangesNeeded = bioload === 'heavy' ? '30–40% twice weekly' : bioload === 'medium' ? '25–30% weekly' : '20–25% weekly'

    setResult({
      recommendedFishInches: Math.round(recommendedFishInches * 10) / 10,
      maxFishInches: Math.round(maxFishInches * 10) / 10,
      bioloadCapacity: Math.round((recommendedFishInches / (vol * 1)) * 100),
      waterChangesNeeded,
      warnings,
      notes,
    })
  }

  const inputClass = 'w-full bg-spawn-surface border border-spawn-border rounded-lg px-3 py-2.5 text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/60 transition-colors'
  const labelClass = 'text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-1.5 block'

  return (
    <div className="max-w-2xl">
      <div className="glass-card rounded-xl border border-spawn-border/50 p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tank Volume (gallons)</label>
            <input type="number" min="1" className={inputClass} value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="e.g. 29" />
          </div>
          <div>
            <label className={labelClass}>Filtration Type</label>
            <select className={inputClass} value={filter} onChange={(e) => setFilter(e.target.value as FilterType)}>
              <option value="none">No filtration</option>
              <option value="sponge">Sponge filter</option>
              <option value="hang-on-back">Hang-on-back (HOB)</option>
              <option value="canister">Canister filter</option>
              <option value="sump">Sump / wet-dry</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Fish Bioload Level</label>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'medium', 'heavy'] as BioloadType[]).map((b) => (
              <button
                key={b}
                onClick={() => setBioload(b)}
                className={`py-2 rounded-lg text-sm font-semibold border transition-all capitalize ${
                  bioload === b
                    ? 'bg-spawn-cyan/10 border-spawn-cyan/40 text-spawn-cyan'
                    : 'bg-spawn-surface border-spawn-border text-spawn-muted-text hover:border-spawn-border/80'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <p className="text-xs text-spawn-muted/50 mt-1">
            Light: tetras, rasboras, danios · Medium: livebearers, corydoras · Heavy: goldfish, cichlids, large catfish
          </p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={planted} onChange={(e) => setPlanted(e.target.checked)} className="w-4 h-4 accent-cyan-400" />
          <div>
            <span className="text-sm font-semibold text-spawn-text">Heavily planted tank</span>
            <span className="text-xs text-spawn-muted-text ml-2">(+20% capacity bonus)</span>
          </div>
        </label>

        <button
          onClick={calculate}
          disabled={!volume}
          className="w-full py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all disabled:opacity-40"
        >
          Calculate Stocking
        </button>
      </div>

      {result && (
        <div className="mt-6 glass-card rounded-xl border border-spawn-border/50 p-6">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-spawn-cyan/5 border border-spawn-cyan/20 rounded-lg p-4">
              <div className="text-xs text-spawn-cyan mb-1">Recommended Stocking</div>
              <div className="text-2xl font-black text-spawn-text">{result.recommendedFishInches}<span className="text-sm font-normal text-spawn-muted-text"> in</span></div>
              <div className="text-xs text-spawn-muted-text mt-0.5">body length total</div>
            </div>
            <div className="bg-spawn-surface rounded-lg p-4">
              <div className="text-xs text-spawn-muted-text mb-1">Absolute Max</div>
              <div className="text-2xl font-black text-spawn-text">{result.maxFishInches}<span className="text-sm font-normal text-spawn-muted-text"> in</span></div>
              <div className="text-xs text-spawn-muted-text mt-0.5">with excellent maintenance</div>
            </div>
          </div>

          <div className="mb-4 text-sm">
            <span className="text-spawn-muted-text">Recommended water changes: </span>
            <span className="font-semibold text-spawn-text">{result.waterChangesNeeded}</span>
          </div>

          {result.warnings.map((w, i) => (
            <div key={i} className="text-sm text-spawn-amber mb-2">⚠ {w}</div>
          ))}
          {result.notes.map((n, i) => (
            <div key={i} className="text-xs text-spawn-muted/60 mb-1.5">• {n}</div>
          ))}
        </div>
      )}
    </div>
  )
}
