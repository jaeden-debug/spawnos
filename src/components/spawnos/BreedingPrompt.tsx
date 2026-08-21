'use client'

import Link from 'next/link'
import { track } from '@/lib/analytics'
import type { SpawnOSEvent } from '@/lib/analytics'

/**
 * A contextual SpawnOS prompt for tool results and species pages.
 *
 * The rule this component exists to enforce: the free thing comes first, and
 * the prompt only appears once the visitor already has their answer. It is a
 * next useful action, not an interstitial — nothing here blocks or gates the
 * page it sits on.
 *
 * Write `headline` and `body` for the specific page. A generic "Download our
 * app" banner repeated site-wide is exactly what this replaces.
 */
export default function BreedingPrompt({
  headline,
  body,
  cta = 'How SpawnOS works',
  source,
  event = 'tool_to_app_click',
  target,
}: {
  headline: string
  body: string
  cta?: string
  /** Placement identifier, e.g. 'compatibility_result'. */
  source: string
  /** Which funnel this belongs to. */
  event?: Extract<SpawnOSEvent, 'tool_to_app_click' | 'species_to_app_click'>
  /** Tool or species slug. */
  target?: string
}) {
  return (
    <aside className="rounded-xl border border-spawn-cyan/25 bg-spawn-cyan/[0.04] p-5 sm:p-6">
      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-spawn-cyan mb-2">
        Breeding this species?
      </p>
      <h3 className="text-lg font-black text-spawn-text mb-2 leading-snug">{headline}</h3>
      <p className="text-sm text-spawn-muted-text leading-relaxed mb-4">{body}</p>
      <Link
        href="/app"
        onClick={() => track(event, { source, target })}
        className="inline-flex items-center gap-2 text-sm font-semibold text-spawn-cyan hover:underline"
      >
        {cta}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3 8H13M9 4L13 8L9 12"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </aside>
  )
}
