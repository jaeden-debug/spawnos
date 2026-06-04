import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import MdxRenderer from '@/components/content/MdxRenderer'
import { breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'SpawnOS by Blackwater Aquatics Canada | Aquarium Tools, Fish Compatibility & Breeder Intelligence',
  description:
    'SpawnOS is a Blackwater Aquatics Canada product — the aquarium operating system. Free science-grade calculators, a deep species database, a fish compatibility checker, breeder intelligence, and AI tank guidance.',
  keywords: [
    'SpawnOS',
    'Blackwater Aquatics Canada',
    'aquarium tools',
    'fish compatibility checker',
    'aquarium calculators',
    'breeder software',
    'fish breeding tracker',
    'live food Canada',
    'aquarium operating system',
  ],
  alternates: { canonical: '/spawnos-by-blackwater-aquatics' },
  openGraph: {
    title: 'SpawnOS by Blackwater Aquatics Canada — The Aquarium Operating System',
    description:
      'Free aquarium calculators, species intelligence, a fish compatibility engine, and breeder tools. SpawnOS is a Blackwater Aquatics Canada product.',
    type: 'article',
    locale: 'en_CA',
  },
}

function pillarSource(): string {
  try {
    return fs.readFileSync(
      path.join(process.cwd(), 'src', 'content', 'pillars', 'spawnos-by-blackwater-aquatics.mdx'),
      'utf8',
    )
  } catch {
    return ''
  }
}

const RELATED: { href: string; label: string; desc: string; external?: boolean }[] = [
  { href: '/tools/fish-compatibility', label: 'Fish Compatibility Checker', desc: 'Score any two species across parameters, temperament, size, and predation.' },
  { href: '/tools', label: 'Aquarium Calculators', desc: '14 free science-based tools — stocking, chemistry, filtration, lighting, disease.' },
  { href: '/species', label: 'Species Database', desc: 'Full care guides with parameters, temperament, and breeding data.' },
  { href: '/live-foods', label: 'Live Food Encyclopedia', desc: 'Every live food mapped to fish and life stage — the Blackwater cultures.' },
  { href: '/library', label: 'The Library', desc: 'Microfauna, problems, compatibility, and live food authority databases.' },
  { href: 'https://blackwateraquatics.ca', label: 'Blackwater Aquatics Canada', desc: 'The company behind SpawnOS — breeder-grade live foods and fish, shipped Canada-wide.', external: true },
]

export default function BlackwaterPage() {
  const source = pillarSource()

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Blackwater Aquarium Database', href: '/spawnos-by-blackwater-aquatics' },
  ])

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'SpawnOS by Blackwater Aquatics Canada',
    description:
      'SpawnOS is a Blackwater Aquatics Canada product — the aquarium operating system with free calculators, species data, a compatibility engine, and breeder intelligence.',
    author: { '@type': 'Organization', name: 'Blackwater Aquatics Canada', url: 'https://blackwateraquatics.ca' },
    publisher: { '@type': 'Organization', name: 'SpawnOS', url: 'https://spawnos.app' },
    mainEntityOfPage: 'https://spawnos.app/spawnos-by-blackwater-aquatics',
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is SpawnOS made by Blackwater Aquatics Canada?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. SpawnOS is a Blackwater Aquatics Canada product. Blackwater Aquatics Canada is the company; SpawnOS is its aquarium intelligence platform — the calculators, species database, compatibility engine, and breeder tools.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is SpawnOS free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The public tools are completely free and require no account: all aquarium calculators, the species database, the compatibility checker, the Library, and the AI assistant. The breeder workspace for tracking fish, pairs, spawns, and lineage is the deeper layer for serious fishrooms.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does Blackwater Aquatics Canada sell?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Breeder-grade live food cultures — live scuds, daphnia, and microworms — plus fish and breeding stock, shipped across Canada.',
        },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <SiteHeader />
      <main className="pt-[64px]">

        {/* Hero */}
        <header className="px-4 pt-10 pb-8 border-b border-spawn-border/30">
          <div className="max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-spawn-muted-text mb-5" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <Link href="/library" className="hover:text-spawn-cyan transition-colors">Library</Link>
              <span>/</span>
              <span className="text-spawn-text">Blackwater Aquarium Database</span>
            </nav>
            <div className="text-xs font-bold uppercase tracking-widest text-spawn-cyan mb-3">Blackwater Aquarium Database</div>
            <h1 className="text-3xl sm:text-[2.75rem] font-black tracking-tight text-spawn-text leading-[1.08] mb-4">
              SpawnOS by Blackwater Aquatics Canada
            </h1>
            <p className="text-lg text-spawn-text-dim leading-relaxed">
              Aquarium tools, fish compatibility, and breeder intelligence — the aquarium operating system built by{' '}
              <a href="https://blackwateraquatics.ca" target="_blank" rel="noopener noreferrer" className="text-spawn-cyan font-semibold hover:underline">Blackwater Aquatics Canada</a>.
              Free calculators, a deep species database, a compatibility engine, and a breeding workspace.
            </p>
          </div>
        </header>

        {/* Authority body */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <MdxRenderer source={source} />
        </div>

        {/* Related across the platform */}
        <section className="px-4 py-12 bg-spawn-surface/20 border-t border-spawn-border/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-black tracking-tight text-spawn-text mb-1">Explore the platform</h2>
            <p className="text-sm text-spawn-muted-text mb-6">Everything in SpawnOS is connected — start anywhere.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {RELATED.map((r) =>
                r.external ? (
                  <a key={r.href} href={r.href} target="_blank" rel="noopener noreferrer"
                    className="group flex flex-col rounded-2xl border border-spawn-border/60 bg-spawn-card/40 hover:border-spawn-cyan/30 hover:bg-spawn-card/70 transition-all p-5">
                    <h3 className="text-base font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors mb-1.5">{r.label}</h3>
                    <p className="text-sm text-spawn-muted-text leading-relaxed">{r.desc}</p>
                  </a>
                ) : (
                  <Link key={r.href} href={r.href}
                    className="group flex flex-col rounded-2xl border border-spawn-border/60 bg-spawn-card/40 hover:border-spawn-cyan/30 hover:bg-spawn-card/70 transition-all p-5">
                    <h3 className="text-base font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors mb-1.5">{r.label}</h3>
                    <p className="text-sm text-spawn-muted-text leading-relaxed">{r.desc}</p>
                  </Link>
                ),
              )}
            </div>
          </div>
        </section>

        {/* Blackwater CTA */}
        <section className="px-4 py-16">
          <div className="max-w-3xl mx-auto rounded-2xl border border-spawn-cyan/25 bg-gradient-to-br from-spawn-cyan/[0.07] to-transparent p-6 sm:p-8">
            <div className="text-xs font-bold uppercase tracking-widest text-spawn-cyan mb-2">From Blackwater Aquatics Canada</div>
            <h2 className="text-xl font-black text-spawn-text mb-2">Feed live the way the best breeders do</h2>
            <p className="text-sm text-spawn-text-dim leading-relaxed mb-5">
              Blackwater Aquatics ships breeder-grade live scud, daphnia, and microworm cultures across Canada — the three that
              cover almost every fish and life stage.
            </p>
            <a href="https://blackwateraquatics.ca/collections/live-fish-food-canada" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all">
              Shop live foods →
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
