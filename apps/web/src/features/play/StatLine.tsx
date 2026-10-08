import type { CareerSummaryDto } from '@chipy/shared';
import { cn } from '../../lib/cn.js';

type Stats = CareerSummaryDto['seasons'][number]['stats'];

const CELLS: Array<[string, (s: Stats) => number | string, boolean?]> = [
  ['GP', (s) => s.gp],
  ['MPG', (s) => s.mpg],
  ['PPG', (s) => s.ppg, true],
  ['RPG', (s) => s.rpg],
  ['APG', (s) => s.apg],
  ['SPG', (s) => s.spg],
  ['BPG', (s) => s.bpg],
  ['TS%', (s) => (s.tsPct * 100).toFixed(1)],
];

/** A box-score line: no boxes, just the numbers in a row. */
export function StatLine({ stats }: { stats: Stats }) {
  return (
    <dl className="grid grid-cols-4 gap-x-4 gap-y-5 sm:grid-cols-8">
      {CELLS.map(([label, get, lead]) => (
        <div key={label}>
          <dt className="t-label">{label}</dt>
          <dd
            className={cn('t-num mt-1.5 text-xl leading-none', lead ? 'text-ink' : 'text-ink/75')}
          >
            {get(stats)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
