'use client'

import { useState } from 'react'
import DashboardShell from '@/components/layout/DashboardShell'
import TraitCalculator from '@/components/calculators/TraitCalculator'
import MatchCalculator from '@/components/calculators/MatchCalculator'
import ValuePotentialCalculator from '@/components/calculators/ValuePotentialCalculator'
import type { User } from '@supabase/supabase-js'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const TABS = [
  { id: 'trait', label: 'Trait Prediction', icon: '🧬', desc: 'Manual entry genetics calculator' },
  { id: 'match', label: 'Match Calculator', icon: '⚡', desc: 'Match from your fish library' },
  { id: 'value', label: 'Value Potential', icon: '⭐', desc: 'Estimate individual fish value' },
]

export default function CalculatorsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('trait')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <DashboardShell user={user} pageTitle="Calculators">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-spawn-text">Calculators</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
              Powered by Zylx.ai
            </span>
          </div>
          <p className="text-spawn-muted-text text-sm">
            Predict genetics, calculate compatibility, and estimate value potential.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-spawn-cyan/10 text-spawn-cyan border border-spawn-cyan/20'
                  : 'bg-spawn-surface text-spawn-muted-text border border-spawn-border hover:border-spawn-cyan/20'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        <div className="glass-card rounded-2xl border border-spawn-border p-6">
          <div className="mb-6">
            <h2 className="font-bold text-spawn-text text-lg">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-spawn-muted-text text-sm mt-0.5">
              {TABS.find((t) => t.id === activeTab)?.desc}
            </p>
          </div>

          {activeTab === 'trait' && <TraitCalculator />}
          {activeTab === 'match' && <MatchCalculator />}
          {activeTab === 'value' && <ValuePotentialCalculator />}
        </div>

        {/* Tips */}
        <div className="glass-card rounded-2xl border border-spawn-border p-5">
          <h3 className="text-xs font-semibold text-spawn-cyan uppercase tracking-widest mb-3">
            How to Interpret Predictions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-spawn-muted-text">
            <div>
              <div className="font-medium text-spawn-text mb-1">Compatibility Score</div>
              <p>Overall pairing quality based on trait harmony, health scores, and fertility confidence. 70+ is recommended for planned breeding projects.</p>
            </div>
            <div>
              <div className="font-medium text-spawn-text mb-1">Predictability Score</div>
              <p>How consistent the fry outcomes will be. High-variable patterns (marble, koi, galaxy) lower this score but can increase rare trait chances.</p>
            </div>
            <div>
              <div className="font-medium text-spawn-text mb-1">Rare Trait Chance</div>
              <p>Estimated probability of rare or exceptional trait expression in the offspring. Higher when both parents carry rare genetics.</p>
            </div>
            <div>
              <div className="font-medium text-spawn-text mb-1">Value Potential</div>
              <p>Composite score of pattern rarity, scale type, finnage, and body quality. Elite tier fry from high-value pairings can command premium prices.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
