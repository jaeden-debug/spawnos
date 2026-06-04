'use client'

import { useState } from 'react'
import { SPECIES_DATA } from '@/data/species'

export default function TemperatureConverter() {
  const [fahrenheit, setFahrenheit] = useState('')
  const [celsius, setCelsius] = useState('')

  function fromF(val: string) {
    setFahrenheit(val)
    const f = parseFloat(val)
    if (!isNaN(f)) setCelsius(((f - 32) * 5 / 9).toFixed(1))
    else setCelsius('')
  }

  function fromC(val: string) {
    setCelsius(val)
    const c = parseFloat(val)
    if (!isNaN(c)) setFahrenheit((c * 9 / 5 + 32).toFixed(1))
    else setFahrenheit('')
  }

  const inputClass = 'w-full bg-spawn-surface border border-spawn-border rounded-lg px-3 py-3 text-spawn-text text-lg font-bold focus:outline-none focus:border-spawn-cyan/60 transition-colors'
  const labelClass = 'text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-1.5 block'

  const currentF = parseFloat(fahrenheit)

  return (
    <div className="max-w-2xl space-y-6">
      {/* Converter */}
      <div className="glass-card rounded-xl border border-spawn-border/50 p-6">
        <div className="grid sm:grid-cols-2 gap-6 items-center">
          <div>
            <label className={labelClass}>Fahrenheit (°F)</label>
            <input type="number" step="0.1" className={inputClass} value={fahrenheit} onChange={(e) => fromF(e.target.value)} placeholder="76" />
          </div>
          <div className="hidden sm:flex items-center justify-center text-spawn-muted-text text-2xl font-black">⇄</div>
          <div>
            <label className={labelClass}>Celsius (°C)</label>
            <input type="number" step="0.1" className={inputClass} value={celsius} onChange={(e) => fromC(e.target.value)} placeholder="24.4" />
          </div>
        </div>
        {!isNaN(currentF) && fahrenheit && (
          <div className="mt-4 pt-4 border-t border-spawn-border/30 text-sm text-spawn-muted-text">
            {currentF < 60 && <span className="text-spawn-rose">⚠ Too cold for most tropical freshwater fish.</span>}
            {currentF >= 60 && currentF < 72 && <span className="text-spawn-amber">Subtropical range — suitable for danios, white cloud minnows, goldfish.</span>}
            {currentF >= 72 && currentF <= 82 && <span className="text-spawn-emerald">Ideal tropical range — suitable for most community freshwater fish.</span>}
            {currentF > 82 && currentF <= 86 && <span className="text-spawn-amber">Warm tropical — suited to discus, German Blue Rams, chocolate gouramis.</span>}
            {currentF > 86 && <span className="text-spawn-rose">⚠ Too warm for most species. Dissolved oxygen is critically low at this temperature.</span>}
          </div>
        )}
      </div>

      {/* Quick reference */}
      <div>
        <h2 className="text-lg font-bold text-spawn-text mb-4">Species Temperature Reference</h2>
        <div className="overflow-x-auto rounded-xl border border-spawn-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-spawn-surface/80 border-b border-spawn-border/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">Species</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">Min °F / °C</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">Max °F / °C</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">Ideal °F</th>
              </tr>
            </thead>
            <tbody>
              {SPECIES_DATA.map((s, i) => {
                const p = s.parameters
                const idealF = Math.round((p.tempMin + p.tempMax) / 2)
                return (
                  <tr key={s.slug} className={`border-b border-spawn-border/30 ${i % 2 === 0 ? '' : 'bg-spawn-surface/10'}`}>
                    <td className="px-4 py-3 font-medium text-spawn-text">{s.commonName}</td>
                    <td className="text-center px-4 py-3 text-spawn-muted-text">
                      {p.tempMin}°F / {Math.round((p.tempMin - 32) * 5/9)}°C
                    </td>
                    <td className="text-center px-4 py-3 text-spawn-muted-text">
                      {p.tempMax}°F / {Math.round((p.tempMax - 32) * 5/9)}°C
                    </td>
                    <td className="text-center px-4 py-3 font-semibold text-spawn-text">{idealF}°F</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
