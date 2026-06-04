import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'About SpawnOS — Aquarium Operating System by Blackwater Aquatics Canada',
  description:
    'SpawnOS is the aquarium science platform built by Blackwater Aquatics Canada. Species database, calculators, and AI-powered tank blueprints for serious freshwater fishkeepers.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  const jsonLd = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader />

      <main className="pt-20">
        {/* Header */}
        <section className="py-16 px-4 border-b border-spawn-border/50 bg-spawn-surface/20">
          <div className="max-w-3xl mx-auto">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-spawn-muted-text mb-6">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <span className="text-spawn-text">About</span>
            </nav>
            <h1 className="text-4xl font-black text-spawn-text mb-4">About SpawnOS</h1>
            <p className="text-spawn-muted-text text-lg leading-relaxed">
              The aquarium operating system. Built by fishkeepers, for fishkeepers who want
              precision tools instead of pet-store guesswork.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto space-y-10 prose-aqua">

            <div>
              <h2 className="text-xl font-bold text-spawn-text mb-4">What SpawnOS Is</h2>
              <p>
                SpawnOS is a free, science-based aquarium tool platform. It exists to give freshwater hobbyists access
                to accurate, species-specific data and practical calculators that the broader aquarium hobby has never
                consolidated in one place.
              </p>
              <p>
                The platform covers three core areas: a <Link href="/species" className="text-spawn-cyan hover:underline">species database</Link> with
                verified water parameters and care profiles; a suite of <Link href="/tools" className="text-spawn-cyan hover:underline">aquarium calculators</Link> for
                water chemistry, stocking, compatibility, and more; and an <Link href="/blueprints" className="text-spawn-cyan hover:underline">AI Tank Blueprint
                Generator</Link> that produces complete setup plans from a description of your goals.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-spawn-text mb-4">Why We Built It</h2>
              <p>
                Blackwater Aquatics Canada is a hobbyist-run aquarium brand with a particular focus on blackwater
                and soft-water species — bettas, tetras, dwarf cichlids, South American catfish. Over years of
                keeping fish and writing care content, one pattern became obvious: the data available to most
                hobbyists is inaccurate, inconsistent, and frequently copied from sources that copied from other
                wrong sources.
              </p>
              <p>
                Parameter ranges on popular fish-keeping sites are often wrong by 0.5–1.0 pH units. Tank size
                recommendations routinely ignore filtration quality or species-specific space needs. Compatibility
                charts give binary yes/no answers that ignore water chemistry overlap entirely.
              </p>
              <p>
                SpawnOS exists to fix that. Every species entry is verified against primary literature. Every
                calculator produces defensible, conservative estimates. Every AI blueprint is guided by
                species-compatibility rules, not just aesthetic preferences.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-spawn-text mb-4">Data Standards</h2>
              <p>
                Parameter ranges in the species database are based on published ichthyological research, the
                Seriously Fish database, Fishbase, and long-term hobbyist documentation where academic literature
                is absent. Where sources conflict, we use the most conservative safe range — not the maximum
                tolerance.
              </p>
              <p>
                We do not represent minimum tolerance as an ideal range. A fish that can technically survive pH 8.0
                but thrives at pH 6.5 is listed with a range reflecting optimal health, not survival endpoints.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-spawn-text mb-4">The Relationship with Blackwater Aquatics Canada</h2>
              <p>
                SpawnOS is a product of <a href="https://blackwateraquatics.ca" target="_blank" rel="noopener noreferrer" className="text-spawn-cyan hover:underline">Blackwater Aquatics Canada</a>.
                The two properties are intentionally complementary: SpawnOS is the precision tool hub; Blackwater
                is the long-form knowledge base. SpawnOS provides parameter lookups, calculators, and AI blueprints.
                Blackwater provides care guides, product reviews, breeding articles, and community-oriented content.
              </p>
              <p>
                Both are free. Neither sells or promotes fish food, equipment, or products to generate content.
                Blackwater does carry some products, but SpawnOS is fully independent of any commercial consideration.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-spawn-text mb-4">Built With</h2>
              <p>
                SpawnOS is built on Next.js 15, TypeScript, Tailwind CSS, and Supabase. The AI Blueprint Generator
                uses OpenAI GPT-4o mini with carefully constructed aquarium science system prompts. The species
                database and calculators are built entirely on verified reference data — no AI is used to generate
                species parameters or calculator logic.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-spawn-surface/20 border-t border-spawn-border/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-black text-spawn-text mb-3">Start Using SpawnOS</h2>
            <p className="text-spawn-muted-text mb-8">
              All tools are free. No account required for public features.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/species" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all">
                Browse Species Database
              </Link>
              <Link href="/tools" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-spawn-border text-spawn-text hover:border-spawn-cyan/40 text-sm font-semibold transition-all">
                Open Calculators
              </Link>
              <Link href="/blueprints" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-spawn-border text-spawn-text hover:border-spawn-cyan/40 text-sm font-semibold transition-all">
                Generate Blueprint
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
