import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean
  hover?: boolean
}

export function Card({ className, glow, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl border border-spawn-border',
        hover && 'hover-card cursor-pointer',
        glow && 'glow-cyan',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-5 border-b border-spawn-border', className)} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4 border-t border-spawn-border', className)} {...props}>
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  accent = 'cyan',
}: {
  label: string
  value: string | number
  sub?: string
  accent?: 'cyan' | 'amber' | 'emerald' | 'rose'
}) {
  const colors = {
    cyan: 'text-spawn-cyan',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
  }
  return (
    <div className="glass-card rounded-2xl p-5 border border-spawn-border">
      <div className="text-xs text-spawn-muted-text uppercase tracking-wider mb-2">{label}</div>
      <div className={cn('text-3xl font-black', colors[accent])}>{value}</div>
      {sub && <div className="text-xs text-spawn-muted-text mt-1">{sub}</div>}
    </div>
  )
}
