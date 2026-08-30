import type { PendingDecision } from '@chipy/engine';
import { SCHOOL_TIER_LABELS } from '../../lib/format.js';

function prestigeDots(p: number) {
  const filled = Math.round(p * 5);
  return '●'.repeat(filled) + '○'.repeat(5 - filled);
}

export function CollegePick({
  pick,
  onChoose,
}: {
  pick: NonNullable<PendingDecision['collegePick']>;
  onChoose: (schoolId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-xs uppercase tracking-wide text-ink-dim">
          {SCHOOL_TIER_LABELS[pick.tier]}
        </div>
        <h2 className="mt-1 text-2xl">WHERE DO YOU COMMIT?</h2>
        <p className="mt-1 text-sm text-ink-dim">
          Your program shapes your freshman year — and how NBA scouts see you.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {pick.schools.map((s) => (
          <button
            key={s.id}
            onClick={() => onChoose(s.id)}
            className="flex flex-col rounded-2xl border border-court-700 bg-court-900 p-4 text-left transition-colors hover:border-amber hover:bg-amber/[0.04]"
          >
            <span className="font-display text-2xl leading-none tracking-wide text-ink">
              {s.name}
            </span>
            <span className="mt-2 font-mono text-xs text-amber">{prestigeDots(s.prestige)}</span>
            <span className="mt-2 text-xs text-ink-dim">
              {s.nbaPedigree >= 0.85
                ? 'Elite NBA pipeline'
                : s.nbaPedigree >= 0.6
                  ? 'Sends players to the league'
                  : 'You develop on your own timeline'}
            </span>
            <span className="mt-1 text-xs text-ink-dim">
              {s.style.usage >= 0.78
                ? 'You are the whole offense'
                : s.style.usage >= 0.62
                  ? 'A featured role'
                  : 'You share the ball'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
