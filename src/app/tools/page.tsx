import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { TOOLS_DATA } from '@/data/tools'
import { breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Free Aquarium Calculators & Tools — 13 Science-Based Tools | SpawnOS',
  description:
    'Free aquarium science tools: water change calculator, GH/KH converter, nitrogen cycle tracker, fish compatibility checker, heater size, filter size, lighting calculator, salt dosage, medication dosing, and more. No signup required.',
  alternates: { canonical: '/tools' },
  openGraph: {
    title: 'Free Aquarium Calculators & Tools — SpawnOS',
    description: '13 free science-based aquarium tools. Water parameters, stocking, chemistry, lighting, disease treatment, and AI blueprint generation.',
    type: 'website',
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  water: 'Water Quality',
  stocking: 'Stocking & Compatibility',
  chemistry: 'Chemistry',
  utility: 'Utility',
}

export default function ToolsPage() {
  const jsonLd = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Calculators', href: '/tools' },
  ])

  const grouped = TOOLS_DATA.reduce<Record<string, typeof TOOLS_DATA>>((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = []
    acc[tool.category].push(tool)
    return acc
  }, {})

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader />

      <main className="pt-20">
        {/* Header */}
        <section className="relative py-16 px-4 border-b border-spawn-border/50 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-spawn-amber/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-spawn-cyan/5 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-spawn-muted-text mb-6">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <span className="text-spawn-text">Calculators</span>
            </nav>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spawn-amber/10 border border-spawn-amber/20 text-spawn-amber text-xs font-semibold mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-spawn-amber" />
                  Aquarium Intelligence Tools
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-spawn-text mb-4 leading-tight">
                  Aquarium Calculators<br />
                  <span className="text-spawn-amber">& Science Tools</span>
                </h1>
                <p className="text-spawn-muted-text leading-relaxed text-lg">
                  {TOOLS_DATA.length} free tools built on real aquarium science. Water chemistry,
                  stocking, filtration, disease treatment, lighting, and more. No account required,
                  no paywalls.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:shrink-0">
                {(['water', 'stocking', 'chemistry', 'utility'] as const).map((cat) => (
                  <div key={cat} className="bg-spawn-surface/50 border border-spawn-border/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-black text-spawn-amber">
                      {TOOLS_DATA.filter((t) => t.category === cat).length}
                    </div>
                    <div className="text-xs text-spawn-muted-text mt-0.5">{CATEGORY_LABELS[cat]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tools by category */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto space-y-14">
            {(['water', 'stocking', 'chemistry', 'utility'] as const).map((cat) => {
              const tools = grouped[cat]
              if (!tools?.length) return null
              return (
                <div key={cat}>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-5">
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tools.map((tool) => (
                      <Link
                        key={tool.slug}
                        href={`/tools/${tool.slug}`}
                        className="glass-card hover-card rounded-xl p-6 border border-spawn-border/50 hover:border-spawn-amber/30 transition-all group"
                      >
                        <div className="text-3xl mb-4">{tool.icon}</div>
                        <h3 className="font-bold text-spawn-text group-hover:text-spawn-amber transition-colors mb-2">
                          {tool.shortTitle}
                        </h3>
                        <p className="text-sm text-spawn-muted-text leading-relaxed">{tool.description}</p>
                        <div className="mt-4 text-xs text-spawn-cyan font-medium flex items-center gap-1">
                          Open calculator
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 px-4 bg-spawn-surface/20 border-t border-spawn-border/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-black text-spawn-text mb-3">Need a complete tank design?</h2>
            <p className="text-spawn-muted-text mb-6">
              The AI Tank Blueprint Generator combines all of these tools into a single, complete tank setup plan.
              Input your goals — get a full stocking list, parameters, plants, and maintenance schedule.
            </p>
            <Link
              href="/blueprints"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all glow-cyan"
            >
              Generate AI Blueprint
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
