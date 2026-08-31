import type { PendingDecision } from '@chipy/engine';
import { CareerHud } from './CareerHud.js';
import { ScenarioFrame } from './ScenarioFrame.js';

type Finals = NonNullable<PendingDecision['finals']>;

/**
 * The NBA Finals as one possession the player calls. Three real plays; how good
 * the team was decides how many of them actually win it. Pick the right one and
 * you lift the trophy - pick wrong and the shot rims out. The consequence shows
 * on the next screen's "Last season" card.
 */
export function FinalsScreen({
  finals,
  onChoose,
}: {
  finals: Finals;
  onChoose: (choiceId: string) => void;
}) {
  const { game, preview } = finals;

  return (
    <ScenarioFrame
      accent="amber"
      kicker={`${game.kicker} · Age ${preview.age}`}
      title={game.situation}
      prompt={game.prompt}
      footer={<CareerHud preview={preview} />}
    >
      <div className="space-y-3">
        {game.options.map((o, i) => (
          <button
            key={o.id}
            className="option-enter group flex w-full items-start gap-4 rounded-2xl border border-court-700 bg-court-900 p-5 text-left transition-colors hover:border-amber hover:bg-amber/[0.04]"
            onClick={() => onChoose(o.id)}
          >
            <span className="mt-0.5 font-display text-2xl leading-none text-amber/70 group-hover:text-amber">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-sm leading-relaxed text-ink">{o.label}</span>
          </button>
        ))}
      </div>
    </ScenarioFrame>
  );
}
