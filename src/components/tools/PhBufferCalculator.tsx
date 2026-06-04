'use client'

import { useState } from 'react'

type BufferType = 'baking-soda' | 'sodium-biphosphate' | 'crushed-coral' | 'peat'
type Direction = 'raise' | 'lower'

interface PhResult {
  direction: Direction
  bufferName: string
  dosePer10Gal: string
  totalDose: string
  applicationMethod: string
  safetyNote: string
  warnings: string[]
}

const BUFFER_INFO: Record<BufferType, { name: string; raisesOrLowers: Direction; dosePerPhUnitPer10Gal: number; unit: string; method: string; safety: string }> = {
  'baking-soda': {
    name: 'Sodium Bicarbonate (Baking Soda)',
    raisesOrLowers: 'raise',
    dosePerPhUnitPer10Gal: 0.5, // teaspoons per 0.1 pH unit per 10 gal (rough estimate)
    unit: 'teaspoons',
    method: 'Dissolve in a cup of tank water before adding to the aquarium. Add gradually over several hours. Never add dry directly to tank.',
    safety: 'Very safe. Also raises KH which improves pH stability. Do not exceed 0.2 pH units per day to avoid stressing fish.',
  },
  'sodium-biphosphate': {
    name: 'Sodium Biphosphate (pH Down)',
    raisesOrLowers: 'lower',
    dosePerPhUnitPer10Gal: 0.3,
    unit: 'teaspoons',
    method: 'Dissolve in dechlorinated water and add slowly to a high-flow area of the tank. Test pH 30 minutes after each dose.',
    safety: 'Effective but can cause rapid pH drops. Use caution in tanks with KH below 4 dKH — pH may crash. Preferred approach for soft-water tanks is RO water or peat filtering.',
  },
  'crushed-coral': {
    name: 'Crushed Coral / Aragonite',
    raisesOrLowers: 'raise',
    dosePerPhUnitPer10Gal: 100, // grams
    unit: 'grams',
    method: 'Place in a mesh bag in the filter flow. Dissolves slowly over weeks — best for gradual, sustained pH and KH elevation. Not suitable for rapid correction.',
    safety: 'Very safe, slow-acting. The gentlest method for raising pH. Particularly effective for maintaining pH stability in soft-water tanks prone to pH swings.',
  },
  'peat': {
    name: 'Peat Moss (in filter)',
    raisesOrLowers: 'lower',
    dosePerPhUnitPer10Gal: 150,
    unit: 'grams',
    method: 'Place in a mesh bag in the filter or use as substrate layer. Works very slowly over 1–2 weeks. Also tannins the water (brown tint — use activated carbon if you prefer clear water).',
    safety: 'Safe and natural. Results in a blackwater aesthetic. Best for gradual acidification in betta, neon tetra, or discus tanks. Not effective for large, rapid pH changes.',
  },
}

