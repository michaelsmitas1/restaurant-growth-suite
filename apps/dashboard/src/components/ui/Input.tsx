import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-sm border px-4 py-3 text-base text-text-primary bg-surface',
            'placeholder:text-text-muted',
            'transition-colors duration-fast ease-standard',
            'focus:outline-none focus:ring-[3px] focus:ring-royal-blue-subtle focus:border-border-focus',
            'disabled:bg-surface-hover disabled:text-text-muted disabled:cursor-not-allowed',
            error ? 'border-error' : 'border-border',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error && id ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={id ? `${id}-error` : undefined} className="mt-2 text-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
