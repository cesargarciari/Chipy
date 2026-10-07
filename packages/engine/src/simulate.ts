import { getArchetype } from './archetypes.js';
import { createInitialState, tallyAward } from './career.js';
import { getCountry } from './data/countries.js';
import { getPerk, perkExists } from './data/perks.js';
import { getTeam, teamLabel, TEAMS } from './data/teams.js';
import { simulateDraft } from './draft.js';
import { applyOption, optionView } from './options.js';
import { defenseRatingOf, overallFor } from './ratings.js';
import { clamp, mulberry32, normalizeSeed, weightedPick } from './rng.js';
import {
  buildPrologueNodes,
  getPrologueOption,
  prologueView,
  recruitingTier,
} from './scenarios/index.js';
import { resolveAwards } from './season/awards.js';
import {
  MAX_COLLEGE_YEARS,
  collegeDecisionKind,
  collegeYearOptions,
  sampleSchools,
  simulateCollegeYear,
} from './season/college.js';
import {
  DEMAND_TRADE_VIEW,
  FAREWELL_TOUR_VIEW,
  QUIET_GOODBYE_VIEW,
  RETIRE_VIEW,
  clubOfferView,
  nbaReturnTeamView,
  teamOfferView,
} from './season/decisions.js';
import { recomputeMarketValue, settleSeasonPay, tickValueMods } from './season/economy.js';
import { mergeEffects, stanceToEffect, type SeasonEffect } from './season/effects.js';
import { rollEvent } from './season/events.js';
import { rollSeasonInjury } from './season/injuries.js';
import {
  buildFranchiseStandings,
  franchiseProgress,
  franchiseTier,
  overseasFranchiseRep,
  seasonFranchiseRep,
  tierRank,
} from './season/franchise.js';
import { growSeason } from './season/growth.js';
import { maybeInternational } from './season/international.js';
import { buildNationalStanding, nationalSummerRep } from './season/national.js';
import { buildCareerTotals, buildLegacy } from './season/legacy.js';
import {
  findChemistryOption,
  pickChemistryScenario,
  resolveChemistry,
} from './season/chemistry.js';
import { findMidseasonOption, pickMidseason, resolveMidseason } from './season/midseason.js';
import { detectSeasonMoments } from './season/moments.js';
import { seasonRecap } from './season/recap.js';
import {
  aggregatePerkEffect,
  buildPerkShop,
  perkBuyId,
  perkShopOptions,
  perkToSeasonEffect,
  renewYearlyPerks,
  type PerkShop,
} from './season/perks.js';
import {
  euroClubOffers,
  euroResignOffer,
  nbaReturnSalary,
  simulateOverseasSeason,
} from './season/overseas.js';
import { phaseFor } from './season/phase.js';
import { pickScenario } from './season/scenario-select.js';
import { SHOE_BRANDS } from './season/scenarios/shoe.js';
import { findScenarioOption } from './season/scenarios/index.js';
import { gradeOverseasSeason, gradeSeason } from './season/grade.js';
import {
  buildFinalsGame,
  finalsEdge,
  resolveFinals,
  type FinalsGameView,
} from './season/finals.js';
import {
  conferenceSeed,
  derivedRng,
  roleFor,
  simulatePlayoffs,
  simulateSeason,
  teamStrengthFor,
} from './season/season-sim.js';
import { statusRank, statusTier, tradeChance } from './season/status.js';
import { freeAgencyOffers, landingOffers, nbaReturnTeams } from './season/teams-sim.js';
import {
  ENGINE_VERSION,
  RATING_KEYS,
  type AwardId,
  type CareerMoment,
  type CareerState,
  type CareerSummary,
  type ChoiceSelection,
  type ClubRef,
  type College,
  type CollegeSeason,
  type DraftResult,
  type FranchiseTier,
  type League,
  type NationalStanding,
  type OptionView,
  type PlayerProfile,
  type PrologueNodeView,
  type Ratings,
  type RatingKey,
  type Role,
  type SchoolRef,
  type SchoolTier,
  type SeasonDecisionNode,
  type SeasonRecord,
  type StatusTier,
  type TeamRef,
  type TeamResult,
} from './types.js';

const MAX_SEASONS = 25;

export interface RunCareerArgs {
  seed: number | string;
  profile: PlayerProfile;
  /** Order: two prologue picks, college, landing, then each season's perks, decision and any mid-season call. */
  choices: ChoiceSelection[];
}

export interface SeasonPreview {
  seasonNumber: number;
  age: number;
  league: League;
  team: TeamRef | null;
  club: ClubRef | null;
  overall: number;
  contractYear: boolean;
  ratings: Ratings;
  athleticism: number;
  durability: number;
  hype: number;
  salary: number;
  bank: number;
  marketValue: number;
  ownedPerks: string[];
  /** Standing with the current team (as last reached in play). */
  franchiseTier: FranchiseTier;
  franchiseSeasons: number;
  /** 0..100 idolatry-bar fill for the current team. */
  franchiseProgress: number;
  /** National-team standing so far. */
  nationalTeam: NationalStanding;
  /** Where the player ranks in the league. Stars and up can demand a trade. */
  statusTier: StatusTier;
  /** Rough 0 to 1 chance of a trade this season, shown in the HUD. */
  tradeChance: number;
  /** Seasons left as a contender after winning a ring. */
  ringWindow: number;
  /** Team chemistry from 0 to 100. Low chemistry leads to trades. */
  chemistry: number;
  /** Big beats from the season that just finished. */
  moments: CareerMoment[];
  lastSeason: SeasonRecord | null;
  previousOverall: number | null;
}

export interface PendingDecision {
  nodeId: string;
  kind:
    | 'prologue'
    | 'college_pick'
    | 'college_year'
    | 'landing'
    | 'season'
    | 'midseason'
    | 'chemistry'
    | 'finals'
    | 'overseas_offer'
    | 'farewell';
  prologue?: PrologueNodeView;
  collegePick?: { tier: SchoolTier; schools: SchoolRef[] };
  collegeYear?: { recap: CollegeSeason; options: OptionView[]; tier: SchoolTier };
  landing?: { offers: OptionView[]; draft: DraftResult };
  season?: { decision: SeasonDecisionNode; preview: SeasonPreview; shop: PerkShop };
  midseason?: { decision: SeasonDecisionNode; preview: SeasonPreview };
  /** A locker-room question. Can show up in the same season as a mid-season one. */
  chemistry?: { decision: SeasonDecisionNode; preview: SeasonPreview };
  /** The deciding Finals possession, only when the team reaches the Finals. */
  finals?: { game: FinalsGameView; preview: SeasonPreview };
  /** The retirement choice: farewell tour or quiet goodbye. */
  farewell?: { options: OptionView[]; preview: SeasonPreview };
  overseasOffer?: {
    reason: 'washed_out' | 'contract_up';
    options: OptionView[];
    preview: SeasonPreview;
    /** Only set when the contract is up. */
    shop?: PerkShop;
  };
}

export type RunCareerResult =
  | { status: 'awaiting_choice'; pending: PendingDecision }
  | { status: 'complete'; summary: CareerSummary };

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function money(m: number): string {
  return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
}

function pickTradeTeam(rng: () => number, currentId: string): TeamRef {
  return weightedPick(
    rng,
    TEAMS.filter((t) => t.id !== currentId).map((t) => [t, 1] as const),
  );
}

function applyGrowth(base: Ratings, growth: Partial<Ratings>): Ratings {
  const next = { ...base };
  for (const key of Object.keys(growth) as RatingKey[]) {
    next[key] = clamp(Math.round(next[key] + (growth[key] ?? 0)), 25, 99);
  }
  return next;
}

