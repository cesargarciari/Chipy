import type { PendingDecision } from '@chipy/engine';
import { useState } from 'react';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { CareerHud } from './CareerHud.js';

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
}: {
  chemistry: Chemistry;
  onChoose: (choiceId: string) => void;
}) {
  const [highlight, setHighlight] = useState<readonly string[] | undefined>(undefined);
  const { decision, preview } = chemistry;

  return (
    <div className="decision-enter space-y-4">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-400">
          Locker room · Age {preview.age}
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
            onHoverKeys={(k) => setHighlight(k ?? undefined)}
            onClick={() => onChoose(o.id)}
          />
        ))}
      </div>
    </div>
  );
}
