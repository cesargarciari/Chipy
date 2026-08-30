import type { Ratings } from '@chipy/engine';
import { cn } from '../lib/cn.js';
import { DISPLAY_AXES, displayRatingValue, toDisplayKey } from '../lib/ratings.js';

interface RatingStripProps {
  ratings: Ratings;
  athleticism: number;
  durability: number;
  /** Tile keys to light up gold — e.g. the stats an option under the cursor would move. */
  highlight?: readonly string[];
  /** Tile keys the last decision just raised — tinted orange for a beat. */
  raised?: readonly string[];
}

/**
 * The persistent stat-tile row (56 FINISHING · 65 MID-RANGE · …). Interior and
 * perimeter defense collapse to one DEFENSE tile. `highlight` tiles glow gold on
 * hover; `raised` tiles (just bumped by your last call) glow orange; the top
 * three skills are tinted by rank.
 */
export function RatingStrip({
  ratings,
  athleticism,
  durability,
  highlight = [],
  raised = [],
}: RatingStripProps) {
  const on = new Set([...highlight].map(toDisplayKey));
  const hot = new Set([...raised].map(toDisplayKey));
  const skillTiles = DISPLAY_AXES.map((a) => ({
    key: a.key,
    label: a.label,
    value: displayRatingValue(ratings, a.key),
  }));
  const ranked = [...skillTiles].sort((x, y) => y.value - x.value);
  const rankOf = new Map(ranked.map((t, i) => [t.key, i]));
  const RANK_TONE = ['text-amber', 'text-emerald-400', 'text-sky-400'];

  const tiles = [
    ...skillTiles,
    { key: 'athleticism', label: 'ATHLETICISM', value: Math.round(athleticism) },
    { key: 'durability', label: 'DURABILITY', value: Math.round(durability) },
  ];

  return (
    <div
      className="-mx-1 flex gap-1.5 overflow-x-auto pb-1"
      role="list"
      aria-label="Current ratings"
    >
      {tiles.map((t) => {
        const lit = on.has(t.key);
        const isHot = !lit && hot.has(t.key);
        const rank = rankOf.get(t.key);
        const rankTone = !lit && !isHot && rank !== undefined && rank < 3 ? RANK_TONE[rank] : null;
        return (
          <div
            key={t.key}
            role="listitem"
            className={cn(
              'min-w-[4.25rem] flex-1 rounded-lg border px-1 py-1.5 text-center transition-colors',
              lit
                ? 'border-amber bg-amber/10 text-amber'
                : isHot
                  ? 'border-amber-soft bg-amber-soft/10 text-amber-soft'
                  : rankTone
                    ? `border-court-700 bg-court-900 ${rankTone}`
                    : 'border-court-700 bg-court-900 text-ink',
            )}
          >
            <div className="font-mono text-lg font-bold leading-none tabular-nums">{t.value}</div>
            <div
              className={cn(
                'mt-1 text-[9px] font-bold uppercase leading-tight tracking-wide',
                lit || isHot ? 'opacity-80' : rankTone ? 'opacity-70' : 'text-ink-dim',
              )}
            >
              {t.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
