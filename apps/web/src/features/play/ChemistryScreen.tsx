import type { PendingDecision } from '@chipy/engine';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { ChoiceGrid, DEAL_START, Stage } from './Stage.js';

type Chemistry = NonNullable<PendingDecision['chemistry']>;

/** A locker-room question that can show up in the same season as other events. */
export function ChemistryScreen({
  chemistry,
  onChoose,
  onHoverKeys,
}: {
  chemistry: Chemistry;
  onChoose: (choiceId: string) => void;
  onHoverKeys: (keys: readonly string[] | null) => void;
}) {
  const { decision } = chemistry;

  return (
    <Stage title={decision.title} prompt={decision.prompt}>
      <ChoiceGrid>
        {decision.options.map((o, i) => (
          <ChoiceCard
            key={o.id}
            index={DEAL_START + i}
            title={o.label}
            description={o.blurb}
            effects={o.effects}
            tag={o.tag}
            watermark={o.watermark}
            onHoverKeys={onHoverKeys}
            onClick={() => onChoose(o.id)}
          />
        ))}
      </ChoiceGrid>
    </Stage>
  );
}
