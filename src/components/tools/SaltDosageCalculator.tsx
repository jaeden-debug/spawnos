'use client'

import { useState, useMemo } from 'react'

type SaltType = 'aquarium_salt' | 'marine_salt' | 'epsom' | 'kosher'
type Purpose = 'disease' | 'electrolytes' | 'marine' | 'brackish' | 'transport'

const SALT_PURPOSES: Record<Purpose, { label: string; description: string; types: SaltType[] }> = {
  disease: {
    label: 'Disease Treatment (Ich, Nitrite)',
    description: 'Aquarium salt to treat ich, reduce nitrite toxicity, or support healing. Use non-iodized aquarium salt only.',
    types: ['aquarium_salt', 'kosher'],
  },
  electrolytes: {
    label: 'Electrolyte Support',
    description: 'Low-dose salt to support osmoregulation in freshwater fish recovering from disease or stress.',
    types: ['aquarium_salt'],
  },
  marine: {
    label: 'Marine / Full Saltwater',
    description: 'Prepare saltwater at specific gravity 1.020–1.026 for marine aquariums.',
    types: ['marine_salt'],
  },
  brackish: {
    label: 'Brackish Water',
    description: 'Prepare brackish water at SG 1.003–1.015 for mollies, archer fish, mudskippers, and fiddler crabs.',
    types: ['marine_salt', 'aquarium_salt'],
  },
  transport: {
    label: 'Shipping / Transport Bag',
    description: 'Reduce osmotic stress and slow ammonia toxicity during fish transport.',
    types: ['aquarium_salt', 'kosher'],
  },
}

interface DoseProtocol {
  label: string
  gPerLitre: number
  specificGravity?: number
  duration?: string
  warning?: string
}

const DISEASE_PROTOCOLS: DoseProtocol[] = [
  { label: 'Preventive / Stress relief', gPerLitre: 1, duration: 'Ongoing at this dose is safe for most species', warning: undefined },
  { label: 'Mild ich treatment / nitrite reduction', gPerLitre: 3, duration: '7–10 days; do water changes to dilute', warning: 'May stress sensitive species (scaleless fish, loaches, tetras)' },
  { label: 'Moderate ich treatment', gPerLitre: 5, duration: '5–7 days; monitor fish closely', warning: 'Not safe for scaleless fish, loaches, or Corydoras. Bettas tolerate briefly.' },
  { label: 'Hospital tank / heavy treatment', gPerLitre: 10, duration: '3–5 days only; not for planted tanks', warning: 'High stress dose. Only for durable species (goldfish, livebearers). Lethal to scaleless fish.' },
]

const MARINE_PROTOCOLS = [
  { label: 'FOWLR (Fish Only)', sg: 1.021, salinity_ppt: 27, gPerLitre: 34 },
  { label: 'Standard Reef (NSW)', sg: 1.025, salinity_ppt: 35, gPerLitre: 37 },
  { label: 'High-end Reef (NSW+)', sg: 1.026, salinity_ppt: 36, gPerLitre: 38 },
  { label: 'Brackish Light (mollies, fiddler crabs)', sg: 1.005, salinity_ppt: 7, gPerLitre: 9 },
  { label: 'Brackish Medium (archer fish)', sg: 1.010, salinity_ppt: 14, gPerLitre: 18 },
  { label: 'Brackish Heavy (mudskippers)', sg: 1.015, salinity_ppt: 20, gPerLitre: 26 },
]

const SENSITIVE_SPECIES = [
  'Corydoras (scaleless)', 'Loaches (Kuhli, Hillstream)', 'Tetras', 'Discus',
  'Shrimp (ALL species — never use salt with shrimp)', 'Planted tanks (kills most plants at >2 g/L)',
  'Axolotl', 'African dwarf frog',
]

const TOLERANT_SPECIES = [
  'Goldfish (tolerates up to 10 g/L temporarily)',
  'Guppy / Molly / Platy (hard water livebearers)',
  'Betta (tolerates 1–3 g/L)',
  'Cichlids (most species)',
  'Oscar',
]

