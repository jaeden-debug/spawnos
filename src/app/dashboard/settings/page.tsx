'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Tier = 'free' | 'pro' | 'breeder'

interface Profile {
  display_name: string | null
  username: string | null
  bio: string | null
  location: string | null
  subscription_tier: Tier
  subscription_status: string
  stripe_customer_id: string | null
  is_public: boolean
  specialties: string[] | null
  social_instagram: string | null
  social_youtube: string | null
  trial_ends_at: string | null
  subscription_ends_at: string | null
}

const TIER_META = {
  free:    { label: 'Free', color: 'text-spawn-muted-text', bg: 'bg-spawn-surface border-spawn-border' },
  pro:     { label: 'Pro', color: 'text-spawn-cyan', bg: 'bg-spawn-cyan/10 border-spawn-cyan/30' },
  breeder: { label: 'Breeder', color: 'text-spawn-amber', bg: 'bg-spawn-amber/10 border-spawn-amber/30' },
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    location: '',
    social_instagram: '',
    social_youtube: '',
    is_public: false,
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? '')

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data as Profile)
        setForm({
          display_name: data.display_name ?? '',
          username: data.username ?? '',
          bio: data.bio ?? '',
          location: data.location ?? '',
          social_instagram: data.social_instagram ?? '',
          social_youtube: data.social_youtube ?? '',
          is_public: data.is_public ?? false,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name:     form.display_name || null,
        username:         form.username || null,
        bio:              form.bio || null,
        location:         form.location || null,
        social_instagram: form.social_instagram || null,
        social_youtube:   form.social_youtube || null,
        is_public:        form.is_public,
      })
      .eq('id', user.id)

    if (updateError) {
      if (updateError.message.includes('username')) {
        setError('Username is already taken. Choose another.')
      } else {
        setError(updateError.message)
      }
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  async function openBillingPortal() {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Could not open billing portal.')
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setBillingLoading(false)
    }
  }

  async function startCheckout(plan: string) {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Could not start checkout.')
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setBillingLoading(false)
    }
  }

  const tier = (profile?.subscription_tier ?? 'free') as Tier
  const tierMeta = TIER_META[tier]
  const inputClass = 'w-full bg-spawn-surface border border-spawn-border rounded-xl px-4 py-3 text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/50 transition-colors'
  const labelClass = 'block text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-1.5'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-spawn-cyan/30 border-t-spawn-cyan animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-spawn-text">Account Settings</h1>
        <p className="text-spawn-muted-text text-sm mt-1">{email}</p>
      </div>

      {/* Subscription */}
      <section className="glass-card rounded-2xl border border-spawn-border/50 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-spawn-text mb-1">Subscription</h2>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${tierMeta.bg} ${tierMeta.color}`}>
                {tierMeta.label}
              </span>
              {profile?.subscription_status === 'trialing' && (
                <span className="text-xs text-spawn-muted-text">Trial active</span>
              )}
              {profile?.subscription_status === 'past_due' && (
                <span className="text-xs text-red-400 font-semibold">Payment overdue</span>
              )}
            </div>
          </div>
        </div>

        {tier === 'free' ? (
          <div className="space-y-3">
            <p className="text-sm text-spawn-muted-text leading-relaxed">
              You&apos;re on the Free plan. Upgrade to unlock the full breeder dashboard, unlimited AI, genetics engine, and parameter logging.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => startCheckout('pro')}
                disabled={billingLoading}
                className="flex-1 py-2.5 rounded-xl bg-spawn-cyan text-spawn-bg text-sm font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                Upgrade to Pro — $9/mo
              </button>
              <button
                onClick={() => startCheckout('breeder')}
                disabled={billingLoading}
                className="flex-1 py-2.5 rounded-xl bg-spawn-amber text-spawn-bg text-sm font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                Go Breeder — $24/mo
              </button>
            </div>
            <p className="text-xs text-spawn-muted-text text-center">14-day free trial · Cancel anytime</p>
            <Link href="/pricing" className="block text-center text-xs text-spawn-cyan hover:underline">
              Compare all plans →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {profile?.subscription_ends_at && (
              <p className="text-sm text-spawn-muted-text">
                {profile.subscription_status === 'canceled' ? 'Access until' : 'Next billing'}:{' '}
                <strong className="text-spawn-text">
                  {new Date(profile.subscription_ends_at).toLocaleDateString()}
                </strong>
              </p>
            )}
            <button
              onClick={openBillingPortal}
              disabled={billingLoading}
              className="w-full py-2.5 rounded-xl border border-spawn-border text-spawn-text text-sm font-semibold hover:border-spawn-cyan/40 transition-all disabled:opacity-50"
            >
              {billingLoading ? 'Opening portal...' : 'Manage Billing & Subscription'}
            </button>
            <p className="text-xs text-spawn-muted-text text-center">
              Change plan, update payment method, or cancel — via Stripe&apos;s secure billing portal.
            </p>
          </div>
        )}
      </section>

      {/* Profile */}
      <section className="glass-card rounded-2xl border border-spawn-border/50 p-6">
        <h2 className="text-base font-bold text-spawn-text mb-5">Profile</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Display Name</label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Your name"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-spawn-muted-text text-sm">@</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  placeholder="yourname"
                  className={`${inputClass} pl-7`}
                />
              </div>
              {form.username && (
                <p className="text-xs text-spawn-muted-text mt-1">
                  spawnos.app/breeders/{form.username}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell the community about your fish and breeding focus..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className={labelClass}>Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Toronto, Canada"
              className={inputClass}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Instagram</label>
              <input
                type="text"
                value={form.social_instagram}
                onChange={(e) => setForm({ ...form, social_instagram: e.target.value })}
                placeholder="@handle"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>YouTube</label>
              <input
                type="text"
                value={form.social_youtube}
                onChange={(e) => setForm({ ...form, social_youtube: e.target.value })}
                placeholder="Channel URL"
                className={inputClass}
              />
            </div>
          </div>

          {/* Public profile toggle — Breeder only */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${
            tier === 'breeder' ? 'border-spawn-border/50' : 'border-spawn-border/30 opacity-60'
          }`}>
            <input
              type="checkbox"
              id="is_public"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              disabled={tier !== 'breeder'}
              className="mt-0.5 w-4 h-4 accent-spawn-cyan"
            />
            <div>
              <label htmlFor="is_public" className="text-sm font-semibold text-spawn-text cursor-pointer">
                Make profile public
              </label>
              <p className="text-xs text-spawn-muted-text mt-0.5">
                Show your breeder profile at spawnos.app/breeders/{form.username || 'yourname'}.
                {tier !== 'breeder' && ' Requires Breeder plan.'}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
              saved
                ? 'bg-green-400/20 border border-green-400/30 text-green-400'
                : 'bg-spawn-cyan text-spawn-bg hover:bg-opacity-90'
            } disabled:opacity-50`}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="rounded-2xl border border-red-400/20 p-6">
        <h2 className="text-base font-bold text-red-400 mb-4">Danger Zone</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-spawn-text">Export all data</p>
              <p className="text-xs text-spawn-muted-text">Download your fish, spawns, and logs as CSV.</p>
            </div>
            <button
              disabled={tier === 'free'}
              className="px-4 py-2 rounded-lg border border-spawn-border text-spawn-muted-text text-xs font-semibold hover:text-spawn-text hover:border-spawn-border/80 transition-all disabled:opacity-40 shrink-0"
            >
              {tier === 'free' ? 'Pro required' : 'Export CSV'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-spawn-border/30">
            <div>
              <p className="text-sm font-semibold text-red-400">Delete account</p>
              <p className="text-xs text-spawn-muted-text">Permanently delete your account and all data. Cannot be undone.</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure? This cannot be undone. All data will be permanently deleted.')) {
                  // Deletion requires server-side action — contact support or implement API route
                  alert('Please contact support@spawnos.app to delete your account.')
                }
              }}
              className="px-4 py-2 rounded-lg border border-red-400/30 text-red-400 text-xs font-semibold hover:bg-red-400/10 transition-all shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
