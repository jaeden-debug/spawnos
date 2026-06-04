import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Aquarium Knowledge Base — Care Guides, Articles & Deep Dives',
  description:
    'Aquarium care guides, species deep dives, water chemistry articles, and equipment breakdowns from Blackwater Aquatics Canada. Long-form fishkeeping knowledge for serious hobbyists.',
  alternates: { canonical: '/knowledge' },
}

const TOPIC_CATEGORIES = [
  {
    slug: 'bettas',
    icon: '🐠',
    title: 'Betta Fish',
    desc: 'Betta genetics, care, strain guides, blackwater betta breeding, and fin type breakdowns.',
    articles: ['Betta Genetics 101: Understanding Marble and Koi Patterns', 'How to Set Up a Blackwater Betta Tank', 'Halfmoon vs Plakat: Which Tail Type is Right for You?'],
  },
  {
    slug: 'blackwater',
    icon: '🌿',
    title: 'Blackwater Aquariums',
    desc: 'How to create authentic blackwater environments using tannins, botanicals, peat, and RO water.',
    articles: ['The Complete Blackwater Tank Setup Guide', 'Catappa Leaves, Alder Cones & Botanicals: What Actually Works', 'Understanding Tannins: pH, Hardness, and Aesthetics'],
  },
  {
    slug: 'planted',
    icon: '🌱',
    title: 'Planted Tanks',
    desc: 'Low-tech and high-tech planted tank guides, CO₂ injection, fertilisation, and substrate choices.',
    articles: ['Low-Tech vs High-Tech Planted Tanks: The Real Differences', 'Choosing the Right Substrate for a Planted Aquarium', 'Fertiliser Dosing: EI Method Explained'],
  },
  {
    slug: 'chemistry',
    icon: '⚗️',
    title: 'Water Chemistry',
    desc: 'pH, GH, KH, TDS, and nitrogen cycle deep dives for aquarists who want to understand what\'s happening in their tank.',
    articles: ['Why KH is the Most Misunderstood Parameter in Fishkeeping', 'The Nitrogen Cycle: A Complete Biochemical Explanation', 'RO Water: When to Use It and How to Remineralise'],
  },
  {
    slug: 'breeding',
    icon: '🥚',
    title: 'Breeding Guides',
    desc: 'Species-specific breeding setups, conditioning, spawning triggers, and fry care.',
    articles: ['Breeding Bettas: A Step-by-Step Bubble Nest Guide', 'How to Breed Corydoras: Temperature Drop Trigger Method', 'Raising Livebearer Fry: From Birth to Juvenile'],
  },
  {
    slug: 'equipment',
    icon: '🔧',
    title: 'Equipment Reviews',
    desc: 'Filtration, heating, lighting, and testing equipment breakdowns from a practical hobbyist perspective.',
    articles: ['Canister Filter Comparison: Which One Is Actually Worth It?', 'Best Heaters for Nano Tanks: Testing Accuracy Under $50', 'Liquid Test Kits vs Test Strips: The Data Comparison'],
  },
]

export default function KnowledgePage() {
  const jsonLd = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Knowledge Base', href: '/knowledge' },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader />

      <main className="pt-20">
        {/* Header */}
        <section className="py-16 px-4 border-b border-spawn-border/50 bg-spawn-surface/20">
          <div className="max-w-7xl mx-auto">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-spawn-muted-text mb-6">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <span className="text-spawn-text">Knowledge Base</span>
            </nav>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black text-spawn-text mb-3">Knowledge Base</h1>
                <p className="text-spawn-muted-text max-w-2xl leading-relaxed">
                  Long-form care guides, species deep dives, water chemistry explanations, and equipment
                  breakdowns from Blackwater Aquatics Canada. Written from real tank experience, not
                  rephrased Wikipedia.
                </p>
              </div>
              <a
                href="https://blackwateraquatics.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-spawn-border hover:border-spawn-cyan/40 text-spawn-muted-text hover:text-spawn-text text-sm font-semibold transition-all shrink-0"
              >
                Visit Blackwater Aquatics
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M2 11L11 2M11 2H5.5M11 2V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Topic grid */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto space-y-10">
            {TOPIC_CATEGORIES.map((cat) => (
              <div key={cat.slug} className="glass-card rounded-2xl border border-spawn-border/50 overflow-hidden">
                <div className="px-6 py-5 border-b border-spawn-border/30 bg-spawn-surface/30 flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <h2 className="font-bold text-spawn-text">{cat.title}</h2>
                    <p className="text-xs text-spawn-muted-text">{cat.desc}</p>
                  </div>
                </div>
                <div className="divide-y divide-spawn-border/20">
                  {cat.articles.map((article, i) => (
                    <a
                      key={i}
                      href={`https://blackwateraquatics.ca/blog?topic=${cat.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-6 py-4 hover:bg-spawn-surface/40 transition-colors group"
                    >
                      <span className="text-sm text-spawn-muted-text group-hover:text-spawn-text transition-colors">
                        {article}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0 ml-4 text-spawn-muted/40 group-hover:text-spawn-cyan transition-colors">
                        <path d="M2 12L12 2M12 2H6M12 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  ))}
                </div>
                <div className="px-6 py-3 border-t border-spawn-border/20 bg-spawn-surface/10">
                  <a
                    href={`https://blackwateraquatics.ca/blog?topic=${cat.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-spawn-cyan hover:underline font-medium"
                  >
                    View all {cat.title.toLowerCase()} articles on Blackwater Aquatics →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bridge section */}
        <section className="py-16 px-4 bg-spawn-surface/20 border-t border-spawn-border/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-black text-spawn-text mb-3">SpawnOS + Blackwater Aquatics</h2>
            <p className="text-spawn-muted-text leading-relaxed mb-3">
              SpawnOS and Blackwater Aquatics Canada are designed as a connected system. SpawnOS provides
              the precision tools — verified parameters, calculators, and AI blueprints. Blackwater provides
              the depth — long-form articles, product guides, and community-based knowledge.
            </p>
            <p className="text-spawn-muted-text leading-relaxed mb-8">
              Use them together for the most complete fishkeeping resource available.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/species"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
              >
                Browse Species Database
              </Link>
              <a
                href="https://blackwateraquatics.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-spawn-border text-spawn-muted-text hover:text-spawn-text text-sm font-semibold transition-all"
              >
                Visit Blackwater Aquatics
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
