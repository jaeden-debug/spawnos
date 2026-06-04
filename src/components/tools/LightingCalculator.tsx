'use client'

import { useState, useMemo } from 'react'

type TankShape = 'rectangle' | 'cube' | 'bowfront'
type PlantingLevel = 'none' | 'low' | 'medium' | 'high'
type LightUnit = 'par' | 'lux' | 'lumens'

interface SpeciesLightReq {
  name: string
  par: [number, number]
  category: string
  note: string
}

const PLANT_LIGHT_REQS: SpeciesLightReq[] = [
  { name: 'Java Fern / Anubias', par: [15, 50], category: 'Low light', note: 'Shade-tolerant epiphytes — melt in high light' },
  { name: 'Cryptocoryne spp.', par: [20, 60], category: 'Low light', note: 'Prefer subdued light; tolerate medium' },
  { name: 'Amazon Sword', par: [40, 80], category: 'Medium light', note: 'Needs moderate light + CO₂ for best growth' },
  { name: 'Vallisneria / Sagittaria', par: [30, 70], category: 'Medium light', note: 'Adaptable; better with medium+ light' },
  { name: 'Stem plants (Rotala, Ludwigia)', par: [50, 150], category: 'High light', note: 'Vibrant color requires 50+ PAR + CO₂' },
  { name: 'Glossostigma / HC Cuba (carpet)', par: [80, 200], category: 'High light', note: 'Demanding carpet plants — CO₂ mandatory' },
  { name: 'Bucephalandra', par: [20, 60], category: 'Low light', note: 'Low-light Borneo native; grows slowly' },
  { name: 'Floating plants (Salvinia, Pistia)', par: [20, 80], category: 'Variable', note: 'Surface floaters; reduce light for fish below' },
]

const FISH_LIGHT_PREFS = [
  { name: 'Blackwater species (Betta, Discus, Neon)', pref: 'Low', lux: '50–200', note: 'Native to shaded forest streams' },
  { name: 'Hillstream loach', pref: 'Moderate', lux: '200–500', note: 'Algae grazer; needs algae growth' },
  { name: 'Goldfish', pref: 'Moderate', lux: '200–600', note: 'Needs light cycle for circadian rhythm' },
  { name: 'Axolotl', pref: 'Very low', lux: '<100', note: 'No eyelids; bright light causes chronic stress' },
  { name: 'Marine reef fish', pref: 'Variable', lux: '1000+', note: 'Depends heavily on coral requirements' },
  { name: 'Community tropicals', pref: 'Moderate', lux: '150–400', note: 'Standard tropical community; 8–10h photoperiod' },
]

const LIGHT_FIXTURES = [
  { name: 'Fluval Plant 3.0', par_max: 179, coverage: '90×45 cm', co2_req: 'Recommended', price_range: '$$$', notes: 'App-controlled, sunrise/sunset, excellent PAR spread' },
  { name: 'Chihiros WRGB II', par_max: 180, coverage: '90×45 cm', co2_req: 'Recommended', price_range: '$$$', notes: 'Full spectrum, Bluetooth control, high PAR' },
  { name: 'Hygger Full Spectrum', par_max: 120, coverage: '60×30 cm', co2_req: 'Optional', price_range: '$$', notes: 'Budget-friendly; good for medium light tanks' },
  { name: 'Nicrew ClassicLED+', par_max: 80, coverage: '60×30 cm', co2_req: 'Not needed', price_range: '$', notes: 'Entry-level; adequate for low-light plants only' },
  { name: 'AI Prime HD (marine)', par_max: 300, coverage: '45×45 cm', co2_req: 'N/A', price_range: '$$$$', notes: 'Reef-grade; programmable spectrum for coral' },
  { name: 'Radion XR15 (reef)', par_max: 500, coverage: '60×60 cm', co2_req: 'N/A', price_range: '$$$$', notes: 'Professional reef lighting; EcoSmart Live app' },
]

function parToLux(par: number): number {
  // Rough conversion for typical LED spectrum: 1 PAR ≈ 54 lux (varies by spectrum)
  return Math.round(par * 54)
}

function luxToPar(lux: number): number {
  return Math.round(lux / 54)
}

function lumensToLux(lumens: number, areaSqM: number): number {
  return Math.round(lumens / areaSqM)
}

