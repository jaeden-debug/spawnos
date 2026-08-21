'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PLANS, type Plan } from './plans'

/**
 * The only genuinely interactive part of /pricing: the monthly/annual toggle
 * and the Stripe checkout buttons.
 *
 * This is deliberately a small island. The whole page used to be one client
 * component — `useSearchParams` forced `'use client'`, and the resulting
 * Suspense boundary meant the server shipped 63 characters of visible text for
 * the entire page. Everything static now renders on the server; only this
 * subtree is client-side.
 */
export default function PricingPlans() {
  return (
    <Suspense fallback={<div className="min-h-[420px]" aria-hidden="true" />}>
      <PricingPlansInner />
    </Suspense>
  )
}

function PricingPlansInner() {
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
          
        {/* ── Plan cards ───────────────────────────────────────────────── */}
        <section className="px-4 pb-16">
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-5 items-start">
            {PLANS.map((plan: Plan) => {
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
                    {plan.features.map((f: { text: string; included: boolean }, fi: number) => (
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
    </>
  )
}
