import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, id, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              'w-full appearance-none rounded-sm border px-4 py-3 pr-10 text-base text-text-primary bg-surface',
              'transition-colors duration-fast ease-standard',
              'focus:outline-none focus:ring-[3px] focus:ring-royal-blue-subtle focus:border-border-focus',
              'disabled:bg-surface-hover disabled:text-text-muted disabled:cursor-not-allowed',
              error ? 'border-error' : 'border-border',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error && id ? `${id}-error` : undefined}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
          />
        </div>
        {error && (
          <p id={id ? `${id}-error` : undefined} className="mt-2 text-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
