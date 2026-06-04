import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import MicrofaunaCard from '@/components/microfauna/MicrofaunaCard'
import RecommendedReading from '@/components/lab-notes/RecommendedReading'
import { getMicrofaunaByGroup, getAllMicrofauna } from '@/lib/microfauna'
import { getRecentLabNotes } from '@/lib/lab-notes'

export const metadata: Metadata = {
  title: 'Aquarium Microfauna — The Complete Database',
  description:
    'The complete guide to freshwater aquarium microfauna: scuds, daphnia, copepods, worms, protozoa and more. Identification, life cycles, benefits, risks, and culture methods.',
  alternates: { canonical: '/microfauna' },
}

const GROUP_BLURB: Record<string, string> = {
  Crustacean: 'Amphipods, water fleas, copepods and seed shrimp — the protein-rich live foods and cleanup crew of a healthy tank.',
  Worm: 'Nematodes and annelids, from fry-feeding microworms to the detritus worms that signal your substrate is overdue for a clean.',
  Protozoa: 'Single-celled and colonial micro-organisms — the invisible base of the food web and the first food of newly hatched fry.',
  Other: 'Cnidarians and other microfauna that turn up in established aquariums, for better or worse.',
}

export default function MicrofaunaPage() {
  const grouped = getMicrofaunaByGroup()
  const all = getAllMicrofauna()
  const labNotes = getRecentLabNotes(3)

  return (
    <>
      <SiteHeader />
      <main className="pt-[64px]">

        {/* Pillar hero */}
        <section className="px-4 pt-14 pb-10 border-b border-spawn-border/30">
          <div className="max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-spawn-muted-text mb-5" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <Link href="/library" className="hover:text-spawn-cyan transition-colors">Library</Link>
              <span>/</span>
              <span className="text-spawn-text">Microfauna</span>
            </nav>
            <div className="text-xs font-semibold uppercase tracking-widest text-spawn-cyan mb-3">Microfauna Database</div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-spawn-text mb-5 leading-[1.05]">
              The hidden ecosystem inside every aquarium.
            </h1>
            <p className="text-lg text-spawn-text-dim leading-relaxed">
              Microfauna are the microscopic and near-microscopic animals that live in aquarium water, substrate, and biofilm —
              scuds, daphnia, copepods, rotifers, worms, and protozoa. Some are the best live foods in the hobby. Some are a
              free, self-replicating cleanup crew. A few are genuine problems. This database tells you exactly which is which,
              how to identify each one, and how to culture the good ones on purpose.
            </p>
          </div>
        </section>

        {/* Authority intro */}
        <section className="px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-5 text-[1.0625rem] text-spawn-text-dim leading-[1.85]">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-spawn-text">Why microfauna matter</h2>
            <p>
              Every established aquarium is a tiny ecosystem, and microfauna are its foundation. They graze biofilm and algae,
              break down waste and uneaten food, and convert detritus into a living food source for your fish and fry. A tank
              with a healthy microfauna population is more stable, more self-sufficient, and far better at raising fry than a
              sterile one.
            </p>
            <p>
              For breeders, microfauna are not a curiosity — they are infrastructure. The reason a planted, &ldquo;dirty&rdquo;
              fry tank out-performs a bare, scrubbed one is microfauna: infusoria and rotifers feed the smallest fry around the
              clock, while cultured live foods like microworms, daphnia, and scuds drive the growth that decides survival rates.
              See the full feeding system in{' '}
              <Link href="/lab-notes/best-live-food-for-betta-fry" className="text-spawn-cyan font-semibold hover:underline">Best Live Food for Betta Fry</Link>.
            </p>
            <p>
              The flip side is identification. When something unexpected appears — tiny white worms on the glass, jerky specks in
              the water column, a thread waving from the substrate — most keepers panic and reach for chemicals. Usually that is
              the wrong move. The majority of microfauna are harmless or beneficial, and the few real pests are controlled by
              addressing their cause, not by nuking the tank. Each entry below tells you whether to leave it, culture it, or
              control it.
            </p>
          </div>
        </section>

        {/* Directory grouped */}
        {all.length === 0 ? (
          <div className="max-w-3xl mx-auto px-4 pb-24 text-center text-spawn-muted-text">
            Database entries are being written. Check back shortly.
          </div>
        ) : (
          <section className="px-4 pb-8">
            <div className="max-w-6xl mx-auto space-y-12">
              {grouped.map(({ group, items }) => (
                <div key={group}>
                  <div className="mb-5">
                    <h2 className="text-2xl font-black tracking-tight text-spawn-text">{group}s</h2>
                    <p className="text-sm text-spawn-muted-text mt-1 max-w-2xl leading-relaxed">{GROUP_BLURB[group]}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((entry) => (
                      <MicrofaunaCard key={entry.slug} entry={entry} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cluster cross-links */}
        <RecommendedReading notes={labNotes} title="Related from Lab Notes" eyebrow="Keep learning" />
      </main>
      <SiteFooter />
    </>
  )
}
