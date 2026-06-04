'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/layout/DashboardShell'
import FishCard from '@/components/fish/FishCard'
import FishForm from '@/components/fish/FishForm'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { Fish } from '@/types/fish'
import type { User } from '@supabase/supabase-js'
import { TAIL_TYPE_OPTIONS, BASE_COLOR_OPTIONS, PATTERN_TYPE_OPTIONS } from '@/types/fish'

const SEX_FILTER = [
  { value: '', label: 'All Sexes' },
  { value: 'male', label: '♂ Males' },
  { value: 'female', label: '♀ Females' },
  { value: 'unknown', label: 'Unknown' },
]

const STATUS_FILTER = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
  { value: 'sold', label: 'Sold' },
  { value: 'deceased', label: 'Deceased' },
]

export default function FishLibraryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [fish, setFish] = useState<Fish[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [sexFilter, setSexFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [tailFilter, setTailFilter] = useState('')
  const [colorFilter, setColorFilter] = useState('')
  const [patternFilter, setPatternFilter] = useState('')

  const loadFish = useCallback(async () => {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    if (!u) return

    const { data } = await supabase
      .from('fish')
      .select('*')
      .eq('user_id', u.id)
      .order('created_at', { ascending: false })

    setFish((data as Fish[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadFish()
  }, [loadFish])

  const filtered = fish.filter((f) => {
    if (search && !`${f.name} ${f.strain ?? ''} ${f.color_base ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false
    if (sexFilter && f.sex !== sexFilter) return false
    if (statusFilter && f.status !== statusFilter) return false
    if (tailFilter && f.tail_type !== tailFilter) return false
    if (colorFilter && f.color_base !== colorFilter) return false
    if (patternFilter && f.pattern_type !== patternFilter) return false
    return true
  })

  return (
    <DashboardShell user={user} pageTitle="Fish Library">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-spawn-text">Fish Library</h1>
            <p className="text-spawn-muted-text text-sm mt-0.5">{fish.length} fish registered</p>
          </div>
          <Button onClick={() => setAddOpen(true)} variant="primary">
            + Add Fish
          </Button>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl border border-spawn-border p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <input
              type="text"
              placeholder="Search name, strain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="col-span-2 sm:col-span-3 lg:col-span-2 px-3 py-2 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text placeholder-spawn-muted text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors"
            />
            <select
              value={sexFilter}
              onChange={(e) => setSexFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors appearance-none"
            >
              {SEX_FILTER.map((o) => <option key={o.value} value={o.value} className="bg-spawn-surface">{o.label}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors appearance-none"
            >
              {STATUS_FILTER.map((o) => <option key={o.value} value={o.value} className="bg-spawn-surface">{o.label}</option>)}
            </select>
            <select
              value={tailFilter}
              onChange={(e) => setTailFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors appearance-none"
            >
              <option value="" className="bg-spawn-surface">All Tails</option>
              {TAIL_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-spawn-surface">{o.label}</option>)}
            </select>
            <select
              value={patternFilter}
              onChange={(e) => setPatternFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors appearance-none"
            >
              <option value="" className="bg-spawn-surface">All Patterns</option>
              {PATTERN_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-spawn-surface">{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16 text-spawn-muted-text text-sm">Loading fish library...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">🐠</div>
            <h3 className="font-bold text-spawn-text mb-2">No fish found</h3>
            <p className="text-spawn-muted-text text-sm mb-6">
              {fish.length === 0 ? 'Add your first fish to get started.' : 'Try adjusting your filters.'}
            </p>
            {fish.length === 0 && (
              <Button onClick={() => setAddOpen(true)} variant="primary">
                Add Your First Fish
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-spawn-muted-text">{filtered.length} fish shown</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((f) => (
                <FishCard key={f.id} fish={f} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Fish Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Fish" size="xl">
        <FishForm
          onSuccess={() => {
            setAddOpen(false)
            loadFish()
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>
    </DashboardShell>
  )
}
