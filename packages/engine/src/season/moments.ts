import type { AwardId, AwardTally, CareerMoment, FranchiseTier, TeamResult } from '../types.js';

/**
 * Every award earns an end-of-season card so it's "noted". The big ones fire
 * again on every repeat; the lesser honours (`everyTime: false`) only get a
 * card the first time, so a 12-time All-Star doesn't bury the banner.
 */
const AWARD_MOMENTS: Partial<Record<AwardId, { title: string; everyTime: boolean }>> = {
  mvp: { title: 'MOST VALUABLE PLAYER', everyTime: true },
  dpoy: { title: 'DEFENSIVE PLAYER OF THE YEAR', everyTime: true },
  roy: { title: 'ROOKIE OF THE YEAR', everyTime: true },
  finals_mvp: { title: 'FINALS MVP', everyTime: true },
  mip: { title: 'MOST IMPROVED PLAYER', everyTime: true },
  sixth_man: { title: 'SIXTH MAN OF THE YEAR', everyTime: true },
  clutch_poy: { title: 'CLUTCH PLAYER OF THE YEAR', everyTime: true },
  scoring_title: { title: 'SCORING TITLE', everyTime: true },
  rebounding_title: { title: 'REBOUNDING TITLE', everyTime: true },
  assists_title: { title: 'ASSISTS TITLE', everyTime: true },
  steals_title: { title: 'STEALS TITLE', everyTime: true },
  blocks_title: { title: 'BLOCKS TITLE', everyTime: true },
  oly_gold: { title: 'OLYMPIC GOLD', everyTime: true },
  oly_silver: { title: 'OLYMPIC SILVER', everyTime: true },
  oly_bronze: { title: 'OLYMPIC BRONZE', everyTime: true },
  euroleague_champion: { title: 'EUROLEAGUE CHAMPION', everyTime: true },
  euroleague_mvp: { title: 'EUROLEAGUE MVP', everyTime: true },
  euro_domestic_title: { title: 'DOMESTIC LEAGUE TITLE', everyTime: true },
  // Noted once, then folded into the trophy case.
  all_nba_1: { title: 'ALL-NBA FIRST TEAM', everyTime: false },
  all_nba_2: { title: 'ALL-NBA SECOND TEAM', everyTime: false },
  all_nba_3: { title: 'ALL-NBA THIRD TEAM', everyTime: false },
  all_defense_1: { title: 'ALL-DEFENSIVE FIRST TEAM', everyTime: false },
  all_defense_2: { title: 'ALL-DEFENSIVE SECOND TEAM', everyTime: false },
  all_star: { title: 'ALL-STAR SELECTION', everyTime: false },
  all_rookie: { title: 'ALL-ROOKIE TEAM', everyTime: false },
};

const POINT_MILESTONES = [10_000, 15_000, 20_000, 25_000, 30_000];

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export interface SeasonMomentArgs {
  seasonIndex: number;
  age: number;
  teamId: string;
  teamLabel: string;
  seasonAwards: readonly AwardId[];
  /** Running tally *including* this season, to tell a first from a repeat. */
  tallyAfter: AwardTally;
  teamResult: TeamResult;
  traded: boolean;
  /** The player forced the move themselves (a trade demand). */
  tradeDemanded?: boolean;
  /** Career points before and after this season, for milestone crossings. */
  pointsBefore: number;
  pointsAfter: number;
  /** A franchise tier newly reached this season, if any. */
  franchiseTierUp: FranchiseTier | null;
}

const FRANCHISE_MOMENT: Partial<Record<FranchiseTier, { id: string; title: string }>> = {
  favorite: { id: 'franchise_favorite', title: 'A FAN FAVORITE' },
  cornerstone: { id: 'franchise_cornerstone', title: 'FRANCHISE CORNERSTONE' },
  idol: { id: 'franchise_idol', title: 'AN IDOL' },
  legend: { id: 'franchise_legend', title: 'A LEGEND' },
};

/** The notable beats of one finished season, newest-feeling first. */
export function detectSeasonMoments(a: SeasonMomentArgs): CareerMoment[] {
  const out: CareerMoment[] = [];
  const base = { seasonIndex: a.seasonIndex, teamId: a.teamId };

  if (a.teamResult === 'champion') {
    out.push({
      ...base,
      kind: 'ring',
      id: 'champion',
      awardId: 'champion',
      title: 'CHAMPION',
      subtitle: `Age ${a.age} · ${a.teamLabel}${
        (a.tallyAfter.champion ?? 0) > 1
          ? ` · ring #${a.tallyAfter.champion}`
          : ' · your first ring'
      }`,
    });
  }

  for (const id of a.seasonAwards) {
    const def = AWARD_MOMENTS[id];
    if (!def || id === 'champion') continue;
    const count = a.tallyAfter[id] ?? 1;
    if (!def.everyTime && count > 1) continue; // lesser honour — noted once
    out.push({
      ...base,
      kind: 'award',
      id,
      awardId: id,
      title: def.title,
      subtitle: `Age ${a.age} · ${a.teamLabel} · ${count === 1 ? 'your first' : `${ordinal(count)} time`}`,
    });
  }

  if (a.traded) {
    out.push({
      ...base,
      kind: 'trade',
      id: a.tradeDemanded ? 'trade_demand' : 'trade',
      // The client's trade modal shows this as "Traded to <title>".
      title: a.teamLabel.toUpperCase(),
      subtitle: a.tradeDemanded
        ? `Age ${a.age} · you forced your way out`
        : `Age ${a.age} · moved at the deadline`,
    });
  }

  if (a.franchiseTierUp && FRANCHISE_MOMENT[a.franchiseTierUp]) {
    const m = FRANCHISE_MOMENT[a.franchiseTierUp]!;
    out.push({
      ...base,
      kind: 'franchise',
      id: m.id,
      title: m.title,
      subtitle: `${a.teamLabel} · the city has adopted you`,
    });
  }

  for (const mark of POINT_MILESTONES) {
    if (a.pointsBefore < mark && a.pointsAfter >= mark) {
      out.push({
        ...base,
        kind: 'milestone',
        id: `points_${mark}`,
        title: `${mark.toLocaleString()} CAREER POINTS`,
        subtitle: `Age ${a.age} · ${a.teamLabel}`,
      });
    }
  }

  return out;
}
