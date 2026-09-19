/**
 * SpawnOS funnel events.
 *
 * There is no analytics provider installed on this site yet, and adding one is
 * a separate decision. Rather than block the funnel work on that, this module
 * defines the event vocabulary and dispatches to whichever provider is present
 * at runtime — Google Analytics (`gtag`), a tag manager (`dataLayer`), or
 * Vercel Analytics (`va`). With none present every call is a silent no-op, so
 * this is safe to ship today and starts reporting the moment a provider is
 * added to src/app/layout.tsx.
 *
 * It also emits a `spawnos:track` DOM CustomEvent, which makes the funnel
 * testable in the browser console without any provider at all:
 *
 *   addEventListener('spawnos:track', e => console.log(e.detail))
 *
 * No personal data belongs in these payloads — species slugs, tool slugs and
 * placement names only.
 */

import {
  appStoreCampaignUrl,
  appStoreProviderToken,
  isBlackwaterAttribution,
  parseAttribution,
  spawnosCampaignToken,
  type Attribution,
} from '@/lib/acquisition/attribution'

export type SpawnOSEvent =
  /** Any "get the app" CTA anywhere on the site. */
  | 'spawnos_app_cta_click'
  /**
   * An outbound click to the App Store listing. This is the launch conversion
   * event — the last thing measurable on the web before Apple takes over.
   * Nothing after this point is visible to us: Apple reports impressions and
   * installs in App Store Connect, and there is no shared identifier between
   * the two, by design.
   */
  | 'spawnos_app_store_click'
  /** A compatibility check was started (inputs chosen). */
  | 'compatibility_started'
  /** A compatibility check produced a result. */
  | 'compatibility_completed'
  /** Stripe Checkout session requested. */
  | 'checkout_start'
  /** Returned from Stripe to the success URL. */
  | 'checkout_success'
  /** A calculator/tool page sent someone toward the app. */
  | 'tool_to_app_click'
  /** A species page sent someone toward the app. */
  | 'species_to_app_click'
  /** Arrival on spawnos.ca attributed to blackwateraquatics.ca. */
  | 'blackwater_to_spawnos_click'
  /** Pricing page viewed. */
  | 'pricing_view'
  /** A paid-plan CTA was clicked. */
  | 'upgrade_click'
  /** Navigation between free tools (the tool-to-tool funnel). */
  | 'tool_to_tool_click'
  /** A tool or species page sent someone to Blackwater. */
  | 'spawnos_to_blackwater_click'

export interface EventProps {
  /** Where on the page the click happened, e.g. 'compatibility_result'. */
  source?: string
  /** Tool slug, species slug, or plan id. */
  target?: string
  /** Plan id for upgrade_click. */
  plan?: string
  [key: string]: string | number | boolean | undefined
}

interface AnalyticsWindow extends Window {
  gtag?: (command: 'event', name: string, params?: Record<string, unknown>) => void
  dataLayer?: Array<Record<string, unknown>>
  va?: (command: 'event', params: Record<string, unknown>) => void
}

export function track(event: SpawnOSEvent, props: EventProps = {}): void {
  if (typeof window === 'undefined') return

  const w = window as AnalyticsWindow
  const payload: Record<string, unknown> = { ...props }

  try {
    w.gtag?.('event', event, payload)
    w.dataLayer?.push({ event, ...payload })
    w.va?.('event', { name: event, ...payload })
    window.dispatchEvent(new CustomEvent('spawnos:track', { detail: { event, ...payload } }))
  } catch {
    // Analytics must never break a page. Swallow deliberately.
  }

  sendToLedger(event, props)
}

/**
 * Also record the event in the first-party funnel ledger (/api/funnel).
 *
 * The providers above are absent on this site, so without this every call was
 * a no-op and the Blackwater -> SpawnOS -> App Store funnel had no readable
 * numbers at all. The ledger stores no personal data: event name, page path,
 * placement, and whether this session arrived from Blackwater.
 *
 * sendBeacon survives the navigation an App Store click triggers, which a
 * fetch would not reliably do.
 */
