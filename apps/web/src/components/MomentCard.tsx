import type { CareerMomentDto } from '@chipy/shared';
import {
  Ambulance,
  ArrowLeftRight,
  Footprints,
  Heart,
  Medal,
  PenLine,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { awardArt } from '../lib/art.js';
import { cn } from '../lib/cn.js';
import { teamName } from '../lib/format.js';

/** Icon for each moment type when there's no award art. */
const ICON: Record<CareerMomentDto['kind'], LucideIcon> = {
  award: Medal,
  ring: Trophy,
  trade: ArrowLeftRight,
  signing: PenLine,
  franchise: Heart,
  shoe: Footprints,
  milestone: TrendingUp,
  midseason: Zap,
  injury: Ambulance,
};

const TONE: Record<CareerMomentDto['kind'], string> = {
  award: 'from-amber/20 border-amber/50',
  ring: 'from-amber/25 border-amber',
  trade: 'from-court-700/40 border-court-600',
  signing: 'from-court-700/40 border-court-600',
  franchise: 'from-amber/15 border-amber/40',
  shoe: 'from-amber/15 border-amber/40',
  milestone: 'from-sky-500/15 border-sky-500/40',
  midseason: 'from-court-700/40 border-court-600',
  injury: 'from-rose-500/15 border-rose-500/40',
};

/** One highlight from the season. Shows award art if it exists, otherwise an icon. */
export function MomentCard({ moment }: { moment: CareerMomentDto }) {
  const art = awardArt(moment.awardId);
  const Icon = ICON[moment.kind];
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl border bg-gradient-to-r to-transparent p-4',
        TONE[moment.kind],
      )}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-court-900 text-ink-dim">
        {art ? (
          <img src={art} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <Icon size={22} strokeWidth={1.75} />
        )}
      </div>
      <div className="min-w-0">
        <div className="font-display text-xl leading-none tracking-wide text-ink">
          {moment.title}
        </div>
        {moment.choice && (
          <div className="mt-1 text-xs font-semibold text-amber">You chose: {moment.choice}</div>
        )}
        <div className="mt-1 text-xs text-ink-dim">
          {moment.subtitle}
          {moment.teamId && moment.kind !== 'franchise' && !moment.subtitle.includes('·') && (
            <> · {teamName(moment.teamId)}</>
          )}
        </div>
      </div>
    </div>
  );
}
