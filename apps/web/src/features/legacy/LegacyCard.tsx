import type { CareerSummaryDto, ChoiceStat } from '@chipy/shared';
import { Award, Footprints, Shirt } from 'lucide-react';
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { CourtLines } from '../../components/CourtLines.js';
import { RatingRadar } from '../../components/RatingRadar.js';
import { Button } from '../../components/ui/button.js';
import { Card } from '../../components/ui/card.js';
import { cn } from '../../lib/cn.js';
import {
  EURO_RESULT_LABELS,
  GRADE_TONE,
  LEGACY_TIER_LABELS,
  archetypeLabel,
  countryLabel,
  draftLabel,
  moneyM,
  perkLabel,
  teamName,
} from '../../lib/format.js';
import { FranchiseStandings } from './FranchiseStandings.js';
import { SeasonTable } from './SeasonTable.js';
import { ShareImageButton } from './ShareImageButton.js';
import { ShareRow } from './ShareRow.js';
import { TrophyShelf } from './TrophyShelf.js';

interface LegacyCardProps {
  summary: CareerSummaryDto;
  /** No longer used, kept so callers don't break. */
  choiceStats?: ChoiceStat[];
  shareUrl?: string;
  saving?: boolean;
  saveError?: string | null;
  onPlayAgain?: () => void;
}

const step = (i: number) => ({ '--i': i }) as CSSProperties;

