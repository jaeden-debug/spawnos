'use client'

import { useState, useMemo } from 'react'

type FilterType = 'canister' | 'hob' | 'sponge' | 'sump'
type BioloadLevel = 'light' | 'moderate' | 'heavy' | 'extreme'

const BIOLOAD_MULTIPLIERS: Record<BioloadLevel, number> = {
  light: 4,     // lightly stocked, small fish, planted
  moderate: 6,  // community tank, average stocking
  heavy: 8,     // goldfish, messy fish, heavily stocked
  extreme: 10,  // goldfish breeding, heavily stocked koi-style
}

const FILTER_BRANDS: Record<FilterType, { name: string; models: { model: string; lph: number; notes: string }[] }> = {
  canister: {
    name: 'Canister Filter',
    models: [
      { model: 'Fluval 107', lph: 550, notes: 'Up to 130L' },
      { model: 'Fluval 207', lph: 780, notes: 'Up to 220L' },
      { model: 'Fluval 307', lph: 1150, notes: 'Up to 300L' },
      { model: 'Fluval 407', lph: 1450, notes: 'Up to 400L' },
      { model: 'Eheim Classic 250', lph: 440, notes: '180–250L' },
      { model: 'Eheim Classic 350', lph: 620, notes: '250–350L' },
      { model: 'Eheim Classic 600', lph: 1000, notes: '400–600L' },
    ],
  },
  hob: {
    name: 'Hang-on-Back (HOB)',
    models: [
      { model: 'AquaClear 20', lph: 568, notes: 'Up to 75L' },
      { model: 'AquaClear 30', lph: 757, notes: 'Up to 115L' },
      { model: 'AquaClear 50', lph: 1135, notes: 'Up to 200L' },
      { model: 'AquaClear 70', lph: 1500, notes: 'Up to 265L' },
      { model: 'AquaClear 110', lph: 2270, notes: 'Up to 415L' },
    ],
  },
  sponge: {
    name: 'Sponge Filter',
    models: [
      { model: 'Hygger Double Sponge S', lph: 350, notes: 'Up to 60L' },
      { model: 'Hygger Double Sponge M', lph: 500, notes: 'Up to 120L' },
      { model: 'XY-2882 Air Sponge', lph: 600, notes: 'Up to 150L, requires air pump' },
      { model: 'XINYOU XY-380 Large', lph: 800, notes: 'Up to 200L' },
    ],
  },
  sump: {
    name: 'Sump / Wet-Dry',
    models: [
      { model: 'Custom sump 30L', lph: 1500, notes: 'Size depends on return pump' },
      { model: 'Custom sump 60L', lph: 3000, notes: 'Return pump sized to tank+head pressure' },
      { model: 'Custom sump 100L+', lph: 5000, notes: 'Reef/large freshwater' },
    ],
  },
}

const SPECIES_BIOLOAD = [
  { name: 'Goldfish (per fish)', level: 'extreme', note: 'Highest waste producers in freshwater' },
  { name: 'Betta (single)', level: 'light', note: 'Small, minimal waste' },
  { name: 'Discus', level: 'heavy', note: 'Sensitive to waste, daily changes recommended' },
  { name: 'Guppies / Tetras (community)', level: 'moderate', note: 'Standard community bioload' },
  { name: 'Cichlids (large)', level: 'heavy', note: 'Active, messy feeders' },
  { name: 'Shrimp colony', level: 'light', note: 'Minimal bioload; sponge filter ideal' },
  { name: 'Corydoras (school)', level: 'moderate', note: 'Bottom feeders, moderate waste' },
  { name: 'Pleco (large)', level: 'extreme', note: 'Enormous waste production' },
]

