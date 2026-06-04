'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface SpawnFormProps {
  pairs: Array<{ id: string; pair_name: string | null; male?: { name: string } | null; female?: { name: string } | null }>
  spawnToEdit?: Record<string, unknown>
  onSuccess?: () => void
  onCancel?: () => void
}

const STAGE_OPTIONS = [
  { value: 'eggs', label: 'Eggs' },
  { value: 'wrigglers', label: 'Wrigglers' },
  { value: 'free-swimming', label: 'Free Swimming' },
  { value: 'growout', label: 'Grow-Out' },
  { value: 'jarring', label: 'Jarring' },
  { value: 'juvenile', label: 'Juvenile' },
  { value: 'sold', label: 'Sold / Distributed' },
]

export default function SpawnForm({ pairs, spawnToEdit, onSuccess, onCancel }: SpawnFormProps) {
  const router = useRouter()
  const isEdit = !!spawnToEdit

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    pair_id: (spawnToEdit?.pair_id as string) ?? '',
    spawn_date: (spawnToEdit?.spawn_date as string) ?? '',
    hatch_date: (spawnToEdit?.hatch_date as string) ?? '',
    estimated_eggs: String(spawnToEdit?.estimated_eggs ?? ''),
    estimated_hatched: String(spawnToEdit?.estimated_hatched ?? ''),
    current_fry_count: String(spawnToEdit?.current_fry_count ?? ''),
    stage: (spawnToEdit?.stage as string) ?? 'eggs',
    notes: (spawnToEdit?.notes as string) ?? '',
  })

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Auto-calculate survival rate
  const eggs = parseInt(form.estimated_eggs) || 0
  const hatched = parseInt(form.estimated_hatched) || 0
  const fry = parseInt(form.current_fry_count) || 0
  const survivalRate = hatched > 0 ? (fry / hatched) * 100 : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!form.pair_id) { setError('Select a pair'); setLoading(false); return }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const payload = {
        pair_id: form.pair_id,
        spawn_date: form.spawn_date || null,
        hatch_date: form.hatch_date || null,
        estimated_eggs: eggs || null,
        estimated_hatched: hatched || null,
        current_fry_count: fry || null,
        survival_rate: survivalRate !== null ? Math.round(survivalRate * 10) / 10 : null,
        stage: form.stage as 'eggs' | 'wrigglers' | 'free-swimming' | 'growout' | 'jarring' | 'juvenile' | 'sold',
        notes: form.notes || null,
        updated_at: new Date().toISOString(),
      }

      if (isEdit && spawnToEdit) {
        const { error: updateError } = await supabase.from('spawns').update(payload).eq('id', spawnToEdit.id as string)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('spawns').insert({ ...payload, user_id: user.id })
        if (insertError) throw insertError
      }

      onSuccess?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save spawn')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pair selection */}
      <div>
        <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">
          Breeding Pair *
        </label>
        <select
          value={form.pair_id}
          onChange={(e) => update('pair_id', e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors appearance-none"
        >
          <option value="" className="bg-spawn-surface">Select a pair...</option>
          {pairs.map((p) => (
            <option key={p.id} value={p.id} className="bg-spawn-surface">
              {p.pair_name ?? `${p.male?.name ?? '?'} × ${p.female?.name ?? '?'}`}
            </option>
          ))}
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">Spawn Date</label>
          <input type="date" value={form.spawn_date} onChange={(e) => update('spawn_date', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">Hatch Date</label>
          <input type="date" value={form.hatch_date} onChange={(e) => update('hatch_date', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors" />
        </div>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { field: 'estimated_eggs', label: 'Est. Eggs' },
          { field: 'estimated_hatched', label: 'Est. Hatched' },
          { field: 'current_fry_count', label: 'Current Fry' },
        ].map(({ field, label }) => (
          <div key={field}>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">{label}</label>
            <input
              type="number"
              min={0}
              value={form[field as keyof typeof form]}
              onChange={(e) => update(field, e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors"
            />
          </div>
        ))}
      </div>

      {/* Auto survival rate display */}
      {survivalRate !== null && hatched > 0 && (
        <div className="p-3 rounded-xl bg-spawn-surface border border-spawn-border text-sm">
          <span className="text-spawn-muted-text">Calculated Survival Rate: </span>
          <span className={`font-bold ${survivalRate >= 70 ? 'text-emerald-400' : survivalRate >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
            {survivalRate.toFixed(1)}%
          </span>
        </div>
      )}

      {/* Stage */}
      <div>
        <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">Stage</label>
        <select
          value={form.stage}
          onChange={(e) => update('stage', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors appearance-none"
        >
          {STAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-spawn-surface">{o.label}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={3}
          placeholder="Spawn observations, conditioning notes, environment details..."
          className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm resize-none focus:outline-none focus:border-spawn-cyan/50 transition-colors"
        />
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-400/10 border border-rose-400/20 text-rose-400 text-sm">{error}</div>
      )}

      <div className="flex gap-3">
        <Button type="submit" variant="primary" size="lg" loading={loading} className="flex-1">
          {isEdit ? 'Save Changes' : 'Log Spawn'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" size="lg" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  )
}
