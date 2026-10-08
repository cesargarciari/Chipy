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
  award: 'text-gold',
  ring: 'text-gold',
  trade: 'text-ink/70',
  signing: 'text-ink/70',
  franchise: 'text-gold',
  shoe: 'text-accent-ink',
  milestone: 'text-cool',
  midseason: 'text-ink/70',
  injury: 'text-down',
};

/** One highlight from the season. Shows award art if it exists, otherwise an icon. */
export function MomentCard({ moment }: { moment: CareerMomentDto }) {
  const art = awardArt(moment.awardId);
  const Icon = ICON[moment.kind];
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-ink/4 p-4">
      <div
        className={cn(
          'grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-raised',
          TONE[moment.kind],
        )}
      >
        {art ? (
          <img src={art} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <Icon size={22} strokeWidth={1.75} />
        )}
      </div>
      <div className="min-w-0">
        <div className="t-jersey text-xl text-ink">{moment.title}</div>
        {moment.choice && (
          <div className="mt-1 text-xs text-accent-ink">You chose: {moment.choice}</div>
        )}
        <div className="mt-1 text-xs text-ink/60">
          {moment.subtitle}
          {moment.teamId && moment.kind !== 'franchise' && !moment.subtitle.includes('·') && (
            <> · {teamName(moment.teamId)}</>
          )}
        </div>
      </div>
    </div>
  );
}
