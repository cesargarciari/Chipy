import type { EffectChip, PendingDecision } from '@chipy/engine';
import { useState } from 'react';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { CareerHud } from './CareerHud.js';
import { ScenarioFrame } from './ScenarioFrame.js';

type Chemistry = NonNullable<PendingDecision['chemistry']>;

/**
 * A locker-room question. It rolls on its own, so it can land in the same
 * season as a fame / mid-season one. The sociable pick lifts chemistry but
 * costs a couple of overall points; the professional pick keeps you sharp and
 * a little distant.
 */
export function ChemistryScreen({
  chemistry,
  onChoose,
  recentDeltas,
  echoSeq,
}: {
  chemistry: Chemistry;
  onChoose: (choiceId: string) => void;
  recentDeltas?: readonly EffectChip[];
  echoSeq?: number;
}) {
  const [highlight, setHighlight] = useState<readonly string[] | undefined>(undefined);
  const { decision, preview } = chemistry;

  return (
    <ScenarioFrame
      accent="sky"
      kicker={`Locker room · Age ${preview.age}`}
      title={decision.title}
      prompt={decision.prompt}
      footer={
        <CareerHud
          preview={preview}
          highlight={highlight}
          recentDeltas={recentDeltas}
          echoSeq={echoSeq}
        />
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {decision.options.map((o) => (
          <ChoiceCard
            key={o.id}
            className="option-enter"
            accent="sky"
            title={o.label}
            description={o.blurb}
            effects={o.effects}
            tag={o.tag}
            watermark={o.watermark}
            onHoverKeys={(k) => setHighlight(k ?? undefined)}
            onClick={() => onChoose(o.id)}
          />
        ))}
      </div>
    </ScenarioFrame>
  );
}
