import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spawnos.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SpawnOS — Aquarium Operating System',
    template: '%s | SpawnOS',
  },
  description:
    'The definitive aquarium science platform. Species database, water parameter calculators, compatibility tools, nitrogen cycle tracker, and AI-powered tank blueprints — built for hobbyists who think like scientists.',
  keywords: [
    'aquarium species database',
    'aquarium water parameter calculator',
    'fish compatibility checker',
    'nitrogen cycle calculator',
    'tank stocking density calculator',
    'aquarium pH buffer calculator',
    'betta fish care guide',
    'AI aquarium tank planner',
    'freshwater fish database',
    'aquarium science tools',
    'tropical fish parameters',
    'aquarium calculator',
  ],
  authors: [{ name: 'Blackwater Aquatics Canada', url: 'https://blackwateraquatics.ca' }],
  creator: 'StillAwake Media',
  openGraph: {
    title: 'SpawnOS — Aquarium Operating System',
    description:
      'Species database, parameter calculators, compatibility tools, and AI tank blueprints for serious aquarium hobbyists.',
    type: 'website',
    locale: 'en_CA',
    siteName: 'SpawnOS',
    url: SITE_URL,
    images: [
      {
        url: '/branding/spawnos-aquarium-operating-system-og-image.png',
        width: 1200,
        height: 630,
        alt: 'SpawnOS — Aquarium Operating System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpawnOS — Aquarium Operating System',
    description:
      'Species database, parameter calculators, compatibility tools, and AI tank blueprints for serious aquarium hobbyists.',
    images: ['/branding/spawnos-aquarium-operating-system-og-image.png'],
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
  alternates: {
    canonical: SITE_URL,
  },
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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-spawn-bg text-spawn-text antialiased">
        {children}
      </body>
    </html>
  )
}
