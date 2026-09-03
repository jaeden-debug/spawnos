'use client'

import Image from 'next/image'
import { track } from '@/lib/analytics'
import { APP_STORE_URL } from '@/lib/app-store'

/**
 * "Download on the App Store" badge.
 *
 * Uses Apple's official artwork, unmodified, served from our own origin
 * (`/badges/download-on-the-app-store.svg`, fetched from
 * developer.apple.com/assets/elements/badges). Apple requires the badge be used
 * as supplied — no recolouring, no re-lettering, no home-made lookalike — and
 * asks for clear space around it, which the wrapper's padding provides.
 *
 * The badge image is decorative: the accessible name lives on the link, so a
 * screen reader announces one meaningful control rather than a link followed by
 * redundant image alt text.
 */
export default function AppStoreBadge({
  source,
  className = '',
  width = 168,
}: {
  /** Placement identifier for analytics, e.g. 'app_page_hero'. */
  source: string
  className?: string
  width?: number
}) {
  const height = Math.round((width / 119.66407) * 40)

  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener"
      aria-label="Download SpawnOS on the App Store (opens the App Store)"
      onClick={() => track('spawnos_app_store_click', { source })}
      className={`inline-flex items-center justify-center rounded-xl p-1 -m-1 transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spawn-cyan ${className}`}
    >
      <Image
        src="/badges/download-on-the-app-store.svg"
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        priority={false}
        unoptimized
      />
    </a>
  )
}
