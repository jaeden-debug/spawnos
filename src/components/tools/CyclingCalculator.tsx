'use client'

import { useState, useMemo } from 'react'

type CycleMethod = 'fishless_ammonia' | 'fishless_fish_food' | 'fish_in' | 'seeded'
type CycleStage = 'ammonia_rise' | 'nitrite_rise' | 'nitrate_rise' | 'complete'

const METHOD_DESCRIPTIONS: Record<CycleMethod, { title: string; days: [number, number]; pros: string[]; cons: string[] }> = {
  fishless_ammonia: {
    title: 'Fishless — Pure Ammonia',
    days: [14, 28],
    pros: ['Fastest reliable method', 'No fish at risk', 'Controllable ammonia dose', 'Industry standard'],
    cons: ['Requires liquid ammonia (no surfactants)', 'Daily testing required'],
  },
  fishless_fish_food: {
    title: 'Fishless — Decomposing Fish Food',
    days: [21, 42],
    pros: ['No special supplies needed', 'No fish at risk'],
    cons: ['Slow and inconsistent', 'Can cause algae or mold', 'Harder to control'],
  },
  fish_in: {
    title: 'Fish-In Cycle',
    days: [28, 56],
    pros: ['Fish provide ammonia source', 'No separate ammonia needed'],
    cons: ['Fish experience chronic ammonia/nitrite stress', 'Requires daily water changes', 'Mortality risk', 'NOT recommended for sensitive species'],
  },
  seeded: {
    title: 'Seeded — Established Media',
    days: [3, 14],
    pros: ['Fastest possible', 'Uses established beneficial bacteria', 'Can be "instant" for lightly stocked tank'],
    cons: ['Requires access to established filter/media', 'May introduce pathogens from donor tank'],
  },
}

const READING_INTERPRETATIONS = [
  { stage: 'Ammonia rising, nitrite = 0', meaning: 'Stage 1: Nitrosomonas establishing. Normal early cycle.', color: 'text-amber-400' },
  { stage: 'Ammonia dropping, nitrite rising', meaning: 'Stage 2: Nitrosomonas active. Nitrospira beginning to establish.', color: 'text-orange-400' },
  { stage: 'Ammonia ≈ 0, nitrite high', meaning: 'Stage 2 peak: Conversion of NH₃ → NO₂ working. Waiting on Nitrospira.', color: 'text-red-400' },
  { stage: 'Nitrite dropping, nitrate rising', meaning: 'Stage 3: Nearly cycled. Nitrospira converting NO₂ → NO₃.', color: 'text-green-400' },
  { stage: 'Ammonia = 0, nitrite = 0, nitrate rising', meaning: '✅ Cycled. Add ammonia dose and retest in 24h to confirm.', color: 'text-green-400' },
]

interface CycleAssessment {
  stage: CycleStage
  label: string
  color: string
  action: string
  daysElapsed?: number
  estimatedDaysLeft?: number
}

function assessCycle(ammonia: number, nitrite: number, nitrate: number): CycleAssessment {
  if (ammonia < 0.25 && nitrite < 0.25 && nitrate > 5) {
    return {
      stage: 'complete',
      label: '✅ Cycle Complete',
      color: 'text-green-400',
      action: 'Perform a large water change to bring nitrate below 20 ppm, then add your fish slowly. Continue monitoring for 1 week.',
    }
  }
  if (nitrate > 0 && nitrite > 0 && ammonia < 0.5) {
    return {
      stage: 'nitrate_rise',
      label: '📈 Stage 3 — Nearly There',
      color: 'text-cyan-400',
      action: 'Nitrospira bacteria are converting nitrite to nitrate. Keep dosing ammonia to 2 ppm daily. Expect completion in 3–10 days.',
      estimatedDaysLeft: 7,
    }
  }
  if (nitrite > 1 && ammonia < 1) {
    return {
      stage: 'nitrite_rise',
      label: '⚡ Stage 2 — Nitrite Spike',
      color: 'text-orange-400',
      action: 'Nitrite spike is normal and necessary. Do NOT do a water change unless fish are present. Keep dosing ammonia. Wait for Nitrospira to colonize.',
      estimatedDaysLeft: 14,
    }
  }
  return {
    stage: 'ammonia_rise',
    label: '🧫 Stage 1 — Ammonia Phase',
    color: 'text-amber-400',
    action: 'Ammonia is building up. Dose to 2–4 ppm and wait. Nitrosomonas bacteria will begin colonizing within 3–7 days.',
    estimatedDaysLeft: 21,
  }
}

