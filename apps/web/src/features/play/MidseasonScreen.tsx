import type { PendingDecision } from '@chipy/engine';
import { useState } from 'react';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { CareerHud } from './CareerHud.js';

type Midseason = NonNullable<PendingDecision['midseason']>;

/** A bizarre in-season situation — every option is a real fork. */
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
    <div className="space-y-4">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber">
          Mid-season · Age {preview.age}
        </div>
        <h2 className="mt-2 text-2xl">{decision.title}</h2>
        <p className="text-sm text-ink-dim">{decision.prompt}</p>
      </div>

      <CareerHud preview={preview} highlight={highlight} />

      <div className="grid gap-3 sm:grid-cols-2">
        {decision.options.map((o) => (
          <ChoiceCard
            key={o.id}
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
    </div>
  );
}
