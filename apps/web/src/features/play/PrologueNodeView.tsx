import type { PendingDecision } from '@chipy/engine';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { ChoiceGrid, DEAL_START, Stage } from './Stage.js';

export function PrologueNodeView({
  node,
  onChoose,
}: {
  node: NonNullable<PendingDecision['prologue']>;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <Stage title={node.title} prompt={node.prompt}>
      <ChoiceGrid>
        {node.options.map((o, i) => (
          <ChoiceCard
            key={o.id}
            index={DEAL_START + i}
            title={o.label}
            description={o.blurb}
            effects={o.effects}
            tag={o.tag}
            watermark={o.watermark}
            onClick={() => onChoose(o.id)}
          />
        ))}
      </ChoiceGrid>
    </Stage>
  );
}
