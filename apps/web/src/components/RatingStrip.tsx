import type { EffectChip, Ratings } from '@chipy/engine';
import type { CSSProperties } from 'react';
import { cn } from '../lib/cn.js';
import { useT } from '../lib/i18n.js';
import {
  DISPLAY_AXES,
  displayRatingValue,
  mergeDefenseChips,
  toDisplayKey,
} from '../lib/ratings.js';
import { RollingNumber } from './RollingNumber.js';

interface RatingStripProps {
  ratings: Ratings;
  athleticism: number;
  durability: number;
  /** Stats the hovered option would move. They light up in the accent. */
  highlight?: readonly string[];
  /** Effects from the last decision, shown as +/- marks beside the value. */
  recentDeltas?: readonly EffectChip[];
  /** Changes on every decision so the marks replay. */
  echoSeq?: number;
}

/**
 * The ratings, as a scrolling row of tiles on small screens and a ledger with bars beside the
 * decision on large ones. Both defense ratings show as one DEFENSE line.
 */
export function RatingStrip({
  ratings,
  athleticism,
  durability,
  highlight = [],
  recentDeltas = [],
  echoSeq = 0,
}: RatingStripProps) {
  const t = useT();
  const RATING_LABEL: Record<string, string> = t.play.ratings;
  const on = new Set([...highlight].map(toDisplayKey));
  const deltaByKey = new Map(
    mergeDefenseChips([...recentDeltas]).map((c) => [toDisplayKey(c.key), c]),
  );
  const skillTiles = DISPLAY_AXES.map((a) => ({
    key: a.key,
    label: RATING_LABEL[a.key] ?? a.label,
    value: displayRatingValue(ratings, a.key),
  }));
  const ranked = [...skillTiles].sort((x, y) => y.value - x.value);
  const topThree = new Set(ranked.slice(0, 3).map((r) => r.key));

  const tiles = [
    ...skillTiles,
    { key: 'athleticism', label: t.play.ratings.athleticism, value: Math.round(athleticism) },
    { key: 'durability', label: t.play.ratings.durability, value: Math.round(durability) },
  ];

  return (
    <div
      role="list"
      aria-label="Current ratings"
      className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:gap-3 lg:overflow-visible lg:p-0"
    >
      {tiles.map((tile) => {
        const lit = on.has(tile.key);
        const strong = topThree.has(tile.key);
        const delta = deltaByKey.get(tile.key);
        const moved = delta !== undefined && delta.delta !== 0;
        return (
          <div
            key={tile.key}
            role="listitem"
            data-lit={lit ? 'true' : undefined}
            className={cn(
              'relative flex min-w-[5.25rem] snap-start flex-col rounded-2xl px-2 pb-2.5 pt-3 transition-colors duration-200',
              'lg:min-w-0 lg:rounded-none lg:bg-transparent lg:p-0',
              lit ? 'bg-accent/14' : 'bg-ink/4',
            )}
          >
            {moved && (
              <span
                key={`flash-${echoSeq}`}
                aria-hidden
                className="value-flash pointer-events-none absolute inset-0 rounded-2xl lg:-inset-x-2.5 lg:-inset-y-1.5 lg:rounded-xl"
                style={
                  { '--flash': delta.delta > 0 ? 'var(--up)' : 'var(--down)' } as CSSProperties
                }
              />
            )}
            <div className="relative flex flex-col-reverse items-center gap-1 lg:flex-row lg:items-baseline lg:justify-between">
              <span
                className={cn(
                  't-label text-center leading-tight transition-colors lg:text-left',
                  lit ? 'text-accent-ink' : strong ? 'text-ink' : undefined,
                )}
              >
                {tile.label}
              </span>
              <span className="flex items-baseline gap-1.5">
                {moved && (
                  <span
                    key={`tick-${echoSeq}`}
                    aria-hidden
                    className={cn(
                      'tick-in t-num hidden text-xs lg:inline',
                      delta.delta > 0 ? 'text-up' : 'text-down',
                    )}
                  >
                    {delta.delta > 0 ? '+' : ''}
                    {delta.delta}
                  </span>
                )}
                <RollingNumber
                  value={tile.value}
                  className={cn(
                    't-num text-[1.375rem] leading-none transition-colors lg:text-lg',
                    lit ? 'text-accent-ink' : strong ? 'text-ink' : 'text-ink/75',
                  )}
                />
              </span>
            </div>
            <span
              aria-hidden
              className="relative mt-2 hidden h-0.75 overflow-hidden rounded-full bg-ink/8 lg:block"
            >
              <span
                className={cn(
                  'block h-full origin-left rounded-full transition-[scale,background-color] duration-700 ease-out',
                  lit ? 'bg-accent' : strong ? 'bg-ink/70' : 'bg-ink/30',
                )}
                style={{ scale: `${Math.max(0.02, Math.min(1, tile.value / 99))} 1` }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}