/** Replays the whole career from the seed, profile and choices. Returns the next choice to make, or the finished summary. */
export function runCareer(args: RunCareerArgs): RunCareerResult {
  const { profile } = args;
  const seed = args.seed;
  const rng = mulberry32(normalizeSeed(seed));
  const state: CareerState = createInitialState(rng, profile);
  const choices = args.choices;
  const countryPedigree = getCountry(profile.country).pedigree;
  let ci = 0;

  const expect = (nodeId: string): ChoiceSelection | null => {
    if (ci >= choices.length) return null;
    const pick = choices[ci]!;
    if (pick.nodeId !== nodeId) {
      throw new Error(`Expected a choice for "${nodeId}", got "${pick.nodeId}"`);
    }
    ci += 1;
    return pick;
  };
  const peekNodeId = (): string | null => (ci < choices.length ? choices[ci]!.nodeId : null);

  // Prologue
  const prologueNodes = buildPrologueNodes(mulberry32(normalizeSeed(`${seed}::prologue`)));
  let recruitTier: SchoolTier = 'blue_blood';
  for (const node of prologueNodes) {
    const pick = expect(node.id);
    if (!pick) {
      return {
        status: 'awaiting_choice',
        pending: { nodeId: node.id, kind: 'prologue', prologue: prologueView(node, state.ratings) },
      };
    }
    const option = getPrologueOption(node, pick.choiceId);
    Object.assign(state, applyOption(state, option));
    state.timeline.push({
      nodeId: node.id,
      choiceId: pick.choiceId,
      stage: node.stage,
      headline: `${node.stage}: ${option.label}.`,
    });
    if (node.id === 'recruiting') recruitTier = recruitingTier(pick.choiceId);
  }

  // College
  const collegeYears: CollegeSeason[] = [];
  let currentSchool: SchoolRef | null = null;
  const priorSchoolIds = new Set<string>();
  for (let cy = 1; cy <= MAX_COLLEGE_YEARS; cy += 1) {
    if (!currentSchool) {
      const schools = sampleSchools(
        mulberry32(normalizeSeed(`${seed}::college-pick:${cy}`)),
        recruitTier,
        profile.market,
        6,
        priorSchoolIds,
      );
      const pick = expect(`college${cy}`);
      if (!pick) {
        return {
          status: 'awaiting_choice',
          pending: {
            nodeId: `college${cy}`,
            kind: 'college_pick',
            collegePick: { tier: recruitTier, schools },
          },
        };
      }
      currentSchool = schools.find((s) => s.id === pick.choiceId) ?? null;
      if (!currentSchool) throw new Error(`Unknown school "${pick.choiceId}"`);
      priorSchoolIds.add(currentSchool.id);
    }

    const yr = simulateCollegeYear(rng, {
      ratings: state.ratings,
      athleticism: state.athleticism,
      position: profile.position,
      school: currentSchool,
      yearNumber: cy,
    });
    state.ratings = applyGrowth(state.ratings, yr.growth);
    state.draftStock = clamp(state.draftStock + yr.draftStockDelta, 0, 100);
    collegeYears.push(yr.season);
    state.timeline.push({
      nodeId: `cy${cy}`,
      choiceId: '-',
      stage: `College · Year ${cy}`,
      headline: yr.season.headline,
    });

    const options = collegeYearOptions(cy, state.draftStock);
    const pick = expect(`cy${cy}`);
    if (!pick) {
      return {
        status: 'awaiting_choice',
        pending: {
          nodeId: `cy${cy}`,
          kind: 'college_year',
          collegeYear: {
            recap: yr.season,
            options: options.map((o) => optionView(o)),
            tier: recruitTier,
          },
        },
      };
    }
    const kind = collegeDecisionKind(pick.choiceId);
    if (!options.some((o) => o.id === pick.choiceId) || !kind) {
      throw new Error(`Unknown college decision "${pick.choiceId}"`);
    }
    if (kind === 'declare') break;
    if (kind === 'transfer') currentSchool = null;
  }

  // Each extra college year adds a year of age.
  state.age += Math.max(0, collegeYears.length - 1);

  state.college = {
    finalSchool: currentSchool?.name ?? collegeYears.at(-1)?.school ?? '',
    tier: recruitTier,
    years: collegeYears,
  } satisfies College;

  // Draft
  state.draft = simulateDraft(rng, state);
  // Higher picks usually get more room to grow, but late picks can still surprise.
  const draftSlot = state.draft.undrafted ? 62 : state.draft.pick!;
  const slotCeiling = clamp(1.19 - draftSlot * 0.0135, 0.52, 1.19);
  const stockNudge = ((state.draftStock - 55) / 100) * 0.12;
  const stealRoll = rng();
  const stealMag = rng();
  const stealChance = draftSlot >= 31 ? 0.15 : draftSlot >= 15 ? 0.08 : 0.03;
  const steal = stealRoll < stealChance ? 0.14 + stealMag * 0.3 : 0;
  state.talent = clamp(slotCeiling + stockNudge + steal + rng() ** 2 * 0.1, 0.46, 1.38);
  state.timeline.push({
    nodeId: 'draft',
    choiceId: '-',
    stage: 'Draft Night',
    headline: state.draft.undrafted
      ? 'The board empties without your name. You go undrafted.'
      : `You're taken ${ordinal(state.draft.pick!)} overall in the ${
          state.draft.round === 1 ? 'first' : 'second'
        } round.`,
  });

  // Landing spot
  const offers = landingOffers({
    seed,
    overall: overallFor(profile.position, state.ratings),
    market: profile.market,
    draft: state.draft,
  });
  {
    const pick = expect('landing');
    if (!pick) {
      return {
        status: 'awaiting_choice',
        pending: {
          nodeId: 'landing',
          kind: 'landing',
          landing: { offers: offers.map((o) => teamOfferView(o, false)), draft: state.draft },
        },
      };
    }
    const chosen = offers.find((o) => o.choiceId === pick.choiceId);
    if (!chosen) throw new Error(`Unknown landing offer "${pick.choiceId}"`);
    state.team = chosen.team;
    state.seasonsWithTeam = 0;
    state.contractYearsLeft = chosen.years;
    state.salary = chosen.salary;
    state.marketValue = chosen.salary;
    state.timeline.push({
      nodeId: 'landing',
      choiceId: pick.choiceId,
      stage: 'Landing Spot',
      headline: `You start your career with the ${chosen.team.city} ${chosen.team.name} (${money(
        chosen.salary,
      )}/yr).`,
    });
  }

  // Season loop
  let prevImpact = 0;
  // Values shown in the HUD, refreshed each season.
  let hudStatus: StatusTier = 'fringe';
  let hudTradeChance = 0;

  const nationalStanding = (): NationalStanding =>
    buildNationalStanding({
      country: profile.country,
      caps: state.nationalCaps,
      medals: state.nationalMedals,
      score: state.nationalRep,
    });

  /** Plays one national-team summer and returns any medals. */
  const runNationalSummer = (ovr: number, impact: number): AwardId[] => {
    const r = maybeInternational(rng, {
      seasonIndex: state.seasonIndex,
      age: state.age,
      overall: ovr,
      impact,
      hype: state.hype,
      countryPedigree,
      // Team USA is deep, so you need to be a star to make it.
      deepPool: profile.country === 'USA',
      status: hudStatus,
    });
    if (r.selected) {
      state.nationalCaps += 1;
      state.nationalMedals += r.awards.length;
      state.nationalRep += nationalSummerRep(r);
    }
    return r.awards;
  };

  const buildPreview = (sn: number, ovr: number, contractYr: boolean): SeasonPreview => ({
    seasonNumber: sn,
    age: state.age,
    league: state.league,
    team: state.team,
    club: state.club,
    overall: ovr,
    contractYear: contractYr,
    ratings: { ...state.ratings },
    athleticism: state.athleticism,
    durability: state.durability,
    hype: state.hype,
    salary: state.salary,
    bank: state.bank,
    marketValue: state.marketValue,
    ownedPerks: [...state.ownedPerks, ...state.yearlyPerks],
    // Works for both NBA teams and EuroLeague clubs.
    franchiseTier: (() => {
      const id = state.team?.id ?? state.club?.id;
      return id ? (state.franchiseTierSeen[id] ?? 'none') : 'none';
    })(),
    franchiseSeasons: (() => {
      const id = state.team?.id ?? state.club?.id;
      return id ? (state.franchiseSeasons[id] ?? 0) : 0;
    })(),
    franchiseProgress: (() => {
      const id = state.team?.id ?? state.club?.id;
      return id ? franchiseProgress(state.franchiseScore[id] ?? 0) : 0;
    })(),
    nationalTeam: nationalStanding(),
    statusTier: hudStatus,
    tradeChance: hudTradeChance,
    ringWindow: state.ringWindowLeft,
    chemistry: state.chemistry,
    // Highlights from last season, shown as cards.
    moments: state.moments.filter((m) => m.seasonIndex === sn - 1),
    lastSeason: state.seasons.at(-1) ?? null,
    previousOverall: state.seasons.at(-2)?.overallAfter ?? null,
  });

  while (true) {
    const seasonNumber = state.seasonIndex + 1;
    const nodeId = `s${seasonNumber}`;
    const phase = phaseFor(state.age, state.seasonIndex);
    const overall = overallFor(profile.position, state.ratings);
    const prevRole = state.seasons.at(-1)?.role;
    const approxRole: Role =
      state.league === 'overseas'
        ? 'franchise'
        : (prevRole ?? (overall >= 82 ? 'starter' : overall >= 72 ? 'rotation' : 'bench'));
    // The farewell season is never a free-agency year.
    const contractYear = state.contractYearsLeft <= 1 && !state.onFarewellTour;

    // Status and trade odds for the HUD. No randomness here.
    hudStatus = statusTier({
      overall,
      peakOverall: state.peakOverall,
      mvps: state.awards.mvp ?? 0,
      allNba:
        (state.awards.all_nba_1 ?? 0) +
        (state.awards.all_nba_2 ?? 0) +
        (state.awards.all_nba_3 ?? 0),
      allStars: state.awards.all_star ?? 0,
      hype: state.hype,
    });
    hudTradeChance =
      state.league === 'nba' && state.team
        ? tradeChance({
            teamStrength: teamStrengthFor(seed, state.team.id, state.seasonIndex),
            role: approxRole,
            contractYearsLeft: state.contractYearsLeft,
            franchiseProgress: franchiseProgress(state.franchiseScore[state.team.id] ?? 0),
            franchiseTier: state.franchiseTierSeen[state.team.id] ?? 'none',
            status: hudStatus,
            chemistry: state.chemistry,
            justTraded: state.justTraded,
          })
        : 0;

    // 1. Perks shop. Yearly perks renew first, then any purchases this season.
    const renew = renewYearlyPerks(state);
    for (const id of renew.lapsed) {
      state.timeline.push({
        nodeId: `perks${seasonNumber}`,
        choiceId: '-',
        stage: `Offseason ${seasonNumber}`,
        headline: `You let the ${getPerk(id).name.toLowerCase()} go - the bank couldn't carry it.`,
      });
    }
    while (peekNodeId() === `perks${seasonNumber}`) {
      const c = choices[ci]!;
      ci += 1;
      if (c.choiceId === 'perks_done') continue; // legacy no-op
      const perkId = perkBuyId(c.choiceId);
      const shopOpts = perkShopOptions(state, seasonNumber);
      const opt = shopOpts.find((o) => o.id === c.choiceId);
      if (!perkId || !perkExists(perkId) || !opt) {
        throw new Error(`Invalid perk purchase "${c.choiceId}"`);
      }
      Object.assign(state, applyOption(state, opt));
      const perk = getPerk(perkId);
      if (perk.kind === 'permanent') state.ownedPerks.push(perkId);
      else state.yearlyPerks.push(perkId);
      state.timeline.push({
        nodeId: `perks${seasonNumber}`,
        choiceId: c.choiceId,
        stage: `Offseason ${seasonNumber}`,
        headline: `You bring on ${perk.name.toLowerCase()} (${
          perk.kind === 'yearly' ? `${money(perk.cost)}/yr` : money(perk.cost)
        }).`,
      });
    }
    const shop: PerkShop = buildPerkShop(state, seasonNumber);

    // 2. Season decision
    let effect: SeasonEffect = {};
    let decisionHeadline: string;
    let decisionId: string;
    let scenarioId = 'free_agency';
    let tradeDemanded = false;

    if (state.league === 'overseas' && contractYear) {
      const offerNodeId = `overseas_offer${seasonNumber}`;
      const club = state.club!;
      const resign = euroResignOffer(seed, `c${seasonNumber}`, club, state.marketValue);
      const others = euroClubOffers({
        seed,
        tag: `c${seasonNumber}`,
        marketValue: state.marketValue,
        count: 2,
        excludeClubId: club.id,
      });
      const returnPay = nbaReturnSalary(state.marketValue);
      const canReturn = state.marketValue >= 13 && state.age <= 33;
      const returnTeams = canReturn ? nbaReturnTeams(seed, seasonNumber, 2) : [];
      const opts: OptionView[] = [clubOfferView(resign), ...others.map(clubOfferView)];
      for (const t of returnTeams) opts.push(nbaReturnTeamView(t, returnPay));
      if (state.retirementEligible) opts.push(RETIRE_VIEW);

      const pick = expect(offerNodeId);
      if (!pick) {
        return {
          status: 'awaiting_choice',
          pending: {
            nodeId: offerNodeId,
            kind: 'overseas_offer',
            overseasOffer: {
              reason: 'contract_up',
              options: opts,
              preview: buildPreview(seasonNumber, overall, true),
              shop,
            },
          },
        };
      }
      decisionId = pick.choiceId;
      scenarioId = 'overseas_contract';
      if (pick.choiceId === 'retire') {
        state.timeline.push({
          nodeId: offerNodeId,
          choiceId: 'retire',
          stage: `Age ${state.age}`,
          headline: 'You retire from the game, a EuroLeague career behind you.',
        });
        break;
      }
      if (pick.choiceId.startsWith('nba_return_')) {
        const backId = pick.choiceId.slice('nba_return_'.length).toUpperCase();
        const back = returnTeams.find((t) => t.id === backId) ?? getTeam(backId);
        state.league = 'nba';
        state.club = null;
        state.team = back;
        state.seasonsWithTeam = 0;
        state.salary = returnPay;
        state.contractYearsLeft = 3;
        decisionHeadline = `You sign back into the NBA with the ${back.city} ${back.name} (${money(
          returnPay,
        )}/yr).`;
      } else if (pick.choiceId === 'euro_stay') {
        state.salary = resign.salary;
        state.contractYearsLeft = resign.years + 1;
        decisionHeadline = `You re-sign with ${club.name} (${money(resign.salary)}/yr).`;
      } else {
        const chosen = others.find((o) => o.choiceId === pick.choiceId);
        if (!chosen) throw new Error(`Unknown club offer "${pick.choiceId}"`);
        state.club = chosen.club;
        state.seasonsWithTeam = 0;
        state.salary = chosen.salary;
        state.contractYearsLeft = chosen.years + 1;
        decisionHeadline = `You move to ${chosen.club.name} in ${chosen.club.country} (${money(
          chosen.salary,
        )}/yr).`;
      }
      state.timeline.push({
        nodeId: offerNodeId,
        choiceId: pick.choiceId,
        stage: `Age ${state.age}`,
        headline: decisionHeadline,
      });
    } else if (state.league === 'nba' && contractYear && state.team !== null) {
      const faOffers = freeAgencyOffers({
        seed,
        seasonIndex: state.seasonIndex,
        overall,
        age: state.age,
        market: profile.market,
        currentTeamId: state.team.id,
        marketValue: state.marketValue,
      });
      const options = faOffers.map((o) => teamOfferView(o, o.team.id === state.team!.id));
      if (state.retirementEligible) options.push(RETIRE_VIEW);
      const decision: SeasonDecisionNode = {
        nodeId,
        kind: 'free_agency',
        age: state.age,
        phase,
        scenarioId: 'free_agency',
        theme: 'contract',
        title: 'FREE AGENCY',
        prompt: 'Your contract is up. Where do you sign?',
        options,
      };
      const pick = expect(nodeId);
      if (!pick) {
        return {
          status: 'awaiting_choice',
          pending: {
            nodeId,
            kind: 'season',
            season: { decision, preview: buildPreview(seasonNumber, overall, true), shop },
          },
        };
      }
      decisionId = pick.choiceId;
      if (pick.choiceId === 'retire') {
        state.timeline.push({
          nodeId,
          choiceId: 'retire',
          stage: `Age ${state.age}`,
          headline: 'You announce your retirement to a standing ovation.',
        });
        break;
      }
      const offer = faOffers.find((o) => o.choiceId === pick.choiceId);
      if (!offer) throw new Error(`Unknown free-agency offer "${pick.choiceId}"`);
      const resign = offer.team.id === state.team.id;
      // Re-signing keeps the same team history, only the contract changes.
      if (!resign) state.seasonsWithTeam = 0;
      state.team = offer.team;
      state.contractYearsLeft = offer.years + 1;
      state.salary = offer.salary;
      decisionHeadline = resign
        ? `You sign a ${offer.years}-year extension with the ${offer.team.city} ${offer.team.name} (${money(
            offer.salary,
          )}/yr).`
        : `You sign with the ${offer.team.city} ${offer.team.name} (${offer.years}yr, ${money(
            offer.salary,
          )}/yr).`;
    } else {
      const scenario = pickScenario(rng, {
        seasonNumber,
        age: state.age,
        phase,
        role: approxRole,
        overall,
        market: profile.market,
        hype: state.hype,
        durability: state.durability,
        hasAward: (id) => (state.awards[id as keyof typeof state.awards] ?? 0) > 0,
        firedScenarioIds: new Set(state.firedScenarioIds),
      });
      scenarioId = scenario.id;
      const options = scenario.options.map((o) => optionView(o, state.ratings));
      // The farewell season has no re-signing, trade demands or early retirement.
      const scripted = state.onFarewellTour || state.farewellChosen;
      // Stars on a settled roster can demand a trade.
      const canDemandTrade =
        state.league === 'nba' &&
        state.team !== null &&
        !state.justTraded &&
        !contractYear &&
        !scripted &&
        state.seasonIndex >= 2 &&
        statusRank(hudStatus) >= statusRank('star');
      if (canDemandTrade) options.push(DEMAND_TRADE_VIEW);
      if (state.retirementEligible && !scripted) options.push(RETIRE_VIEW);
      const decision: SeasonDecisionNode = {
        nodeId,
        kind: 'scenario',
        age: state.age,
        phase,
        scenarioId: scenario.id,
        theme: scenario.theme,
        title: scenario.title,
        prompt: scenario.prompt,
        options,
      };
      const pick = expect(nodeId);
      if (!pick) {
        return {
          status: 'awaiting_choice',
          pending: {
            nodeId,
            kind: 'season',
            season: { decision, preview: buildPreview(seasonNumber, overall, contractYear), shop },
          },
        };
      }
      decisionId = pick.choiceId;
      if (pick.choiceId === 'retire') {
        state.timeline.push({
          nodeId,
          choiceId: 'retire',
          stage: `Age ${state.age}`,
          headline: 'You announce your retirement to a standing ovation.',
        });
        break;
      }
      if (pick.choiceId === 'demand_trade') {
        if (!canDemandTrade) throw new Error('demand_trade not available this season');
        tradeDemanded = true;
        effect.forceTrade = true;
        // Leaving burns some goodwill with the old team.
        if (state.team && (state.franchiseSeasons[state.team.id] ?? 0) > 0) {
          state.franchiseScore[state.team.id] = (state.franchiseScore[state.team.id] ?? 0) - 14;
        }
        decisionHeadline = 'You demand a trade. The front office starts shopping you.';
        state.timeline.push({
          nodeId,
          choiceId: 'demand_trade',
          stage: `Age ${state.age}`,
          headline: decisionHeadline,
        });
      } else {
        const found = findScenarioOption(pick.choiceId);
        if (!found || found.scenario.id !== scenarioId) {
          throw new Error(`Unknown scenario option "${pick.choiceId}" for "${scenarioId}"`);
        }
        const option = found.scenario.options.find((o) => o.id === pick.choiceId)!;
        Object.assign(state, applyOption(state, option));
        effect = stanceToEffect(option.stance);
        decisionHeadline = `${decision.title}: ${option.label}.`;
        if (scenarioId === 'scn_shoe_deal') {
          state.shoeDeal = SHOE_BRANDS[pick.choiceId] ?? state.shoeDeal;
        }
        if (!state.firedScenarioIds.includes(scenarioId)) state.firedScenarioIds.push(scenarioId);
      }
    }

    // 3. Mid-season situation. NBA only, and the roll always happens so later seasons stay the same.
    let midId: string | null = null;
    let midHeadline: string | null = null;
    const midFires =
      seasonNumber >= 3 && rng() < 0.3 && state.league === 'nba' && !state.onFarewellTour;
    if (midFires) {
      const mid = pickMidseason(rng, {
        seasonNumber,
        age: state.age,
        phase,
        role: approxRole,
        overall,
        market: profile.market,
        hype: state.hype,
        durability: state.durability,
        hasAward: (id) => (state.awards[id as keyof typeof state.awards] ?? 0) > 0,
        firedScenarioIds: new Set(state.firedScenarioIds),
      });
      if (mid) {
        const msNodeId = `ms${seasonNumber}`;
        const msDecision: SeasonDecisionNode = {
          nodeId: msNodeId,
          kind: 'midseason',
          age: state.age,
          phase,
          scenarioId: mid.id,
          theme: mid.theme,
          title: mid.title,
          prompt: mid.prompt,
          options: mid.options.map((o) => optionView(o)),
        };
        const pick = expect(msNodeId);
        if (!pick) {
          return {
            status: 'awaiting_choice',
            pending: {
              nodeId: msNodeId,
              kind: 'midseason',
              midseason: {
                decision: msDecision,
                preview: buildPreview(seasonNumber, overall, contractYear),
              },
            },
          };
        }
        const found = findMidseasonOption(pick.choiceId);
        if (!found || found.scenario.id !== mid.id) {
          throw new Error(`Unknown mid-season option "${pick.choiceId}"`);
        }
        Object.assign(state, applyOption(state, found.option)); // small hype flavour only
        const mr = resolveMidseason(rng, pick.choiceId, {
          role: approxRole,
          phase,
          age: state.age,
        });
        effect = mergeEffects(effect, mr.effect);
        if (state.league === 'nba' && state.team && mr.franchiseDelta) {
          state.franchiseScore[state.team.id] =
            (state.franchiseScore[state.team.id] ?? 0) + mr.franchiseDelta;
        }
        if (mr.chemistryDelta) {
          effect = mergeEffects(effect, { chemistry: mr.chemistryDelta });
        }
        midId = mid.id;
        // Shown in the season recap instead of its own card.
        midHeadline = `${mid.title}: ${found.option.label} - ${mr.note}`;
        if (!state.firedScenarioIds.includes(mid.id)) state.firedScenarioIds.push(mid.id);
      }
    }

    // 3b. Chemistry question. NBA only, about once every 2 to 3 seasons.
    let chemHeadline: string | null = null;
    const chemEligible =
      state.league === 'nba' &&
      state.team !== null &&
      seasonNumber - state.lastChemistrySeason >= 2;
    if (chemEligible && rng() < 0.6) {
      state.lastChemistrySeason = seasonNumber;
      const chm = pickChemistryScenario(rng, new Set(state.firedChemistryIds));
      const chNodeId = `chem${seasonNumber}`;
      const chDecision: SeasonDecisionNode = {
        nodeId: chNodeId,
        kind: 'chemistry',
        age: state.age,
        phase,
        scenarioId: chm.id,
        theme: 'team',
        title: chm.title,
        prompt: chm.prompt,
        options: chm.options.map((o) => optionView(o)),
      };
      const pick = expect(chNodeId);
      if (!pick) {
        return {
          status: 'awaiting_choice',
          pending: {
            nodeId: chNodeId,
            kind: 'chemistry',
            chemistry: {
              decision: chDecision,
              preview: buildPreview(seasonNumber, overall, contractYear),
            },
          },
        };
      }
      const found = findChemistryOption(pick.choiceId);
      if (!found || found.scenario.id !== chm.id) {
        throw new Error(`Unknown chemistry option "${pick.choiceId}"`);
      }
      const cr = resolveChemistry(rng, chm.id, pick.choiceId);
      effect = mergeEffects(effect, cr.effect);
      const optLabel = chm.options.find((o) => o.id === pick.choiceId)?.label ?? '';
      // Shown in the season recap instead of its own card.
      chemHeadline = `${chm.title}: ${optLabel} - ${cr.note}`;
      if (!state.firedChemistryIds.includes(chm.id)) state.firedChemistryIds.push(chm.id);
    }
    if (chemHeadline) midHeadline = midHeadline ? `${midHeadline} ${chemHeadline}` : chemHeadline;

    // 4. Simulate the season
    const perkAgg = aggregatePerkEffect(state);
    effect = mergeEffects(effect, perkToSeasonEffect(perkAgg));

    const preStrength =
      state.league === 'overseas'
        ? clamp(state.club?.prestige ?? 0.6, 0.3, 0.9)
        : teamStrengthFor(seed, state.team!.id, state.seasonIndex);

    // A mid-season situation replaces the random event.
    const evt =
      midId !== null
        ? { id: midId, headline: midHeadline ?? '', effect: {} as SeasonEffect }
        : rollEvent(rng, {
            age: state.age,
            role: approxRole,
            teamStrength: preStrength,
            contractYearsLeft: state.contractYearsLeft,
            seasonIndex: state.seasonIndex,
            slumpResist: perkAgg.slumpResist,
          });
    effect = mergeEffects(effect, evt.effect);
    if (effect.injuredGames && perkAgg.injuryResist > 0) {
      effect.injuredGames = Math.round(effect.injuredGames * (1 - perkAgg.injuryResist));
    }

    // Injury roll. More likely with low durability and age, less likely with medical perks.
    const injury = rollSeasonInjury(rng, {
      age: state.age,
      durability: state.durability,
      injuryCount: state.injuryHistory.length,
      injuryResist: perkAgg.injuryResist,
    });
    if (injury) {
      effect.injuredGames = injury.seasonEnding
        ? 82
        : (effect.injuredGames ?? 0) + injury.gamesMissed;
      effect.athleticism = (effect.athleticism ?? 0) - injury.athleticismHit;
      effect.durability = (effect.durability ?? 0) - injury.durabilityHit;
      if (injury.overallHit > 0) effect.overallHit = (effect.overallHit ?? 0) + injury.overallHit;
      if (injury.careerEnding) effect.careerEnding = true;
      if (injury.retirementEligible) effect.retirementEligible = true;
      state.pendingInjury = {
        seasonIndex: seasonNumber,
        type: injury.type,
        gamesMissed: injury.gamesMissed,
        severity: injury.severity,
      };
    }

    // Chance of being traded away. Never during the farewell season.
    if (
      !effect.forceTrade &&
      !state.justTraded &&
      state.league === 'nba' &&
      state.team &&
      !state.onFarewellTour &&
      state.seasonsWithTeam >= 2 &&
      rng() < hudTradeChance
    ) {
      effect.forceTrade = true;
    }

    let tradedThisSeason = false;
    if (effect.forceTrade && state.league === 'nba' && state.team && !state.onFarewellTour) {
      state.team = pickTradeTeam(rng, state.team.id);
      state.seasonsWithTeam = 0;
      tradedThisSeason = true;
      // New team, chemistry starts closer to neutral.
      state.chemistry = clamp(Math.round(state.chemistry * 0.4 + 33), 0, 100);
      // A forced trade usually shortens the contender window.
      if (!tradeDemanded && state.ringWindowLeft > 0) {
        state.ringWindowLeft = Math.max(0, state.ringWindowLeft - 2);
      }
    }

    // After a title the team stays a contender for a few years, with fading odds.
    if (state.league === 'nba' && state.ringWindowLeft > 0) {
      effect = mergeEffects(effect, {
        teamMult: 1 + 0.12 * (0.45 + 0.55 * (state.ringWindowLeft / 5)),
      });
    }

    // Overall hits are spread across every rating and capped at 3 per season.
    if (effect.overallHit && effect.overallHit > 0) {
      const drop = Math.min(effect.overallHit, 3);
      const r: Partial<Ratings> = { ...(effect.ratings ?? {}) };
      for (const k of RATING_KEYS) r[k] = (r[k] ?? 0) - drop;
      effect.ratings = r;
    }

    // Chemistry settles higher the longer you stay with a team.
    const tenure = state.league === 'nba' ? Math.min(state.seasonsWithTeam, 8) : 0;
    const chemTarget = 42 + tenure * 4; // 42 fresh ... 74 after 8 years together
    const chemDrift =
      state.chemistry < chemTarget
        ? Math.min(6, chemTarget - state.chemistry)
        : state.chemistry > chemTarget + 6
          ? -2
          : 0;
    // Bonding helps more with a team you know.
    const familiarity = 1 + Math.min(state.seasonsWithTeam, 6) * 0.08; // up to 1.48x
    const swing = effect.chemistry ?? 0;
    state.chemistry = clamp(
      Math.round(state.chemistry + chemDrift + (swing > 0 ? swing * familiarity : swing)),
      0,
      100,
    );

    const teamStrength =
      state.league === 'overseas'
        ? preStrength
        : teamStrengthFor(seed, state.team!.id, state.seasonIndex);
    const archetype = getArchetype(profile.archetype);

    // Growth nudges from past decisions and perks.
    const growthBias: Partial<Record<RatingKey, number>> = {};
    for (const gb of state.growthBiases) {
      for (const [k, v] of Object.entries(gb.ratings)) {
        growthBias[k as RatingKey] = (growthBias[k as RatingKey] ?? 0) + (v ?? 0);
      }
    }
    for (const [k, v] of Object.entries(perkAgg.growthBias)) {
      growthBias[k as RatingKey] = (growthBias[k as RatingKey] ?? 0) + (v ?? 0);
    }

    const overallBefore = overallFor(profile.position, state.ratings);
    const grown = growSeason(rng, {
      ratings: state.ratings,
      athleticism: state.athleticism,
      age: state.age,
      talent: state.talent,
      archetype,
      effect,
      growthBias,
      availability: clamp(1 - (effect.injuredGames ?? 0) / 82, 0.12, 1),
    });
    state.ratings = grown.ratings;
    state.athleticism = grown.athleticism;
    // Round so durability is always stored as a whole number.
    state.durability = clamp(
      Math.round(state.durability + (effect.durability ?? 0) + grown.durabilityDelta),
      20,
      100,
    );
    state.hype = clamp(Math.round(state.hype + (effect.hype ?? 0)), 0, 100);
    state.growthBiases = state.growthBiases
      .map((gb) => ({ ...gb, seasonsLeft: gb.seasonsLeft - 1 }))
      .filter((gb) => gb.seasonsLeft > 0);

    const overallAfter = overallFor(profile.position, state.ratings);
    state.peakOverall = Math.max(state.peakOverall, overallAfter);

    let lastRole: Role = approxRole;
    let gamesMissed: number;

    if (state.league === 'overseas') {
      const os = simulateOverseasSeason(rng, {
        ratings: state.ratings,
        athleticism: state.athleticism,
        position: profile.position,
        age: state.age,
        durability: state.durability,
        effect,
        previousStats: state.lastPlayedStats,
        clubPrestige: state.club?.prestige ?? 0.7,
      });
      const osAwards = [...os.awards, ...runNationalSummer(overallAfter, os.impact)];
      for (const a of osAwards) tallyAward(state.awards, a);
      gamesMissed = 82 - os.stats.gp;
      state.overseasSeasons.push({
        index: seasonNumber,
        age: state.age,
        club: state.club!.name,
        country: state.club!.country,
        stats: os.stats,
        result: os.result,
        awards: osAwards,
        salary: state.salary,
        headline: midHeadline ? `${midHeadline} ${os.headline}` : os.headline,
        grade: gradeOverseasSeason({
          awards: osAwards,
          result: os.result,
          impact: os.impact,
          gamesPlayed: os.stats.gp,
        }),
      });
      const EURO_MOMENT: Partial<Record<string, string>> = {
        euroleague_champion: 'EUROLEAGUE CHAMPION',
        euroleague_mvp: 'EUROLEAGUE MVP',
        euro_domestic_title: 'DOMESTIC LEAGUE TITLE',
      };
      for (const a of osAwards) {
        const title = EURO_MOMENT[a];
        if (!title) continue;
        state.moments.push({
          seasonIndex: seasonNumber,
          kind: a === 'euroleague_champion' ? 'ring' : 'award',
          id: a,
          awardId: a,
          title,
          subtitle: `Age ${state.age} · ${state.club!.name}, ${state.club!.country}`,
        });
      }
      // Standing with the overseas club
      const clubId = state.club!.id;
      state.seasonsWithTeam += 1;
      state.franchiseSeasons[clubId] = (state.franchiseSeasons[clubId] ?? 0) + 1;
      if (os.result === 'euroleague_champion') {
        state.franchiseRings[clubId] = (state.franchiseRings[clubId] ?? 0) + 1;
      }
      state.franchiseScore[clubId] =
        (state.franchiseScore[clubId] ?? 0) +
        overseasFranchiseRep({
          awards: osAwards,
          result: os.result,
          seasonsWithClub: state.seasonsWithTeam,
          played: os.stats.gp > 0,
        });
      const clubProvTier = franchiseTier(state.franchiseScore[clubId], {
        rings: state.franchiseRings[clubId] ?? 0,
        seasons: state.franchiseSeasons[clubId] ?? 0,
        historic: state.peakOverall >= 90,
      });
      const clubSeenRank = tierRank(state.franchiseTierSeen[clubId] ?? 'none');
      if (tierRank(clubProvTier) > clubSeenRank) state.franchiseTierSeen[clubId] = clubProvTier;

      if (os.stats.gp > 0) state.lastPlayedStats = os.stats;
      prevImpact = os.impact;
    } else {
      const role = roleFor({
        overall: overallAfter,
        teamStrength,
        isRookie: state.seasonIndex === 0,
        effect,
        previousRole: prevRole,
        allowJump: Math.abs(overallAfter - overallBefore) >= 6 || state.lastPlayedStats === null,
      });
      lastRole = role;
      const sim = simulateSeason(rng, {
        ratings: state.ratings,
        athleticism: state.athleticism,
        position: profile.position,
        role,
        age: state.age,
        durability: state.durability,
        effect,
        previousStats: state.lastPlayedStats,
        previousRole: prevRole,
      });
      gamesMissed = sim.gamesMissed;

      // Conference seed for this year, then how far the team goes in the playoffs.
      const confSeed = conferenceSeed(seed, state.team!.id, state.seasonIndex, sim.impact);
      const playoffResult: TeamResult =
        sim.stats.gp === 0
          ? 'missed_season'
          : simulatePlayoffs(rng, { seed: confSeed, playerImpact: sim.impact, effect });

      // The Finals are decided by the player's call. It uses its own RNG so replays stay identical.
      let teamResult: TeamResult = playoffResult;
      let finalsHeadline: string | null = null;
      if (playoffResult === 'champion' || playoffResult === 'finals') {
        const finalsNodeId = `finals${seasonNumber}`;
        const edge = finalsEdge({
          teamStrength,
          playerImpact: sim.impact,
          ringWindow: state.ringWindowLeft,
        });
        const game = buildFinalsGame(derivedRng(seed, 'finals', seasonNumber));
        const pick = expect(finalsNodeId);
        if (!pick) {
          return {
            status: 'awaiting_choice',
            pending: {
              nodeId: finalsNodeId,
              kind: 'finals',
              finals: { game, preview: buildPreview(seasonNumber, overallAfter, contractYear) },
            },
          };
        }
        const fr = resolveFinals(game.scenarioId, pick.choiceId, edge);
        teamResult = fr.won ? 'champion' : 'finals';
        finalsHeadline = fr.won
          ? `NBA Finals: ${fr.outcome}`
          : `NBA Finals, and it falls short: ${fr.outcome}`;
        state.timeline.push({
          nodeId: finalsNodeId,
          choiceId: pick.choiceId,
          stage: `Age ${state.age}`,
          headline: finalsHeadline,
        });
      }

      // A title keeps the team a contender for 5 seasons.
      if (teamResult === 'champion') state.ringWindowLeft = 5;

      // Status from this season's overall, used by the MVP and DPOY odds.
      const seasonStatus = statusTier({
        overall: overallAfter,
        peakOverall: state.peakOverall,
        mvps: state.awards.mvp ?? 0,
        allNba:
          (state.awards.all_nba_1 ?? 0) +
          (state.awards.all_nba_2 ?? 0) +
          (state.awards.all_nba_3 ?? 0),
        allStars: state.awards.all_star ?? 0,
        hype: state.hype,
      });
      const defenseRating = defenseRatingOf(
        state.ratings.interiorDefense,
        state.ratings.perimeterDefense,
      );

      const seasonAwards = [
        ...resolveAwards({
          rng,
          seasonIndex: state.seasonIndex,
          stats: sim.stats,
          role,
          impact: sim.impact,
          defImpact: sim.defImpact,
          prevImpact,
          teamResult,
          archetype,
          effect,
          position: profile.position,
          defenseRating,
          status: seasonStatus,
        }),
        ...runNationalSummer(overallAfter, sim.impact),
      ];
      for (const a of seasonAwards) tallyAward(state.awards, a);

      // Standing with this team
      const teamId = state.team!.id;
      state.seasonsWithTeam += 1;
      state.franchiseSeasons[teamId] = (state.franchiseSeasons[teamId] ?? 0) + 1;
      if (teamResult === 'champion') {
        state.franchiseRings[teamId] = (state.franchiseRings[teamId] ?? 0) + 1;
      }
      state.franchiseScore[teamId] =
        (state.franchiseScore[teamId] ?? 0) +
        seasonFranchiseRep({
          role,
          teamResult,
          awards: seasonAwards,
          seasonsWithTeam: state.seasonsWithTeam,
          played: sim.stats.gp > 0,
        });
      // Temporary tier until the career ends.
      const provTier = franchiseTier(state.franchiseScore[teamId], {
        rings: state.franchiseRings[teamId] ?? 0,
        seasons: state.franchiseSeasons[teamId] ?? 0,
        historic: state.peakOverall >= 90,
      });
      const seenRank = tierRank(state.franchiseTierSeen[teamId] ?? 'none');
      const tierUp = tierRank(provTier) > seenRank ? provTier : null;
      if (tierUp) state.franchiseTierSeen[teamId] = tierUp;

      // A short recap line for the season, with its own RNG.
      const recap = seasonRecap(derivedRng(seed, 'recap', seasonNumber), {
        result: teamResult,
        missedGames: sim.gamesMissed,
      });
      const grade = gradeSeason({
        awards: seasonAwards,
        teamResult,
        seed: confSeed,
        impact: sim.impact,
        role,
        gamesPlayed: sim.stats.gp,
      });

      // Big moments
      const pointsBefore = state.seasons.reduce((n, s) => n + s.stats.gp * s.stats.ppg, 0);
      state.seasons.push({
        index: seasonNumber,
        age: state.age,
        league: 'nba',
        teamId,
        role,
        phase,
        scenarioId,
        decisionId,
        decisionHeadline,
        eventId: evt.id,
        eventHeadline: evt.headline,
        midseasonId: midId,
        midseasonHeadline: midHeadline,
        finalsHeadline,
        stats: sim.stats,
        teamResult,
        awards: seasonAwards,
        overallAfter,
        ratingsAfter: { ...state.ratings },
        injuredGames: sim.gamesMissed,
        salary: state.salary,
        recap,
        seed: confSeed,
        grade,
      });
      const pointsAfter = pointsBefore + sim.stats.gp * sim.stats.ppg;
      for (const m of detectSeasonMoments({
        seasonIndex: seasonNumber,
        age: state.age,
        teamId,
        teamLabel: teamLabel(teamId),
        seasonAwards,
        tallyAfter: state.awards,
        teamResult,
        traded: tradedThisSeason,
        tradeDemanded,
        pointsBefore,
        pointsAfter,
        franchiseTierUp: tierUp,
      })) {
        state.moments.push(m);
      }

      if (sim.stats.gp > 0) state.lastPlayedStats = sim.stats;
      prevImpact = sim.impact;
    }

    if (state.pendingInjury) {
      // Record the injury and the games it actually cost.
      const entry = { ...state.pendingInjury, gamesMissed: Math.max(gamesMissed, 1) };
      state.injuryHistory.push(entry);
      if (entry.severity === 'moderate' || entry.severity === 'severe') {
        const ended = state.careerEndingInjury || effect.careerEnding;
        state.moments.push({
          seasonIndex: seasonNumber,
          kind: 'injury',
          id: `injury_${entry.type.replace(/[^a-z]+/gi, '_').toLowerCase()}`,
          title: entry.type.toUpperCase(),
          subtitle: `Age ${state.age} · ${entry.gamesMissed} of 82 missed${
            ended ? ' · career over' : entry.gamesMissed >= 82 ? ' · out for the season' : ''
          }`,
          teamId: state.team?.id,
        });
      }
      state.pendingInjury = null;
    } else if (gamesMissed >= 25) {
      state.injuryHistory.push({
        seasonIndex: seasonNumber,
        type: 'nagging injuries',
        gamesMissed,
        severity: 'strain',
      });
    }

    // 4b. Fame comes from how you played, the awards you won and any off-court drama.
    const lastNba = state.seasons.at(-1);
    const seasonAwardCount =
      (lastNba?.index === seasonNumber ? lastNba.awards.length : 0) +
      state.overseasSeasons
        .filter((o) => o.index === seasonNumber)
        .reduce((n, o) => n + o.awards.length, 0);
    const wonRing = lastNba?.index === seasonNumber && lastNba.teamResult === 'champion';
    const perfHype =
      clamp((prevImpact - 15) * 0.5, -5, 8) +
      seasonAwardCount * 2 +
      (wonRing ? 5 : 0) -
      (state.hype > 70 ? 1.5 : 0); // fame fades a touch if you go quiet
    state.hype = clamp(Math.round(state.hype + perfHype), 0, 100);

    // 5. Money
    settleSeasonPay(state);
    recomputeMarketValue(state, { overall: overallAfter, lastImpact: prevImpact }, perkAgg);
    tickValueMods(state);

    // 6. Advance the clock
    state.age += 1;
    state.seasonIndex += 1;
    state.contractYearsLeft = Math.max(0, state.contractYearsLeft - 1);
    if (state.ringWindowLeft > 0 && !(state.league === 'nba' && wonRing)) {
      state.ringWindowLeft -= 1;
    }
    state.justTraded = tradedThisSeason;

    if (effect.careerEnding) {
      state.careerEndingInjury = true;
      state.forcedRetire = true;
      state.timeline.push({
        nodeId,
        choiceId: '-',
        stage: `Age ${state.age - 1}`,
        headline: 'The injury is career-ending. Just like that, it’s over.',
      });
    }
    if (effect.retirementEligible) state.retirementEligible = true;

    // A player under a multi-year deal can't be cut or age out until it ends.
    const underContract = state.contractYearsLeft > 1;

    // The farewell season is done.
    if (state.onFarewellTour) {
      state.onFarewellTour = false;
      state.forcedRetire = true;
    }

    if (state.league === 'nba') {
      if (state.age >= 34 && overallAfter <= state.peakOverall - 4) state.retirementEligible = true;
      if (state.age >= 35) state.retirementEligible = true;

      // Early washout for players who never develop, more likely for late picks.
      const draftPick = state.draft?.pick ?? null;
      const draftRisk = state.draft?.undrafted
        ? 0.32
        : draftPick === null
          ? 0
          : draftPick >= 46
            ? 0.3
            : draftPick >= 31
              ? 0.2
              : draftPick >= 21
                ? 0.08
                : draftPick >= 15
                  ? 0.03
                  : 0;
      const washCeil = draftRisk >= 0.14 ? 78 : 73;
      const earlyWashout =
        !state.forcedRetire &&
        !underContract &&
        state.seasonIndex >= 2 &&
        state.seasonIndex <= 13 &&
        (lastRole === 'fringe' ||
          lastRole === 'bench' ||
          (draftRisk >= 0.14 && lastRole === 'rotation')) &&
        overallAfter < washCeil &&
        state.talent < 1.0 &&
        rng() < 0.32 + draftRisk;
      // A washed-out player who is still good enough can go to the EuroLeague.
      const euroInterest = overallAfter >= 64 && state.age <= 33;

      // Age-related retirement, usually from the mid-30s to about 40.
      if (!underContract) {
        if (state.age >= 34 && overallAfter < 70) state.forcedRetire = true;
        if (state.age >= 35 && overallAfter <= state.peakOverall - 7 && rng() < 0.45)
          state.forcedRetire = true;
        if (state.age >= 36 && overallAfter < 76 && rng() < 0.6) state.forcedRetire = true;
        if (state.age >= 37 && overallAfter < 80) state.forcedRetire = true;
        if (state.age >= 37 && rng() < 0.28) state.forcedRetire = true;
        if (state.age >= 38 && overallAfter < 84) state.forcedRetire = true;
        if (state.age >= 39 && rng() < 0.55) state.forcedRetire = true;
        if (state.age >= 41) state.forcedRetire = true;
      }

      if (
        earlyWashout &&
        euroInterest &&
        !state.forcedRetire &&
        !state.careerEndingInjury &&
        state.age <= 33
      ) {
        const offerNodeId = `overseas_offer${state.seasonIndex}`;
        const clubs = euroClubOffers({
          seed,
          tag: `w${state.seasonIndex}`,
          marketValue: Math.max(state.marketValue, 5),
          count: 3,
        });
        const opts: OptionView[] = [...clubs.map(clubOfferView), RETIRE_VIEW];
        const pick = expect(offerNodeId);
        if (!pick) {
          return {
            status: 'awaiting_choice',
            pending: {
              nodeId: offerNodeId,
              kind: 'overseas_offer',
              overseasOffer: {
                reason: 'washed_out',
                options: opts,
                preview: buildPreview(state.seasonIndex + 1, overallAfter, false),
              },
            },
          };
        }
        if (pick.choiceId === 'retire') {
          state.timeline.push({
            nodeId: offerNodeId,
            choiceId: 'retire',
            stage: `Age ${state.age - 1}`,
            headline: 'The NBA offers dry up. You call it a career.',
          });
          break;
        }
        const chosen = clubs.find((o) => o.choiceId === pick.choiceId);
        if (!chosen) throw new Error(`Unknown club offer "${pick.choiceId}"`);
        state.league = 'overseas';
        state.club = chosen.club;
        state.team = null;
        state.seasonsWithTeam = 0;
        state.salary = chosen.salary;
        state.contractYearsLeft = chosen.years + 1;
        state.retirementEligible = true;
        state.timeline.push({
          nodeId: offerNodeId,
          choiceId: pick.choiceId,
          stage: `Age ${state.age - 1}`,
          headline: `The NBA chapter closes. You sign with ${chosen.club.name} in ${chosen.club.country}.`,
        });
      } else if (earlyWashout) {
        state.forcedRetire = true;
        state.timeline.push({
          nodeId,
          choiceId: '-',
          stage: `Age ${state.age - 1}`,
          headline: 'The league moves on without you. Your NBA career is over.',
        });
      }
    } else {
      state.retirementEligible = true;
      if (!underContract) {
        if (state.age >= 41) state.forcedRetire = true;
        else if (state.age >= 39 && rng() < 0.55) state.forcedRetire = true;
        else if (state.age >= 37 && overallAfter < 72) state.forcedRetire = true;
      }
    }

    // 6b. Farewell choice when age ends the career. Skipped after a career-ending injury or washout.
    if (
      state.forcedRetire &&
      !state.careerEndingInjury &&
      !state.farewellChosen &&
      state.age >= 33 &&
      state.seasons.length + state.overseasSeasons.length >= 3
    ) {
      const farewellNode = `farewell${state.seasonIndex}`;
      const pick = expect(farewellNode);
      if (!pick) {
        return {
          status: 'awaiting_choice',
          pending: {
            nodeId: farewellNode,
            kind: 'farewell',
            farewell: {
              options: [FAREWELL_TOUR_VIEW, QUIET_GOODBYE_VIEW],
              preview: buildPreview(state.seasonIndex + 1, overallAfter, false),
            },
          },
        };
      }
      state.farewellChosen = true;
      if (pick.choiceId === 'farewell_tour') {
        // One last season, then retire.
        state.forcedRetire = false;
        state.onFarewellTour = true;
        state.retirementEligible = true;
        state.contractYearsLeft = 2;
        state.hype = clamp(state.hype + 4, 0, 100);
        state.timeline.push({
          nodeId: farewellNode,
          choiceId: pick.choiceId,
          stage: `Age ${state.age}`,
          headline: 'You announce next season is your last - a farewell tour, arena by arena.',
        });
      } else {
        // Retire now.
        state.forcedRetire = true;
        state.onFarewellTour = false;
        state.timeline.push({
          nodeId: farewellNode,
          choiceId: pick.choiceId,
          stage: `Age ${state.age}`,
          headline: 'No tour, no speeches - you quietly step away from the game.',
        });
      }
    }

    if (state.forcedRetire) break;
    if (state.seasonIndex >= MAX_SEASONS) break;
  }

  if (ci < choices.length) {
    throw new Error(`Too many choices: the career ended after ${state.seasons.length} seasons`);
  }
  return { status: 'complete', summary: buildSummary(args, state, ci) };
}

