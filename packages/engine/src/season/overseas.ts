import { euroSalary } from '../data/contracts.js';
import { EURO_CLUBS, getEuroClub } from '../data/euro-clubs.js';
import { clamp, int, jitter, roundTo, weightedPick, type Rng } from '../rng.js';
import type {
  AwardId,
  ClubOffer,
  ClubRef,
  EuroResult,
  Position,
  Ratings,
  SeasonStatLine,
} from '../types.js';
import { mergeEffects, type SeasonEffect } from './effects.js';
import { derivedRng, simulateSeason } from './season-sim.js';

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

/** Which EuroLeague tier your NBA market value maps onto (0.5 fringe … 0.95 giant). */
function targetPrestige(marketValue: number): number {
  return clamp(0.52 + (marketValue - 6) * 0.02, 0.5, 0.95);
}

function sampleClubs(rng: Rng, target: number, exclude: Set<string>, count: number): ClubRef[] {
  const pool = EURO_CLUBS.filter((c) => !exclude.has(c.id)).map(
    (c) => [c, 1 / (0.06 + Math.abs(c.prestige - target))] as const,
  );
  const picked: ClubRef[] = [];
  const used = new Set<string>();
  while (picked.length < count && used.size < pool.length) {
    const c = weightedPick(
      rng,
      pool.filter(([club]) => !used.has(club.id)),
    );
    used.add(c.id);
    picked.push(c);
  }
  return picked;
}

export interface EuroOfferArgs {
  seed: number | string;
  tag: number | string;
  marketValue: number;
  count?: number;
  /** Kept out of the sample (already offered as "re-sign"). */
  excludeClubId?: string;
}

/** Two or three EuroLeague clubs willing to sign you. */
export function euroClubOffers({
  seed,
  tag,
  marketValue,
  count = 3,
  excludeClubId,
}: EuroOfferArgs): ClubOffer[] {
  const rng = derivedRng(seed, 'euro-offers', tag);
  const target = targetPrestige(marketValue);
  const exclude = new Set(excludeClubId ? [excludeClubId] : []);
  return sampleClubs(rng, target, exclude, count).map((club, i) => ({
    choiceId: `euro_${i}`,
    club,
    years: int(rng, 2, 3),
    salary: euroSalary(rng, marketValue, club.prestige),
    pitch: `${club.name} (${club.country}) want you as their franchise piece.`,
  }));
}

/** Re-sign with your current club. */
export function euroResignOffer(
  seed: number | string,
  tag: number | string,
  club: ClubRef,
  marketValue: number,
): ClubOffer {
  const rng = derivedRng(seed, 'euro-resign', tag);
  return {
    choiceId: 'euro_stay',
    club,
    years: int(rng, 2, 3),
    salary: roundTo(euroSalary(rng, marketValue, club.prestige) * 1.05, 1),
    pitch: `Stay in ${club.country}. ${club.name} build another title run around you.`,
  };
}

/** A veteran-minimum-ish deal back to the NBA once your value recovers. */
export function nbaReturnSalary(marketValue: number): number {
  return roundTo(clamp(marketValue * 0.5, 2.5, 9), 1);
}

// ---------------------------------------------------------------------------
// Overseas season sim
// ---------------------------------------------------------------------------

export interface OverseasSimArgs {
  ratings: Ratings;
  athleticism: number;
  position: Position;
  age: number;
  durability: number;
  effect: SeasonEffect;
  previousStats: SeasonStatLine | null;
  clubPrestige: number;
}

export interface OverseasSimResult {
  stats: SeasonStatLine;
  result: EuroResult;
  impact: number;
  awards: AwardId[];
  headline: string;
}

const RESULT_HEADLINE: Record<EuroResult, string> = {
  euroleague_champion: 'You lift the EuroLeague trophy.',
  euroleague_final_four: 'A EuroLeague Final Four run falls just short.',
  domestic_title: 'You sweep the domestic league and cup.',
  euro_playoffs: 'A solid campaign ends in the EuroLeague playoffs.',
  euro_missed: 'A quiet year — no silverware this time.',
};

/**
 * A season abroad. You're the centrepiece, so usage runs high; the club's
 * `prestige` plus your production decide how deep the EuroLeague run goes.
 */
export function simulateOverseasSeason(rng: Rng, args: OverseasSimArgs): OverseasSimResult {
  const sim = simulateSeason(rng, {
    ratings: args.ratings,
    athleticism: args.athleticism,
    position: args.position,
    role: 'franchise',
    age: args.age,
    durability: args.durability,
    effect: mergeEffects(args.effect, { impactMult: 1.12, mpgBias: 2 }),
    previousStats: args.previousStats,
    previousRole: 'franchise',
  });

  if (sim.stats.gp === 0) {
    return {
      stats: sim.stats,
      result: 'euro_missed',
      impact: 0,
      awards: [],
      headline: 'Injury wipes out your season abroad.',
    };
  }

  const p = clamp(
    args.clubPrestige * 0.68 + clamp((sim.impact - 14) / 40, -0.2, 0.36) + jitter(rng, 1) / 60,
    0.05,
    0.98,
  );
  const r = rng();
  let result: EuroResult;
  if (p > 0.7 && r < (p - 0.56) * 0.85) result = 'euroleague_champion';
  else if (p > 0.55 && r < (p - 0.4) * 0.8) result = 'euroleague_final_four';
  else if (r < 0.42) result = 'domestic_title';
  else if (r < 0.78) result = 'euro_playoffs';
  else result = 'euro_missed';

  const awards: AwardId[] = [];
  if (result === 'euroleague_champion') awards.push('euroleague_champion');
  if (result === 'domestic_title') awards.push('euro_domestic_title');
  if (
    (result === 'euroleague_champion' || result === 'euroleague_final_four') &&
    sim.impact >= 20 + rng() * 4
  ) {
    awards.push('euroleague_mvp');
  }

  return {
    stats: sim.stats,
    result,
    impact: sim.impact,
    awards,
    headline: RESULT_HEADLINE[result],
  };
}

export { getEuroClub };
