import type { PendingDecision } from '@chipy/engine';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { ChoiceGrid, DEAL_START, Stage } from './Stage.js';

type Farewell = NonNullable<PendingDecision['farewell']>;

/** Shown when age ends the career. Pick one last season or retire now. */
export function FarewellScreen({
  farewell,
  onChoose,
}: {
  farewell: Farewell;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <Stage
      title="One last decision."
      prompt="The legs are gone and the offers have dried up. How do you want to leave the game?"
    >
      <ChoiceGrid>
        {farewell.options.map((o, i) => (
          <ChoiceCard
            key={o.id}
            index={DEAL_START + i}
            title={o.label}
            description={o.blurb}
            effects={o.effects}
            tag={o.tag}
            watermark={o.watermark}
            tone={o.id === 'quiet_goodbye' ? 'danger' : 'default'}
            onClick={() => onChoose(o.id)}
          />
        ))}
      </ChoiceGrid>
    </Stage>
  );
}
