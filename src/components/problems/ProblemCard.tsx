import Link from 'next/link'
import type { ProblemMeta, HarmLevel } from '@/lib/problems'

const HARM_STYLE: Record<HarmLevel, string> = {
  None: 'bg-green-400/10 border-green-400/30 text-green-400',
  Low: 'bg-spawn-cyan/10 border-spawn-cyan/30 text-spawn-cyan',
  Moderate: 'bg-spawn-amber/10 border-spawn-amber/30 text-spawn-amber',
  High: 'bg-spawn-rose/10 border-spawn-rose/30 text-spawn-rose',
}

export default function ProblemCard({ problem }: { problem: ProblemMeta }) {
  return (
    <Link
      href={`/problems/${problem.slug}`}
      className="group flex flex-col rounded-2xl border border-spawn-border/60 bg-spawn-card/40 hover:border-spawn-cyan/30 hover:bg-spawn-card/70 transition-all p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors leading-snug">
          {problem.shortName}
        </h3>
        <span className={`shrink-0 text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${HARM_STYLE[problem.harmful]}`}>
          {problem.harmful === 'None' ? 'Harmless' : `${problem.harmful} risk`}
        </span>
      </div>
      <p className="text-sm text-spawn-muted-text leading-relaxed line-clamp-3">{problem.verdict || problem.excerpt}</p>
      <div className="mt-3 pt-3 border-t border-spawn-border/40 text-[0.7rem] text-spawn-muted-text">
        Remove? <span className="text-spawn-text-dim font-medium">{problem.remove}</span>
      </div>
    </Link>
  )
}
