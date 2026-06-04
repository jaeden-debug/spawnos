import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import MdxRenderer from '@/components/content/MdxRenderer'
import { getToolArticle, getAllToolArticleSlugs } from '@/lib/tools-content'
import { getToolBySlug } from '@/data/tools'
import { breadcrumbSchema, toolPageSchema } from '@/lib/schema'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllToolArticleSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getToolArticle(slug)
  if (!article) return {}
  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical: `/tools-database/${slug}` },
    openGraph: { title: article.seoTitle, description: article.seoDescription, type: 'article', locale: 'en_CA' },
    twitter: { card: 'summary_large_image', title: article.seoTitle, description: article.seoDescription },
  }
}

export default async function ToolArticlePage({ params }: Props) {
  const { slug } = await params
  const article = getToolArticle(slug)
  if (!article) notFound()

  const { tool } = article
  const related = article.related
    .map((s) => getToolBySlug(s))
    .filter((t): t is NonNullable<typeof t> => !!t)

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Tools Database', href: '/tools-database' },
    { name: tool.shortTitle, href: `/tools-database/${slug}` },
  ])

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: article.seoTitle,
    description: article.seoDescription,
    author: { '@type': 'Organization', name: 'Blackwater Aquatics Canada', url: 'https://blackwateraquatics.ca' },
    publisher: { '@type': 'Organization', name: 'SpawnOS', url: 'https://spawnos.app' },
    mainEntityOfPage: `https://spawnos.app/tools-database/${slug}`,
  }

  const faqSchema = article.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: article.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  } : null

  const calcSchema = toolPageSchema({ name: tool.title, description: tool.description, slug: tool.slug })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(calcSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

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
              <Link href="/tools-database" className="hover:text-spawn-cyan transition-colors">Tools Database</Link>
            </nav>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{tool.icon}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-spawn-cyan">Tools Database · {article.readingTime} min read</span>
            </div>
            <h1 className="text-3xl sm:text-[2.5rem] font-black tracking-tight text-spawn-text leading-[1.1] mb-4">{article.h1}</h1>
            <p className="text-lg text-spawn-text-dim leading-relaxed">{article.intro}</p>
          </div>
        </header>

        {/* Calculator CTA */}
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <Link href={`/tools/${tool.slug}`}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-spawn-cyan/30 bg-gradient-to-br from-spawn-cyan/[0.08] to-transparent p-5 hover:border-spawn-cyan/50 transition-all">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-spawn-cyan mb-1">The free tool</div>
              <div className="text-lg font-black text-spawn-text">{tool.title}</div>
              <p className="text-sm text-spawn-muted-text mt-1">{tool.description}</p>
            </div>
            <span className="shrink-0 text-spawn-cyan font-bold text-sm group-hover:translate-x-1 transition-transform">Open →</span>
          </Link>
        </div>

        {/* Body */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <MdxRenderer source={article.body} />
        </div>

        {/* Related tools */}
        {related.length > 0 && (
          <section className="px-4 py-12 bg-spawn-surface/20 border-t border-spawn-border/30">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-black tracking-tight text-spawn-text mb-1">Related tools</h2>
              <p className="text-sm text-spawn-muted-text mb-6">More from the SpawnOS calculator suite.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link key={r.slug} href={`/tools-database/${r.slug}`}
                    className="group flex flex-col rounded-2xl border border-spawn-border/60 bg-spawn-card/40 hover:border-spawn-cyan/30 hover:bg-spawn-card/70 transition-all p-5">
                    <span className="text-2xl mb-2">{r.icon}</span>
                    <h3 className="text-base font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors mb-1.5">{r.shortTitle}</h3>
                    <p className="text-sm text-spawn-muted-text leading-relaxed">{r.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <Link href={`/tools/${tool.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all">
              Open the {tool.shortTitle} calculator →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
