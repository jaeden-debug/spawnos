import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getAllToolArticles } from '@/lib/tools-content'
import { breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Tools Database — In-Depth Guides to Every Aquarium Calculator',
  description:
    'Deep, science-based guides to every SpawnOS aquarium calculator — stocking, cycling, water chemistry, filtration, heating, lighting, dosing, and compatibility. The reasoning behind each tool, with worked examples.',
  alternates: { canonical: '/tools-database' },
  openGraph: {
    title: 'Tools Database — SpawnOS',
    description: 'In-depth guides to every aquarium calculator, with the science and worked examples behind each tool.',
    type: 'website',
    locale: 'en_CA',
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  water: 'Water Quality',
  stocking: 'Stocking & Compatibility',
  chemistry: 'Chemistry',
  utility: 'Utility & Equipment',
}

export default function ToolsDatabasePage() {
  const articles = getAllToolArticles()

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Tools Database', href: '/tools-database' },
  ])

  const grouped = articles.reduce<Record<string, typeof articles>>((acc, a) => {
    const cat = a.tool.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(a)
    return acc
  }, {})

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <SiteHeader />
      <main className="pt-[64px] min-h-screen">

        {/* Hero */}
        <section className="px-4 pt-14 pb-10 border-b border-spawn-border/30">
          <div className="max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-spawn-muted-text mb-5" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <Link href="/library" className="hover:text-spawn-cyan transition-colors">Library</Link>
              <span>/</span>
              <span className="text-spawn-text">Tools Database</span>
            </nav>
            <div className="text-xs font-semibold uppercase tracking-widest text-spawn-cyan mb-3">Tools Database</div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-spawn-text mb-5 leading-[1.05]">
              The science behind every calculator.
            </h1>
            <p className="text-lg text-spawn-text-dim leading-relaxed">
              Every SpawnOS aquarium calculator has a complete guide here — the science it runs on, how to use it, worked
              examples, and the mistakes it prevents. Each guide links straight to its free, no-signup{' '}
              <Link href="/tools" className="text-spawn-cyan font-semibold hover:underline">calculator</Link>.
            </p>
          </div>
        </section>

        {/* Grouped guides */}
        <section className="px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-14">
            {(['water', 'stocking', 'chemistry', 'utility'] as const).map((cat) => {
              const items = grouped[cat]
              if (!items?.length) return null
              return (
                <div key={cat}>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-spawn-muted-text mb-6">{CATEGORY_LABELS[cat]}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((a) => (
                      <Link key={a.slug} href={`/tools-database/${a.slug}`}
                        className="group flex flex-col rounded-2xl border border-spawn-border/60 bg-spawn-card/40 hover:border-spawn-cyan/30 hover:bg-spawn-card/70 transition-all p-6">
                        <span className="text-3xl mb-3">{a.tool.icon}</span>
                        <h3 className="text-lg font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors mb-2">{a.tool.shortTitle}</h3>
                        <p className="text-sm text-spawn-muted-text leading-relaxed">{a.intro}</p>
                        <span className="mt-4 text-xs font-semibold text-spawn-cyan flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Read the guide →
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
