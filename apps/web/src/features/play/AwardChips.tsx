import type { AwardId } from '@chipy/engine';
import { AWARD_LABELS } from '../../lib/format.js';

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
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            BIG.has(a) ? 'bg-amber/20 text-amber' : 'bg-court-700 text-ink-dim'
          }`}
        >
          {AWARD_LABELS[a]}
        </span>
      ))}
    </div>
  );
}
