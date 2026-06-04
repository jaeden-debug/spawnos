'use client'

import { useState } from 'react'

interface CycleResult {
  stage: string
  stageDetail: string
  nextSteps: string[]
  estimatedDaysLeft: string
  color: 'red' | 'orange' | 'yellow' | 'green'
  safeToAdd: boolean
}

function assessCycle(ammonia: number, nitrite: number, nitrate: number): CycleResult {
  // Not started / very early
  if (ammonia === 0 && nitrite === 0 && nitrate === 0) {
    return {
      stage: 'Not Started / Pre-Cycle',
      stageDetail: 'No ammonia source detected. The nitrogen cycle has not begun.',
      nextSteps: [
        'Add an ammonia source: pure ammonia (2–4 ppm), fish food, or a small fishless ammonia dose.',
        'Ensure temperature is 76–82°F for optimal bacterial growth.',
        'Add a bacterial seeding product (Tetra SafeStart, Fritz Zyme 7) to accelerate colonisation.',
        'Do not perform water changes until ammonia spikes.',
      ],
      estimatedDaysLeft: '4–6 weeks',
      color: 'red',
      safeToAdd: false,
    }
  }

  // Ammonia present, no nitrite — Stage 1
  if (ammonia > 0 && nitrite === 0 && nitrate === 0) {
    return {
      stage: 'Stage 1 — Ammonia Phase',
      stageDetail: `Ammonia is present at ${ammonia} ppm. Nitrosomonas bacteria are beginning to colonise but have not produced measurable nitrite yet. This is the earliest phase of the cycle.`,
      nextSteps: [
        'Maintain ammonia at 2–4 ppm to feed developing bacterial colonies.',
        'Do not perform water changes yet — this removes the bacteria food source.',
        `${ammonia > 4 ? 'Warning: ammonia above 4 ppm can inhibit bacterial growth. Dilute with a 25% water change.' : 'Ammonia level is in the ideal range for cycling.'}`,
        'Watch for first appearance of nitrite (usually 7–14 days after ammonia source added).',
      ],
      estimatedDaysLeft: '3–5 weeks',
      color: 'red',
      safeToAdd: false,
    }
  }

  // Ammonia and nitrite both present — Stage 2
  if (ammonia > 0 && nitrite > 0) {
    return {
      stage: 'Stage 2 — Active Cycling',
      stageDetail: `Ammonia: ${ammonia} ppm · Nitrite: ${nitrite} ppm. Both compounds are elevated. Nitrosomonas are converting ammonia to nitrite faster than Nitrospira can convert nitrite to nitrate. This is the longest and most important stage.`,
      nextSteps: [
        'Continue maintaining ammonia at 2–4 ppm as a food source for bacteria.',
        'Do not add fish — nitrite above 0.25 ppm is toxic.',
        `${nitrite > 5 ? 'Nitrite spike is very high — this is normal. The Nitrospira colony will catch up.' : 'Nitrite levels are building normally.'}`,
        'First nitrate readings should appear within 1–2 weeks of seeing nitrite.',
        'Estimated cycle completion: when both ammonia and nitrite reach 0 within 24 hours of dosing.',
      ],
      estimatedDaysLeft: '2–4 weeks',
      color: 'orange',
      safeToAdd: false,
    }
  }

  // Nitrite present but ammonia near zero — approaching end of Stage 2
  if (ammonia <= 0.25 && nitrite > 0) {
    return {
      stage: 'Stage 2 Late — Nitrite Processing',
      stageDetail: `Ammonia is nearly cleared (${ammonia} ppm). Nitrite is still elevated at ${nitrite} ppm. Nitrospira bacteria are colonising and will begin converting nitrite to nitrate. You are in the final weeks of the cycle.`,
      nextSteps: [
        'Add a small dose of ammonia (1–2 ppm) to maintain the bacterial food source.',
        'Watch for nitrite to begin dropping — this signals Nitrospira establishment.',
        'Do not add fish until nitrite reads 0.',
        nitrate > 0 ? `Nitrate detected at ${nitrate} ppm — the Nitrospira colony is established and working.` : 'No nitrate yet — continue waiting.',
      ],
      estimatedDaysLeft: '1–2 weeks',
      color: 'yellow',
      safeToAdd: false,
    }
  }

  // Ammonia and nitrite both 0, nitrate present — CYCLED
  if (ammonia === 0 && nitrite === 0 && nitrate > 0) {
    return {
      stage: 'Cycled ✓',
      stageDetail: `Ammonia: 0 ppm · Nitrite: 0 ppm · Nitrate: ${nitrate} ppm. Your tank is fully cycled. Both bacterial colonies (Nitrosomonas and Nitrospira) are established and processing waste.`,
      nextSteps: [
        nitrate > 40 ? `Nitrate is ${nitrate} ppm — perform a 30–40% water change before adding fish to bring nitrate under 20 ppm.` : `Nitrate is ${nitrate} ppm — acceptable. Perform a 25% water change before adding fish.`,
        'Add fish slowly — no more than 1–3 fish per week to avoid overwhelming the bacterial colonies.',
        'Test water parameters for the first 3–4 weeks after adding fish.',
        'Maintain weekly water changes of 20–30% to control nitrate accumulation.',
        'Congratulations — the hard part is done.',
      ],
      estimatedDaysLeft: 'Complete',
      color: 'green',
      safeToAdd: true,
    }
  }

  // Fallback
  return {
    stage: 'Indeterminate',
    stageDetail: 'Enter your readings to assess cycle progress.',
    nextSteps: ['Enter ammonia, nitrite, and nitrate readings from a liquid test kit.'],
    estimatedDaysLeft: 'Unknown',
    color: 'orange',
    safeToAdd: false,
  }
}

