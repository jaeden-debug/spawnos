'use client'

import { useState } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'

// ─── Plan data ───────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Start here. Always free.',
    monthlyPrice: 0,
    annualPrice: 0,
    cta: 'Get Started',
    ctaHref: '/signup',
    ctaStyle: 'border',
    featured: false,
    features: [
      { text: 'Full species database — all 100+ species', included: true },
      { text: 'All 15 aquarium calculators', included: true },
      { text: 'AI Aquarium Assistant — 10 messages/day', included: true },
      { text: 'Blackwater Aquatics knowledge base', included: true },
      { text: 'Breeder dashboard', included: false },
      { text: 'Fish & pair registry', included: false },
      { text: 'Spawn tracking & survival analytics', included: false },
      { text: 'Genetics engine & lineage tree', included: false },
      { text: 'Water parameter logging', included: false },
      { text: 'CSV data export', included: false },
      { text: 'Public breeder profile', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For serious fishkeepers.',
    monthlyPrice: 9,
    annualPrice: 79,
    cta: 'Start Pro — Free 14 days',
    ctaHref: '/signup?plan=pro',
    ctaStyle: 'cyan',
    featured: true,
    badge: 'Most Popular',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Unlimited AI Aquarium Assistant', included: true },
      { text: 'Full breeder dashboard', included: true },
      { text: 'Unlimited fish & pair registry', included: true },
      { text: 'Spawn tracking & survival analytics', included: true },
      { text: 'Genetics engine & lineage tree', included: true },
      { text: 'Water parameter logging & charts', included: true },
      { text: 'CSV data export', included: true },
      { text: 'Public breeder profile', included: false },
      { text: 'Verified breeder badge', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    id: 'breeder',
    name: 'Breeder',
    tagline: 'Built for professionals.',
    monthlyPrice: 24,
    annualPrice: 199,
    cta: 'Go Breeder',
    ctaHref: '/signup?plan=breeder',
    ctaStyle: 'amber',
    featured: false,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Public breeder profile & store page', included: true },
      { text: 'Verified breeder badge', included: true },
      { text: 'Unlimited spawns + advanced analytics', included: true },
      { text: 'Bulk fish import/export', included: true },
      { text: 'API access — read your own data', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to new features', included: true },
      { text: 'Breeder directory listing', included: true },
      { text: 'Custom lineage export (PDF)', included: true },
      { text: 'Spawn result publishing', included: true },
    ],
  },
]

const FAQ = [
  {
    q: 'Do I need a credit card to start the free plan?',
    a: 'No. The free tier is genuinely free — no credit card, no trial expiry. You get full access to the species database, all 15 calculators, and 10 AI messages per day forever.',
  },
  {
    q: 'What happens after the 14-day Pro trial?',
    a: "You'll be prompted to add a payment method. If you don't, your account drops back to the Free tier. Your data stays intact — nothing is deleted.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account settings at any time. No cancellation fees. Annual subscribers receive a prorated refund for unused months.',
  },
  {
    q: 'What is the Breeder profile?',
    a: 'A public page at spawnos.app/breeders/your-name showing your fish registry, active spawns, breeding history, and a bio. It becomes your professional presence in the SpawnOS community — and ranks on Google for your name and species.',
  },
  {
    q: 'Is my breeding data private?',
    a: "Yes, unless you're on the Breeder plan and choose to publish spawn results. Your fish registry, pair data, and parameter logs are private by default on all plans.",
  },
  {
    q: 'Do you offer refunds?',
    a: 'Monthly subscriptions: no refunds on the current month. Annual subscriptions: prorated refund within 30 days of purchase. Contact us for exceptions.',
  },
]

const COMPARISON_FEATURES = [
  { label: 'Species database', free: 'Full access', pro: 'Full access', breeder: 'Full access' },
  { label: 'Calculators', free: 'All 15', pro: 'All 15', breeder: 'All 15' },
  { label: 'AI Assistant messages', free: '10 / day', pro: 'Unlimited', breeder: 'Unlimited' },
  { label: 'Breeder dashboard', free: '—', pro: '✓', breeder: '✓' },
  { label: 'Fish registry', free: '—', pro: 'Unlimited', breeder: 'Unlimited' },
  { label: 'Active spawns', free: '—', pro: 'Unlimited', breeder: 'Unlimited' },
  { label: 'Genetics engine', free: '—', pro: '✓', breeder: '✓' },
  { label: 'Parameter logging', free: '—', pro: '✓ + charts', breeder: '✓ + charts' },
  { label: 'Data export', free: '—', pro: 'CSV', breeder: 'CSV + PDF' },
  { label: 'Public breeder profile', free: '—', pro: '—', breeder: '✓' },
  { label: 'Verified badge', free: '—', pro: '—', breeder: '✓' },
  { label: 'API access', free: '—', pro: '—', breeder: '✓' },
  { label: 'Support', free: 'Community', pro: 'Email', breeder: 'Priority' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [annual, setAnnual] = useState(true)

  function annualSavings(plan: typeof PLANS[0]) {
    if (plan.monthlyPrice === 0) return null
    const monthlyTotal = plan.monthlyPrice * 12
    const saved = monthlyTotal - plan.annualPrice
    return saved
  }

  return (
    <>
      <SiteHeader />
      <main className="pt-20">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative py-20 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-spawn-cyan/4 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-spawn-cyan/10 border border-spawn-cyan/20 text-spawn-cyan text-xs font-semibold mb-6 uppercase tracking-wide">
              Simple pricing
            </div>
            <h1 className="text-5xl font-black text-spawn-text mb-5 leading-tight">
              Pay for what you use.<br />
              <span className="text-spawn-cyan">Own your data. Always.</span>
            </h1>
            <p className="text-spawn-muted-text text-lg leading-relaxed max-w-xl mx-auto mb-10">
              Free tools stay free — every calculator, every species guide. Pro and Breeder unlock
              the full operating system for serious fishkeepers.
            </p>

            {/* Annual / Monthly toggle */}
            <div className="inline-flex items-center gap-3 bg-spawn-surface/60 border border-spawn-border/50 rounded-xl p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  !annual ? 'bg-spawn-bg text-spawn-text shadow-sm' : 'text-spawn-muted-text hover:text-spawn-text'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  annual ? 'bg-spawn-bg text-spawn-text shadow-sm' : 'text-spawn-muted-text hover:text-spawn-text'
                }`}
              >
                Annual
                <span className="text-[0.65rem] font-bold text-spawn-amber bg-spawn-amber/10 px-1.5 py-0.5 rounded-md">
                  SAVE 27%
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ── Plan cards ───────────────────────────────────────────────── */}
        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan) => {
              const price = annual ? plan.annualPrice : plan.monthlyPrice
              const savings = annualSavings(plan)

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-7 flex flex-col gap-6 ${
                    plan.featured
                      ? 'bg-spawn-surface/80 border-spawn-cyan/40 shadow-lg shadow-spawn-cyan/5'
                      : 'bg-spawn-surface/30 border-spawn-border/50'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-spawn-cyan text-spawn-bg text-xs font-bold tracking-wide whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-spawn-muted-text uppercase tracking-widest mb-1">{plan.name}</p>
                    <div className="flex items-end gap-2 mb-1">
                      {plan.monthlyPrice === 0 ? (
                        <span className="text-4xl font-black text-spawn-text">Free</span>
                      ) : (
                        <>
                          <span className="text-4xl font-black text-spawn-text">
                            ${annual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice}
                          </span>
                          <span className="text-spawn-muted-text text-sm mb-1.5">/mo</span>
                        </>
                      )}
                    </div>
                    {annual && savings && (
                      <p className="text-xs text-spawn-amber font-semibold">
                        ${plan.annualPrice}/yr — save ${savings}
                      </p>
                    )}
                    {!annual && plan.monthlyPrice > 0 && (
                      <p className="text-xs text-spawn-muted-text">Billed monthly</p>
                    )}
                    <p className="text-sm text-spawn-muted-text mt-3 leading-relaxed">{plan.tagline}</p>
                  </div>

                  <Link
                    href={plan.ctaHref}
                    className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all ${
                      plan.ctaStyle === 'cyan'
                        ? 'bg-spawn-cyan text-spawn-bg hover:bg-opacity-90'
                        : plan.ctaStyle === 'amber'
                        ? 'bg-spawn-amber text-spawn-bg hover:bg-opacity-90'
                        : 'border border-spawn-border text-spawn-text hover:border-spawn-border/80 hover:bg-spawn-surface'
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  <ul className="space-y-2.5">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className={`flex items-start gap-2.5 text-sm ${f.included ? 'text-spawn-muted-text' : 'text-spawn-muted-text/40'}`}>
                        {f.included ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
                            <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-spawn-cyan"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 opacity-30" aria-hidden="true">
                            <path d="M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        )}
                        {f.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Comparison table ─────────────────────────────────────────── */}
        <section className="px-4 py-16 border-t border-spawn-border/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-spawn-text mb-2 text-center">Full feature comparison</h2>
            <p className="text-spawn-muted-text text-sm text-center mb-10">Every detail, side by side.</p>

            <div className="rounded-2xl border border-spawn-border/40 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 bg-spawn-surface/50 border-b border-spawn-border/40">
                <div className="p-4 text-xs font-semibold text-spawn-muted-text uppercase tracking-wider">Feature</div>
                {['Free', 'Pro', 'Breeder'].map((name, i) => (
                  <div key={name} className={`p-4 text-center text-xs font-bold uppercase tracking-wider ${
                    i === 1 ? 'text-spawn-cyan' : i === 2 ? 'text-spawn-amber' : 'text-spawn-muted-text'
                  }`}>
                    {name}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {COMPARISON_FEATURES.map((row, ri) => (
                <div
                  key={ri}
                  className={`grid grid-cols-4 border-b border-spawn-border/20 last:border-b-0 ${
                    ri % 2 === 0 ? '' : 'bg-spawn-surface/20'
                  }`}
                >
                  <div className="p-3.5 text-sm text-spawn-muted-text">{row.label}</div>
                  {[row.free, row.pro, row.breeder].map((val, vi) => (
                    <div key={vi} className={`p-3.5 text-center text-xs font-medium ${
                      val === '—' ? 'text-spawn-muted-text/30'
                      : val === '✓' ? 'text-spawn-cyan'
                      : vi === 1 ? 'text-spawn-cyan/80'
                      : vi === 2 ? 'text-spawn-amber/80'
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

        {/* ── Social proof ─────────────────────────────────────────────── */}
        <section className="px-4 py-16 border-t border-spawn-border/30 bg-spawn-surface/10">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs font-semibold text-spawn-muted-text uppercase tracking-widest mb-10">
              Trusted by the aquarium community
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-14">
              {[
                { value: '100+', label: 'Species guides', sub: 'Deep-dive care content' },
                { value: '15', label: 'Calculators', sub: 'Science-based tools' },
                { value: 'AI', label: 'Expert assistant', sub: 'Powered by GPT-4o' },
                { value: '100%', label: 'Data ownership', sub: 'Export anytime, cancel anytime' },
              ].map((stat) => (
                <div key={stat.label} className="p-5 rounded-xl border border-spawn-border/30 bg-spawn-surface/30">
                  <div className="text-2xl font-black text-spawn-cyan mb-1">{stat.value}</div>
                  <div className="text-sm font-bold text-spawn-text">{stat.label}</div>
                  <div className="text-xs text-spawn-muted-text mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Testimonials */}
            <div className="grid md:grid-cols-3 gap-4 text-left">
              {[
                {
                  quote: "The AI assistant answered a breeding question about my discus that I'd been researching for weeks. It cited specific temperature triggers and gave me a complete conditioning protocol.",
                  name: 'Marcus T.',
                  role: 'Discus breeder, Ontario',
                },
                {
                  quote: "I've used every aquarium app out there. SpawnOS is the first one that actually understands water chemistry at a level that matters for serious fishkeeping.",
                  name: 'Sarah K.',
                  role: 'Planted tank specialist',
                },
                {
                  quote: "The spawn tracking alone is worth the Pro subscription. I went from spreadsheets to a system that shows me survival trends across all my betta lines.",
                  name: 'Jordan P.',
                  role: 'Betta breeder, BC',
                },
              ].map((t, ti) => (
                <div key={ti} className="glass-card rounded-xl border border-spawn-border/40 p-5">
                  <p className="text-sm text-spawn-muted-text leading-relaxed mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="text-sm font-semibold text-spawn-text">{t.name}</p>
                    <p className="text-xs text-spawn-muted-text">{t.role}</p>
                  </div>
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
              {FAQ.map((item, i) => (
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
              Pro and Breeder are for when you&apos;re serious about your operation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
              >
                Get Started Free
              </Link>
              <Link
                href="/blueprints"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-spawn-border text-spawn-text hover:border-spawn-cyan/40 text-sm font-semibold transition-all"
              >
                Try the AI First →
              </Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  )
}
