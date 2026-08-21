import type { Metadata } from 'next'
import AuthCallbackBridge from './AuthCallbackBridge'

/**
 * https://spawnos.app/auth/callback — the SpawnOS native auth callback.
 *
 * Two ways a breeder reaches this URL:
 *
 *  1. They tap a link that points straight here. iOS matches it against the
 *     AASA served from this domain and opens the native app directly; this
 *     page never renders.
 *
 *  2. Supabase's verify endpoint redirects them here after validating the
 *     one-time token. iOS does not open apps on a server-side redirect, so
 *     Safari lands on this page instead — and the bridge below hands the
 *     session straight to the app.
 *
 * Tokens are only ever read from the URL in the browser and handed to the
 * app; they are never rendered, logged or sent to our server.
 */
export const metadata: Metadata = {
  title: 'Opening SpawnOS',
  robots: { index: false, follow: false },
}

export default function AuthCallbackPage() {
  return <AuthCallbackBridge />
}
