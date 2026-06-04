'use client'

import { useState } from 'react'
import Link from 'next/link'

type Step = 'form' | 'success'

const DEFAULT_CODE = 'SPAWNOS15'
const DEFAULT_APPLY_URL =
  'https://blackwateraquatics.ca/discount/SPAWNOS15?redirect=/collections/live-fish-food-canada'

export default function SignupPage() {
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState(DEFAULT_CODE)
  const [applyUrl, setApplyUrl] = useState(DEFAULT_APPLY_URL)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Registers the email as a Blackwater Aquatics Shopify customer (with
      // marketing consent → email flow) and returns the first-order code.
      const res = await fetch('/api/blackwater/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName: name, consent: true }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      if (data.code) setCode(data.code)
      if (data.applyUrl) setApplyUrl(data.applyUrl)
      setStep('success')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function copyCode() {
    navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-spawn-bg flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-spawn-cyan/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md text-center">
          {/* Back nav */}
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-spawn-muted-text hover:text-spawn-text transition-colors mb-8">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to SpawnOS
          </Link>

          <div className="glass-card rounded-2xl p-10 border border-spawn-border">
            {/* Success icon */}
            <div className="w-16 h-16 rounded-2xl bg-spawn-cyan/10 border border-spawn-cyan/20 flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-spawn-cyan"/>
              </svg>
            </div>

            <h2 className="text-2xl font-black text-spawn-text mb-2">You&apos;re in.</h2>
            <p className="text-spawn-muted-text text-sm leading-relaxed mb-8">
              Welcome to the SpawnOS community. Check your inbox for a confirmation from Blackwater Aquatics.
            </p>

            {/* Discount code */}
            <div className="bg-spawn-amber/8 border border-spawn-amber/25 rounded-xl p-5 mb-8">
              <p className="text-xs text-spawn-amber font-semibold uppercase tracking-widest mb-2">Your discount code</p>
              <div className="flex items-center justify-between gap-3 bg-spawn-bg/60 border border-spawn-border/60 rounded-lg px-4 py-3">
                <span className="text-xl font-black text-spawn-text tracking-widest">{DISCOUNT_CODE}</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(DISCOUNT_CODE)}
                  className="text-xs text-spawn-cyan hover:text-spawn-text transition-colors font-medium shrink-0"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-spawn-muted-text mt-2.5 leading-relaxed">
                15% off your first order at{' '}
                <a href="https://blackwateraquatics.ca" target="_blank" rel="noopener noreferrer" className="text-spawn-cyan hover:underline">
                  Blackwater Aquatics
                </a>
                . Live foods, botanicals, and aquatic supplies shipped across Canada.
              </p>
            </div>

            {/* CTA links */}
            <div className="flex flex-col gap-3">
              <a
                href="https://blackwateraquatics.ca/collections/live-foods"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-colors text-center"
              >
                Shop Live Foods at Blackwater Aquatics
              </a>
              <Link
                href="/species"
                className="w-full py-3 rounded-xl border border-spawn-border text-spawn-text font-semibold text-sm hover:border-spawn-cyan/40 transition-colors text-center"
              >
                Browse Species Database
              </Link>
              <Link
                href="/blueprints"
                className="w-full py-2.5 text-sm text-spawn-muted-text hover:text-spawn-text transition-colors text-center"
              >
                Chat with AI Aquarium Assistant →
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-spawn-bg flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-spawn-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Back */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-spawn-muted-text hover:text-spawn-text transition-colors mb-6">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to SpawnOS
          </Link>

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-spawn-cyan/10 border border-spawn-cyan/30 flex items-center justify-center">
              <span className="text-spawn-cyan font-black">S</span>
            </div>
            <span className="font-bold text-xl text-spawn-text">SpawnOS</span>
          </div>

          {/* Offer badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-spawn-amber/10 border border-spawn-amber/25 text-spawn-amber text-sm font-bold mb-4">
            <span>🎁</span>
            Get 15% off your first order
          </div>

          <h1 className="text-2xl font-black text-spawn-text mb-1">Join the community</h1>
          <p className="text-spawn-muted-text text-sm leading-relaxed max-w-xs mx-auto">
            Subscribe to get fish care insights, new species guides, and an exclusive discount for
            Blackwater Aquatics live foods.
          </p>
        </div>

        {/* Form card */}
        <div className="glass-card rounded-2xl p-8 border border-spawn-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wider">
                First Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full px-4 py-3 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text placeholder-spawn-muted text-sm focus:outline-none focus:border-spawn-cyan/50 focus:ring-1 focus:ring-spawn-cyan/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-spawn-muted-text mb-2 uppercase tracking-wider">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-spawn-surface border border-spawn-border text-spawn-text placeholder-spawn-muted text-sm focus:outline-none focus:border-spawn-cyan/50 focus:ring-1 focus:ring-spawn-cyan/20 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-400/10 border border-rose-400/20 text-rose-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3.5 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Subscribing...' : 'Get My 15% Discount →'}
            </button>
          </form>

          {/* Proof points */}
          <div className="mt-6 pt-5 border-t border-spawn-border/50 space-y-2">
            {[
              'Instant discount code — valid at Blackwater Aquatics',
              'New species guides and aquarium science drops',
              'Unsubscribe any time, no questions asked',
            ].map((point) => (
              <div key={point} className="flex items-start gap-2.5 text-xs text-spawn-muted-text">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
                  <path d="M11.5 3.5L5.5 9.5L2.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-spawn-cyan"/>
                </svg>
                {point}
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-spawn-muted mt-5 leading-relaxed">
          By subscribing you agree to receive emails from SpawnOS and{' '}
          <a href="https://blackwateraquatics.ca" target="_blank" rel="noopener noreferrer" className="text-spawn-cyan hover:underline">
            Blackwater Aquatics
          </a>
          . No spam.
        </p>
      </div>
    </div>
  )
}
