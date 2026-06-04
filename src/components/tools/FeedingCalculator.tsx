'use client'

import { useState } from 'react'

type FishType = 'community-small' | 'community-medium' | 'carnivore-medium' | 'cichlid' | 'bottom-dweller' | 'predator-large'
type FoodType = 'pellet-dry' | 'flake' | 'frozen' | 'live' | 'wafer'

interface FeedResult {
  amountPerFeedingGrams: number
  amountPerFeedingTsp: number
  feedingsPerDay: number
  fastingDays: string
  totalDailyGrams: number
  notes: string[]
  warnings: string[]
}

const FISH_PROFILES: Record<FishType, { label: string; baseBodyPct: number; feedingsPerDay: number; fastingNote: string }> = {
  'community-small': { label: 'Small community fish (tetras, rasboras, danios)', baseBodyPct: 0.03, feedingsPerDay: 2, fastingNote: '1 day per week' },
  'community-medium': { label: 'Medium community fish (gouramis, livebearers)', baseBodyPct: 0.025, feedingsPerDay: 2, fastingNote: '1 day per week' },
  'carnivore-medium': { label: 'Carnivorous medium fish (betta, angelfish)', baseBodyPct: 0.02, feedingsPerDay: 2, fastingNote: '1 day per week' },
  'cichlid': { label: 'Cichlids (dwarf, South American)', baseBodyPct: 0.02, feedingsPerDay: 2, fastingNote: '1 day per week' },
  'bottom-dweller': { label: 'Bottom dwellers (corydoras, otocinclus)', baseBodyPct: 0.015, feedingsPerDay: 1, fastingNote: '1 day per week' },
  'predator-large': { label: 'Large predatory fish (oscar, arowana)', baseBodyPct: 0.015, feedingsPerDay: 1, fastingNote: '2 days per week' },
}

const FOOD_DENSITY: Record<FoodType, { label: string; gramsPerTsp: number; multiplier: number }> = {
  'pellet-dry': { label: 'Dry pellets', gramsPerTsp: 2.5, multiplier: 1.0 },
  'flake': { label: 'Dry flakes', gramsPerTsp: 0.8, multiplier: 1.0 },
  'frozen': { label: 'Frozen food (thawed)', gramsPerTsp: 4.0, multiplier: 0.7 }, // higher water content = feed less dry weight
  'live': { label: 'Live food', gramsPerTsp: 3.5, multiplier: 0.65 },
  'wafer': { label: 'Sinking wafers / algae tabs', gramsPerTsp: 3.0, multiplier: 0.8 },
}

