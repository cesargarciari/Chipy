import type { CareerSummaryDto } from '@chipy/shared';
import { cn } from '../../lib/cn.js';

type Stats = CareerSummaryDto['seasons'][number]['stats'];

const CELLS: Array<[string, (s: Stats) => number | string, string?]> = [
  ['GP', (s) => s.gp],
  ['MPG', (s) => s.mpg],
  ['PPG', (s) => s.ppg, 'text-amber'],
  ['RPG', (s) => s.rpg],
  ['APG', (s) => s.apg],
  ['SPG', (s) => s.spg],
  ['BPG', (s) => s.bpg],
  ['TS%', (s) => (s.tsPct * 100).toFixed(1)],
];

export function StatLine({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-4 gap-2 text-center sm:grid-cols-8">
      {CELLS.map(([label, get, tone]) => (
        <div key={label} className="rounded-lg bg-court-800 py-2">
          <div className={cn('font-mono text-base font-bold tabular-nums', tone ?? 'text-ink')}>
            {get(stats)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-ink-dim">{label}</div>
        </div>
      ))}
    </div>
  );
}
