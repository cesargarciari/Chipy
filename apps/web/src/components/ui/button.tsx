import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn.js';

/** Pill buttons. Primary is the one lit action on a screen; use it once. */
const button = cva(
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] ' +
    'transition-[background-color,color,box-shadow,scale] duration-200 ease-out active:scale-[.98] ' +
    'disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent shadow-lift hover:bg-accent/88',
        secondary:
          'bg-transparent text-ink inset-ring inset-ring-ink/16 hover:bg-ink/4 hover:inset-ring-ink/34',
        tertiary: 'bg-transparent px-3 text-ink/65 hover:text-ink',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-[0.9375rem]',
        lg: 'h-14 px-8 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(button({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';
