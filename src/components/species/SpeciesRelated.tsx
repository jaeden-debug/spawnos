import Link from 'next/link'
import { getSpeciesList } from '@/lib/species-db'

interface Props {
  currentSlug: string
  compatibleWith: string[]
}

export default async function SpeciesRelated({ currentSlug, compatibleWith }: Props) {
  // Show compatible species first, then fill with other species
  const allSpecies = await getSpeciesList({ limit: 12 })

  const related = [
    ...allSpecies.filter((s) => compatibleWith.includes(s.slug) && s.slug !== currentSlug),
    ...allSpecies.filter((s) => !compatibleWith.includes(s.slug) && s.slug !== currentSlug),
  ].slice(0, 6)

  if (related.length === 0) return null

  return (
    <section className="mt-16 pt-12 border-t border-spawn-border/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-spawn-text">Related Species</h2>
        <Link href="/species" className="text-sm text-spawn-cyan hover:underline">View all species →</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {related.map((species) => {
          const isCompatible = compatibleWith.includes(species.slug)
          return (
            <Link key={species.slug} href={`/species/${species.slug}`}
              className="group p-3 rounded-xl bg-spawn-surface/50 border border-spawn-border/50 hover:border-spawn-cyan/40 transition-all text-center">
              <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-xl"
                style={{ background: `${species.hero_color}20` }}>
                {species.category === 'shrimp' ? '🦐' : species.category === 'amphibian' ? '🦎' : species.category === 'saltwater' ? '🐠' : '🐟'}
              </div>
              <p className="text-xs font-medium text-spawn-text group-hover:text-spawn-cyan transition-colors leading-tight">{species.common_name}</p>
              {isCompatible && (
                <p className="text-xs text-green-400 mt-0.5">✓ Compatible</p>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
