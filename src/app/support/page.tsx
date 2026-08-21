import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { breadcrumbSchema, faqPageSchema, SUPPORT_EMAIL } from '@/lib/schema'

/**
 * Support page — also the App Store "Support URL".
 *
 * Apple's reviewers open this URL and check that it offers a genuine way to
 * reach a human. It must therefore carry a working contact address, which is
 * why it uses SUPPORT_EMAIL on blackwateraquatics.ca: spawnos.ca and
 * spawnos.app have no MX records and cannot receive mail at all.
 */
export const metadata: Metadata = {
  title: 'SpawnOS Support — Help With Breeding Records, Sync and Billing',
  description:
    'Get help with SpawnOS: account and sync problems, breeding timelines, species coverage, subscriptions and data deletion. Contact the SpawnOS team directly.',
  alternates: { canonical: '/support' },
}

const FAQ = [
  {
    q: 'How do I get help with SpawnOS?',
    a: `Email ${SUPPORT_EMAIL}. SpawnOS is built and supported by a small team at Blackwater Aquatics Canada, and that address reaches us directly. Include your account email and, if it is about a specific spawn, the pair name — it makes answering much faster.`,
  },
  {
    q: 'My records are not syncing between devices.',
    a: 'SpawnOS syncs to your account whenever the app has a connection. Check you are signed in with the same email on both devices, then pull down on the Today screen to force a sync. If the app shows Offline while other apps work, sign out and back in. If it persists, email us with your account email.',
  },
  {
    q: 'The timeline says guidance is not available for my species.',
    a: 'That is deliberate rather than a bug. Betta splendens and guppies have SpawnOS-verified milestone timelines. For other species SpawnOS records your pair, spawns, logs and lineage but will not invent hatch and free-swimming dates it cannot stand behind. You can ask SpawnOS to research a species profile from the species screen.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Manage or cancel from your account settings on spawnos.ca. Cancelling returns you to the Free plan at the end of the billing period — every animal, pair, spawn, milestone, photo and lineage link you recorded stays readable.',
  },
  {
    q: 'How do I delete my account and data?',
    a: 'Open the You tab in the app and choose Delete Account, or email us and we will do it for you. Deletion removes your animals, pairs, spawns, logs, photos and lineage from our systems within 30 days.',
  },
  {
    q: 'Is my breeding data private?',
    a: 'Yes. Your records are private to your account on every plan, protected by row-level security in the database. SpawnOS does not publish your records or sell your data.',
  },
  {
    q: 'How do I report a bug or request a species?',
    a: `Email ${SUPPORT_EMAIL} with what you expected and what happened. Species requests are genuinely useful to us — the verified-timeline list grows based on what breeders actually ask for.`,
  },
]

export default function SupportPage() {
  const jsonLd = [
    faqPageSchema(FAQ),
    breadcrumbSchema([
      { name: 'Home', href: '/' },
      { name: 'Support', href: '/support' },
    ]),
  ]

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <SiteHeader />
      <main className="pt-20">
        <section className="px-4 pt-16 pb-12 border-b border-spawn-border/30">
          <div className="max-w-2xl mx-auto">
            <div className="text-xs font-semibold uppercase tracking-widest text-spawn-cyan mb-4">Support</div>
            <h1 className="text-4xl font-black text-spawn-text mb-5 leading-tight">
              Need a hand with SpawnOS?
            </h1>
            <p className="text-spawn-muted-text text-lg leading-relaxed mb-8">
              SpawnOS is built by a small team at Blackwater Aquatics Canada. Email us and a
              person reads it.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-spawn-text mb-8">Common questions</h2>
            <div className="space-y-4">
              {FAQ.map((item) => (
                <div key={item.q} className="glass-card rounded-xl border border-spawn-border/40 p-5">
                  <h3 className="font-semibold text-spawn-text mb-2 text-sm">{item.q}</h3>
                  <p className="text-sm text-spawn-muted-text leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-spawn-muted-text mt-10">
              Looking for the app itself?{' '}
              <Link href="/app" className="text-spawn-cyan hover:underline">Get SpawnOS</Link>
              {' · '}
              <Link href="/pricing" className="text-spawn-cyan hover:underline">Pricing</Link>
              {' · '}
              <Link href="/privacy" className="text-spawn-cyan hover:underline">Privacy</Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
