import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import ProblemCard from '@/components/problems/ProblemCard'
import RecommendedReading from '@/components/lab-notes/RecommendedReading'
import { getAllProblems } from '@/lib/problems'
import { getRecentLabNotes } from '@/lib/lab-notes'

export const metadata: Metadata = {
  title: 'Aquarium Problem Database — What Is in My Tank?',
  description:
    'Identify and solve the pests, worms, blooms, and mystery organisms that appear in aquariums. What it is, whether it is harmful, what causes it, and how to control it.',
  alternates: { canonical: '/problems' },
}

export default function ProblemsPage() {
  const problems = getAllProblems()
  const labNotes = getRecentLabNotes(3)

  return (
    <>
      <SiteHeader />
      <main className="pt-[64px] min-h-screen">

        <section className="px-4 pt-14 pb-10 border-b border-spawn-border/30">
          <div className="max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-spawn-muted-text mb-5" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <Link href="/library" className="hover:text-spawn-cyan transition-colors">Library</Link>
              <span>/</span>
              <span className="text-spawn-text">Problems</span>
            </nav>
            <div className="text-xs font-semibold uppercase tracking-widest text-spawn-cyan mb-3">Problem Database</div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-spawn-text mb-5 leading-[1.05]">
              &ldquo;What is this in my tank?&rdquo;
            </h1>
            <p className="text-lg text-spawn-text-dim leading-relaxed">
              You spotted something — tiny worms on the glass, a thread waving from the substrate, a cloudy bloom, a strange
              jelly-like blob. Before you reach for chemicals, find out what it actually is. Most of what shows up in an
              aquarium is harmless or even beneficial, and the few real pests are best handled by fixing their cause. Each entry
              tells you exactly what you are looking at, whether to worry, and what to do.
            </p>
          </div>
        </section>

        <section className="px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-5 text-[1.0625rem] text-spawn-text-dim leading-[1.85]">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-spawn-text">The one rule before you treat anything</h2>
            <p>
              Almost every &ldquo;infestation&rdquo; in an aquarium is a symptom, not the disease. A sudden bloom of worms, snails,
              or biofilm is the tank telling you there is more food than the system can process — usually from overfeeding or
              accumulated detritus. Nuke the population with chemicals and it comes back, because the cause is still there.
              Cut the food supply and improve maintenance, and most populations shrink on their own.
            </p>
            <p>
              So the workflow for any mystery organism is the same: identify it, decide whether it is actually a threat (most are
              not), address the underlying cause, and only then consider direct removal. The entries below follow that order.
              Many of these organisms are also covered in depth — including the beneficial ones you might want to{' '}
              <Link href="/microfauna" className="text-spawn-cyan font-semibold hover:underline">culture on purpose</Link> — in the
              Microfauna Database.
            </p>
          </div>
        </section>

        {problems.length === 0 ? (
          <div className="max-w-3xl mx-auto px-4 pb-24 text-center text-spawn-muted-text">
            Entries are being written. Check back shortly.
          </div>
        ) : (
          <section className="px-4 pb-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-sm font-bold uppercase tracking-widest text-spawn-muted-text mb-6">Identify it</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {problems.map((p) => <ProblemCard key={p.slug} problem={p} />)}
              </div>
            </div>
          </section>
        )}

        <RecommendedReading notes={labNotes} title="Related from Lab Notes" eyebrow="Keep learning" />
      </main>
      <SiteFooter />
    </>
  )
}
