import Link from 'next/link'
import { rateScore, type CompatMeta } from '@/lib/compatibility'

export default function CompatibilityCard({ pairing }: { pairing: CompatMeta }) {
  const rating = rateScore(pairing.score)
  const widthClass =
    pairing.score >= 95 ? 'w-[95%]' :
    pairing.score >= 90 ? 'w-[90%]' :
    pairing.score >= 85 ? 'w-[85%]' :
    pairing.score >= 80 ? 'w-[80%]' :
    pairing.score >= 75 ? 'w-[75%]' :
    pairing.score >= 70 ? 'w-[70%]' :
    pairing.score >= 65 ? 'w-[65%]' :
    pairing.score >= 60 ? 'w-[60%]' :
    pairing.score >= 55 ? 'w-[55%]' :
    pairing.score >= 50 ? 'w-[50%]' :
    pairing.score >= 45 ? 'w-[45%]' :
    pairing.score >= 40 ? 'w-[40%]' :
    pairing.score >= 35 ? 'w-[35%]' :
    pairing.score >= 30 ? 'w-[30%]' :
    pairing.score >= 25 ? 'w-[25%]' :
    pairing.score >= 20 ? 'w-[20%]' :
    pairing.score >= 15 ? 'w-[15%]' :
    pairing.score >= 10 ? 'w-[10%]' :
    pairing.score > 0 ? 'w-[5%]' : 'w-0'
  return (
    <Link
      href={`/compatibility/${pairing.slug}`}
      className="group flex flex-col rounded-2xl border border-spawn-border/60 bg-spawn-card/40 hover:border-spawn-cyan/30 hover:bg-spawn-card/70 transition-all p-5"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors leading-snug">
          {pairing.speciesA} <span className="text-spawn-muted-text font-normal">+</span> {pairing.speciesB}
        </div>
        <div className={`text-lg font-black shrink-0 ${rating.color}`}>{pairing.score}</div>
      </div>
      <div className="h-1.5 rounded-full bg-spawn-border/50 overflow-hidden mb-3">
        <div className={`h-full rounded-full compat-score-fill ${rating.bar}`} style={{ '--score-width': `${pairing.score}%` } as React.CSSProperties} />
      </div>
      <div className={`text-[0.7rem] font-bold uppercase tracking-widest mb-2 ${rating.color}`}>{rating.label}</div>
      <p className="text-sm text-spawn-muted-text leading-relaxed line-clamp-2">{pairing.verdict}</p>
    </Link>
  )
}
