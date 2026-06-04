'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import type { CMSSpecies } from '@/lib/species-db'

const CATEGORIES = [
  { value: 'all', label: 'All Species' },
  { value: 'freshwater', label: 'Freshwater' },
  { value: 'saltwater', label: 'Saltwater' },
  { value: 'shrimp', label: 'Shrimp' },
  { value: 'amphibian', label: 'Amphibians' },
  { value: 'turtle', label: 'Turtles' },
  { value: 'invertebrate', label: 'Invertebrates' },
  { value: 'live_food', label: 'Live Foods' },
] as const

const DIFFICULTIES = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
] as const

const difficultyColor: Record<string, string> = {
  beginner: 'text-green-400 bg-green-400/10',
  intermediate: 'text-amber-400 bg-amber-400/10',
  advanced: 'text-orange-400 bg-orange-400/10',
  expert: 'text-red-400 bg-red-400/10',
}

const categoryIcon: Record<string, string> = {
  freshwater: '🐟',
  saltwater: '🐠',
  shrimp: '🦐',
  amphibian: '🦎',
  turtle: '🐢',
  invertebrate: '🦀',
  live_food: '🦠',
}

interface Props {
  species: CMSSpecies[]
}

export default function SpeciesSearch({ species }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [difficulty, setDifficulty] = useState<string>('all')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return species.filter((s) => {
      const matchesQuery =
        !q ||
        s.common_name.toLowerCase().includes(q) ||
        s.scientific_name.toLowerCase().includes(q) ||
        s.family.toLowerCase().includes(q) ||
        s.origin_regions.some((r) => r.toLowerCase().includes(q)) ||
        s.seo_keywords?.some((k) => k.toLowerCase().includes(q))

      const matchesCategory = category === 'all' || s.category === category
      const matchesDifficulty = difficulty === 'all' || s.difficulty === difficulty

      return matchesQuery && matchesCategory && matchesDifficulty
    })
  }, [species, query, category, difficulty])

  const clearFilters = useCallback(() => {
    setQuery('')
    setCategory('all')
    setDifficulty('all')
  }, [])

  const hasActiveFilters = query || category !== 'all' || difficulty !== 'all'

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    species.forEach((s) => {
      counts[s.category] = (counts[s.category] ?? 0) + 1
    })
    return counts
  }, [species])

  return (
    <div>
      {/* Search + filter bar */}
      <div className="mb-8 space-y-4">
        {/* Search input */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-spawn-muted-text w-4 h-4"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search species, scientific name, origin…"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text placeholder-spawn-muted-text focus:outline-none focus:border-spawn-cyan/60 transition-colors text-sm"
            aria-label="Search species database"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-spawn-muted-text hover:text-spawn-text transition-colors"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const count = cat.value === 'all' ? species.length : (categoryCounts[cat.value] ?? 0)
            if (cat.value !== 'all' && count === 0) return null
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  category === cat.value
                    ? 'bg-spawn-cyan text-spawn-bg border-spawn-cyan'
                    : 'bg-spawn-surface border-spawn-border text-spawn-muted-text hover:border-spawn-cyan/50 hover:text-spawn-text'
                }`}
              >
                {cat.value !== 'all' && <span>{categoryIcon[cat.value]}</span>}
                {cat.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  category === cat.value ? 'bg-spawn-bg/20' : 'bg-spawn-bg'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Difficulty filter + results count */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-spawn-muted-text">Difficulty:</span>
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  difficulty === d.value
                    ? 'bg-spawn-cyan/20 border-spawn-cyan/50 text-spawn-cyan'
                    : 'bg-spawn-surface border-spawn-border text-spawn-muted-text hover:border-spawn-cyan/30'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-spawn-muted-text">
              <span className="text-spawn-text font-semibold">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'species' : 'species'} found
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-spawn-cyan hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-spawn-text font-semibold mb-2">No species found</p>
          <p className="text-spawn-muted-text text-sm mb-4">
            Try a different search term or clear your filters.
          </p>
          <button onClick={clearFilters} className="text-spawn-cyan hover:underline text-sm">
            Show all species
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((s) => {
            const minTankGal = s.min_tank_litres ? Math.round(s.min_tank_litres / 3.785) : null
            const tempDisplay = s.param_temp
              ? `${s.param_temp.ideal_min ?? s.param_temp.min}–${s.param_temp.ideal_max ?? s.param_temp.max}°C`
              : null
            const phDisplay = s.param_ph
              ? `pH ${s.param_ph.ideal_min ?? s.param_ph.min}–${s.param_ph.ideal_max ?? s.param_ph.max}`
              : null

            return (
              <Link
                key={s.slug}
                href={`/species/${s.slug}`}
                className="group flex flex-col rounded-2xl bg-spawn-surface/50 border border-spawn-border/50 hover:border-spawn-cyan/40 hover:bg-spawn-surface transition-all overflow-hidden"
              >
                {/* Color accent bar */}
                <div
                  className="h-1 w-full"
                  style={{ background: `linear-gradient(90deg, ${s.hero_color}60, ${s.hero_color}20)` }}
                />

                <div className="p-5 flex flex-col flex-1">
                  {/* Category + difficulty badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-spawn-muted-text flex items-center gap-1">
                      {categoryIcon[s.category] ?? '🐟'} {s.category.charAt(0).toUpperCase() + s.category.slice(1).replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColor[s.difficulty] ?? 'text-spawn-muted-text bg-spawn-bg'}`}>
                      {s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1)}
                    </span>
                  </div>

                  {/* Species names */}
                  <h3 className="font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors mb-0.5 leading-tight">
                    {s.common_name}
                  </h3>
                  <p className="text-xs text-spawn-muted-text italic mb-3">{s.scientific_name}</p>

                  {/* Parameter chips */}
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {tempDisplay && (
                      <span className="param-badge text-xs">🌡️ {tempDisplay}</span>
                    )}
                    {phDisplay && (
                      <span className="param-badge text-xs">⚗️ {phDisplay}</span>
                    )}
                    {minTankGal && (
                      <span className="param-badge text-xs">🪣 {minTankGal}+ gal</span>
                    )}
                  </div>

                  {/* Origin */}
                  {s.origin_regions.length > 0 && (
                    <p className="text-xs text-spawn-muted/60 mt-2">
                      {s.origin_regions.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
