'use client'

import Link from 'next/link'
import { track } from '@/lib/analytics'
import { APP_STORE_URL } from '@/lib/app-store'

/**
 * The primary "get SpawnOS" call to action.
 *
 * Routes to /app by default rather than straight to Apple. iOS 1.0 is public,
 * but sending every CTA offsite would turn spawnos.ca into an App Store
 * redirect and strand the free species library and calculators that bring
 * people here in the first place. /app explains the product and carries the
 * real badge; that is where the handoff to Apple belongs.
 *
 * Pass `storeHref` where a direct store link genuinely is the right next step
 * (for example a page whose whole job is the download).
 */
export default function AppCta({
  source,
  className = '',
  secondaryHref = '/pricing',
  secondaryLabel = 'See pricing',
  label = 'Get SpawnOS',
  storeHref = false,
}: {
  /** Placement identifier for analytics, e.g. 'app_page_hero'. */
  source: string
  className?: string
  secondaryHref?: string | null
  secondaryLabel?: string
  label?: string
  /** Link straight to the App Store instead of /app. */
  storeHref?: boolean
}) {
  const primaryProps = storeHref
    ? {
        href: APP_STORE_URL,
        target: '_blank' as const,
        rel: 'noopener',
        onClick: () => track('spawnos_app_store_click', { source }),
      }
    : {
        href: '/app',
        onClick: () => track('spawnos_app_cta_click', { source }),
      }

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <Link
        {...primaryProps}
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
