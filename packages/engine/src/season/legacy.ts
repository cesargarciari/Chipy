import { mulberry32, normalizeSeed, roundTo } from '../rng.js';
import type {
  AwardTally,
  CareerTotals,
  FranchiseStanding,
  GradeLetter,
  Legacy,
  LegacyTier,
  OverseasSeason,
  SeasonRecord,
} from '../types.js';

export function buildCareerTotals(seasons: SeasonRecord[]): CareerTotals {
  let games = 0;
  let points = 0;
  let rebounds = 0;
  let assists = 0;
  let steals = 0;
  let blocks = 0;
  for (const s of seasons) {
    games += s.stats.gp;
    points += s.stats.gp * s.stats.ppg;
    rebounds += s.stats.gp * s.stats.rpg;
    assists += s.stats.gp * s.stats.apg;
    steals += s.stats.gp * s.stats.spg;
    blocks += s.stats.gp * s.stats.bpg;
  }
  const g = games || 1;
  return {
    seasons: seasons.length,
    games,
    points: Math.round(points),
    rebounds: Math.round(rebounds),
    assists: Math.round(assists),
    steals: Math.round(steals),
    blocks: Math.round(blocks),
    ppg: roundTo(points / g, 1),
    rpg: roundTo(rebounds / g, 1),
    apg: roundTo(assists / g, 1),
  };
}

const AWARD_POINTS: Partial<Record<keyof AwardTally, number>> = {
  all_star: 12,
  all_nba_1: 32,
  all_nba_2: 20,
  all_nba_3: 12,
  all_defense_1: 14,
  all_defense_2: 8,
  dpoy: 45,
  mvp: 95,
  roy: 20,
  mip: 10,
  sixth_man: 10,
  clutch_poy: 12,
  scoring_title: 16,
  rebounding_title: 10,
  assists_title: 10,
  steals_title: 8,
  blocks_title: 8,
  champion: 75,
  finals_mvp: 45,
  oly_gold: 30,
  oly_silver: 12,
  oly_bronze: 7,
  euroleague_champion: 24,
  euroleague_mvp: 20,
  euro_domestic_title: 8,
};

function tierFor(score: number): LegacyTier {
  if (score >= 1000) return 'inner_circle';
  if (score >= 820) return 'all_timer';
  if (score >= 660) return 'hall_of_famer';
  if (score >= 460) return 'franchise_great';
  if (score >= 320) return 'quality_starter';
  if (score >= 200) return 'solid_pro';
  if (score >= 90) return 'journeyman';
  return 'cup_of_coffee';
}

function gradeFor(score: number): GradeLetter {
  if (score >= 940) return 'S';
  if (score >= 650) return 'A';
  if (score >= 400) return 'B';
  if (score >= 300) return 'C';
  return 'D';
}

const VERDICTS: Record<LegacyTier, string> = {
  inner_circle: 'One of the greatest to ever play the game.',
  all_timer: 'A first-ballot legend whose peak defined an era.',
  hall_of_famer: 'A Hall of Fame career, no debate needed.',
  franchise_great: 'A franchise cornerstone remembered for years.',
  quality_starter: 'A rock-solid starter on good teams for a long time.',
  solid_pro: 'A dependable pro who carved out a real NBA career.',
  journeyman: 'A journeyman who hung around the league on effort.',
  cup_of_coffee: 'A brief cup of coffee in the association.',
};

const EURO_VERDICTS: Record<LegacyTier, string> = {
  inner_circle: 'An all-time great who conquered the NBA and Europe both.',
  all_timer: 'A legend on two continents.',
  hall_of_famer: 'A Hall of Fame career that found a second act in the EuroLeague.',
  franchise_great: 'A star in the NBA, then a giant of the European game.',
  quality_starter: 'A solid NBA run, reborn as a EuroLeague centrepiece.',
  solid_pro: 'A pro who rebuilt his career overseas and made it count.',
  journeyman: 'A journeyman on both sides of the Atlantic.',
  cup_of_coffee: 'A short NBA stay, then a longer road through Europe.',
};

function mostPlayedTeam(seasons: SeasonRecord[]): string | null {
  const counts = new Map<string, number>();
  for (const s of seasons) counts.set(s.teamId, (counts.get(s.teamId) ?? 0) + 1);
  let best: string | null = null;
  let bestN = 0;
  for (const [id, n] of counts) {
    if (n > bestN) {
      best = id;
      bestN = n;
    }
  }
  return best;
}

interface LegacyArgs {
  seed: number | string;
  awards: AwardTally;
  totals: CareerTotals;
  peakOverall: number;
  seasons: SeasonRecord[];
  overseasSeasons: OverseasSeason[];
  /** Final per-team standings - an idol / legend retires a jersey on its own. */
  franchises: FranchiseStanding[];
}

export function buildLegacy({
  seed,
  awards,
  totals,
  peakOverall,
  seasons,
  overseasSeasons,
  franchises,
}: LegacyArgs): Legacy {
  let score = 0;

  score += Math.max(0, Math.min(1, (peakOverall - 55) / 44)) * 240;
  // Overseas years count for longevity too, at a discount.
  const longevity = seasons.length + overseasSeasons.length * 0.6;
  score += Math.min(longevity, 20) * 9;

  for (const [id, count] of Object.entries(awards)) {
    score += (AWARD_POINTS[id as keyof AwardTally] ?? 0) * (count ?? 0);
  }

  const pts = totals.points;
  if (pts >= 30000) score += 100;
  else if (pts >= 25000) score += 70;
  else if (pts >= 20000) score += 45;
  else if (pts >= 15000) score += 25;
  else if (pts >= 10000) score += 15;

  if (totals.assists >= 10000) score += 45;
  else if (totals.assists >= 8000) score += 30;
  else if (totals.assists >= 5000) score += 15;

  if (totals.rebounds >= 12000) score += 35;
  else if (totals.rebounds >= 8000) score += 15;

  score = Math.max(0, Math.round(score));

  const rings = awards.champion ?? 0;
  const allNba = (awards.all_nba_1 ?? 0) + (awards.all_nba_2 ?? 0) + (awards.all_nba_3 ?? 0);

  const hofRng = mulberry32(normalizeSeed(`${seed}::hof`));
  const hallOfFame = score >= 660 || (score >= 560 && hofRng() < 0.5);
  const tier = tierFor(score);

  // An idol / legend gets his jersey raised by that team; otherwise the old
  // Hall-of-Fame bar with the team he played the most for.
  const iconFranchise = franchises.find((f) => f.tier === 'legend' || f.tier === 'idol');
  const jerseyRetired =
    Boolean(iconFranchise) || (hallOfFame && (rings >= 1 || allNba >= 2 || score >= 900));
  const jerseyRetiredBy = jerseyRetired ? (iconFranchise?.teamId ?? mostPlayedTeam(seasons)) : null;

  // A career that spent a real chunk of its length in Europe gets its own verdict.
  const europeHeavy =
    overseasSeasons.length >= 3 && overseasSeasons.length >= seasons.length * 0.35;

  return {
    score,
    grade: gradeFor(score),
    tier,
    hallOfFame,
    jerseyRetired,
    jerseyRetiredBy,
    verdict: (europeHeavy ? EURO_VERDICTS : VERDICTS)[tier],
  };
}
