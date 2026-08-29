import { getArchetype } from './archetypes.js';
import { applyPrologueOutcome, createInitialState, tallyAward } from './career.js';
import { getTeam, TEAMS } from './data/teams.js';
import { simulateDraft } from './draft.js';
import { overallFor } from './ratings.js';
import { clamp, mulberry32, normalizeSeed, weightedPick } from './rng.js';
import { PROLOGUE_NODES, getPrologueChoice, getPrologueNode } from './scenarios/index.js';
import { resolveAwards } from './season/awards.js';
import { getDecisionDef, offseasonDecision } from './season/decisions.js';
import { mergeEffects, type SeasonEffect } from './season/effects.js';
import { rollEvent } from './season/events.js';
import { growSeason } from './season/growth.js';
import { maybeInternational } from './season/international.js';
import { buildCareerTotals, buildLegacy } from './season/legacy.js';
import { phaseFor } from './season/phase.js';
import { roleFor, simulatePlayoffs, simulateSeason, teamStrengthFor } from './season/season-sim.js';
import { freeAgencyOffers, landingOffers } from './season/teams-sim.js';
import {
  ENGINE_VERSION,
  type CareerState,
  type CareerSummary,
  type ChoiceSelection,
  type DraftResult,
  type PlayerProfile,
  type PrologueNodeView,
  type Ratings,
  type SeasonDecisionNode,
  type SeasonRecord,
  type TeamOffer,
  type TeamRef,
  type TeamResult,
} from './types.js';

const MAX_SEASONS = 25;

export interface RunCareerArgs {
  seed: number | string;
  profile: PlayerProfile;
  /** prologue ×2, landing ×1, then one per season. Pass `[]` to get the first node. */
  choices: ChoiceSelection[];
}

export interface SeasonPreview {
  seasonNumber: number;
  age: number;
  team: TeamRef;
  overall: number;
  contractYear: boolean;
  ratings: Ratings;
  athleticism: number;
  durability: number;
  hype: number;
  lastSeason: SeasonRecord | null;
  /** Overall / ratings at the end of the season before last — for showing growth. */
  previousOverall: number | null;
  previousRatings: Ratings | null;
}

export interface PendingDecision {
  nodeId: string;
  kind: 'prologue' | 'landing' | 'season';
  prologue?: PrologueNodeView;
  landing?: { offers: TeamOffer[]; draft: DraftResult };
  season?: { decision: SeasonDecisionNode; offers?: TeamOffer[]; preview: SeasonPreview };
}

export type RunCareerResult =
  | { status: 'awaiting_choice'; pending: PendingDecision }
  | { status: 'complete'; summary: CareerSummary };

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function prologueView(id: 'highschool' | 'recruiting'): PrologueNodeView {
  const node = getPrologueNode(id)!;
  return {
    id: node.id,
    stage: node.stage,
    title: node.title,
    prompt: node.prompt,
    choices: node.choices.map((c) => ({ id: c.id, label: c.label, blurb: c.blurb })),
  };
}

function pickTradeTeam(rng: () => number, currentId: string): TeamRef {
  return weightedPick(
    rng,
    TEAMS.filter((t) => t.id !== currentId).map((t) => [t, 1] as const),
  );
}

/**
 * The deterministic heart of the game. Replays the whole career from
 * `(seed, profile, choices)`. Returns `awaiting_choice` with the next node to
 * present when `choices` runs out, or `complete` with the full `CareerSummary`.
 */
