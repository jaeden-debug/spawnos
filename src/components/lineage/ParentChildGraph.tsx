'use client'

import { useRouter } from 'next/navigation'
import type { Fish } from '@/types/fish'

interface ParentChildGraphProps {
  fish: Fish
  parents: Array<{ id: string; name: string; sex: string; relationship: string }>
  offspring: Array<{ id: string; name: string; sex: string }>
}

export default function ParentChildGraph({ fish, parents, offspring }: ParentChildGraphProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Parents row */}
      {parents.length > 0 && (
        <div>
          <div className="text-xs text-spawn-muted-text uppercase tracking-wider mb-3">Parents</div>
          <div className="flex flex-wrap gap-3 justify-center">
            {parents.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => router.push(`/dashboard/fish/${p.id}`)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium hover:opacity-80 transition-opacity ${
                    p.sex === 'male'
                      ? 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400'
                      : 'bg-rose-400/10 border-rose-400/20 text-rose-400'
                  }`}
                >
                  {p.sex === 'male' ? '♂' : '♀'} {p.name}
                </button>
                <div className="text-xs text-spawn-muted capitalize">{p.relationship}</div>
              </div>
            ))}
          </div>
          {/* Connector */}
          <div className="flex justify-center mt-2">
            <div className="w-px h-8 bg-spawn-border" />
          </div>
        </div>
      )}

      {/* Root fish */}
      <div className="flex justify-center">
        <div className={`px-6 py-3 rounded-2xl border-2 font-bold text-base ${
          fish.sex === 'male'
            ? 'bg-cyan-400/10 border-cyan-400/40 text-cyan-400'
            : fish.sex === 'female'
            ? 'bg-rose-400/10 border-rose-400/40 text-rose-400'
            : 'bg-spawn-surface border-spawn-border text-spawn-text'
        }`}>
          {fish.sex === 'male' ? '♂' : fish.sex === 'female' ? '♀' : '?'} {fish.name}
          <div className="text-xs font-normal text-spawn-muted-text mt-0.5">This fish</div>
        </div>
      </div>

      {/* Offspring */}
      {offspring.length > 0 && (
        <div>
          <div className="flex justify-center mb-2">
            <div className="w-px h-8 bg-spawn-border" />
          </div>
          <div className="text-xs text-spawn-muted-text uppercase tracking-wider mb-3 text-center">
            Offspring ({offspring.length})
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {offspring.map((o) => (
              <button
                key={o.id}
                onClick={() => router.push(`/dashboard/fish/${o.id}`)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium hover:opacity-80 transition-opacity ${
                  o.sex === 'male'
                    ? 'bg-cyan-400/5 border-cyan-400/20 text-cyan-400'
                    : o.sex === 'female'
                    ? 'bg-rose-400/5 border-rose-400/20 text-rose-400'
                    : 'bg-spawn-surface border-spawn-border text-spawn-muted-text'
                }`}
              >
                {o.sex === 'male' ? '♂' : o.sex === 'female' ? '♀' : '?'} {o.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {parents.length === 0 && offspring.length === 0 && (
        <p className="text-sm text-spawn-muted-text text-center py-4">No lineage connections recorded.</p>
      )}
    </div>
  )
}
