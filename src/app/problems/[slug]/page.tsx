import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import MdxRenderer from '@/components/content/MdxRenderer'
import ProblemCard from '@/components/problems/ProblemCard'
import MicrofaunaCard from '@/components/microfauna/MicrofaunaCard'
import RecommendedReading from '@/components/lab-notes/RecommendedReading'
import { getProblem, getAllProblemSlugs, getRelatedProblems, type HarmLevel } from '@/lib/problems'
import { getMicrofauna } from '@/lib/microfauna'
import { getRecentLabNotes } from '@/lib/lab-notes'
import { breadcrumbSchema } from '@/lib/schema'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllProblemSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = getProblem(slug)
  if (!p) return {}
  return {
    title: `${p.title} — SpawnOS`,
    description: p.excerpt,
    keywords: p.tags,
    alternates: { canonical: `/problems/${slug}` },
    openGraph: { title: p.title, description: p.excerpt, type: 'article', images: [{ url: p.thumbnail }] },
    twitter: { card: 'summary_large_image', title: p.title, description: p.excerpt, images: [p.thumbnail] },
  }
}

const HARM_COLOR: Record<HarmLevel, string> = {
  None: 'text-green-400',
  Low: 'text-spawn-cyan',
  Moderate: 'text-spawn-amber',
  High: 'text-spawn-rose',
}

function Fact({ label, value, valueClass = 'text-spawn-text' }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-spawn-border/40 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-spawn-muted-text shrink-0">{label}</span>
      <span className={`text-sm text-right ${valueClass}`}>{value}</span>
    </div>
  )
}

export default async function ProblemDetailPage({ params }: Props) {
  const { slug } = await params
  const problem = getProblem(slug)
  if (!problem) notFound()

  const relatedProblems = getRelatedProblems(slug, 3)
  const relatedMicro = problem.relatedMicrofauna.map((s) => getMicrofauna(s)).filter((m): m is NonNullable<typeof m> => m !== null)
  const labNotes = getRecentLabNotes(3)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: problem.title,
    description: problem.excerpt,
    image: problem.thumbnail,
    datePublished: problem.date,
    dateModified: problem.date,
    author: { '@type': 'Organization', name: 'SpawnOS' },
    publisher: { '@type': 'Organization', name: 'SpawnOS', url: 'https://spawnos.app' },
    mainEntityOfPage: `https://spawnos.app/problems/${slug}`,
  }
  const faqSchema = problem.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: problem.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  } : null
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Problems', href: '/problems' },
    { name: problem.shortName, href: `/problems/${slug}` },
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
              <Link href="/problems" className="hover:text-spawn-cyan transition-colors">Problems</Link>
            </nav>
            <div className="text-xs font-bold uppercase tracking-widest text-spawn-cyan mb-3">Problem Database</div>
            <h1 className="text-3xl sm:text-[2.5rem] font-black tracking-tight text-spawn-text leading-[1.1] mb-4">{problem.title}</h1>
            <p className="text-lg text-spawn-text-dim leading-relaxed max-w-2xl">{problem.excerpt}</p>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">
            {/* Verdict panel */}
            <aside className="lg:w-72 shrink-0 order-1">
              <div className="lg:sticky lg:top-24 rounded-2xl border border-spawn-border/60 bg-spawn-surface/30 p-5">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-3">The verdict</h2>
                <Fact label="Risk to tank" value={problem.harmful === 'None' ? 'Harmless' : `${problem.harmful}`} valueClass={`font-bold ${HARM_COLOR[problem.harmful]}`} />
                <Fact label="Remove it?" value={problem.remove} />
                {problem.cause && <Fact label="Usual cause" value={problem.cause} />}
                {problem.verdict && <p className="text-sm text-spawn-text-dim leading-relaxed mt-3">{problem.verdict}</p>}
                <Link href="/problems" className="mt-4 block text-center py-2 text-xs text-spawn-muted-text hover:text-spawn-cyan transition-colors">
                  ← All problems
                </Link>
              </div>
            </aside>

            <article className="flex-1 min-w-0 max-w-3xl order-2">
              <MdxRenderer source={problem.body} />

              {/* Related microfauna cross-links */}
              {relatedMicro.length > 0 && (
                <div className="mt-14">
                  <h2 className="text-xl font-black text-spawn-text mb-4 border-0 p-0 mt-0">In the Microfauna Database</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedMicro.map((m) => <MicrofaunaCard key={m.slug} entry={m} />)}
                  </div>
                </div>
              )}

              {/* Related problems */}
              {relatedProblems.length > 0 && (
                <div className="mt-14">
                  <h2 className="text-xl font-black text-spawn-text mb-4 border-0 p-0 mt-0">Related problems</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedProblems.map((p) => <ProblemCard key={p.slug} problem={p} />)}
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
