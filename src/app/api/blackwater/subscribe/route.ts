import { NextRequest, NextResponse } from 'next/server'
import { BWA_BASE } from '@/lib/blackwater'

export const runtime = 'nodejs'

/**
 * SpawnOS → Blackwater Aquatics signup bridge.
 *
 * Creates (or no-ops on) a Shopify customer on the Blackwater store with email
 * marketing consent — which enrolls them in the store's email automations
 * (Shopify Email / Klaviyo) — and returns a first-order discount code plus a
 * Shopify auto-apply checkout link.
 *
 * Required env (set in .env.local / Vercel):
 *   BLACKWATER_SHOPIFY_DOMAIN       e.g. your-store.myshopify.com
 *   BLACKWATER_SHOPIFY_ADMIN_TOKEN  Admin API access token (write_customers)
 * Optional:
 *   BLACKWATER_DISCOUNT_CODE        defaults to SPAWNOS15
 *
 * Degrades gracefully: with no token configured it still returns the code so
 * local dev and the success screen work end-to-end.
 */

const API_VERSION = '2025-01'

const DISCOUNT_CODE = process.env.BLACKWATER_DISCOUNT_CODE || 'SPAWNOS15'
const DISCOUNT_REDIRECT = '/collections/live-fish-food-canada'

function applyUrl(code: string): string {
  return `${BWA_BASE}/discount/${encodeURIComponent(code)}?redirect=${encodeURIComponent(DISCOUNT_REDIRECT)}`
}


/**
 * Enroll the subscriber in the "Blackwater Aquatics — 365-Day Live Food Drip"
 * (Resend automation, trigger event `blackwater.subscribed`). Without this,
 * signups only ever reached Shopify and no drip email was ever sent.
 * Fire-and-forget: failures are logged, never surfaced to the user.
 */
async function fireResendEvent(email: string, firstName?: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[blackwater/subscribe] RESEND_API_KEY not set; drip enrollment skipped')
    return
  }
  try {
    const res = await fetch('https://api.resend.com/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: process.env.BLACKWATER_SIGNUP_EVENT || 'blackwater.subscribed',
        contact: { email, ...(firstName ? { first_name: firstName } : {}) },
        data: { source: 'spawnos-signup-page' },
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`[blackwater/subscribe] Resend event failed ${res.status}: ${text}`)
    }
  } catch (err) {
    console.error('[blackwater/subscribe] Resend event error:', err)
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Body {
  email?: string
  firstName?: string
  consent?: boolean
}

const CUSTOMER_CREATE = `
  mutation customerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { id email }
      userErrors { field message }
    }
  }
`

async function createShopifyCustomer(
  domain: string,
  token: string,
  email: string,
  firstName: string | undefined,
  consent: boolean,
): Promise<{ ok: boolean; alreadyExists?: boolean; error?: string }> {
  const input: Record<string, unknown> = { email }
  if (firstName) input.firstName = firstName
  if (consent) {
    input.emailMarketingConsent = {
      marketingState: 'SUBSCRIBED',
      marketingOptInLevel: 'SINGLE_OPT_IN',
      consentUpdatedAt: new Date().toISOString(),
    }
  }

  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query: CUSTOMER_CREATE, variables: { input } }),
  })

  if (!res.ok) {
    return { ok: false, error: `Shopify responded ${res.status}` }
  }

  const json = await res.json()
  const userErrors = json?.data?.customerCreate?.userErrors ?? []

  if (userErrors.length > 0) {
    const msg: string = userErrors.map((e: { message: string }) => e.message).join('; ')
    // An existing customer is a success for our purposes — they still get the code.
    if (/already been taken|already exists/i.test(msg)) {
      return { ok: true, alreadyExists: true }
    }
    return { ok: false, error: msg }
  }

  if (json?.errors) {
    return { ok: false, error: 'Shopify GraphQL error' }
  }

  return { ok: true }
}

export async function POST(request: NextRequest) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const firstName = body.firstName?.trim() || undefined
  const consent = body.consent !== false // default true — signup is an explicit opt-in for the offer

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  // Enroll in the Resend drip regardless of Shopify configuration — email
  // marketing must not depend on the storefront credentials being present.
  if (consent) {
    await fireResendEvent(email, firstName)
  }

  const domain = process.env.BLACKWATER_SHOPIFY_DOMAIN
  const token = process.env.BLACKWATER_SHOPIFY_ADMIN_TOKEN

  // Not configured yet — still hand back the code so the funnel works.
  if (!domain || !token) {
    return NextResponse.json({
      ok: true,
      configured: false,
      code: DISCOUNT_CODE,
      applyUrl: applyUrl(DISCOUNT_CODE),
    })
  }

  try {
    const result = await createShopifyCustomer(domain, token, email, firstName, consent)
    if (!result.ok) {
      console.error('[blackwater/subscribe] Shopify error:', result.error)
      // Soft-fail: still give the user their code; log for investigation.
      return NextResponse.json({
        ok: true,
        configured: true,
        synced: false,
        code: DISCOUNT_CODE,
        applyUrl: applyUrl(DISCOUNT_CODE),
      })
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      synced: true,
      alreadyExists: result.alreadyExists ?? false,
      code: DISCOUNT_CODE,
      applyUrl: applyUrl(DISCOUNT_CODE),
    })
  } catch (err) {
    console.error('[blackwater/subscribe] error:', err)
    return NextResponse.json({
      ok: true,
      configured: true,
      synced: false,
      code: DISCOUNT_CODE,
      applyUrl: applyUrl(DISCOUNT_CODE),
    })
  }
}
