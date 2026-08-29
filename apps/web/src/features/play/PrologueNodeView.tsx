import type { PendingDecision } from '@chipy/engine';
import { Card, CardBody } from '../../components/ui/card.js';

export function PrologueNodeView({
  node,
  onChoose,
}: {
  node: NonNullable<PendingDecision['prologue']>;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <Card>
      <CardBody className="space-y-5">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-ink-dim">{node.stage}</div>
          <h2 className="text-2xl font-black">{node.title}</h2>
          <p className="text-ink-dim">{node.prompt}</p>
        </div>
        <div className="space-y-3">
          {node.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => onChoose(choice.id)}
              className="group w-full rounded-xl border border-court-600 p-4 text-left transition-colors hover:border-amber hover:bg-amber/5"
            >
              <span className="block font-bold text-ink group-hover:text-amber">
                {choice.label}
              </span>
              <span className="mt-1 block text-sm text-ink-dim">{choice.blurb}</span>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
