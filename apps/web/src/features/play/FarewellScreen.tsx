import type { PendingDecision } from '@chipy/engine';
import { ChoiceCard } from '../../components/ChoiceCard.js';

type Farewell = NonNullable<PendingDecision['farewell']>;

/**
 * Shown once age (not injury) has decided this is the end. "Farewell tour"
 * buys one more ceremonial season; "quiet goodbye" ends the career now.
 */
export function FarewellScreen({
  farewell,
  onChoose,
}: {
  farewell: Farewell;
  onChoose: (choiceId: string) => void;
}) {
  const { options, preview } = farewell;

  return (
    <div className="decision-enter space-y-4">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-court-700 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-dim">
          The end of the road · Age {preview.age}
        </div>
        <h2 className="mt-2 text-2xl">One last decision</h2>
        <p className="max-w-prose text-sm text-ink-dim">
          The legs are gone and the offers have dried up. How do you want to leave the game?
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => (
          <ChoiceCard
            key={o.id}
            title={o.label}
            description={o.blurb}
            effects={o.effects}
            tag={o.tag}
            watermark={o.watermark}
            tone={o.id === 'quiet_goodbye' ? 'danger' : 'default'}
            onClick={() => onChoose(o.id)}
          />
        ))}
      </div>
    </div>
  );
}
