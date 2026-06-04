import { cn } from '@/lib/utils'
import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helper, id, rows = 3, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl bg-spawn-surface border text-spawn-text placeholder-spawn-muted text-sm resize-none',
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
Textarea.displayName = 'Textarea'

export default Textarea
