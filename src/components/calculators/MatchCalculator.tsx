'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PairPredictionPanel from '@/components/pairs/PairPredictionPanel'
import type { Fish } from '@/types/fish'
import { slugToLabel } from '@/lib/utils'

export default function MatchCalculator() {
  const [fish, setFish] = useState<Fish[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [male, setMale] = useState<Fish | null>(null)
  const [female, setFemale] = useState<Fish | null>(null)

  async function loadFish() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('fish').select('*').eq('user_id', user.id).eq('status', 'active')
    setFish((data as Fish[]) ?? [])
    setLoaded(true)
    setLoading(false)
  }

  const males = fish.filter((f) => f.sex === 'male')
  const females = fish.filter((f) => f.sex === 'female')

  return (
    <div className="space-y-6">
      {!loaded ? (
        <div className="text-center py-6">
          <p className="text-sm text-spawn-muted-text mb-4">
            Load your fish library to match them here. Or use the Trait Calculator for manual entry.
          </p>
          <button
            onClick={loadFish}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-spawn-cyan-dim transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load My Fish Library'}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            {/* Male select */}
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">♂ Male</div>
              {males.length === 0 ? (
                <p className="text-xs text-spawn-muted-text">No active males in library</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {males.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setMale(f)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${male?.id === f.id ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30' : 'text-spawn-muted-text hover:bg-spawn-surface border border-transparent'}`}
                    >
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-spawn-muted">
                        {[f.tail_type, f.color_base, f.pattern_type].filter(Boolean).map(slugToLabel).join(' · ')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Female select */}
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4">
              <div className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-3">♀ Female</div>
              {females.length === 0 ? (
                <p className="text-xs text-spawn-muted-text">No active females in library</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {females.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFemale(f)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${female?.id === f.id ? 'bg-rose-400/20 text-rose-400 border border-rose-400/30' : 'text-spawn-muted-text hover:bg-spawn-surface border border-transparent'}`}
                    >
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-spawn-muted">
                        {[f.tail_type, f.color_base, f.pattern_type].filter(Boolean).map(slugToLabel).join(' · ')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {male && female ? (
            <div className="glass-card rounded-2xl border border-spawn-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-cyan-400 font-medium text-sm">{male.name}</span>
                <span className="text-spawn-muted text-xs">×</span>
                <span className="text-rose-400 font-medium text-sm">{female.name}</span>
              </div>
              <PairPredictionPanel male={male} female={female} />
            </div>
          ) : (
            <div className="text-center py-6 text-spawn-muted-text text-sm">
              Select a male and female to see compatibility prediction
            </div>
          )}
        </>
      )}
    </div>
  )
}
