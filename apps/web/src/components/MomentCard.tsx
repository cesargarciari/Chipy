import type { CareerMomentDto } from '@chipy/shared';
import { awardArt, clubCrest, teamLogo } from '../lib/art.js';
import { cn } from '../lib/cn.js';
import { teamName } from '../lib/format.js';

/** Placeholder glyph per moment kind — real artwork slots in here later. */
const ICON: Record<CareerMomentDto['kind'], string> = {
  award: '🏅',
  ring: '🏆',
  trade: '🔁',
  signing: '✍️',
  franchise: '💛',
  shoe: '👟',
  milestone: '📈',
  midseason: '⚡',
  injury: '🩼',
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

/**
 * A single big-moment card — a trade, a ring, an MVP. Deliberately image-ready:
 * the glyph box shows award art (`assets/awards/<awardId>.png`) or a team /
 * club logo (`assets/teams/<TEAMID>.png`) when one has been added, else an
 * emoji glyph. See `src/lib/art.ts`.
 */
export function MomentCard({ moment }: { moment: CareerMomentDto }) {
  const art = awardArt(moment.awardId) ?? teamLogo(moment.teamId) ?? clubCrest(moment.teamId);
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl border bg-gradient-to-r to-transparent p-4',
        TONE[moment.kind],
      )}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-court-900 text-2xl">
        {art ? (
          <img src={art} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          ICON[moment.kind]
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
