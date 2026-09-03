import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getFeaturedSpecies } from '@/lib/species-db'
import { websiteSchema } from '@/lib/schema'
import AppCta from '@/components/spawnos/AppCta'

export const metadata: Metadata = {
  title: 'SpawnOS — Breeding Records & Spawn Timelines for Aquarium Fish',
  description:
    'Track your breeding pairs, spawn dates, fry milestones and lineage in one app. Plus a free species library, fish compatibility checker and 15 aquarium calculators. No cap on breeding projects.',
  alternates: { canonical: '/' },
}

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: 'bg-green-400/10 border-green-400/30 text-green-400',
  intermediate: 'bg-amber-400/10 border-amber-400/30 text-amber-400',
  advanced: 'bg-orange-400/10 border-orange-400/30 text-orange-400',
  expert: 'bg-red-400/10 border-red-400/30 text-red-400',
}

const CATEGORY_ICON: Record<string, string> = {
  freshwater: '🐟',
  saltwater: '🐠',
  shrimp: '🦐',
  amphibian: '🦎',
  turtle: '🐢',
  invertebrate: '🦀',
  live_food: '🦠',
}

const PLATFORM_FEATURES = [
  {
    icon: '🐠',
    title: '100+ Species Database',
    desc: 'Every species guide is real care science — water parameters, breeding protocols, disease identification, compatible tankmates — spanning fish, shrimp, snails, live foods, microfauna, and plants.',
    href: '/species',
    accent: 'cyan',
    stat: '100+ guides',
  },
  {
    icon: '⚗️',
    title: '15 Free Calculators',
    desc: 'GH/KH converter, nitrogen cycle tracker, tank volume, water change planner, heater & filter sizing, stocking density, medication dosing, and more.',
    href: '/tools',
    accent: 'amber',
    stat: 'Always free',
  },
  {
    icon: '🤖',
    title: 'AI Aquarium Intelligence',
    desc: 'Ask anything. Fish care, compatibility, water chemistry, breeding triggers, disease diagnosis. Grounded in the SpawnOS species knowledge base.',
    href: '/blueprints',
    accent: 'cyan',
    stat: 'Powered by GPT-4o',
  },
  {
    icon: '🧬',
    title: 'Breeding Records That Know Biology',
    desc: 'Register your fish, build a pair, log one spawn date — SpawnOS builds the timeline from there. Hatch, free-swimming, first feeding, when to pull the male, when to jar. Plus lineage and relatedness warnings as your lines grow.',
    href: '/app',
    accent: 'amber',
    stat: 'No project cap',
  },
]

const BWA_PRODUCTS = [
  { name: 'Live Scud Culture', href: 'https://blackwateraquatics.ca/products/scud-culture', tag: 'Premium live food', desc: 'High-protein amphipods that trigger natural hunting behavior. The single best upgrade for betta and cichlid keepers.' },
  { name: 'Live Daphnia', href: 'https://blackwateraquatics.ca/products/products-live-daphnia-culture', tag: 'Live food', desc: 'Natural digestive health food. Gets picky or recovering fish eating when nothing else works.' },
  { name: 'Microworm Culture', href: 'https://blackwateraquatics.ca/products/microworm-culture-canada', tag: 'Fry food', desc: 'The best first food for fry. Live movement means fry find it. Powdered food cannot compete.' },
  { name: 'Cherry Shrimp', href: 'https://blackwateraquatics.ca/products/cherry-shrimp-canada', tag: 'Live livestock', desc: 'Canadian-bred Neocaridina. Clean stock, healthy colony genetics, ships across Canada.' },
]

