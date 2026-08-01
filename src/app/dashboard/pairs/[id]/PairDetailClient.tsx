'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/layout/DashboardShell'
import PairPredictionPanel from '@/components/pairs/PairPredictionPanel'
import { StatusBadge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { Fish } from '@/types/fish'
import type { User } from '@supabase/supabase-js'
import { formatDate, slugToLabel } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'spawned', label: 'Spawned' },
  { value: 'retired', label: 'Retired' },
]

export default function PairDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pairId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [pair, setPair] = useState<any | null>(null)
  const [male, setMale] = useState<Fish | null>(null)
  const [female, setFemale] = useState<Fish | null>(null)
  const [spawns, setSpawns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalDraft, setGoalDraft] = useState('')
  const [notesDraft, setNotesDraft] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    if (!u) return

    const [pairRes, spawnsRes] = await Promise.all([
      supabase
        .from('pairs')
        .select('*')
        .eq('id', pairId)
        .eq('user_id', u.id)
        .single(),
      supabase
        .from('spawns')
        .select('*')
        .eq('pair_id', pairId)
        .eq('user_id', u.id)
        .order('created_at', { ascending: false }),
    ])

    const p = pairRes.data as any
    if (!p) { setLoading(false); return }

    setPair(p)
    setGoalDraft(p.goal as string ?? '')
    setNotesDraft(p.notes as string ?? '')
    setSpawns((spawnsRes.data as any[]) ?? [])

    const [maleRes, femaleRes] = await Promise.all([
      supabase.from('fish').select('*').eq('id', p.male_id as string).single(),
      supabase.from('fish').select('*').eq('id', p.female_id as string).single(),
    ])

    setMale(maleRes.data as unknown as Fish)
    setFemale(femaleRes.data as unknown as Fish)
    setLoading(false)
  }, [pairId])

  useEffect(() => { loadData() }, [loadData])

  async function handleStatusChange(newStatus: string) {
    setSavingStatus(true)
    const supabase = createClient()
    await (supabase as any).from('pairs').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', pairId)
    setSavingStatus(false)
    loadData()
  }

  async function handleSaveGoal() {
    const supabase = createClient()
    await (supabase as any).from('pairs').update({
      goal: goalDraft || null,
      notes: notesDraft || null,
      updated_at: new Date().toISOString(),
    }).eq('id', pairId)
    setEditingGoal(false)
    loadData()
  }

  async function handleDelete() {
    setDeleteLoading(true)
    const supabase = createClient()
    await (supabase as any).from('pairs').delete().eq('id', pairId)
    router.push('/dashboard/pairs')
  }

  if (loading) {
    return <DashboardShell user={user}><div className="flex items-center justify-center py-20 text-spawn-muted-text text-sm">Loading pair...</div></DashboardShell>
  }

  if (!pair || !male || !female) {
    return (
      <DashboardShell user={user}>
        <div className="text-center py-20">
          <h2 className="font-bold text-spawn-text mb-2">Pair not found</h2>
          <button onClick={() => router.push('/dashboard/pairs')} className="text-spawn-cyan text-sm hover:underline">
            Back to Pairs
          </button>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell user={user} pageTitle={pair.pair_name as string ?? 'Pair Detail'}>
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => router.push('/dashboard/pairs')} className="text-xs text-spawn-muted-text hover:text-spawn-text transition-colors flex items-center gap-1">
          ← Pairs
        </button>

        {/* Header */}
        <div className="glass-card rounded-2xl border border-spawn-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-spawn-text">{pair.pair_name as string ?? 'Unnamed Pair'}</h1>
              <p className="text-spawn-muted-text text-sm mt-0.5">Created {formatDate(pair.created_at as string)}</p>
            </div>
            <StatusBadge status={pair.status as string} />
          </div>

          {/* Fish cards */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { fish: male, sex: 'male', label: '♂ Male' },
              { fish: female, sex: 'female', label: '♀ Female' },
            ].map(({ fish, sex, label }) => (
              <button
                key={fish.id}
                onClick={() => router.push(`/dashboard/fish/${fish.id}`)}
                className={`p-4 rounded-xl border transition-colors text-left ${
                  sex === 'male'
                    ? 'bg-cyan-400/5 border-cyan-400/20 hover:border-cyan-400/40'
                    : 'bg-rose-400/5 border-rose-400/20 hover:border-rose-400/40'
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${sex === 'male' ? 'text-cyan-400' : 'text-rose-400'}`}>
                  {label}
                </div>
                <div className="font-bold text-spawn-text">{fish.name}</div>
                {fish.strain && <div className="text-xs text-spawn-muted-text">{fish.strain}</div>}
                <div className="flex flex-wrap gap-1 mt-2">
                  {fish.tail_type && <span className="text-xs bg-spawn-surface border border-spawn-border text-spawn-muted-text px-2 py-0.5 rounded-full">{slugToLabel(fish.tail_type)}</span>}
                  {fish.pattern_type && <span className="text-xs bg-spawn-surface border border-spawn-border text-spawn-muted-text px-2 py-0.5 rounded-full">{slugToLabel(fish.pattern_type)}</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Status + goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-spawn-muted-text uppercase tracking-wider mb-2">Status</div>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    disabled={savingStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      pair.status === opt.value
                        ? 'bg-spawn-cyan/10 text-spawn-cyan border border-spawn-cyan/20'
                        : 'bg-spawn-surface text-spawn-muted-text border border-spawn-border hover:border-spawn-cyan/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              {editingGoal ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={goalDraft}
                    onChange={(e) => setGoalDraft(e.target.value)}
                    placeholder="Breeding goal..."
                    className="w-full px-3 py-2 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors"
                  />
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={2}
                    placeholder="Notes..."
                    className="w-full px-3 py-2 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm resize-none focus:outline-none focus:border-spawn-cyan/50 transition-colors"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveGoal}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingGoal(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-spawn-muted-text uppercase tracking-wider">Breeding Goal</div>
                    <button onClick={() => setEditingGoal(true)} className="text-xs text-spawn-cyan hover:text-spawn-cyan-dim transition-colors">Edit</button>
                  </div>
                  <p className="text-sm text-spawn-muted-text">{String(pair.goal || 'No goal set')}</p>
                  {String(pair.notes || '') && <p className="text-xs text-spawn-muted mt-1">{String(pair.notes || '')}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prediction Panel */}
        <div className="glass-card rounded-2xl border border-spawn-border p-6">
          <PairPredictionPanel male={male} female={female} />
        </div>

        {/* Spawns */}
        <div className="glass-card rounded-2xl border border-spawn-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest">Spawns</h3>
            <Button size="sm" variant="secondary" onClick={() => router.push('/dashboard/spawns')}>
              Log New Spawn
            </Button>
          </div>
          {spawns.length === 0 ? (
            <p className="text-sm text-spawn-muted-text">No spawns recorded for this pair yet.</p>
          ) : (
            <div className="space-y-2">
              {spawns.map((spawn) => (
                <div key={spawn.id as string} className="flex items-center justify-between p-3 rounded-xl bg-spawn-surface border border-spawn-border">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 mr-2">
                      {spawn.stage as string}
                    </span>
                    <span className="text-xs text-spawn-muted-text">{formatDate(spawn.created_at as string)}</span>
                  </div>
                  <div className="text-sm text-spawn-text font-mono">
                    {spawn.current_fry_count !== null ? `${spawn.current_fry_count} fry` : '—'}
                    {spawn.survival_rate !== null && (
                      <span className="text-spawn-muted ml-2 text-xs">{(spawn.survival_rate as number).toFixed(1)}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger */}
        <div className="glass-card rounded-2xl border border-rose-400/10 p-5">
          <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-3">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-spawn-muted-text">Permanently delete this pair record.</p>
            <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>Delete Pair</Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Pair"
        message={`Delete ${pair.pair_name as string ?? 'this pair'}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
      />
    </DashboardShell>
  )
}
