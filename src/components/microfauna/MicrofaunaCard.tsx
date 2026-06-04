import Link from 'next/link'
import type { MicrofaunaMeta } from '@/lib/microfauna'

export default function MicrofaunaCard({ entry }: { entry: MicrofaunaMeta }) {
  return (
    <Link
      href={`/microfauna/${entry.slug}`}
      className="group flex flex-col rounded-2xl border border-spawn-border/60 bg-spawn-card/40 hover:border-spawn-cyan/30 hover:bg-spawn-card/70 transition-all p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h3 className="font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors leading-snug">
          {entry.name}
        </h3>
        {entry.pest ? (
          <span className="shrink-0 text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-spawn-rose/10 border border-spawn-rose/30 text-spawn-rose">Pest</span>
        ) : entry.blackwater ? (
          <span className="shrink-0 text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-spawn-cyan/10 border border-spawn-cyan/30 text-spawn-cyan">Live food</span>
        ) : entry.cultureable ? (
          <span className="shrink-0 text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-spawn-surface border border-spawn-border/60 text-spawn-muted-text">Culture</span>
        ) : null}
      </div>
      {entry.scientificName && (
        <div className="text-xs italic text-spawn-muted-text mb-2">{entry.scientificName}</div>
      )}
      <p className="text-sm text-spawn-muted-text leading-relaxed line-clamp-2">{entry.excerpt}</p>
      <div className="mt-3 pt-3 border-t border-spawn-border/40 flex items-center gap-2 text-[0.7rem] text-spawn-muted-text">
        <span>{entry.size}</span>
        <span className="w-1 h-1 rounded-full bg-spawn-border" />
        <span>{entry.group}</span>
      </div>
    </Link>
  )
}
