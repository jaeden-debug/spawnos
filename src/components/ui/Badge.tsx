import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'amber' | 'emerald' | 'rose' | 'muted' | 'purple'
  size?: 'sm' | 'md'
}

export default function Badge({ className, variant = 'cyan', size = 'sm', children, ...props }: BadgeProps) {
  const variants = {
    cyan: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
    amber: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    emerald: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    rose: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
    muted: 'bg-spawn-muted/10 text-spawn-muted-text border-spawn-border',
    purple: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  }
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full border font-medium', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  )
}

export function SexBadge({ sex }: { sex: string }) {
  if (sex === 'male') return <Badge variant="cyan">♂ Male</Badge>
  if (sex === 'female') return <Badge variant="rose">♀ Female</Badge>
  return <Badge variant="muted">Unknown</Badge>
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    active: { variant: 'emerald', label: 'Active' },
    retired: { variant: 'muted', label: 'Retired' },
    sold: { variant: 'amber', label: 'Sold' },
    deceased: { variant: 'rose', label: 'Deceased' },
    planned: { variant: 'cyan', label: 'Planned' },
    spawned: { variant: 'purple', label: 'Spawned' },
  }
  const cfg = map[status] ?? { variant: 'muted' as const, label: status }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    elite: { variant: 'amber', label: '⭐ Elite' },
    high: { variant: 'cyan', label: '↑ High' },
    medium: { variant: 'emerald', label: '→ Medium' },
    low: { variant: 'muted', label: '↓ Low' },
  }
  const cfg = map[tier] ?? { variant: 'muted' as const, label: tier }
  return <Badge variant={cfg.variant} size="md">{cfg.label}</Badge>
}