export default function FeedingCalculator() {
  const [fishCount, setFishCount] = useState('')
  const [avgLengthInches, setAvgLengthInches] = useState('')
  const [fishType, setFishType] = useState<FishType>('community-small')
  const [foodType, setFoodType] = useState<FoodType>('pellet-dry')
  const [result, setResult] = useState<FeedResult | null>(null)
  const [error, setError] = useState('')

  function calculate() {
    setError('')
    const count = parseInt(fishCount)
    const lengthIn = parseFloat(avgLengthInches)

    if (!count || count < 1) { setError('Enter a valid fish count.'); return }
    if (!lengthIn || lengthIn <= 0) { setError('Enter a valid average fish length.'); return }

    const profile = FISH_PROFILES[fishType]
    const food = FOOD_DENSITY[foodType]

    // Estimate total fish body weight: rough approximation
    // Average fish weight (g) ≈ 0.4 × length(cm)^2.8 for small–medium fish
    const lengthCm = lengthIn * 2.54
    const avgWeightG = 0.4 * Math.pow(lengthCm, 2.8) / 1000 // convert mg to g (rough)
    const totalBiomassG = avgWeightG * count

    // Daily food = 2–3% of body weight for most fish
    const dailyFoodG = totalBiomassG * profile.baseBodyPct * food.multiplier
    const perFeedingG = dailyFoodG / profile.feedingsPerDay
    const perFeedingTsp = perFeedingG / food.gramsPerTsp

    const notes: string[] = []
    const warnings: string[] = []

    notes.push(`Recommended fasting: ${profile.fastingNote} — improves digestion and reduces waste buildup.`)
    notes.push('The "two-minute rule": feed only as much as fish consume in 2 minutes. Any uneaten food after 2 minutes is overfeeding.')

    if (foodType === 'frozen') notes.push('Thaw frozen food in a small cup of tank water before feeding. Do not microwave.')
    if (foodType === 'live') notes.push('Live food (brine shrimp, daphnia, bloodworm) is excellent for conditioning and should supplement, not replace, a varied diet.')
    if (perFeedingTsp < 0.05) warnings.push('Calculated dose is very small — use a pinch or a single small pellet as a practical guide for nano tanks and small fish.')
    if (count > 20) notes.push('In densely stocked tanks, ensure all fish — including bottom dwellers — get food before it is consumed by faster swimmers.')

    setResult({
      amountPerFeedingGrams: Math.max(0.05, Math.round(perFeedingG * 100) / 100),
      amountPerFeedingTsp: Math.max(0.01, Math.round(perFeedingTsp * 100) / 100),
      feedingsPerDay: profile.feedingsPerDay,
      fastingDays: profile.fastingNote,
      totalDailyGrams: Math.round(dailyFoodG * 100) / 100,
      notes,
      warnings,
    })
  }

  const inputClass = 'w-full bg-spawn-surface border border-spawn-border rounded-lg px-3 py-2.5 text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/60 transition-colors'
  const labelClass = 'text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-1.5 block'

  return (
    <div className="max-w-2xl">
      <div className="glass-card rounded-xl border border-spawn-border/50 p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Number of Fish</label>
            <input type="number" min="1" className={inputClass} value={fishCount} onChange={(e) => setFishCount(e.target.value)} placeholder="e.g. 12" />
          </div>
          <div>
            <label className={labelClass}>Average Length (inches)</label>
            <input type="number" min="0.5" step="0.5" className={inputClass} value={avgLengthInches} onChange={(e) => setAvgLengthInches(e.target.value)} placeholder="e.g. 1.5" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Fish Type</label>
          <select className={inputClass} value={fishType} onChange={(e) => setFishType(e.target.value as FishType)}>
            {Object.entries(FISH_PROFILES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Food Type</label>
          <select className={inputClass} value={foodType} onChange={(e) => setFoodType(e.target.value as FoodType)}>
            {Object.entries(FOOD_DENSITY).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-spawn-rose text-sm">{error}</p>}

        <button onClick={calculate} disabled={!fishCount || !avgLengthInches} className="w-full py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all disabled:opacity-40">
          Calculate Feeding Amount
        </button>
      </div>

      {result && (
        <div className="mt-6 glass-card rounded-xl border border-spawn-border/50 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-spawn-cyan/5 border border-spawn-cyan/20 rounded-lg p-4">
              <div className="text-xs text-spawn-cyan mb-1">Per Feeding</div>
              <div className="text-xl font-black text-spawn-text">{result.amountPerFeedingTsp} <span className="text-sm font-normal text-spawn-muted-text">tsp</span></div>
              <div className="text-xs text-spawn-muted-text">{result.amountPerFeedingGrams}g · {result.feedingsPerDay}× daily</div>
            </div>
            <div className="bg-spawn-surface rounded-lg p-4">
              <div className="text-xs text-spawn-muted-text mb-1">Total Daily</div>
              <div className="text-xl font-black text-spawn-text">{result.totalDailyGrams}<span className="text-sm font-normal text-spawn-muted-text"> g</span></div>
              <div className="text-xs text-spawn-muted-text">Fasting: {result.fastingDays}</div>
            </div>
          </div>
          {result.warnings.map((w, i) => <p key={i} className="text-sm text-spawn-amber">⚠ {w}</p>)}
          {result.notes.map((n, i) => <p key={i} className="text-xs text-spawn-muted/60">• {n}</p>)}
          <p className="text-xs text-spawn-muted/40 border-t border-spawn-border/30 pt-3">
            Calculations are estimates based on average body weight approximations. The two-minute rule and observing
            fish behaviour are always the most reliable guides.
          </p>
        </div>
      )}
    </div>
  )
}
