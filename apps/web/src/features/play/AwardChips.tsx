import type { AwardId } from '@chipy/engine';
import { cn } from '../../lib/cn.js';
import { AWARD_LABELS } from '../../lib/format.js';

/** The headline honours read as hardware; the rest stay quiet. */
const BIG = new Set<AwardId>([
  'mvp',
  'finals_mvp',
  'champion',
  'dpoy',
  'roy',
  'scoring_title',
  'oly_gold',
]);

export function AwardChips({ awards }: { awards: AwardId[] }) {
  if (awards.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {awards.map((a, i) => (
        <span
          key={`${a}-${i}`}
          className={cn(
            'inline-flex h-7 items-center rounded-full px-3 text-xs',
            BIG.has(a) ? 'bg-gold/14 text-gold' : 'bg-ink/6 text-ink/70',
          )}
        >
          {AWARD_LABELS[a]}
        </span>
      ))}
    </div>
  );
}