export default async function HomePage() {
  const featuredSpecies = await getFeaturedSpecies(6)
  // The SpawnOS product node ships sitewide inside organizationSchema() in
  // layout.tsx, so the homepage must not emit a second copy of it.
  const jsonLd = [websiteSchema()]

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <SiteHeader />
      <main>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative w-full min-h-[100svh] overflow-hidden">
          {/* Brand hero art — desktop (logo sits on the right) */}
          <img
            src="/spawnos-aquarium-operating-system-desktop-hero.webp"
            alt="SpawnOS — the aquarium operating system by Blackwater Aquatics"
            width={1536}
            height={1024}
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-center hidden md:block"
          />
          {/* Brand hero art — mobile (logo sits in the top half) */}
          <img
            src="/spawnos-aquarium-operating-system-mobile-hero.webp"
            alt="SpawnOS — the aquarium operating system by Blackwater Aquatics"
            width={864}
            height={1536}
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-center md:hidden"
          />

          {/* Legibility gradients — darken the text side without covering the logo */}
          <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-spawn-bg via-spawn-bg/75 to-transparent pointer-events-none" />
          <div className="absolute inset-0 md:hidden bg-gradient-to-t from-spawn-bg via-spawn-bg/80 to-transparent pointer-events-none" />
          {/* Bottom fade into the page */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-spawn-bg to-transparent pointer-events-none" />

          <div className="relative z-10 min-h-[100svh] max-w-7xl mx-auto px-6 sm:px-8 flex flex-col justify-end pb-20 md:pb-0 md:justify-center md:items-start">
            <div className="max-w-xl animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-spawn-surface/70 border border-spawn-border/70 backdrop-blur text-spawn-text-dim text-xs font-semibold mb-6 tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-spawn-cyan animate-pulse" />
                Blackwater Aquatics Canada
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.02] tracking-tight text-spawn-text mb-6">
                Breeding fish?<br />
                <span className="text-spawn-cyan" style={{ textShadow: '0 0 44px rgba(0,212,255,0.45)' }}>
                  Stop guessing the dates.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-spawn-text-dim leading-relaxed mb-4 max-w-md">
                SpawnOS keeps your pairs, spawn dates, fry milestones and lineage in one app —
                and tells you what should be happening in the tank today.
              </p>
              <p className="text-sm text-spawn-muted-text mb-9 max-w-md">
                Every breeding record is free — pairs, spawns, milestones and lineage, with no
                project cap. The species library and all 15 calculators need no account at all.
              </p>

              <AppCta
                source="home_hero"
                secondaryHref="/tools/fish-compatibility"
                secondaryLabel="Try a free tool"
              />
            </div>
          </div>
        </section>

        {/* ── PLATFORM OVERVIEW ────────────────────────────────────────── */}
        <section className="py-20 px-4 border-t border-spawn-border/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-black text-spawn-text mb-3">Everything your tank demands.</h2>
              <p className="text-spawn-muted-text max-w-xl mx-auto leading-relaxed">
                Most aquarium sites have a database <em>or</em> a calculator <em>or</em> a community.
                SpawnOS is all of them, built to work together.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {PLATFORM_FEATURES.map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className="glass-card group rounded-2xl border border-spawn-border/50 p-7 hover:border-spawn-cyan/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-3xl">{f.icon}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      f.accent === 'cyan'
                        ? 'bg-spawn-cyan/10 text-spawn-cyan border border-spawn-cyan/20'
                        : 'bg-spawn-amber/10 text-spawn-amber border border-spawn-amber/20'
                    }`}>
                      {f.stat}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors mb-2">{f.title}</h3>
                  <p className="text-sm text-spawn-muted-text leading-relaxed">{f.desc}</p>
                  <div className="mt-4 text-xs text-spawn-cyan font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── SPECIES CARDS ────────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-spawn-surface/20 border-t border-spawn-border/30">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-spawn-cyan mb-2">Species Intelligence</div>
                <h2 className="text-3xl font-black text-spawn-text">Not a Wikipedia summary.</h2>
                <p className="text-spawn-muted-text mt-2 max-w-lg leading-relaxed">
                  Every guide is sourced water parameters, real breeding protocols, and disease identification
                  written from primary sources — not aggregated pet-store advice.
                </p>
              </div>
              <Link href="/species" className="hidden sm:inline-flex items-center gap-2 text-sm text-spawn-cyan hover:underline font-semibold shrink-0 ml-8">
                All 100+ species →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredSpecies.map((s) => {
                const tempDisplay = s.param_temp
                  ? `${s.param_temp.ideal_min ?? s.param_temp.min}–${s.param_temp.ideal_max ?? s.param_temp.max}${s.param_temp.unit ?? '°F'}`
                  : null
                const phDisplay = s.param_ph
                  ? `pH ${s.param_ph.ideal_min ?? s.param_ph.min}–${s.param_ph.ideal_max ?? s.param_ph.max}`
                  : null

                return (
                  <Link
                    key={s.slug}
                    href={`/species/${s.slug}`}
                    className="glass-card rounded-xl overflow-hidden border border-spawn-border/50 hover:border-spawn-cyan/30 transition-all group"
                  >
                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${s.hero_color}90, ${s.hero_color}20)` }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors">
                            {s.common_name}
                          </div>
                          <div className="text-xs text-spawn-muted-text italic mt-0.5">{s.scientific_name}</div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ml-2 ${
                          DIFFICULTY_COLOR[s.difficulty] ?? 'bg-spawn-surface border-spawn-border text-spawn-muted-text'
                        }`}>
                          {s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-spawn-surface/80 border border-spawn-border/40 text-spawn-muted-text">
                          {CATEGORY_ICON[s.category] ?? '🐟'} {s.category.replace('_', ' ')}
                        </span>
                        {tempDisplay && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-spawn-surface/80 border border-spawn-border/40 text-spawn-muted-text">
                            🌡️ {tempDisplay}
                          </span>
                        )}
                        {phDisplay && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-spawn-surface/80 border border-spawn-border/40 text-spawn-muted-text">
                            {phDisplay}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="mt-6 text-center sm:hidden">
              <Link href="/species" className="text-sm text-spawn-cyan hover:underline font-semibold">View all species →</Link>
            </div>
          </div>
        </section>

        {/* ── BLACKWATER AQUATICS ──────────────────────────────────────── */}
        <section className="py-20 px-4 border-t border-spawn-border/30">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-10 items-start">
              <div className="lg:w-2/5 shrink-0">
                <div className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-3">
                  Powered by
                </div>
                <h2 className="text-3xl font-black text-spawn-text mb-4">
                  Blackwater Aquatics Canada
                </h2>
                <p className="text-spawn-muted-text leading-relaxed mb-6">
                  SpawnOS is built by Blackwater Aquatics — a Canadian aquarium brand that actually
                  keeps fish. Every live food product recommendation in the AI comes from products
                  we use and sell, not affiliate links.
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://blackwateraquatics.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-spawn-surface border border-spawn-border hover:border-spawn-cyan/40 text-spawn-text text-sm font-semibold transition-all"
                  >
                    Visit Blackwater Aquatics
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                      <path d="M2 11L11 2M11 2H5.5M11 2V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                  <a
                    href="https://blackwateraquatics.ca/blogs/knowledge-base"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-spawn-muted-text hover:text-spawn-text text-sm font-semibold transition-colors"
                  >
                    Knowledge Base →
                  </a>
                </div>
              </div>

              <div className="flex-1 grid sm:grid-cols-2 gap-4">
                {BWA_PRODUCTS.map((p) => (
                  <a
                    key={p.href}
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card rounded-xl border border-spawn-border/50 hover:border-spawn-cyan/30 p-5 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">{p.tag}</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-spawn-muted-text/40 group-hover:text-spawn-cyan transition-colors" aria-hidden="true">
                        <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors text-sm mb-1.5">{p.name}</div>
                    <p className="text-xs text-spawn-muted-text leading-relaxed">{p.desc}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW FREE → PRO WORKS ────────────────────────────────────
             Two plans, and the prices here must match src/app/pricing/page.tsx
             and the live Stripe prices (spawnos_pro_monthly = $7). */}
        <section className="py-20 px-4 bg-spawn-surface/20 border-t border-spawn-border/30">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-4">Pricing</div>
            <h2 className="text-3xl font-black text-spawn-text mb-4">
              Every breeding record, free.
            </h2>
            <p className="text-spawn-muted-text leading-relaxed mb-10 max-w-lg mx-auto">
              Register your animals, create pairs, record spawns and follow every timeline through
              to grow-out without paying — as many projects as you run. The one thing Pro adds is
              unlimited Ask SpawnOS; Free includes 10 questions a day.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto">
              {[
                {
                  name: 'Free',
                  price: '$0',
                  desc: 'Breeding projects uncapped in 1.0, full timeline and lineage, the whole species library and all 15 calculators.',
                  cta: 'Get SpawnOS',
                  href: '/app',
                  style: 'border',
                },
                {
                  name: 'Pro',
                  price: '$7/mo',
                  desc: 'Unlimited Ask SpawnOS with no daily cap, priority email support, and it funds the build.',
                  cta: 'See Pro',
                  href: '/pricing',
                  style: 'cyan',
                  badge: true,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border p-6 text-left ${
                    plan.badge
                      ? 'border-spawn-cyan/40 bg-spawn-surface/80'
                      : 'border-spawn-border/50 bg-spawn-surface/30'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-spawn-cyan text-spawn-bg text-xs font-bold whitespace-nowrap">
                      For active breeders
                    </div>
                  )}
                  <div className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-2">{plan.name}</div>
                  <div className="text-2xl font-black text-spawn-text mb-3">{plan.price}</div>
                  <p className="text-xs text-spawn-muted-text leading-relaxed mb-5">{plan.desc}</p>
                  <Link
                    href={plan.href}
                    className={`block text-center py-2.5 rounded-lg text-xs font-bold transition-all ${
                      plan.style === 'cyan'
                        ? 'bg-spawn-cyan text-spawn-bg hover:bg-opacity-90'
                        : 'border border-spawn-border text-spawn-text hover:border-spawn-border/80'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>

            <Link href="/pricing" className="text-sm text-spawn-cyan hover:underline font-semibold">
              Compare Free and Pro →
            </Link>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────── */}
        <section className="py-24 px-4 border-t border-spawn-border/30">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-black text-spawn-text mb-5 leading-tight">
              Your notes app<br />
              <span className="text-spawn-cyan">doesn&rsquo;t know fish.</span>
            </h2>
            <p className="text-spawn-muted-text text-lg leading-relaxed mb-10">
              Spawn dates in a camera roll, milestones in your head, lineage in a spreadsheet you
              stopped updating. SpawnOS holds all of it and tells you what today should look like.
              Free, with no cap on breeding projects. No credit card.
            </p>
            <AppCta
              source="home_footer"
              className="justify-center"
              secondaryHref="/species"
              secondaryLabel="Browse Species"
            />
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  )
}
