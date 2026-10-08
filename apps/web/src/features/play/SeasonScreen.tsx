import type { PendingDecision, PlayerProfile } from '@chipy/engine';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { MomentModal, isHeadlineMoment } from '../../components/MomentModal.js';
import { cn } from '../../lib/cn.js';
import { GRADE_TONE, TEAM_RESULT_LABELS, teamName } from '../../lib/format.js';
import { AwardChips } from './AwardChips.js';
import { ChoiceGrid, DEAL_START, Stage } from './Stage.js';
import { StatLine } from './StatLine.js';

type Season = NonNullable<PendingDecision['season']>;
type LastSeason = NonNullable<Season['preview']['lastSeason']>;

/** The offseason call. It opens on how last season went, then asks the question. */
export function SeasonScreen({
  season,
  profile,
  onChoose,
  onHoverKeys,
}: {
  season: Season;
  profile: PlayerProfile;
  onChoose: (choiceId: string) => void;
  onHoverKeys: (keys: readonly string[] | null) => void;
}) {
  const { preview, decision } = season;
  const last = preview.lastSeason;
  const headlineMoments = preview.moments.filter(isHeadlineMoment);
  const where =
    preview.league === 'overseas'
      ? (preview.club?.name ?? 'overseas')
      : preview.team
        ? teamName(preview.team.id)
        : '-';

  return (
    <>
      <MomentModal key={preview.seasonNumber} moments={headlineMoments} />
      <Stage
        title={decision.title}
        prompt={decision.prompt}
        preface={
          last ? (
            <LastSeasonRecap last={last} />
          ) : (
            <div className="border-b border-ink/8 pb-9">
              <h3 className="t-voice text-[1.75rem] leading-tight text-ink">
                Welcome to the league.
              </h3>
              <p className="mt-3 text-ink/65">
                You&apos;re a {profile.position} with the {where}. Time to make your name.
              </p>
            </div>
          )
        }
      >
        <ChoiceGrid>
          {decision.options.map((o, i) => (
            <ChoiceCard
              key={o.id}
              index={DEAL_START + i}
              title={o.label}
              description={o.blurb}
              effects={o.effects}
              rare={o.rare}
              tag={o.tag}
              watermark={o.watermark}
              teamId={o.teamId}
              tone={o.id === 'retire' || o.id === 'demand_trade' ? 'danger' : 'default'}
              onHoverKeys={onHoverKeys}
              onClick={() => onChoose(o.id)}
            />
          ))}
        </ChoiceGrid>
      </Stage>
    </>
  );
}

function LastSeasonRecap({ last }: { last: LastSeason }) {
  return (
    <div className="border-b border-ink/8 pb-9">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h3 className="text-sm text-ink/60">Last season, {teamName(last.teamId)}</h3>
          <p className="mt-2 flex flex-wrap gap-x-3 text-sm text-ink/60">
            {last.seed >= 1 && <span className="t-num">#{last.seed} seed</span>}
            <span className="text-ink">{TEAM_RESULT_LABELS[last.teamResult]}</span>
          </p>
        </div>
        <span
          className={cn('t-num shrink-0 text-[3.25rem] leading-[0.8]', GRADE_TONE[last.grade])}
          aria-label={`Grade ${last.grade}`}
        >
          {last.grade}
        </span>
      </div>

      {last.finalsHeadline && <p className="mt-5 text-accent-ink">{last.finalsHeadline}</p>}
      <p className="t-voice mt-4 max-w-[46ch] text-[1.3125rem] leading-snug text-ink">
        {last.recap}
      </p>
      {(last.midseasonHeadline ?? last.eventHeadline) && (
        <p className="mt-3 text-sm text-ink/60">{last.midseasonHeadline ?? last.eventHeadline}</p>
      )}

      <div className="mt-7">
        <StatLine stats={last.stats} />
      </div>
      {last.awards.length > 0 && (
        <div className="mt-6">
          <AwardChips awards={last.awards} />
        </div>
      )}
    </div>
  );
}
