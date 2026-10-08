import type { EffectChip } from '@chipy/engine';
import { cn } from '../lib/cn.js';
import { moneyM } from '../lib/format.js';
import { mergeDefenseChips } from '../lib/ratings.js';

function tone(e: EffectChip, rare: boolean): string {
  if (rare) return 'text-gold';
  if (e.delta > 0) return 'text-up';
  if (e.delta < 0) return 'text-down';
  return 'text-ink/60';
}

/** The exact mechanical cost of a call: a scoreboard numeral, then what it moves. */
export function EffectChips({
  effects,
  rare = false,
  size = 'md',
}: {
  effects: readonly EffectChip[];
  rare?: boolean;
  size?: 'md' | 'sm';
}) {
  const shown = mergeDefenseChips([...effects]);
  const num = size === 'md' ? 'text-[1.375rem]' : 'text-[0.9375rem]';

  return (
    <>
      {shown.map((e) =>
        e.key === 'money' ? (
          <span key={e.key} className="inline-flex items-baseline">
            <span className={cn('t-num leading-none', num, e.delta >= 0 ? 'text-up' : 'text-down')}>
              {`${e.delta >= 0 ? '+' : '−'}${moneyM(Math.abs(e.delta))}`}
            </span>
          </span>
        ) : (
          <span key={e.key} className="inline-flex items-baseline gap-1.5">
            <span className={cn('t-num leading-none', num, tone(e, rare))}>
              {e.delta === 0 && e.nominal ? 'MAX' : `${e.delta >= 0 ? '+' : ''}${e.delta}`}
            </span>
            {e.nominal !== undefined && e.delta !== 0 && (
              <s className="t-num text-[0.6875rem] text-ink/60">
                {`${e.nominal >= 0 ? '+' : ''}${e.nominal}`}
              </s>
            )}
            <span className={cn('t-label', size === 'sm' && 'text-[0.625rem]')}>{e.label}</span>
          </span>
        ),
      )}
    </>
  );
}
