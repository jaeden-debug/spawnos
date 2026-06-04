import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-spawn-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-spawn-cyan text-spawn-bg hover:bg-spawn-cyan-dim active:scale-[0.98]',
      secondary: 'bg-spawn-surface border border-spawn-border text-spawn-text hover:border-spawn-cyan/30 hover:text-spawn-cyan active:scale-[0.98]',
      ghost: 'text-spawn-muted-text hover:text-spawn-text hover:bg-spawn-surface active:scale-[0.98]',
      danger: 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 active:scale-[0.98]',
      amber: 'bg-amber-400/10 border border-amber-400/20 text-amber-400 hover:bg-amber-400/20 active:scale-[0.98]',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3.5 text-base',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export default Button
