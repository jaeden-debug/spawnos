'use client'

import { useState } from 'react'
import { SPECIES_DATA } from '@/data/species'
import type { SpeciesData } from '@/types/species'

interface CompatResult {
  score: number
  verdict: 'Compatible' | 'Caution' | 'Incompatible'
  paramOverlap: { param: string; a: string; b: string; overlap: boolean }[]
  warnings: string[]
  notes: string[]
}

function rangeOverlap(aMin: number, aMax: number, bMin: number, bMax: number) {
  return Math.max(aMin, bMin) <= Math.min(aMax, bMax)
}

function checkCompatibility(a: SpeciesData, b: SpeciesData): CompatResult {
  const warnings: string[] = []
  const notes: string[] = []
  let score = 100

  const paramOverlap = [
    {
      param: 'Temperature °F',
      a: `${a.parameters.tempMin}–${a.parameters.tempMax}`,
      b: `${b.parameters.tempMin}–${b.parameters.tempMax}`,
      overlap: rangeOverlap(a.parameters.tempMin, a.parameters.tempMax, b.parameters.tempMin, b.parameters.tempMax),
    },
    {
      param: 'pH',
      a: `${a.parameters.phMin}–${a.parameters.phMax}`,
      b: `${b.parameters.phMin}–${b.parameters.phMax}`,
      overlap: rangeOverlap(a.parameters.phMin, a.parameters.phMax, b.parameters.phMin, b.parameters.phMax),
    },
    {
      param: 'GH dGH',
      a: `${a.parameters.ghMin}–${a.parameters.ghMax}`,
      b: `${b.parameters.ghMin}–${b.parameters.ghMax}`,
      overlap: rangeOverlap(a.parameters.ghMin, a.parameters.ghMax, b.parameters.ghMin, b.parameters.ghMax),
    },
  ]

  // Check parameter overlaps
  if (!paramOverlap[0].overlap) {
    score -= 40
    warnings.push(`Temperature ranges do not overlap. ${a.commonName} needs ${a.parameters.tempMin}–${a.parameters.tempMax}°F; ${b.commonName} needs ${b.parameters.tempMin}–${b.parameters.tempMax}°F. One species will be chronically stressed.`)
  }
  if (!paramOverlap[1].overlap) {
    score -= 35
    warnings.push(`pH ranges do not overlap. ${a.commonName} requires pH ${a.parameters.phMin}–${a.parameters.phMax}; ${b.commonName} requires pH ${b.parameters.phMin}–${b.parameters.phMax}. Impossible to satisfy both species simultaneously.`)
  }
  if (!paramOverlap[2].overlap) {
    score -= 15
    warnings.push(`GH (hardness) ranges do not overlap. ${a.commonName} needs GH ${a.parameters.ghMin}–${a.parameters.ghMax}; ${b.commonName} needs GH ${b.parameters.ghMin}–${b.parameters.ghMax}.`)
  }

  // Cross-check incompatibility lists
  const aIncompat = a.care.incompatibleWith.map((s) => s.toLowerCase())
  const bIncompat = b.care.incompatibleWith.map((s) => s.toLowerCase())

  const bInA = aIncompat.some((s) => s.includes(b.commonName.toLowerCase()) || b.commonName.toLowerCase().includes(s.split('(')[0].trim()))
  const aInB = bIncompat.some((s) => s.includes(a.commonName.toLowerCase()) || a.commonName.toLowerCase().includes(s.split('(')[0].trim()))

  if (bInA || aInB) {
    score -= 40
    warnings.push(`Direct incompatibility noted: ${bInA ? `${a.commonName} lists ${b.commonName} as incompatible.` : ''} ${aInB ? `${b.commonName} lists ${a.commonName} as incompatible.` : ''}`.trim())
  }

  // Check compatible lists for positive signal
  const aCompat = a.care.compatibleWith.map((s) => s.toLowerCase())
  const bCompat = b.care.compatibleWith.map((s) => s.toLowerCase())

  const bPositiveInA = aCompat.some((s) => s.includes(b.commonName.toLowerCase()) || b.commonName.toLowerCase().includes(s.split(' ')[0]))
  const aPositiveInB = bCompat.some((s) => s.includes(a.commonName.toLowerCase()) || a.commonName.toLowerCase().includes(s.split(' ')[0]))

  if (bPositiveInA) notes.push(`${a.commonName} is documented as compatible with ${b.commonName}.`)
  if (aPositiveInB) notes.push(`${b.commonName} is documented as compatible with ${a.commonName}.`)

  // Same family check
  if (a.family === b.family && a.family !== 'Callichthyidae') {
    if (a.slug !== b.slug) {
      score -= 10
      notes.push(`Both species belong to family ${a.family}. Same-family pairs can trigger territorial behaviour, particularly in males.`)
    }
  }

  // Tank size check
  const minTank = Math.max(a.care.tankSizeRecommended, b.care.tankSizeRecommended)
  notes.push(`Recommended minimum tank: ${minTank} gallons to house both species comfortably.`)

  score = Math.max(0, Math.min(100, score))

  const verdict: CompatResult['verdict'] =
    score >= 70 ? 'Compatible' : score >= 40 ? 'Caution' : 'Incompatible'

  return { score, verdict, paramOverlap, warnings, notes }
}

