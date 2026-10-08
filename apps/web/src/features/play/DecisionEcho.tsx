import type { EffectChip } from '@chipy/engine';
import { Check } from 'lucide-react';
import { EffectChips } from '../../components/EffectChips.js';
import { useT } from '../../lib/i18n.js';

export interface DecisionEchoData {
  label: string;
  effects: EffectChip[];
}

/** The call you just made lands here, so the next scene opens on its consequence. */
export function DecisionEcho({ echo, echoSeq }: { echo: DecisionEchoData; echoSeq: number }) {
  const t = useT();

  return (
    <div
      key={echoSeq}
      role="status"
      className="toast-in inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[1.375rem] bg-float py-2 pl-2 pr-4 shadow-lift inset-ring inset-ring-ink/8"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
        <Check size={14} strokeWidth={2.25} aria-hidden />
      </span>
      <span className="t-label">{t.play.lastCall}</span>
      <span className="t-jersey text-[1.0625rem] text-ink">{echo.label}</span>
      {echo.effects.length > 0 && (
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <EffectChips effects={echo.effects} size="sm" />
        </span>
      )}
    </div>
  );
}
