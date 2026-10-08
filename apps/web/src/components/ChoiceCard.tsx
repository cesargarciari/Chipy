import type { EffectChip } from '@chipy/engine';
import { clubCrest, teamLogo } from '../lib/art.js';
import { cn } from '../lib/cn.js';
import { useT } from '../lib/i18n.js';
import { toDisplayKey } from '../lib/ratings.js';
import { DecisionSurface } from './DecisionSurface.js';
import { EffectChips } from './EffectChips.js';

interface ChoiceCardProps {
  title: string;
  description: string;
  effects?: EffectChip[];
  tag?: string;
  watermark?: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  /** A once-a-career breakthrough, shown in gold. */
  rare?: boolean;
  /** Team or club id, used to show its logo. */
  teamId?: string;
  /** Position in the deal, so the cards arrive one after another. */
  index?: number;
  /** Keeps the accent ring on, for a pick that stays on screen. */
  selected?: boolean;
  /** Extra classes for the button. */
  className?: string;
  /** Reports which stats this option would change, or null when the pointer leaves. */
  onHoverKeys?: (keys: string[] | null) => void;
}

/** One option: its art, its name in jersey lettering, a blurb, and the exact cost. */
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
  index = 0,
  selected,
  className,
  onHoverKeys,
}: ChoiceCardProps) {
  const t = useT();
  const logo = teamId ? (teamLogo(teamId) ?? clubCrest(teamId)) : undefined;
  const statKeys = effects.filter((e) => e.key !== 'money').map((e) => toDisplayKey(e.key));
  const hoverOn = onHoverKeys ? () => onHoverKeys(statKeys) : undefined;
  const hoverOff = onHoverKeys ? () => onHoverKeys(null) : undefined;

  return (
    <DecisionSurface
      index={index}
      tone={rare ? 'rare' : tone}
      selected={selected}
      aria-pressed={selected}
      onClick={onClick}
      onMouseEnter={hoverOn}
      onMouseLeave={hoverOff}
      onFocus={hoverOn}
      onBlur={hoverOff}
      className={className}
      faceClassName="min-h-[14rem] p-6"
    >
      {watermark && (
        <span
          aria-hidden
          className={cn(
            't-jersey pointer-events-none absolute -bottom-4 -right-2 select-none text-[7.5rem] leading-none',
            'transition-[translate,color] duration-500 ease-out group-hover:-translate-x-2',
            rare ? 'text-gold/12 group-hover:text-gold/20' : 'text-ink/5 group-hover:text-ink/9',
          )}
        >
          {watermark}
        </span>
      )}

      <span className="relative flex flex-1 flex-col">
        {(logo || rare) && (
          <span className="mb-5 flex items-start justify-between gap-3">
            {logo ? (
              <img
                src={logo}
                alt=""
                className="h-12 w-12 object-contain transition-[scale] duration-500 ease-out group-hover:scale-[1.07]"
              />
            ) : (
              <span />
            )}
            {rare && (
              <span className="inline-flex h-6 items-center rounded-full bg-gold px-2.5 text-xs font-medium text-ground">
                {t.play.gold}
              </span>
            )}
          </span>
        )}

        <h3
          className={cn(
            't-jersey text-[1.75rem] transition-colors duration-300',
            tone === 'danger' && !rare ? 'text-ink/65 group-hover:text-ink' : 'text-ink',
          )}
        >
          {title}
        </h3>
        <span className="mt-2.5 block max-w-[32ch] text-[0.9375rem] leading-snug text-ink/65">
          {description}
        </span>

        {(effects.length > 0 || tag) && (
          <span className="mt-auto flex flex-wrap items-baseline gap-x-4 gap-y-2 pt-6">
            <EffectChips effects={effects} rare={rare} />
            {tag && (
              <span className="inline-flex h-6 items-center rounded-full px-2.5 text-xs text-ink/60 inset-ring inset-ring-ink/12">
                {tag}
              </span>
            )}
          </span>
        )}
      </span>
    </DecisionSurface>
  );
}
