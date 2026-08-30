import type { EffectChip } from '@chipy/engine';
import { clubCrest, teamLogo } from '../lib/art.js';
import { cn } from '../lib/cn.js';
import { moneyM } from '../lib/format.js';
import { mergeDefenseChips, toDisplayKey } from '../lib/ratings.js';

type ChoiceAccent = 'amber' | 'sky' | 'emerald';

interface ChoiceCardProps {
  title: string;
  description: string;
  effects?: EffectChip[];
  tag?: string;
  watermark?: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  /** A once-a-career breakthrough - rendered gold. */
  rare?: boolean;
  /** NBA team id / overseas club id - shows that logo on the card (contracts). */
  teamId?: string;
  /** Coloured left strand + matching hover border, keyed to the scenario type. */
  accent?: ChoiceAccent;
  /** Extra classes on the button (e.g. the `option-enter` fade-in). */
  className?: string;
  /** Reports the stat-tile keys this option would move (or null on leave). */
  onHoverKeys?: (keys: string[] | null) => void;
}

const ACCENT_BORDER: Record<ChoiceAccent, string> = {
  amber: 'hover:border-amber hover:bg-amber/[0.04]',
  sky: 'hover:border-sky-400 hover:bg-sky-400/[0.05]',
  emerald: 'hover:border-emerald-400 hover:bg-emerald-400/[0.05]',
};

const ACCENT_STRAND: Record<ChoiceAccent, string> = {
  amber: 'bg-amber/40 group-hover:bg-amber',
  sky: 'bg-sky-400/40 group-hover:bg-sky-400',
  emerald: 'bg-emerald-400/40 group-hover:bg-emerald-400',
};

/** El Idolo–style option card: condensed title, blurb, effect chips, faint watermark. */
export function ChoiceCard({
  title,
  description,
  effects = [],
  tag,
  watermark,
  onClick,
  tone = 'default',
  rare = false,
  teamId,
  accent,
  className,
  onHoverKeys,
}: ChoiceCardProps) {
  const logo = teamId ? (teamLogo(teamId) ?? clubCrest(teamId)) : undefined;
  const shown = mergeDefenseChips(effects);
  const statKeys = effects.filter((e) => e.key !== 'money').map((e) => toDisplayKey(e.key));
  const hoverOn = onHoverKeys ? () => onHoverKeys(statKeys) : undefined;
  const hoverOff = onHoverKeys ? () => onHoverKeys(null) : undefined;
  // The strand + accent border are a plain-scenario dressing; gold and danger
  // options keep their own stronger treatment.
  const strand = accent && !rare && tone !== 'danger' ? accent : null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={hoverOn}
      onMouseLeave={hoverOff}
      onFocus={hoverOn}
      onBlur={hoverOff}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border p-5 text-left transition-colors',
        rare
          ? 'border-amber bg-amber/[0.06] shadow-[0_0_0_1px_rgba(249,115,22,0.35)] hover:bg-amber/10'
          : tone === 'danger'
            ? 'border-court-700 hover:border-rose-500'
            : strand
              ? cn('border-court-700 bg-court-900', ACCENT_BORDER[strand])
              : 'border-court-700 bg-court-900 hover:border-amber hover:bg-amber/[0.04]',
        className,
      )}
    >
      {strand && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 w-[3px] transition-colors',
            ACCENT_STRAND[strand],
          )}
        />
      )}
      {watermark && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute -right-3 bottom-0 select-none font-display text-[5.5rem] leading-none tracking-tight',
            rare ? 'text-amber/15' : 'text-court-800/70',
          )}
        >
          {watermark}
        </span>
      )}

      <div className="relative z-10 flex flex-1 flex-col">
        {rare && (
          <span className="mb-1 inline-flex w-fit items-center gap-1 rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-court-950">
            Gold
          </span>
        )}
        {logo && <img src={logo} alt="" className="mb-2 h-10 w-10 object-contain" />}
        <h3
          className={cn(
            'font-display text-2xl leading-none tracking-wide',
            rare
              ? 'text-amber'
              : tone === 'danger'
                ? 'text-ink-dim group-hover:text-ink'
                : 'text-ink',
          )}
        >
          {title}
        </h3>
        <p className="mt-2 max-w-[26ch] text-sm text-ink-dim">{description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
          {shown.map((e) =>
            e.key === 'money' ? (
              <span key={e.key} className="inline-flex items-baseline gap-1">
                <span
                  className={cn(
                    'font-display text-xl leading-none',
                    e.delta >= 0 ? 'text-amber' : 'text-rose-400',
                  )}
                >
                  {e.delta >= 0 ? '+' : '−'}
                  {moneyM(Math.abs(e.delta))}
                </span>
              </span>
            ) : (
              <span key={e.key} className="inline-flex items-baseline gap-1">
                <span
                  className={cn(
                    'font-display text-xl leading-none',
                    rare
                      ? 'text-amber'
                      : e.delta > 0
                        ? 'text-emerald-400'
                        : e.delta < 0
                          ? 'text-rose-400'
                          : 'text-ink-dim',
                  )}
                >
                  {e.delta === 0 && e.nominal ? 'MAX' : `${e.delta >= 0 ? '+' : ''}${e.delta}`}
                </span>
                {e.nominal !== undefined && e.delta !== 0 && (
                  <span className="text-[10px] text-ink-dim line-through">
                    {e.nominal >= 0 ? '+' : ''}
                    {e.nominal}
                  </span>
                )}
                <span
                  className={cn(
                    'text-[11px] font-bold uppercase tracking-wide',
                    rare
                      ? 'text-amber/80'
                      : e.delta > 0
                        ? 'text-emerald-400/80'
                        : e.delta < 0
                          ? 'text-rose-400/80'
                          : 'text-ink-dim',
                  )}
                >
                  {e.label}
                </span>
              </span>
            ),
          )}
          {tag && (
            <span className="rounded-full bg-court-700 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
              {tag}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
