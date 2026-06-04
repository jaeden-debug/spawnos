import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import SpeciesSidebar from '@/components/species/SpeciesSidebar'
import SpeciesHero from '@/components/species/SpeciesHero'
import SpeciesRelated from '@/components/species/SpeciesRelated'
import { getAllSpeciesSlugs, getSpeciesRecord, getSpeciesFAQ, getSpeciesReferences } from '@/lib/species-db'
import { getSpeciesMDX } from '@/lib/content'
import { breadcrumbSchema } from '@/lib/schema'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllSpeciesSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const species = await getSpeciesRecord(slug)
  if (!species) return {}

  const title = species.seo_title ?? `${species.common_name} Care Guide — SpawnOS`
  const description = species.seo_description ?? `Complete ${species.common_name} care guide: water parameters, tank setup, feeding, tank mates, and breeding for ${species.scientific_name}.`

  return {
    title,
    description,
    keywords: species.seo_keywords,
    alternates: { canonical: `/species/${slug}` },
    openGraph: { title, description, type: 'article', modifiedTime: species.updated_at },
    twitter: { card: 'summary_large_image', title, description },
  }
}

const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="group relative text-[1.7rem] sm:text-3xl font-black tracking-tight text-spawn-text mt-16 mb-5 pl-4 scroll-mt-28 border-l-[3px] border-spawn-cyan/70"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-xl sm:text-2xl font-bold text-spawn-text mt-10 mb-3 scroll-mt-28" {...props} />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="text-base font-bold uppercase tracking-widest text-spawn-cyan/90 mt-8 mb-2" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-[1.0625rem] text-spawn-text-dim leading-[1.85] mb-5" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="space-y-2.5 mb-6 ml-1 marker:text-spawn-cyan list-disc pl-5 text-spawn-text-dim" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="space-y-2.5 mb-6 ml-1 list-decimal pl-5 marker:text-spawn-cyan marker:font-bold text-spawn-text-dim" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-[1.0625rem] text-spawn-text-dim leading-[1.7] pl-1.5" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-spawn-text" {...props} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-spawn-text-dim" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="font-semibold text-spawn-cyan underline decoration-spawn-cyan/30 underline-offset-[3px] hover:decoration-spawn-cyan transition-colors"
      target={props.href?.startsWith('http') ? '_blank' : undefined}
      rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="relative my-7 rounded-2xl border border-spawn-cyan/25 bg-gradient-to-br from-spawn-cyan/[0.07] to-transparent pl-6 pr-5 py-5 text-spawn-text-dim [&>p]:mb-0 [&_strong]:text-spawn-cyan"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded-md bg-spawn-surface border border-spawn-border/60 px-1.5 py-0.5 text-[0.85em] font-mono text-spawn-cyan" {...props} />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-8 overflow-x-auto rounded-2xl border border-spawn-border/70 bg-spawn-card/60 shadow-card backdrop-blur">
      <table className="w-full text-sm border-collapse" {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-spawn-cyan/[0.06] border-b border-spawn-border" {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-5 py-3.5 text-left font-bold text-spawn-text text-[0.7rem] uppercase tracking-[0.12em]" {...props} />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-5 py-3.5 text-spawn-text-dim align-top [&>strong]:text-spawn-text" {...props} />
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="border-b border-spawn-border/30 last:border-0 hover:bg-spawn-surface/40 transition-colors" {...props} />
  ),
  hr: () => <hr className="border-0 h-px my-12 bg-gradient-to-r from-transparent via-spawn-border to-transparent" />,
}

