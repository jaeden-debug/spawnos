import type { Metadata } from 'next'
import PricingSchema from '@/components/spawnos/PricingSchema'
import PricingClient from './PricingClient'

/**
 * Server wrapper so /pricing can declare its own canonical and metadata.
 *
 * The page body needs `useSearchParams` (to resume checkout after the login
 * round-trip), which forces `'use client'` — and a client component cannot
 * export `metadata`. Without this split the route inherited the parent
 * canonical and pointed at the homepage.
 */
export const metadata: Metadata = {
  title: 'SpawnOS Pricing — Your First Breeding Project Is Free',
  description:
    'SpawnOS Free covers one active breeding project — animals, pairs, spawn timeline and lineage. Pro is $7/month for unlimited concurrent projects. Species library and all 15 calculators are free.',
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <>
      <PricingSchema />
      <PricingClient />
    </>
  )
}
