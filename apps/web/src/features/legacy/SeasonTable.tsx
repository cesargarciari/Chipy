import type { CareerSummaryDto } from '@chipy/shared';
import { ChevronRight, Star, Trophy, Zap } from 'lucide-react';
import { useState } from 'react';
import { awardArt } from '../../lib/art.js';
import { cn } from '../../lib/cn.js';
import { GRADE_TONE, moneyM, TEAM_RESULT_LABELS } from '../../lib/format.js';

const ALL_STAR_ART = awardArt('all_star');
const RING_ART = awardArt('ring');

const RESULT_TONE: Record<string, string> = {
  champion: 'text-gold',
  finals: 'text-up',
  conf_finals: 'text-cool',
};

const HEADERS: Array<[string, string?]> = [
  ['#'],
  ['Age'],
  ['Team'],
  ['PPG', 'text-right'],
  ['RPG', 'text-right'],
  ['APG', 'text-right'],
  ['Salary', 'text-right'],
  ['Seed', 'text-right'],
  ['Result'],
  ['Grade', 'text-center'],
  ['Honours'],
];

export function SeasonTable({ seasons }: { seasons: CareerSummaryDto['seasons'] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="-mx-2 inline-flex items-center gap-2 rounded-full px-2 py-1 text-[1.0625rem] text-ink transition-colors hover:text-ink/75"
      >
        <ChevronRight
          size={18}
          strokeWidth={1.75}
          aria-hidden
          className={cn(
            'text-ink/60 transition-[rotate] duration-300 ease-out',
            open && 'rotate-90',
          )}
        />
        Season by season ({seasons.length})
      </button>

      {open && (
        <div className="enter -mx-1 mt-5 overflow-x-auto px-1 [--blur:4px] [--rise:8px]">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10">
                {HEADERS.map(([label, align]) => (
                  <th key={label} className={cn('t-label py-2.5 pr-3 font-medium', align)}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.index} className="border-b border-ink/6 last:border-0">
                  <td className="t-num py-2.5 pr-3 text-ink/60">{s.index}</td>
                  <td className="t-num pr-3">{s.age}</td>
                  <td className="t-num pr-3 text-ink">{s.teamId}</td>
                  <td className="t-num pr-3 text-right">{s.stats.ppg}</td>
                  <td className="t-num pr-3 text-right">{s.stats.rpg}</td>
                  <td className="t-num pr-3 text-right">{s.stats.apg}</td>
                  <td className="t-num pr-3 text-right text-ink/60">{moneyM(s.salary)}</td>
                  <td className="t-num pr-3 text-right text-ink/60">
                    {s.seed >= 1 ? `#${s.seed}` : '-'}
                  </td>
                  <td
                    className={cn('pr-3', RESULT_TONE[s.teamResult] ?? 'text-ink/60')}
                    title={s.finalsHeadline ?? s.recap}
                  >
                    {TEAM_RESULT_LABELS[s.teamResult]}
                  </td>
                  <td className={cn('t-num pr-3 text-center text-base', GRADE_TONE[s.grade])}>
                    {s.grade}
                  </td>
                  <td className="text-ink/60">
                    <span className="inline-flex items-center gap-1.5 align-middle">
                      {s.midseasonId && (
                        <span title={s.midseasonHeadline ?? ''}>
                          <Zap size={13} strokeWidth={2} aria-label="Mid-season fork" />
                        </span>
                      )}
                      {s.awards.includes('all_star') &&
                        (ALL_STAR_ART ? (
                          <img
                            src={ALL_STAR_ART}
                            alt="All-Star"
                            title="All-Star selection"
                            className="inline-block h-4 w-4 object-contain"
                          />
                        ) : (
                          <Star
                            size={13}
                            strokeWidth={2}
                            className="text-gold"
                            aria-label="All-Star"
                          />
                        ))}
                      {s.awards.includes('mvp') && <span className="text-xs text-gold">MVP</span>}
                      {s.awards.includes('champion') &&
                        (RING_ART ? (
                          <img
                            src={RING_ART}
                            alt="Champion"
                            title="Champion"
                            className="inline-block h-4 w-4 object-contain"
                          />
                        ) : (
                          <Trophy
                            size={13}
                            strokeWidth={2}
                            className="text-gold"
                            aria-label="Champion"
                          />
                        ))}
                      {s.awards.includes('dpoy') && <span className="text-xs text-cool">DPOY</span>}
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
