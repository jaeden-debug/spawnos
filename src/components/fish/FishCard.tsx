import Link from 'next/link'
import Image from 'next/image'
import type { Fish } from '@/types/fish'
import { SexBadge, StatusBadge } from '@/components/ui/Badge'
import { slugToLabel, formatDate } from '@/lib/utils'

interface FishCardProps {
  fish: Fish
}

export default function FishCard({ fish }: FishCardProps) {
  return (
    <Link href={`/dashboard/fish/${fish.id}`}>
      <div className="glass-card rounded-2xl border border-spawn-border hover-card overflow-hidden">
        {/* Photo */}
        <div className="relative h-40 bg-spawn-surface">
          {fish.photo_url ? (
            <Image
              src={fish.photo_url}
              alt={fish.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl opacity-30">🐠</div>
            </div>
          )}
          {/* Sex indicator overlay */}
          <div className="absolute top-2 right-2">
            <SexBadge sex={fish.sex} />
          </div>
          {/* Rarity score overlay */}
          {fish.rarity_score !== null && fish.rarity_score > 50 && (
            <div className="absolute top-2 left-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 font-medium">
                ⭐ {fish.rarity_score}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-spawn-text truncate">{fish.name}</h3>
            <StatusBadge status={fish.status} />
          </div>

          {fish.strain && (
            <p className="text-xs text-spawn-muted-text mb-2 truncate">{fish.strain}</p>
          )}

          <div className="flex flex-wrap gap-1">
            {fish.tail_type && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-spawn-surface border border-spawn-border text-spawn-muted-text">
                {slugToLabel(fish.tail_type)}
              </span>
            )}
            {fish.color_base && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-spawn-surface border border-spawn-border text-spawn-muted-text">
                {slugToLabel(fish.color_base)}
              </span>
            )}
            {fish.pattern_type && fish.pattern_type !== 'solid' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-spawn-surface border border-spawn-border text-spawn-cyan">
                {slugToLabel(fish.pattern_type)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