export default function CompatibilityChecker() {
  const [speciesA, setSpeciesA] = useState('')
  const [speciesB, setSpeciesB] = useState('')
  const [result, setResult] = useState<CompatResult | null>(null)

  function check() {
    if (!speciesA || !speciesB || speciesA === speciesB) return
    const a = SPECIES_DATA.find((s) => s.slug === speciesA)
    const b = SPECIES_DATA.find((s) => s.slug === speciesB)
    if (a && b) setResult(checkCompatibility(a, b))
  }

  const selectClass = 'w-full bg-spawn-surface border border-spawn-border rounded-lg px-3 py-2.5 text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/60 transition-colors'
  const labelClass = 'text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-1.5 block'

  const verdictStyle = result ? {
    Compatible: 'border-spawn-emerald/30 bg-spawn-emerald/5 text-spawn-emerald',
    Caution: 'border-spawn-amber/30 bg-spawn-amber/5 text-spawn-amber',
    Incompatible: 'border-spawn-rose/30 bg-spawn-rose/5 text-spawn-rose',
  }[result.verdict] : ''

  return (
    <div className="max-w-2xl">
      <div className="glass-card rounded-xl border border-spawn-border/50 p-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className={labelClass}>Species A</label>
            <select className={selectClass} value={speciesA} onChange={(e) => setSpeciesA(e.target.value)}>
              <option value="">Select species...</option>
              {SPECIES_DATA.map((s) => (
                <option key={s.slug} value={s.slug}>{s.commonName} ({s.scientificName})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Species B</label>
            <select className={selectClass} value={speciesB} onChange={(e) => setSpeciesB(e.target.value)}>
              <option value="">Select species...</option>
              {SPECIES_DATA.filter((s) => s.slug !== speciesA).map((s) => (
                <option key={s.slug} value={s.slug}>{s.commonName} ({s.scientificName})</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={check}
          disabled={!speciesA || !speciesB}
          className="w-full py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check Compatibility
        </button>
      </div>

      {result && (
        <div className={`mt-6 glass-card rounded-xl border p-6 ${verdictStyle}`}>
          <div className="flex items-center justify-between mb-5">
            <div className="text-xl font-black">{result.verdict}</div>
            <div className="text-right">
              <div className="text-3xl font-black">{result.score}</div>
              <div className="text-xs text-spawn-muted-text">/ 100</div>
            </div>
          </div>

          {/* Score bar */}
          <div className="score-bar mb-5">
            <div
              className="score-bar-fill"
              style={{
                width: `${result.score}%`,
                background: result.score >= 70 ? '#10b981' : result.score >= 40 ? '#f59e0b' : '#f43f5e',
              }}
            />
          </div>

          {/* Parameter overlap */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-3">Parameter Overlap</div>
            <div className="space-y-2">
              {result.paramOverlap.map((p) => (
                <div key={p.param} className="flex items-center gap-3 text-sm">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${p.overlap ? 'bg-spawn-emerald/20' : 'bg-spawn-rose/20'}`}>
                    {p.overlap
                      ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    }
                  </span>
                  <span className="text-spawn-muted-text w-28 text-xs">{p.param}</span>
                  <span className="text-spawn-text text-xs">{p.a}</span>
                  <span className="text-spawn-muted/40 text-xs">vs</span>
                  <span className="text-spawn-text text-xs">{p.b}</span>
                </div>
              ))}
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-spawn-rose uppercase tracking-wide mb-2">Warnings</div>
              <ul className="space-y-1.5">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-spawn-muted-text">⚠ {w}</li>
                ))}
              </ul>
            </div>
          )}

          {result.notes.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-2">Notes</div>
              <ul className="space-y-1.5">
                {result.notes.map((n, i) => (
                  <li key={i} className="text-sm text-spawn-muted-text">• {n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
