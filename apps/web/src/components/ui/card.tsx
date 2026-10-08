import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn.js';

/** A raised surface: a step lighter than the ground, a hairline edge, a top rim in the dark. */
export const SURFACE = 'bg-raised inset-ring inset-ring-ink/7 shadow-rim';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(SURFACE, 'rounded-card', className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 sm:p-8', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('t-title text-ink', className)} {...props} />;
}
