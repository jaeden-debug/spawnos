import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import SpeciesSearch from '@/components/species/SpeciesSearch'
import { getSpeciesList } from '@/lib/species-db'
import { breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Aquarium Species Database — Water Parameters, Care Guides & Breeding',
  description:
    'The most comprehensive aquarium species database online. Verified water parameters, care difficulty, compatibility, and breeding guides for 100+ freshwater and saltwater fish, shrimp, snails, live foods, microfauna, amphibians, and aquatic plants.',
  alternates: { canonical: '/species' },
  openGraph: {
    title: 'Aquarium Species Database — SpawnOS',
    description:
      'Verified water parameters, care profiles, and breeding intelligence for 100+ aquarium species. Betta, discus, clownfish, tangs, axolotl, shrimp, snails, daphnia, and more.',
    type: 'website',
  },
}

const CATEGORY_STATS = [
  { key: 'freshwater', label: 'Freshwater', icon: '🐟' },
  { key: 'saltwater', label: 'Saltwater', icon: '🐠' },
  { key: 'shrimp', label: 'Shrimp', icon: '🦐' },
  { key: 'snail', label: 'Snails', icon: '🐌' },
  { key: 'live_food', label: 'Live Foods', icon: '🦠' },
  { key: 'microfauna', label: 'Microfauna', icon: '🔬' },
  { key: 'plant', label: 'Plants', icon: '🌿' },
  { key: 'amphibian', label: 'Amphibians', icon: '🦎' },
]

export default async function SpeciesPage() {
  const species = await getSpeciesList()

  const totalSpecies = species.length
  const beginnerCount = species.filter((s) => s.difficulty === 'beginner').length
  const intermediateCount = species.filter((s) => s.difficulty === 'intermediate').length
  const advancedCount = species.filter((s) => s.difficulty === 'advanced' || s.difficulty === 'expert').length

  const categoryCounts = species.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] ?? 0) + 1
    return acc
  }, {})

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Aquarium Species Database',
      description: 'Comprehensive care guides and water parameter data for aquarium species',
      numberOfItems: totalSpecies,
      itemListElement: species.slice(0, 20).map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: s.common_name,
        url: `https://spawnos.com/species/${s.slug}`,
        description: s.seo_description,
      })),
    },
    breadcrumbSchema([
      { name: 'Home', href: '/' },
      { name: 'Species Database', href: '/species' },
    ]),
  ]

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <SiteHeader />

      <main className="pt-20">
        {/* Hero */}
        <section className="relative py-16 px-4 border-b border-spawn-border/50 overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-spawn-cyan/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-spawn-amber/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-spawn-muted-text mb-6">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <span className="text-spawn-text">Species Database</span>
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spawn-cyan/10 border border-spawn-cyan/20 text-spawn-cyan text-xs font-semibold mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-spawn-cyan animate-pulse" />
                  Species Intelligence Database
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-spawn-text mb-4 leading-tight">
                  The Aquarium Species<br />
                  <span className="text-spawn-cyan">Authority</span>
                </h1>
                <p className="text-spawn-muted-text leading-relaxed text-lg">
                  Peer-reviewed water parameters, scientific care data, breeding protocols, and
                  disease identification for {totalSpecies}+ species — freshwater fish, shrimp, snails,
                  live foods, microfauna, and aquatic plants. Built for serious aquarists and breeders.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 lg:shrink-0">
                {[
                  { value: totalSpecies, label: 'Species', color: 'text-spawn-cyan' },
                  { value: beginnerCount, label: 'Beginner', color: 'text-green-400' },
                  { value: intermediateCount, label: 'Intermediate', color: 'text-amber-400' },
                  { value: advancedCount, label: 'Advanced', color: 'text-orange-400' },
                ].map(({ value, label, color }) => (
                  <div key={label} className="bg-spawn-surface/50 border border-spawn-border/50 rounded-xl p-4 text-center">
                    <div className={`text-2xl font-black ${color}`}>{value}</div>
                    <div className="text-xs text-spawn-muted-text mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category quick stats */}
            <div className="flex flex-wrap gap-3 mt-8">
              {CATEGORY_STATS.map(({ key, label, icon }) => {
                const count = categoryCounts[key] ?? 0
                if (count === 0) return null
                return (
                  <div key={key} className="flex items-center gap-2 px-3 py-1.5 bg-spawn-surface/50 border border-spawn-border/40 rounded-full text-sm">
                    <span>{icon}</span>
                    <span className="text-spawn-text font-medium">{count}</span>
                    <span className="text-spawn-muted-text">{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Search + grid */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <SpeciesSearch species={species} />
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 px-4 bg-spawn-surface/20 border-t border-spawn-border/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-black text-spawn-text mb-3">
              Ready to build your tank?
            </h2>
            <p className="text-spawn-muted-text mb-8 leading-relaxed">
              Use the Compatibility Checker to evaluate species side by side, or generate an AI
              Tank Blueprint with parameters, stocking, and equipment recommendations in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/tools/fish-compatibility"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
              >
                Fish Compatibility Checker
              </Link>
              <Link
                href="/blueprints"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-spawn-border text-spawn-text hover:border-spawn-cyan/40 text-sm font-semibold transition-all"
              >
                Generate AI Tank Blueprint
              </Link>
              <Link
                href="/tools"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-spawn-border text-spawn-muted-text hover:text-spawn-text text-sm transition-all"
              >
                All Calculators →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