export default function LightingCalculator() {
  const [tankLength, setTankLength] = useState<string>('90')
  const [tankWidth, setTankWidth] = useState<string>('45')
  const [tankHeight, setTankHeight] = useState<string>('45')
  const [usGallons, setUsGallons] = useState(false)
  const [planting, setPlanting] = useState<PlantingLevel>('medium')
  const [hasCO2, setHasCO2] = useState(false)
  const [inputUnit, setInputUnit] = useState<LightUnit>('par')
  const [lightValue, setLightValue] = useState<string>('60')
  const [photoperiodHours, setPhotoperiodHours] = useState<string>('8')

  const dims = useMemo(() => {
    const l = parseFloat(tankLength)
    const w = parseFloat(tankWidth)
    const h = parseFloat(tankHeight)
    if (isNaN(l) || isNaN(w) || isNaN(h)) return null
    // If user entered gallons, convert to rough cm (rectangular approximation)
    return { l, w, h, areaSqM: (l / 100) * (w / 100), areaSqCm: l * w }
  }, [tankLength, tankWidth, tankHeight])

  const parAtSubstrate = useMemo(() => {
    const v = parseFloat(lightValue)
    if (isNaN(v)) return null
    if (inputUnit === 'par') return v
    if (inputUnit === 'lux') return luxToPar(v)
    // lumens → lux → par
    if (dims) return luxToPar(lumensToLux(v, dims.areaSqM))
    return null
  }, [lightValue, inputUnit, dims])

  const targetPAR: Record<PlantingLevel, [number, number]> = {
    none: [10, 40],
    low: [20, 60],
    medium: [50, 100],
    high: [80, 200],
  }

  const plantingLabels: Record<PlantingLevel, string> = {
    none: 'No Plants / Fish Only',
    low: 'Low Light Plants',
    medium: 'Medium Light Plants',
    high: 'High Light / Carpet Plants',
  }

  const plantingColors: Record<PlantingLevel, string> = {
    none: 'text-spawn-muted-text',
    low: 'text-blue-400',
    medium: 'text-green-400',
    high: 'text-amber-400',
  }

  const target = targetPAR[planting]
  const co2Adjustment = hasCO2 ? 0 : planting === 'high' ? 40 : planting === 'medium' ? 20 : 0
  const effectiveMin = target[0] + co2Adjustment
  const effectiveMax = target[1] + co2Adjustment

  const assessment = useMemo(() => {
    if (parAtSubstrate === null) return null
    if (parAtSubstrate < effectiveMin * 0.7) return { label: 'Too Dark', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/40', icon: '🌑', action: 'Increase light intensity or reduce depth. Add supplementary lighting.' }
    if (parAtSubstrate < effectiveMin) return { label: 'Slightly Low', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/40', icon: '🌙', action: 'Near the lower limit for your plant selection. Extend photoperiod to 10h or upgrade fixture.' }
    if (parAtSubstrate <= effectiveMax) return { label: 'Optimal', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/40', icon: '☀️', action: hasCO2 ? 'Excellent. CO₂ injection will allow plants to fully utilize this light.' : 'Good intensity. Adding CO₂ injection would significantly improve plant growth at this PAR.' }
    if (parAtSubstrate <= effectiveMax * 1.4) return { label: 'Slightly High', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/40', icon: '⚡', action: 'Risk of algae without CO₂ injection. Shorten photoperiod to 6–7h or add floating plants to reduce intensity.' }
    return { label: 'Too Bright — Algae Risk', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/40', icon: '🔥', action: 'High algae risk without CO₂. Reduce intensity, shorten photoperiod to 6h, or use floating plants as diffusers.' }
  }, [parAtSubstrate, effectiveMin, effectiveMax, hasCO2])

  const depthPenalty = dims ? Math.max(0, (dims.h - 30) / 30 * 0.3) : 0 // 30% loss per 30cm beyond 30cm depth

  return (
    <div className="space-y-6">
      {/* Tank dimensions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">Tank Dimensions (cm)</label>
          <button onClick={() => setUsGallons(v => !v)} className="text-xs text-spawn-cyan hover:underline">{usGallons ? 'Switch to cm' : 'Using cm'}</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Length', value: tankLength, setter: setTankLength },
            { label: 'Width', value: tankWidth, setter: setTankWidth },
            { label: 'Height', value: tankHeight, setter: setTankHeight },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <div className="text-xs text-spawn-muted-text mb-1">{label}</div>
              <input
                type="number" value={value} onChange={(e) => setter(e.target.value)}
                min="1"
                className="w-full px-3 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors text-center"
              />
            </div>
          ))}
        </div>
        {dims && (
          <p className="text-xs text-spawn-muted-text mt-2">
            Surface area: {dims.areaSqCm.toLocaleString()} cm² · {dims.areaSqM.toFixed(4)} m²
            {dims.h > 45 && <span className="text-amber-400 ml-2">⚠️ Deep tank — light penetration significantly reduced at substrate</span>}
          </p>
        )}
      </div>

      {/* Planting level + CO2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">Planting Level</label>
          <div className="space-y-2">
            {(Object.keys(plantingLabels) as PlantingLevel[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlanting(p)}
                className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  planting === p
                    ? `bg-spawn-surface border-spawn-cyan/50 ${plantingColors[p]} font-semibold`
                    : 'bg-spawn-surface border-spawn-border text-spawn-muted-text hover:border-spawn-cyan/30'
                }`}
              >
                {plantingLabels[p]}
                <span className="text-xs opacity-60 ml-2">{targetPAR[p][0]}–{targetPAR[p][1]} PAR</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">CO₂ Injection?</label>
            <div className="grid grid-cols-2 gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setHasCO2(v)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    hasCO2 === v
                      ? 'bg-spawn-cyan/20 border-spawn-cyan/50 text-spawn-cyan'
                      : 'bg-spawn-surface border-spawn-border text-spawn-muted-text hover:border-spawn-cyan/30'
                  }`}
                >
                  {v ? 'Yes — Injected CO₂' : 'No — Excel / None'}
                </button>
              ))}
            </div>
            {!hasCO2 && planting === 'high' && (
              <p className="text-xs text-red-400 mt-2">
                ⚠️ High-light plants without CO₂ injection will cause severe algae growth. Either add CO₂ or choose medium-light plants.
              </p>
            )}
          </div>

          {/* Photoperiod */}
          <div>
            <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">Photoperiod (hours/day)</label>
            <input
              type="number" value={photoperiodHours} onChange={(e) => setPhotoperiodHours(e.target.value)}
              min="4" max="16"
              className="w-full px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
            />
            <div className="flex gap-2 mt-2">
              {['6', '8', '10', '12'].map((h) => (
                <button
                  key={h}
                  onClick={() => setPhotoperiodHours(h)}
                  className={`flex-1 py-1 rounded-lg text-xs border transition-all ${
                    photoperiodHours === h
                      ? 'bg-spawn-cyan/20 border-spawn-cyan/50 text-spawn-cyan'
                      : 'bg-spawn-surface border-spawn-border text-spawn-muted-text hover:border-spawn-cyan/30'
                  }`}
                >{h}h</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Light reading input */}
      <div>
        <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">Your Light Reading</label>
        <div className="flex gap-3">
          <input
            type="number" value={lightValue} onChange={(e) => setLightValue(e.target.value)}
            min="0"
            className="flex-1 px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
            placeholder="Enter measured value"
          />
          <select
            value={inputUnit} onChange={(e) => setInputUnit(e.target.value as LightUnit)}
            className="px-3 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors text-sm"
          >
            <option value="par">PAR (µmol/m²/s)</option>
            <option value="lux">Lux</option>
            <option value="lumens">Lumens</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {parAtSubstrate !== null && assessment && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'PAR at Substrate', value: `${parAtSubstrate} µmol/m²/s`, sub: 'measured/converted' },
              { label: 'Approx Lux', value: parToLux(parAtSubstrate).toLocaleString(), sub: 'at substrate level' },
              { label: 'Target Range', value: `${effectiveMin}–${effectiveMax} PAR`, sub: `for ${plantingLabels[planting].toLowerCase()}` },
              { label: 'Daily Light Integral', value: `${((parAtSubstrate * parseFloat(photoperiodHours || '8') * 3600) / 1000000).toFixed(2)} mol/m²/d`, sub: 'DLI at photoperiod' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-spawn-surface/50 border border-spawn-border/50 rounded-xl p-4">
                <div className="text-xs text-spawn-muted-text mb-1">{label}</div>
                <div className="text-lg font-black text-spawn-cyan leading-tight">{value}</div>
                <div className="text-xs text-spawn-muted-text/70 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          <div className={`rounded-xl border p-4 ${assessment.bg}`}>
            <div className={`font-bold text-sm mb-1 ${assessment.color}`}>{assessment.icon} {assessment.label}</div>
            <p className="text-sm text-spawn-text leading-relaxed">{assessment.action}</p>
          </div>

          {depthPenalty > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-400">
              ⚠️ Deep tank ({tankHeight}cm): Estimated {Math.round(depthPenalty * 100)}% light loss before reaching substrate.
              PAR at light source is significantly higher than at substrate level. Consider using high-output fixtures or positioning plants near the surface.
            </div>
          )}
        </div>
      )}

      {/* Fixture recommendations */}
      <div className="rounded-xl border border-spawn-border/50 bg-spawn-surface/30 p-5">
        <h4 className="text-sm font-bold text-spawn-text mb-4">Recommended Fixtures by Use Case</h4>
        <div className="space-y-3">
          {LIGHT_FIXTURES.map((f) => (
            <div key={f.name} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-spawn-bg/40 border border-spawn-border/30">
              <div>
                <div className="text-spawn-text font-semibold text-sm">{f.name}</div>
                <div className="text-xs text-spawn-muted-text mt-0.5">{f.notes}</div>
                <div className="text-xs text-spawn-muted-text mt-0.5">Coverage: {f.coverage} · CO₂: {f.co2_req}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-spawn-cyan font-bold text-sm">{f.par_max} PAR max</div>
                <div className="text-xs text-spawn-muted-text">{f.price_range}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plant PAR reference */}
      <div className="rounded-xl border border-spawn-border/30 bg-spawn-surface/20 p-4">
        <h4 className="text-xs font-bold text-spawn-muted-text uppercase tracking-wide mb-3">Plant PAR Requirements</h4>
        <div className="space-y-2">
          {PLANT_LIGHT_REQS.map((p) => (
            <div key={p.name} className="flex items-center gap-3">
              <div className="w-24 shrink-0">
                <div className="h-1.5 rounded-full bg-spawn-border/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-spawn-cyan/60"
                    style={{ width: `${Math.min(100, (p.par[1] / 200) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex-1 text-xs">
                <span className="text-spawn-text font-medium">{p.name}</span>
                <span className="text-spawn-muted-text ml-2">{p.par[0]}–{p.par[1]} PAR · {p.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
