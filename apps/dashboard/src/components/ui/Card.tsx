import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type CardVariant = 'default' | 'elevated' | 'celebration' | 'wallet';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-surface rounded-lg shadow-sm',
  elevated: 'bg-surface rounded-md shadow-md',
  celebration: 'bg-celebration-soft rounded-xl',
  wallet: 'bg-surface rounded-2xl shadow-lg',
};

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn('p-6', variantClasses[variant], className)}
      {...props}
    />
  );
}
