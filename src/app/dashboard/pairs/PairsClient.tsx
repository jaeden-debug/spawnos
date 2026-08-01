'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/layout/DashboardShell'
import PairCard from '@/components/pairs/PairCard'
import PairBuilder from '@/components/pairs/PairBuilder'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { Fish } from '@/types/fish'
import type { User } from '@supabase/supabase-js'

export default function PairsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [pairs, setPairs] = useState<any[]>([])
  const [allFish, setAllFish] = useState<Fish[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    if (!u) return

    const [pairsRes, fishRes] = await Promise.all([
      supabase
        .from('pairs')
        .select(`
          *,
          male:fish!pairs_male_id_fkey(name, tail_type, color_base),
          female:fish!pairs_female_id_fkey(name, tail_type, color_base)
        `)
        .eq('user_id', u.id)
        .order('created_at', { ascending: false }),
      supabase.from('fish').select('*').eq('user_id', u.id).eq('status', 'active'),
    ])

    setPairs(pairsRes.data ?? [])
    setAllFish((fishRes.data as Fish[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = pairs.filter((p) => !statusFilter || p.status === statusFilter)

  return (
    <DashboardShell user={user} pageTitle="Pair Builder">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-spawn-text">Pair Builder</h1>
            <p className="text-spawn-muted-text text-sm mt-0.5">{pairs.length} pairs in registry</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} variant="primary">
            + Create Pair
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['', 'planned', 'active', 'spawned', 'retired'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-spawn-cyan/10 text-spawn-cyan border border-spawn-cyan/20'
                  : 'bg-spawn-surface text-spawn-muted-text border border-spawn-border hover:border-spawn-cyan/20'
              }`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Pairs grid */}
        {loading ? (
          <div className="text-center py-16 text-spawn-muted-text text-sm">Loading pairs...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">⚡</div>
            <h3 className="font-bold text-spawn-text mb-2">No pairs yet</h3>
            <p className="text-spawn-muted-text text-sm mb-6">
              {pairs.length === 0 ? 'Create your first breeding pair to see predictions.' : 'No pairs match the selected filter.'}
            </p>
            {pairs.length === 0 && (
              <Button onClick={() => setCreateOpen(true)} variant="primary">Create First Pair</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((pair) => (
              <PairCard key={pair.id as string} pair={pair as unknown as Parameters<typeof PairCard>[0]['pair']} />
            ))}
          </div>
        )}
      </div>

      {/* Create Pair Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Breeding Pair" size="xl">
        <PairBuilder
          allFish={allFish}
          onSuccess={() => { setCreateOpen(false); loadData() }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>
    </DashboardShell>
  )
}
