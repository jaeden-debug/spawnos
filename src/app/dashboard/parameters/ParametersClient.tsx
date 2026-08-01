'use client'

import { useState, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface ParameterReading {
  id: string
  date: string
  tank: string
  ph: number | null
  ammonia: number | null
  nitrite: number | null
  nitrate: number | null
  temp: number | null
  gh: number | null
  kh: number | null
  notes: string
}

interface TrendPoint {
  date: string
  value: number
}

// ─── Storage helpers (localStorage for now — replace with Supabase) ──────────
const STORAGE_KEY = 'spawnos_param_logs'

function loadReadings(): ParameterReading[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveReadings(readings: ParameterReading[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readings))
}

// ─── Status helpers ──────────────────────────────────────────────────────────
function getParamStatus(param: string, value: number | null): 'ok' | 'warn' | 'danger' | 'unknown' {
  if (value === null) return 'unknown'
  const ranges: Record<string, [number, number, number, number]> = {
    ph:       [5.5, 6.0, 8.5, 9.0],
    ammonia:  [0,   0,   0.25, 0.5],
    nitrite:  [0,   0,   0.1,  0.25],
    nitrate:  [0,   0,   20,   40],
    temp:     [18,  20,  28,   32],
    gh:       [2,   4,   20,   25],
    kh:       [1,   2,   12,   15],
  }
  const r = ranges[param]
  if (!r) return 'unknown'
  const [dangerLow, warnLow, warnHigh, dangerHigh] = r
  if (value < dangerLow || value > dangerHigh) return 'danger'
  if (value < warnLow || value > warnHigh) return 'warn'
  return 'ok'
}

const STATUS_COLORS = {
  ok: 'text-green-400',
  warn: 'text-amber-400',
  danger: 'text-red-400',
  unknown: 'text-spawn-muted-text',
}

const STATUS_BG = {
  ok: 'bg-green-400/10 border-green-400/25',
  warn: 'bg-amber-400/10 border-amber-400/25',
  danger: 'bg-red-400/10 border-red-400/25',
  unknown: 'bg-spawn-surface/50 border-spawn-border/40',
}

// ─── Mini sparkline ──────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: TrendPoint[]; color: string }) {
  if (data.length < 2) return <div className="h-8 w-20 opacity-30 text-xs text-spawn-muted-text flex items-center">No trend</div>
  const vals = data.map((d) => d.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const w = 80
  const h = 32
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((d.value - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-spawn-cyan/10 border border-spawn-cyan/20 flex items-center justify-center mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-spawn-cyan"/>
        </svg>
      </div>
      <h3 className="text-lg font-bold text-spawn-text mb-2">Log your first test</h3>
      <p className="text-spawn-muted-text text-sm mb-6 max-w-sm leading-relaxed">
        Add a parameter reading after every water test. Spot trends before they become problems.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-2.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
      >
        Log First Reading
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ParameterLogPage() {
  const [readings, setReadings] = useState<ParameterReading[]>([])
  const [showForm, setShowForm] = useState(false)
  const [tanks, setTanks] = useState<string[]>(['Main Tank'])
  const [activeTab, setActiveTab] = useState<'log' | 'trends'>('log')
  const [filterTank, setFilterTank] = useState<string>('all')

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    tank: 'Main Tank',
    ph: '',
    ammonia: '',
    nitrite: '',
    nitrate: '',
    temp: '',
    gh: '',
    kh: '',
    notes: '',
  })

  useEffect(() => {
    const stored = loadReadings()
    setReadings(stored)
    const allTanks = [...new Set(stored.map((r) => r.tank))]
    if (allTanks.length > 0) setTanks(allTanks)
  }, [])

  function parseNum(val: string): number | null {
    const n = parseFloat(val)
    return isNaN(n) ? null : n
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const reading: ParameterReading = {
      id: `log-${Date.now()}`,
      date: form.date,
      tank: form.tank,
      ph: parseNum(form.ph),
      ammonia: parseNum(form.ammonia),
      nitrite: parseNum(form.nitrite),
      nitrate: parseNum(form.nitrate),
      temp: parseNum(form.temp),
      gh: parseNum(form.gh),
      kh: parseNum(form.kh),
      notes: form.notes,
    }
    const updated = [reading, ...readings]
    setReadings(updated)
    saveReadings(updated)

    const allTanks = [...new Set(updated.map((r) => r.tank))]
    setTanks(allTanks)
    setShowForm(false)
    setForm({ ...form, ph: '', ammonia: '', nitrite: '', nitrate: '', temp: '', gh: '', kh: '', notes: '', date: new Date().toISOString().split('T')[0] })
  }

  function deleteReading(id: string) {
    const updated = readings.filter((r) => r.id !== id)
    setReadings(updated)
    saveReadings(updated)
  }

  const filtered = filterTank === 'all' ? readings : readings.filter((r) => r.tank === filterTank)
  const latest = filtered[0]

  function getTrend(param: keyof ParameterReading): TrendPoint[] {
    return filtered
      .filter((r) => r[param] !== null)
      .slice(0, 14)
      .reverse()
      .map((r) => ({ date: r.date, value: r[param] as number }))
  }

  const PARAMS = [
    { key: 'ph' as const, label: 'pH', unit: '', color: '#00d4ff' },
    { key: 'ammonia' as const, label: 'Ammonia', unit: 'ppm', color: '#ff6b6b' },
    { key: 'nitrite' as const, label: 'Nitrite', unit: 'ppm', color: '#ff8c42' },
    { key: 'nitrate' as const, label: 'Nitrate', unit: 'ppm', color: '#f59e0b' },
    { key: 'temp' as const, label: 'Temp', unit: '°C', color: '#a78bfa' },
    { key: 'gh' as const, label: 'GH', unit: 'dGH', color: '#34d399' },
    { key: 'kh' as const, label: 'KH', unit: 'dKH', color: '#60a5fa' },
  ]

  const inputClass = 'bg-spawn-surface border border-spawn-border rounded-lg px-3 py-2 text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors w-full'
  const labelClass = 'text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-1 block'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-spawn-text">Parameter Log</h1>
          <p className="text-spawn-muted-text text-sm mt-1">Track water quality over time. Catch problems before they escalate.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Log Reading
        </button>
      </div>

      {/* Current params — latest reading */}
      {latest && (
        <div className="glass-card rounded-2xl border border-spawn-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">Latest Reading</p>
              <p className="text-sm text-spawn-text font-semibold mt-0.5">{latest.tank} · {latest.date}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {PARAMS.map((p) => {
              const val = latest[p.key]
              const status = getParamStatus(p.key, val)
              return (
                <div key={p.key} className={`rounded-xl border p-3 text-center ${STATUS_BG[status]}`}>
                  <p className="text-xs text-spawn-muted-text mb-1 font-medium">{p.label}</p>
                  <p className={`text-lg font-black ${STATUS_COLORS[status]}`}>
                    {val !== null ? val : '—'}
                  </p>
                  {p.unit && <p className="text-xs text-spawn-muted-text mt-0.5">{p.unit}</p>}
                </div>
              )
            })}
          </div>
          {latest.notes && (
            <p className="mt-4 text-sm text-spawn-muted-text border-t border-spawn-border/40 pt-3">
              <span className="font-semibold text-spawn-text">Note: </span>{latest.notes}
            </p>
          )}
        </div>
      )}

      {/* Tabs + filter */}
      {readings.length > 0 && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1 bg-spawn-surface/50 border border-spawn-border/40 rounded-xl p-1">
            {(['log', 'trends'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                  activeTab === tab ? 'bg-spawn-bg text-spawn-text shadow-sm' : 'text-spawn-muted-text hover:text-spawn-text'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {tanks.length > 1 && (
            <select
              value={filterTank}
              onChange={(e) => setFilterTank(e.target.value)}
              className="bg-spawn-surface border border-spawn-border/50 rounded-lg px-3 py-1.5 text-sm text-spawn-text focus:outline-none focus:border-spawn-cyan/40"
            >
              <option value="all">All tanks</option>
              {tanks.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Trends view */}
      {activeTab === 'trends' && readings.length > 1 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PARAMS.map((p) => {
            const trend = getTrend(p.key)
            const latestVal = trend[trend.length - 1]?.value ?? null
            const status = getParamStatus(p.key, latestVal)
            return (
              <div key={p.key} className={`glass-card rounded-xl border p-5 ${STATUS_BG[status]}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">{p.label}</p>
                    <p className={`text-2xl font-black mt-0.5 ${STATUS_COLORS[status]}`}>
                      {latestVal !== null ? `${latestVal}${p.unit}` : '—'}
                    </p>
                  </div>
                  <Sparkline data={trend} color={p.color} />
                </div>
                <p className="text-xs text-spawn-muted-text">
                  {trend.length > 1 ? `${trend.length} readings` : 'Need more data for trend'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Log view */}
      {activeTab === 'log' && (
        filtered.length === 0
          ? <EmptyState onAdd={() => setShowForm(true)} />
          : (
            <div className="space-y-3">
              {filtered.map((r) => (
                <div key={r.id} className="glass-card rounded-xl border border-spawn-border/40 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-spawn-text">{r.date}</p>
                      <p className="text-xs text-spawn-muted-text">{r.tank}</p>
                    </div>
                    <button
                      onClick={() => deleteReading(r.id)}
                      className="text-spawn-muted-text/40 hover:text-red-400 transition-colors p-1"
                      aria-label="Delete reading"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M2 3.5H12M5 3.5V2.5A.5.5 0 015.5 2h3a.5.5 0 01.5.5v1M11.5 3.5L11 11a1 1 0 01-1 1H4a1 1 0 01-1-1L2.5 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PARAMS.map((p) => {
                      const val = r[p.key]
                      if (val === null) return null
                      const status = getParamStatus(p.key, val)
                      return (
                        <span key={p.key} className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${STATUS_BG[status]} ${STATUS_COLORS[status]}`}>
                          {p.label}: {val}{p.unit}
                        </span>
                      )
                    })}
                  </div>
                  {r.notes && <p className="text-xs text-spawn-muted-text mt-2 pt-2 border-t border-spawn-border/30">{r.notes}</p>}
                </div>
              ))}
            </div>
          )
      )}

      {/* Log form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-spawn-bg/80 backdrop-blur-sm">
          <div className="bg-spawn-bg border border-spawn-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-spawn-border/50">
              <h2 className="text-lg font-black text-spawn-text">Log Parameter Reading</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-spawn-muted-text hover:text-spawn-text transition-colors p-1"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Tank Name</label>
                  <input
                    type="text"
                    value={form.tank}
                    onChange={(e) => setForm({ ...form, tank: e.target.value })}
                    placeholder="Main Tank"
                    list="tank-suggestions"
                    className={inputClass}
                    required
                  />
                  <datalist id="tank-suggestions">
                    {tanks.map((t) => <option key={t} value={t} />)}
                  </datalist>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-3">Parameters — leave blank if not tested</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PARAMS.map((p) => (
                    <div key={p.key}>
                      <label className={labelClass}>{p.label} {p.unit ? `(${p.unit})` : ''}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form[p.key]}
                        onChange={(e) => setForm({ ...form, [p.key]: e.target.value })}
                        placeholder="—"
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Water change done, added conditioner, fish behaviour notes..."
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-spawn-border text-spawn-text text-sm font-semibold hover:border-spawn-border/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-spawn-cyan text-spawn-bg text-sm font-bold hover:bg-opacity-90 transition-all"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
