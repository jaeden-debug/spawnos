import type { Metadata } from 'next'
import SiteHeader from '@/components/layout/SiteHeader'
import AquaChat from '@/components/blueprints/AquaChat'
import { breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'AI Aquarium Intelligence',
  // 124 words, no headings, and an interactive tool behind a client boundary:
  // nothing here earns an index slot yet. Remove the noindex in the same change
  // that gives the page real server-rendered content.
  robots: { index: false, follow: true },
  description:
    'Ask anything about fish care, water chemistry, tank compatibility, breeding, or disease. The SpawnOS AI gives direct, expert answers. Powered by OpenAI.',
  alternates: { canonical: '/blueprints' },
  openGraph: { images: ['https://spawnos.ca/spawnos-brand-card.png'],
    title: 'SpawnOS AI Aquarium Intelligence',
    description: 'Expert aquarium guidance — fish care, chemistry, compatibility, breeding, disease. Direct answers from the SpawnOS AI.',
    type: 'website',
  },
}

export default function BlueprintsPage() {
  const jsonLd = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'AI Intelligence', href: '/blueprints' },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      {/* Chat fills the viewport below the fixed header — no extra padding sections */}
      <main className="pt-[64px] h-dvh flex flex-col overflow-hidden">
        <AquaChat />
      </main>
    </>
  )
}