export default function CyclingCalculator() {
  const [method, setMethod] = useState<CycleMethod>('fishless_ammonia')
  const [tankLitres, setTankLitres] = useState<string>('100')
  const [usGallons, setUsGallons] = useState(false)
  const [ammoniaReading, setAmmoniaReading] = useState<string>('')
  const [nitriteReading, setNitriteReading] = useState<string>('')
  const [nitrateReading, setNitrateReading] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [showDoseCalc, setShowDoseCalc] = useState(false)
  const [ammoniaConcentration, setAmmoniaConcentration] = useState<string>('10') // % pure ammonia

  const assessment = useMemo<CycleAssessment | null>(() => {
    const nh3 = parseFloat(ammoniaReading)
    const no2 = parseFloat(nitriteReading)
    const no3 = parseFloat(nitrateReading)
    if (isNaN(nh3) || isNaN(no2) || isNaN(no3)) return null
    return assessCycle(nh3, no2, no3)
  }, [ammoniaReading, nitriteReading, nitrateReading])

  const ammoniaDose = useMemo(() => {
    const litres = usGallons ? parseFloat(tankLitres) * 3.785 : parseFloat(tankLitres)
    const pct = parseFloat(ammoniaConcentration) / 100
    if (isNaN(litres) || litres <= 0 || isNaN(pct) || pct <= 0) return null
    // To achieve 2 ppm (2 mg/L) in tank:
    // volume_ml = target_ppm * tank_litres / (ammonia_pct * 10000)
    // Simplified: ml = (2 * litres) / (pct * 1000000 / 1000)
    // = 2 * litres / (pct * 1000)
    const mlFor2ppm = (2 * litres) / (pct * 1000)
    const mlFor4ppm = mlFor2ppm * 2
    return { mlFor2ppm, mlFor4ppm }
  }, [tankLitres, usGallons, ammoniaConcentration])

  const methodInfo = METHOD_DESCRIPTIONS[method]
  const today = new Date()
  const start = startDate ? new Date(startDate) : null
  const daysElapsed = start ? Math.floor((today.getTime() - start.getTime()) / 86400000) : null

  return (
    <div className="space-y-6">
      {/* Method selector */}
      <div>
        <label className="block text-xs font-semibold text-spawn-muted-text mb-3 uppercase tracking-wide">
          Cycling Method
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(METHOD_DESCRIPTIONS) as CycleMethod[]).map((m) => {
            const info = METHOD_DESCRIPTIONS[m]
            return (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  method === m
                    ? 'bg-spawn-cyan/10 border-spawn-cyan/50'
                    : 'bg-spawn-surface border-spawn-border hover:border-spawn-cyan/30'
                }`}
              >
                <div className={`font-semibold text-sm ${method === m ? 'text-spawn-cyan' : 'text-spawn-text'}`}>
                  {info.title}
                </div>
                <div className="text-xs text-spawn-muted-text mt-1">
                  {info.days[0]}–{info.days[1]} days typical
                </div>
              </button>
            )
          })}
        </div>

        {/* Method detail */}
        <div className="mt-4 rounded-xl border border-spawn-border/30 bg-spawn-surface/20 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-green-400 mb-2">✅ Advantages</div>
              <ul className="space-y-1">
                {methodInfo.pros.map((p) => <li key={p} className="text-xs text-spawn-muted-text">• {p}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-red-400 mb-2">⚠️ Considerations</div>
              <ul className="space-y-1">
                {methodInfo.cons.map((c) => <li key={c} className="text-xs text-spawn-muted-text">• {c}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tank size + start date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">Tank Volume</label>
          <div className="flex gap-2">
            <input title="Calculator input" aria-label="Calculator input"
              type="number" value={tankLitres}
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
        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">
            Cycle Start Date (optional)
          </label>
          <input title="Calculator input" aria-label="Calculator input"
            type="date" value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
          />
          {daysElapsed !== null && daysElapsed >= 0 && (
            <p className="text-xs text-spawn-muted-text mt-1">Day {daysElapsed + 1} of your cycle</p>
          )}
        </div>
      </div>

      {/* Test readings */}
      <div>
        <label className="block text-xs font-semibold text-spawn-muted-text mb-3 uppercase tracking-wide">
          Today's Test Readings
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Ammonia (ppm)', value: ammoniaReading, setter: setAmmoniaReading, color: 'text-amber-400' },
            { label: 'Nitrite (ppm)', value: nitriteReading, setter: setNitriteReading, color: 'text-orange-400' },
            { label: 'Nitrate (ppm)', value: nitrateReading, setter: setNitrateReading, color: 'text-cyan-400' },
          ].map(({ label, value, setter, color }) => (
            <div key={label}>
              <div className={`text-xs font-semibold mb-1 ${color}`}>{label}</div>
              <input title="Calculator input" aria-label="Calculator input"
                type="number" value={value}
                onChange={(e) => setter(e.target.value)}
                min="0" step="0.25"
                placeholder="0.00"
                className="w-full px-3 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors text-center"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Cycle assessment */}
      {assessment && (
        <div className={`rounded-xl border p-4 ${
          assessment.stage === 'complete'
            ? 'border-green-500/40 bg-green-500/10'
            : assessment.stage === 'nitrate_rise'
            ? 'border-cyan-500/40 bg-cyan-500/10'
            : assessment.stage === 'nitrite_rise'
            ? 'border-orange-500/40 bg-orange-500/10'
            : 'border-amber-500/40 bg-amber-500/10'
        }`}>
          <div className={`font-bold text-sm mb-2 ${assessment.color}`}>{assessment.label}</div>
          <p className="text-sm text-spawn-text leading-relaxed">{assessment.action}</p>
          {assessment.estimatedDaysLeft && (
            <p className="text-xs text-spawn-muted-text mt-2">
              Estimated {assessment.estimatedDaysLeft} days remaining at ideal conditions.
            </p>
          )}
        </div>
      )}

      {/* Ammonia dosing calculator */}
      {method === 'fishless_ammonia' && (
        <div className="rounded-xl border border-spawn-border/50 bg-spawn-surface/30 p-5">
          <button
            onClick={() => setShowDoseCalc((v) => !v)}
            className="flex items-center justify-between w-full text-sm font-bold text-spawn-text"
          >
            <span>🧪 Ammonia Dose Calculator</span>
            <span className="text-spawn-muted-text">{showDoseCalc ? '▲' : '▼'}</span>
          </button>
          {showDoseCalc && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-spawn-muted-text mb-1">Ammonia Concentration (%)</label>
                <div className="flex gap-2 items-center">
                  <input title="Calculator input" aria-label="Calculator input"
                    type="number"
                    value={ammoniaConcentration}
                    onChange={(e) => setAmmoniaConcentration(e.target.value)}
                    min="1" max="30" step="0.5"
                    className="w-28 px-3 py-2 rounded-lg bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors text-sm"
                  />
                  <span className="text-xs text-spawn-muted-text">Dr. Tim's Ammonium Chloride = 10%, ACE Hardware janitorial = 10%</span>
                </div>
              </div>
              {ammoniaDose && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-spawn-bg/40 rounded-lg p-3">
                    <div className="text-xs text-spawn-muted-text mb-1">To reach 2 ppm</div>
                    <div className="text-xl font-black text-spawn-cyan">{ammoniaDose.mlFor2ppm.toFixed(2)} mL</div>
                    <div className="text-xs text-spawn-muted-text">Starting dose</div>
                  </div>
                  <div className="bg-spawn-bg/40 rounded-lg p-3">
                    <div className="text-xs text-spawn-muted-text mb-1">To reach 4 ppm</div>
                    <div className="text-xl font-black text-amber-400">{ammoniaDose.mlFor4ppm.toFixed(2)} mL</div>
                    <div className="text-xs text-spawn-muted-text">High-feed simulation</div>
                  </div>
                </div>
              )}
              <p className="text-xs text-spawn-muted-text">
                Use a 1 mL syringe for accurate dosing. Always use pure ammonia with no surfactants — test by shaking: should not foam.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stage reference */}
      <div className="rounded-xl border border-spawn-border/30 bg-spawn-surface/20 p-4">
        <h4 className="text-xs font-bold text-spawn-muted-text uppercase tracking-wide mb-3">Cycle Stage Reference</h4>
        <div className="space-y-2">
          {READING_INTERPRETATIONS.map((r) => (
            <div key={r.stage} className="flex items-start gap-2">
              <span className={`text-xs font-mono font-semibold shrink-0 mt-0.5 ${r.color}`}>→</span>
              <div className="text-xs">
                <span className="text-spawn-text font-medium">{r.stage}: </span>
                <span className="text-spawn-muted-text">{r.meaning}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
