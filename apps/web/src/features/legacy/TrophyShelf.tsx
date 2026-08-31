import type { AwardId } from '@chipy/engine';
import { Trophy } from 'lucide-react';
import { awardArt } from '../../lib/art.js';
import { AWARD_LABELS, TROPHY_ORDER } from '../../lib/format.js';

/**
 * Awards that ship with artwork in `src/assets/awards/`. These go on the shelf
 * as stacked trophies; everything else is listed as text below it.
 */
const SHELF_AWARDS: AwardId[] = [
  'mvp',
  'finals_mvp',
  'champion',
  'dpoy',
  'roy',
  'clutch_poy',
  'all_star',
  'oly_gold',
  'oly_silver',
  'oly_bronze',
];

/** Short caption under each stack - the label alone would be too wide. */
const SHORT: Partial<Record<AwardId, string>> = {
  mvp: 'MVP',
  finals_mvp: 'Finals MVP',
  champion: 'Champion',
  dpoy: 'DPOY',
  roy: 'ROY',
  clutch_poy: 'Clutch POY',
  all_star: 'All-Star',
  oly_gold: 'Olympic Gold',
  oly_silver: 'Olympic Silver',
  oly_bronze: 'Olympic Bronze',
};

/** How many trophies to actually draw in a stack before it just gets silly. The
 * `xN` caption carries the exact count, so the stack only has to read as "a lot". */
const MAX_IN_STACK = 4;

interface TrophyShelfProps {
  awards: Partial<Record<AwardId, number>>;
}

/**
 * A horizontal trophy case. Each award the player won is a little stack of that
 * many trophies - overlapping and clumped at rest, easing apart when you hover
 * the shelf so you can count them. Only image-backed awards go on the shelf;
 * the rest are a plain text list underneath.
 */
export function TrophyShelf({ awards }: TrophyShelfProps) {
  const shelf = SHELF_AWARDS.filter((id) => (awards[id] ?? 0) > 0 && awardArt(id));
  const rest = TROPHY_ORDER.filter((id) => (awards[id] ?? 0) > 0 && !shelf.includes(id as AwardId));

  if (shelf.length === 0 && rest.length === 0) {
    return <p className="text-sm text-ink-dim">No hardware - but every legend starts somewhere.</p>;
  }

  return (
    <div className="space-y-4">
      {shelf.length > 0 && (
        <div className="trophy-shelf flex flex-nowrap items-end gap-5 overflow-x-auto rounded-xl border border-court-700 bg-gradient-to-b from-court-800/70 to-court-900 px-4 pb-3 pt-5">
          {shelf.map((id) => {
            const count = awards[id] ?? 0;
            const src = awardArt(id)!;
            const label = `${count}x ${AWARD_LABELS[id as AwardId]}`;
            return (
              <div
                key={id}
                className="trophy-group flex flex-col items-center rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-amber/60"
                title={label}
                aria-label={label}
                tabIndex={0}
              >
                <div className="trophy-group-stack flex items-end">
                  {Array.from({ length: Math.min(count, MAX_IN_STACK) }).map((_, k) => (
                    <img
                      key={k}
                      src={src}
                      alt=""
                      className="h-16 w-16 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                    />
                  ))}
                </div>
                <div className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-dim">
                  {SHORT[id as AwardId] ?? AWARD_LABELS[id as AwardId]}
                  {count > 1 && <span className="ml-1 text-amber">x{count}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rest.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rest.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-lg border border-court-600 bg-court-800 px-2.5 py-1 text-xs"
            >
              <Trophy size={11} className="text-amber" />
              <span className="font-mono font-bold text-amber">{awards[id]}x</span>{' '}
              {AWARD_LABELS[id as AwardId]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
