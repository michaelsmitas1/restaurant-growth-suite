import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, checked, onChange, label, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full cursor-pointer',
          'transition-colors duration-fast ease-standard',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-border-focus',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-royal-blue' : 'bg-border-strong',
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'inline-block h-[18px] w-[18px] transform rounded-full bg-surface shadow-sm',
            'transition-transform duration-fast ease-standard',
            checked ? 'translate-x-[22px]' : 'translate-x-1'
          )}
        />
      </button>
    );
  }
);
Toggle.displayName = 'Toggle';
