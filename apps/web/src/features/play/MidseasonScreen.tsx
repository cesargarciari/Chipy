import type { PendingDecision } from '@chipy/engine';
import { useState } from 'react';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { CareerHud } from './CareerHud.js';
import { ScenarioFrame } from './ScenarioFrame.js';

type Midseason = NonNullable<PendingDecision['midseason']>;

/** A bizarre in-season situation - every option is a real fork. */
export function MidseasonScreen({
  midseason,
  onChoose,
}: {
  midseason: Midseason;
  onChoose: (choiceId: string) => void;
}) {
  const [highlight, setHighlight] = useState<readonly string[] | undefined>(undefined);
  const { decision, preview } = midseason;

  return (
    <ScenarioFrame
      accent="emerald"
      kicker={`Mid-season · Age ${preview.age}`}
      title={decision.title}
      prompt={decision.prompt}
      footer={<CareerHud preview={preview} highlight={highlight} />}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {decision.options.map((o) => (
          <ChoiceCard
            key={o.id}
            className="option-enter"
            accent="emerald"
            title={o.label}
            description={o.blurb}
            effects={o.effects}
            tag={o.tag}
            watermark={o.watermark}
            tone={o.id === 'retire' ? 'danger' : 'default'}
            onHoverKeys={(k) => setHighlight(k ?? undefined)}
            onClick={() => onChoose(o.id)}
          />
        ))}
      </div>
    </ScenarioFrame>
  );
}
