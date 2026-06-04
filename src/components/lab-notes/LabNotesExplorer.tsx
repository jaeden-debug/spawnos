'use client'

import { useMemo, useState } from 'react'
import type { LabNoteMeta } from '@/lib/lab-notes'
import ArticleCard from './ArticleCard'

const PAGE_SIZE = 9

export default function LabNotesExplorer({
  notes,
  categories,
}: {
  notes: LabNoteMeta[]
  categories: { category: string; count: number }[]
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('All')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes.filter((n) => {
      const inCategory = category === 'All' || n.category === category
      if (!inCategory) return false
      if (!q) return true
      return (
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [notes, query, category])

  const shown = filtered.slice(0, visible)

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="relative max-w-md">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-spawn-muted-text" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setVisible(PAGE_SIZE) }}
            placeholder="Search articles…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-spawn-surface/60 border border-spawn-border/60 text-sm text-spawn-text placeholder:text-spawn-muted focus:outline-none focus:border-spawn-cyan/40 focus:ring-1 focus:ring-spawn-cyan/15 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {['All', ...categories.map((c) => c.category)].map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setVisible(PAGE_SIZE) }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                category === cat
                  ? 'bg-spawn-cyan/10 text-spawn-cyan border-spawn-cyan/30'
                  : 'bg-spawn-surface/40 text-spawn-muted-text border-spawn-border/50 hover:border-spawn-border'
              }`}
            >
              {cat}
              {cat !== 'All' && (
                <span className="ml-1.5 opacity-60">{categories.find((c) => c.category === cat)?.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {shown.length === 0 ? (
        <div className="text-center py-20 text-spawn-muted-text text-sm">
          No articles match your search yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shown.map((note) => (
            <ArticleCard key={note.slug} note={note} />
          ))}
        </div>
      )}

      {visible < filtered.length && (
        <div className="text-center mt-10">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="px-6 py-3 rounded-xl border border-spawn-border/70 text-sm font-semibold text-spawn-text hover:border-spawn-cyan/40 hover:bg-spawn-surface/50 transition-all"
          >
            Load more articles
          </button>
        </div>
      )}
    </div>
  )
}
