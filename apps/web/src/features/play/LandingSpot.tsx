import type { PendingDecision } from '@chipy/engine';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { draftLabel } from '../../lib/format.js';

export function LandingSpot({
  landing,
  onChoose,
}: {
  landing: NonNullable<PendingDecision['landing']>;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <div className="decision-enter space-y-4">
      <div className="text-center">
        <div className="text-xs uppercase tracking-wide text-ink-dim">Draft Night</div>
        <h2 className="mt-1 text-2xl">{draftLabel(landing.draft)}</h2>
        <p className="mt-1 text-sm text-ink-dim">
          Three teams want you. Where do you start your career?
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {landing.offers.map((o) => (
          <ChoiceCard
            key={o.id}
            title={o.label}
            description={o.blurb}
            tag={o.tag}
            watermark={o.watermark}
            teamId={o.teamId}
            onClick={() => onChoose(o.id)}
          />
        ))}
      </div>
    </div>
  );
}
