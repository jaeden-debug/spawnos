import type { Metadata } from 'next'

/**
 * https://spawnos.app/auth/callback
 *
 * This is the Universal Link target in SpawnOS auth emails. On an iPhone with
 * SpawnOS installed, iOS intercepts the tap and opens the native app — this
 * page never renders. It renders only as the fallback: desktop, Android, or an
 * iPhone without the app.
 *
 * The token hash stays in the URL and is never logged or echoed into the page.
 */
export const metadata: Metadata = {
  title: 'Opening SpawnOS',
  robots: { index: false, follow: false },
}

export default function AuthCallbackPage() {
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
        <p
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 4,
            margin: '0 0 20px',
          }}
        >
          SPAWNOS
        </p>
        <h1 style={{ fontSize: 22, margin: '0 0 12px' }}>Open this link on your iPhone</h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.75, margin: '0 0 24px' }}>
          Sign-in links open directly in the SpawnOS app. If you have SpawnOS
          installed, open this email on your iPhone and tap the button again.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.6 }}>
          Don&rsquo;t have SpawnOS yet? It&rsquo;s currently in TestFlight for
          invited testers. Learn more at{' '}
          <a href="https://spawnos.ca" style={{ textDecoration: 'underline' }}>
            spawnos.ca
          </a>
          .
        </p>
      </div>
    </main>
  )
}
