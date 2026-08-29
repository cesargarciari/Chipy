import type { PendingDecision, TeamWindow } from '@chipy/engine';
import { ROLE_LABELS, draftLabel } from '../../lib/format.js';

const WINDOW_LABELS: Record<TeamWindow, string> = {
  contender: 'Contender',
  playoff: 'Playoff team',
  mid: 'In the middle',
  rebuild: 'Rebuilding',
};
const WINDOW_TONE: Record<TeamWindow, string> = {
  contender: 'text-amber',
  playoff: 'text-emerald-400',
  mid: 'text-sky-400',
  rebuild: 'text-ink-dim',
};

export function LandingSpot({
  landing,
  onChoose,
}: {
  landing: NonNullable<PendingDecision['landing']>;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-xs uppercase tracking-wide text-ink-dim">Draft Night</div>
        <h2 className="mt-1 text-2xl font-black">{draftLabel(landing.draft)}</h2>
        <p className="mt-1 text-sm text-ink-dim">
          Three teams want you. Where do you start your career?
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {landing.offers.map((offer) => (
          <button
            key={offer.choiceId}
            onClick={() => onChoose(offer.choiceId)}
            className="flex flex-col rounded-xl border border-court-600 p-4 text-left transition-colors hover:border-amber hover:bg-amber/5"
          >
            <span className="text-lg font-black text-ink">
              {offer.team.city} {offer.team.name}
            </span>
            <span className="mt-1 text-xs text-ink-dim">
              {offer.team.market} market · {offer.team.conference}
            </span>
            <span className={`mt-2 text-sm font-semibold ${WINDOW_TONE[offer.window]}`}>
              {WINDOW_LABELS[offer.window]}
            </span>
            <span className="mt-auto pt-3 text-xs text-ink-dim">
              Projected: {ROLE_LABELS[offer.projectedRole]} · {offer.projectedMpg} MPG ·{' '}
              {offer.years}yr
            </span>
            <span className="mt-2 text-xs text-ink">{offer.pitch}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
