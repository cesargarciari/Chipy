import { cn } from '../lib/cn.js';

/** The wordmark's ball: a leather-orange circle holding a dark "C" that doubles as its seam. */
export function ChipyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('shrink-0', className)}>
      <circle cx="16" cy="16" r="15" className="fill-accent" />
      <path
        d="M21.6 10.2a8.2 8.2 0 1 0 0 11.6"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        className="stroke-on-accent"
      />
      <path
        d="M16 1v6.2M16 24.8V31"
        fill="none"
        strokeWidth="1.3"
        strokeLinecap="round"
        className="stroke-on-accent opacity-55"
      />
    </svg>
  );
}
