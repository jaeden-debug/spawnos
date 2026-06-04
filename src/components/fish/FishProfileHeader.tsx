import Image from 'next/image'
import type { Fish } from '@/types/fish'
import { SexBadge, StatusBadge } from '@/components/ui/Badge'
import { slugToLabel, formatDate } from '@/lib/utils'

interface FishProfileHeaderProps {
  fish: Fish
  onEdit?: () => void
}

export default function FishProfileHeader({ fish, onEdit }: FishProfileHeaderProps) {
  const traits = fish.traits as Record<string, unknown> | null

  return (
    <div className="glass-card rounded-2xl border border-spawn-border overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-0">
        {/* Photo */}
        <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-spawn-surface shrink-0">
          {fish.photo_url ? (
            <Image
              src={fish.photo_url}
              alt={fish.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 192px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl opacity-20">🐠</div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="text-2xl font-black text-spawn-text">{fish.name}</h1>
              {fish.strain && <p className="text-spawn-muted-text text-sm mt-0.5">{fish.strain}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SexBadge sex={fish.sex} />
              <StatusBadge status={fish.status} />
            </div>
          </div>

          {/* Trait chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {fish.tail_type && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-spawn-surface border border-spawn-border text-spawn-muted-text">
                {slugToLabel(fish.tail_type)} tail
              </span>
            )}
            {fish.color_base && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-spawn-surface border border-spawn-border text-spawn-muted-text">
                {slugToLabel(fish.color_base)}
              </span>
            )}
            {fish.pattern_type && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400">
                {slugToLabel(fish.pattern_type)}
              </span>
            )}
            {fish.scale_type && fish.scale_type !== 'normal' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400">
                {slugToLabel(fish.scale_type)}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {traits?.health_score !== undefined && (
              <div className="bg-spawn-surface rounded-xl p-3 border border-spawn-border">
                <div className="text-xs text-spawn-muted-text mb-0.5">Health</div>
                <div className="font-bold text-spawn-text">{String(traits.health_score)}/10</div>
              </div>
            )}
            {fish.finnage && (
              <div className="bg-spawn-surface rounded-xl p-3 border border-spawn-border">
                <div className="text-xs text-spawn-muted-text mb-0.5">Finnage</div>
                <div className="font-bold text-spawn-text capitalize">{fish.finnage.replace('-', ' ')}</div>
              </div>
            )}
            {fish.body_type && (
              <div className="bg-spawn-surface rounded-xl p-3 border border-spawn-border">
                <div className="text-xs text-spawn-muted-text mb-0.5">Body</div>
                <div className="font-bold text-spawn-text capitalize">{fish.body_type.replace('-', ' ')}</div>
              </div>
            )}
            {fish.rarity_score !== null && fish.rarity_score !== undefined && (
              <div className="bg-spawn-surface rounded-xl p-3 border border-spawn-border">
                <div className="text-xs text-spawn-muted-text mb-0.5">Rarity Score</div>
                <div className="font-bold text-amber-400">{fish.rarity_score}</div>
              </div>
            )}
          </div>

          {/* Dates + actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-xs text-spawn-muted-text">
              {fish.birth_date && <span>Born: {formatDate(fish.birth_date)}</span>}
              {fish.acquired_date && <span>Acquired: {formatDate(fish.acquired_date)}</span>}
              {fish.estimated_value_range && (
                <span className="text-spawn-text">Value: {fish.estimated_value_range}</span>
              )}
            </div>
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-xs text-spawn-cyan hover:text-spawn-cyan-dim transition-colors font-medium"
              >
                Edit Profile →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
