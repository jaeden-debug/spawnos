import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed } from 'next/font/google'
import './globals.css'
import { organizationSchema } from '@/lib/schema'

// Blackwater Aquatics uses Barlow Condensed 600 for headings/nav.
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spawnos.ca'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SpawnOS — Breeding Records & Spawn Timelines for Aquarium Fish',
    template: '%s | SpawnOS',
  },
  description:
    'Track your breeding pairs, spawn dates, fry milestones and lineage in one app. Plus a free species library, fish compatibility checker and 15 aquarium calculators. No cap on breeding projects.',
  // Ordered by measured demand (Google Keyword Planner, Aug 2026). The
  // product-category terms people would expect here — "fish breeding app",
  // "fish breeding software" — have almost no search volume, so they are not
  // worth chasing sitewide; the breeding-intent and tool terms below are
  // where the traffic actually is.
  keywords: [
    'betta breeding',
    'how to breed betta fish',
    'guppy breeding',
    'betta fry care',
    'fish breeding records',
    'aquarium species database',
    'fish compatibility checker',
    'tank volume calculator',
    'aquarium stocking calculator',
    'aquarium calculator',
    'betta fish care guide',
    'freshwater fish database',
  ],
  authors: [{ name: 'Blackwater Aquatics Canada', url: 'https://blackwateraquatics.ca' }],
  creator: 'StillAwake Media',
  openGraph: {
    title: 'SpawnOS — Breeding Records & Spawn Timelines for Aquarium Fish',
    description:
      'Pairs, spawn dates, fry milestones and lineage in one app. No cap on breeding projects.',
    type: 'website',
    locale: 'en_CA',
    siteName: 'SpawnOS',
    url: SITE_URL,
    images: [
      {
        url: '/spawnos-brand-card.png',
        width: 1200,
        height: 630,
        alt: 'SpawnOS — breeding records and spawn timelines for aquarium fish',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpawnOS — Breeding Records & Spawn Timelines for Aquarium Fish',
    description:
      'Pairs, spawn dates, fry milestones and lineage in one app. No cap on breeding projects.',
    images: ['/spawnos-brand-card.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'icon', url: '/icon-192.png', sizes: '192x192' },
      { rel: 'icon', url: '/icon-512.png', sizes: '512x512' },
    ],
  },
  manifest: '/site.webmanifest',
  // NO sitewide `alternates.canonical`. Next.js inherits metadata down the
  // tree, so setting one here made every page that did not declare its own
  // canonical point at the homepage — /pricing was telling Google it *was*
  // spawnos.ca, which is enough to drop it from the index. Each route declares
  // its own canonical; a missing one is far safer than a wrong one.
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080c0f',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={barlowCondensed.variable} suppressHydrationWarning>
      <body className="bg-spawn-bg text-spawn-text antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
        />
        {children}
      </body>
    </html>
  )
}
