import type { Metadata } from 'next'
import { APP_STORE_URL, PLATFORM } from '@/lib/app-store'

/**
 * The fallback shown at https://spawnos.app when someone opens the app domain
 * in a browser. Deliberately minimal: the marketing site lives on spawnos.ca
 * and this page must not compete with it for brand/product intent, so it is
 * noindex.
 */
export const metadata: Metadata = {
  title: 'SpawnOS — Breeding intelligence in your pocket',
  robots: { index: false, follow: true },
}

export default function AppLandingPage() {
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
        <p style={{ fontSize: 24, fontWeight: 600, letterSpacing: 4, margin: '0 0 20px' }}>
          SPAWNOS
        </p>
        <h1 style={{ fontSize: 24, margin: '0 0 12px' }}>Breeding intelligence in your pocket.</h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.75, margin: '0 0 28px' }}>
          Species-aware breeding timelines, lineage, genetics guidance and the
          SpawnOS assistant — on your iPhone.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.75, margin: '0 0 28px' }}>
          <strong>SpawnOS is free on the App Store</strong> for iPhone, and
          requires {PLATFORM}.
        </p>
        <a
          href={APP_STORE_URL}
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
          Download on the App Store
        </a>
        <p style={{ fontSize: 14, margin: '18px 0 0' }}>
          <a href="https://spawnos.ca" style={{ color: '#6BFCF6' }}>
            Explore SpawnOS on the web
          </a>
        </p>
      </div>
    </main>
  )
}
