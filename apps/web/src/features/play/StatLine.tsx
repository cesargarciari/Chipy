import type { CareerSummaryDto } from '@chipy/shared';

type Stats = CareerSummaryDto['seasons'][number]['stats'];

const CELLS: Array<[string, (s: Stats) => number | string]> = [
  ['GP', (s) => s.gp],
  ['MPG', (s) => s.mpg],
  ['PPG', (s) => s.ppg],
  ['RPG', (s) => s.rpg],
  ['APG', (s) => s.apg],
  ['SPG', (s) => s.spg],
  ['BPG', (s) => s.bpg],
  ['TS%', (s) => (s.tsPct * 100).toFixed(1)],
];

export function StatLine({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-4 gap-2 text-center sm:grid-cols-8">
      {CELLS.map(([label, get]) => (
        <div key={label} className="rounded-lg bg-court-800 py-2">
          <div className="font-mono text-base font-bold tabular-nums">{get(stats)}</div>
          <div className="text-[10px] uppercase tracking-wide text-ink-dim">{label}</div>
        </div>
      ))}
    </div>
  );
}
