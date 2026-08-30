import type { PendingDecision, PlayerProfile } from '@chipy/engine';
import { useState } from 'react';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { MomentModal, isHeadlineMoment } from '../../components/MomentModal.js';
import { Card, CardBody } from '../../components/ui/card.js';
import { clubCrest, teamLogo } from '../../lib/art.js';
import { TEAM_RESULT_LABELS, teamName } from '../../lib/format.js';
import { AwardChips } from './AwardChips.js';
import { CareerHud } from './CareerHud.js';
import { MomentsBanner } from './MomentsBanner.js';
import { PerksDrawer } from './PerksDrawer.js';
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
  const bannerMoments = preview.moments.filter((m) => !isHeadlineMoment(m));
  const where =
    preview.league === 'overseas'
      ? (preview.club?.name ?? 'overseas')
      : preview.team
        ? teamName(preview.team.id)
        : '-';
  const crest =
    preview.league === 'overseas' ? clubCrest(preview.club?.id) : teamLogo(preview.team?.id);

  return (
    <div className="decision-enter space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="font-semibold">
          Season {preview.seasonNumber} · Age {preview.age}
        </div>
        <div className="flex items-center gap-1.5 text-ink-dim">
          {crest && <img src={crest} alt="" className="h-5 w-5 object-contain" />}
          {where}
          {preview.contractYear && <span className="ml-1 text-amber">· contract year</span>}
        </div>
      </div>

      <MomentModal key={preview.seasonNumber} moments={headlineMoments} />

      <MomentsBanner moments={bannerMoments} />

      <CareerHud preview={preview} highlight={highlight} />

      <PerksDrawer
        shop={shop}
        onBuy={onBuyPerk}
        onHoverKeys={(k) => setHighlight(k ?? undefined)}
      />

      {last ? (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Last season - {teamName(last.teamId)}</h3>
              <span className="text-xs uppercase tracking-wide text-ink-dim">
                {TEAM_RESULT_LABELS[last.teamResult]}
              </span>
            </div>
            <p className="text-sm text-ink-dim">{last.midseasonHeadline ?? last.eventHeadline}</p>
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

      <div key={decision.nodeId} className="decision-enter space-y-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-ink-dim">{decision.theme}</div>
          <h3 className="text-2xl">{decision.title}</h3>
          <p className="text-sm text-ink-dim">{decision.prompt}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {decision.options.map((o) => (
            <ChoiceCard
              key={o.id}
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
      </div>
    </div>
  );
}
