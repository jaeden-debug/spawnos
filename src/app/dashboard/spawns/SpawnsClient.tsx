'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/layout/DashboardShell'
import SpawnCard from '@/components/spawns/SpawnCard'
import SpawnForm from '@/components/spawns/SpawnForm'
import SurvivalCalculator from '@/components/spawns/SurvivalCalculator'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { User } from '@supabase/supabase-js'
import { formatDate, stageLabel } from '@/lib/utils'

export default function SpawnsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [spawns, setSpawns] = useState<any[]>([])
  const [pairs, setPairs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedSpawn, setSelectedSpawn] = useState<any | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [stageFilter, setStageFilter] = useState('')

  // Spawn log form
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [logFryCount, setLogFryCount] = useState('')
  const [logTemp, setLogTemp] = useState('')
  const [logFeeding, setLogFeeding] = useState('')
  const [logWaterChange, setLogWaterChange] = useState('')
  const [logHealth, setLogHealth] = useState('')
  const [logNotes, setLogNotes] = useState('')
  const [logSaving, setLogSaving] = useState(false)
  const [logs, setLogs] = useState<any[]>([])

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    if (!u) return

    const [spawnsRes, pairsRes] = await Promise.all([
      supabase
        .from('spawns')
        .select(`
          *,
          pair:pairs(pair_name, male:fish!pairs_male_id_fkey(name), female:fish!pairs_female_id_fkey(name))
        `)
        .eq('user_id', u.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('pairs')
        .select('id, pair_name, male:fish!pairs_male_id_fkey(name), female:fish!pairs_female_id_fkey(name)')
        .eq('user_id', u.id),
    ])

    setSpawns(spawnsRes.data ?? [])
    setPairs(pairsRes.data ?? [])
    setLoading(false)
  }, [])

  const loadLogs = useCallback(async (spawnId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('spawn_logs')
      .select('*')
      .eq('spawn_id', spawnId)
      .order('log_date', { ascending: false })
    setLogs(data ?? [])
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function openSpawn(spawn: any) {
    setSelectedSpawn(spawn)
    await loadLogs(spawn.id as string)
  }

  async function handleSaveLog(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSpawn) return
    setLogSaving(true)
    const supabase = createClient()
    const fryCountNum = logFryCount ? parseInt(logFryCount) : null

    await (supabase as any).from('spawn_logs').insert({
      spawn_id: selectedSpawn.id as string,
      user_id: user!.id,
      log_date: logDate,
      fry_count: fryCountNum,
      water_temp: logTemp ? parseFloat(logTemp) : null,
      feeding_notes: logFeeding || null,
      water_change_notes: logWaterChange || null,
      health_notes: logHealth || null,
      notes: logNotes || null,
    })

    // Update spawn fry count
    if (fryCountNum !== null) {
      const eggs = selectedSpawn.estimated_eggs as number ?? 0
      const hatched = selectedSpawn.estimated_hatched as number ?? 0
      const survival = hatched > 0 ? (fryCountNum / hatched) * 100 : null
      await (supabase as any).from('spawns').update({
        current_fry_count: fryCountNum,
        survival_rate: survival !== null ? Math.round(survival * 10) / 10 : null,
        updated_at: new Date().toISOString(),
      }).eq('id', selectedSpawn.id as string)
    }

    setLogDate(new Date().toISOString().split('T')[0])
    setLogFryCount('')
    setLogTemp('')
    setLogFeeding('')
    setLogWaterChange('')
    setLogHealth('')
    setLogNotes('')
    setLogSaving(false)
    setLogOpen(false)
    await loadLogs(selectedSpawn.id as string)
    loadData()
  }

  const filteredSpawns = spawns.filter((s) => !stageFilter || s.stage === stageFilter)
  const STAGES = ['eggs', 'wrigglers', 'free-swimming', 'growout', 'jarring', 'juvenile', 'sold']

  return (
    <DashboardShell user={user} pageTitle="Spawn Tracker">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-spawn-text">Spawn Tracker</h1>
            <p className="text-spawn-muted-text text-sm mt-0.5">{spawns.length} spawns recorded</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} variant="primary">+ Log Spawn</Button>
        </div>

        {/* Stage filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStageFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${!stageFilter ? 'bg-spawn-cyan/10 text-spawn-cyan border border-spawn-cyan/20' : 'bg-spawn-surface text-spawn-muted-text border border-spawn-border hover:border-spawn-cyan/20'}`}
          >
            All
          </button>
          {STAGES.map((s) => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${stageFilter === s ? 'bg-spawn-cyan/10 text-spawn-cyan border border-spawn-cyan/20' : 'bg-spawn-surface text-spawn-muted-text border border-spawn-border hover:border-spawn-cyan/20'}`}
            >
              {stageLabel(s)}
            </button>
          ))}
        </div>

        {/* Spawns grid */}
        {loading ? (
          <div className="text-center py-16 text-spawn-muted-text text-sm">Loading spawns...</div>
        ) : filteredSpawns.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">📋</div>
            <h3 className="font-bold text-spawn-text mb-2">No spawns yet</h3>
            <p className="text-spawn-muted-text text-sm mb-6">Log your first spawn to start tracking fry survival.</p>
            <Button onClick={() => setCreateOpen(true)} variant="primary">Log First Spawn</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpawns.map((spawn) => (
              <SpawnCard
                key={spawn.id as string}
                spawn={spawn as Parameters<typeof SpawnCard>[0]['spawn']}
                onClick={() => openSpawn(spawn)}
              />
            ))}
          </div>
        )}

        {/* Selected spawn detail panel */}
        {selectedSpawn && (
          <div className="glass-card rounded-2xl border border-spawn-cyan/20 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-spawn-text text-lg">
                {(selectedSpawn.pair as any)?.pair_name as string ?? 'Spawn Detail'}
              </h2>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setLogOpen(true)}>
                  + Add Log
                </Button>
                <Button size="sm" variant="amber" onClick={() => { setEditOpen(true) }}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedSpawn(null)}>
                  Close
                </Button>
              </div>
            </div>

            {/* Survival calculator */}
            <SurvivalCalculator
              estimatedEggs={selectedSpawn.estimated_eggs as number ?? 0}
              estimatedHatched={selectedSpawn.estimated_hatched as number ?? 0}
              currentFryCount={selectedSpawn.current_fry_count as number ?? 0}
              stage={selectedSpawn.stage as string}
            />

            {/* Spawn notes */}
            {selectedSpawn.notes && (
              <div>
                <div className="text-xs text-spawn-muted-text uppercase tracking-wider mb-2">Spawn Notes</div>
                <p className="text-sm text-spawn-muted-text">{selectedSpawn.notes as string}</p>
              </div>
            )}

            {/* Spawn logs */}
            <div>
              <div className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest mb-3">
                Log Entries ({logs.length})
              </div>
              {logs.length === 0 ? (
                <p className="text-sm text-spawn-muted-text">No log entries yet. Add your first log above.</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id as string} className="p-4 rounded-xl bg-spawn-surface border border-spawn-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-spawn-cyan font-mono text-xs font-semibold">{formatDate(log.log_date as string)}</span>
                        {log.fry_count !== null && (
                          <span className="text-xs text-spawn-text font-medium">{log.fry_count as number} fry</span>
                        )}
                        {log.water_temp !== null && (
                          <span className="text-xs text-spawn-muted-text">{log.water_temp as number}°F</span>
                        )}
                      </div>
                      {log.feeding_notes && <p className="text-xs text-spawn-muted-text mb-1">🍽 {log.feeding_notes as string}</p>}
                      {log.water_change_notes && <p className="text-xs text-spawn-muted-text mb-1">💧 {log.water_change_notes as string}</p>}
                      {log.health_notes && <p className="text-xs text-spawn-muted-text mb-1">🩺 {log.health_notes as string}</p>}
                      {log.notes && <p className="text-xs text-spawn-muted-text">{log.notes as string}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create spawn modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Log New Spawn" size="lg">
        <SpawnForm
          pairs={pairs as Parameters<typeof SpawnForm>[0]['pairs']}
          onSuccess={() => { setCreateOpen(false); loadData() }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {/* Edit spawn modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Spawn" size="lg">
        <SpawnForm
          pairs={pairs as Parameters<typeof SpawnForm>[0]['pairs']}
          spawnToEdit={selectedSpawn ?? undefined}
          onSuccess={() => {
            setEditOpen(false)
            loadData()
            if (selectedSpawn) loadLogs(selectedSpawn.id as string)
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      {/* Add log modal */}
      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Add Spawn Log" size="md">
        <form onSubmit={handleSaveLog} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">Date</label>
              <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">Fry Count</label>
              <input type="number" min={0} value={logFryCount} onChange={(e) => setLogFryCount(e.target.value)} placeholder="Current count"
                className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">Water Temp (°F)</label>
            <input type="number" step="0.1" value={logTemp} onChange={(e) => setLogTemp(e.target.value)} placeholder="78.5"
              className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors" />
          </div>
          {[
            { field: logFeeding, setter: setLogFeeding, label: 'Feeding Notes' },
            { field: logWaterChange, setter: setLogWaterChange, label: 'Water Change Notes' },
            { field: logHealth, setter: setLogHealth, label: 'Health Notes' },
            { field: logNotes, setter: setLogNotes, label: 'General Notes' },
          ].map(({ field, setter, label }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">{label}</label>
              <textarea value={field} onChange={(e) => setter(e.target.value)} rows={2} placeholder={`${label}...`}
                className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm resize-none focus:outline-none focus:border-spawn-cyan/50 transition-colors" />
            </div>
          ))}
          <div className="flex gap-3">
            <Button type="submit" loading={logSaving} className="flex-1">Save Log</Button>
            <Button type="button" variant="secondary" onClick={() => setLogOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
