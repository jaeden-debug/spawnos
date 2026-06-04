import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import RecommendedReading from '@/components/lab-notes/RecommendedReading'
import { getAllMicrofauna } from '@/lib/microfauna'
import { getAllProblems } from '@/lib/problems'
import { getAllCompat } from '@/lib/compatibility'
import { getRecentLabNotes } from '@/lib/lab-notes'

export const metadata: Metadata = {
  title: 'The SpawnOS Library — Aquarium Knowledge Hub',
  description:
    'Every SpawnOS authority resource in one place: the microfauna database, live food encyclopedia, aquarium problem database, fish compatibility database, and breeding guides.',
  alternates: { canonical: '/library' },
}

interface Cluster {
  title: string
  href: string
  icon: string
  desc: string
  status: 'live' | 'soon'
  count?: number
}

export default function LibraryPage() {
  const microfaunaCount = getAllMicrofauna().length
  const problemsCount = getAllProblems().length
  const compatCount = getAllCompat().length
  const labNotes = getRecentLabNotes(3)

  const clusters: Cluster[] = [
    {
      title: 'Microfauna Database',
      href: '/microfauna',
      icon: '🔬',
      desc: 'The complete reference for freshwater microfauna — scuds, daphnia, copepods, worms, and protozoa. Identification, life cycles, benefits, risks, and culture methods.',
      status: 'live',
      count: microfaunaCount,
    },
    {
      title: 'Live Food Encyclopedia',
      href: '/live-foods',
      icon: '🦐',
      desc: 'Every live food in the hobby, compared by nutrition, fish, fry stage, and culture difficulty. The definitive guide to feeding live.',
      status: 'live',
    },
    {
      title: 'Aquarium Problem Database',
      href: '/problems',
      icon: '⚠️',
      desc: '“What is this in my tank?” — identify and solve the pests, blooms, and mystery organisms that show up in established aquariums.',
      status: 'live',
      count: problemsCount,
    },
    {
      title: 'Compatibility Database',
      href: '/compatibility',
      icon: '🤝',
      desc: 'Species-by-species compatibility with scores, parameter overlap, temperament, tank size, risks, and success tips.',
      status: 'live',
      count: compatCount,
    },
  ]

  const live = clusters.filter((c) => c.status === 'live')
  const soon = clusters.filter((c) => c.status === 'soon')

  return (
    <>
      <SiteHeader />
      <main className="pt-[64px] min-h-screen">

        {/* Hero */}
        <section className="px-4 pt-14 pb-10 border-b border-spawn-border/30">
          <div className="max-w-3xl mx-auto">
            <div className="text-xs font-semibold uppercase tracking-widest text-spawn-cyan mb-3">The Library</div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-spawn-text mb-5 leading-[1.05]">
              The aquarium knowledge hub.
            </h1>
            <p className="text-lg text-spawn-text-dim leading-relaxed max-w-2xl">
              Every SpawnOS authority resource in one place. Deep, interconnected databases and pillar guides built to be the
              most useful answer on the internet — and to work together. Looking for individual species?
              That lives in the <Link href="/species" className="text-spawn-cyan font-semibold hover:underline">Species Database</Link>.
              Looking for how-to articles? Those are in <Link href="/lab-notes" className="text-spawn-cyan font-semibold hover:underline">Lab Notes</Link>.
            </p>
          </div>
        </section>

        {/* Live clusters */}
        <section className="px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm font-bold uppercase tracking-widest text-spawn-muted-text mb-6">Live now</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {live.map((c) => (
                <Link key={c.href} href={c.href}
                  className="group flex flex-col rounded-2xl border border-spawn-border/60 bg-spawn-card/40 hover:border-spawn-cyan/30 hover:bg-spawn-card/70 transition-all p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{c.icon}</span>
                    {typeof c.count === 'number' && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-spawn-cyan/10 border border-spawn-cyan/20 text-spawn-cyan">
                        {c.count} {c.count === 1 ? 'entry' : 'entries'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors mb-2">{c.title}</h3>
                  <p className="text-sm text-spawn-muted-text leading-relaxed">{c.desc}</p>
                  <span className="mt-4 text-xs font-semibold text-spawn-cyan flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Roadmap clusters */}
        {soon.length > 0 && (
          <section className="px-4 pb-16">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-sm font-bold uppercase tracking-widest text-spawn-muted-text mb-6">In development</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {soon.map((c) => (
                  <div key={c.href}
                    className="flex flex-col rounded-2xl border border-spawn-border/40 bg-spawn-surface/20 p-6 opacity-70">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl grayscale">{c.icon}</span>
                      <span className="text-[0.65rem] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-spawn-surface border border-spawn-border/60 text-spawn-muted-text">
                        Coming soon
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-spawn-text mb-2">{c.title}</h3>
                    <p className="text-sm text-spawn-muted-text leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <RecommendedReading notes={labNotes} title="Fresh from Lab Notes" eyebrow="Keep learning" />
      </main>
      <SiteFooter />
    </>
  )
}
