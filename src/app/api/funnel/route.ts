import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * First-party funnel ledger: Blackwater -> SpawnOS -> App Store.
 *
 * Neither site had a readable analytics provider, so every funnel event was
 * either a no-op or landed somewhere nobody could query. This endpoint accepts
 * `navigator.sendBeacon` posts from both sites and writes one anonymous row per
 * event to `public.funnel_events`.
 *
 * What it deliberately does NOT store: IP address, user-agent string, cookies
 * or any user identifier. Device is reduced to a coarse class server-side and
 * the raw UA is discarded.
 *
 * Beacons are sent as text/plain, which is a CORS "simple request" — no
 * preflight, and the response is never read. Anything that fails validation is
 * dropped with a 204 so a malformed or hostile post learns nothing.
 */

const ALLOWED_ORIGINS = new Set([
  'https://spawnos.ca',
  'https://www.spawnos.ca',
  'https://blackwateraquatics.ca',
  'https://www.blackwateraquatics.ca',
  'https://4dx50d-jt.myshopify.com',
])

/** The vocabulary both sites emit. Anything else is ignored. */
const EVENTS = new Set([
  // Blackwater side
  'spawnos_impression',
  'spawnos_cta_click',
  'spawnos_appstore_click',
  // spawnos.ca side (names from src/lib/analytics.ts)
  'blackwater_to_spawnos_click',
  'spawnos_app_store_click',
  'spawnos_app_cta_click',
  'tool_to_app_click',
  'species_to_app_click',
])

const SITES = new Set(['blackwater', 'spawnos'])

function deviceClass(ua: string | null): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (!ua) return 'unknown'
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile'
  return 'desktop'
}

const clip = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.length > 0 ? v.slice(0, max) : null

function cors(origin: string | null) {
  const headers: Record<string, string> = { Vary: 'Origin' }
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Content-Type'
  }
  return headers
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get('origin')) })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = cors(origin)
  const drop = () => new NextResponse(null, { status: 204, headers })

  if (!origin || !ALLOWED_ORIGINS.has(origin)) return drop()

  let body: Record<string, unknown>
  try {
    const raw = await request.text()
    if (raw.length > 2000) return drop()
    body = JSON.parse(raw)
  } catch {
    return drop()
  }

  const event = clip(body.event, 48)
  const site = clip(body.site, 16)
  if (!event || !EVENTS.has(event) || !site || !SITES.has(site)) return drop()

  try {
    const admin = createAdminClient()
    await admin.from('funnel_events').insert({
      event,
      site,
      page_path: clip(body.page_path, 240),
      page_type: clip(body.page_type, 32),
      placement: clip(body.placement, 48),
      device: deviceClass(request.headers.get('user-agent')),
      from_blackwater: body.from_blackwater === true,
      is_test: body.is_test === true,
    })
  } catch (err) {
    // Counting must never surface an error to a visitor.
    console.warn('[funnel] insert failed', err)
  }

  return drop()
}