export function runCareer(args: RunCareerArgs): RunCareerResult {
  const { profile } = args;
  const seed = args.seed;
  const rng = mulberry32(normalizeSeed(seed));
  const state: CareerState = createInitialState(rng, profile);
  const choices = args.choices;
  let ci = 0;

  // ---- Prologue ---------------------------------------------------------
  for (const node of PROLOGUE_NODES) {
    if (ci >= choices.length) {
      return {
        status: 'awaiting_choice',
        pending: { nodeId: node.id, kind: 'prologue', prologue: prologueView(node.id) },
      };
    }
    const pick = choices[ci]!;
    if (pick.nodeId !== node.id) {
      throw new Error(`Expected a choice for "${node.id}", got "${pick.nodeId}"`);
    }
    const choice = getPrologueChoice(node.id, pick.choiceId);
    const outcome = choice.resolve({ rng, profile, state });
    Object.assign(
      state,
      applyPrologueOutcome(
        state,
        { nodeId: node.id, choiceId: pick.choiceId, stage: node.stage },
        outcome,
      ),
    );
    ci += 1;
  }

  // ---- Draft ----------------------------------------------------------
  state.draft = simulateDraft(rng, state);
  // Development ceiling: mostly draft stock, plus a sharply low-skewed luck roll
  // so most prospects top out as role players and a rare few become stars.
  // `growSeason` squares this, so the gap between 0.8 and 1.2 is large.
  state.talent = clamp(0.52 + (state.draftStock / 100) * 0.55 + rng() ** 2 * 0.35, 0.5, 1.32);
  state.timeline.push({
    nodeId: 'draft',
    choiceId: '-',
    stage: 'Draft Night',
    headline: state.draft.undrafted
      ? 'The board empties without your name. You go undrafted.'
      : `You're taken ${ordinal(state.draft.pick!)} overall in the ${state.draft.round === 1 ? 'first' : 'second'} round.`,
  });

  // ---- Landing spot -------------------------------------------------
  const prelandOverall = overallFor(profile.position, state.ratings);
  const offers = landingOffers({
    seed,
    overall: prelandOverall,
    market: profile.market,
    draft: state.draft,
  });
  if (ci >= choices.length) {
    return {
      status: 'awaiting_choice',
      pending: { nodeId: 'landing', kind: 'landing', landing: { offers, draft: state.draft } },
    };
  }
  {
    const pick = choices[ci]!;
    if (pick.nodeId !== 'landing')
      throw new Error(`Expected a "landing" choice, got "${pick.nodeId}"`);
    const chosen = offers.find((o) => o.choiceId === pick.choiceId);
    if (!chosen) throw new Error(`Unknown landing offer "${pick.choiceId}"`);
    state.team = chosen.team;
    state.contractYearsLeft = chosen.years;
    state.timeline.push({
      nodeId: 'landing',
      choiceId: pick.choiceId,
      stage: 'Landing Spot',
      headline: `You start your career with the ${chosen.team.city} ${chosen.team.name}.`,
    });
    ci += 1;
  }

  // ---- Season loop -------------------------------------------------
  let prevImpact = 0;

  while (true) {
    const seasonNumber = state.seasonIndex + 1;
    const nodeId = `s${seasonNumber}`;
    const phase = phaseFor(state.age, state.seasonIndex);
    const overall = overallFor(profile.position, state.ratings);
    const contractYear = state.contractYearsLeft <= 1 && state.team !== null;

    let faOffers: TeamOffer[] | undefined;
    let decision: SeasonDecisionNode;
    if (contractYear) {
      faOffers = freeAgencyOffers({
        seed,
        seasonIndex: state.seasonIndex,
        overall,
        market: profile.market,
        currentTeamId: state.team!.id,
      });
      const options = faOffers.map((o) => ({
        id: o.choiceId,
        label: `${o.team.city} ${o.team.name} · ${o.years}yr`,
        blurb: o.pitch,
      }));
      if (state.retirementEligible) {
        options.push({ id: 'retire', label: 'Retire', blurb: 'Walk away on your own terms.' });
      }
      decision = {
        nodeId,
        kind: 'free_agency',
        age: state.age,
        phase,
        title: 'Free agency',
        prompt: 'Your contract is up. Where do you sign?',
        options,
      };
    } else {
      const od = offseasonDecision(phase, state.retirementEligible);
      decision = {
        nodeId,
        kind: 'offseason',
        age: state.age,
        phase,
        title: od.title,
        prompt: od.prompt,
        options: od.options,
      };
    }

    if (ci >= choices.length) {
      const prev = state.seasons.at(-2);
      const preview: SeasonPreview = {
        seasonNumber,
        age: state.age,
        team: state.team!,
        overall,
        contractYear,
        ratings: { ...state.ratings },
        athleticism: state.athleticism,
        durability: state.durability,
        hype: state.hype,
        lastSeason: state.seasons.at(-1) ?? null,
        previousOverall: prev?.overallAfter ?? null,
        previousRatings: prev ? { ...prev.ratingsAfter } : null,
      };
      return {
        status: 'awaiting_choice',
        pending: { nodeId, kind: 'season', season: { decision, offers: faOffers, preview } },
      };
    }

    const pick = choices[ci]!;
    if (pick.nodeId !== nodeId) {
      throw new Error(`Expected a choice for "${nodeId}", got "${pick.nodeId}"`);
    }
    ci += 1;

    // Resolve the offseason decision.
    let effect: SeasonEffect = {};
    let decisionHeadline: string;
    const decisionId = pick.choiceId;

    if (pick.choiceId === 'retire') {
      state.timeline.push({
        nodeId,
        choiceId: 'retire',
        stage: `Age ${state.age}`,
        headline: 'You announce your retirement to a standing ovation.',
      });
      break;
    } else if (contractYear && faOffers) {
      const offer = faOffers.find((o) => o.choiceId === pick.choiceId);
      if (!offer) throw new Error(`Unknown free-agency offer "${pick.choiceId}"`);
      const resign = offer.team.id === state.team!.id;
      state.team = offer.team;
      state.contractYearsLeft = offer.years + 1;
      decisionHeadline = resign
        ? `You re-sign with the ${offer.team.city} ${offer.team.name} (${offer.years} years).`
        : `You sign with the ${offer.team.city} ${offer.team.name} (${offer.years} years).`;
    } else {
      const def = getDecisionDef(pick.choiceId);
      if (!def) throw new Error(`Unknown offseason decision "${pick.choiceId}"`);
      if (def.terminal) {
        state.timeline.push({
          nodeId,
          choiceId: 'retire',
          stage: `Age ${state.age}`,
          headline: def.headline,
        });
        break;
      }
      effect = def.effect;
      decisionHeadline = def.headline;
    }

    // In-season event.
    const preStrength = teamStrengthFor(seed, state.team!.id, state.seasonIndex);
    const preRole = roleFor({
      overall,
      teamStrength: preStrength,
      isRookie: state.seasonIndex === 0,
      effect,
    });
    const evt = rollEvent(rng, {
      age: state.age,
      durability: state.durability,
      role: preRole,
      teamStrength: preStrength,
      contractYearsLeft: state.contractYearsLeft,
      seasonIndex: state.seasonIndex,
    });
    effect = mergeEffects(effect, evt.effect);

    if (effect.forceTrade && state.team) {
      state.team = pickTradeTeam(rng, state.team.id);
    }

    const teamStrength = teamStrengthFor(seed, state.team!.id, state.seasonIndex);
    const archetype = getArchetype(profile.archetype);

    const grown = growSeason(rng, {
      ratings: state.ratings,
      athleticism: state.athleticism,
      age: state.age,
      talent: state.talent,
      archetype,
      effect,
    });
    state.ratings = grown.ratings;
    state.athleticism = grown.athleticism;
    state.durability = clamp(state.durability + (effect.durability ?? 0), 20, 100);
    state.hype = clamp(state.hype + (effect.hype ?? 0), 0, 100);

    const overallAfter = overallFor(profile.position, state.ratings);
    state.peakOverall = Math.max(state.peakOverall, overallAfter);

    const role = roleFor({
      overall: overallAfter,
      teamStrength,
      isRookie: state.seasonIndex === 0,
      effect,
    });
    const sim = simulateSeason(rng, {
      ratings: state.ratings,
      athleticism: state.athleticism,
      position: profile.position,
      role,
      durability: state.durability,
      effect,
    });

    const teamResult: TeamResult =
      sim.stats.gp === 0
        ? 'missed_season'
        : simulatePlayoffs(rng, teamStrength, sim.impact, effect);

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
      }),
      ...maybeInternational(rng, {
        seasonIndex: state.seasonIndex,
        age: state.age,
        overall: overallAfter,
        impact: sim.impact,
        hype: state.hype,
      }),
    ];
    for (const a of seasonAwards) tallyAward(state.awards, a);

    state.seasons.push({
      index: seasonNumber,
      age: state.age,
      teamId: state.team!.id,
      role,
      phase,
      decisionId,
      decisionHeadline,
      eventId: evt.id,
      eventHeadline: evt.headline,
      stats: sim.stats,
      teamResult,
      awards: seasonAwards,
      overallAfter,
      ratingsAfter: { ...state.ratings },
      injuredGames: sim.injuredGames,
    });

    prevImpact = sim.impact;

    // Advance the clock.
    state.age += 1;
    state.seasonIndex += 1;
    state.contractYearsLeft = Math.max(0, state.contractYearsLeft - 1);

    // Retirement eligibility / forced retirement.
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
    if (state.age >= 31 && overallAfter <= state.peakOverall - 5) state.retirementEligible = true;
    if (state.age >= 34) state.retirementEligible = true;

    // Washing out of the league early — but real prospects and anyone already
    // developing into a rotation piece get the benefit of the doubt.
    if (
      state.seasonIndex >= 1 &&
      state.seasonIndex <= 10 &&
      (role === 'fringe' || role === 'bench') &&
      overallAfter < 75 &&
      state.talent < 0.93 &&
      rng() < 0.45
    ) {
      state.forcedRetire = true;
    }
    // Aging out — only the genuinely elite play deep into their 30s.
    if (state.age >= 31 && overallAfter < 75) state.forcedRetire = true;
    if (state.age >= 33 && overallAfter < 82) state.forcedRetire = true;
    if (state.age >= 35 && overallAfter < 86) state.forcedRetire = true;
    if (state.age >= 37 && overallAfter < 89) state.forcedRetire = true;
    if (state.age >= 39) state.forcedRetire = true;

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
  const legacy = buildLegacy({
    seed: args.seed,
    awards: state.awards,
    totals,
    peakOverall: state.peakOverall,
    seasons: state.seasons,
  });
  const finalRatings = state.seasons.at(-1)?.ratingsAfter ?? state.ratings;
  const rookieTeamId = state.seasons[0]?.teamId ?? state.team?.id;

  return {
    engineVersion: ENGINE_VERSION,
    seed: normalizeSeed(args.seed),
    profile: args.profile,
    choices: args.choices.slice(0, consumed),
    draft: state.draft!,
    rookieTeam: getTeam(rookieTeamId!),
    seasons: state.seasons,
    finalRatings,
    finalOverall: overallFor(args.profile.position, finalRatings),
    peakOverall: state.peakOverall,
    awards: state.awards,
    careerTotals: totals,
    legacy,
    timeline: state.timeline,
  };
}
