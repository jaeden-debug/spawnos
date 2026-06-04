'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Dynamic import to avoid breaking when Supabase env vars are absent
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message)
      } else {
        window.location.href = '/dashboard'
      }
    } catch {
      setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local to enable authentication.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-spawn-surface border border-spawn-border rounded-lg px-3 py-2.5 text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/60 transition-colors'
  const labelClass = 'text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-1.5 block'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="bg-spawn-rose/10 border border-spawn-rose/30 rounded-lg p-3 text-xs text-spawn-rose">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <p className="text-xs text-center text-spawn-muted-text">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-spawn-cyan hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  )
}
