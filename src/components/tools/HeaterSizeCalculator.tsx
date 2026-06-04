'use client'

import { useState, useMemo } from 'react'

const HEATER_BRANDS = [
  { name: 'Fluval E Series', wattOptions: [50, 100, 200, 300], reliability: 'Excellent', notes: 'Electronic with LCD display, accurate ±0.5°C' },
  { name: 'Eheim Jäger', wattOptions: [25, 50, 75, 100, 150, 200, 250, 300], reliability: 'Excellent', notes: 'German-made, TruTemp dial, highly reliable long-term' },
  { name: 'Inkbird IBS-M2', wattOptions: [300, 500], reliability: 'Good', notes: 'External controller with probe, very accurate digital control' },
  { name: 'Aquael Ultra', wattOptions: [50, 75, 100, 150, 200], reliability: 'Good', notes: 'Dual protection, good accuracy' },
]

interface HeaterResult {
  wattsNeeded: number
  recommendedSingle: number
  recommendedDual: number
  wattPerLitre: number
  suggestedHeaters: { name: string; watt: number; qty: number }[]
  warning: string | null
  energyCostMonthly: number
}

export default function HeaterSizeCalculator() {
  const [tankLitres, setTankLitres] = useState<string>('200')
  const [usGallons, setUsGallons] = useState(false)
  const [roomTemp, setRoomTemp] = useState<string>('20')
  const [targetTemp, setTargetTemp] = useState<string>('26')
  const [placement, setPlacement] = useState<'indoor' | 'basement' | 'garage'>('indoor')
  const [electricityRate, setElectricityRate] = useState<string>('0.15') // $/kWh

  const result = useMemo<HeaterResult | null>(() => {
    const litres = usGallons ? parseFloat(tankLitres) * 3.785 : parseFloat(tankLitres)
    const room = parseFloat(roomTemp)
    const target = parseFloat(targetTemp)
    const rate = parseFloat(electricityRate)

    if (isNaN(litres) || litres <= 0 || isNaN(room) || isNaN(target) || isNaN(rate)) return null
    if (target <= room) return null // no heating needed

    const delta = target - room

    // Watts needed: delta × litres × placement multiplier
    // Rule of thumb: 1W per litre per 1°C delta in temperate room
    // For cold rooms / garages, multiply by 1.5–2
    const placementMultiplier = placement === 'indoor' ? 1 : placement === 'basement' ? 1.4 : 2.0
    const rawWatts = delta * litres * placementMultiplier

    // Round up to standard wattage
    const standardWatts = [25, 50, 75, 100, 150, 200, 250, 300, 400, 500]
    const recommendedSingle = standardWatts.find((w) => w >= rawWatts) ?? 500
    const recommendedDual = standardWatts.find((w) => w >= rawWatts / 2) ?? 300

    // Suggest specific heaters
    const suggestedHeaters: HeaterResult['suggestedHeaters'] = []
    for (const brand of HEATER_BRANDS) {
      const singleMatch = brand.wattOptions.find((w) => w >= recommendedSingle)
      const dualMatch = brand.wattOptions.find((w) => w >= recommendedDual)
      if (singleMatch) {
        suggestedHeaters.push({ name: brand.name, watt: singleMatch, qty: 1 })
      } else if (dualMatch) {
        suggestedHeaters.push({ name: brand.name, watt: dualMatch, qty: 2 })
      }
      if (suggestedHeaters.length >= 3) break
    }

    // Energy cost: assume heater runs ~30% of the time to maintain temp
    const dutyFactor = placement === 'indoor' ? 0.3 : placement === 'basement' ? 0.45 : 0.65
    const wattsNominal = recommendedSingle
    const energyCostMonthly = (wattsNominal * dutyFactor * 720) / 1000 * rate // 720h per month

    let warning: string | null = null
    if (delta > 15) {
      warning = `A ${delta}°C temperature rise requires significant heating. Ensure the tank is well insulated and consider a backup heater to prevent temperature crashes during power outages.`
    } else if (rawWatts > 400 && litres < 200) {
      warning = `This configuration requires very high wattage relative to tank size. Consider whether room temperature can be raised, or if a tank cover/lid will reduce heat loss.`
    }

    return {
      wattsNeeded: Math.ceil(rawWatts),
      recommendedSingle,
      recommendedDual,
      wattPerLitre: rawWatts / litres,
      suggestedHeaters,
      warning,
      energyCostMonthly,
    }
  }, [tankLitres, usGallons, roomTemp, targetTemp, placement, electricityRate])

  const noHeatNeeded = (() => {
    const target = parseFloat(targetTemp)
    const room = parseFloat(roomTemp)
    return !isNaN(target) && !isNaN(room) && target <= room
  })()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tank size */}
        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">
            Tank Volume
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={tankLitres}
              onChange={(e) => setTankLitres(e.target.value)}
              min="1"
              className="flex-1 px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
              placeholder={usGallons ? 'gallons' : 'litres'}
            />
            <button
              onClick={() => setUsGallons((v) => !v)}
              className="px-4 py-3 rounded-xl border border-spawn-border bg-spawn-surface text-spawn-muted-text hover:text-spawn-text transition-all text-sm font-medium"
            >
              {usGallons ? 'gal' : 'L'}
            </button>
          </div>
        </div>

        {/* Placement */}
        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">
            Tank Location
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'indoor', label: 'Indoor', sub: 'Heated home' },
              { value: 'basement', label: 'Basement', sub: 'Cooler space' },
              { value: 'garage', label: 'Garage', sub: 'Unheated' },
            ].map(({ value, label, sub }) => (
              <button
                key={value}
                onClick={() => setPlacement(value as typeof placement)}
                className={`py-2 px-2 rounded-xl border text-xs transition-all ${
                  placement === value
                    ? 'bg-spawn-cyan/20 border-spawn-cyan/50 text-spawn-cyan'
                    : 'bg-spawn-surface border-spawn-border text-spawn-muted-text hover:border-spawn-cyan/30'
                }`}
              >
                <div className="font-semibold">{label}</div>
                <div className="opacity-70">{sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Room temp */}
        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">
            Room Temperature (°C)
          </label>
          <input
            type="number"
            value={roomTemp}
            onChange={(e) => setRoomTemp(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
          />
        </div>

        {/* Target temp */}
        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">
            Target Water Temperature (°C)
          </label>
          <input
            type="number"
            value={targetTemp}
            onChange={(e) => setTargetTemp(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { label: 'Tropical', temp: '26' },
              { label: 'Discus', temp: '29' },
              { label: 'Goldfish', temp: '20' },
              { label: 'Shrimp', temp: '24' },
            ].map(({ label, temp }) => (
              <button
                key={label}
                onClick={() => setTargetTemp(temp)}
                className="text-xs px-2 py-1 rounded-lg border border-spawn-border bg-spawn-surface text-spawn-muted-text hover:text-spawn-text hover:border-spawn-cyan/30 transition-all"
              >
                {label} {temp}°C
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Electricity rate */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-spawn-muted-text whitespace-nowrap">Electricity Rate ($/kWh):</label>
        <input
          type="number"
          value={electricityRate}
          onChange={(e) => setElectricityRate(e.target.value)}
          step="0.01" min="0"
          className="w-28 px-3 py-2 rounded-lg bg-spawn-bg border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/60 transition-colors"
        />
        <span className="text-xs text-spawn-muted-text">US avg: $0.13–0.17/kWh</span>
      </div>

      {/* Results */}
      {noHeatNeeded ? (
        <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-green-400 text-sm">
          ✅ No heating required — your room temperature ({roomTemp}°C) already meets or exceeds the target.
          If you need cooling (for goldfish, axolotls, hillstream loaches), consider a fan or chiller unit.
        </div>
      ) : result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Watts Required', value: `${result.wattsNeeded}W`, sub: `${result.wattPerLitre.toFixed(1)}W/L` },
              { label: 'Single Heater', value: `${result.recommendedSingle}W`, sub: 'minimum single' },
              { label: 'Dual Heater Setup', value: `2× ${result.recommendedDual}W`, sub: 'redundancy recommended' },
              { label: 'Est. Monthly Cost', value: `$${result.energyCostMonthly.toFixed(2)}`, sub: 'at given rate' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-spawn-surface/50 border border-spawn-border/50 rounded-xl p-4">
                <div className="text-xs text-spawn-muted-text mb-1">{label}</div>
                <div className="text-xl font-black text-spawn-cyan">{value}</div>
                <div className="text-xs text-spawn-muted-text/70 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {result.warning && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-400 text-sm flex gap-3">
              <span>⚠️</span>
              <p>{result.warning}</p>
            </div>
          )}

          {/* Suggested heaters */}
          {result.suggestedHeaters.length > 0 && (
            <div className="rounded-xl border border-spawn-border/50 bg-spawn-surface/30 p-5">
              <h4 className="text-sm font-bold text-spawn-text mb-4">Recommended Heater Options</h4>
              <div className="space-y-3">
                {result.suggestedHeaters.map(({ name, watt, qty }, i) => {
                  const brand = HEATER_BRANDS.find((b) => b.name === name)
                  return (
                    <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-spawn-bg/40 border border-spawn-border/30">
                      <div>
                        <div className="text-spawn-text font-semibold text-sm">{name}</div>
                        <div className="text-xs text-spawn-muted-text mt-0.5">{brand?.notes}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-spawn-cyan font-bold">{qty}× {watt}W</div>
                        <div className={`text-xs mt-0.5 ${
                          brand?.reliability === 'Excellent' ? 'text-green-400' : 'text-amber-400'
                        }`}>{brand?.reliability}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-spawn-muted-text mt-3">
                💡 Pro tip: Running two heaters at half power each provides temperature redundancy.
                If one fails, the other maintains temperature. Critical for expensive fish.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
