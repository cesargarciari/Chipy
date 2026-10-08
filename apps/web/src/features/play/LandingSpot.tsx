import type { PendingDecision } from '@chipy/engine';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { draftLabel } from '../../lib/format.js';
import { ChoiceGrid, DEAL_START, Stage } from './Stage.js';

export function LandingSpot({
  landing,
  onChoose,
}: {
  landing: NonNullable<PendingDecision['landing']>;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <Stage
      title={`${draftLabel(landing.draft)}.`}
      prompt="Three teams want you. Where do you start your career?"
    >
      <ChoiceGrid>
        {landing.offers.map((o, i) => (
          <ChoiceCard
            key={o.id}
            index={DEAL_START + i}
            title={o.label}
            description={o.blurb}
            tag={o.tag}
            watermark={o.watermark}
            teamId={o.teamId}
            onClick={() => onChoose(o.id)}
          />
        ))}
      </ChoiceGrid>
    </Stage>
  );
}
