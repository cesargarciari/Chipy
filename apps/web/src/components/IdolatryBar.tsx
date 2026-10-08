import type { FranchiseTier } from '@chipy/engine';
import { cn } from '../lib/cn.js';
import { FRANCHISE_TIER_LABELS } from '../lib/format.js';

/** How much a team or a country loves you. Idol and legend turn to trophy gold. */
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
  const fill = Math.max(0.02, Math.min(1, progress / 100));
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm text-ink">{label}</span>
        <span className="flex shrink-0 items-baseline gap-2">
          <span className={cn('text-sm', gold ? 'text-gold' : 'text-ink/65')}>
            {FRANCHISE_TIER_LABELS[tier]}
          </span>
          <span className="t-num text-xs text-ink/60">{Math.round(progress)}/100</span>
        </span>
      </div>
      <div className="h-0.75 overflow-hidden rounded-full bg-ink/8">
        <div
          className={cn(
            'h-full origin-left rounded-full transition-[scale] duration-700 ease-out',
            gold ? 'bg-gold' : 'bg-ink/55',
          )}
          style={{ scale: `${fill} 1` }}
        />
      </div>
      {detail && <p className="text-xs text-ink/60">{detail}</p>}
    </div>
  );
}
