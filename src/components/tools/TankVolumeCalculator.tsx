'use client'

import { useState } from 'react'

type Shape = 'rectangular' | 'cylinder' | 'hexagonal' | 'bowfront'

interface Result {
  grossGallons: number
  grossLitres: number
  netGallons: number
  netLitres: number
  substrateDisplacement: number
}

function roundTo(n: number, decimals: number) {
  return Math.round(n * 10 ** decimals) / 10 ** decimals
}

export default function TankVolumeCalculator() {
  const [shape, setShape] = useState<Shape>('rectangular')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [diameter, setDiameter] = useState('')
  const [substrateDepth, setSubstrateDepth] = useState('2')
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  function calculate() {
    setError('')
    setResult(null)

    const toInches = (v: string) => {
      const n = parseFloat(v)
      if (isNaN(n) || n <= 0) return null
      return unit === 'cm' ? n / 2.54 : n
    }

    const subIn = parseFloat(substrateDepth)
    if (isNaN(subIn) || subIn < 0) { setError('Invalid substrate depth.'); return }

    let grossCubicInches = 0

    if (shape === 'rectangular') {
      const l = toInches(length), w = toInches(width), h = toInches(height)
      if (!l || !w || !h) { setError('Enter valid length, width, and height.'); return }
      grossCubicInches = l * w * h
    } else if (shape === 'cylinder') {
      const d = toInches(diameter), h = toInches(height)
      if (!d || !h) { setError('Enter valid diameter and height.'); return }
      grossCubicInches = Math.PI * (d / 2) ** 2 * h
    } else if (shape === 'hexagonal') {
      const d = toInches(diameter), h = toInches(height)
      if (!d || !h) { setError('Enter valid diameter and height.'); return }
      // Regular hexagon: area = (3√3/2) * s² where s = d/2
      const s = d / 2
      grossCubicInches = (3 * Math.sqrt(3) / 2) * s ** 2 * h
    } else if (shape === 'bowfront') {
      // Bowfront: approximate as rectangular + ~15% volume for bow
      const l = toInches(length), w = toInches(width), h = toInches(height)
      if (!l || !w || !h) { setError('Enter valid length, width, and height.'); return }
      grossCubicInches = l * w * h * 1.12
    }

    const gallonsPerCubicInch = 0.004329
    const litresPerCubicInch = 0.016387

    const grossGallons = grossCubicInches * gallonsPerCubicInch
    const grossLitres = grossCubicInches * litresPerCubicInch

    // Substrate displacement: substrateDepth inches × footprint in cubic inches
    let footprintSqIn = 0
    if (shape === 'rectangular' || shape === 'bowfront') {
      const l = toInches(length)!, w = toInches(width)!
      footprintSqIn = l * w * (shape === 'bowfront' ? 1.12 : 1)
    } else if (shape === 'cylinder' || shape === 'hexagonal') {
      const d = toInches(diameter)!
      footprintSqIn = shape === 'cylinder'
        ? Math.PI * (d / 2) ** 2
        : (3 * Math.sqrt(3) / 2) * (d / 2) ** 2
    }

    const subDepthActual = unit === 'cm' ? subIn / 2.54 : subIn
    const subDisplacementCubicIn = footprintSqIn * subDepthActual
    const subDisplacementGal = subDisplacementCubicIn * gallonsPerCubicInch

    const netGallons = grossGallons - subDisplacementGal
    const netLitres = netGallons * 3.78541

    setResult({
      grossGallons: roundTo(grossGallons, 1),
      grossLitres: roundTo(grossLitres, 1),
      netGallons: roundTo(Math.max(0, netGallons), 1),
      netLitres: roundTo(Math.max(0, netLitres), 1),
      substrateDisplacement: roundTo(subDisplacementGal, 2),
    })
  }

  const labelClass = 'text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-1.5 block'
  const inputClass = 'w-full bg-spawn-surface border border-spawn-border rounded-lg px-3 py-2.5 text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/60 transition-colors'

  return (
    <div className="max-w-2xl">
      <div className="glass-card rounded-xl border border-spawn-border/50 p-6 space-y-5">
        {/* Unit + Shape */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Unit</label>
            <select className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value as 'inches' | 'cm')}>
              <option value="inches">Inches</option>
              <option value="cm">Centimetres</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Tank Shape</label>
            <select className={inputClass} value={shape} onChange={(e) => setShape(e.target.value as Shape)}>
              <option value="rectangular">Rectangular</option>
              <option value="cylinder">Cylinder</option>
              <option value="hexagonal">Hexagonal</option>
              <option value="bowfront">Bowfront (approx.)</option>
            </select>
          </div>
        </div>

        {/* Dimensions */}
        {(shape === 'rectangular' || shape === 'bowfront') && (
          <div className="grid grid-cols-3 gap-4">
            {[['Length', length, setLength], ['Width', width, setWidth], ['Height', height, setHeight]].map(([lbl, val, set]) => (
              <div key={lbl as string}>
                <label className={labelClass}>{lbl as string} ({unit === 'inches' ? 'in' : 'cm'})</label>
                <input type="number" min="0" step="0.5" className={inputClass} value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)} placeholder="0" />
              </div>
            ))}
          </div>
        )}
        {(shape === 'cylinder' || shape === 'hexagonal') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Diameter ({unit === 'inches' ? 'in' : 'cm'})</label>
              <input type="number" min="0" step="0.5" className={inputClass} value={diameter} onChange={(e) => setDiameter(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Height ({unit === 'inches' ? 'in' : 'cm'})</label>
              <input type="number" min="0" step="0.5" className={inputClass} value={height} onChange={(e) => setHeight(e.target.value)} placeholder="0" />
            </div>
          </div>
        )}

        {/* Substrate */}
        <div className="max-w-xs">
          <label className={labelClass}>Substrate Depth ({unit === 'inches' ? 'in' : 'cm'})</label>
          <input type="number" min="0" max="6" step="0.5" className={inputClass} value={substrateDepth} onChange={(e) => setSubstrateDepth(e.target.value)} />
          <p className="text-xs text-spawn-muted/50 mt-1">Deducted from gross volume for net water volume</p>
        </div>

        {error && <p className="text-spawn-rose text-sm">{error}</p>}

        <button
          onClick={calculate}
          className="w-full py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
        >
          Calculate Volume
        </button>
      </div>

      {result && (
        <div className="mt-6 glass-card rounded-xl border border-spawn-cyan/20 p-6">
          <h3 className="text-sm font-semibold text-spawn-cyan uppercase tracking-wide mb-4">Results</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-spawn-surface rounded-lg p-4">
              <div className="text-xs text-spawn-muted-text mb-1">Gross Volume</div>
              <div className="text-2xl font-black text-spawn-text">{result.grossGallons} <span className="text-sm font-normal">gal</span></div>
              <div className="text-sm text-spawn-muted-text">{result.grossLitres} L</div>
            </div>
            <div className="bg-spawn-cyan/5 border border-spawn-cyan/20 rounded-lg p-4">
              <div className="text-xs text-spawn-cyan mb-1">Net Water Volume</div>
              <div className="text-2xl font-black text-spawn-text">{result.netGallons} <span className="text-sm font-normal text-spawn-muted-text">gal</span></div>
              <div className="text-sm text-spawn-muted-text">{result.netLitres} L</div>
            </div>
          </div>
          {result.substrateDisplacement > 0 && (
            <p className="text-xs text-spawn-muted/60 mt-3">
              Substrate displaces approximately {result.substrateDisplacement} gallons of water volume.
              Use net volume for dosing calculations.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
