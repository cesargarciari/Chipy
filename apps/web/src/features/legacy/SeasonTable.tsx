import type { CareerSummaryDto } from '@chipy/shared';
import { useState } from 'react';
import { awardArt } from '../../lib/art.js';
import { GRADE_TONE, moneyM, TEAM_RESULT_LABELS } from '../../lib/format.js';

const ALL_STAR_ART = awardArt('all_star');

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
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="text-ink-dim">
              <tr className="border-b border-court-700">
                <th className="py-1.5 pr-2">#</th>
                <th className="pr-2">Age</th>
                <th className="pr-2">Team</th>
                <th className="pr-2 text-right">PPG</th>
                <th className="pr-2 text-right">RPG</th>
                <th className="pr-2 text-right">APG</th>
                <th className="pr-2 text-right">Salary</th>
                <th className="pr-2 text-right">Seed</th>
                <th className="pr-2">Result</th>
                <th className="pr-2 text-center">Grade</th>
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
                  <td className="pr-2 text-right font-mono tabular-nums text-ink-dim">
                    {moneyM(s.salary)}
                  </td>
                  <td className="pr-2 text-right font-mono tabular-nums text-ink-dim">
                    {s.seed >= 1 ? `#${s.seed}` : '-'}
                  </td>
                  <td
                    className={`pr-2 ${RESULT_TONE[s.teamResult] ?? 'text-ink-dim'}`}
                    title={s.recap}
                  >
                    {TEAM_RESULT_LABELS[s.teamResult]}
                  </td>
                  <td
                    className={`pr-2 text-center font-display leading-none ${GRADE_TONE[s.grade]}`}
                  >
                    {s.grade}
                  </td>
                  <td className="text-ink-dim">
                    <span className="inline-flex items-center gap-1 align-middle">
                      {s.midseasonId && <span title={s.midseasonHeadline ?? ''}>◆</span>}
                      {s.awards.includes('all_star') &&
                        (ALL_STAR_ART ? (
                          <img
                            src={ALL_STAR_ART}
                            alt="All-Star"
                            title="All-Star selection"
                            className="inline-block h-4 w-4 object-contain"
                          />
                        ) : (
                          <span className="text-amber">★</span>
                        ))}
                      {s.awards.includes('mvp') && <span className="text-amber">MVP</span>}
                      {s.awards.includes('champion') && (
                        <span className="text-amber" title="Champion">
                          🏆
                        </span>
                      )}
                      {s.awards.includes('dpoy') && <span className="text-sky-400">DPOY</span>}
                    </span>
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