export default async function SpeciesDetailPage({ params }: Props) {
  const { slug } = await params
  const [species, faq, references] = await Promise.all([
    getSpeciesRecord(slug),
    getSpeciesFAQ(slug),
    getSpeciesReferences(slug),
  ])

  if (!species) notFound()

  const mdxSource = getSpeciesMDX(slug)

  const faqSchema = faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.filter((q) => q.schema_ready).map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  } : null

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: species.seo_title ?? `${species.common_name} Care Guide`,
    description: species.seo_description,
    dateModified: species.updated_at,
    author: { '@type': 'Organization', name: 'SpawnOS / Blackwater Aquatics Canada' },
    publisher: { '@type': 'Organization', name: 'SpawnOS', url: 'https://spawnos.app' },
  }

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Species Database', href: '/species' },
    { name: species.common_name, href: `/species/${slug}` },
  ])

  const difficultyColor: Record<string, string> = {
    beginner: 'text-green-400 bg-green-400/10 border-green-400/30',
    intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    advanced: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    expert: 'text-red-400 bg-red-400/10 border-red-400/30',
  }

  const temperamentColor: Record<string, string> = {
    peaceful: 'text-green-400',
    'semi-aggressive': 'text-amber-400',
    aggressive: 'text-red-400',
    community: 'text-blue-400',
    'species-only': 'text-purple-400',
  }

  function paramRange(p: { min: number; max: number; unit: string } | null): string {
    if (!p) return '—'
    return `${p.min}–${p.max} ${p.unit}`
  }

  const minTankGallons = species.min_tank_litres ? Math.round(species.min_tank_litres / 3.785) : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <SiteHeader />

      <main className="min-h-screen bg-spawn-bg pt-16">

        {/* SECTION 1: HERO */}
        <SpeciesHero species={species} />

        {/* BREADCRUMB */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs text-spawn-muted-text" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
            <span>/</span>
            <Link href="/species" className="hover:text-spawn-cyan transition-colors">Species Database</Link>
            <span>/</span>
            <span className="text-spawn-text">{species.common_name}</span>
          </nav>
        </div>

        {/* MAIN CONTENT + SIDEBAR */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">

            <article className="flex-1 min-w-0">

              {/* SECTION 2: TABLE OF CONTENTS */}
              <nav className="mb-10 p-5 rounded-2xl bg-spawn-surface/50 border border-spawn-border/50">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-3">Table of Contents</h2>
                <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {[
                    ['#overview', 'Species Overview'],
                    ['#natural-habitat', 'Natural Habitat'],
                    ['#aquarium-care', 'Aquarium Care'],
                    ['#tank-setup', 'Tank Setup Guide'],
                    ['#feeding', 'Feeding Guide'],
                    ['#live-foods', 'Live Foods'],
                    ['#behavior', 'Behavior & Temperament'],
                    ['#compatibility', 'Compatibility'],
                    ['#breeding', 'Breeding Guide'],
                    ['#health', 'Health & Disease'],
                    ['#faq', 'Frequently Asked Questions'],
                    ['#related-tools', 'Related Tools'],
                    ['#related-articles', 'Related Articles'],
                    ['#blueprint', 'AI Tank Blueprint'],
                    ['#references', 'References'],
                  ].map(([href, label]) => (
                    <li key={href}>
                      <a href={href} className="text-spawn-muted-text hover:text-spawn-cyan transition-colors">{label}</a>
                    </li>
                  ))}
                </ol>
              </nav>

              {/* MDX LONG-FORM CONTENT */}
              {mdxSource ? (
                <div className="max-w-none">
                  <MDXRemote
                    source={mdxSource}
                    components={mdxComponents}
                    options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
                  />
                </div>
              ) : (
                <div className="prose-aqua space-y-8">
                  <section id="overview">
                    <h2 className="text-2xl font-bold text-spawn-text mt-0 mb-4">Species Overview</h2>
                    <p className="text-spawn-muted-text leading-relaxed">
                      The <strong className="text-spawn-text">{species.common_name}</strong> (<em>{species.scientific_name}</em>) belongs to the family <strong className="text-spawn-text">{species.family}</strong>
                      {species.origin_regions.length > 0 && <>, native to {species.origin_regions.join(', ')}</>}.
                      {species.adult_size_cm_max && <> Adults reach up to {species.adult_size_cm_max} cm in length and can live {species.lifespan_years_max} years or more in well-maintained aquaria.</>}
                    </p>
                  </section>
                  <section id="natural-habitat">
                    <h2 className="text-2xl font-bold text-spawn-text mt-12 mb-4">Natural Habitat</h2>
                    <p className="text-spawn-muted-text leading-relaxed">
                      Native to {species.origin_countries.length > 0 ? species.origin_countries.join(', ') : species.origin_regions.join(', ')},
                      the {species.common_name} inhabits waters with temperatures of {paramRange(species.param_temp)}, pH {paramRange(species.param_ph)}
                      {species.param_gh && <>, and general hardness {paramRange(species.param_gh)}</>}.
                    </p>
                  </section>
                  <section id="aquarium-care">
                    <h2 className="text-2xl font-bold text-spawn-text mt-12 mb-4">Aquarium Care</h2>
                    <p className="text-spawn-muted-text leading-relaxed">
                      A minimum tank of {species.min_tank_litres ? `${species.min_tank_litres} litres (${minTankGallons} gallons)` : '—'} is required.
                      {species.care_filtration && <> {species.care_filtration}</>}
                    </p>
                  </section>
                </div>
              )}

              {/* SECTION 8: BLACKWATER LIVE FOODS */}
              {(species.recommend_daphnia || species.recommend_scuds || species.recommend_microworms || species.recommend_bbs) && (
                <section id="live-foods" className="mt-12">
                  <h2 className="text-2xl font-bold text-spawn-text mb-4">Live Foods from Blackwater Aquatics</h2>
                  {species.blackwater_note && <p className="text-spawn-muted-text leading-relaxed mb-6">{species.blackwater_note}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {species.recommend_daphnia && (
                      <a href="https://blackwateraquatics.ca/collections/live-foods" target="_blank" rel="noopener noreferrer"
                        className="group p-4 rounded-xl bg-spawn-surface/50 border border-spawn-border/50 hover:border-spawn-cyan/40 transition-all">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🦠</span>
                          <div>
                            <p className="font-semibold text-spawn-text group-hover:text-spawn-cyan transition-colors text-sm">Live Daphnia</p>
                            <p className="text-xs text-spawn-muted-text mt-0.5">Water fleas — digestive aid, high-protein live food.</p>
                            <p className="text-xs text-spawn-cyan mt-1.5">Available at Blackwater Aquatics →</p>
                          </div>
                        </div>
                      </a>
                    )}
                    {species.recommend_scuds && (
                      <a href="https://blackwateraquatics.ca/collections/live-foods" target="_blank" rel="noopener noreferrer"
                        className="group p-4 rounded-xl bg-spawn-surface/50 border border-spawn-border/50 hover:border-spawn-cyan/40 transition-all">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🦐</span>
                          <div>
                            <p className="font-semibold text-spawn-text group-hover:text-spawn-cyan transition-colors text-sm">Live Scuds (Gammarus)</p>
                            <p className="text-xs text-spawn-muted-text mt-0.5">Amphipods — excellent enrichment and protein.</p>
                            <p className="text-xs text-spawn-cyan mt-1.5">Available at Blackwater Aquatics →</p>
                          </div>
                        </div>
                      </a>
                    )}
                    {species.recommend_microworms && (
                      <a href="https://blackwateraquatics.ca/collections/live-foods" target="_blank" rel="noopener noreferrer"
                        className="group p-4 rounded-xl bg-spawn-surface/50 border border-spawn-border/50 hover:border-spawn-cyan/40 transition-all">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🪱</span>
                          <div>
                            <p className="font-semibold text-spawn-text group-hover:text-spawn-cyan transition-colors text-sm">Microworms</p>
                            <p className="text-xs text-spawn-muted-text mt-0.5">Tiny nematodes — ideal first food for fry and nano fish.</p>
                            <p className="text-xs text-spawn-cyan mt-1.5">Available at Blackwater Aquatics →</p>
                          </div>
                        </div>
                      </a>
                    )}
                    {species.recommend_bbs && (
                      <a href="https://blackwateraquatics.ca/collections/live-foods" target="_blank" rel="noopener noreferrer"
                        className="group p-4 rounded-xl bg-spawn-surface/50 border border-spawn-border/50 hover:border-spawn-cyan/40 transition-all">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🫧</span>
                          <div>
                            <p className="font-semibold text-spawn-text group-hover:text-spawn-cyan transition-colors text-sm">Baby Brine Shrimp (BBS)</p>
                            <p className="text-xs text-spawn-muted-text mt-0.5">Nauplii — essential fry food and conditioning food.</p>
                            <p className="text-xs text-spawn-cyan mt-1.5">Available at Blackwater Aquatics →</p>
                          </div>
                        </div>
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* SECTION 10: COMPATIBILITY */}
              {(species.compatible_with.length > 0 || species.incompatible_with.length > 0) && (
                <section id="compatibility" className="mt-12">
                  <h2 className="text-2xl font-bold text-spawn-text mb-4">Compatibility</h2>
                  <p className="text-spawn-muted-text leading-relaxed mb-6">
                    The {species.common_name} has a{' '}
                    <span className={`font-semibold ${temperamentColor[species.temperament] ?? 'text-spawn-text'}`}>{species.temperament}</span>{' '}
                    temperament. Choosing the right tank mates is essential for a stable aquarium.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {species.compatible_with.length > 0 && (
                      <div className="p-4 rounded-xl bg-green-400/5 border border-green-400/20">
                        <h3 className="text-sm font-semibold text-green-400 mb-3">✓ Compatible Tank Mates</h3>
                        <ul className="space-y-1.5">
                          {species.compatible_with.map((s) => (
                            <li key={s}>
                              <Link href={`/species/${s}`} className="text-sm text-spawn-muted-text hover:text-spawn-cyan transition-colors capitalize">
                                {s.replace(/-/g, ' ')}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {species.incompatible_with.length > 0 && (
                      <div className="p-4 rounded-xl bg-red-400/5 border border-red-400/20">
                        <h3 className="text-sm font-semibold text-red-400 mb-3">✗ Incompatible Species</h3>
                        <ul className="space-y-1.5">
                          {species.incompatible_with.map((s) => (
                            <li key={s}>
                              <Link href={`/species/${s}`} className="text-sm text-spawn-muted-text hover:text-spawn-cyan transition-colors capitalize">
                                {s.replace(/-/g, ' ')}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* SECTION 13: FAQ */}
              {faq.length > 0 && (
                <section id="faq" className="mt-12">
                  <h2 className="text-2xl font-bold text-spawn-text mb-6">Frequently Asked Questions — {species.common_name}</h2>
                  <div className="space-y-4">
                    {faq.map((q) => (
                      <details key={q.id} className="group p-5 rounded-xl bg-spawn-surface/50 border border-spawn-border/50 cursor-pointer">
                        <summary className="font-medium text-spawn-text list-none flex items-center justify-between gap-4 select-none">
                          <span>{q.question}</span>
                          <span className="text-spawn-muted-text shrink-0">↓</span>
                        </summary>
                        <p className="mt-3 text-spawn-muted-text leading-relaxed text-sm">{q.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {/* SECTION 14: RELATED TOOLS */}
              <section id="related-tools" className="mt-12">
                <h2 className="text-2xl font-bold text-spawn-text mb-4">Related Tools</h2>
                <p className="text-spawn-muted-text leading-relaxed mb-6">
                  Free SpawnOS calculators to plan the perfect {species.common_name} tank setup.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { href: '/tools/tank-volume', label: 'Volume Calculator', icon: '📐' },
                    { href: '/tools/stocking-density', label: 'Stocking Calculator', icon: '🐠' },
                    { href: '/tools/fish-compatibility', label: 'Compatibility Checker', icon: '🤝' },
                    { href: '/tools/water-parameters', label: 'Parameter Reference', icon: '🧪' },
                    { href: '/tools/nitrogen-cycle', label: 'Nitrogen Cycle Tracker', icon: '🔄' },
                    { href: '/blueprints', label: 'AI Blueprint Generator', icon: '✨' },
                  ].map((tool) => (
                    <Link key={tool.href} href={tool.href}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-spawn-surface/50 border border-spawn-border/50 hover:border-spawn-cyan/40 hover:bg-spawn-cyan/5 transition-all group">
                      <span className="text-lg">{tool.icon}</span>
                      <span className="text-sm text-spawn-muted-text group-hover:text-spawn-text transition-colors leading-tight">{tool.label}</span>
                    </Link>
                  ))}
                </div>
              </section>

              {/* SECTION 15: RELATED ARTICLES */}
              <section id="related-articles" className="mt-12">
                <h2 className="text-2xl font-bold text-spawn-text mb-4">Related Articles</h2>
                <p className="text-spawn-muted-text leading-relaxed mb-6">Expert guides from the Blackwater Aquatics knowledge base.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: `${species.common_name} in the Wild`, desc: 'Natural history and wild habitat.' },
                    { label: 'Aquarium Water Chemistry', desc: 'Understanding pH, GH, KH and nitrogen compounds.' },
                    { label: 'Live Foods for Aquarium Fish', desc: 'Daphnia, scuds, brine shrimp and microworms.' },
                    { label: 'Freshwater Aquarium Setup Guide', desc: 'Step-by-step planted aquarium setup.' },
                  ].map((article) => (
                    <a key={article.label} href="https://blackwateraquatics.ca/blogs/knowledge-base" target="_blank" rel="noopener noreferrer"
                      className="group p-4 rounded-xl bg-spawn-surface/50 border border-spawn-border/50 hover:border-spawn-cyan/40 transition-all">
                      <p className="font-medium text-spawn-text text-sm group-hover:text-spawn-cyan transition-colors">{article.label}</p>
                      <p className="text-xs text-spawn-muted-text mt-1">{article.desc}</p>
                      <p className="text-xs text-spawn-cyan mt-1.5">Blackwater Aquatics Knowledge Base →</p>
                    </a>
                  ))}
                </div>
              </section>

              {/* SECTION 16: AI BLUEPRINT CTA */}
              <section id="blueprint" className="mt-12">
                <div className="relative overflow-hidden rounded-2xl border border-spawn-cyan/20 bg-gradient-to-br from-spawn-cyan/5 via-spawn-surface to-spawn-bg p-8 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-spawn-cyan mb-3">AI-Powered</p>
                  <h2 className="text-2xl font-bold text-spawn-text mb-3">Need Help Building The Perfect Setup?</h2>
                  <p className="text-spawn-muted-text leading-relaxed mb-2 max-w-lg mx-auto">
                    Describe your goals and SpawnOS AI will generate a complete tank blueprint including compatible species, substrate, plants, hardscape, equipment, and a maintenance schedule.
                  </p>
                  <Link href="/blueprints"
                    className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-semibold text-sm hover:bg-spawn-cyan/90 transition-colors">
                    Generate Aquarium Blueprint
                  </Link>
                </div>
              </section>

              {/* SECTION 17: REFERENCES */}
              {references.length > 0 && (
                <section id="references" className="mt-12">
                  <h2 className="text-2xl font-bold text-spawn-text mb-4">References</h2>
                  <ol className="space-y-2">
                    {references.map((ref, i) => (
                      <li key={ref.id} className="text-sm text-spawn-muted-text flex gap-3">
                        <span className="text-spawn-cyan shrink-0 font-mono text-xs mt-0.5">[{i + 1}]</span>
                        <span>
                          {ref.citation}
                          {ref.url && <> <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-spawn-cyan hover:underline break-all">{ref.url}</a></>}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

            </article>

            {/* STICKY SIDEBAR */}
            <SpeciesSidebar
              species={species}
              paramTemp={species.param_temp}
              paramPh={species.param_ph}
              paramGh={species.param_gh}
              paramKh={species.param_kh}
              paramTds={species.param_tds}
              difficultyColor={difficultyColor}
              temperamentColor={temperamentColor}
              minTankGallons={minTankGallons}
            />
          </div>

          {/* RELATED SPECIES */}
          <SpeciesRelated currentSlug={slug} compatibleWith={species.compatible_with} />
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
