import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import MdxRenderer from '@/components/content/MdxRenderer'
import CompatibilityCard from '@/components/compatibility/CompatibilityCard'
import { getAllCompat } from '@/lib/compatibility'
import { breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Fish Compatibility: The Complete Guide — Which Fish Can Live Together?',
  description:
    'The complete guide to aquarium fish compatibility: the four factors that decide whether two species can share a tank — water parameters, temperament, size and predation, and competition — plus special cases and tank design. Links to the free compatibility checker.',
  keywords: [
    'fish compatibility',
    'which fish can live together',
    'aquarium tankmates',
    'fish compatibility guide',
    'community tank stocking',
    'fish that can live together',
  ],
  alternates: { canonical: '/compatibility/fish-compatibility-guide' },
  openGraph: {
    title: 'Fish Compatibility: The Complete Guide',
    description:
      'The four factors that actually decide whether two fish can share a tank — and how to design for them.',
    type: 'article',
    locale: 'en_CA',
  },
}

function pillarSource(): string {
  try {
    return fs.readFileSync(
      path.join(process.cwd(), 'src', 'content', 'pillars', 'fish-compatibility-guide.mdx'),
      'utf8',
    )
  } catch {
    return ''
  }
}

export default function FishCompatibilityGuidePage() {
  const source = pillarSource()
  const pairings = getAllCompat()

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Compatibility', href: '/compatibility' },
    { name: 'Compatibility Guide', href: '/compatibility/fish-compatibility-guide' },
  ])

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Fish Compatibility: The Complete Guide',
    description:
      'The four factors that decide aquarium fish compatibility — water parameters, temperament, size and predation, and competition — plus special cases and tank design.',
    author: { '@type': 'Organization', name: 'Blackwater Aquatics Canada', url: 'https://blackwateraquatics.ca' },
    publisher: { '@type': 'Organization', name: 'SpawnOS', url: 'https://spawnos.app' },
    mainEntityOfPage: 'https://spawnos.app/compatibility/fish-compatibility-guide',
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can any two fish live together if the tank is big enough?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. A bigger tank fixes aggression and competition, but it cannot fix non-overlapping temperature, incompatible water chemistry, or a predator-prey size gap. Space is a powerful lever for temperament, not a cure for chemistry or predation.',
        },
      },
      {
        '@type': 'Question',
        name: 'Why did my peaceful community fish suddenly die for no reason?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The most common hidden cause is chronic stress from water chemistry just outside a species’ comfort range. The fish survives for months at the edge of its tolerance, then loses an opportunistic infection it would otherwise resist. Matching parameters precisely prevents most mystery losses.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does the fish compatibility checker cost anything?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. The Fish Compatibility Checker and every other SpawnOS calculator are free and require no account. SpawnOS is a Blackwater Aquatics Canada product, and the public tools are free for everyone.',
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
              <Link href="/compatibility" className="hover:text-spawn-cyan transition-colors">Compatibility</Link>
              <span>/</span>
              <span className="text-spawn-text">Guide</span>
            </nav>
            <div className="text-xs font-bold uppercase tracking-widest text-spawn-cyan mb-3">Compatibility Pillar Guide</div>
            <h1 className="text-3xl sm:text-[2.75rem] font-black tracking-tight text-spawn-text leading-[1.08] mb-4">
              Fish compatibility: the complete guide.
            </h1>
            <p className="text-lg text-spawn-text-dim leading-relaxed">
              Compatibility is not a yes/no — it is a set of conditions. This is the complete framework for the four factors
              that actually decide whether two fish can share a tank, the special cases that break the rules, and how to design
              a setup that makes a borderline pairing work.
            </p>
          </div>
        </header>

        {/* Tool CTA — top of article */}
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <Link href="/tools/fish-compatibility"
            className="group flex items-center justify-between gap-4 rounded-2xl border border-spawn-cyan/30 bg-gradient-to-br from-spawn-cyan/[0.08] to-transparent p-5 hover:border-spawn-cyan/50 transition-all">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-spawn-cyan mb-1">Try it now</div>
              <div className="text-lg font-black text-spawn-text">Fish Compatibility Checker</div>
              <p className="text-sm text-spawn-muted-text mt-1">Score any two species instantly across all four factors — free, no signup.</p>
            </div>
            <span className="shrink-0 text-spawn-cyan font-bold text-sm group-hover:translate-x-1 transition-transform">Open →</span>
          </Link>
        </div>

        {/* Authority body */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <MdxRenderer source={source} />
        </div>

        {/* Scored pairings */}
        {pairings.length > 0 && (
          <section className="px-4 py-12 bg-spawn-surface/20 border-t border-spawn-border/30">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-black tracking-tight text-spawn-text mb-1">Scored pairings</h2>
              <p className="text-sm text-spawn-muted-text mb-6">Full write-ups with the reasoning behind each score, from the Compatibility Database.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pairings.map((p) => <CompatibilityCard key={p.slug} pairing={p} />)}
              </div>
            </div>
          </section>
        )}

        {/* Related tools */}
        <section className="px-4 py-14">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-black text-spawn-text mb-5">Use these alongside the guide</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { href: '/tools/fish-compatibility', label: 'Fish Compatibility Checker', desc: 'Score any two species across all four factors.' },
                { href: '/tools/stocking-density', label: 'Stocking Density Calculator', desc: 'Confirm you have the space and filtration for the bioload.' },
                { href: '/tools/water-parameters', label: 'Water Parameter Reference', desc: 'Compare ideal ranges across species before you buy.' },
                { href: '/compatibility', label: 'Compatibility Database', desc: 'Browse every scored, written-up pairing.' },
              ].map((r) => (
                <Link key={r.href} href={r.href}
                  className="group flex flex-col rounded-2xl border border-spawn-border/60 bg-spawn-card/40 hover:border-spawn-cyan/30 hover:bg-spawn-card/70 transition-all p-5">
                  <h3 className="text-base font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors mb-1.5">{r.label}</h3>
                  <p className="text-sm text-spawn-muted-text leading-relaxed">{r.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
