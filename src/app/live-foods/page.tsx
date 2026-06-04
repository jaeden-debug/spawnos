import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import MdxRenderer from '@/components/content/MdxRenderer'
import MicrofaunaCard from '@/components/microfauna/MicrofaunaCard'
import RecommendedReading from '@/components/lab-notes/RecommendedReading'
import { getAllMicrofauna } from '@/lib/microfauna'
import { getAllLabNotes, getRecentLabNotes } from '@/lib/lab-notes'
import { breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Best Live Foods for Aquarium Fish — The Complete Encyclopedia',
  description:
    'The complete guide to live foods for aquarium fish: scuds, daphnia, microworms, baby brine shrimp and more. What each is best for, by fish and life stage, and how to culture them.',
  alternates: { canonical: '/live-foods' },
}

function pillarSource(): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'src', 'content', 'pillars', 'live-foods.mdx'), 'utf8')
  } catch {
    return ''
  }
}

export default function LiveFoodsPage() {
  const source = pillarSource()
  const liveFoodEntries = getAllMicrofauna().filter((m) => m.blackwater)
  const liveFoodNotes = getAllLabNotes().filter((n) => n.category === 'Live Food')
  const labNotes = liveFoodNotes.length > 0 ? liveFoodNotes : getRecentLabNotes(3)

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Live Foods', href: '/live-foods' },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
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
              <span className="text-spawn-text">Live Foods</span>
            </nav>
            <div className="text-xs font-bold uppercase tracking-widest text-spawn-cyan mb-3">Live Food Encyclopedia</div>
            <h1 className="text-3xl sm:text-[2.75rem] font-black tracking-tight text-spawn-text leading-[1.08] mb-4">
              The best live foods for aquarium fish.
            </h1>
            <p className="text-lg text-spawn-text-dim leading-relaxed">
              The most complete live food resource in the hobby — what each food is, what it is best for, and how to build a
              feeding system that takes a fish from fry to breeding adult.
            </p>
          </div>
        </header>

        {/* Authority body */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <MdxRenderer source={source} />
        </div>

        {/* Explore the live foods (microfauna entries) */}
        {liveFoodEntries.length > 0 && (
          <section className="px-4 py-12 bg-spawn-surface/20 border-t border-spawn-border/30">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-black tracking-tight text-spawn-text mb-1">Explore each live food</h2>
              <p className="text-sm text-spawn-muted-text mb-6">Deep database entries — identification, life cycle, and culture methods.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveFoodEntries.map((m) => <MicrofaunaCard key={m.slug} entry={m} />)}
              </div>
            </div>
          </section>
        )}

        {/* Supporting articles */}
        <RecommendedReading notes={labNotes} title="Live food guides" eyebrow="Lab Notes" />

        {/* Blackwater CTA */}
        <section className="px-4 pb-20">
          <div className="max-w-3xl mx-auto rounded-2xl border border-spawn-cyan/25 bg-gradient-to-br from-spawn-cyan/[0.07] to-transparent p-6 sm:p-8">
            <div className="text-xs font-bold uppercase tracking-widest text-spawn-cyan mb-2">From our store</div>
            <h2 className="text-xl font-black text-spawn-text mb-2">Start a live food culture</h2>
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
