import type { PendingDecision } from '@chipy/engine';
import { DecisionSurface } from '../../components/DecisionSurface.js';
import { DEAL_START, Stage } from './Stage.js';

type Finals = NonNullable<PendingDecision['finals']>;

/** The NBA Finals come down to one possession, drawn over the half court. */
export function FinalsScreen({
  finals,
  onChoose,
}: {
  finals: Finals;
  onChoose: (choiceId: string) => void;
}) {
  const { game } = finals;

  return (
    <Stage title={game.situation} prompt={game.prompt} court>
      <div className="space-y-3">
        {game.options.map((o, i) => (
          <DecisionSurface
            key={o.id}
            index={DEAL_START + i}
            className="w-full"
            faceClassName="flex-row items-start gap-6 p-6 sm:p-7"
            onClick={() => onChoose(o.id)}
          >
            <span className="t-num text-[2.25rem] leading-[0.8] text-accent-ink">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="t-lead text-ink">{o.label}</span>
          </DecisionSurface>
        ))}
      </div>
    </Stage>
  );
}
