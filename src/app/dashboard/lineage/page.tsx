'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/layout/DashboardShell'
import ParentChildGraph from '@/components/lineage/ParentChildGraph'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { checkInbreedingRisk } from '@/lib/genetics/lineageUtils'
import type { Fish } from '@/types/fish'
import type { User } from '@supabase/supabase-js'
import type { LineageLink } from '@/lib/genetics/lineageUtils'

export default function LineagePage() {
  const [user, setUser] = useState<User | null>(null)
  const [fish, setFish] = useState<Fish[]>([])
  const [links, setLinks] = useState<LineageLink[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFish, setSelectedFish] = useState<Fish | null>(null)
  const [addLinkOpen, setAddLinkOpen] = useState(false)
  const [checkOpen, setCheckOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Link form
  const [parentId, setParentId] = useState('')
  const [childId, setChildId] = useState('')
  const [relationship, setRelationship] = useState<'father' | 'mother' | 'offspring'>('father')
  const [linkSaving, setLinkSaving] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  // Inbreeding check
  const [checkFish1, setCheckFish1] = useState('')
  const [checkFish2, setCheckFish2] = useState('')
  const [inbreedResult, setInbreedResult] = useState<{ risk: boolean; reason: string | null } | null>(null)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    if (!u) return

    const [fishRes, linksRes] = await Promise.all([
      supabase.from('fish').select('*').eq('user_id', u.id).order('name'),
      supabase.from('lineage_links').select('*').eq('user_id', u.id),
    ])

    setFish((fishRes.data as unknown as Fish[]) ?? [])
    setLinks(linksRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleSaveLink(e: React.FormEvent) {
    e.preventDefault()
    setLinkError(null)
    if (!parentId || !childId) { setLinkError('Select both parent and child'); return }
    if (parentId === childId) { setLinkError('Parent and child cannot be the same fish'); return }

    setLinkSaving(true)
    const supabase = createClient()

    // Check for duplicate
    const exists = links.some((l) => l.parent_fish_id === parentId && l.child_fish_id === childId)
    if (exists) { setLinkError('This link already exists'); setLinkSaving(false); return }

    const { error } = await (supabase as any).from('lineage_links').insert({
      user_id: user!.id,
      parent_fish_id: parentId,
      child_fish_id: childId,
      relationship,
    })

    if (error) { setLinkError(error.message); setLinkSaving(false); return }

    setParentId('')
    setChildId('')
    setRelationship('father')
    setAddLinkOpen(false)
    setLinkSaving(false)
    loadData()
  }

  function handleInbreedCheck() {
    if (!checkFish1 || !checkFish2) return
    const result = checkInbreedingRisk(checkFish1, checkFish2, links)
    setInbreedResult(result)
  }

  // Build parent/offspring data for selected fish
  const parentLinks = links.filter((l) => l.child_fish_id === selectedFish?.id)
  const offspringLinks = links.filter((l) => l.parent_fish_id === selectedFish?.id)
  const fishMap = new Map(fish.map((f) => [f.id, f]))

  const parents = parentLinks.map((l) => {
    const pf = fishMap.get(l.parent_fish_id)
    return { id: l.parent_fish_id, name: pf?.name ?? 'Unknown', sex: pf?.sex ?? 'unknown', relationship: l.relationship }
  })
  const offspring = offspringLinks.map((l) => {
    const cf = fishMap.get(l.child_fish_id)
    return { id: l.child_fish_id, name: cf?.name ?? 'Unknown', sex: cf?.sex ?? 'unknown' }
  })

  const filteredFish = fish.filter((f) =>
    !search || f.name.toLowerCase().includes(search.toLowerCase()) || (f.strain ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardShell user={user} pageTitle="Lineage">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-spawn-text">Lineage Records</h1>
            <p className="text-spawn-muted-text text-sm mt-0.5">{links.length} lineage links recorded</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCheckOpen(true)}>
              🧬 Inbreeding Check
            </Button>
            <Button variant="primary" onClick={() => setAddLinkOpen(true)}>
              + Add Link
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fish list */}
          <div className="glass-card rounded-2xl border border-spawn-border p-5">
            <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest mb-4">Select Fish</h3>
            <input
              type="text"
              placeholder="Search fish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text placeholder-spawn-muted text-sm mb-3 focus:outline-none focus:border-spawn-cyan/50 transition-colors"
            />
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {loading ? (
                <p className="text-xs text-spawn-muted-text py-4 text-center">Loading...</p>
              ) : filteredFish.length === 0 ? (
                <p className="text-xs text-spawn-muted-text py-4 text-center">No fish found</p>
              ) : (
                filteredFish.map((f) => {
                  const hasLinks = links.some((l) => l.parent_fish_id === f.id || l.child_fish_id === f.id)
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFish(f)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all text-sm ${
                        selectedFish?.id === f.id
                          ? 'bg-spawn-cyan/10 border border-spawn-cyan/20 text-spawn-cyan'
                          : 'text-spawn-muted-text hover:bg-spawn-surface border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          {f.sex === 'male' ? '♂' : f.sex === 'female' ? '♀' : '?'} {f.name}
                        </span>
                        {hasLinks && <span className="text-[10px] text-emerald-400">linked</span>}
                      </div>
                      {f.strain && <div className="text-xs text-spawn-muted mt-0.5">{f.strain}</div>}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Lineage display */}
          <div className="lg:col-span-2 glass-card rounded-2xl border border-spawn-border p-6">
            {selectedFish ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-black text-spawn-text text-lg">{selectedFish.name}</h2>
                  <span className="text-xs text-spawn-muted-text">
                    {parents.length} parent{parents.length !== 1 ? 's' : ''} · {offspring.length} offspring
                  </span>
                </div>
                <ParentChildGraph fish={selectedFish} parents={parents} offspring={offspring} />
              </>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="text-4xl mb-3 opacity-30">🌿</div>
                  <p className="text-spawn-muted-text text-sm">Select a fish to view its lineage</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* All links table */}
        {links.length > 0 && (
          <div className="glass-card rounded-2xl border border-spawn-border p-5">
            <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest mb-4">All Lineage Links</h3>
            <div className="space-y-2">
              {links.map((link) => {
                const parent = fishMap.get(link.parent_fish_id)
                const child = fishMap.get(link.child_fish_id)
                return (
                  <div key={link.id} className="flex items-center justify-between p-3 rounded-xl bg-spawn-surface border border-spawn-border text-sm">
                    <div className="flex items-center gap-2">
                      <span className={parent?.sex === 'male' ? 'text-cyan-400' : 'text-rose-400'}>
                        {parent?.sex === 'male' ? '♂' : '♀'} {parent?.name ?? 'Unknown'}
                      </span>
                      <span className="text-spawn-muted text-xs">→ {link.relationship} of →</span>
                      <span className="text-spawn-text">{child?.name ?? 'Unknown'}</span>
                    </div>
                    <button
                      onClick={async () => {
                        const supabase = createClient()
                        await (supabase as any).from('lineage_links').delete().eq('id', link.id)
                        loadData()
                      }}
                      className="text-xs text-spawn-muted hover:text-rose-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Link Modal */}
      <Modal open={addLinkOpen} onClose={() => setAddLinkOpen(false)} title="Add Lineage Link" size="md">
        <form onSubmit={handleSaveLink} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">Parent Fish</label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors appearance-none">
              <option value="" className="bg-spawn-surface">Select parent...</option>
              {fish.map((f) => (
                <option key={f.id} value={f.id} className="bg-spawn-surface">
                  {f.sex === 'male' ? '♂' : f.sex === 'female' ? '♀' : '?'} {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">Relationship</label>
            <select value={relationship} onChange={(e) => setRelationship(e.target.value as 'father' | 'mother' | 'offspring')}
              className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors appearance-none">
              <option value="father" className="bg-spawn-surface">Father</option>
              <option value="mother" className="bg-spawn-surface">Mother</option>
              <option value="offspring" className="bg-spawn-surface">Offspring (of)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">Child Fish</label>
            <select value={childId} onChange={(e) => setChildId(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors appearance-none">
              <option value="" className="bg-spawn-surface">Select child...</option>
              {fish.filter((f) => f.id !== parentId).map((f) => (
                <option key={f.id} value={f.id} className="bg-spawn-surface">
                  {f.sex === 'male' ? '♂' : f.sex === 'female' ? '♀' : '?'} {f.name}
                </option>
              ))}
            </select>
          </div>
          {linkError && <p className="text-xs text-rose-400">{linkError}</p>}
          <div className="flex gap-3">
            <Button type="submit" loading={linkSaving} className="flex-1">Add Link</Button>
            <Button type="button" variant="secondary" onClick={() => setAddLinkOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Inbreeding Check Modal */}
      <Modal open={checkOpen} onClose={() => { setCheckOpen(false); setInbreedResult(null) }} title="Inbreeding Risk Check" size="md">
        <div className="space-y-4">
          <p className="text-sm text-spawn-muted-text">Select two fish to check for shared ancestry or direct relation.</p>
          {[
            { label: 'Fish A', value: checkFish1, setter: setCheckFish1 },
            { label: 'Fish B', value: checkFish2, setter: setCheckFish2 },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">{label}</label>
              <select value={value} onChange={(e) => setter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors appearance-none">
                <option value="" className="bg-spawn-surface">Select fish...</option>
                {fish.map((f) => (
                  <option key={f.id} value={f.id} className="bg-spawn-surface">
                    {f.sex === 'male' ? '♂' : f.sex === 'female' ? '♀' : '?'} {f.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <Button onClick={handleInbreedCheck} disabled={!checkFish1 || !checkFish2} className="w-full">
            Check Inbreeding Risk
          </Button>
          {inbreedResult && (
            <div className={`p-4 rounded-xl border ${inbreedResult.risk ? 'bg-rose-400/10 border-rose-400/20' : 'bg-emerald-400/10 border-emerald-400/20'}`}>
              <div className={`font-bold text-sm mb-1 ${inbreedResult.risk ? 'text-rose-400' : 'text-emerald-400'}`}>
                {inbreedResult.risk ? '⚠ Inbreeding Risk Detected' : '✓ No Shared Ancestry Found'}
              </div>
              <p className="text-xs text-spawn-muted-text">
                {inbreedResult.reason ?? 'No direct relationship or shared ancestors found in your lineage records.'}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </DashboardShell>
  )
}