export default function PhBufferCalculator() {
  const [currentPh, setCurrentPh] = useState('')
  const [targetPh, setTargetPh] = useState('')
  const [tankVolume, setTankVolume] = useState('')
  const [bufferType, setBufferType] = useState<BufferType>('baking-soda')
  const [result, setResult] = useState<PhResult | null>(null)
  const [error, setError] = useState('')

  function calculate() {
    setError('')
    const current = parseFloat(currentPh)
    const target = parseFloat(targetPh)
    const volume = parseFloat(tankVolume)

    if (isNaN(current) || current < 4 || current > 10) { setError('Enter a valid current pH (4–10).'); return }
    if (isNaN(target) || target < 4 || target > 10) { setError('Enter a valid target pH (4–10).'); return }
    if (isNaN(volume) || volume <= 0) { setError('Enter a valid tank volume.'); return }
    if (current === target) { setError('Current and target pH are the same.'); return }

    const direction: Direction = target > current ? 'raise' : 'lower'
    const info = BUFFER_INFO[bufferType]

    if (info.raisesOrLowers !== direction) {
      setError(`${info.name} ${info.raisesOrLowers === 'raise' ? 'raises' : 'lowers'} pH, but you need to ${direction} pH. Please select a different buffer.`)
      return
    }

    const phDelta = Math.abs(target - current)
    const warnings: string[] = []

    if (phDelta > 1.0) {
      warnings.push(`Shifting pH by ${phDelta.toFixed(1)} units is a significant change. Make this adjustment over 3–7 days with multiple small doses to avoid shocking fish.`)
    }
    if (phDelta > 0.5) {
      warnings.push('Never change pH more than 0.2–0.3 units per day in a stocked tank.')
    }

    // Dose calculation — these are approximations based on typical product concentrations
    let rawDose: number
    const units10gal = info.unit

    if (bufferType === 'baking-soda') {
      // ~0.5 tsp raises pH ~0.1 in 10 gallons softish water
      rawDose = (phDelta / 0.1) * 0.5 * (volume / 10)
    } else if (bufferType === 'sodium-biphosphate') {
      rawDose = (phDelta / 0.1) * 0.3 * (volume / 10)
    } else if (bufferType === 'crushed-coral') {
      // ~100g per 10 gal over weeks provides approximately 0.5 pH units elevation
      rawDose = (phDelta / 0.5) * 100 * (volume / 10)
    } else {
      rawDose = (phDelta / 0.5) * 150 * (volume / 10)
    }

    const doseFormatted = rawDose < 1
      ? `${(rawDose).toFixed(2)} ${units10gal}`
      : `${rawDose.toFixed(1)} ${units10gal}`

    const dosePer10Gal = rawDose / (volume / 10)

    setResult({
      direction,
      bufferName: info.name,
      dosePer10Gal: `${dosePer10Gal.toFixed(1)} ${units10gal} per 10 gallons`,
      totalDose: `${doseFormatted} total (${volume} gallon tank)`,
      applicationMethod: info.method,
      safetyNote: info.safety,
      warnings,
    })
  }

  const inputClass = 'w-full bg-spawn-surface border border-spawn-border rounded-lg px-3 py-2.5 text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/60 transition-colors'
  const labelClass = 'text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-1.5 block'

  return (
    <div className="max-w-2xl">
      <div className="glass-card rounded-xl border border-spawn-border/50 p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Current pH</label>
            <input type="number" min="4" max="10" step="0.1" className={inputClass} value={currentPh} onChange={(e) => setCurrentPh(e.target.value)} placeholder="e.g. 7.8" />
          </div>
          <div>
            <label className={labelClass}>Target pH</label>
            <input type="number" min="4" max="10" step="0.1" className={inputClass} value={targetPh} onChange={(e) => setTargetPh(e.target.value)} placeholder="e.g. 7.0" />
          </div>
          <div>
            <label className={labelClass}>Volume (gallons)</label>
            <input type="number" min="1" className={inputClass} value={tankVolume} onChange={(e) => setTankVolume(e.target.value)} placeholder="e.g. 29" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Buffer Type</label>
          <select className={inputClass} value={bufferType} onChange={(e) => setBufferType(e.target.value as BufferType)}>
            <option value="baking-soda">Sodium Bicarbonate / Baking Soda (raises pH)</option>
            <option value="sodium-biphosphate">Sodium Biphosphate / pH Down (lowers pH)</option>
            <option value="crushed-coral">Crushed Coral / Aragonite (raises pH slowly)</option>
            <option value="peat">Peat Moss in filter (lowers pH slowly)</option>
          </select>
        </div>

        {error && <p className="text-spawn-rose text-sm">{error}</p>}

        <button
          onClick={calculate}
          className="w-full py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
        >
          Calculate Buffer Dose
        </button>
      </div>

      {result && (
        <div className="mt-6 glass-card rounded-xl border border-spawn-border/50 p-6 space-y-4">
          <div>
            <div className="text-xs text-spawn-muted-text mb-1">Buffer</div>
            <div className="font-bold text-spawn-text">{result.bufferName}</div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-spawn-cyan/5 border border-spawn-cyan/20 rounded-lg p-3">
              <div className="text-xs text-spawn-cyan mb-1">Total Dose</div>
              <div className="font-bold text-spawn-text">{result.totalDose}</div>
            </div>
            <div className="bg-spawn-surface rounded-lg p-3">
              <div className="text-xs text-spawn-muted-text mb-1">Per 10 Gallons</div>
              <div className="font-semibold text-spawn-text">{result.dosePer10Gal}</div>
            </div>
          </div>
          {result.warnings.map((w, i) => (
            <div key={i} className="text-sm text-spawn-amber flex gap-2"><span>⚠</span>{w}</div>
          ))}
          <div>
            <div className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-1.5">Application</div>
            <p className="text-sm text-spawn-muted-text leading-relaxed">{result.applicationMethod}</p>
          </div>
          <div className="bg-spawn-surface/50 rounded-lg p-3">
            <p className="text-xs text-spawn-muted/70 leading-relaxed">{result.safetyNote}</p>
          </div>
          <p className="text-xs text-spawn-muted/50">
            Doses are estimates based on average tap water buffering capacity. Always add in small increments and
            test pH 30–60 minutes after each dose. Actual results vary based on KH and existing buffering capacity.
          </p>
        </div>
      )}
    </div>
  )
}
