import { schoolsForTier } from '../data/schools.js';
import { clamp, jitter, roundTo, weightedPick, type Rng } from '../rng.js';
import type {
  CollegeSeason,
  GameOption,
  Market,
  Position,
  Ratings,
  SchoolRef,
  SchoolTier,
} from '../types.js';

const REB_POS: Record<Position, number> = { PG: 0.55, SG: 0.65, SF: 1.0, PF: 1.35, C: 1.6 };
const AST_POS: Record<Position, number> = { PG: 1.7, SG: 1.05, SF: 0.85, PF: 0.6, C: 0.55 };

export const MAX_COLLEGE_YEARS = 3;

/** Six programs from the chosen tier, biased toward prestige (more so in a big market). */
export function sampleSchools(rng: Rng, tier: SchoolTier, market: Market, count = 6): SchoolRef[] {
  const pool = schoolsForTier(tier);
  const marketPull = market === 'large' ? 2.2 : market === 'mid' ? 1.3 : 0.8;
  const weighted = pool.map((s) => [s, Math.max(0.05, s.prestige ** marketPull)] as const);
  const picked: SchoolRef[] = [];
  const used = new Set<string>();
  while (picked.length < Math.min(count, pool.length)) {
    const s = weightedPick(
      rng,
      weighted.filter(([x]) => !used.has(x.id)),
    );
    used.add(s.id);
    picked.push(s);
  }
  return picked;
}

function tournamentResult(rng: Rng, school: SchoolRef, impact: number): string {
  const overseas = school.tier === 'overseas';
  const p = clamp(school.prestige * 0.7 + impact / 42 + (rng() - 0.5) * 0.4, 0.05, 0.99);
  const r = rng();
  if (overseas) {
    // League-neutral wording — the "overseas" tier spans the G League, the NBL,
    // and European clubs, so nothing here should name a specific competition.
    if (p > 0.78 && r < p - 0.6) return 'Won the championship';
    if (p > 0.62 && r < p - 0.4) return 'Reached the finals';
    if (p > 0.45) return 'Made the playoffs';
    return 'Missed the playoffs';
  }
  if (p > 0.82 && r < p - 0.66) return 'Won the national championship';
  if (p > 0.68 && r < p - 0.48) return 'Reached the Final Four';
  if (p > 0.55 && r < p - 0.36) return 'Reached the Elite Eight';
  if (p > 0.45 && r < 0.6) return 'Reached the Sweet Sixteen';
  if (p > 0.32) return 'Lost in the Round of 32';
  return 'Missed the tournament';
}

export interface CollegeYearArgs {
  ratings: Ratings;
  athleticism: number;
  position: Position;
  school: SchoolRef;
  yearNumber: number;
}

export interface CollegeYearResult {
  season: CollegeSeason;
  growth: Partial<Ratings>;
  draftStockDelta: number;
}

export function simulateCollegeYear(rng: Rng, args: CollegeYearArgs): CollegeYearResult {
  const { ratings: r, athleticism, position, school, yearNumber } = args;
  const usage = school.style.usage;

  // A wide multiplier — the same prospect can have a monster year or flop.
  const form = 0.62 + rng() * 0.72;
  const scoringRate = (r.finishing * 0.4 + r.midRange * 0.3 + r.threePoint * 0.3) / 100;
  const ppg = clamp(roundTo(scoringRate * usage * 33 * form + (yearNumber - 1) * 1.4, 1), 3, 27);
  const rebRate = (r.rebounding * 0.6 + r.interiorDefense * 0.25 + athleticism * 0.15) / 100;
  const rpg = clamp(roundTo(rebRate * REB_POS[position] * 7.4 * (0.7 + rng() * 0.6), 1), 1, 13);
  const astRate = (r.playmaking * 0.7 + r.basketballIQ * 0.3) / 100;
  const apg = clamp(roundTo(astRate * AST_POS[position] * 4.6 * (0.7 + rng() * 0.6), 1), 0.4, 9);
  const fgPct = clamp(
    roundTo(0.43 + (r.finishing - 60) / 420 + (r.threePoint - 60) / 700 + jitter(rng, 2) / 100, 3),
    0.36,
    0.6,
  );
  const gp = 30 + Math.round(rng() * 6);

  const impact = ppg * 0.5 + rpg * 0.4 + apg * 0.6;
  const result = tournamentResult(rng, school, impact);

  // A modest development year — the NBA does the heavy lifting later.
  const growth: Partial<Ratings> = {};
  for (const [key, amt] of Object.entries(school.style.dev)) {
    growth[key as keyof Ratings] = (amt ?? 0) * (0.4 + rng() * 0.6);
  }
  growth.basketballIQ = (growth.basketballIQ ?? 0) + 0.2 + rng() * 0.3;

  const wonBig = /\bchampionship\b|Final Four|Won the finals|Reached the finals/.test(result);
  const draftStockDelta = clamp(
    Math.round(
      (impact - 15) * 1.15 +
        school.nbaPedigree * 7 +
        (wonBig ? 5 : 0) +
        (yearNumber > 1 ? 3 : 0) +
        jitter(rng, 4) +
        (rng() < 0.2 ? jitter(rng, 8) : 0),
    ),
    -22,
    22,
  );

  const headline =
    `At ${school.name} you averaged ${ppg}/${rpg}/${apg} on ${(fgPct * 100).toFixed(0)}% shooting` +
    `${
      school.nbaPedigree > 0.85
        ? ` — the program's pipeline has scouts already sold.`
        : draftStockDelta >= 8
          ? ` and jumped up draft boards.`
          : draftStockDelta <= -6
            ? ` but scouts wanted more.`
            : `.`
    } ${result}.`;

  return {
    season: {
      year: yearNumber,
      school: school.name,
      stats: { gp, ppg, rpg, apg, fgPct },
      result,
      headline,
    },
    growth,
    draftStockDelta,
  };
}

/**
 * The one decision after each simulated college year. If the year didn't move
 * the needle (draft stock still low) and there's a year of eligibility left, the
 * "declare" option is withheld — nobody's picking you yet, so you stay.
 */
export function collegeYearOptions(yearNumber: number, draftStock: number): GameOption[] {
  const canReturn = yearNumber < MAX_COLLEGE_YEARS;
  const draftable = draftStock >= 34 || !canReturn;
  const out: GameOption[] = [];
  if (draftable) {
    out.push({
      id: `cy_declare_${yearNumber}`,
      label: 'DECLARE FOR THE DRAFT',
      blurb: "You've shown enough. Put your name in and chase the league.",
      effect: {},
    });
  }
  if (canReturn) {
    out.push(
      {
        id: `cy_return_${yearNumber}`,
        label: 'RETURN TO SCHOOL',
        blurb: draftable
          ? 'Another year to polish your game — and your draft stock.'
          : 'Scouts want more before draft night. Come back and prove it.',
        effect: {},
        stance: { tag: 'Patience' },
      },
      {
        id: `cy_transfer_${yearNumber}`,
        label: 'ENTER THE TRANSFER PORTAL',
        blurb: 'Find a new program, a bigger role, a fresh start.',
        effect: {},
        stance: { tag: 'Fresh start' },
      },
    );
  }
  return out;
}

export function collegeDecisionKind(optionId: string): 'declare' | 'return' | 'transfer' | null {
  if (optionId.startsWith('cy_declare_')) return 'declare';
  if (optionId.startsWith('cy_return_')) return 'return';
  if (optionId.startsWith('cy_transfer_')) return 'transfer';
  return null;
}