export default function FilterSizeCalculator() {
  const [tankLitres, setTankLitres] = useState<string>('200')
  const [usGallons, setUsGallons] = useState(false)
  const [bioload, setBioload] = useState<BioloadLevel>('moderate')
  const [filterType, setFilterType] = useState<FilterType>('canister')
  const [isPlanted, setIsPlanted] = useState(false)
  const [isSaltwater, setIsSaltwater] = useState(false)

  const result = useMemo(() => {
    const litres = usGallons ? parseFloat(tankLitres) * 3.785 : parseFloat(tankLitres)
    if (isNaN(litres) || litres <= 0) return null

    let multiplier = BIOLOAD_MULTIPLIERS[bioload]
    // Saltwater and reef tanks need higher turnover
    if (isSaltwater) multiplier = Math.max(multiplier, 8)
    // Planted tanks produce oxygen and absorb nitrates — can reduce slightly
    if (isPlanted && !isSaltwater) multiplier = Math.max(multiplier - 1, 3)

    const minLPH = litres * multiplier

    const brands = FILTER_BRANDS[filterType]
    const suitable = brands.models.filter((m) => m.lph >= minLPH)
    const recommended = suitable[0] ?? brands.models[brands.models.length - 1]
    const overkillOk = brands.models.filter((m) => m.lph >= minLPH * 1.5)

    return {
      minLPH: Math.ceil(minLPH),
      multiplier,
      recommended,
      overkill: overkillOk[0] ?? null,
      allSuitable: suitable,
    }
  }, [tankLitres, usGallons, bioload, filterType, isPlanted, isSaltwater])

  const bioloadDescriptions: Record<BioloadLevel, string> = {
    light: 'Low stocking: shrimp, 1–2 small fish, planted nano',
    moderate: 'Community tank: 5–15 medium fish, average stocking',
    heavy: 'Goldfish, cichlids, heavily stocked, messy feeders',
    extreme: 'Multiple goldfish, large plecos, koi-style pond in tank',
  }

  const bioloadColors: Record<BioloadLevel, string> = {
    light: 'text-green-400',
    moderate: 'text-amber-400',
    heavy: 'text-orange-400',
    extreme: 'text-red-400',
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tank volume */}
        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">Tank Volume</label>
          <div className="flex gap-2">
            <input title="Calculator input" aria-label="Calculator input"
              type="number"
              value={tankLitres}
              onChange={(e) => setTankLitres(e.target.value)}
              min="1"
              className="flex-1 px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
            />
            <button
              onClick={() => setUsGallons((v) => !v)}
              className="px-4 py-3 rounded-xl border border-spawn-border bg-spawn-surface text-spawn-muted-text hover:text-spawn-text transition-all text-sm font-medium"
            >
              {usGallons ? 'gal' : 'L'}
            </button>
          </div>
        </div>

        {/* Filter type */}
        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">Filter Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(FILTER_BRANDS) as FilterType[]).map((ft) => (
              <button
                key={ft}
                onClick={() => setFilterType(ft)}
                className={`py-2 px-3 rounded-xl border text-sm transition-all ${
                  filterType === ft
                    ? 'bg-spawn-cyan/20 border-spawn-cyan/50 text-spawn-cyan font-semibold'
                    : 'bg-spawn-surface border-spawn-border text-spawn-muted-text hover:border-spawn-cyan/30'
                }`}
              >
                {FILTER_BRANDS[ft].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bioload */}
      <div>
        <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">Bioload / Stocking Level</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(BIOLOAD_MULTIPLIERS) as BioloadLevel[]).map((b) => (
            <button
              key={b}
              onClick={() => setBioload(b)}
              className={`py-3 px-3 rounded-xl border text-sm transition-all text-left ${
                bioload === b
                  ? `bg-spawn-surface border-spawn-cyan/50 ${bioloadColors[b]}`
                  : 'bg-spawn-surface border-spawn-border text-spawn-muted-text hover:border-spawn-cyan/30'
              }`}
            >
              <div className="font-semibold capitalize">{b}</div>
              <div className="text-xs opacity-70 mt-0.5 leading-tight">{BIOLOAD_MULTIPLIERS[b]}× turnover</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-spawn-muted-text mt-2">{bioloadDescriptions[bioload]}</p>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input title="Calculator input" aria-label="Calculator input"
            type="checkbox"
            checked={isPlanted}
            onChange={(e) => setIsPlanted(e.target.checked)}
            className="w-4 h-4 accent-spawn-cyan"
          />
          <span className="text-sm text-spawn-text">Planted tank</span>
          <span className="text-xs text-spawn-muted-text">(plants absorb nitrates, reduces required turnover slightly)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input title="Calculator input" aria-label="Calculator input"
            type="checkbox"
            checked={isSaltwater}
            onChange={(e) => setIsSaltwater(e.target.checked)}
            className="w-4 h-4 accent-spawn-cyan"
          />
          <span className="text-sm text-spawn-text">Saltwater / Reef</span>
          <span className="text-xs text-spawn-muted-text">(requires higher turnover, typically 8–10×)</span>
        </label>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-spawn-surface/50 border border-spawn-border/50 rounded-xl p-4">
              <div className="text-xs text-spawn-muted-text mb-1">Minimum Flow Rate</div>
              <div className="text-2xl font-black text-spawn-cyan">{result.minLPH.toLocaleString()}</div>
              <div className="text-xs text-spawn-muted-text/70">litres per hour</div>
            </div>
            <div className="bg-spawn-surface/50 border border-spawn-border/50 rounded-xl p-4">
              <div className="text-xs text-spawn-muted-text mb-1">Turnover Target</div>
              <div className={`text-2xl font-black ${bioloadColors[bioload]}`}>{result.multiplier}×</div>
              <div className="text-xs text-spawn-muted-text/70">per hour</div>
            </div>
            <div className="bg-spawn-surface/50 border border-spawn-border/50 rounded-xl p-4 col-span-2 sm:col-span-1">
              <div className="text-xs text-spawn-muted-text mb-1">Recommended Model</div>
              <div className="text-lg font-black text-spawn-text">{result.recommended.model}</div>
              <div className="text-xs text-spawn-muted-text/70">{result.recommended.lph.toLocaleString()} LPH · {result.recommended.notes}</div>
            </div>
          </div>

          {/* All suitable options */}
          {result.allSuitable.length > 0 && (
            <div className="rounded-xl border border-spawn-border/50 bg-spawn-surface/30 p-5">
              <h4 className="text-sm font-bold text-spawn-text mb-3">Suitable {FILTER_BRANDS[filterType].name} Options</h4>
              <div className="space-y-2">
                {result.allSuitable.map((m, i) => (
                  <div key={m.model} className={`flex items-center justify-between p-3 rounded-lg border ${i === 0 ? 'border-spawn-cyan/30 bg-spawn-cyan/5' : 'border-spawn-border/30 bg-spawn-bg/30'}`}>
                    <div>
                      <span className={`font-semibold text-sm ${i === 0 ? 'text-spawn-cyan' : 'text-spawn-text'}`}>{m.model}</span>
                      {i === 0 && <span className="ml-2 text-xs bg-spawn-cyan/20 text-spawn-cyan px-2 py-0.5 rounded-full">Recommended</span>}
                      <div className="text-xs text-spawn-muted-text mt-0.5">{m.notes}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${i === 0 ? 'text-spawn-cyan' : 'text-spawn-text'}`}>{m.lph.toLocaleString()} LPH</div>
                      <div className="text-xs text-spawn-muted-text">{(m.lph / (usGallons ? parseFloat(tankLitres) * 3.785 : parseFloat(tankLitres))).toFixed(1)}× turnover</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Species bioload reference */}
          <div className="rounded-xl border border-spawn-border/30 bg-spawn-surface/20 p-4">
            <h4 className="text-xs font-bold text-spawn-muted-text uppercase tracking-wide mb-3">Species Bioload Reference</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {SPECIES_BIOLOAD.map(({ name, level, note }) => (
                <div key={name} className="flex items-start gap-2 py-1.5">
                  <span className={`text-xs font-semibold shrink-0 mt-0.5 ${bioloadColors[level as BioloadLevel]}`}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </span>
                  <div>
                    <span className="text-xs text-spawn-text">{name}</span>
                    <span className="text-xs text-spawn-muted-text ml-1">— {note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
