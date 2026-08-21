'use client'

import { useEffect, useState } from 'react'

/**
 * Hands a Supabase auth result to the native SpawnOS app.
 *
 * Supabase puts the session in the URL fragment (`#access_token=…`) or, for
 * the PKCE/token-hash flow, in the query string. The fragment never reaches
 * the server, so this has to happen in the browser.
 */
export default function AuthCallbackBridge() {
  const [state, setState] = useState<'opening' | 'manual' | 'none'>('opening')
  const [appUrl, setAppUrl] = useState<string>('spawnos://auth-callback')

  useEffect(() => {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : ''
    const query = window.location.search.startsWith('?')
      ? window.location.search.slice(1)
      : ''
    const payload = hash || query

    if (!payload) {
      setState('none')
      return
    }

    const target = `spawnos://auth-callback?${payload}`
    setAppUrl(target)

    // Try to hand off immediately; if the app isn't installed nothing happens
    // and we fall back to an explicit button rather than a dead end.
    window.location.href = target
    const timer = setTimeout(() => setState('manual'), 1200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 460 }}>
        <p style={{ fontSize: 22, fontWeight: 600, letterSpacing: 4, margin: '0 0 20px' }}>
          SPAWNOS
        </p>

        {state === 'none' ? (
          <>
            <h1 style={{ fontSize: 22, margin: '0 0 12px' }}>This link is incomplete</h1>
            <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.75 }}>
              Sign-in links can only be used once and expire quickly. Request a
              fresh one from the SpawnOS app.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, margin: '0 0 12px' }}>Opening SpawnOS…</h1>
            <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.75, margin: '0 0 24px' }}>
              {state === 'manual'
                ? 'If SpawnOS didn’t open automatically, tap below.'
                : 'Handing your session to the app.'}
            </p>
            <a
              href={appUrl}
              style={{
                display: 'inline-block',
                padding: '14px 30px',
                borderRadius: 12,
                background: '#6BFCF6',
                color: '#000',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Open SpawnOS
            </a>
            <p style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.6, margin: '24px 0 0' }}>
              Don&rsquo;t have the app on this device? SpawnOS is in TestFlight
              for invited testers — see{' '}
              <a href="https://spawnos.ca" style={{ textDecoration: 'underline' }}>
                spawnos.ca
              </a>
              .
            </p>
          </>
        )}
      </div>
    </main>
  )
}
