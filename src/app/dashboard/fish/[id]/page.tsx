'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/layout/DashboardShell'
import FishProfileHeader from '@/components/fish/FishProfileHeader'
import FishForm from '@/components/fish/FishForm'
import Modal, { ConfirmModal } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { TierBadge } from '@/components/ui/Badge'
import { calculateValuePotential } from '@/lib/genetics/scoringEngine'
import type { Fish } from '@/types/fish'
import type { User } from '@supabase/supabase-js'
import { formatDate } from '@/lib/utils'

export default function FishProfilePage() {
  const params = useParams()
  const router = useRouter()
  const fishId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [fish, setFish] = useState<Fish | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteType, setNoteType] = useState('general')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [notes, setNotes] = useState<Array<{ id: string; note_type: string; title: string; content: string; created_at: string }>>([])
  const [pairs, setPairs] = useState<Array<{ id: string; pair_name: string | null; status: string; compatibility_score: number | null }>>([])
  const [lineageParents, setLineageParents] = useState<Array<{ id: string; name: string; sex: string; relationship: string }>>([])
  const [lineageOffspring, setLineageOffspring] = useState<Array<{ id: string; name: string; sex: string }>>([])
  const [noteSaving, setNoteSaving] = useState(false)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    if (!u) return

    const [fishRes, notesRes, pairsRes, lineageParentRes, lineageChildRes] = await Promise.all([
      supabase.from('fish').select('*').eq('id', fishId).eq('user_id', u.id).single(),
      supabase.from('fish_notes').select('*').eq('fish_id', fishId).eq('user_id', u.id).order('created_at', { ascending: false }),
      supabase.from('pairs').select('id, pair_name, status, compatibility_score').eq('user_id', u.id).or(`male_id.eq.${fishId},female_id.eq.${fishId}`),
      // Parents of this fish
      supabase.from('lineage_links').select('relationship, parent_fish_id').eq('child_fish_id', fishId).eq('user_id', u.id),
      // Offspring of this fish
      supabase.from('lineage_links').select('child_fish_id').eq('parent_fish_id', fishId).eq('user_id', u.id),
    ])

    setFish(fishRes.data as Fish)
    setNotes(notesRes.data ?? [])
    setPairs(pairsRes.data ?? [])

    // Resolve parent fish names
    if (lineageParentRes.data && lineageParentRes.data.length > 0) {
      const parentIds = lineageParentRes.data.map((l) => l.parent_fish_id)
      const { data: parentFish } = await supabase.from('fish').select('id, name, sex').in('id', parentIds)
      setLineageParents(
        lineageParentRes.data.map((l) => {
          const pf = parentFish?.find((f) => f.id === l.parent_fish_id)
          return { id: l.parent_fish_id, name: pf?.name ?? 'Unknown', sex: pf?.sex ?? 'unknown', relationship: l.relationship }
        })
      )
    }

    if (lineageChildRes.data && lineageChildRes.data.length > 0) {
      const childIds = lineageChildRes.data.map((l) => l.child_fish_id)
      const { data: childFish } = await supabase.from('fish').select('id, name, sex').in('id', childIds)
      setLineageOffspring(childFish ?? [])
    }

    setLoading(false)
  }, [fishId])

  useEffect(() => { loadData() }, [loadData])

  async function handleDelete() {
    setDeleteLoading(true)
    const supabase = createClient()
    await supabase.from('fish').delete().eq('id', fishId)
    router.push('/dashboard/fish')
  }

  async function handleSaveNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteTitle || !noteContent) return
    setNoteSaving(true)
    const supabase = createClient()
    await supabase.from('fish_notes').insert({
      fish_id: fishId,
      user_id: user!.id,
      note_type: noteType as 'health' | 'growth' | 'breeding' | 'trait' | 'general',
      title: noteTitle,
      content: noteContent,
    })
    setNoteTitle('')
    setNoteContent('')
    setNoteOpen(false)
    setNoteSaving(false)
    loadData()
  }

  if (loading) {
    return (
      <DashboardShell user={user}>
        <div className="flex items-center justify-center py-20 text-spawn-muted-text text-sm">Loading fish profile...</div>
      </DashboardShell>
    )
  }

  if (!fish) {
    return (
      <DashboardShell user={user}>
        <div className="text-center py-20">
          <h2 className="font-bold text-spawn-text mb-2">Fish not found</h2>
          <button onClick={() => router.push('/dashboard/fish')} className="text-spawn-cyan text-sm hover:underline">
            Back to Fish Library
          </button>
        </div>
      </DashboardShell>
    )
  }

  const valuePotential = calculateValuePotential(fish)

  return (
    <DashboardShell user={user} pageTitle={fish.name}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back */}
        <button
          onClick={() => router.push('/dashboard/fish')}
          className="text-xs text-spawn-muted-text hover:text-spawn-text transition-colors flex items-center gap-1"
        >
          ← Fish Library
        </button>

        {/* Header */}
        <FishProfileHeader fish={fish} onEdit={() => setEditOpen(true)} />

        {/* Notes + value */}
        {(fish.genotype_notes || fish.breeder_notes) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fish.genotype_notes && (
              <div className="glass-card rounded-2xl border border-spawn-border p-5">
                <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest mb-3">Genotype Notes</h3>
                <p className="text-sm text-spawn-muted-text leading-relaxed">{fish.genotype_notes}</p>
              </div>
            )}
            {fish.breeder_notes && (
              <div className="glass-card rounded-2xl border border-spawn-border p-5">
                <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest mb-3">Breeder Notes</h3>
                <p className="text-sm text-spawn-muted-text leading-relaxed">{fish.breeder_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Value Potential */}
        <div className="glass-card rounded-2xl border border-spawn-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest">Value Potential</h3>
            <TierBadge tier={valuePotential.tier} />
          </div>
          <p className="text-sm text-spawn-muted-text mb-4">{valuePotential.reasoning}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {valuePotential.bestSellingTraits.length > 0 && (
              <div>
                <div className="text-xs text-spawn-muted-text uppercase tracking-wider mb-2">Best Selling Traits</div>
                <ul className="space-y-1">
                  {valuePotential.bestSellingTraits.map((t, i) => (
                    <li key={i} className="text-xs text-spawn-text flex gap-2">
                      <span className="text-emerald-400">→</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {valuePotential.unstableTraits.length > 0 && (
              <div>
                <div className="text-xs text-spawn-muted-text uppercase tracking-wider mb-2">Unstable Traits</div>
                <ul className="space-y-1">
                  {valuePotential.unstableTraits.map((t, i) => (
                    <li key={i} className="text-xs text-amber-400 flex gap-2">
                      <span>⚠</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Lineage */}
        <div className="glass-card rounded-2xl border border-spawn-border p-5">
          <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest mb-4">Lineage</h3>
          {lineageParents.length === 0 && lineageOffspring.length === 0 ? (
            <p className="text-sm text-spawn-muted-text">No lineage records for this fish. Lineage is recorded via the Lineage page.</p>
          ) : (
            <div className="space-y-4">
              {lineageParents.length > 0 && (
                <div>
                  <div className="text-xs text-spawn-muted-text uppercase tracking-wider mb-2">Parents</div>
                  <div className="flex flex-wrap gap-2">
                    {lineageParents.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => router.push(`/dashboard/fish/${p.id}`)}
                        className={`px-3 py-1.5 rounded-lg border text-xs hover:opacity-80 transition-opacity ${
                          p.sex === 'male' ? 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400' : 'bg-rose-400/10 border-rose-400/20 text-rose-400'
                        }`}
                      >
                        {p.sex === 'male' ? '♂' : '♀'} {p.name}
                        <span className="text-spawn-muted ml-1 capitalize">({p.relationship})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {lineageOffspring.length > 0 && (
                <div>
                  <div className="text-xs text-spawn-muted-text uppercase tracking-wider mb-2">
                    Offspring ({lineageOffspring.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lineageOffspring.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => router.push(`/dashboard/fish/${o.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-spawn-surface border border-spawn-border text-xs text-spawn-muted-text hover:border-spawn-cyan/30 hover:text-spawn-text transition-colors"
                      >
                        {o.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pair History */}
        {pairs.length > 0 && (
          <div className="glass-card rounded-2xl border border-spawn-border p-5">
            <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest mb-4">Pair History</h3>
            <div className="space-y-2">
              {pairs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(`/dashboard/pairs/${p.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-spawn-surface border border-spawn-border hover:border-spawn-cyan/30 transition-colors"
                >
                  <span className="text-sm text-spawn-text">{p.pair_name ?? 'Unnamed Pair'}</span>
                  <div className="flex items-center gap-3">
                    {p.compatibility_score !== null && (
                      <span className="text-xs text-spawn-cyan font-mono">{p.compatibility_score}/100</span>
                    )}
                    <span className="text-xs text-spawn-muted-text capitalize">{p.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fish Notes */}
        <div className="glass-card rounded-2xl border border-spawn-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest">Fish Notes</h3>
            <Button size="sm" variant="secondary" onClick={() => setNoteOpen(true)}>
              + Add Note
            </Button>
          </div>
          {notes.length === 0 ? (
            <p className="text-sm text-spawn-muted-text">No notes yet. Add health checks, growth updates, or trait observations.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-4 rounded-xl bg-spawn-surface border border-spawn-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={
                      note.note_type === 'health' ? 'rose' :
                      note.note_type === 'growth' ? 'emerald' :
                      note.note_type === 'breeding' ? 'amber' :
                      note.note_type === 'trait' ? 'cyan' : 'muted'
                    }>
                      {note.note_type}
                    </Badge>
                    <span className="text-xs text-spawn-muted">{formatDate(note.created_at)}</span>
                  </div>
                  <h4 className="font-medium text-spawn-text text-sm mb-1">{note.title}</h4>
                  <p className="text-xs text-spawn-muted-text leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="glass-card rounded-2xl border border-rose-400/10 p-5">
          <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-3">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-spawn-muted-text">Permanently delete this fish and all associated notes.</p>
            <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete Fish
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit — ${fish.name}`} size="xl">
        <FishForm
          fish={fish}
          onSuccess={() => { setEditOpen(false); loadData() }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      {/* Add Note Modal */}
      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title="Add Fish Note" size="md">
        <form onSubmit={handleSaveNote} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">Note Type</label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors appearance-none"
            >
              {['health', 'growth', 'breeding', 'trait', 'general'].map((t) => (
                <option key={t} value={t} className="bg-spawn-surface capitalize">{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">Title</label>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              required
              placeholder="e.g. Weight check, fin growth observation..."
              className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">Content</label>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              required
              rows={4}
              placeholder="Write your observation..."
              className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm resize-none focus:outline-none focus:border-spawn-cyan/50 transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" loading={noteSaving} className="flex-1">Save Note</Button>
            <Button type="button" variant="secondary" onClick={() => setNoteOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Fish"
        message={`Are you sure you want to permanently delete ${fish.name}? This cannot be undone.`}
        confirmLabel="Delete Permanently"
        danger
        loading={deleteLoading}
      />
    </DashboardShell>
  )
}