function buildSummary(args: RunCareerArgs, state: CareerState, consumed: number): CareerSummary {
  const totals = buildCareerTotals(state.seasons);

  // Legacy is computed twice because jersey retirement and the legend tier depend on each other.
  const roughLegacy = buildLegacy({
    seed: args.seed,
    awards: state.awards,
    totals,
    peakOverall: state.peakOverall,
    seasons: state.seasons,
    overseasSeasons: state.overseasSeasons,
    franchises: [],
  });
  const franchises = buildFranchiseStandings({
    score: state.franchiseScore,
    seasons: state.franchiseSeasons,
    rings: state.franchiseRings,
    historic: roughLegacy.score >= 720,
  });
  const legacy = buildLegacy({
    seed: args.seed,
    awards: state.awards,
    totals,
    peakOverall: state.peakOverall,
    seasons: state.seasons,
    overseasSeasons: state.overseasSeasons,
    franchises,
  });

  const finalRatings = { ...state.ratings };
  const rookieTeamId = state.seasons[0]?.teamId ?? state.team?.id;

  // Only keep the biggest career points milestone.
  const topPointsMark = Math.max(
    0,
    ...state.moments
      .filter((m) => m.id.startsWith('points_'))
      .map((m) => Number(m.id.slice('points_'.length))),
  );
  const moments = state.moments.filter(
    (m) => !m.id.startsWith('points_') || Number(m.id.slice('points_'.length)) === topPointsMark,
  );

  return {
    engineVersion: ENGINE_VERSION,
    seed: normalizeSeed(args.seed),
    profile: args.profile,
    choices: args.choices.slice(0, consumed),
    draft: state.draft!,
    college: state.college,
    rookieTeam: getTeam(rookieTeamId!),
    seasons: state.seasons,
    finalRatings,
    finalOverall: overallFor(args.profile.position, finalRatings),
    peakOverall: state.peakOverall,
    awards: state.awards,
    careerTotals: totals,
    legacy,
    timeline: state.timeline,
    careerEarnings: state.careerEarnings,
    peakSalary: state.peakSalary,
    perks: [...state.ownedPerks, ...state.yearlyPerks],
    shoeDeal: state.shoeDeal,
    overseasSeasons: state.overseasSeasons,
    injuryHistory: state.injuryHistory,
    franchises,
    moments,
    nationalTeam: buildNationalStanding({
      country: args.profile.country,
      caps: state.nationalCaps,
      medals: state.nationalMedals,
      score: state.nationalRep,
    }),
  };
}
