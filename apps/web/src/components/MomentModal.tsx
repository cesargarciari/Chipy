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
import { teamName } from '../lib/format.js';

/**
 * The "main" awards - each gets a full-screen gala takeover, backed by artwork
 * in `src/assets/awards/<id>.png` (a lucide icon shows until the file is added).
 * A moment with `kind: "ring"` or `kind: "trade"` also qualifies.
 */
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

/** Fallback icon when no artwork file exists for the award. */
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

/** Short badge shown big and italic at the top of the card. */
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

/** The white headline line - the "you are …" beat. */
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

/**
 * Full-screen gala celebration for the headline beats of a season - a gold
 * top rail, a big italic badge, the trophy under a soft glow, a white headline
 * and a line of flavour, then a solid-gold button. Steps through the season's
 * headline moments one at a time, then unmounts itself.
 */
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
      if (e.key === 'Escape' || e.key === 'Enter') setI((n) => n + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

  const kicker = isTrade
    ? 'The window · Deadline day'
    : m.kind === 'ring'
      ? 'The gala · Champions'
      : 'The gala · The hardware';
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-court-950/90 p-4 backdrop-blur-sm"
      onClick={() => setI((n) => n + 1)}
    >
      <div
        role="dialog"
        aria-label={m.title}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-court-950 text-center shadow-[0_0_80px_-16px_rgba(249,115,22,0.5)] ring-1 ring-amber/40"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage:
            'radial-gradient(120% 60% at 50% 0%, rgba(120,80,20,0.35), transparent 60%), linear-gradient(180deg, #1a130a 0%, #0a0a0b 55%)',
        }}
      >
        {/* the gold top rail */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber to-transparent" />

        <div className="px-7 pb-6 pt-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber/90">
            {kicker}
          </div>

          <div className="mt-2 font-display text-4xl italic leading-none tracking-wide text-gold-gradient">
            {badge}
          </div>
          <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-amber/60">
            Season {m.seasonIndex}
          </div>

          {/* trophy under a soft glow */}
          <div className="relative mx-auto my-6 flex h-40 w-40 items-center justify-center">
            <div
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(249,180,80,0.35) 0%, rgba(249,180,80,0.08) 45%, transparent 70%)',
              }}
            />
            {art ? (
              <img
                src={art}
                alt={m.title}
                className="relative block max-h-full max-w-full object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.6)]"
              />
            ) : (
              <Icon size={72} strokeWidth={1.5} className="relative text-amber" />
            )}
          </div>

          <h2 className="font-display text-2xl leading-tight tracking-wide text-ink">{headline}</h2>

          <p className="mt-2 text-sm text-ink-dim">{m.subtitle}</p>

          {!isTrade && m.teamId && (
            <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-amber/80">
              {logo && <img src={logo} alt="" className="h-4 w-4 object-contain" />}
              {teamName(m.teamId)}
            </div>
          )}

          <p className="mx-auto mt-4 max-w-[30ch] text-[13px] italic leading-relaxed text-ink-dim">
            {flavor}
          </p>
        </div>

        <button
          onClick={() => setI((n) => n + 1)}
          className="w-full bg-gradient-to-r from-amber to-amber-soft px-6 py-3.5 font-display text-sm uppercase tracking-[0.2em] text-court-950 transition-[filter] hover:brightness-110"
        >
          {last ? 'Follow the career →' : `Next (${i + 1}/${moments.length}) →`}
        </button>
      </div>
    </div>
  );
}
