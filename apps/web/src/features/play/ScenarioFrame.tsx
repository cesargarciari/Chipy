import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export type ScenarioAccent = 'amber' | 'sky' | 'emerald';

const STRAND: Record<ScenarioAccent, string> = {
  amber: 'from-transparent via-amber to-transparent',
  sky: 'from-transparent via-sky-400 to-transparent',
  emerald: 'from-transparent via-emerald-400 to-transparent',
};

const KICKER: Record<ScenarioAccent, string> = {
  amber: 'text-amber',
  sky: 'text-sky-400',
  emerald: 'text-emerald-400',
};

/**
 * The shell every in-career question sits in: a coloured strand across the top,
 * the kicker / title / prompt, then the options right underneath it (no big HUD
 * wedged in between). Anything passed as `footer` - the ratings + money HUD,
 * usually - renders below the options where it does not separate the question
 * from the answer.
 */
export function ScenarioFrame({
  accent = 'amber',
  kicker,
  title,
  prompt,
  children,
  footer,
}: {
  accent?: ScenarioAccent;
  kicker: string;
  title: string;
  prompt: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="decision-enter overflow-hidden rounded-2xl border border-court-700 bg-court-900">
      <div className={cn('h-1 w-full bg-gradient-to-r', STRAND[accent])} />
      <div className="space-y-4 p-5">
        <div>
          <div className={cn('text-[11px] font-bold uppercase tracking-[0.22em]', KICKER[accent])}>
            {kicker}
          </div>
          <h2 className="mt-1 font-display text-2xl italic leading-tight tracking-wide text-ink">
            {title}
          </h2>
          <p className="mt-1 text-sm text-ink-dim">{prompt}</p>
        </div>
        {children}
      </div>
      {footer && <div className="border-t border-court-700 bg-court-950/40 p-4">{footer}</div>}
    </div>
  );
}
