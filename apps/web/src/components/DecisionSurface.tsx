import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { cn } from '../lib/cn.js';
import { releaseCommitGhost } from '../lib/commitGhost.js';
import { SURFACE } from './ui/card.js';

export type DecisionTone = 'default' | 'danger' | 'rare';

const TONE: Record<DecisionTone, string> = {
  default: 'group-hover:inset-ring-ink/16',
  danger: 'group-hover:inset-ring-down/50',
  rare: 'bg-gold/6 inset-ring-gold/45 group-hover:inset-ring-gold/80',
};

interface DecisionSurfaceProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Position in the deal. Each step adds 70ms. */
  index?: number;
  /** Extra delay before this card's deal starts, in ms. */
  delay?: number;
  tone?: DecisionTone;
  /** Keeps the accent ring on, for a pick that stays on screen. */
  selected?: boolean;
  faceClassName?: string;
  children: ReactNode;
}

/**
 * Every pickable option is one of these. The button only fades and sharpens in, so it is still
 * under the pointer the moment it appears; its face rises, lifts on hover, presses on click, and
 * leaves a ghost that locks the call in while the next scene arrives.
 */
export function DecisionSurface({
  index = 0,
  delay = 0,
  tone = 'default',
  selected = false,
  className,
  faceClassName,
  style,
  onClick,
  children,
  ...rest
}: DecisionSurfaceProps) {
  return (
    <button
      type="button"
      {...rest}
      onClick={(e) => {
        const face = e.currentTarget.firstElementChild;
        if (face instanceof HTMLElement) releaseCommitGhost(face);
        onClick?.(e);
      }}
      style={{ '--i': index, '--d': `${delay}ms`, ...style } as CSSProperties}
      className={cn(
        'deal group relative flex rounded-card text-left focus-visible:outline-offset-4',
        className,
      )}
    >
      <span
        className={cn(
          'deal-face relative flex w-full flex-1 flex-col overflow-hidden rounded-card',
          SURFACE,
          'transition-[background-color,box-shadow,translate,scale] duration-300 ease-out',
          'group-hover:-translate-y-1 group-hover:bg-float group-hover:shadow-lift',
          'group-active:scale-[.985] group-active:duration-100',
          TONE[tone],
          selected && 'inset-ring-2 inset-ring-accent group-hover:inset-ring-accent',
          faceClassName,
        )}
      >
        {children}
      </span>
    </button>
  );
}
