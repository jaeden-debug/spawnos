'use client'

import { useState, useMemo } from 'react'

interface WaterChangeResult {
  changeVolumeLitres: number
  changeVolumeGallons: number
  nitrateAfter: number
  changesPerWeekNeeded: number
  weeklyPct: number
  recommendation: string
  status: 'good' | 'warning' | 'danger'
}

export default function WaterChangeCalculator() {
  const [tankLitres, setTankLitres] = useState<string>('200')
  const [usGallons, setUsGallons] = useState(false)
  const [changePct, setChangePct] = useState<string>('25')
  const [currentNitrate, setCurrentNitrate] = useState<string>('40')
  const [targetNitrate, setTargetNitrate] = useState<string>('20')
  const [tapNitrate, setTapNitrate] = useState<string>('5')

  const result = useMemo<WaterChangeResult | null>(() => {
    const litres = usGallons
      ? parseFloat(tankLitres) * 3.785
      : parseFloat(tankLitres)
    const pct = parseFloat(changePct) / 100
    const no3Current = parseFloat(currentNitrate)
    const no3Target = parseFloat(targetNitrate)
    const no3Tap = parseFloat(tapNitrate)

    if (
      isNaN(litres) || litres <= 0 ||
      isNaN(pct) || pct <= 0 || pct > 1 ||
      isNaN(no3Current) || isNaN(no3Target) || isNaN(no3Tap)
    ) return null

    const changeVolumeLitres = litres * pct
    const changeVolumeGallons = changeVolumeLitres / 3.785

    // After one water change: new_nitrate = no3_current * (1 - pct) + no3_tap * pct
    const nitrateAfter = no3Current * (1 - pct) + no3Tap * pct

    // How many consecutive same-size changes to reach target?
    // After n changes: no3_n = (no3_current - no3_tap) * (1-pct)^n + no3_tap
    // Solve: no3_target = (no3_current - no3_tap) * (1-pct)^n + no3_tap
    // n = log((no3_target - no3_tap)/(no3_current - no3_tap)) / log(1-pct)
    let changesNeeded = 1
    if (no3Current > no3Target && no3Current !== no3Tap) {
      const ratio = (no3Target - no3Tap) / (no3Current - no3Tap)
      if (ratio > 0 && ratio < 1) {
        changesNeeded = Math.ceil(Math.log(ratio) / Math.log(1 - pct))
      }
    }

    // Maintenance: assuming 5 ppm nitrate production per week, how many changes at this % needed to stay at/below target?
    const weeklyNitrateLoad = 5 // ppm per week (rough average community tank)
    const reducedPerChange = no3Current * pct - no3Tap * pct
    const changesPerWeekNeeded = reducedPerChange > 0
      ? Math.ceil(weeklyNitrateLoad / reducedPerChange)
      : 1
    const weeklyPct = Math.min(pct * changesPerWeekNeeded * 100, 100)

    let recommendation: string
    let status: 'good' | 'warning' | 'danger'

    if (no3Current <= 20) {
      recommendation = 'Nitrate is in the safe zone. Maintain weekly changes at this percentage to keep it stable.'
      status = 'good'
    } else if (no3Current <= 40) {
      recommendation = `Current nitrate is elevated. ${changesNeeded} water change(s) at ${changePct}% will bring you near target. Then maintain weekly changes.`
      status = 'warning'
    } else {
      recommendation = `Nitrate is dangerously high — above 40 ppm stresses most species. Perform ${changesNeeded} large water changes immediately. Investigate stocking density, feeding frequency, and filtration capacity.`
      status = 'danger'
    }

    return {
      changeVolumeLitres,
      changeVolumeGallons,
      nitrateAfter,
      changesPerWeekNeeded,
      weeklyPct,
      recommendation,
      status,
    }
  }, [tankLitres, usGallons, changePct, currentNitrate, targetNitrate, tapNitrate])

  const statusColors = {
    good: 'border-green-500/40 bg-green-500/10 text-green-400',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    danger: 'border-red-500/40 bg-red-500/10 text-red-400',
  }

  return (
    <div className="space-y-6">
      {/* Tank Size + Unit Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              className="px-4 py-3 rounded-xl border border-spawn-border bg-spawn-surface text-spawn-muted-text hover:text-spawn-text hover:border-spawn-cyan/40 transition-all text-sm font-medium whitespace-nowrap"
            >
              {usGallons ? 'gal' : 'L'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">
            Change Percentage (%)
          </label>
          <input
            type="number"
            value={changePct}
            onChange={(e) => setChangePct(e.target.value)}
            min="1" max="100"
            className="w-full px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
          />
          {/* Quick presets */}
          <div className="flex gap-2 mt-2">
            {['10', '20', '25', '30', '50'].map((v) => (
              <button
                key={v}
                onClick={() => setChangePct(v)}
                className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-all ${
                  changePct === v
                    ? 'bg-spawn-cyan/20 border-spawn-cyan/50 text-spawn-cyan'
                    : 'bg-spawn-surface border-spawn-border text-spawn-muted-text hover:border-spawn-cyan/30'
                }`}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nitrate inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">
            Current Nitrate (ppm)
          </label>
          <input
            type="number"
            value={currentNitrate}
            onChange={(e) => setCurrentNitrate(e.target.value)}
            min="0"
            className="w-full px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">
            Target Nitrate (ppm)
          </label>
          <input
            type="number"
            value={targetNitrate}
            onChange={(e) => setTargetNitrate(e.target.value)}
            min="0"
            className="w-full px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wide">
            Tap Water Nitrate (ppm)
          </label>
          <input
            type="number"
            value={tapNitrate}
            onChange={(e) => setTapNitrate(e.target.value)}
            min="0"
            className="w-full px-4 py-3 rounded-xl bg-spawn-bg border border-spawn-border text-spawn-text focus:outline-none focus:border-spawn-cyan/60 transition-colors"
          />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 pt-2">
          {/* Main metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Volume to Remove',
                value: usGallons
                  ? `${result.changeVolumeGallons.toFixed(1)} gal`
                  : `${result.changeVolumeLitres.toFixed(1)} L`,
                sub: usGallons
                  ? `${result.changeVolumeLitres.toFixed(0)} litres`
                  : `${result.changeVolumeGallons.toFixed(1)} gal`,
              },
              {
                label: 'Nitrate After Change',
                value: `${result.nitrateAfter.toFixed(1)} ppm`,
                sub: parseFloat(currentNitrate) > result.nitrateAfter ? '↓ reduction' : '↑ tap is higher',
              },
              {
                label: 'Changes to Hit Target',
                value: `${Math.max(1, result.changesPerWeekNeeded)}×`,
                sub: 'consecutive changes',
              },
              {
                label: 'Recommended Weekly',
                value: `${result.weeklyPct.toFixed(0)}%`,
                sub: 'to stay at target',
              },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-spawn-surface/50 border border-spawn-border/50 rounded-xl p-4">
                <div className="text-xs text-spawn-muted-text mb-1">{label}</div>
                <div className="text-xl font-black text-spawn-cyan">{value}</div>
                <div className="text-xs text-spawn-muted-text/70 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div className={`rounded-xl border p-4 ${statusColors[result.status]}`}>
            <div className="flex items-start gap-3">
              <span className="text-lg">
                {result.status === 'good' ? '✅' : result.status === 'warning' ? '⚠️' : '🚨'}
              </span>
              <p className="text-sm leading-relaxed">{result.recommendation}</p>
            </div>
          </div>

          {/* Nitrate scale */}
          <div className="bg-spawn-surface/30 border border-spawn-border/30 rounded-xl p-4">
            <div className="text-xs font-semibold text-spawn-muted-text mb-3 uppercase tracking-wide">Nitrate Reference Scale</div>
            <div className="flex rounded-lg overflow-hidden h-3 mb-2">
              <div className="flex-1 bg-green-500/70" title="0–20 ppm safe" />
              <div className="w-1/4 bg-amber-500/70" title="20–40 ppm elevated" />
              <div className="w-1/4 bg-red-500/70" title="40+ ppm dangerous" />
            </div>
            <div className="flex justify-between text-xs text-spawn-muted-text">
              <span>0 ppm</span>
              <span className="text-green-400">0–20 safe</span>
              <span className="text-amber-400">20–40 elevated</span>
              <span className="text-red-400">40+ dangerous</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
