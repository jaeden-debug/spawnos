import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import MdxRenderer from '@/components/content/MdxRenderer'
import MicrofaunaCard from '@/components/microfauna/MicrofaunaCard'
import RecommendedReading from '@/components/lab-notes/RecommendedReading'
import { getMicrofauna, getAllMicrofaunaSlugs, getRelatedMicrofauna } from '@/lib/microfauna'
import { getRecentLabNotes } from '@/lib/lab-notes'
import { breadcrumbSchema } from '@/lib/schema'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllMicrofaunaSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const entry = getMicrofauna(slug)
  if (!entry) return {}
  return {
    title: `${entry.name} — Aquarium Microfauna Database`,
    description: entry.excerpt,
    keywords: entry.tags,
    alternates: { canonical: `/microfauna/${slug}` },
    openGraph: { title: entry.name, description: entry.excerpt, type: 'article', images: [{ url: entry.thumbnail }] },
    twitter: { card: 'summary_large_image', title: entry.name, description: entry.excerpt, images: [entry.thumbnail] },
  }
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-spawn-border/40 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-spawn-muted-text shrink-0">{label}</span>
      <span className="text-sm text-spawn-text text-right">{value}</span>
    </div>
  )
}

export default async function MicrofaunaDetailPage({ params }: Props) {
  const { slug } = await params
  const entry = getMicrofauna(slug)
  if (!entry) notFound()

  const related = getRelatedMicrofauna(slug, 4)
  const labNotes = getRecentLabNotes(3)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${entry.name} — Aquarium Microfauna`,
    description: entry.excerpt,
    image: entry.thumbnail,
    datePublished: entry.date,
    dateModified: entry.date,
    author: { '@type': 'Organization', name: 'SpawnOS' },
    publisher: { '@type': 'Organization', name: 'SpawnOS', url: 'https://spawnos.app' },
    mainEntityOfPage: `https://spawnos.app/microfauna/${slug}`,
  }
  const faqSchema = entry.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entry.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  } : null
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Microfauna', href: '/microfauna' },
    { name: entry.name, href: `/microfauna/${slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <SiteHeader />
      <main className="pt-[64px]">

        {/* Header */}
        <header className="px-4 pt-10 pb-8 border-b border-spawn-border/30">
          <div className="max-w-5xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-spawn-muted-text mb-5" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <Link href="/microfauna" className="hover:text-spawn-cyan transition-colors">Microfauna</Link>
            </nav>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-spawn-cyan">{entry.group}</span>
              {entry.blackwater && <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-spawn-cyan/10 border border-spawn-cyan/30 text-spawn-cyan">Live food</span>}
              {entry.pest && <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-spawn-rose/10 border border-spawn-rose/30 text-spawn-rose">Often a pest</span>}
            </div>
            <h1 className="text-3xl sm:text-[2.75rem] font-black tracking-tight text-spawn-text leading-[1.08] mb-2">{entry.name}</h1>
            {entry.scientificName && <p className="text-lg italic text-spawn-muted-text mb-4">{entry.scientificName}</p>}
            <p className="text-lg text-spawn-text-dim leading-relaxed max-w-2xl">{entry.excerpt}</p>
          </div>
        </header>

        {/* Body + facts */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">
            {/* Quick facts */}
            <aside className="lg:w-72 shrink-0 order-1">
              <div className="lg:sticky lg:top-24 rounded-2xl border border-spawn-border/60 bg-spawn-surface/30 p-5">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-3">Quick facts</h2>
                <Fact label="Group" value={entry.group} />
                <Fact label="Size" value={entry.size} />
                <Fact label="Cultureable" value={entry.cultureable ? 'Yes' : 'No'} />
                <Fact label="Pest?" value={entry.pest ? 'Can be' : 'No'} />
                {entry.eatenBy.length > 0 && <Fact label="Eaten by" value={entry.eatenBy.join(', ')} />}
                {entry.blackwater && (
                  <a href={entry.blackwater} target="_blank" rel="noopener noreferrer"
                    className="mt-4 block text-center py-2.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all">
                    Buy live culture →
                  </a>
                )}
                <Link href="/microfauna" className="mt-2 block text-center py-2 text-xs text-spawn-muted-text hover:text-spawn-cyan transition-colors">
                  ← All microfauna
                </Link>
              </div>
            </aside>

            {/* Article body */}
            <article className="flex-1 min-w-0 max-w-3xl order-2">
              <MdxRenderer source={entry.body} />

              {entry.blackwater && (
                <div className="mt-14 rounded-2xl border border-spawn-cyan/25 bg-gradient-to-br from-spawn-cyan/[0.07] to-transparent p-6 sm:p-7">
                  <div className="text-xs font-bold uppercase tracking-widest text-spawn-cyan mb-2">From our store</div>
                  <h2 className="text-xl font-black text-spawn-text mb-2 border-0 p-0 mt-0">Culture-ready {entry.name.split(' (')[0]}</h2>
                  <p className="text-sm text-spawn-text-dim leading-relaxed mb-5">
                    Blackwater Aquatics ships live, breeder-grade cultures across Canada.
                  </p>
                  <a href={entry.blackwater} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all">
                    Shop now →
                  </a>
                </div>
              )}

              {/* Related microfauna */}
              {related.length > 0 && (
                <div className="mt-14">
                  <h2 className="text-xl font-black text-spawn-text mb-4 border-0 p-0 mt-0">Related microfauna</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {related.map((m) => <MicrofaunaCard key={m.slug} entry={m} />)}
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
