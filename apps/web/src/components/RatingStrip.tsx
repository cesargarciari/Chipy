import type { EffectChip, Ratings } from '@chipy/engine';
import { cn } from '../lib/cn.js';
import { useT } from '../lib/i18n.js';
import {
  DISPLAY_AXES,
  displayRatingValue,
  mergeDefenseChips,
  toDisplayKey,
} from '../lib/ratings.js';

interface RatingStripProps {
  ratings: Ratings;
  athleticism: number;
  durability: number;
  /** Tile keys to light up gold - e.g. the stats an option under the cursor would move. */
  highlight?: readonly string[];
  /** Effects from the decision that just resolved - tiles they touched get a
   * brief floating +/- tick so the strip visibly reacts to that one call. */
  recentDeltas?: readonly EffectChip[];
  /** Bumped each time a new decision resolves, so the tick badges (keyed off
   * it) remount and replay even when the same tile moves twice in a row. */
  echoSeq?: number;
}

/**
 * The persistent stat-tile row (56 FINISHING · 65 MID-RANGE · …). Interior and
 * perimeter defense collapse to one DEFENSE tile. `highlight` tiles glow gold on
 * hover; the top three skills are tinted by rank.
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
  const rankOf = new Map(ranked.map((r, i) => [r.key, i]));
  const RANK_TONE = ['text-amber', 'text-emerald-400', 'text-sky-400'];

  const tiles = [
    ...skillTiles,
    { key: 'athleticism', label: t.play.ratings.athleticism, value: Math.round(athleticism) },
    { key: 'durability', label: t.play.ratings.durability, value: Math.round(durability) },
  ];

  return (
    <div
      className="-mx-1 flex gap-1.5 overflow-x-auto pb-1"
      role="list"
      aria-label="Current ratings"
    >
      {tiles.map((tile) => {
        const lit = on.has(tile.key);
        const rank = rankOf.get(tile.key);
        const rankTone = !lit && rank !== undefined && rank < 3 ? RANK_TONE[rank] : null;
        const delta = deltaByKey.get(tile.key);
        return (
          <div
            key={tile.key}
            role="listitem"
            className={cn(
              'relative min-w-[4.25rem] flex-1 rounded-lg border px-1 py-1.5 text-center transition-colors',
              lit
                ? 'border-amber bg-amber/10 text-amber'
                : rankTone
                  ? `border-court-700 bg-court-900 ${rankTone}`
                  : 'border-court-700 bg-court-900 text-ink',
            )}
          >
            {delta && delta.delta !== 0 && (
              // Stays inside the tile's own box (no negative offset): the
              // strip's `overflow-x-auto` forces `overflow-y` to `auto` too
              // per the CSS spec, so anything poking above the tile gets
              // clipped rather than floating free.
              <span
                key={echoSeq}
                aria-hidden
                className={cn(
                  'tick-badge pointer-events-none absolute right-0.5 top-0.5 rounded-full px-1 font-mono text-[9px] font-bold leading-tight',
                  delta.delta > 0 ? 'bg-emerald-500 text-court-950' : 'bg-rose-500 text-court-950',
                )}
              >
                {delta.delta > 0 ? '+' : ''}
                {delta.delta}
              </span>
            )}
            <div className="font-mono text-lg font-bold leading-none tabular-nums">
              {tile.value}
            </div>
            <div
              className={cn(
                'mt-1 text-[9px] font-bold uppercase leading-tight tracking-wide',
                lit ? 'opacity-80' : rankTone ? 'opacity-70' : 'text-ink-dim',
              )}
            >
              {tile.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
