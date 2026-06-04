'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PairPredictionPanel from './PairPredictionPanel'
import Button from '@/components/ui/Button'
import type { Fish } from '@/types/fish'
import { predictPairing } from '@/lib/genetics/predictionEngine'
import { slugToLabel } from '@/lib/utils'

interface PairBuilderProps {
  allFish: Fish[]
  onSuccess?: () => void
  onCancel?: () => void
}

function FishSelector({
  label,
  sex,
  fish,
  selected,
  onSelect,
}: {
  label: string
  sex: 'male' | 'female'
  fish: Fish[]
  selected: Fish | null
  onSelect: (f: Fish | null) => void
}) {
  const options = fish.filter((f) => f.sex === sex && f.status === 'active')
  const color = sex === 'male' ? 'cyan' : 'rose'

  return (
    <div className="flex-1">
      <div className={`text-xs font-semibold uppercase tracking-widest mb-3 text-${color}-400`}>{label}</div>
      {selected ? (
        <div className={`p-4 rounded-xl bg-${color}-400/5 border border-${color}-400/20`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-bold text-spawn-text">{selected.name}</div>
              {selected.strain && <div className="text-xs text-spawn-muted-text">{selected.strain}</div>}
            </div>
            <button
              onClick={() => onSelect(null)}
              className="text-spawn-muted hover:text-rose-400 transition-colors text-xs"
            >
              ✕ Swap
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selected.tail_type && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-spawn-surface border border-spawn-border text-spawn-muted-text">
                {slugToLabel(selected.tail_type)}
              </span>
            )}
            {selected.color_base && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-spawn-surface border border-spawn-border text-spawn-muted-text">
                {slugToLabel(selected.color_base)}
              </span>
            )}
            {selected.pattern_type && (
              <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-400/10 border border-${color}-400/20 text-${color}-400`}>
                {slugToLabel(selected.pattern_type)}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-spawn-muted-text mb-2">
            {options.length} active {sex === 'male' ? 'males' : 'females'} available
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {options.length === 0 ? (
              <p className="text-xs text-spawn-muted py-4 text-center">
                No active {sex === 'male' ? 'males' : 'females'} in library
              </p>
            ) : (
              options.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onSelect(f)}
                  className="w-full text-left p-3 rounded-xl bg-spawn-surface border border-spawn-border hover:border-spawn-cyan/30 transition-colors"
                >
                  <div className="font-medium text-spawn-text text-sm">{f.name}</div>
                  <div className="text-xs text-spawn-muted-text mt-0.5">
                    {[f.tail_type, f.color_base, f.pattern_type].flatMap((v) => (v ? [slugToLabel(v)] : [])).join(' · ')}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PairBuilder({ allFish, onSuccess, onCancel }: PairBuilderProps) {
  const router = useRouter()
  const [male, setMale] = useState<Fish | null>(null)
  const [female, setFemale] = useState<Fish | null>(null)
  const [pairName, setPairName] = useState('')
  const [goal, setGoal] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const prediction = male && female ? predictPairing(male, female) : null

  async function handleSave() {
    if (!male || !female) return
    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const pred = predictPairing(male, female)

      const { data, error: insertError } = await supabase
        .from('pairs')
        .insert({
          user_id: user.id,
          male_id: male.id,
          female_id: female.id,
          pair_name: pairName || `${male.name} × ${female.name}`,
          goal: goal || null,
          notes: notes || null,
          compatibility_score: pred.compatibilityScore,
          predicted_outcomes: pred as unknown as Record<string, unknown>,
          value_potential: { tier: pred.highValuePotential >= 80 ? 'elite' : pred.highValuePotential >= 65 ? 'high' : pred.highValuePotential >= 45 ? 'medium' : 'low', score: pred.highValuePotential },
          status: 'planned',
        })
        .select()
        .single()

      if (insertError) throw insertError

      onSuccess?.()
      router.push(`/dashboard/pairs/${data.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pair')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Fish selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FishSelector label="♂ Male" sex="male" fish={allFish} selected={male} onSelect={setMale} />
        <FishSelector label="♀ Female" sex="female" fish={allFish} selected={female} onSelect={setFemale} />
      </div>

      {/* Pair metadata */}
      {male && female && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">
              Pair Name
            </label>
            <input
              type="text"
              value={pairName}
              onChange={(e) => setPairName(e.target.value)}
              placeholder={`${male.name} × ${female.name}`}
              className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">
              Breeding Goal
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Produce show-quality koi halfmoon"
              className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Additional notes..."
              className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm resize-none focus:outline-none focus:border-spawn-cyan/50 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Live prediction */}
      {male && female && prediction && (
        <div className="glass-card rounded-2xl border border-spawn-border p-5">
          <PairPredictionPanel male={male} female={female} />
        </div>
      )}

      {!male && !female && (
        <div className="text-center py-8 text-spawn-muted-text text-sm">
          Select a male and female fish to see compatibility prediction
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-400/10 border border-rose-400/20 text-rose-400 text-sm">{error}</div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={!male || !female}
          loading={saving}
          variant="primary"
          size="lg"
          className="flex-1"
        >
          Save Pair
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
