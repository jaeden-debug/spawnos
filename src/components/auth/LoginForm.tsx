'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Mode = 'signin' | 'register'

function sanitizeNext(raw: string | null): string {
  // Only allow same-site relative paths to prevent open redirects.
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

function LoginFormInner() {
  const searchParams = useSearchParams()
  const next = sanitizeNext(searchParams.get('next'))
  const initialMode: Mode = searchParams.get('mode') === 'register' ? 'register' : 'signin'

  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)

    try {
      // Dynamic import to avoid breaking when Supabase env vars are absent
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      if (mode === 'signin') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) {
          setError(authError.message)
        } else {
          window.location.href = next
        }
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() || email.split('@')[0] },
            emailRedirectTo: `${window.location.origin}${next}`,
          },
        })

        if (authError) {
          setError(authError.message)
        } else {
          // Enroll in the SpawnOS email sequence — fire-and-forget, never blocks auth.
          fetch('/api/spawnos/signup-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, firstName: displayName.trim() || undefined }),
          }).catch(() => {})

          if (data.session) {
            // Email confirmation disabled — user is signed in immediately.
            window.location.href = next
          } else {
            // Email confirmation enabled — session arrives after they click the link.
            setNotice('Account created. Check your inbox to confirm your email, then sign in.')
            setMode('signin')
          }
        }
      }
    } catch {
      setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local to enable authentication.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-spawn-surface border border-spawn-border rounded-none px-3 py-2.5 text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/60 transition-colors'
  const labelClass = 'bw-eyebrow mb-1.5 block'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode toggle */}
      <div className="grid grid-cols-2 border border-spawn-border">
        {(['signin', 'register'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(''); setNotice('') }}
            className={`py-2.5 text-sm font-display font-semibold uppercase tracking-wide transition-colors ${
              mode === m
                ? 'bg-spawn-cyan/10 text-spawn-cyan border-b-2 border-spawn-cyan'
                : 'text-spawn-muted-text hover:text-spawn-text'
            }`}
          >
            {m === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      {mode === 'register' && (
        <div>
          <label htmlFor="displayName" className={labelClass}>Display name</label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            className={inputClass}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How should we address you?"
          />
        </div>
      )}

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
          minLength={8}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
        />
      </div>

      {error && (
        <div className="bg-spawn-rose/10 border border-spawn-rose/30 p-3 text-xs text-spawn-rose">
          {error}
        </div>
      )}
      {notice && (
        <div className="bg-spawn-emerald/10 border border-spawn-emerald/30 p-3 text-xs text-spawn-emerald">
          {notice}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="bw-btn w-full"
      >
        {loading
          ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
          : (mode === 'signin' ? 'Sign In' : 'Create Account')}
      </button>
    </form>
  )
}

export default function LoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  )
}