function sendToLedger(event: SpawnOSEvent, props: EventProps): void {
  try {
    if (!navigator.sendBeacon) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('funnel_test') === '1') sessionStorage.setItem('spawnos_funnel_test', '1')
    const path = window.location.pathname
    const attr = readAttribution()
    navigator.sendBeacon(
      '/api/funnel',
      JSON.stringify({
        event,
        site: 'spawnos',
        page_path: path,
        page_type: path === '/' ? 'home' : path.split('/')[1] || 'other',
        placement: props.source ?? null,
        from_blackwater: sessionStorage.getItem('spawnos_bwa_ref') === '1',
        is_test: sessionStorage.getItem('spawnos_funnel_test') === '1',
        // Campaign context for this visit (see captureAttribution). No PII.
        ...(attr ?? {}),
        app_store_ct: typeof props.app_store_ct === 'string' ? props.app_store_ct : null,
      }),
    )
  } catch {
    // Counting must never break a page.
  }
}

/**
 * Records that this visit arrived from Blackwater Aquatics.
 *
 * Called once per page load from the site header. Checks the referrer rather
 * than requiring UTM tags, so the existing Blackwater links keep working
 * without being rewritten — and fires only once per session so a visitor
 * browsing ten pages counts as one referral.
 */
export function trackBlackwaterReferral(): void {
  if (typeof window === 'undefined') return
  try {
    const attr = captureAttribution()
    const ref = document.referrer
    const fromReferrer = Boolean(ref) && /(^|\.)blackwateraquatics\.ca$/i.test(new URL(ref).hostname)
    // Blackwater's links now also carry bw_placement/utm tags, which survive
    // where a referrer does not (in-app browsers, strict referrer policies).
    const fromParams = isBlackwaterAttribution(attr)
    if (!fromReferrer && !fromParams) return
    if (sessionStorage.getItem('spawnos_bwa_ref') === '1') return
    sessionStorage.setItem('spawnos_bwa_ref', '1')
    track('blackwater_to_spawnos_click', {
      source: attr?.ref_placement ?? 'referrer',
      target: window.location.pathname,
    })
  } catch {
    // Malformed referrer or storage blocked — nothing to record.
  }
}

/**
 * Remembers this visit's campaign context (utm_*, Google Ads click id, and the
 * Blackwater placement that sent it) for the rest of the browser session, so
 * the App Store click at the end of the visit still knows where it came from.
 *
 * sessionStorage only: nothing persists past the tab, no cookie is set, and a
 * later landing with new campaign parameters replaces the old context.
 */
export function captureAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null
  try {
    const fromUrl = parseAttribution(window.location.search)
    if (fromUrl) sessionStorage.setItem('spawnos_attr', JSON.stringify(fromUrl))
    return fromUrl ?? readAttribution()
  } catch {
    return null
  }
}

function readAttribution(): Attribution | null {
  try {
    const raw = sessionStorage.getItem('spawnos_attr')
    return raw ? (JSON.parse(raw) as Attribution) : null
  } catch {
    return null
  }
}

/**
 * Records an App Store click and, when an Apple provider token is configured,
 * points the link at an App Store Connect campaign link (pt/ct/mt) just before
 * the browser follows it. Server-rendered hrefs stay the plain listing URL, so
 * the link works with JavaScript disabled or before a token exists.
 */
export function trackAppStoreClick(anchor: HTMLAnchorElement | null, source: string): void {
  if (typeof window === 'undefined') return
  let ct: string | undefined
  try {
    const fromBlackwater = sessionStorage.getItem('spawnos_bwa_ref') === '1'
    if (appStoreProviderToken()) {
      ct = spawnosCampaignToken(readAttribution(), fromBlackwater)
      if (anchor) anchor.href = appStoreCampaignUrl(ct)
    }
  } catch {
    // Fall through with the plain link.
  }
  track('spawnos_app_store_click', { source, ...(ct ? { app_store_ct: ct } : {}) })
}
