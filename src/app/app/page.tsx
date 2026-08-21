import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { breadcrumbSchema, productPageSchema } from '@/lib/schema'
import AppCta from '@/components/spawnos/AppCta'

/**
 * The single destination for every "get the app" CTA across the site.
 *
 * Until the App Store listing is public this page states the real status —
 * TestFlight, invite only — and captures intent instead. There is deliberately
 * no "Download on the App Store" button and no fabricated App Store link; when
 * the listing goes live, replace the status block with the real badge and
 * update `APP_STATUS` below.
 */
const APP_STATUS = 'testflight' as 'testflight' | 'live'

export const metadata: Metadata = {
  title: 'Get SpawnOS for iPhone — Breeding Records for Aquarium Fish',
  description:
    'SpawnOS for iPhone tracks your breeding pairs, spawn dates, fry milestones and lineage. Your first breeding project is free. Currently in TestFlight ahead of the App Store release.',
  alternates: { canonical: '/app' },
}

const WORKFLOW = [
  {
    step: '01',
    title: 'Register your fish',
    body: 'Name them, record species, sex, traits and photos. This is the stock list you already keep in your head.',
  },
  {
    step: '02',
    title: 'Build the pair',
    body: 'Pick two parents. SpawnOS checks species and sex, shows what to expect from their visible traits, and warns you if they are related.',
  },
  {
    step: '03',
    title: 'Record the spawn',
    body: 'One date is all it takes. SpawnOS builds the timeline from there — hatch, free-swimming, first feeding, when to pull the male.',
  },
  {
    step: '04',
    title: 'Follow the milestones',
    body: 'Each stage shows its expected window and what to watch for. Confirm what actually happened and the rest of the timeline adapts.',
  },
  {
    step: '05',
    title: 'Keep the lineage',
    body: 'Register offspring against the spawn and SpawnOS links the generations for you, so relatedness warnings get smarter as your lines grow.',
  },
]

export default function GetAppPage() {
  // /app is the product's page. It references the product by @id rather than
  // restating it — the node itself ships once, sitewide.
  const jsonLd = [
    productPageSchema('/app', 'Get SpawnOS for iPhone'),
    breadcrumbSchema([
      { name: 'Home', href: '/' },
      { name: 'Get the app', href: '/app' },
    ]),
  ]

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <SiteHeader />
      <main className="pt-20">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="px-4 pt-16 pb-14 border-b border-spawn-border/30">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-spawn-cyan/10 border border-spawn-cyan/20 text-spawn-cyan text-xs font-semibold mb-6 uppercase tracking-wide">
              SpawnOS for iPhone
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-spawn-text mb-5 leading-tight">
              Stop tracking spawns<br />
              <span className="text-spawn-cyan">in your camera roll.</span>
            </h1>
            <p className="text-spawn-muted-text text-lg leading-relaxed max-w-xl mx-auto mb-8">
              SpawnOS keeps your breeding pairs, spawn dates, fry milestones and lineage in one
              place — and tells you what should be happening in the tank today.
              Your first breeding project is free.
            </p>
            <AppCta source="app_page_hero" className="justify-center" />
          </div>
        </section>

        {/* ── Status ────────────────────────────────────────────────────── */}
        <section className="px-4 py-12 border-b border-spawn-border/30 bg-spawn-surface/10">
          <div className="max-w-2xl mx-auto text-center">
            {APP_STATUS === 'testflight' ? (
              <>
                <h2 className="text-xl font-black text-spawn-text mb-3">
                  Where the app is right now
                </h2>
                <p className="text-sm text-spawn-muted-text leading-relaxed">
                  SpawnOS for iPhone is in <strong className="text-spawn-text">TestFlight with invited
                  testers</strong> while we finish the App Store release. It is a real, working build
                  — the breeding engine, timelines, lineage and assistant all run against the
                  same account you would use here. If you have an invitation, open it on your
                  iPhone to install.
                </p>
                <p className="text-sm text-spawn-muted-text leading-relaxed mt-4">
                  Not a tester yet? Create a free SpawnOS account below — it is the same login the
                  app uses, so you will be ready the day the App Store listing opens.
                </p>
              </>
            ) : (
              <h2 className="text-xl font-black text-spawn-text">Available on the App Store.</h2>
            )}
          </div>
        </section>

        {/* ── The workflow ──────────────────────────────────────────────── */}
        <section className="px-4 py-16 border-b border-spawn-border/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-black text-spawn-text mb-3 text-center">
              What a breeding project looks like
            </h2>
            <p className="text-spawn-muted-text text-center max-w-xl mx-auto mb-12 leading-relaxed">
              Every step below is included free for your first project.
            </p>
            <div className="space-y-3">
              {WORKFLOW.map((w) => (
                <div
                  key={w.step}
                  className="flex gap-5 p-5 rounded-xl border border-spawn-border/40 bg-spawn-surface/30"
                >
                  <div className="text-spawn-cyan font-black text-sm shrink-0 pt-0.5 tabular-nums">
                    {w.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-spawn-text text-sm mb-1.5">{w.title}</h3>
                    <p className="text-sm text-spawn-muted-text leading-relaxed">{w.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Honest limits ─────────────────────────────────────────────── */}
        <section className="px-4 py-16 border-b border-spawn-border/30 bg-spawn-surface/10">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-spawn-text mb-3">
              What SpawnOS does and doesn&rsquo;t know
            </h2>
            <p className="text-spawn-muted-text leading-relaxed mb-6">
              Breeding biology varies enormously between species, and an app that pretends
              otherwise will give you confidently wrong dates. SpawnOS is built to say what it
              actually knows.
            </p>
            <ul className="space-y-4 text-sm text-spawn-muted-text leading-relaxed">
              <li>
                <strong className="text-spawn-text">Verified timelines:</strong> Betta splendens and
                guppies have SpawnOS-reviewed milestone windows.
              </li>
              <li>
                <strong className="text-spawn-text">Everything else:</strong> mollies, platies,
                Neocaridina shrimp, corydoras, angelfish and clownfish register and track today.
                Where SpawnOS has researched a species profile it labels how confident it is —
                and where it has none, it says the timeline isn&rsquo;t available rather than
                borrowing another species&rsquo; biology.
              </li>
              <li>
                <strong className="text-spawn-text">Trait predictions, not genotypes:</strong>{' '}
                SpawnOS reads the visible traits you record on both parents and tells you what
                tends to show up in the fry. It does not know your fish&rsquo;s genotype, and it
                does not claim to. Marble and koi patterning in particular are called out as
                unstable rather than predicted.
              </li>
            </ul>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-black text-spawn-text mb-4">
              Your first breeding project is free.
            </h2>
            <p className="text-spawn-muted-text leading-relaxed mb-8">
              Register your animals, create a pair, record the spawn and follow the whole timeline
              without paying. Pro is for the point where you want to run a second line alongside
              the first.
            </p>
            <AppCta source="app_page_footer" className="justify-center" />
            <p className="mt-6 text-sm text-spawn-muted-text">
              <Link href="/pricing" className="text-spawn-cyan hover:underline">
                See what Free and Pro include
              </Link>
            </p>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  )
}