/** The end of the road: the card you keep, then the record behind it. */
export function LegacyCard({ summary, shareUrl, saving, saveError, onPlayAgain }: LegacyCardProps) {
  const { profile, legacy, careerTotals: ct, awards } = summary;
  const shareCardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      <div ref={shareCardRef} className="enter rounded-sheet" style={step(0)}>
        <Card className="relative isolate overflow-hidden rounded-sheet">
          <CourtLines
            variant="half"
            className="absolute -right-24 -top-16 -z-10 w-[36rem] [mask-image:radial-gradient(circle_at_70%_20%,black,transparent_70%)]"
          />
          <div className="space-y-10 p-6 sm:p-10">
            <header className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <h2 className="t-jersey text-[clamp(2.5rem,1.6rem+3.6vw,4.75rem)] text-ink">
                  <span className="text-ink/35">#{profile.jerseyNumber}</span> {profile.name}
                </h2>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[0.9375rem] text-ink/60">
                  <span>{profile.position}</span>
                  <span>{archetypeLabel(profile.archetype)}</span>
                  <span>{profile.handedness === 'left' ? 'Lefty' : 'Righty'}</span>
                  <span>{countryLabel(profile.country)}</span>
                </div>
                <p className="mt-3 text-[1.0625rem] text-accent-ink">
                  {LEGACY_TIER_LABELS[legacy.tier]}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div
                  className={cn(
                    't-num text-[clamp(4.5rem,3rem+5vw,7rem)] leading-[0.8]',
                    GRADE_TONE[legacy.grade],
                  )}
                >
                  {legacy.grade}
                </div>
                <div className="t-num mt-3 text-sm text-ink/60">{legacy.score} legacy</div>
              </div>
            </header>

            <p className="t-voice max-w-[38ch] text-[clamp(1.375rem,1.15rem+0.9vw,1.875rem)] leading-snug text-ink">
              {legacy.verdict}
            </p>

            {(legacy.hallOfFame || (legacy.jerseyRetired && legacy.jerseyRetiredBy)) && (
              <div className="flex flex-wrap gap-2">
                {legacy.hallOfFame && (
                  <Chip tone="gold">
                    <Award size={13} strokeWidth={2} aria-hidden /> Hall of Fame
                  </Chip>
                )}
                {legacy.jerseyRetired && legacy.jerseyRetiredBy && (
                  <Chip>
                    <Shirt size={13} strokeWidth={2} aria-hidden />#{profile.jerseyNumber} retired
                    by {teamName(legacy.jerseyRetiredBy)}
                  </Chip>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-10 sm:grid-cols-[auto_1fr] sm:items-center">
              <RatingRadar ratings={summary.finalRatings} />
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
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
                // Group consecutive years at the same school into stints.
                const stints: { school: string; from: number; to: number }[] = [];
                summary.college.years.forEach((y, idx) => {
                  const last = stints.at(-1);
                  if (last && last.school === y.school) last.to = idx + 1;
                  else stints.push({ school: y.school, from: idx + 1, to: idx + 1 });
                });
                const y0 = summary.college.years[0];
                return (
                  <div className="border-t border-ink/8 pt-6">
                    <span className="t-label">{intl ? 'International' : 'College'}</span>
                    <ul className="mt-3 space-y-1">
                      {stints.map((st, i) => (
                        <li key={i}>
                          <span className="text-ink">{st.school}</span>
                          <span className="text-ink/60">
                            {' '}
                            {st.from === st.to
                              ? intl
                                ? `season ${st.from}`
                                : `year ${st.from}`
                              : `${intl ? 'seasons' : 'years'} ${st.from}-${st.to}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm text-ink/60">
                      {summary.college.years.at(-1)?.result}
                      {y0 &&
                        `. ${intl ? 'First season' : 'Freshman year'} ${y0.stats.ppg}/${y0.stats.rpg}/${y0.stats.apg}`}
                    </p>
                  </div>
                );
              })()}

            {(summary.shoeDeal || summary.perks.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {summary.shoeDeal && (
                  <Chip tone="accent">
                    <Footprints size={13} strokeWidth={2} aria-hidden /> Signature line with{' '}
                    {summary.shoeDeal}
                  </Chip>
                )}
                {summary.perks.map((id) => (
                  <Chip key={id}>{perkLabel(id)}</Chip>
                ))}
              </div>
            )}

            <div className="border-t border-ink/8 pt-6">
              <h3 className="mb-4 text-ink">Trophy case</h3>
              <TrophyShelf awards={awards} />
            </div>
          </div>
        </Card>
      </div>

      <div className="enter flex justify-end" style={step(1)}>
        <ShareImageButton targetRef={shareCardRef} />
      </div>

      {summary.overseasSeasons.length > 0 && (
        <Section
          title={`Overseas, ${summary.overseasSeasons.length} ${summary.overseasSeasons.length === 1 ? 'season' : 'seasons'}`}
        >
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10">
                  <Th>Age</Th>
                  <Th>Club</Th>
                  <Th right>PPG</Th>
                  <Th right>Salary</Th>
                  <Th>Finish</Th>
                  <Th center>Grade</Th>
                </tr>
              </thead>
              <tbody>
                {summary.overseasSeasons.map((o) => (
                  <tr key={o.index} className="border-b border-ink/6 last:border-0">
                    <td className="t-num py-2.5 pr-3">{o.age}</td>
                    <td className="pr-3 text-ink">
                      {o.club}
                      <span className="text-ink/60"> {o.country}</span>
                    </td>
                    <td className="t-num pr-3 text-right">{o.stats.ppg}</td>
                    <td className="t-num pr-3 text-right text-ink/60">{moneyM(o.salary)}</td>
                    <td
                      className={cn(
                        'pr-3',
                        o.result === 'euroleague_champion' ? 'text-gold' : 'text-ink/60',
                      )}
                    >
                      {EURO_RESULT_LABELS[o.result]}
                    </td>
                    <td className={cn('t-num text-center text-base', GRADE_TONE[o.grade])}>
                      {o.grade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {summary.injuryHistory.length > 0 &&
        (() => {
          const totalGames = summary.injuryHistory.reduce((n, i) => n + i.gamesMissed, 0);
          const notable = summary.injuryHistory.filter(
            (i) => i.severity === 'moderate' || i.severity === 'severe',
          );
          return (
            <Section
              title="Injury record"
              aside={`${summary.injuryHistory.length} ${
                summary.injuryHistory.length === 1 ? 'injury' : 'injuries'
              }, ${totalGames} games missed`}
            >
              {notable.length > 0 ? (
                <ul className="divide-y divide-ink/6">
                  {notable.map((i, idx) => (
                    <li key={idx} className="flex items-baseline justify-between gap-4 py-2.5">
                      <span className={i.severity === 'severe' ? 'text-down' : 'text-ink'}>
                        {i.type}
                      </span>
                      <span className="t-num shrink-0 text-sm text-ink/60">
                        season {i.seasonIndex}, {i.gamesMissed} games
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ink/60">
                  Nothing worse than knocks and strains. A durable career.
                </p>
              )}
            </Section>
          );
        })()}

      {(summary.franchises.some((f) => f.tier !== 'none') ||
        summary.nationalTeam.tier !== 'none') && (
        <Card className="enter p-6 sm:p-8" style={step(4)}>
          <FranchiseStandings franchises={summary.franchises} nationalTeam={summary.nationalTeam} />
        </Card>
      )}

      <Card className="enter p-6 sm:p-8" style={step(5)}>
        <SeasonTable seasons={summary.seasons} />
      </Card>

      <div className="space-y-4 pt-4">
        <ShareRow shareUrl={shareUrl} saving={saving} saveError={saveError} />
        {onPlayAgain && (
          <Button variant="secondary" size="lg" className="w-full" onClick={onPlayAgain}>
            Start another career
          </Button>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: string;
  children: ReactNode;
}) {
  return (
    <Card className="enter p-6 sm:p-8" style={step(3)}>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[1.0625rem] text-ink">{title}</h3>
        {aside && <span className="text-sm text-ink/60">{aside}</span>}
      </div>
      {children}
    </Card>
  );
}

function Th({
  children,
  right,
  center,
}: {
  children: ReactNode;
  right?: boolean;
  center?: boolean;
}) {
  return (
    <th
      className={cn(
        't-label py-2.5 pr-3 font-medium',
        right && 'text-right',
        center && 'pr-0 text-center',
      )}
    >
      {children}
    </th>
  );
}

function Chip({ tone, children }: { tone?: 'gold' | 'accent'; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm',
        tone === 'gold'
          ? 'bg-gold/14 text-gold'
          : tone === 'accent'
            ? 'bg-accent/12 text-accent-ink'
            : 'bg-ink/6 text-ink/70',
      )}
    >
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-ink/8 pb-3">
      <dt className="t-label">{label}</dt>
      <dd className="mt-1.5 text-ink">{value}</dd>
    </div>
  );
}
