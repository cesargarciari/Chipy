import type { EffectChip } from '@chipy/engine';
import { cn } from '../../lib/cn.js';
import { moneyM } from '../../lib/format.js';
import { useT } from '../../lib/i18n.js';
import { mergeDefenseChips } from '../../lib/ratings.js';

export interface DecisionEchoData {
  label: string;
  effects: EffectChip[];
}

/**
 * A one-line recap of the call the player just made, threaded through every
 * decision kind (prologue, college, season, farewell, …). Sits above the
 * keyed node wrapper in PlayScreen so it survives the remount and can
 * re-trigger its own fade via `echoSeq` - the throughline from "you picked
 * this" to "here's what moved" that the rest of the screen only shows once a
 * season rolls over.
 */
export function DecisionEcho({ echo, echoSeq }: { echo: DecisionEchoData; echoSeq: number }) {
  const t = useT();
  const chips = mergeDefenseChips(echo.effects);

  return (
    <div
      key={echoSeq}
      className="decision-enter flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-court-800 bg-court-900/40 px-3 py-2 text-xs"
    >
      <span className="font-bold uppercase tracking-wide text-ink-dim">{t.play.lastCall}</span>
      <span className="font-semibold text-ink">{echo.label}</span>
      {chips.map((c) => (
        <span
          key={c.key}
          className={cn(
            'font-mono font-bold',
            c.key === 'money'
              ? c.delta >= 0
                ? 'text-amber'
                : 'text-rose-400'
              : c.delta > 0
                ? 'text-emerald-400'
                : c.delta < 0
                  ? 'text-rose-400'
                  : 'text-ink-dim',
          )}
        >
          {c.key === 'money'
            ? `${c.delta >= 0 ? '+' : '−'}${moneyM(Math.abs(c.delta))}`
            : `${c.delta >= 0 ? '+' : ''}${c.delta} ${c.label}`}
        </span>
      ))}
    </div>
  );
}
