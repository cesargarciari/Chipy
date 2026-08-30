import { getArchetype } from './archetypes.js';
import { createInitialState, tallyAward } from './career.js';
import { getCountry } from './data/countries.js';
import { getPerk, perkExists } from './data/perks.js';
import { getTeam, teamLabel, TEAMS } from './data/teams.js';
import { simulateDraft } from './draft.js';
import { applyOption, optionView } from './options.js';
import { overallFor } from './ratings.js';
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
  nbaReturnView,
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
import {
  derivedRng,
  roleFor,
  simulatePlayoffs,
  simulateSeason,
  teamStrengthFor,
} from './season/season-sim.js';
import { statusRank, statusTier, tradeChance } from './season/status.js';
import { freeAgencyOffers, landingOffers } from './season/teams-sim.js';
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
  /** prologue ×2, college, landing ×1, then per season: perks*, decision, [midseason]. */
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
  /** League pecking-order tier - star+ players can demand a trade. */
  statusTier: StatusTier;
  /** 0..1 rough chance of being traded this season; the HUD flags it when tense. */
  tradeChance: number;
  /** Seasons of a still-open championship window (a ring keeps you a contender). */
  ringWindow: number;
  /** 0..100 team chemistry - low chemistry drives trades. */
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
    | 'overseas_offer'
    | 'farewell';
  prologue?: PrologueNodeView;
  collegePick?: { tier: SchoolTier; schools: SchoolRef[] };
  collegeYear?: { recap: CollegeSeason; options: OptionView[]; tier: SchoolTier };
  landing?: { offers: OptionView[]; draft: DraftResult };
  season?: { decision: SeasonDecisionNode; preview: SeasonPreview; shop: PerkShop };
  midseason?: { decision: SeasonDecisionNode; preview: SeasonPreview };
  /** A locker-room question - rolls on its own, so it can share a season with a mid-season one. */
  chemistry?: { decision: SeasonDecisionNode; preview: SeasonPreview };
  /** The pre-retirement send-off choice: `farewell_tour` vs `quiet_goodbye`. */
  farewell?: { options: OptionView[]; preview: SeasonPreview };
  overseasOffer?: {
    reason: 'washed_out' | 'contract_up';
    options: OptionView[];
    preview: SeasonPreview;
    /** Present only for `contract_up` (start-of-season); the washout rescue has none. */
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

/**
 * The deterministic heart of the game. Replays the whole career from
 * `(seed, profile, choices)`. Returns `awaiting_choice` with the next node when
 * `choices` runs out, or `complete` with the full `CareerSummary`.
 */
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

  // ---- Prologue -----------------------------------------------------------
  // Rolled per career from a derived stream so the summer-circuit / recruiting
  // options are equal-value with rerolled attribute spreads.
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

  // ---- College (1-3 years, pick + declare/return/transfer) --------------
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

  // Every extra year in school ages you: a one-and-done reaches the NBA at 19,
  // a player who went back once is 20, twice is 21.
  state.age += Math.max(0, collegeYears.length - 1);

  state.college = {
    finalSchool: currentSchool?.name ?? collegeYears.at(-1)?.school ?? '',
    tier: recruitTier,
    years: collegeYears,
  } satisfies College;

  // ---- Draft ------------------------------------------------------------
  state.draft = simulateDraft(rng, state);
  // Talent ceiling is set mostly by where you actually landed: a high pick
  // almost always gets real growth headroom, a late pick usually does not - but
  // a few still pop (the "second-round steal"), and the odds of that rise the
  // deeper you went. A prospect who genuinely slid keeps some credit for the
  // pre-draft scouting grade.
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

  // ---- Landing spot ---------------------------------------------------
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

  // ---- Season loop --------------------------------------------------
  let prevImpact = 0;
  // HUD-only reads, refreshed at the top of each season before any preview.
  let hudStatus: StatusTier = 'fringe';
  let hudTradeChance = 0;

  const nationalStanding = (): NationalStanding =>
    buildNationalStanding({
      country: profile.country,
      caps: state.nationalCaps,
      medals: state.nationalMedals,
      score: state.nationalRep,
    });

  /** One national-team summer: accrue the standing, return any medals. */
  const runNationalSummer = (ovr: number, impact: number): AwardId[] => {
    const r = maybeInternational(rng, {
      seasonIndex: state.seasonIndex,
      age: state.age,
      overall: ovr,
      impact,
      hype: state.hype,
      countryPedigree,
      // Team USA has a bottomless pool - you need real star status to make it.
      // Smaller nations lean on whoever they've got.
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
    franchiseTier: state.team ? (state.franchiseTierSeen[state.team.id] ?? 'none') : 'none',
    franchiseSeasons: state.team ? (state.franchiseSeasons[state.team.id] ?? 0) : 0,
    franchiseProgress: state.team ? franchiseProgress(state.franchiseScore[state.team.id] ?? 0) : 0,
    nationalTeam: nationalStanding(),
    statusTier: hudStatus,
    tradeChance: hudTradeChance,
    ringWindow: state.ringWindowLeft,
    chemistry: state.chemistry,
    // The big beats of the season just finished - the web pops these as cards.
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
    // A farewell-tour season is never a free-agency season - the exit is
    // already scripted, so it always runs a normal scenario.
    const contractYear = state.contractYearsLeft <= 1 && !state.onFarewellTour;

    // League status + a rough trade estimate - HUD reads and the demand-trade
    // gate. RNG-free so it stays a display value.
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

    // ===== 1. Perks shop - an always-open aside on the season screen, never a
    // blocking step. Yearly perks auto-renew from the bank first; any recorded
    // `perks{n}` purchases (they always precede the `s{n}` choice) apply here.
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

    // ===== 2. Season decision =====
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
      const opts: OptionView[] = [clubOfferView(resign), ...others.map(clubOfferView)];
      if (canReturn) opts.push(nbaReturnView(returnPay));
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
      if (pick.choiceId === 'nba_return') {
        const back = weightedPick(
          derivedRng(seed, 'nba-return', seasonNumber),
          TEAMS.map((t) => [t, 1] as const),
        );
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
      // Re-signing *extends* the current stint: the team, the standing, and the
      // years-with-team counter all carry over - only the contract is new.
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
      // Star-and-up players on a settled roster can force their way out.
      const canDemandTrade =
        state.league === 'nba' &&
        state.team !== null &&
        !state.justTraded &&
        !contractYear &&
        state.seasonIndex >= 2 &&
        statusRank(hudStatus) >= statusRank('star');
      if (canDemandTrade) options.push(DEMAND_TRADE_VIEW);
      if (state.retirementEligible) options.push(RETIRE_VIEW);
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
        // Burning the bridge costs you standing with the team you're leaving
        // (only where you actually have a history to lose).
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

    // ===== 3. Mid-season situation (~30% from season 3 on) =====
    let midId: string | null = null;
    let midHeadline: string | null = null;
    const midFires = seasonNumber >= 3 && rng() < 0.3;
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
        midHeadline = `${mid.title}: ${found.option.label} - ${mr.note}`;
        // Surface the bizarre situation + the call the player made in the
        // season summary alongside the trades and trophies.
        state.moments.push({
          seasonIndex: seasonNumber,
          kind: 'midseason',
          id: mid.id,
          title: mid.title,
          subtitle: mr.note,
          choice: found.option.label,
          teamId: state.team?.id,
        });
        if (!state.firedScenarioIds.includes(mid.id)) state.firedScenarioIds.push(mid.id);
      }
    }

    // ===== 3b. Chemistry question - its own roll, so it can share a season
    // with the mid-season one (they're about different things). NBA only, and
    // kept to roughly one every 2-3 seasons via the cooldown.
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
      chemHeadline = `${chm.title}: ${optLabel} - ${cr.note}`;
      state.moments.push({
        seasonIndex: seasonNumber,
        kind: 'midseason',
        id: chm.id,
        title: chm.title,
        subtitle: cr.note,
        choice: optLabel,
        teamId: state.team?.id,
      });
      if (!state.firedChemistryIds.includes(chm.id)) state.firedChemistryIds.push(chm.id);
    }
    if (chemHeadline) midHeadline = midHeadline ? `${midHeadline} ${chemHeadline}` : chemHeadline;

    // ===== 4. Simulate the season =====
    const perkAgg = aggregatePerkEffect(state);
    effect = mergeEffects(effect, perkToSeasonEffect(perkAgg));

    const preStrength =
      state.league === 'overseas'
        ? clamp(state.club?.prestige ?? 0.6, 0.3, 0.9)
        : teamStrengthFor(seed, state.team!.id, state.seasonIndex);

    // An interactive mid-season situation *replaces* the silent auto-event.
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

    // ===== 3b. Injury roll - its own per-season chance, on top of the event.
    // Low durability and age drive it; medical perks blunt it. A career going
    // fully injury-free is now a real rarity, but ACL / Achilles stay uncommon.
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

    // A "tense situation" / toxic-locker-room trade - rolled once against the
    // same estimate the HUD shows (which already folds in low chemistry).
    if (
      !effect.forceTrade &&
      !state.justTraded &&
      state.league === 'nba' &&
      state.team &&
      state.seasonsWithTeam >= 2 &&
      rng() < hudTradeChance
    ) {
      effect.forceTrade = true;
    }

    let tradedThisSeason = false;
    if (effect.forceTrade && state.league === 'nba' && state.team) {
      state.team = pickTradeTeam(rng, state.team.id);
      state.seasonsWithTeam = 0;
      tradedThisSeason = true;
      // Fresh locker room - chemistry resets toward neutral (a clean slate).
      state.chemistry = clamp(Math.round(state.chemistry * 0.4 + 33), 0, 100);
      // A trade this severe usually costs some of the ring-window momentum.
      if (!tradeDemanded && state.ringWindowLeft > 0) {
        state.ringWindowLeft = Math.max(0, state.ringWindowLeft - 2);
      }
    }

    // Dynasty window - a title keeps you a contender for a few years (decaying),
    // so back-to-backs and repeat runs are a real possibility, not automatic.
    if (state.league === 'nba' && state.ringWindowLeft > 0) {
      effect = mergeEffects(effect, {
        teamMult: 1 + 0.12 * (0.45 + 0.55 * (state.ringWindowLeft / 5)),
      });
    }

    // A flat OVR hit (a surgery-grade injury, a locker-room blow-up) is spread
    // evenly across every rating so the overall really does drop by that much.
    if (effect.overallHit && effect.overallHit > 0) {
      const drop = effect.overallHit;
      const r: Partial<Ratings> = { ...(effect.ratings ?? {}) };
      for (const k of RATING_KEYS) r[k] = (r[k] ?? 0) - drop;
      effect.ratings = r;
    }

    // Team chemistry drifts toward a baseline that RISES the longer you've been
    // with the team - you learn the room. A fresh trade resets that tenure.
    const tenure = state.league === 'nba' ? Math.min(state.seasonsWithTeam, 8) : 0;
    const chemTarget = 42 + tenure * 4; // 42 fresh ... 74 after 8 years together
    const chemDrift =
      state.chemistry < chemTarget
        ? Math.min(6, chemTarget - state.chemistry)
        : state.chemistry > chemTarget + 6
          ? -2
          : 0;
    // Bonding pays off more when you already know the team; drama still hurts full.
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

    // Lingering growth biases (past decisions) + always-on perk bias.
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
    });
    state.ratings = grown.ratings;
    state.athleticism = grown.athleticism;
    // Perk / event durability deltas are fractional; age erosion is too - round
    // once so the stored value is always a clean integer.
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

      const teamResult: TeamResult =
        sim.stats.gp === 0
          ? 'missed_season'
          : simulatePlayoffs(rng, teamStrength, sim.impact, effect);

      // Open (or refresh) the 5-season championship window on a title.
      if (teamResult === 'champion') state.ringWindowLeft = 5;

      // Fresh league status off this season's finished overall + tally - the
      // MVP / DPOY bars read it.
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
      const defenseRating = Math.round(
        (state.ratings.interiorDefense + state.ratings.perimeterDefense) / 2,
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

      // ---- Franchise standing with this team --------------------------
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
      // Provisional tier (real `historic` isn't known until the career ends).
      const provTier = franchiseTier(state.franchiseScore[teamId], {
        rings: state.franchiseRings[teamId] ?? 0,
        seasons: state.franchiseSeasons[teamId] ?? 0,
        historic: state.peakOverall >= 90,
      });
      const seenRank = tierRank(state.franchiseTierSeen[teamId] ?? 'none');
      const tierUp = tierRank(provTier) > seenRank ? provTier : null;
      if (tierUp) state.franchiseTierSeen[teamId] = tierUp;

      // A creative, seeded one-liner for how the year ended - its own derived
      // stream, so it never shifts the main simulation.
      const recap = seasonRecap(derivedRng(seed, 'recap', seasonNumber), {
        result: teamResult,
        missedGames: sim.gamesMissed,
      });

      // ---- Big-moment detection -------------------------------------
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
        stats: sim.stats,
        teamResult,
        awards: seasonAwards,
        overallAfter,
        ratingsAfter: { ...state.ratings },
        injuredGames: sim.gamesMissed,
        salary: state.salary,
        recap,
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
      // A rolled injury - record it by its real name. `gamesMissed` is the
      // season's actual total (82 − games played), so it always adds up.
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

    // ===== 4b. Fame follows the ball =====
    // Fame is not an attribute you train - it tracks how you played and the
    // trophies you won this year (plus the off-court drama already merged into
    // `effect.hype` from mid-season situations, events, and shoe deals).
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

    // ===== 5. Money =====
    settleSeasonPay(state);
    recomputeMarketValue(state, { overall: overallAfter, lastImpact: prevImpact }, perkAgg);
    tickValueMods(state);

    // ===== 6. Advance the clock =====
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

    // While a guaranteed multi-year deal is still running, the roster spot is
    // safe: no age-out, no washout cut. Retirement can only come from the
    // player's own choice or a career-ending injury until the contract is up.
    const underContract = state.contractYearsLeft > 1;

    // The one ceremonial season a farewell tour granted has now been played.
    if (state.onFarewellTour) {
      state.onFarewellTour = false;
      state.forcedRetire = true;
    }

    if (state.league === 'nba') {
      if (state.age >= 34 && overallAfter <= state.peakOverall - 4) state.retirementEligible = true;
      if (state.age >= 35) state.retirementEligible = true;

      // Early washout - a real cut for role players who never develop. Not while
      // a signed multi-year deal still has years left. A late-second-round or
      // undrafted start makes it markedly more likely (and a slightly higher
      // overall still isn't safe).
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
      // A washed-out player who can still hoop gets real EuroLeague interest; the
      // rest are simply out of the game (→ a short, low-grade career).
      const euroInterest = overallAfter >= 64 && state.age <= 33;

      // Age-out cascade - the decline is all after ~34. Only fires at a contract
      // boundary; layered with real rng so careers end anywhere from the mid-30s
      // to ~40, not all on the same birthday.
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

    // ===== 6b. Farewell node - age has decided this is the end, but the player
    // gets to script the exit. A career-ending injury or an early washout is
    // abrupt by nature and skips this.
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
        // One more, non-FA, ceremonial season; retirement is locked in after it.
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
        // Quiet goodbye - retire now, no extra season.
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

// ---------------------------------------------------------------------------

function buildSummary(args: RunCareerArgs, state: CareerState, consumed: number): CareerSummary {
  const totals = buildCareerTotals(state.seasons);

  // Two passes: legacy needs the standings for jersey retirement, but the
  // `legend` tier needs the final legacy score. Compute a first-pass legacy for
  // the `historic` flag, build standings, then a final legacy that can see them.
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

  // Only keep the highest career-points milestone - 20k shouldn't sit next to
  // 10k and 15k in the moment list.
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
