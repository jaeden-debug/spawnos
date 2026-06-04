import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import MdxRenderer from '@/components/content/MdxRenderer'
import CompatibilityCard from '@/components/compatibility/CompatibilityCard'
import RecommendedReading from '@/components/lab-notes/RecommendedReading'
import { getCompat, getAllCompatSlugs, getRelatedCompat, rateScore } from '@/lib/compatibility'
import { getRecentLabNotes } from '@/lib/lab-notes'
import { breadcrumbSchema } from '@/lib/schema'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllCompatSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const c = getCompat(slug)
  if (!c) return {}
  return {
    title: `${c.title} — SpawnOS Compatibility`,
    description: c.verdict || `Compatibility, parameters, tank size, and risks for ${c.speciesA} and ${c.speciesB}.`,
    keywords: c.tags,
    alternates: { canonical: `/compatibility/${slug}` },
    openGraph: { title: c.title, description: c.verdict, type: 'article', images: [{ url: c.thumbnail }] },
    twitter: { card: 'summary_large_image', title: c.title, description: c.verdict, images: [c.thumbnail] },
  }
}

function Fact({ label, value, valueClass = 'text-spawn-text' }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-spawn-border/40 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-spawn-muted-text shrink-0">{label}</span>
      <span className={`text-sm text-right ${valueClass}`}>{value}</span>
    </div>
  )
}

export default async function CompatDetailPage({ params }: Props) {
  const { slug } = await params
  const c = getCompat(slug)
  if (!c) notFound()

  const rating = rateScore(c.score)
  const relatedPairs = getRelatedCompat(slug, 3)
  const labNotes = getRecentLabNotes(3)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: c.title,
    description: c.verdict,
    image: c.thumbnail,
    datePublished: c.date,
    dateModified: c.date,
    author: { '@type': 'Organization', name: 'SpawnOS' },
    publisher: { '@type': 'Organization', name: 'SpawnOS', url: 'https://spawnos.app' },
    mainEntityOfPage: `https://spawnos.app/compatibility/${slug}`,
  }
  const faqSchema = c.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  } : null
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Compatibility', href: '/compatibility' },
    { name: `${c.speciesA} + ${c.speciesB}`, href: `/compatibility/${slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <SiteHeader />
      <main className="pt-[64px]">

        <header className="px-4 pt-10 pb-8 border-b border-spawn-border/30">
          <div className="max-w-5xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-spawn-muted-text mb-5" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <Link href="/library" className="hover:text-spawn-cyan transition-colors">Library</Link>
              <span>/</span>
              <Link href="/compatibility" className="hover:text-spawn-cyan transition-colors">Compatibility</Link>
            </nav>
            <div className="text-xs font-bold uppercase tracking-widest text-spawn-cyan mb-3">Compatibility</div>
            <h1 className="text-3xl sm:text-[2.5rem] font-black tracking-tight text-spawn-text leading-[1.1] mb-4">{c.title}</h1>
            <p className="text-lg text-spawn-text-dim leading-relaxed max-w-2xl">{c.verdict}</p>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">
            {/* Score panel */}
            <aside className="lg:w-72 shrink-0 order-1">
              <div className="lg:sticky lg:top-24 rounded-2xl border border-spawn-border/60 bg-spawn-surface/30 p-5">
                <div className="text-center mb-4">
                  <div className={`text-5xl font-black ${rating.color}`}>{c.score}<span className="text-xl text-spawn-muted-text">/100</span></div>
                  <div className={`text-xs font-bold uppercase tracking-widest mt-1 ${rating.color}`}>{rating.label}</div>
                  <div className="h-2 rounded-full bg-spawn-border/50 overflow-hidden mt-3">
                    <div className={`h-full rounded-full ${rating.bar}`} style={{ width: `${c.score}%` }} />
                  </div>
                </div>
                <Fact label={c.speciesA} value="" />
                <Fact label={c.speciesB} value="" />
                <Fact label="Min tank" value={c.tankSize} />
                <Fact label="Temp overlap" value={c.tempOverlap} />
                {c.blackwater && (
                  <a href={c.blackwater} target="_blank" rel="noopener noreferrer"
                    className="mt-4 block text-center py-2.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all">
                    Shop livestock →
                  </a>
                )}
                <Link href="/compatibility" className="mt-2 block text-center py-2 text-xs text-spawn-muted-text hover:text-spawn-cyan transition-colors">
                  ← All pairings
                </Link>
              </div>
            </aside>

            <article className="flex-1 min-w-0 max-w-3xl order-2">
              <MdxRenderer source={c.body} />

              {/* Related species cross-links */}
              {c.relatedSpecies.length > 0 && (
                <div className="mt-12 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mr-1">Species guides:</span>
                  {c.relatedSpecies.map((s) => (
                    <Link key={s} href={`/species/${s}`} className="text-sm px-3 py-1.5 rounded-full border border-spawn-border/60 text-spawn-text-dim hover:border-spawn-cyan/40 hover:text-spawn-cyan transition-all capitalize">
                      {s.replace(/-/g, ' ')}
                    </Link>
                  ))}
                </div>
              )}

              {relatedPairs.length > 0 && (
                <div className="mt-14">
                  <h2 className="text-xl font-black text-spawn-text mb-4 border-0 p-0 mt-0">Related pairings</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedPairs.map((p) => <CompatibilityCard key={p.slug} pairing={p} />)}
                  </div>
                </div>
              )}
            </article>
          </div>
        </div>

        <RecommendedReading notes={labNotes} title="Related from Lab Notes" eyebrow="Keep learning" />
      </main>
      <SiteFooter />
    </>
  )
}
