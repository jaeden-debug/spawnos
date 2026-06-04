import Link from 'next/link'
import type { CMSSpecies } from '@/lib/species-db'

interface Props {
  species: CMSSpecies
}

const difficultyLabel: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert Only',
}

const categoryLabel: Record<string, string> = {
  freshwater: 'Freshwater',
  saltwater: 'Saltwater',
  shrimp: 'Shrimp',
  amphibian: 'Amphibian',
  turtle: 'Turtle',
  invertebrate: 'Invertebrate',
  live_food: 'Live Food',
}

export default function SpeciesHero({ species }: Props) {
  const minTankGallons = species.min_tank_litres ? Math.round(species.min_tank_litres / 3.785) : null
  const adultSize = species.adult_size_cm_max
    ? `${species.adult_size_cm_max} cm (${Math.round(species.adult_size_cm_max / 2.54 * 10) / 10}")`
    : null
  const lifespan = (species.lifespan_years_min && species.lifespan_years_max)
    ? `${species.lifespan_years_min}–${species.lifespan_years_max} years`
    : species.lifespan_years_max
    ? `Up to ${species.lifespan_years_max} years`
    : null

  return (
    <div className="relative overflow-hidden border-b border-spawn-border/30"
      style={{ background: `linear-gradient(135deg, ${species.hero_color}08 0%, transparent 60%)` }}>

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${species.hero_color}10 0%, transparent 70%)` }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">

          {/* Left: Species identity */}
          <div className="flex-1">
            {/* Category + difficulty badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full bg-spawn-surface border border-spawn-border text-spawn-muted-text">
                {categoryLabel[species.category] ?? species.category}
              </span>
              <span className={`text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                species.difficulty === 'beginner' ? 'bg-green-400/10 border-green-400/30 text-green-400' :
                species.difficulty === 'intermediate' ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' :
                species.difficulty === 'advanced' ? 'bg-orange-400/10 border-orange-400/30 text-orange-400' :
                'bg-red-400/10 border-red-400/30 text-red-400'
              }`}>
                {difficultyLabel[species.difficulty] ?? species.difficulty}
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-black text-spawn-text tracking-tight mb-2">
              {species.common_name}
            </h1>
            <p className="text-lg text-spawn-muted-text italic mb-1">{species.scientific_name}</p>
            <p className="text-sm text-spawn-muted-text mb-6">
              Family: <span className="text-spawn-text">{species.family}</span>
              {species.order_name && <> · Order: <span className="text-spawn-text">{species.order_name}</span></>}
              {species.origin_regions.length > 0 && <> · <span className="text-spawn-text">{species.origin_regions.join(', ')}</span></>}
            </p>

            {/* Quick stat chips */}
            <div className="flex flex-wrap gap-2">
              {species.param_temp && (
                <div className="param-badge">
                  🌡️ {species.param_temp.ideal_min ?? species.param_temp.min}–{species.param_temp.ideal_max ?? species.param_temp.max}°C
                </div>
              )}
              {species.param_ph && (
                <div className="param-badge">
                  ⚗️ pH {species.param_ph.ideal_min ?? species.param_ph.min}–{species.param_ph.ideal_max ?? species.param_ph.max}
                </div>
              )}
              {minTankGallons && (
                <div className="param-badge">
                  🪣 {minTankGallons}+ gal
                </div>
              )}
              {adultSize && (
                <div className="param-badge">
                  📏 {adultSize}
                </div>
              )}
              {lifespan && (
                <div className="param-badge">
                  ⏳ {lifespan}
                </div>
              )}
              <div className={`param-badge ${
                species.temperament === 'peaceful' ? 'border-green-400/40 text-green-300 bg-green-400/10' :
                species.temperament === 'semi-aggressive' ? 'border-amber-400/40 text-amber-300 bg-amber-400/10' :
                species.temperament === 'aggressive' ? 'border-red-400/40 text-red-300 bg-red-400/10' :
                ''
              }`}>
                {species.temperament === 'peaceful' ? '🕊️' : species.temperament === 'aggressive' ? '⚔️' : '⚡'}{' '}
                {species.temperament.charAt(0).toUpperCase() + species.temperament.slice(1)}
              </div>
            </div>
          </div>

          {/* Right: CTA card */}
          <div className="lg:w-64 shrink-0">
            <div className="rounded-2xl bg-spawn-surface/60 border border-spawn-border/50 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-3">Build this tank</p>
              <p className="text-sm text-spawn-muted-text leading-relaxed mb-4">
                Generate a complete aquarium blueprint optimized for {species.common_name} — parameters, stocking, plants, and equipment.
              </p>
              <Link href="/blueprints"
                className="block w-full text-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ backgroundColor: species.hero_color, color: '#000' }}>
                Generate AI Blueprint
              </Link>
              <Link href="/tools/fish-compatibility"
                className="block w-full text-center px-4 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-muted-text hover:text-spawn-text text-sm font-medium transition-colors mt-2">
                Check Compatibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