export default function NitrogenCycleTracker() {
  const [ammonia, setAmmonia] = useState('')
  const [nitrite, setNitrite] = useState('')
  const [nitrate, setNitrate] = useState('')
  const [result, setResult] = useState<CycleResult | null>(null)

  function assess() {
    const a = parseFloat(ammonia) || 0
    const ni = parseFloat(nitrite) || 0
    const na = parseFloat(nitrate) || 0
    setResult(assessCycle(a, ni, na))
  }

  const inputClass = 'w-full bg-spawn-surface border border-spawn-border rounded-lg px-3 py-2.5 text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/60 transition-colors'
  const labelClass = 'text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-1.5 block'

  const colorMap = {
    red: 'border-spawn-rose/30 bg-spawn-rose/5',
    orange: 'border-spawn-amber/30 bg-spawn-amber/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
    green: 'border-spawn-emerald/30 bg-spawn-emerald/5',
  }
  const textColorMap = {
    red: 'text-spawn-rose',
    orange: 'text-spawn-amber',
    yellow: 'text-yellow-400',
    green: 'text-spawn-emerald',
  }

  return (
    <div className="max-w-2xl">
      <div className="glass-card rounded-xl border border-spawn-border/50 p-6">
        <p className="text-sm text-spawn-muted-text mb-5">
          Enter your current readings from a <strong className="text-spawn-text">liquid test kit</strong> (not strips).
          All values in ppm.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <label className={labelClass}>Ammonia (ppm)</label>
            <input type="number" min="0" max="8" step="0.25" className={inputClass} value={ammonia} onChange={(e) => setAmmonia(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className={labelClass}>Nitrite (ppm)</label>
            <input type="number" min="0" max="10" step="0.25" className={inputClass} value={nitrite} onChange={(e) => setNitrite(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className={labelClass}>Nitrate (ppm)</label>
            <input type="number" min="0" max="160" step="5" className={inputClass} value={nitrate} onChange={(e) => setNitrate(e.target.value)} placeholder="0" />
          </div>
        </div>

        <button
          onClick={assess}
          className="w-full py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
        >
          Assess Cycle Stage
        </button>
      </div>

      {result && (
        <div className={`mt-6 glass-card rounded-xl border p-6 ${colorMap[result.color]}`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className={`text-lg font-black ${textColorMap[result.color]}`}>{result.stage}</div>
              <p className="text-sm text-spawn-muted-text mt-1 leading-relaxed">{result.stageDetail}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-spawn-muted-text">Est. time left</div>
              <div className={`text-sm font-bold ${textColorMap[result.color]}`}>{result.estimatedDaysLeft}</div>
            </div>
          </div>

          <div className="border-t border-spawn-border/30 pt-4">
            <div className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-3">Next Steps</div>
            <ul className="space-y-2">
              {result.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-spawn-muted-text">
                  <span className={`shrink-0 font-bold ${textColorMap[result.color]}`}>{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className={`mt-4 pt-4 border-t border-spawn-border/30 flex items-center gap-2`}>
            <span className={`w-2 h-2 rounded-full ${result.safeToAdd ? 'bg-spawn-emerald' : 'bg-spawn-rose'}`} />
            <span className="text-sm font-semibold text-spawn-text">
              {result.safeToAdd ? 'Safe to add fish' : 'Not safe to add fish yet'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
