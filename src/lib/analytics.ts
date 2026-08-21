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

export type SpawnOSEvent =
  /** Any "get the app" CTA anywhere on the site. */
  | 'spawnos_app_cta_click'
  /** A compatibility check produced a result. */
  | 'compatibility_completed'
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
    const ref = document.referrer
    if (!ref || !/(^|\.)blackwateraquatics\.ca$/i.test(new URL(ref).hostname)) return
    if (sessionStorage.getItem('spawnos_bwa_ref') === '1') return
    sessionStorage.setItem('spawnos_bwa_ref', '1')
    track('blackwater_to_spawnos_click', { source: 'referrer', target: window.location.pathname })
  } catch {
    // Malformed referrer or storage blocked — nothing to record.
  }
}
