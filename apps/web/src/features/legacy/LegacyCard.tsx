import type { AwardId } from '@chipy/engine';
import type { CareerSummaryDto, ChoiceStat } from '@chipy/shared';
import { Award, Trophy } from 'lucide-react';
import { RatingRadar } from '../../components/RatingRadar.js';
import { Button } from '../../components/ui/button.js';
import { Card, CardBody } from '../../components/ui/card.js';
import {
  AWARD_LABELS,
  EURO_RESULT_LABELS,
  GRADE_TONE,
  LEGACY_TIER_LABELS,
  TROPHY_ORDER,
  archetypeLabel,
  countryLabel,
  draftLabel,
  moneyM,
  pctText,
  perkLabel,
  teamName,
} from '../../lib/format.js';
import { MomentCard } from '../../components/MomentCard.js';
import { FranchiseStandings } from './FranchiseStandings.js';
import { SeasonTable } from './SeasonTable.js';
import { ShareRow } from './ShareRow.js';

interface LegacyCardProps {
  summary: CareerSummaryDto;
  choiceStats?: ChoiceStat[];
  shareUrl?: string;
  saving?: boolean;
  saveError?: string | null;
  onPlayAgain?: () => void;
}

export function LegacyCard({
  summary,
  choiceStats,
  shareUrl,
  saving,
  saveError,
  onPlayAgain,
}: LegacyCardProps) {
  const { profile, legacy, careerTotals: ct, awards } = summary;
  const trophies = TROPHY_ORDER.filter((id) => (awards[id] ?? 0) > 0);

  // The legacy card shows only the headline beats — rings, MVP-class awards,
  // franchise idol/legend, big milestones — not every All-Star nod.
  const HEADLINE_MOMENT_IDS = new Set([
    'mvp',
    'dpoy',
    'roy',
    'finals_mvp',
    'euroleague_champion',
    'euroleague_mvp',
    'franchise_idol',
    'franchise_legend',
  ]);
  const bigMoments = summary.moments
    .filter(
      (m) =>
        m.kind === 'ring' ||
        m.kind === 'milestone' ||
        HEADLINE_MOMENT_IDS.has(m.id) ||
        (m.awardId ? HEADLINE_MOMENT_IDS.has(m.awardId) : false),
    )
    .slice(0, 10);

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl">
                #{profile.jerseyNumber} {profile.name}
              </h2>
              <p className="text-sm text-ink-dim">
                {profile.position} · {archetypeLabel(profile.archetype)} ·{' '}
                {profile.handedness === 'left' ? 'Lefty' : 'Righty'} ·{' '}
                {countryLabel(profile.country)}
              </p>
              <p className="mt-1 text-sm font-semibold text-amber">
                {LEGACY_TIER_LABELS[legacy.tier]}
              </p>
            </div>
            <div className="text-right">
              <div className={`font-display text-6xl leading-none ${GRADE_TONE[legacy.grade]}`}>
                {legacy.grade}
              </div>
              <div className="mt-1 font-mono text-xs text-ink-dim">{legacy.score} legacy</div>
            </div>
          </header>

          <p className="text-sm text-ink">{legacy.verdict}</p>

          <div className="flex flex-wrap gap-2 text-xs">
            {legacy.hallOfFame && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2 py-1 font-semibold text-amber">
                <Award size={12} /> Hall of Fame
              </span>
            )}
            {legacy.jerseyRetired && legacy.jerseyRetiredBy && (
              <span className="rounded-full bg-court-700 px-2 py-1 font-semibold text-ink-dim">
                #{profile.jerseyNumber} retired by {teamName(legacy.jerseyRetiredBy)}
              </span>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <RatingRadar ratings={summary.finalRatings} />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Stat label="Peak overall" value={String(summary.peakOverall)} />
              <Stat label="Seasons" value={String(ct.seasons)} />
              <Stat label="Draft" value={draftLabel(summary.draft)} />
              <Stat label="First team" value={teamName(summary.rookieTeam.id)} />
              <Stat label="Career" value={`${ct.ppg} / ${ct.rpg} / ${ct.apg}`} />
              <Stat label="Points" value={ct.points.toLocaleString()} />
              <Stat label="Career earnings" value={moneyM(summary.careerEarnings)} />
              <Stat label="Peak salary" value={`${moneyM(summary.peakSalary)}/yr`} />
            </dl>
          </div>

          {summary.college &&
            (() => {
              const intl = summary.college.tier === 'overseas';
              const years = summary.college.years.length;
              return (
                <div className="rounded-xl border border-court-700 bg-court-800/50 p-3 text-sm">
                  <span className="text-xs uppercase tracking-wide text-ink-dim">
                    {intl ? 'International' : 'College'}
                  </span>
                  <p className="mt-1">
                    <span className="font-semibold">{summary.college.finalSchool}</span>
                    {years > 1 && ` · ${years} ${intl ? 'seasons' : 'years'}`} —{' '}
                    {summary.college.years.at(-1)?.result}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-dim">
                    {intl ? 'First season' : 'Freshman year'}: {summary.college.years[0]?.stats.ppg}
                    /{summary.college.years[0]?.stats.rpg}/{summary.college.years[0]?.stats.apg}
                  </p>
                </div>
              );
            })()}

          {(summary.shoeDeal || summary.perks.length > 0) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {summary.shoeDeal && (
                <span className="rounded-full bg-amber/15 px-2 py-1 font-semibold text-amber">
                  👟 Signature line with {summary.shoeDeal}
                </span>
              )}
              {summary.perks.map((id) => (
                <span
                  key={id}
                  className="rounded-full bg-court-700 px-2 py-1 font-semibold text-ink-dim"
                >
                  {perkLabel(id)}
                </span>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {summary.overseasSeasons.length > 0 && (
        <Card>
          <CardBody className="space-y-3">
            <h3 className="font-bold">
              Overseas — {summary.overseasSeasons.length}{' '}
              {summary.overseasSeasons.length === 1 ? 'season' : 'seasons'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead className="text-ink-dim">
                  <tr className="border-b border-court-700">
                    <th className="py-1.5 pr-2">Age</th>
                    <th className="pr-2">Club</th>
                    <th className="pr-2 text-right">PPG</th>
                    <th className="pr-2 text-right">Salary</th>
                    <th>Finish</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.overseasSeasons.map((o) => (
                    <tr key={o.index} className="border-b border-court-800/60">
                      <td className="py-1.5 pr-2">{o.age}</td>
                      <td className="pr-2 font-semibold">
                        {o.club}
                        <span className="text-ink-dim"> · {o.country}</span>
                      </td>
                      <td className="pr-2 text-right font-mono tabular-nums">{o.stats.ppg}</td>
                      <td className="pr-2 text-right font-mono tabular-nums text-ink-dim">
                        {moneyM(o.salary)}
                      </td>
                      <td
                        className={
                          o.result === 'euroleague_champion' ? 'text-amber' : 'text-ink-dim'
                        }
                      >
                        {EURO_RESULT_LABELS[o.result]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {summary.injuryHistory.length > 0 &&
        (() => {
          const totalGames = summary.injuryHistory.reduce((n, i) => n + i.gamesMissed, 0);
          const notable = summary.injuryHistory.filter(
            (i) => i.severity === 'moderate' || i.severity === 'severe',
          );
          return (
            <Card>
              <CardBody className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-bold">Injury record</h3>
                  <span className="text-xs text-ink-dim">
                    {summary.injuryHistory.length}{' '}
                    {summary.injuryHistory.length === 1 ? 'injury' : 'injuries'} · {totalGames}{' '}
                    games missed
                  </span>
                </div>
                {notable.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {notable.map((i, idx) => (
                      <li key={idx} className="flex items-baseline justify-between gap-3">
                        <span
                          className={i.severity === 'severe' ? 'font-semibold text-rose-400' : ''}
                        >
                          {i.type}
                        </span>
                        <span className="text-xs text-ink-dim">
                          season {i.seasonIndex} · {i.gamesMissed} games
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-dim">
                    Nothing worse than knocks and strains — a durable career.
                  </p>
                )}
              </CardBody>
            </Card>
          );
        })()}

      {(summary.franchises.some((f) => f.tier !== 'none') ||
        summary.nationalTeam.tier !== 'none') && (
        <Card>
          <CardBody>
            <FranchiseStandings
              franchises={summary.franchises}
              nationalTeam={summary.nationalTeam}
            />
          </CardBody>
        </Card>
      )}

      {bigMoments.length > 0 && (
        <Card>
          <CardBody className="space-y-3">
            <h3 className="font-bold">Career moments</h3>
            <div className="space-y-2">
              {bigMoments.map((m, i) => (
                <MomentCard key={`${m.id}-${i}`} moment={m} />
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-3">
          <h3 className="flex items-center gap-2 font-bold">
            <Trophy size={16} className="text-amber" /> Trophy case
          </h3>
          {trophies.length === 0 ? (
            <p className="text-sm text-ink-dim">No hardware — but every legend starts somewhere.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trophies.map((id) => (
                <span
                  key={id}
                  className="rounded-lg border border-court-600 bg-court-800 px-2.5 py-1 text-xs"
                >
                  <span className="font-mono font-bold text-amber">{awards[id]}&times;</span>{' '}
                  {AWARD_LABELS[id as AwardId]}
                </span>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <SeasonTable seasons={summary.seasons} />

          {choiceStats && choiceStats.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-court-700 pt-3">
              <div className="text-xs uppercase tracking-wide text-ink-dim">
                Career-defining calls
              </div>
              {choiceStats.map((s) => (
                <div key={`${s.nodeId}-${s.choiceId}`} className="flex justify-between text-sm">
                  <span>{s.label}</span>
                  <span className="text-ink-dim">
                    {pctText(s.pct)} of players{s.pct === 0 ? ' (you first!)' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <ShareRow shareUrl={shareUrl} saving={saving} saveError={saveError} />

      {onPlayAgain && (
        <Button variant="outline" className="w-full" onClick={onPlayAgain}>
          Start another career
        </Button>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-court-800 pb-1">
      <dt className="text-ink-dim">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
