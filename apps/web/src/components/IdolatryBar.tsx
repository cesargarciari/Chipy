import type { FranchiseTier } from '@chipy/engine';
import { FRANCHISE_TIER_LABELS } from '../lib/format.js';

/**
 * The "idolatry" progress bar - how beloved you are by a club or the national
 * team. `progress` is 0..100 toward the top tier; `tier` names where you sit.
 */
export function IdolatryBar({
  label,
  tier,
  progress,
  detail,
}: {
  label: string;
  tier: FranchiseTier;
  progress: number;
  detail?: string;
}) {
  const gold = tier === 'idol' || tier === 'legend';
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-bold text-ink">{label}</span>
        <span className="flex items-baseline gap-1.5 text-sm">
          <span className={gold ? 'font-bold text-amber' : 'font-semibold text-ink-dim'}>
            {FRANCHISE_TIER_LABELS[tier]}
          </span>
          <span className="font-mono text-xs text-ink-dim">{Math.round(progress)}/100</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-court-800">
        <div
          className={
            gold
              ? 'h-full rounded-full bg-gradient-to-r from-amber/60 to-amber'
              : 'h-full rounded-full bg-gradient-to-r from-court-600 to-sky-500/80'
          }
          style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
        />
      </div>
      {detail && <p className="text-xs text-ink-dim">{detail}</p>}
    </div>
  );
}
