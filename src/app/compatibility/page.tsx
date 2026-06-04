import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import CompatibilityCard from '@/components/compatibility/CompatibilityCard'
import RecommendedReading from '@/components/lab-notes/RecommendedReading'
import { getAllCompat } from '@/lib/compatibility'
import { getRecentLabNotes } from '@/lib/lab-notes'

export const metadata: Metadata = {
  title: 'Fish Compatibility Database — Which Species Can Live Together?',
  description:
    'Scored, species-by-species aquarium compatibility: parameter overlap, temperament, tank size, risk factors, and success tips for popular tankmate pairings.',
  alternates: { canonical: '/compatibility' },
}

export default function CompatibilityPage() {
  const pairings = getAllCompat()
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
              <span className="text-spawn-text">Compatibility</span>
            </nav>
            <div className="text-xs font-semibold uppercase tracking-widest text-spawn-cyan mb-3">Compatibility Database</div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-spawn-text mb-5 leading-[1.05]">
              Which species can actually live together?
            </h1>
            <p className="text-lg text-spawn-text-dim leading-relaxed">
              Every pairing here is scored on the four things that actually decide whether two species cohabit: overlapping
              water parameters, compatible temperament, adequate tank size, and predator–prey risk. No vague &ldquo;maybe.&rdquo;
              A clear score, the real risk factors, and the conditions that make it work — or the alternatives that work better.
            </p>
          </div>
        </section>

        <section className="px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-5 text-[1.0625rem] text-spawn-text-dim leading-[1.85]">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-spawn-text">How the score works</h2>
            <p>
              Compatibility is not a yes/no — it is a set of conditions. Two species can be perfectly compatible in a 30-gallon
              planted tank and a disaster in a 5-gallon bare one. Our score weighs parameter overlap (do they want the same
              water?), temperament (will one harass or eat the other?), space (is there room to establish territory and escape?),
              and risk (what goes wrong, and how often?). A high score means easy success; a middle score means
              &ldquo;workable with the right setup&rdquo;; a low score means find an alternative.
            </p>
            <p>
              Pair these pages with the interactive <Link href="/tools/fish-compatibility" className="text-spawn-cyan font-semibold hover:underline">Fish Compatibility Checker</Link> to
              evaluate your own combinations, and the <Link href="/tools/stocking-density" className="text-spawn-cyan font-semibold hover:underline">Stocking Calculator</Link> to
              confirm you have the space.
            </p>
          </div>
        </section>

        {pairings.length === 0 ? (
          <div className="max-w-3xl mx-auto px-4 pb-24 text-center text-spawn-muted-text">
            Pairings are being added. Check back shortly.
          </div>
        ) : (
          <section className="px-4 pb-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-sm font-bold uppercase tracking-widest text-spawn-muted-text mb-6">Pairings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pairings.map((p) => <CompatibilityCard key={p.slug} pairing={p} />)}
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
