import type { PendingDecision } from '@chipy/engine';
import { ChoiceCard } from '../../components/ChoiceCard.js';

export function PrologueNodeView({
  node,
  onChoose,
}: {
  node: NonNullable<PendingDecision['prologue']>;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <div className="decision-enter space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-ink-dim">{node.stage}</div>
        <h2 className="mt-1 text-3xl">{node.title}</h2>
        <p className="mt-1 max-w-prose text-ink-dim">{node.prompt}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {node.options.map((o) => (
          <ChoiceCard
            key={o.id}
            title={o.label}
            description={o.blurb}
            effects={o.effects}
            tag={o.tag}
            watermark={o.watermark}
            onClick={() => onChoose(o.id)}
          />
        ))}
      </div>
    </div>
  );
}
