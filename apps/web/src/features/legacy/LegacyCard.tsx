import type { AwardId } from '@chipy/engine';
import type { CareerSummaryDto, ChoiceStat } from '@chipy/shared';
import { Award, Trophy } from 'lucide-react';
import { RatingRadar } from '../../components/RatingRadar.js';
import { Button } from '../../components/ui/button.js';
import { Card, CardBody } from '../../components/ui/card.js';
import {
  AWARD_LABELS,
  GRADE_TONE,
  LEGACY_TIER_LABELS,
  TROPHY_ORDER,
  archetypeLabel,
  draftLabel,
  pctText,
  teamName,
} from '../../lib/format.js';
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

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">{profile.name}</h2>
              <p className="text-sm text-ink-dim">
                {profile.position} · {archetypeLabel(profile.archetype)}
              </p>
              <p className="mt-1 text-sm font-semibold text-amber">
                {LEGACY_TIER_LABELS[legacy.tier]}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-black leading-none ${GRADE_TONE[legacy.grade]}`}>
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
                #— retired by {legacy.jerseyRetiredBy}
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
            </dl>
          </div>
        </CardBody>
      </Card>

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
