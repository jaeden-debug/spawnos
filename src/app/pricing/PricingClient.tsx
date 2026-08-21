'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'

// ─── Plan data ───────────────────────────────────────────────────────────────
//
// Prices here MUST match the live Stripe prices resolved by lookup key in
// /api/stripe/checkout (spawnos_pro_monthly = $7, spawnos_pro_annual = $79).
// If you change one, change the other in the same commit.
//
// SpawnOS sells two plans. The Breeder tier was retired from public pricing:
// the capabilities that justified it (public breeder profile, API access, PDF
// lineage export) either lived on the web dashboard nobody used or were never
// built. Existing Breeder subscribers keep everything Pro grants — see
// `tierAtLeast` in src/lib/subscription.ts — and /api/stripe/checkout still
// accepts the plan so those subscriptions renew untouched.
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Your first breeding project — start to finish.',
    monthlyPrice: 0,
    annualPrice: 0,
    cta: 'Get the App',
    ctaHref: '/app',
    ctaStyle: 'border',
    featured: false,
    features: [
      { text: 'One active breeding project', included: true },
      { text: 'Register your animals — photos, traits, notes', included: true },
      { text: 'Species-aware spawn timeline & milestone windows', included: true },
      { text: 'Preparation checklists and reminders', included: true },
      { text: 'Lineage and relatedness warnings', included: true },
      { text: 'Ask SpawnOS — 10 questions/day', included: true },
      { text: 'Full species library & all 15 calculators', included: true },
      { text: 'Several breeding projects at once', included: false },
      { text: 'Higher daily Ask SpawnOS allowance', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For breeders running more than one line.',
    monthlyPrice: 7,
    annualPrice: 79,
    cta: 'Start Pro — Free 14 days',
    ctaHref: '/signup?plan=pro',
    ctaStyle: 'cyan',
    featured: true,
    badge: 'For active breeders',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Unlimited active breeding projects', included: true },
      { text: 'Run multiple spawns side by side', included: true },
      { text: 'Full breeding history across every project', included: true },
      { text: 'Higher daily Ask SpawnOS allowance', included: true },
      { text: 'Deeper lineage across your whole collection', included: true },
      { text: 'Records sync and restore on every device', included: true },
      { text: '14-day free trial, cancel anytime', included: true },
    ],
  },
]

const FAQ = [
  {
    q: 'Is SpawnOS free?',
    a: "The app is free to download and your first breeding project is free — register your animals, create a pair, record the spawn, and follow the whole timeline through to grow-out without paying. The species library and all 15 calculators on this site are free with no account at all.",
  },
  {
    q: 'What actually triggers the upgrade?',
    a: "One thing: running a second breeding project at the same time. Free covers one active pair. When you want to run another line alongside it, that's Pro. Retiring a finished project frees the slot again, and a retired project keeps all of its records.",
  },
  {
    q: 'Does my subscription work in the iPhone app?',
    a: "Yes. SpawnOS has one account and one subscription. Your plan lives on your SpawnOS account, so subscribing here unlocks Pro in the app automatically the next time it syncs — sign in with the same email. There is no separate app subscription to buy.",
  },
  {
    q: 'What happens to my data if I cancel or downgrade?',
    a: "Nothing is deleted and nothing is locked. Every animal, pair, spawn, milestone, photo and lineage link you recorded stays readable on any plan. Downgrading only limits how many projects you can run at once going forward.",
  },
  {
    q: 'What happens after the 14-day Pro trial?',
    a: "You'll be prompted to add a payment method. If you don't, your account returns to Free. Your data stays intact.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, from your account settings. No cancellation fees. Annual subscribers receive a prorated refund within 30 days of purchase.',
  },
  {
    q: 'Is my breeding data private?',
    a: 'Yes. Your animals, pairs, spawns and notes are private to your account on every plan, protected by row-level security. SpawnOS does not publish your records.',
  },
  {
    q: 'What happened to the Breeder plan?',
    a: "We retired it. It promised capabilities we hadn't actually built, which isn't a fair thing to charge for. Existing Breeder subscribers keep full Pro access and their billing is unchanged. If we build genuine fish-room and multi-line tooling later, we'll introduce a plan for it then.",
  },
  {
    q: 'Which species does SpawnOS support?',
    a: "Any species can be registered. Betta splendens and guppies have SpawnOS-verified breeding timelines with milestone windows. Other species — mollies, platies, Neocaridina, corydoras, angelfish, clownfish and more — register and track, and SpawnOS researches a species profile on request. Where confidence is lower, the app says so instead of guessing at biology.",
  },
]

