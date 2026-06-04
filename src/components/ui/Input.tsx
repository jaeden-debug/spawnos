import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl bg-spawn-surface border text-spawn-text placeholder-spawn-muted text-sm',
            'focus:outline-none focus:ring-1 transition-colors',
            error
              ? 'border-rose-400/40 focus:border-rose-400/60 focus:ring-rose-400/20'
              : 'border-spawn-border focus:border-spawn-cyan/50 focus:ring-spawn-cyan/20',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
        {helper && !error && <p className="mt-1.5 text-xs text-spawn-muted-text">{helper}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export default Input
