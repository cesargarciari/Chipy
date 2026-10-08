import { cn } from '../lib/cn.js';

/**
 * Hairline court markings, drawn to NBA proportions (1 unit = 1 inch on a 50 x 47 ft half court).
 * Always decorative, always faint: the game is about the floor, the floor stays in the background.
 */
export function CourtLines({
  variant,
  className,
}: {
  variant: 'half' | 'center';
  className?: string;
}) {
  if (variant === 'center') {
    return (
      <svg
        aria-hidden
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        className={cn('pointer-events-none stroke-ink/9', className)}
      >
        <line x1="500" y1="0" x2="500" y2="600" vectorEffect="non-scaling-stroke" />
        <circle cx="500" cy="300" r="180" vectorEffect="non-scaling-stroke" />
        <circle cx="500" cy="300" r="60" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 600 564"
      fill="none"
      className={cn('pointer-events-none stroke-ink/9', className)}
    >
      <g>
        <rect x="0" y="0" width="600" height="564" vectorEffect="non-scaling-stroke" />
        {/* The paint, the free-throw circle, the backboard and the rim. */}
        <rect x="204" y="0" width="192" height="228" vectorEffect="non-scaling-stroke" />
        <circle cx="300" cy="228" r="72" vectorEffect="non-scaling-stroke" />
        <line x1="264" y1="48" x2="336" y2="48" vectorEffect="non-scaling-stroke" />
        <circle cx="300" cy="63" r="9" vectorEffect="non-scaling-stroke" />
        <path d="M252 63a48 48 0 0 0 96 0" vectorEffect="non-scaling-stroke" />
        {/* The three-point line: corners, then the arc at 23 ft 9 in from the rim. */}
        <path d="M36 0v168M564 0v168" vectorEffect="non-scaling-stroke" />
        <path d="M36 168A285 285 0 0 0 564 168" vectorEffect="non-scaling-stroke" />
        {/* Half court and the center circle. */}
        <path d="M228 564a72 72 0 0 1 144 0" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