export default function SaltDosageCalculator() {
  const [tankLitres, setTankLitres] = useState<string>('100')
  const [usGallons, setUsGallons] = useState(false)
  const [purpose, setPurpose] = useState<Purpose>('disease')
  const [saltType, setSaltType] = useState<SaltType>('aquarium_salt')
  const [selectedProtocol, setSelectedProtocol] = useState<number>(0)
  const [currentSalinity, setCurrentSalinity] = useState<string>('0')
  const [targetSG, setTargetSG] = useState<string>('1.025')

  const litres = useMemo(() => {
    const v = parseFloat(tankLitres)
    if (isNaN(v) || v <= 0) return 0
    return usGallons ? v * 3.785 : v
  }, [tankLitres, usGallons])

  const isMarine = purpose === 'marine' || purpose === 'brackish'

  const freshwaterResult = useMemo(() => {
    if (isMarine || litres <= 0) return null
    const protocol = DISEASE_PROTOCOLS[selectedProtocol]
    const currentSaltEquivalent = parseFloat(currentSalinity) || 0
    const targetGPerL = protocol.gPerLitre
    const additionalGPerL = Math.max(0, targetGPerL - currentSaltEquivalent)
    return {
      protocol,
      totalGrams: Math.ceil(targetGPerL * litres),
      additionalGrams: Math.ceil(additionalGPerL * litres),
      tablespoons: (additionalGPerL * litres / 6).toFixed(1), // ~6g per tsp of aquarium salt
      teaspoons: (additionalGPerL * litres / 2).toFixed(1),
    }
  }, [isMarine, litres, selectedProtocol, currentSalinity])

  const marineResult = useMemo(() => {
    if (!isMarine || litres <= 0) return null
    const targetSGVal = parseFloat(targetSG)
    if (isNaN(targetSGVal)) return null
    // Approximate: salinity (ppt) ≈ (SG - 1) × 1305
    const targetPPT = (targetSGVal - 1) * 1305
    const gPerLitre = targetPPT * 0.97 // ~97% of ppt value in grams (accounting for hydration)
    return {
      totalGrams: Math.ceil(gPerLitre * litres),
      targetSG: targetSGVal,
      targetPPT: targetPPT.toFixed(1),
      gPerLitre: gPerLitre.toFixed(1),
    }
  }, [isMarine, litres, targetSG])

  return (
    <div className="space-y-6">
      {/* Tank size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">Tank Volume</label>
          <div className="flex gap-2">
            <input
              type="number" value={tankLitres} onChange={(e) => setTankLitres(e.target.value)}
              min="1"
              className="flex-1 px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
            />
            <button
              onClick={() => setUsGallons(v => !v)}
              className="px-4 py-3 rounded-xl border border-spawn-border bg-spawn-surface text-spawn-muted-text hover:text-spawn-text transition-all text-sm font-medium"
            >
              {usGallons ? 'gal' : 'L'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">Purpose</label>
          <select
            value={purpose} onChange={(e) => setPurpose(e.target.value as Purpose)}
            className="w-full px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors text-sm"
          >
            {(Object.keys(SALT_PURPOSES) as Purpose[]).map((p) => (
              <option key={p} value={p}>{SALT_PURPOSES[p].label}</option>
            ))}
          </select>
          <p className="text-xs text-spawn-muted-text mt-1 leading-relaxed">{SALT_PURPOSES[purpose].description}</p>
        </div>
      </div>

      {/* Freshwater protocol selector */}
      {!isMarine && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">Dose Level</label>
            <div className="space-y-2">
              {DISEASE_PROTOCOLS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedProtocol(i)}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                    selectedProtocol === i
                      ? 'bg-spawn-cyan/10 border-spawn-cyan/50'
                      : 'bg-spawn-surface border-spawn-border hover:border-spawn-cyan/30'
                  }`}
                >
                  <div className={`font-semibold ${selectedProtocol === i ? 'text-spawn-cyan' : 'text-spawn-text'}`}>
                    {p.label} — {p.gPerLitre} g/L
                  </div>
                  <div className="text-xs text-spawn-muted-text mt-0.5">{p.duration}</div>
                  {p.warning && (
                    <div className="text-xs text-amber-400 mt-0.5">⚠️ {p.warning}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">
              Current Salt Level (g/L) — enter 0 if none
            </label>
            <input
              type="number" value={currentSalinity} onChange={(e) => setCurrentSalinity(e.target.value)}
              min="0" max="20" step="0.5"
              className="w-full sm:w-48 px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
            />
          </div>

          {freshwaterResult && litres > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Salt to Add', value: `${freshwaterResult.additionalGrams}g`, sub: 'to reach target dose' },
                { label: 'Target Total in Tank', value: `${freshwaterResult.totalGrams}g`, sub: `at ${freshwaterResult.protocol.gPerLitre} g/L` },
                { label: '≈ Tablespoons', value: freshwaterResult.tablespoons, sub: 'approx (aquarium salt)' },
                { label: '≈ Teaspoons', value: freshwaterResult.teaspoons, sub: 'approx (aquarium salt)' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-spawn-surface/50 border border-spawn-border/50 rounded-xl p-4">
                  <div className="text-xs text-spawn-muted-text mb-1">{label}</div>
                  <div className="text-xl font-black text-spawn-cyan">{value}</div>
                  <div className="text-xs text-spawn-muted-text/70 mt-0.5">{sub}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Marine section */}
      {isMarine && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-spawn-muted-text mb-3 uppercase tracking-wide">Quick Presets</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MARINE_PROTOCOLS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setTargetSG(p.sg.toFixed(3))}
                  className={`text-left p-3 rounded-xl border text-sm transition-all ${
                    targetSG === p.sg.toFixed(3)
                      ? 'bg-spawn-cyan/10 border-spawn-cyan/50'
                      : 'bg-spawn-surface border-spawn-border hover:border-spawn-cyan/30'
                  }`}
                >
                  <div className={`font-semibold text-sm ${targetSG === p.sg.toFixed(3) ? 'text-spawn-cyan' : 'text-spawn-text'}`}>
                    {p.label}
                  </div>
                  <div className="text-xs text-spawn-muted-text">SG {p.sg} · {p.salinity_ppt} ppt · ~{p.gPerLitre} g/L</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">Target Specific Gravity</label>
            <input
              type="number" value={targetSG} onChange={(e) => setTargetSG(e.target.value)}
              min="1.001" max="1.030" step="0.001"
              className="w-full sm:w-48 px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
            />
          </div>

          {marineResult && litres > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Salt Required', value: `${marineResult.totalGrams.toLocaleString()}g`, sub: 'to add to RO/DI water' },
                { label: 'Target SG', value: marineResult.targetSG.toFixed(3), sub: 'at 25°C (refractometer)' },
                { label: 'Target Salinity', value: `${marineResult.targetPPT} ppt`, sub: 'parts per thousand' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-spawn-surface/50 border border-spawn-border/50 rounded-xl p-4">
                  <div className="text-xs text-spawn-muted-text mb-1">{label}</div>
                  <div className="text-xl font-black text-spawn-cyan">{value}</div>
                  <div className="text-xs text-spawn-muted-text/70 mt-0.5">{sub}</div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-spawn-surface/30 border border-spawn-border/30 rounded-xl p-4 text-xs text-spawn-muted-text">
            <strong className="text-spawn-text">Marine mixing protocol:</strong> Always add salt mix to RO/DI water, not tap water.
            Mix in a separate bucket with a powerhead for 30–60 minutes before measuring SG. Use a calibrated refractometer
            calibrated with distilled water. Swing-arm hydrometers are inaccurate for precision reef work.
          </div>
        </div>
      )}

      {/* Species warnings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2">⚠️ Sensitive — Use with Extreme Caution</h4>
          <ul className="space-y-1">
            {SENSITIVE_SPECIES.map((s) => (
              <li key={s} className="text-xs text-spawn-muted-text">• {s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
          <h4 className="text-xs font-bold text-green-400 uppercase tracking-wide mb-2">✅ Salt-Tolerant Species</h4>
          <ul className="space-y-1">
            {TOLERANT_SPECIES.map((s) => (
              <li key={s} className="text-xs text-spawn-muted-text">• {s}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
