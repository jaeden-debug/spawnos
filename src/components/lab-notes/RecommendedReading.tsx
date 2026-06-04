import Link from 'next/link'
import type { LabNoteMeta } from '@/lib/lab-notes'
import ArticleCard from './ArticleCard'

/**
 * Global "Recommended Reading" rail. Drop on any page (home, species,
 * calculators, compatibility, blueprints, articles) — pass the notes to show.
 */
export default function RecommendedReading({
  notes,
  title = 'Recommended Reading',
  eyebrow = 'Lab Notes',
}: {
  notes: LabNoteMeta[]
  title?: string
  eyebrow?: string
}) {
  if (!notes || notes.length === 0) return null

  return (
    <section className="py-16 px-4 border-t border-spawn-border/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-spawn-cyan mb-2">{eyebrow}</div>
            <h2 className="text-2xl sm:text-3xl font-black text-spawn-text tracking-tight">{title}</h2>
          </div>
          <Link href="/lab-notes" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-spawn-cyan hover:underline shrink-0 ml-8">
            All articles →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.slice(0, 3).map((note) => (
            <ArticleCard key={note.slug} note={note} />
          ))}
        </div>
      </div>
    </section>
  )
}
