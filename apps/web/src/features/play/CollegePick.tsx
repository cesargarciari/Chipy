import type { PendingDecision } from '@chipy/engine';
import { DecisionSurface } from '../../components/DecisionSurface.js';
import { clubCrest } from '../../lib/art.js';
import { cn } from '../../lib/cn.js';
import { ChoiceGrid, DEAL_START, Stage } from './Stage.js';

/** Prestige as five short bars, the way a scouting sheet would mark it. */
function Prestige({ value }: { value: number }) {
  const filled = Math.round(value * 5);
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`Prestige ${filled} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn('h-1 w-5 rounded-full', i < filled ? 'bg-ink/75' : 'bg-ink/12')}
        />
      ))}
    </span>
  );
}

export function CollegePick({
  pick,
  onChoose,
}: {
  pick: NonNullable<PendingDecision['collegePick']>;
  onChoose: (schoolId: string) => void;
}) {
  const isOverseas = pick.tier === 'overseas';
  return (
    <Stage
      title="Where do you commit?"
      prompt="Your program shapes your freshman year, and how NBA scouts see you."
    >
      <ChoiceGrid>
        {pick.schools.map((s, i) => {
          const crest = isOverseas ? clubCrest(s.id) : undefined;
          return (
            <DecisionSurface
              key={s.id}
              index={DEAL_START + i}
              onClick={() => onChoose(s.id)}
              faceClassName="min-h-[11rem] p-6"
            >
              {crest && (
                <img
                  src={crest}
                  alt=""
                  className="mb-5 h-12 w-12 object-contain transition-[scale] duration-500 ease-out group-hover:scale-[1.07]"
                />
              )}
              <span className="t-jersey text-[1.75rem] text-ink">{s.name}</span>
              <span className="mt-4">
                <Prestige value={s.prestige} />
              </span>
              <span className="mt-auto block space-y-1 pt-6 text-[0.9375rem] leading-snug text-ink/65">
                <span className="block">
                  {s.nbaPedigree >= 0.85
                    ? 'Elite NBA pipeline'
                    : s.nbaPedigree >= 0.6
                      ? 'Sends players to the league'
                      : 'You develop on your own timeline'}
                </span>
                <span className="block">
                  {s.style.usage >= 0.78
                    ? 'You are the whole offense'
                    : s.style.usage >= 0.62
                      ? 'A featured role'
                      : 'You share the ball'}
                </span>
              </span>
            </DecisionSurface>
          );
        })}
      </ChoiceGrid>
    </Stage>
  );
}
