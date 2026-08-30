import type { CareerMomentDto } from '@chipy/shared';
import { useEffect, useState } from 'react';
import { awardArt, clubCrest, teamLogo } from '../lib/art.js';
import { teamName } from '../lib/format.js';

/**
 * The "main" awards — each gets a full-screen takeover, backed by artwork in
 * `src/assets/awards/<id>.png` (an emoji glyph shows until the file is added).
 * A moment with `kind: "ring"` always qualifies. Every *other* award still
 * gets noted, but only in the recap banner. Edit this set to change which ones
 * get the modal.
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

/** Fallback glyph when no artwork file has been dropped in `assets/awards`. */
const GLYPH: Record<string, string> = {
  mvp: '👑',
  dpoy: '🛡️',
  finals_mvp: '🏆',
  roy: '🌟',
  champion: '🏆',
  clutch_poy: '❄️',
  mip: '📈',
  sixth_man: '🔥',
  euroleague_mvp: '👑',
  euroleague_champion: '🏆',
  oly_gold: '🥇',
  oly_silver: '🥈',
  oly_bronze: '🥉',
};

export function isHeadlineMoment(m: CareerMomentDto): boolean {
  return (
    m.kind === 'ring' || m.kind === 'trade' || (m.awardId != null && HEADLINE_AWARDS.has(m.awardId))
  );
}

/**
 * Full-screen celebration for the headline beats of a season — MVP, DPOY,
 * Finals MVP, ROY, a ring. Steps through them one at a time, then unmounts
 * itself. Give it a `key` tied to the season so a new season starts fresh.
 *
 * The 128×128 box is the artwork drop point: add
 * `src/assets/awards/<awardId>.png` (see `src/lib/art.ts`) and it replaces the
 * emoji automatically.
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
  // For a trade the hero image is the destination team's logo, not award art.
  const art = isTrade ? logo : awardArt(m.awardId);
  const glyph = isTrade ? '🔁' : ((m.awardId && GLYPH[m.awardId]) ?? '🏆');
  const kicker = isTrade ? 'Traded to' : m.kind === 'ring' ? 'Champions' : 'The hardware';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-court-950/85 p-4"
      onClick={() => setI((n) => n + 1)}
    >
      <div
        role="dialog"
        aria-label={m.title}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-amber bg-court-900 text-center shadow-[0_0_60px_-12px_rgba(249,115,22,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-b from-amber/25 to-transparent px-6 pb-6 pt-8">
          <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber">
            {kicker}
          </div>

          {/* ── HERO ART (128×128 box) ──
              awards: src/assets/awards/<awardId>.png · teams: src/assets/teams/<TEAMID>.png */}
          <div className="mx-auto my-5 flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl bg-court-950/60">
            {art ? (
              <img src={art} alt={m.title} className="block max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-6xl leading-none">{glyph}</span>
            )}
          </div>

          <h2 className="font-display text-3xl leading-none tracking-wide text-ink">{m.title}</h2>
          <p className="mt-2 text-sm text-ink-dim">{m.subtitle}</p>

          {!isTrade && m.teamId && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-ink-dim">
              {logo && <img src={logo} alt="" className="h-5 w-5 object-contain" />}
              {teamName(m.teamId)}
            </div>
          )}
        </div>

        <button
          onClick={() => setI((n) => n + 1)}
          className="w-full border-t border-court-700 bg-court-900 px-6 py-3 font-display text-sm uppercase tracking-widest text-amber hover:bg-amber/10"
        >
          {i + 1 < moments.length ? `Next · ${i + 1}/${moments.length}` : 'Continue'}
        </button>
      </div>
    </div>
  );
}
