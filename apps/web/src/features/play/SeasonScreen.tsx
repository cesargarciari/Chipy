import type { PendingDecision, PlayerProfile } from '@chipy/engine';
import { useState } from 'react';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { MomentModal, isHeadlineMoment } from '../../components/MomentModal.js';
import { Card, CardBody } from '../../components/ui/card.js';
import { clubCrest, teamLogo } from '../../lib/art.js';
import { GRADE_TONE, TEAM_RESULT_LABELS, teamName } from '../../lib/format.js';
import { AwardChips } from './AwardChips.js';
import { CareerHud } from './CareerHud.js';
import { PerksDrawer } from './PerksDrawer.js';
import { ScenarioFrame } from './ScenarioFrame.js';
import { StatLine } from './StatLine.js';

type Season = NonNullable<PendingDecision['season']>;

export function SeasonScreen({
  season,
  profile,
  onChoose,
  onBuyPerk,
}: {
  season: Season;
  profile: PlayerProfile;
  onChoose: (choiceId: string) => void;
  onBuyPerk: (choiceId: string) => void;
}) {
  const [highlight, setHighlight] = useState<readonly string[] | undefined>(undefined);
  const { preview, decision, shop } = season;
  const last = preview.lastSeason;
  const headlineMoments = preview.moments.filter(isHeadlineMoment);
  const where =
    preview.league === 'overseas'
      ? (preview.club?.name ?? 'overseas')
      : preview.team
        ? teamName(preview.team.id)
        : '-';
  const crest =
    preview.league === 'overseas' ? clubCrest(preview.club?.id) : teamLogo(preview.team?.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="font-semibold">
          Season {preview.seasonNumber} · Age {preview.age}
        </div>
        <div className="flex items-center gap-2 text-ink-dim">
          <span className="inline-flex items-center gap-1.5">
            {crest && <img src={crest} alt="" className="h-5 w-5 object-contain" />}
            {where}
            {preview.contractYear && <span className="ml-1 text-amber">· contract year</span>}
          </span>
          <PerksDrawer
            shop={shop}
            onBuy={onBuyPerk}
            onHoverKeys={(k) => setHighlight(k ?? undefined)}
          />
        </div>
      </div>

      <MomentModal key={preview.seasonNumber} moments={headlineMoments} />

      <CareerHud preview={preview} highlight={highlight} />

      {last ? (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold">Last season - {teamName(last.teamId)}</h3>
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-ink-dim">
                {last.seed >= 1 && <span>#{last.seed} seed</span>}
                <span>{TEAM_RESULT_LABELS[last.teamResult]}</span>
                <span className={`font-display text-base leading-none ${GRADE_TONE[last.grade]}`}>
                  {last.grade}
                </span>
              </span>
            </div>
            {last.finalsHeadline && (
              <p className="text-sm font-semibold text-amber">{last.finalsHeadline}</p>
            )}
            <p className="text-sm text-ink">{last.recap}</p>
            {(last.midseasonHeadline ?? last.eventHeadline) && (
              <p className="text-sm text-ink-dim">{last.midseasonHeadline ?? last.eventHeadline}</p>
            )}
            <StatLine stats={last.stats} />
            <AwardChips awards={last.awards} />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="space-y-2">
            <h3 className="font-bold">Welcome to the league</h3>
            <p className="text-sm text-ink-dim">
              You&apos;re a {profile.position} with the {where}. Time to make your name.
            </p>
          </CardBody>
        </Card>
      )}

      <ScenarioFrame
        key={decision.nodeId}
        accent="amber"
        kicker={decision.theme}
        title={decision.title}
        prompt={decision.prompt}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {decision.options.map((o) => (
            <ChoiceCard
              key={o.id}
              className="option-enter"
              accent="amber"
              title={o.label}
              description={o.blurb}
              effects={o.effects}
              rare={o.rare}
              tag={o.tag}
              watermark={o.watermark}
              teamId={o.teamId}
              tone={o.id === 'retire' || o.id === 'demand_trade' ? 'danger' : 'default'}
              onHoverKeys={(k) => setHighlight(k ?? undefined)}
              onClick={() => onChoose(o.id)}
            />
          ))}
        </div>
      </ScenarioFrame>
    </div>
  );
}
