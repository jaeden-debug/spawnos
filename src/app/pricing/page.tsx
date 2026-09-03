import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import PricingSchema from '@/components/spawnos/PricingSchema'
import PricingPlans from './PricingPlans'
import { FAQ, COMPARISON_FEATURES, type FaqItem, type ComparisonRow } from './plans'

/**
 * /pricing — server-rendered.
 *
 * The interactive plan cards live in the <PricingPlans /> island; everything
 * else (hero copy, comparison table, FAQ, closing CTA) renders on the server so
 * the page ships real content to crawlers. Before this split the entire page
 * was one client component behind a Suspense boundary and served 63 characters
 * of visible text.
 */
export const metadata: Metadata = {
  title: { absolute: 'SpawnOS Pricing — Free Plan and Pro at $7/month' },
  description:
    'SpawnOS Free covers the whole breeding workflow — animals, pairs, spawn timeline and lineage — with no project cap in 1.0. Pro is $7/month and removes the daily Ask SpawnOS limit. Species library and all 15 calculators are free.',
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <>
      <PricingSchema />
      <SiteHeader />
      <main className="pt-20">

        {/* ── Hero (static) ─────────────────────────────────────────────── */}
        <section className="relative py-20 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-spawn-cyan/4 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-spawn-cyan/10 border border-spawn-cyan/20 text-spawn-cyan text-xs font-semibold mb-6 uppercase tracking-wide">
              Simple pricing
            </div>
            <h1 className="text-5xl font-black text-spawn-text mb-5 leading-tight">
              Your first breeding<br />
              <span className="text-spawn-cyan">project is free.</span>
            </h1>
            <p className="text-spawn-muted-text text-lg leading-relaxed max-w-xl mx-auto mb-10">
              Register your animals, build a pair, record the spawn and follow the whole timeline
              without paying. Pro is for running more than one project at a time. Every calculator
              and species guide on this site stays free either way.
            </p>
          </div>
        </section>

        {/* ── Toggle + plan cards (interactive island) ──────────────────── */}
        <PricingPlans />

        {/* ── Comparison table ─────────────────────────────────────────── */}
        <section className="px-4 py-16 border-t border-spawn-border/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-spawn-text mb-2 text-center">Full feature comparison</h2>
            <p className="text-spawn-muted-text text-sm text-center mb-10">Every detail, side by side.</p>

            <div className="rounded-2xl border border-spawn-border/40 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 bg-spawn-surface/50 border-b border-spawn-border/40">
                <div className="p-4 text-xs font-semibold text-spawn-muted-text uppercase tracking-wider">Feature</div>
                {['Free', 'Pro'].map((name, i) => (
                  <div key={name} className={`p-4 text-center text-xs font-bold uppercase tracking-wider ${
                    i === 1 ? 'text-spawn-cyan' : 'text-spawn-muted-text'
                  }`}>
                    {name}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {COMPARISON_FEATURES.map((row: ComparisonRow, ri: number) => (
                <div
                  key={ri}
                  className={`grid grid-cols-3 border-b border-spawn-border/20 last:border-b-0 ${
                    ri % 2 === 0 ? '' : 'bg-spawn-surface/20'
                  }`}
                >
                  <div className="p-3.5 text-sm text-spawn-muted-text">{row.label}</div>
                  {[row.free, row.pro].map((val, vi) => (
                    <div key={vi} className={`p-3.5 text-center text-xs font-medium ${
                      val === '—' ? 'text-spawn-muted-text/30'
                      : val === '✓' ? 'text-spawn-cyan'
                      : vi === 1 ? 'text-spawn-cyan/80'
                      : 'text-spawn-muted-text'
                    }`}>
                      {val}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What you get, factually ──────────────────────────────────
             Replaced a "Trusted by the aquarium community" block that carried
             three invented breeder testimonials and unverifiable trust stats.
             SpawnOS has no published user counts or ratings to cite yet, so
             this section states only what is verifiably in the product. Add
             real, attributable quotes here when they exist. */}
        <section className="px-4 py-16 border-t border-spawn-border/30 bg-spawn-surface/10">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs font-semibold text-spawn-muted-text uppercase tracking-widest mb-10">
              What&rsquo;s in SpawnOS today
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: '100+', label: 'Species guides', sub: 'Free on this site, no account' },
                { value: '15', label: 'Calculators', sub: 'Free, no account' },
                { value: '2', label: 'Verified timelines', sub: 'Betta & guppy — others register and track' },
                { value: '1', label: 'Free project', sub: 'A full spawn, start to grow-out' },
              ].map((stat) => (
                <div key={stat.label} className="p-5 rounded-xl border border-spawn-border/30 bg-spawn-surface/30">
                  <div className="text-2xl font-black text-spawn-cyan mb-1">{stat.value}</div>
                  <div className="text-sm font-bold text-spawn-text">{stat.label}</div>
                  <div className="text-xs text-spawn-muted-text mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="px-4 py-16 border-t border-spawn-border/30">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-spawn-text mb-10 text-center">Questions</h2>
            <div className="space-y-4">
              {FAQ.map((item: FaqItem, i: number) => (
                <div key={i} className="glass-card rounded-xl border border-spawn-border/40 p-5">
                  <h3 className="font-semibold text-spawn-text mb-2 text-sm">{item.q}</h3>
                  <p className="text-sm text-spawn-muted-text leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────────────────────────── */}
        <section className="px-4 py-20 text-center border-t border-spawn-border/30 bg-spawn-surface/10">
          <div className="max-w-lg mx-auto">
            <h2 className="text-3xl font-black text-spawn-text mb-4">
              Start free.<br />
              <span className="text-spawn-cyan">Upgrade when you&apos;re ready.</span>
            </h2>
            <p className="text-spawn-muted-text mb-8 leading-relaxed">
              No credit card. No expiry. Every calculator and every species guide stays free forever.
              Pro is for when you&apos;re running more than one breeding project at a time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/app"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
              >
                Get SpawnOS
              </Link>
              <Link
                href="/species"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-spawn-border text-spawn-text hover:border-spawn-cyan/40 text-sm font-semibold transition-all"
              >
                Browse Species →
              </Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  )
}
