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
 * the raw UA is discarded. Campaign context (utm_*, the Blackwater placement,
 * the Apple campaign token and a Google Ads click id) is accepted only in a
 * validated shape; click ids are nulled after 90 days by the daily App Store
 * sync (purge_funnel_click_ids).
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

const CLICK_ID_TYPES = new Set(['gclid', 'gbraid', 'wbraid'])
const CLICK_ID_RE = /^[A-Za-z0-9_\-.~]{8,256}$/
const PLACEMENT_RE = /^[a-z0-9_]{1,48}$/
const CT_RE = /^[A-Za-z0-9_\-.]{1,30}$/

/** Only accept a value that matches its expected shape; anything else is dropped. */
const match = (v: unknown, re: RegExp): string | null => (typeof v === 'string' && re.test(v) ? v : null)

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

/** A Google Ads click id is stored only with a recognised type and a sane shape. */
function clickId(body: Record<string, unknown>): { click_id_type: string | null; click_id: string | null } {
  const type = typeof body.click_id_type === 'string' && CLICK_ID_TYPES.has(body.click_id_type) ? body.click_id_type : null
  const id = type ? match(body.click_id, CLICK_ID_RE) : null
  return id ? { click_id_type: type, click_id: id } : { click_id_type: null, click_id: null }
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
    if (raw.length > 3000) return drop()
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
      // Campaign context (added 2026-09-19). All optional; see
      // src/lib/acquisition/attribution.ts for what each field is and why.
      utm_source: clip(body.utm_source, 100),
      utm_medium: clip(body.utm_medium, 100),
      utm_campaign: clip(body.utm_campaign, 100),
      utm_term: clip(body.utm_term, 100),
      utm_content: clip(body.utm_content, 100),
      ...clickId(body),
      ref_placement: match(body.ref_placement, PLACEMENT_RE),
      app_store_ct: match(body.app_store_ct, CT_RE),
    })
  } catch (err) {
    // Counting must never surface an error to a visitor.
    console.warn('[funnel] insert failed', err)
  }

  return drop()
}
