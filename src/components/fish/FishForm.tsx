'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import type { Fish } from '@/types/fish'
import {
  TAIL_TYPE_OPTIONS,
  BASE_COLOR_OPTIONS,
  PATTERN_TYPE_OPTIONS,
  SCALE_TYPE_OPTIONS,
} from '@/types/fish'
import { calculateRarityScore } from '@/lib/genetics/scoringEngine'

interface FishFormProps {
  fish?: Fish
  onSuccess?: () => void
  onCancel?: () => void
}

const SEX_OPTIONS = [
  { value: 'male', label: '♂ Male' },
  { value: 'female', label: '♀ Female' },
  { value: 'unknown', label: 'Unknown' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
  { value: 'sold', label: 'Sold' },
  { value: 'deceased', label: 'Deceased' },
]

const FINNAGE_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'average', label: 'Average' },
  { value: 'strong', label: 'Strong' },
  { value: 'show-quality', label: 'Show Quality' },
]

const BODY_OPTIONS = [
  { value: 'weak', label: 'Weak' },
  { value: 'average', label: 'Average' },
  { value: 'strong', label: 'Strong' },
  { value: 'show-quality', label: 'Show Quality' },
]

const AGGRESSION_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const FERTILITY_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export default function FishForm({ fish, onSuccess, onCancel }: FishFormProps) {
  const router = useRouter()
  const isEdit = !!fish

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: fish?.name ?? '',
    sex: fish?.sex ?? 'unknown',
    species: fish?.species ?? 'betta',
    strain: fish?.strain ?? '',
    tail_type: fish?.tail_type ?? '',
    color_base: fish?.color_base ?? '',
    pattern_type: fish?.pattern_type ?? '',
    scale_type: fish?.scale_type ?? '',
    finnage: fish?.finnage ?? '',
    body_type: fish?.body_type ?? '',
    eye_color: fish?.eye_color ?? '',
    photo_url: fish?.photo_url ?? '',
    birth_date: fish?.birth_date ?? '',
    acquired_date: fish?.acquired_date ?? '',
    status: fish?.status ?? 'active',
    genotype_notes: fish?.genotype_notes ?? '',
    breeder_notes: fish?.breeder_notes ?? '',
    estimated_value_range: fish?.estimated_value_range ?? '',
    // traits
    health_score: String((fish?.traits as Record<string, unknown>)?.health_score ?? '7'),
    aggression_level: String((fish?.traits as Record<string, unknown>)?.aggression_level ?? 'medium'),
    fertility_confidence: String((fish?.traits as Record<string, unknown>)?.fertility_confidence ?? 'unknown'),
  })

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const traits = {
        health_score: parseInt(form.health_score) || 7,
        aggression_level: form.aggression_level || 'medium',
        fertility_confidence: form.fertility_confidence || 'unknown',
        finnage_quality: form.finnage || null,
        body_quality: form.body_type || null,
      }

      // Build a fish-like object for rarity calculation
      const fishData = {
        pattern_type: form.pattern_type as Fish['pattern_type'] || null,
        scale_type: form.scale_type as Fish['scale_type'] || null,
        tail_type: form.tail_type as Fish['tail_type'] || null,
        finnage: form.finnage as Fish['finnage'] || null,
        body_type: form.body_type as Fish['body_type'] || null,
        traits,
      } as unknown as Fish

      const rarityScore = calculateRarityScore(fishData)

      const payload = {
        name: form.name,
        sex: form.sex as Fish['sex'],
        species: form.species || 'betta',
        strain: form.strain || null,
        tail_type: form.tail_type as Fish['tail_type'] || null,
        color_base: form.color_base as Fish['color_base'] || null,
        pattern_type: form.pattern_type as Fish['pattern_type'] || null,
        scale_type: form.scale_type as Fish['scale_type'] || null,
        finnage: form.finnage as Fish['finnage'] || null,
        body_type: form.body_type as Fish['body_type'] || null,
        eye_color: form.eye_color || null,
        photo_url: form.photo_url || null,
        birth_date: form.birth_date || null,
        acquired_date: form.acquired_date || null,
        status: form.status as Fish['status'],
        genotype_notes: form.genotype_notes || null,
        breeder_notes: form.breeder_notes || null,
        estimated_value_range: form.estimated_value_range || null,
        traits,
        rarity_score: rarityScore,
        updated_at: new Date().toISOString(),
      }

      if (isEdit && fish) {
        const { error: updateError } = await supabase
          .from('fish')
          .update(payload)
          .eq('id', fish.id)
          .eq('user_id', user.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('fish')
          .insert({ ...payload, user_id: user.id })
        if (insertError) throw insertError
      }

      onSuccess?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save fish')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <section>
        <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest mb-4">Basic Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name" value={form.name} onChange={(e) => update('name', e.target.value)} required placeholder="e.g. Cobalt Rex" />
          <Input label="Strain / Line Name" value={form.strain} onChange={(e) => update('strain', e.target.value)} placeholder="e.g. HMPK Galaxy Line" />
          <Select label="Sex" value={form.sex} onChange={(e) => update('sex', e.target.value)} options={SEX_OPTIONS} />
          <Select label="Status" value={form.status} onChange={(e) => update('status', e.target.value)} options={STATUS_OPTIONS} />
          <Input label="Birth Date" type="date" value={form.birth_date} onChange={(e) => update('birth_date', e.target.value)} />
          <Input label="Acquired Date" type="date" value={form.acquired_date} onChange={(e) => update('acquired_date', e.target.value)} />
        </div>
      </section>

      {/* Photo */}
      <section>
        <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest mb-4">Photo</h3>
        <Input
          label="Photo URL"
          value={form.photo_url}
          onChange={(e) => update('photo_url', e.target.value)}
          placeholder="https://..."
          helper="Paste a direct image URL. Supabase Storage integration available in settings."
        />
      </section>

      {/* Traits & Appearance */}
      <section>
        <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest mb-4">Traits & Appearance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Tail Type" value={form.tail_type} onChange={(e) => update('tail_type', e.target.value)} options={TAIL_TYPE_OPTIONS} placeholder="Select tail type" />
          <Select label="Base Color" value={form.color_base} onChange={(e) => update('color_base', e.target.value)} options={BASE_COLOR_OPTIONS} placeholder="Select base color" />
          <Select label="Pattern Type" value={form.pattern_type} onChange={(e) => update('pattern_type', e.target.value)} options={PATTERN_TYPE_OPTIONS} placeholder="Select pattern" />
          <Select label="Scale Type" value={form.scale_type} onChange={(e) => update('scale_type', e.target.value)} options={SCALE_TYPE_OPTIONS} placeholder="Select scale type" />
          <Select label="Finnage Quality" value={form.finnage} onChange={(e) => update('finnage', e.target.value)} options={FINNAGE_OPTIONS} placeholder="Select quality" />
          <Select label="Body Quality" value={form.body_type} onChange={(e) => update('body_type', e.target.value)} options={BODY_OPTIONS} placeholder="Select quality" />
          <Input label="Eye Color" value={form.eye_color} onChange={(e) => update('eye_color', e.target.value)} placeholder="e.g. Red, Black" />
        </div>
      </section>

      {/* Breeding Metrics */}
      <section>
        <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest mb-4">Breeding Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider">
              Health Score (1–10)
            </label>
            <input
              type="number"
              min={1} max={10}
              value={form.health_score}
              onChange={(e) => update('health_score', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 focus:ring-1 focus:ring-spawn-cyan/20 transition-colors"
            />
          </div>
          <Select label="Aggression Level" value={form.aggression_level} onChange={(e) => update('aggression_level', e.target.value)} options={AGGRESSION_OPTIONS} />
          <Select label="Fertility Confidence" value={form.fertility_confidence} onChange={(e) => update('fertility_confidence', e.target.value)} options={FERTILITY_OPTIONS} />
        </div>
        <div className="mt-4">
          <Input
            label="Estimated Value Range"
            value={form.estimated_value_range}
            onChange={(e) => update('estimated_value_range', e.target.value)}
            placeholder="e.g. $25–$75 CAD"
          />
        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest mb-4">Notes</h3>
        <div className="space-y-4">
          <Textarea
            label="Genotype Notes"
            value={form.genotype_notes}
            onChange={(e) => update('genotype_notes', e.target.value)}
            placeholder="Known genetics, carrier status, suspected genotype..."
            rows={3}
          />
          <Textarea
            label="Breeder Notes"
            value={form.breeder_notes}
            onChange={(e) => update('breeder_notes', e.target.value)}
            placeholder="Behavior notes, feeding preferences, pair history..."
            rows={3}
          />
        </div>
      </section>

      {error && (
        <div className="p-3 rounded-xl bg-rose-400/10 border border-rose-400/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" size="lg" loading={loading} className="flex-1">
          {isEdit ? 'Save Changes' : 'Add Fish'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
