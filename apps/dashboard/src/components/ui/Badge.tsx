import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'info' | 'success' | 'warning' | 'error' | 'celebration';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  error: 'bg-error-soft text-error',
  celebration: 'bg-celebration-soft text-ink',
};

export function Badge({ className, variant = 'info', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
