'use client'

import Link from 'next/link'
import { track } from '@/lib/analytics'

/**
 * The primary "get SpawnOS" call to action.
 *
 * Always routes to /app — never to a hardcoded App Store URL. The App Store
 * listing is not public yet, and /app is the one place that states the real
 * status, so when the listing goes live only that page changes.
 */
export default function AppCta({
  source,
  className = '',
  secondaryHref = '/pricing',
  secondaryLabel = 'See pricing',
  label = 'Get SpawnOS',
}: {
  /** Placement identifier for analytics, e.g. 'app_page_hero'. */
  source: string
  className?: string
  secondaryHref?: string | null
  secondaryLabel?: string
  label?: string
}) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <Link
        href="/app"
        onClick={() => track('spawnos_app_cta_click', { source })}
        className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
        style={{ boxShadow: '0 0 28px rgba(0,212,255,0.28)' }}
      >
        {label}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3 8H13M9 4L13 8L9 12"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      {secondaryHref && (
        <Link
          href={secondaryHref}
          className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-spawn-border/70 bg-spawn-surface/40 backdrop-blur text-spawn-text hover:border-spawn-cyan/40 hover:bg-spawn-surface/70 transition-all text-sm font-semibold"
        >
          {secondaryLabel}
        </Link>
      )}
    </div>
  )
}
