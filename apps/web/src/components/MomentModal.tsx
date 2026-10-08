import type { CareerMomentDto } from '@chipy/shared';
import {
  ArrowLeftRight,
  Crown,
  Flame,
  Medal,
  Shield,
  Snowflake,
  Sparkles,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { awardArt, clubCrest, teamLogo } from '../lib/art.js';
import { cn } from '../lib/cn.js';
import { teamName } from '../lib/format.js';

/** Awards that get a full-screen celebration. Rings and trades do too. */
const HEADLINE_AWARDS = new Set([
  'mvp',
  'dpoy',
  'finals_mvp',
  'roy',
  'champion',
  'clutch_poy',
  'mip',
  'sixth_man',
  'oly_gold',
  'oly_silver',
  'oly_bronze',
  'euroleague_mvp',
  'euroleague_champion',
]);

/** Icon used when an award has no artwork. */
const ICON: Record<string, LucideIcon> = {
  mvp: Crown,
  dpoy: Shield,
  finals_mvp: Trophy,
  roy: Sparkles,
  champion: Trophy,
  clutch_poy: Snowflake,
  mip: TrendingUp,
  sixth_man: Flame,
  euroleague_mvp: Crown,
  euroleague_champion: Trophy,
  oly_gold: Medal,
  oly_silver: Medal,
  oly_bronze: Medal,
};

/** Big badge at the top of the card. */
const BADGE: Record<string, string> = {
  mvp: 'MVP',
  dpoy: 'DPOY',
  roy: 'ROY',
  finals_mvp: 'FINALS MVP',
  clutch_poy: 'CLUTCH POY',
  mip: 'MIP',
  sixth_man: 'SIXTH MAN',
  champion: 'CHAMPIONS',
  oly_gold: 'OLYMPIC GOLD',
  oly_silver: 'OLYMPIC SILVER',
  oly_bronze: 'OLYMPIC BRONZE',
  euroleague_mvp: 'EUROLEAGUE MVP',
  euroleague_champion: 'EUROLEAGUE',
};

/** The main headline line. */
const HEADLINE: Record<string, string> = {
  mvp: 'THE BEST IN THE WORLD',
  dpoy: 'NOBODY GETS PAST YOU',
  roy: 'THE ARRIVAL',
  finals_mvp: 'WHEN IT MATTERED MOST',
  clutch_poy: 'ICE IN YOUR VEINS',
  mip: 'A DIFFERENT PLAYER',
  sixth_man: 'THE SPARK OFF THE BENCH',
  champion: 'ON TOP OF THE WORLD',
  oly_gold: 'GOLD FOR YOUR COUNTRY',
  oly_silver: 'SILVER FOR YOUR COUNTRY',
  oly_bronze: 'BRONZE FOR YOUR COUNTRY',
  euroleague_mvp: 'THE BEST IN EUROPE',
  euroleague_champion: 'KINGS OF EUROPE',
};

const FLAVOR: Record<string, string> = {
  mvp: 'No individual prize is bigger than this. Tonight the whole league looks your way - you are the face of your generation.',
  dpoy: 'They build the whole scouting report around stopping everyone else. Then they get to you.',
  roy: 'Every legend has a first chapter. This is yours.',
  finals_mvp:
    'The lights were brightest, the season was on the line, and the ball kept finding you.',
  clutch_poy:
    'Down two, ten on the clock, everyone in the building knows where it is going. It still goes in.',
  mip: 'Same gym, same hours, a completely different player. The work shows.',
  sixth_man: 'The game is on the line when you check in. That is not an accident.',
  champion: 'A summer of work, a war of a spring, and the one trophy that gets its own parade.',
  oly_gold:
    'You stood on the top step with your flag rising. Nothing in the club game feels like it.',
  oly_silver: 'One game short of gold, but a medal around your neck and a country on its feet.',
  oly_bronze: 'A medal is a medal. Your country will take it, and so will you.',
  euroleague_mvp: 'A continent full of pros, and you were the one nobody had an answer for.',
  euroleague_champion: 'The hardest trophy in Europe, and it is coming home with you.',
};

export function isHeadlineMoment(m: CareerMomentDto): boolean {
  return (
    m.kind === 'ring' || m.kind === 'trade' || (m.awardId != null && HEADLINE_AWARDS.has(m.awardId))
  );
}

/** The gala: the season's biggest moments, one at a time, with the house lights down. */
export function MomentModal({
  moments,
  onDone,
}: {
  moments: CareerMomentDto[];
  onDone?: () => void;
}) {
  const [i, setI] = useState(0);
  const done = i >= moments.length;

  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      // A focused button already turns Enter into a click.
      if (e.key === 'Enter' && e.target instanceof HTMLButtonElement) return;
      if (e.key === 'Escape' || e.key === 'Enter') setI((n) => n + 1);
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [done]);

  useEffect(() => {
    if (done) onDone?.();
  }, [done, onDone]);

  if (done) return null;

  const m = moments[i]!;
  const isTrade = m.kind === 'trade';
  const logo = teamLogo(m.teamId) ?? clubCrest(m.teamId);
  const art = isTrade ? logo : awardArt(m.awardId);
  const Icon = isTrade ? ArrowLeftRight : ((m.awardId && ICON[m.awardId]) ?? Trophy);

  const badge = isTrade ? 'TRADED' : ((m.awardId && BADGE[m.awardId]) ?? m.title);
  const headline = isTrade
    ? m.title
    : ((m.awardId && HEADLINE[m.awardId]) ?? m.title.toUpperCase());
  const flavor = isTrade
    ? 'New city, new locker, a fresh number on the wall. The story keeps moving.'
    : ((m.awardId && FLAVOR[m.awardId]) ?? 'One more line for the trophy case.');
  const last = i + 1 >= moments.length;

  return (
    <div
      className="gala-scrim fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ground/75 p-4 backdrop-blur-xl"
      onClick={() => setI((n) => n + 1)}
    >
      <div
        key={i}
        role="dialog"
        aria-modal="true"
        aria-label={m.title}
        className="gala-panel relative w-full max-w-md overflow-hidden rounded-sheet bg-float text-center shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gala-rise px-8 pt-10">
          <div className="t-num text-sm text-ink/60">Season {m.seasonIndex}</div>
          <p
            className={cn(
              't-jersey mt-3 text-[2.5rem] leading-none',
              isTrade ? 'text-ink' : 'text-gold',
            )}
          >
            {badge}
          </p>

          <div className="relative mx-auto my-8 grid h-44 w-44 place-items-center">
            <div
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, color-mix(in oklab, var(${
                  isTrade ? '--ink' : '--gold'
                }) 22%, transparent) 0%, transparent 68%)`,
              }}
            />
            {art ? (
              <img
                src={art}
                alt={m.title}
                className="trophy-in relative block h-full w-full object-contain drop-shadow-[0_18px_28px_var(--shadow-tint)]"
              />
            ) : (
              <Icon
                size={76}
                strokeWidth={1.25}
                className={cn('trophy-in relative', isTrade ? 'text-ink' : 'text-gold')}
              />
            )}
            {!isTrade && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
              >
                <span
                  className="light-sweep absolute inset-y-0 left-1/4 w-1/2"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, color-mix(in oklab, var(--gold) 30%, transparent), transparent)',
                  }}
                />
              </span>
            )}
          </div>

          <h2 className="t-jersey text-[1.875rem] text-ink">{headline}</h2>
          <p className="mt-3 text-sm text-ink/60">{m.subtitle}</p>

          {!isTrade && m.teamId && (
            <div className="mt-2 inline-flex items-center gap-2 text-sm text-ink/70">
              {logo && <img src={logo} alt="" className="h-4 w-4 object-contain" />}
              {teamName(m.teamId)}
            </div>
          )}

          <p className="t-voice mx-auto mt-6 max-w-[30ch] text-lg leading-snug text-ink/80">
            {flavor}
          </p>
        </div>

        <div className="px-6 pb-6 pt-9">
          <button
            type="button"
            onClick={() => setI((n) => n + 1)}
            className="h-13 w-full rounded-full bg-accent text-base font-medium text-on-accent shadow-lift transition-[background-color,scale] duration-200 hover:bg-accent/88 active:scale-[.98]"
          >
            {last ? 'Follow the career' : `Next (${i + 1}/${moments.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
