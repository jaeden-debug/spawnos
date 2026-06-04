import Link from 'next/link'
import type { LabNoteMeta } from '@/lib/lab-notes'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(+d)) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ArticleCard({ note, compact = false }: { note: LabNoteMeta; compact?: boolean }) {
  return (
    <Link
      href={`/lab-notes/${note.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-spawn-border/60 bg-spawn-card/40 hover:border-spawn-cyan/30 hover:bg-spawn-card/70 transition-all"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-spawn-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={note.thumbnail}
          alt={note.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-spawn-bg/60 to-transparent" />
        <span className="absolute top-3 left-3 text-[0.65rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-spawn-bg/80 border border-spawn-cyan/30 text-spawn-cyan backdrop-blur">
          {note.category}
        </span>
      </div>

      <div className={`flex flex-col flex-1 ${compact ? 'p-4' : 'p-5'}`}>
        <h3 className={`font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors leading-snug ${compact ? 'text-[0.95rem] mb-1.5' : 'text-lg mb-2'}`}>
          {note.title}
        </h3>
        {!compact && (
          <p className="text-sm text-spawn-muted-text leading-relaxed mb-4 line-clamp-2">{note.excerpt}</p>
        )}
        <div className="mt-auto flex items-center gap-2 text-[0.7rem] text-spawn-muted-text">
          <span>{formatDate(note.date)}</span>
          <span className="w-1 h-1 rounded-full bg-spawn-border" />
          <span>{note.readingTime} min read</span>
        </div>
      </div>
    </Link>
  )
}
