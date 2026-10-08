import type { PendingDecision } from '@chipy/engine';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { ChoiceGrid, DEAL_START, Stage } from './Stage.js';

type Midseason = NonNullable<PendingDecision['midseason']>;

/** An unexpected mid-season situation. */
export function MidseasonScreen({
  midseason,
  onChoose,
  onHoverKeys,
}: {
  midseason: Midseason;
  onChoose: (choiceId: string) => void;
  onHoverKeys: (keys: readonly string[] | null) => void;
}) {
  const { decision } = midseason;

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
            tone={o.id === 'retire' ? 'danger' : 'default'}
            onHoverKeys={onHoverKeys}
            onClick={() => onChoose(o.id)}
          />
        ))}
      </ChoiceGrid>
    </Stage>
  );
}
