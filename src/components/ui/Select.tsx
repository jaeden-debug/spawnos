import { cn } from '@/lib/utils'
import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helper?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helper, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-spawn-muted-text mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl bg-spawn-surface border text-spawn-text text-sm appearance-none',
            'focus:outline-none focus:ring-1 transition-colors cursor-pointer',
            error
              ? 'border-rose-400/40 focus:border-rose-400/60 focus:ring-rose-400/20'
              : 'border-spawn-border focus:border-spawn-cyan/50 focus:ring-spawn-cyan/20',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" className="bg-spawn-surface">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-spawn-surface">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
        {helper && !error && <p className="mt-1.5 text-xs text-spawn-muted-text">{helper}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

export default Select
