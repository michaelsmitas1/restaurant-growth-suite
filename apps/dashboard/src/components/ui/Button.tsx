import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'celebration';
export type ButtonSize = 'md' | 'full';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-royal-blue text-text-inverse hover:bg-royal-blue-hover focus-visible:ring-border-focus disabled:bg-text-muted disabled:hover:bg-text-muted',
  secondary:
    'bg-transparent text-text-primary border border-border-strong hover:bg-surface-hover focus-visible:ring-border-focus disabled:text-text-muted disabled:border-border',
  celebration:
    'bg-celebration text-ink hover:bg-celebration-hover focus-visible:ring-matte-yellow-hover disabled:bg-text-muted disabled:text-text-inverse',
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'rounded-sm px-4 py-3 min-h-[44px]',
  full: 'rounded-full px-6 py-3 min-h-[44px] w-full',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer',
          'transition-all duration-fast ease-standard',
          'focus-visible:outline-none focus-visible:ring-[3px]',
          'disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
