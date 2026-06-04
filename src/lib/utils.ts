export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(1)}%`
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugToLabel(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-cyan-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-rose-400'
}

export function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
  if (score >= 60) return 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20'
  if (score >= 40) return 'bg-amber-400/10 text-amber-400 border-amber-400/20'
  return 'bg-rose-400/10 text-rose-400 border-rose-400/20'
}

export function tierColor(tier: string): string {
  switch (tier) {
    case 'elite': return 'text-amber-400'
    case 'high': return 'text-cyan-400'
    case 'medium': return 'text-emerald-400'
    default: return 'text-spawn-muted-text'
  }
}

export function tierBadge(tier: string): string {
  switch (tier) {
    case 'elite': return 'bg-amber-400/10 text-amber-400 border-amber-400/30'
    case 'high': return 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30'
    case 'medium': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
    default: return 'bg-spawn-muted/10 text-spawn-muted-text border-spawn-border'
  }
}

export function sexColor(sex: string): string {
  switch (sex) {
    case 'male': return 'text-cyan-400'
    case 'female': return 'text-rose-400'
    default: return 'text-spawn-muted-text'
  }
}

export function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    eggs: 'Eggs',
    wrigglers: 'Wrigglers',
    'free-swimming': 'Free Swimming',
    growout: 'Grow-Out',
    jarring: 'Jarring',
    juvenile: 'Juvenile',
    sold: 'Sold/Distributed',
  }
  return labels[stage] ?? capitalize(stage)
}

export function generateId(): string {
  return crypto.randomUUID()
}
