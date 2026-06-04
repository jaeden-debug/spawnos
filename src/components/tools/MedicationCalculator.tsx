'use client'

import { useState, useMemo } from 'react'

interface Medication {
  name: string
  activeIngredient: string
  targets: string[]
  standardDoseMgPerL: number
  standardDoseMlPer100L?: number
  halfDoseSpecies: string[]
  dangerous: string[]
  durationDays: number
  waterChangeDay: number
  notes: string
  removeCarbon: boolean
  category: 'antibiotic' | 'antifungal' | 'antiparasitic' | 'salt' | 'formalin'
}

const MEDICATIONS: Medication[] = [
  {
    name: 'Kanamycin Sulfate',
    activeIngredient: 'Kanamycin sulfate',
    targets: ['Columnaris', 'Popeye', 'Dropsy (Aeromonas)', 'Fin rot (bacterial)', 'Hemorrhagic septicemia'],
    standardDoseMgPerL: 50,
    halfDoseSpecies: ['Tetras', 'Corydoras', 'Shrimp — DO NOT USE'],
    dangerous: ['Shrimp', 'Snails', 'Beneficial bacteria (biological filter disruption)'],
    durationDays: 10,
    waterChangeDay: 3,
    notes: 'Most effective broad-spectrum antibiotic for gram-negative bacteria. Dose every 24–48h with 25% water change between doses.',
    removeCarbon: true,
    category: 'antibiotic',
  },
  {
    name: 'Metronidazole (Flagyl)',
    activeIngredient: 'Metronidazole',
    targets: ['Hexamita', 'Hole-in-the-Head (HITH)', 'Internal parasites', 'Bloat (anaerobic bacteria)'],
    standardDoseMgPerL: 5,
    halfDoseSpecies: [],
    dangerous: ['Invertebrates at high doses'],
    durationDays: 7,
    waterChangeDay: 2,
    notes: 'Best used for internal protozoan parasites. More effective when added to food (medicated food) than the water column.',
    removeCarbon: true,
    category: 'antiparasitic',
  },
  {
    name: 'Copper Sulfate',
    activeIngredient: 'Copper (Cu²⁺)',
    targets: ['Marine ich (Cryptocaryon)', 'Velvet (Amyloodinium)', 'External protozoa'],
    standardDoseMgPerL: 0.2,
    halfDoseSpecies: ['Freshwater fish — use with extreme care'],
    dangerous: ['ALL invertebrates — instantly lethal', 'Shrimp', 'Snails', 'Corals', 'Live rock'],
    durationDays: 21,
    waterChangeDay: 7,
    notes: 'Therapeutic copper level: 0.15–0.25 mg/L (free copper). MUST test with copper test kit — therapeutic window is very narrow. Requires copper test throughout treatment.',
    removeCarbon: true,
    category: 'antiparasitic',
  },
  {
    name: 'Ich-X / Kordon Rid-Ich+',
    activeIngredient: 'Formalin + malachite green',
    targets: ['Ich (Ichthyophthirius multifiliis)', 'Velvet', 'External fungal'],
    standardDoseMlPer100L: 5,
    standardDoseMgPerL: 0,
    halfDoseSpecies: ['Scaleless fish (loaches, corydoras) — half dose', 'Tetras — half dose'],
    dangerous: ['Biological filter (reduces temporarily)', 'Shrimp', 'Invertebrates'],
    durationDays: 10,
    waterChangeDay: 1,
    notes: 'Treat every 24–48h with partial water change between treatments. Raise temperature to 28°C to speed up ich life cycle and increase efficacy.',
    removeCarbon: true,
    category: 'antiparasitic',
  },
  {
    name: 'Nitrofurazone (Furan-2)',
    activeIngredient: 'Nitrofurazone',
    targets: ['Columnaris (primary)', 'Bacterial fin rot', 'Bacterial gill disease'],
    standardDoseMgPerL: 10,
    halfDoseSpecies: [],
    dangerous: ['Beneficial bacteria', 'Invertebrates', 'Shrimp'],
    durationDays: 5,
    waterChangeDay: 1,
    notes: 'Most effective against Columnaris specifically. Temperature matters — at 24°C+ Columnaris progresses rapidly; this medication slows progression. Very destructive to biological filter — hospital tank strongly recommended.',
    removeCarbon: true,
    category: 'antibiotic',
  },
  {
    name: 'Praziquantel',
    activeIngredient: 'Praziquantel',
    targets: ['Internal flukes (Dactylogyrus)', 'Gill flukes', 'Tapeworms', 'Turbellarians'],
    standardDoseMgPerL: 2.5,
    halfDoseSpecies: [],
    dangerous: ['Invertebrates (some sensitivity)'],
    durationDays: 7,
    waterChangeDay: 7,
    notes: 'Generally safe, low toxicity to fish. Poorly soluble in water — dissolve in a small amount of ethanol first. Re-dose after 7 days water change to catch newly hatched flukes.',
    removeCarbon: true,
    category: 'antiparasitic',
  },
  {
    name: 'API General Cure',
    activeIngredient: 'Metronidazole + praziquantel',
    targets: ['Internal parasites', 'Hole-in-the-head', 'Flukes', 'Wasting disease'],
    standardDoseMgPerL: 0,
    standardDoseMlPer100L: 4.7,
    halfDoseSpecies: [],
    dangerous: ['Invertebrates', 'Scaleless fish at doubled doses'],
    durationDays: 5,
    waterChangeDay: 2,
    notes: 'Combination product — metronidazole handles protozoa/anaerobic bacteria; praziquantel handles flukes. Convenient for treating unknown internal parasites.',
    removeCarbon: true,
    category: 'antiparasitic',
  },
  {
    name: 'Doxycycline',
    activeIngredient: 'Doxycycline hyclate',
    targets: ['Mycobacteriosis (fish TB)', 'Columnaris', 'Bacterial ulcers'],
    standardDoseMgPerL: 8,
    halfDoseSpecies: [],
    dangerous: ['Seriously degrades biological filter'],
    durationDays: 14,
    waterChangeDay: 3,
    notes: 'Tetracycline antibiotic; most effective for Mycobacterium marinum. Hard water reduces efficacy — use RO water or hospital tank. Long treatment course required.',
    removeCarbon: true,
    category: 'antibiotic',
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  antibiotic: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  antifungal: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  antiparasitic: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  salt: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  formalin: 'text-red-400 bg-red-400/10 border-red-400/30',
}

export default function MedicationCalculator() {
  const [tankLitres, setTankLitres] = useState<string>('100')
  const [usGallons, setUsGallons] = useState(false)
  const [selectedMed, setSelectedMed] = useState<number>(0)
  const [halfDose, setHalfDose] = useState(false)
  const [excludeSubstrate, setExcludeSubstrate] = useState(true)

  const litres = useMemo(() => {
    const v = parseFloat(tankLitres)
    if (isNaN(v) || v <= 0) return 0
    const rawLitres = usGallons ? v * 3.785 : v
    return excludeSubstrate ? rawLitres * 0.9 : rawLitres // ~10% displacement for substrate/decor
  }, [tankLitres, usGallons, excludeSubstrate])

  const med = MEDICATIONS[selectedMed]
  const multiplier = halfDose ? 0.5 : 1

  const dose = useMemo(() => {
    if (litres <= 0) return null
    if (med.standardDoseMlPer100L && med.standardDoseMlPer100L > 0) {
      const ml = (med.standardDoseMlPer100L / 100) * litres * multiplier
      return { type: 'ml' as const, value: ml, display: `${ml.toFixed(2)} mL` }
    }
    const mg = med.standardDoseMgPerL * litres * multiplier
    return { type: 'mg' as const, value: mg, display: `${mg.toFixed(0)} mg` }
  }, [litres, med, multiplier])

  const treatmentSchedule = useMemo(() => {
    if (!dose) return []
    const days = []
    for (let d = 1; d <= med.durationDays; d++) {
      const isWC = d % med.waterChangeDay === 0
      const isDose = !isWC || d === 1
      days.push({ day: d, dose: isDose, waterChange: isWC })
    }
    return days
  }, [dose, med])

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-400 text-sm">
        <strong>Important:</strong> Always quarantine sick fish before treating. Medicating the display tank
        destroys beneficial bacteria and harms invertebrates. When possible, treat in a dedicated hospital tank.
      </div>

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
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input type="checkbox" checked={excludeSubstrate} onChange={(e) => setExcludeSubstrate(e.target.checked)} className="accent-spawn-cyan" />
            <span className="text-xs text-spawn-muted-text">Subtract ~10% for substrate/decor displacement</span>
          </label>
          {litres > 0 && (
            <p className="text-xs text-spawn-muted-text mt-1">Effective treatment volume: <span className="text-spawn-cyan font-semibold">{litres.toFixed(1)} L</span></p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">Dose Adjustment</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setHalfDose(false)}
              className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                !halfDose ? 'bg-spawn-cyan/20 border-spawn-cyan/50 text-spawn-cyan' : 'bg-spawn-surface border-spawn-border text-spawn-muted-text'
              }`}
            >
              Full Dose
            </button>
            <button
              onClick={() => setHalfDose(true)}
              className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                halfDose ? 'bg-amber-400/20 border-amber-400/50 text-amber-400' : 'bg-spawn-surface border-spawn-border text-spawn-muted-text'
              }`}
            >
              Half Dose
            </button>
          </div>
          <p className="text-xs text-spawn-muted-text mt-1">Use half dose for sensitive species (scaleless fish, tetras, loaches)</p>
        </div>
      </div>

      {/* Medication selector */}
      <div>
        <label className="block text-xs font-semibold text-spawn-muted-text mb-3 uppercase tracking-wide">Select Medication</label>
        <div className="space-y-2">
          {MEDICATIONS.map((m, i) => (
            <button
              key={m.name}
              onClick={() => setSelectedMed(i)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedMed === i
                  ? 'bg-spawn-surface border-spawn-cyan/50'
                  : 'bg-spawn-surface/50 border-spawn-border hover:border-spawn-cyan/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`font-bold text-sm ${selectedMed === i ? 'text-spawn-cyan' : 'text-spawn-text'}`}>{m.name}</span>
                  <span className="text-xs text-spawn-muted-text ml-2">({m.activeIngredient})</span>
                  <div className="text-xs text-spawn-muted-text mt-1">{m.targets.slice(0, 3).join(', ')}{m.targets.length > 3 ? ' + more' : ''}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${CATEGORY_COLORS[m.category]}`}>
                  {m.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dosing results */}
      {dose && litres > 0 && (
        <div className="space-y-4">
          {/* Main dose */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2 sm:col-span-1 bg-spawn-surface/50 border border-spawn-cyan/30 rounded-xl p-4">
              <div className="text-xs text-spawn-muted-text mb-1">Single Dose</div>
              <div className="text-2xl font-black text-spawn-cyan">{dose.display}</div>
              <div className="text-xs text-spawn-muted-text/70 mt-0.5">{halfDose ? 'half dose' : 'full dose'}</div>
            </div>
            <div className="bg-spawn-surface/50 border border-spawn-border/50 rounded-xl p-4">
              <div className="text-xs text-spawn-muted-text mb-1">Treatment Duration</div>
              <div className="text-2xl font-black text-spawn-text">{med.durationDays} days</div>
            </div>
            <div className="bg-spawn-surface/50 border border-spawn-border/50 rounded-xl p-4">
              <div className="text-xs text-spawn-muted-text mb-1">Water Change Every</div>
              <div className="text-2xl font-black text-spawn-text">{med.waterChangeDay} days</div>
            </div>
            <div className={`rounded-xl p-4 border ${med.removeCarbon ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <div className="text-xs text-spawn-muted-text mb-1">Activated Carbon</div>
              <div className={`text-sm font-bold ${med.removeCarbon ? 'text-red-400' : 'text-green-400'}`}>
                {med.removeCarbon ? '⛔ Remove First' : '✅ Can Leave In'}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-spawn-surface/30 border border-spawn-border/40 rounded-xl p-4">
            <h4 className="text-xs font-bold text-spawn-muted-text uppercase tracking-wide mb-2">Treatment Notes</h4>
            <p className="text-sm text-spawn-text leading-relaxed">{med.notes}</p>
          </div>

          {/* Treatment schedule */}
          <div className="rounded-xl border border-spawn-border/50 bg-spawn-surface/30 p-5">
            <h4 className="text-sm font-bold text-spawn-text mb-4">Treatment Schedule</h4>
            <div className="flex flex-wrap gap-2">
              {treatmentSchedule.map(({ day, dose: doDose, waterChange }) => (
                <div
                  key={day}
                  className={`w-10 h-10 rounded-lg border flex flex-col items-center justify-center text-xs font-bold ${
                    doDose && waterChange
                      ? 'bg-amber-400/20 border-amber-400/50 text-amber-400'
                      : doDose
                      ? 'bg-spawn-cyan/20 border-spawn-cyan/50 text-spawn-cyan'
                      : 'bg-blue-400/20 border-blue-400/30 text-blue-400'
                  }`}
                >
                  <span>{day}</span>
                  <span className="text-[9px] leading-none">{doDose && waterChange ? 'D+WC' : doDose ? 'Dose' : 'WC'}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3">
              {[
                { color: 'bg-spawn-cyan/20 border-spawn-cyan/50 text-spawn-cyan', label: 'Dose day' },
                { color: 'bg-blue-400/20 border-blue-400/30 text-blue-400', label: 'Water change' },
                { color: 'bg-amber-400/20 border-amber-400/50 text-amber-400', label: 'Dose + water change' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded border text-xs flex items-center justify-center ${color}`} />
                  <span className="text-xs text-spawn-muted-text">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {(med.dangerous.length > 0 || med.halfDoseSpecies.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {med.dangerous.length > 0 && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2">⛔ Dangerous To</h4>
                  <ul className="space-y-1">
                    {med.dangerous.map((s) => <li key={s} className="text-xs text-spawn-muted-text">• {s}</li>)}
                  </ul>
                </div>
              )}
              {med.halfDoseSpecies.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2">⚠️ Half Dose For</h4>
                  <ul className="space-y-1">
                    {med.halfDoseSpecies.map((s) => <li key={s} className="text-xs text-spawn-muted-text">• {s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
