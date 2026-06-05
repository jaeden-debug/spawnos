import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import MdxRenderer, { slugify } from '@/components/content/MdxRenderer'
import RecommendedReading from '@/components/lab-notes/RecommendedReading'
import { getLabNote, getAllLabNoteSlugs, getRelatedLabNotes } from '@/lib/lab-notes'
import { breadcrumbSchema, authorSchema, AUTHOR } from '@/lib/schema'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllLabNoteSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const note = getLabNote(slug)
  if (!note) return {}
  return {
    title: `${note.title} — Lab Notes`,
    description: note.excerpt,
    keywords: note.tags,
    authors: [{ name: AUTHOR.name, url: 'https://spawnos.app/about' }],
    alternates: { canonical: `/lab-notes/${slug}` },
    openGraph: {
      title: note.title,
      description: note.excerpt,
      type: 'article',
      modifiedTime: note.date,
      images: [{ url: note.thumbnail }],
    },
    twitter: { card: 'summary_large_image', title: note.title, description: note.excerpt, images: [note.thumbnail] },
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(+d) ? '' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// Extract H2 headings from the raw MDX for the table of contents.
function tableOfContents(body: string): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = []
  for (const line of body.split('\n')) {
    const m = line.match(/^##\s+(?!#)(.+?)\s*$/)
    if (m) out.push({ id: slugify(m[1]), label: m[1].replace(/\*\*/g, '') })
  }
  return out
}

export default async function LabNotePage({ params }: Props) {
  const { slug } = await params
  const note = getLabNote(slug)
  if (!note) notFound()

  const related = getRelatedLabNotes(slug, 3)
  const toc = tableOfContents(note.body)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: note.title,
    description: note.excerpt,
    datePublished: note.date,
    dateModified: note.date,
    image: note.thumbnail,
    author: authorSchema(),
    publisher: { '@type': 'Organization', name: 'SpawnOS', url: 'https://spawnos.app' },
    mainEntityOfPage: `https://spawnos.app/lab-notes/${slug}`,
  }

  const faqSchema = note.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: note.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Lab Notes', href: '/lab-notes' },
    { name: note.title, href: `/lab-notes/${slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <SiteHeader />
      <main className="pt-[64px]">

        {/* Hero */}
        <header className="px-4 pt-10 pb-8 border-b border-spawn-border/30">
          <div className="max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-spawn-muted-text mb-5" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <Link href="/lab-notes" className="hover:text-spawn-cyan transition-colors">Lab Notes</Link>
            </nav>
            <div className="text-xs font-bold uppercase tracking-widest text-spawn-cyan mb-3">{note.category}</div>
            <h1 className="text-3xl sm:text-[2.75rem] font-black tracking-tight text-spawn-text leading-[1.08] mb-4">{note.title}</h1>
            <p className="text-lg text-spawn-text-dim leading-relaxed mb-5">{note.excerpt}</p>
            <div className="flex items-center gap-2 text-sm text-spawn-muted-text">
              <span>By <span className="text-spawn-text-dim font-medium">{AUTHOR.name}</span></span>
              <span className="w-1 h-1 rounded-full bg-spawn-border" />
              <span>{formatDate(note.date)}</span>
              <span className="w-1 h-1 rounded-full bg-spawn-border" />
              <span>{note.readingTime} min read</span>
            </div>
          </div>
        </header>

        {/* Cover */}
        <div className="max-w-3xl mx-auto px-4 -mt-0">
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-spawn-border/60 mt-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={note.thumbnail} alt={note.title} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>

        {/* Body + TOC */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
            {/* TOC */}
            {toc.length > 2 && (
              <aside className="lg:w-60 shrink-0 order-2 lg:order-1">
                <div className="lg:sticky lg:top-24 rounded-2xl border border-spawn-border/50 bg-spawn-surface/30 p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-3">On this page</h2>
                  <nav className="space-y-2">
                    {toc.map((t) => (
                      <a key={t.id} href={`#${t.id}`} className="block text-sm text-spawn-muted-text hover:text-spawn-cyan transition-colors leading-snug">
                        {t.label}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}

            {/* Article */}
            <article className="flex-1 min-w-0 max-w-3xl order-1 lg:order-2">
              <MdxRenderer source={note.body} />

              {/* Blackwater CTA */}
              <div className="mt-14 rounded-2xl border border-spawn-cyan/25 bg-gradient-to-br from-spawn-cyan/[0.07] to-transparent p-6 sm:p-7">
                <div className="text-xs font-bold uppercase tracking-widest text-spawn-cyan mb-2">From our store</div>
                <h2 className="text-xl font-black text-spawn-text mb-2 border-0 p-0 mt-0">Get the live food in this guide</h2>
                <p className="text-sm text-spawn-text-dim leading-relaxed mb-5">
                  Blackwater Aquatics ships breeder-grade live scuds, daphnia, and microworm cultures across Canada —
                  the exact foods referenced above.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="https://blackwateraquatics.ca/collections/live-fish-food-canada" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all">
                    Shop Live Foods →
                  </a>
                  <Link href="/blueprints" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-spawn-border/70 text-spawn-text font-semibold text-sm hover:border-spawn-cyan/40 transition-all">
                    Ask the AI
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* Recommended reading */}
        <RecommendedReading notes={related} title="Keep reading" />
      </main>
      <SiteFooter />
    </>
  )
}
