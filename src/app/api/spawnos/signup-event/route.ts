import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Fires the `spawnos.signup` event to Resend when a SpawnOS account is
 * created. That event triggers the "SpawnOS — 365-Day Aquarium Intelligence
 * Drip" automation (welcome email + year-long sequence about the species
 * database, calculators, compatibility checker, AI assistant, and blueprints).
 *
 * Required env:
 *   RESEND_API_KEY   Resend API key (server-only)
 * Optional:
 *   SPAWNOS_SIGNUP_EVENT  event name override (default: spawnos.signup)
 *
 * Fire-and-forget from the client: always returns 200-shaped JSON so a
 * marketing failure can never block account creation.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  let email = ''
  let firstName: string | undefined

  try {
    const body = await request.json()
    email = String(body.email ?? '').trim().toLowerCase()
    firstName = typeof body.firstName === 'string' ? body.firstName.trim() || undefined : undefined
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 })
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Invalid email' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Not configured — succeed quietly so signup UX is unaffected.
    console.warn('[spawnos/signup-event] RESEND_API_KEY not set; skipping enrollment')
    return NextResponse.json({ ok: true, enrolled: false })
  }

  const eventName = process.env.SPAWNOS_SIGNUP_EVENT || 'spawnos.signup'

  try {
    const res = await fetch('https://api.resend.com/events/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        email,
        payload: {
          source: 'spawnos-account-signup',
          ...(firstName ? { first_name: firstName } : {}),
        },
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`[spawnos/signup-event] Resend responded ${res.status}: ${text}`)
      return NextResponse.json({ ok: true, enrolled: false })
    }

    return NextResponse.json({ ok: true, enrolled: true })
  } catch (err) {
    console.error('[spawnos/signup-event] error:', err)
    return NextResponse.json({ ok: true, enrolled: false })
  }
}
