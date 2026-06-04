'use client'

import { useState, useMemo } from 'react'

type InputUnit = 'dgh' | 'ppm' | 'mmol'

const CONVERSIONS = {
  dgh_to_ppm: 17.848,   // 1 dGH = 17.848 ppm (mg/L CaCO3)
  dgh_to_mmol: 0.17848, // 1 dGH = 0.17848 mmol/L
}

function toPPM(value: number, unit: InputUnit): number {
  if (unit === 'ppm') return value
  if (unit === 'dgh') return value * CONVERSIONS.dgh_to_ppm
  return value / CONVERSIONS.dgh_to_mmol * CONVERSIONS.dgh_to_ppm // mmol → ppm
}

function fromPPM(ppm: number, unit: InputUnit): number {
  if (unit === 'ppm') return ppm
  if (unit === 'dgh') return ppm / CONVERSIONS.dgh_to_ppm
  return (ppm / CONVERSIONS.dgh_to_ppm) * CONVERSIONS.dgh_to_mmol
}

const HARDNESS_RANGES = [
  { label: 'Soft', dgh: [0, 3], color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
  { label: 'Moderately Soft', dgh: [3, 6], color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30' },
  { label: 'Slightly Hard', dgh: [6, 12], color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' },
  { label: 'Moderately Hard', dgh: [12, 18], color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  { label: 'Hard', dgh: [18, 25], color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
  { label: 'Very Hard', dgh: [25, Infinity], color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' },
]

const SPECIES_REFERENCES = [
  { name: 'Discus / Wild Betta', gh: '0–3', kh: '0–2', note: 'Soft, acidic blackwater' },
  { name: 'Neon / Cardinal Tetra', gh: '2–6', kh: '1–4', note: 'Soft, slightly acidic' },
  { name: 'Guppy / Molly / Platy', gh: '10–20', kh: '8–15', note: 'Hard, alkaline preferred' },
  { name: 'Goldfish', gh: '8–18', kh: '4–12', note: 'Moderately hard, neutral–alkaline' },
  { name: 'Cherry / Neocaridina Shrimp', gh: '6–8', kh: '2–5', note: 'Optimal: GH 7–8 for molting' },
  { name: 'Crystal / Caridina Shrimp', gh: '4–6', kh: '0–2', note: 'Soft, slightly acidic; RO required' },
  { name: 'African Cichlids', gh: '15–25', kh: '10–20', note: 'Very hard, high alkalinity' },
  { name: 'Hillstream Loach', gh: '6–12', kh: '3–8', note: 'Moderate; high O2 more critical' },
]

function getHardnessCategory(dgh: number) {
  return HARDNESS_RANGES.find((r) => dgh >= r.dgh[0] && dgh < r.dgh[1]) ?? HARDNESS_RANGES[HARDNESS_RANGES.length - 1]
}

export default function GHKHConverter() {
  const [ghValue, setGhValue] = useState<string>('8')
  const [ghUnit, setGhUnit] = useState<InputUnit>('dgh')
  const [khValue, setKhValue] = useState<string>('4')
  const [khUnit, setKhUnit] = useState<InputUnit>('dgh')

  const ghResults = useMemo(() => {
    const v = parseFloat(ghValue)
    if (isNaN(v) || v < 0) return null
    const ppm = toPPM(v, ghUnit)
    const dgh = fromPPM(ppm, 'dgh')
    const mmol = fromPPM(ppm, 'mmol')
    return { ppm, dgh, mmol }
  }, [ghValue, ghUnit])

  const khResults = useMemo(() => {
    const v = parseFloat(khValue)
    if (isNaN(v) || v < 0) return null
    const ppm = toPPM(v, khUnit)
    const dgh = fromPPM(ppm, 'dgh')
    const mmol = fromPPM(ppm, 'mmol')
    return { ppm, dgh, mmol }
  }, [khValue, khUnit])

  const unitLabel = (u: InputUnit) => u === 'dgh' ? 'dGH/dKH' : u === 'ppm' ? 'ppm (mg/L)' : 'mmol/L'

  const ghCategory = ghResults ? getHardnessCategory(ghResults.dgh) : null
  const khCategory = khResults ? getHardnessCategory(khResults.dgh) : null

  return (
    <div className="space-y-6">
      {/* GH Section */}
      <div className="rounded-xl border border-spawn-border/50 bg-spawn-surface/30 p-5">
        <h3 className="text-sm font-bold text-spawn-text mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-spawn-cyan" />
          General Hardness (GH) — Calcium & Magnesium
        </h3>
        <div className="flex gap-3 mb-4">
          <input
            type="number"
            value={ghValue}
            onChange={(e) => setGhValue(e.target.value)}
            min="0"
            className="flex-1 px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
            placeholder="Enter value"
          />
          <select
            value={ghUnit}
            onChange={(e) => setGhUnit(e.target.value as InputUnit)}
            className="px-3 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors text-sm"
          >
            <option value="dgh">dGH</option>
            <option value="ppm">ppm</option>
            <option value="mmol">mmol/L</option>
          </select>
        </div>
        {ghResults && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'dGH', value: ghResults.dgh.toFixed(2) },
              { label: 'ppm (mg/L)', value: ghResults.ppm.toFixed(1) },
              { label: 'mmol/L', value: ghResults.mmol.toFixed(3) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-spawn-bg/50 rounded-lg p-3 text-center">
                <div className="text-lg font-black text-spawn-cyan">{value}</div>
                <div className="text-xs text-spawn-muted-text">{label}</div>
              </div>
            ))}
          </div>
        )}
        {ghCategory && ghResults && (
          <div className={`mt-3 px-3 py-2 rounded-lg border text-sm font-medium ${ghCategory.bg} ${ghCategory.border} ${ghCategory.color}`}>
            GH Classification: {ghCategory.label} ({ghResults.dgh.toFixed(1)} dGH)
          </div>
        )}
      </div>

      {/* KH Section */}
      <div className="rounded-xl border border-spawn-border/50 bg-spawn-surface/30 p-5">
        <h3 className="text-sm font-bold text-spawn-text mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-spawn-amber" />
          Carbonate Hardness (KH) — Buffering Capacity
        </h3>
        <div className="flex gap-3 mb-4">
          <input
            type="number"
            value={khValue}
            onChange={(e) => setKhValue(e.target.value)}
            min="0"
            className="flex-1 px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
            placeholder="Enter value"
          />
          <select
            value={khUnit}
            onChange={(e) => setKhUnit(e.target.value as InputUnit)}
            className="px-3 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors text-sm"
          >
            <option value="dgh">dKH</option>
            <option value="ppm">ppm</option>
            <option value="mmol">mmol/L</option>
          </select>
        </div>
        {khResults && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'dKH', value: khResults.dgh.toFixed(2) },
              { label: 'ppm (mg/L)', value: khResults.ppm.toFixed(1) },
              { label: 'mmol/L', value: khResults.mmol.toFixed(3) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-spawn-bg/50 rounded-lg p-3 text-center">
                <div className="text-lg font-black text-amber-400">{value}</div>
                <div className="text-xs text-spawn-muted-text">{label}</div>
              </div>
            ))}
          </div>
        )}
        {khCategory && khResults && (
          <div className={`mt-3 px-3 py-2 rounded-lg border text-sm font-medium ${khCategory.bg} ${khCategory.border} ${khCategory.color}`}>
            KH Classification: {khCategory.label} ({khResults.dgh.toFixed(1)} dKH)
          </div>
        )}
        {khResults && (
          <p className="mt-3 text-xs text-spawn-muted-text leading-relaxed">
            KH acts as a pH buffer. Below 3 dKH, pH crashes are common overnight in planted tanks.
            Above 8 dKH, pH is very stable but may be too high for soft-water species.
          </p>
        )}
      </div>

      {/* Species reference table */}
      <div className="rounded-xl border border-spawn-border/50 bg-spawn-surface/30 p-5">
        <h3 className="text-sm font-bold text-spawn-text mb-4">Species GH/KH Reference</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-spawn-border/30">
                <th className="text-left text-xs text-spawn-muted-text font-semibold pb-2">Species</th>
                <th className="text-center text-xs text-spawn-muted-text font-semibold pb-2">GH (dGH)</th>
                <th className="text-center text-xs text-spawn-muted-text font-semibold pb-2">KH (dKH)</th>
                <th className="text-left text-xs text-spawn-muted-text font-semibold pb-2 hidden sm:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {SPECIES_REFERENCES.map((row) => (
                <tr key={row.name} className="border-b border-spawn-border/20 last:border-0">
                  <td className="py-2 text-spawn-text font-medium">{row.name}</td>
                  <td className="py-2 text-center text-spawn-cyan font-mono">{row.gh}</td>
                  <td className="py-2 text-center text-amber-400 font-mono">{row.kh}</td>
                  <td className="py-2 text-spawn-muted-text text-xs hidden sm:table-cell">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
