import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import ArticleCard from '@/components/lab-notes/ArticleCard'
import LabNotesExplorer from '@/components/lab-notes/LabNotesExplorer'
import { getAllLabNotes, getFeaturedLabNotes, getLabNoteCategories } from '@/lib/lab-notes'

export const metadata: Metadata = {
  title: 'Lab Notes — Aquarium Knowledge Engine',
  description:
    'Expert, science-backed aquarium guides: live foods, species care, breeding, compatibility, and water chemistry. The SpawnOS knowledge base.',
  alternates: { canonical: '/lab-notes' },
}

export default function LabNotesPage() {
  const notes = getAllLabNotes()
  const featured = getFeaturedLabNotes(3)
  const categories = getLabNoteCategories()

  return (
    <>
      <SiteHeader />
      <main className="pt-[64px] min-h-screen">
        {/* Header */}
        <section className="px-4 pt-14 pb-10 border-b border-spawn-border/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-xs font-semibold uppercase tracking-widest text-spawn-cyan mb-3">Lab Notes</div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-spawn-text mb-4 max-w-2xl leading-[1.05]">
              The aquarium knowledge engine.
            </h1>
            <p className="text-lg text-spawn-muted-text max-w-2xl leading-relaxed">
              Deeply researched guides on live foods, species care, breeding, compatibility, and water chemistry —
              written to be the most useful answer on the internet, not the longest.
            </p>
          </div>
        </section>

        {notes.length === 0 ? (
          <div className="max-w-6xl mx-auto px-4 py-24 text-center text-spawn-muted-text">
            New articles are being written. Check back shortly.
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <section className="px-4 py-12 bg-spawn-surface/20 border-b border-spawn-border/30">
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-spawn-muted-text mb-6">Featured</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {featured.map((note) => (
                      <ArticleCard key={note.slug} note={note} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* All / searchable */}
            <section className="px-4 py-12">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-spawn-muted-text">All Articles</h2>
                  <Link href="/species" className="text-sm text-spawn-cyan hover:underline font-semibold">Species database →</Link>
                </div>
                <LabNotesExplorer notes={notes} categories={categories} />
              </div>
            </section>

            {/*
              Complete, server-rendered index of every lab note, grouped by topic.

              LabNotesExplorer is a client island that renders PAGE_SIZE (9) cards and
              reveals the rest behind a "Load more" button. That means the hub shipped
              only 9 of its 42 article links in the HTML, and the other 33 were reachable
              only by executing a click — which crawlers do not reliably do. The betta
              breeding cluster, which is the most differentiated content on this site,
              was in that 33 and sat four clicks from the homepage as a result.

              This list is the crawl path and the topical hierarchy: every article,
              grouped under its category, in the initial response. The explorer above
              stays exactly as it is for people.
            */}
            <section className="px-4 pb-16 border-t border-spawn-border/30 pt-12">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-sm font-bold uppercase tracking-widest text-spawn-muted-text mb-8">
                  Every article by topic
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                  {categories.map(({ category, count }) => (
                    <div key={category}>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-spawn-cyan mb-3">
                        {category} <span className="text-spawn-muted-text font-semibold">({count})</span>
                      </h3>
                      <ul className="space-y-2">
                        {notes
                          .filter((n) => n.category === category)
                          .map((n) => (
                            <li key={n.slug}>
                              <Link
                                href={`/lab-notes/${n.slug}`}
                                className="text-sm text-spawn-muted-text hover:text-spawn-cyan leading-snug"
                              >
                                {n.title}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