const COMPARISON_FEATURES = [
  { label: 'iPhone app', free: 'Included', pro: 'Included' },
  { label: 'Active breeding projects', free: '1', pro: 'Unlimited' },
  { label: 'Registered animals', free: 'Unlimited', pro: 'Unlimited' },
  { label: 'Spawn timeline & milestone windows', free: '✓', pro: '✓' },
  { label: 'Preparation checklists & reminders', free: '✓', pro: '✓' },
  { label: 'Trait predictions from parent traits', free: '✓', pro: '✓' },
  { label: 'Lineage & relatedness warnings', free: '✓', pro: '✓' },
  { label: 'Photos & multi-device restore', free: '✓', pro: '✓' },
  { label: 'Ask SpawnOS', free: '10 / day', pro: 'Higher allowance' },
  { label: 'Species library', free: 'Full access', pro: 'Full access' },
  { label: 'Calculators', free: 'All 15', pro: 'All 15' },
  { label: 'Access to your past records', free: 'Always', pro: 'Always' },
  { label: 'Support', free: 'Community', pro: 'Email' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function PricingClient() {
  return (
    <Suspense fallback={null}>
      <PricingPageInner />
    </Suspense>
  )
}

function PricingPageInner() {
  const [annual, setAnnual] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState('')
  const searchParams = useSearchParams()
  const resumed = useRef(false)

  async function startCheckout(plan: 'pro' | 'breeder', period: 'monthly' | 'annual') {
    setCheckoutError('')
    setCheckoutLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, period }),
      })
      const data = await res.json()

      if (res.status === 401) {
        // Not signed in — register/sign in first, then resume this checkout.
        const next = `/pricing?checkout=${plan}&period=${period}`
        window.location.href = `/login?mode=register&next=${encodeURIComponent(next)}`
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      setCheckoutError(data.error ?? 'Could not start checkout. Please try again.')
    } catch {
      setCheckoutError('Network error. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  // Resume checkout after the login round-trip (?checkout=pro&period=annual).
  useEffect(() => {
    if (resumed.current) return
    const plan = searchParams.get('checkout')
    const period = searchParams.get('period')
    if ((plan === 'pro' || plan === 'breeder') && (period === 'monthly' || period === 'annual')) {
      resumed.current = true
      startCheckout(plan, period)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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
              Your first breeding<br />
              <span className="text-spawn-cyan">project is free.</span>
            </h1>
            <p className="text-spawn-muted-text text-lg leading-relaxed max-w-xl mx-auto mb-10">
              Register your animals, build a pair, record the spawn and follow the whole timeline
              without paying. Pro is for running more than one project at a time. Every calculator
              and species guide on this site stays free either way.
            </p>

            {checkoutError && (
              <div className="max-w-md mx-auto mb-6 bg-spawn-rose/10 border border-spawn-rose/30 p-3 text-xs text-spawn-rose text-center">
                {checkoutError}
              </div>
            )}

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
                  SAVE $5/YR
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ── Plan cards ───────────────────────────────────────────────── */}
        <section className="px-4 pb-16">
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-5 items-start">
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

                  {plan.id === 'free' ? (
                    <Link
                      href={plan.ctaHref}
                      className="w-full py-3 rounded-none text-sm font-display font-semibold uppercase tracking-wide text-center transition-all border border-spawn-border text-spawn-text hover:border-spawn-cyan/50 hover:bg-spawn-surface"
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <button
                      onClick={() => startCheckout(plan.id as 'pro' | 'breeder', annual ? 'annual' : 'monthly')}
                      disabled={checkoutLoading !== null}
                      className={`w-full py-3 rounded-none text-sm font-display font-semibold uppercase tracking-wide text-center transition-all disabled:opacity-50 ${
                        plan.ctaStyle === 'cyan'
                          ? 'bg-spawn-cyan text-spawn-bg hover:bg-opacity-90'
                          : 'bg-spawn-amber text-spawn-bg hover:bg-opacity-90'
                      }`}
                    >
                      {checkoutLoading === plan.id ? 'Opening checkout…' : plan.cta}
                    </button>
                  )}

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
              {COMPARISON_FEATURES.map((row, ri) => (
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
