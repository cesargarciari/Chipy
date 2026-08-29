import type { CareerSummaryDto } from '@chipy/shared';
import { useState } from 'react';
import { TEAM_RESULT_LABELS } from '../../lib/format.js';

const RESULT_TONE: Record<string, string> = {
  champion: 'text-amber',
  finals: 'text-emerald-400',
  conf_finals: 'text-sky-400',
};

export function SeasonTable({ seasons }: { seasons: CareerSummaryDto['seasons'] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-semibold text-ink-dim hover:text-ink"
      >
        {open ? '▾' : '▸'} Season by season ({seasons.length})
      </button>

      {open && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="text-ink-dim">
              <tr className="border-b border-court-700">
                <th className="py-1.5 pr-2">#</th>
                <th className="pr-2">Age</th>
                <th className="pr-2">Team</th>
                <th className="pr-2 text-right">PPG</th>
                <th className="pr-2 text-right">RPG</th>
                <th className="pr-2 text-right">APG</th>
                <th className="pr-2">Result</th>
                <th>Honours</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.index} className="border-b border-court-800/60">
                  <td className="py-1.5 pr-2 font-mono text-ink-dim">{s.index}</td>
                  <td className="pr-2">{s.age}</td>
                  <td className="pr-2 font-semibold">{s.teamId}</td>
                  <td className="pr-2 text-right font-mono tabular-nums">{s.stats.ppg}</td>
                  <td className="pr-2 text-right font-mono tabular-nums">{s.stats.rpg}</td>
                  <td className="pr-2 text-right font-mono tabular-nums">{s.stats.apg}</td>
                  <td className={`pr-2 ${RESULT_TONE[s.teamResult] ?? 'text-ink-dim'}`}>
                    {TEAM_RESULT_LABELS[s.teamResult]}
                  </td>
                  <td className="text-ink-dim">
                    {s.awards.includes('mvp') && <span className="text-amber">MVP </span>}
                    {s.awards.includes('champion') && <span className="text-amber">🏆 </span>}
                    {s.awards.includes('all_star') && !s.awards.includes('mvp') && 'All-Star '}
                    {s.awards.includes('dpoy') && <span className="text-sky-400">DPOY </span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
