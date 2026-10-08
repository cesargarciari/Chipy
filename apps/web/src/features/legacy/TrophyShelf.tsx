import type { AwardId } from '@chipy/engine';
import { Trophy } from 'lucide-react';
import { awardArt } from '../../lib/art.js';
import { AWARD_LABELS, TROPHY_ORDER } from '../../lib/format.js';

/** Awards with artwork. Others are listed as text. */
const SHELF_AWARDS: AwardId[] = [
  'mvp',
  'finals_mvp',
  'champion',
  'dpoy',
  'roy',
  'clutch_poy',
  'mip',
  'sixth_man',
  'all_star',
  'oly_gold',
  'oly_silver',
  'oly_bronze',
];

/** Short label under each trophy stack. */
const SHORT: Partial<Record<AwardId, string>> = {
  mvp: 'MVP',
  finals_mvp: 'Finals MVP',
  champion: 'Champion',
  dpoy: 'DPOY',
  roy: 'ROY',
  clutch_poy: 'Clutch POY',
  mip: 'Most Improved',
  sixth_man: 'Sixth Man',
  all_star: 'All-Star',
  oly_gold: 'Olympic Gold',
  oly_silver: 'Olympic Silver',
  oly_bronze: 'Olympic Bronze',
};

/** Max trophies drawn per stack. The count label shows the real number. */
const MAX_IN_STACK = 4;

interface TrophyShelfProps {
  awards: Partial<Record<AwardId, number>>;
}

/** Trophy case. Each award shows as a stack that spreads out on hover. */
export function TrophyShelf({ awards }: TrophyShelfProps) {
  const shelf = SHELF_AWARDS.filter((id) => (awards[id] ?? 0) > 0 && awardArt(id));
  const rest = TROPHY_ORDER.filter((id) => (awards[id] ?? 0) > 0 && !shelf.includes(id as AwardId));

  if (shelf.length === 0 && rest.length === 0) {
    return <p className="text-ink/60">No hardware, but every legend starts somewhere.</p>;
  }

  return (
    <div className="space-y-4">
      {shelf.length > 0 && (
        <div className="flex flex-wrap items-end gap-x-8 gap-y-6 rounded-2xl bg-ink/4 px-6 pb-5 pt-6">
          {shelf.map((id) => {
            const count = awards[id] ?? 0;
            const src = awardArt(id)!;
            const label = `${count}x ${AWARD_LABELS[id as AwardId]}`;
            return (
              <div
                key={id}
                className="trophy-group flex shrink-0 flex-col items-center rounded-xl outline-offset-4"
                title={label}
                aria-label={label}
                tabIndex={0}
              >
                <div className="trophy-group-stack flex shrink-0 items-end">
                  {Array.from({ length: Math.min(count, MAX_IN_STACK) }).map((_, k) => (
                    <img
                      key={k}
                      src={src}
                      alt=""
                      className="h-16 w-16 shrink-0 object-contain p-1 drop-shadow-[0_8px_14px_var(--shadow-tint)]"
                    />
                  ))}
                </div>
                <div className="t-label mt-2 text-center">
                  {SHORT[id as AwardId] ?? AWARD_LABELS[id as AwardId]}
                  {count > 1 && <span className="t-num ml-1 text-gold">x{count}</span>}
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
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink/6 px-3.5 text-sm text-ink/75"
            >
              <Trophy size={13} strokeWidth={2} className="text-gold" aria-hidden />
              <span className="t-num text-gold">{awards[id]}x</span>
              {AWARD_LABELS[id as AwardId]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
