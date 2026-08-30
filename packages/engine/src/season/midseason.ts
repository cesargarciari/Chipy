import { weightedPick, type Rng } from '../rng.js';
import type { CareerPhase, GameOption, Role } from '../types.js';
import type { SeasonEffect } from './effects.js';
import type { Scenario, ScenarioContext } from './scenario-types.js';

/**
 * Bizarre, branching in-season situations - drawn ~30% of seasons in place of
 * the silent auto-event. These never touch ratings: they hit *this season's*
 * development instead (minutes, role, chemistry, focus) and how much the
 * front office / fans trust you. The concrete cost is rolled at resolve time
 * and scaled by the player's status - a young player loses minutes, a star just
 * loses goodwill.
 */
export const MIDSEASON_SCENARIOS: Scenario[] = [
  {
    id: 'msx_star_fight',
    theme: 'team',
    gate: { minSeason: 3, weight: 1.2 },
    title: 'IT GOT PHYSICAL IN PRACTICE',
    prompt: "You and the team's best player had to be pulled apart.",
    options: [
      {
        id: 'msx_fight_hash',
        label: 'HASH IT OUT',
        blurb: 'Clear the air. His team, his ball - you fit in around it.',
        effect: {},
        stance: { tag: 'Deferring' },
      },
      {
        id: 'msx_fight_trade',
        label: 'FORCE A TRADE',
        blurb: 'One of you had to go. It was never going to be him.',
        effect: {},
        stance: { tag: 'Trade demand' },
      },
    ],
  },
  {
    id: 'msx_nightclub',
    theme: 'media',
    gate: { minSeason: 2, weight: 1 },
    title: 'A PHOTO SURFACES',
    prompt: 'You, a club, 2 a.m. - the night before a nationally televised game.',
    options: [
      {
        id: 'msx_club_apology',
        label: 'PUBLIC APOLOGY',
        blurb: 'Get in front of it. Boring, but it works.',
        effect: { hype: -3 },
        stance: { tag: 'Damage control' },
      },
      {
        id: 'msx_club_own',
        label: 'OWN IT',
        blurb: '"Grown man, day off." The internet eats it up.',
        effect: { hype: 6 },
        stance: { tag: 'No apology' },
      },
    ],
  },
  {
    id: 'msx_benched_4th',
    theme: 'team',
    gate: { minSeason: 2, weight: 1 },
    title: 'BENCHED IN THE FOURTH',
    prompt: 'The coach rode the other unit to the win on national TV.',
    options: [
      {
        id: 'msx_bench_meeting',
        label: 'DEMAND A MEETING',
        blurb: 'Say your piece behind closed doors.',
        effect: {},
        stance: { tag: 'Pushback' },
      },
      {
        id: 'msx_bench_accept',
        label: 'ACCEPT THE MESSAGE',
        blurb: 'Whatever closes games. Learn the lineup.',
        effect: {},
        stance: { tag: 'Team-first' },
      },
    ],
  },
  {
    id: 'msx_viral_shot',
    theme: 'media',
    gate: { minSeason: 2, weight: 0.9 },
    title: 'THE PRACTICE CLIP GOES VIRAL',
    prompt: 'A half-court, behind-the-back shot. Fifteen million views by morning.',
    options: [
      {
        id: 'msx_viral_milk',
        label: 'MILK IT',
        blurb: 'Merch, a bit, a whole content week.',
        effect: { hype: 9 },
        stance: { tag: 'Distraction' },
      },
      {
        id: 'msx_viral_lock',
        label: 'STAY LOCKED IN',
        blurb: 'Fun clip. Back to work.',
        effect: { hype: 1 },
        stance: { tag: 'Focused' },
      },
    ],
  },
  {
    id: 'msx_family',
    theme: 'mind',
    gate: { minSeason: 2, weight: 1 },
    title: 'A CALL ON THE ROAD TRIP',
    prompt: 'A family emergency back home, and the team flies out tonight.',
    options: [
      {
        id: 'msx_family_home',
        label: 'FLY HOME',
        blurb: 'Some things are bigger than the schedule.',
        effect: { hype: -1 },
        stance: { tag: 'Away from the team' },
      },
      {
        id: 'msx_family_stay',
        label: 'STAY WITH THE TEAM',
        blurb: 'They need you. It sits with you all week.',
        effect: { hype: -2 },
        stance: { tag: 'Weight on you' },
      },
    ],
  },
  {
    id: 'msx_ref_feud',
    theme: 'mind',
    gate: { minSeason: 3, weight: 0.8 },
    title: 'TECH-HAPPY STRETCH',
    prompt: "You've picked up four technicals in six games. The league is watching.",
    options: [
      {
        id: 'msx_ref_rein',
        label: 'REIN IT IN',
        blurb: 'Hand the ball back. Walk away. Every time.',
        effect: {},
        stance: { tag: 'Composed' },
      },
      {
        id: 'msx_ref_edge',
        label: 'KEEP THE EDGE',
        blurb: 'The edge is why you’re here. Eat the one-game suspension.',
        effect: { hype: 2 },
        stance: { tag: 'Suspension' },
      },
    ],
  },
  {
    id: 'msx_cryptic_tweet',
    theme: 'media',
    gate: { minSeason: 3, weight: 0.8 },
    title: 'THREE DOTS AND A CLOCK EMOJI',
    prompt: 'Your late-night tweet has the whole beat writing trade columns.',
    options: [
      {
        id: 'msx_tweet_clarify',
        label: 'CLARIFY IT',
        blurb: '"Talking about my golf game, relax."',
        effect: {},
        stance: { tag: 'Walked back' },
      },
      {
        id: 'msx_tweet_silence',
        label: 'SAY NOTHING',
        blurb: 'Let them wonder. Leverage is leverage.',
        effect: { hype: 3 },
        stance: { tag: 'Leverage' },
      },
    ],
  },
  {
    id: 'msx_legend_callout',
    theme: 'legacy',
    gate: { minAge: 24, weight: 0.9 },
    title: '"NOT A REAL WINNER"',
    prompt: 'A Hall of Famer says it on his podcast. It travels fast.',
    options: [
      {
        id: 'msx_legend_fuel',
        label: 'LET IT FUEL YOU',
        blurb: 'Tape it to the locker. Answer on the floor.',
        effect: { hype: 2 },
        stance: { tag: 'Chip on shoulder' },
      },
      {
        id: 'msx_legend_brush',
        label: 'BRUSH IT OFF',
        blurb: "Old man yells at cloud. You've got a game in an hour.",
        effect: {},
        stance: { tag: 'Unbothered' },
      },
    ],
  },
  {
    id: 'msx_position_change',
    theme: 'team',
    gate: { minSeason: 3, weight: 0.9 },
    title: 'A NEW POSITION, MIDSEASON',
    prompt: 'Injuries force the staff to slide you out of your natural spot.',
    options: [
      {
        id: 'msx_pos_embrace',
        label: 'EMBRACE IT',
        blurb: 'More versatile is more valuable.',
        effect: {},
        stance: { tag: 'Adaptable' },
      },
      {
        id: 'msx_pos_resist',
        label: 'RESIST IT',
        blurb: 'You know who you are. Ask them to fix the rotation.',
        effect: {},
        stance: { tag: 'Dug in' },
      },
    ],
  },
  {
    id: 'msx_agent_leak',
    theme: 'money',
    gate: { minSeason: 4, weight: 0.9 },
    title: 'YOUR NUMBER IS IN THE PAPERS',
    prompt: 'Someone - probably your agent - leaked what you want on the next deal.',
    options: [
      {
        id: 'msx_leak_lean',
        label: 'LEAN IN',
        blurb: 'Yes, that’s the number. Pay it or someone else will.',
        effect: { hype: 2 },
        stance: { tag: 'Getting paid' },
      },
      {
        id: 'msx_leak_downplay',
        label: 'DOWNPLAY IT',
        blurb: '"I let my agent handle business. I hoop."',
        effect: {},
        stance: { tag: 'Deflected' },
      },
    ],
  },
  {
    id: 'msx_rookie_prank',
    theme: 'media',
    gate: { minSeason: 3, weight: 0.7 },
    title: 'THE PRANK WENT SIDEWAYS',
    prompt: "A rookie-hazing bit got filmed and it doesn't read well out of context.",
    options: [
      {
        id: 'msx_prank_own',
        label: 'OWN IT PUBLICLY',
        blurb: 'Apologize, take the rookies to dinner, move on.',
        effect: { hype: -1 },
        stance: { tag: 'Accountable' },
      },
      {
        id: 'msx_prank_laugh',
        label: 'LAUGH IT OFF',
        blurb: '"That’s locker-room stuff." Half the room agrees.',
        effect: { hype: 2 },
        stance: { tag: 'Dismissive' },
      },
    ],
  },
  {
    id: 'msx_gambling_probe',
    theme: 'media',
    gate: { minSeason: 3, weight: 0.6 },
    title: 'THE PROBE CLEARS YOU',
    prompt: 'Your name got pulled into a betting inquiry. You are fully cleared.',
    options: [
      {
        id: 'msx_probe_pr',
        label: 'GET AHEAD OF IT',
        blurb: 'Sit-down interview, full transparency, turn the page.',
        effect: { hype: 4 },
        stance: { tag: 'Transparent' },
      },
      {
        id: 'msx_probe_silent',
        label: 'STAY SILENT',
        blurb: 'Cleared is cleared. Not dignifying it.',
        effect: { hype: -3 },
        stance: { tag: 'Silent' },
      },
    ],
  },
  {
    id: 'msx_allstar_push',
    theme: 'legacy',
    gate: { minSeason: 3, role: ['starter', 'franchise'], weight: 0.8 },
    title: 'ALL-STAR CAPTAIN BUZZ',
    prompt: "You're near the top of the fan vote at the break.",
    options: [
      {
        id: 'msx_allstar_chase',
        label: 'CHASE THE VOTES',
        blurb: 'Big numbers, big nights, campaign a little.',
        effect: { hype: 7 },
        stance: { tag: 'Stat-chasing' },
      },
      {
        id: 'msx_allstar_defer',
        label: 'DEFER TO WINNING',
        blurb: 'Let the record make the case.',
        effect: {},
        stance: { tag: 'Winning first' },
      },
    ],
  },
  {
    id: 'msx_teammate_birthday',
    theme: 'team',
    gate: { minSeason: 2, weight: 1 },
    title: "IT'S A TEAMMATE'S 30TH",
    prompt: 'Half the roster is going out tonight - and there is a game tomorrow.',
    options: [
      {
        id: 'msx_bday_out',
        label: 'GO OUT WITH THE GUYS',
        blurb: 'Show up for the room. You can gut through one groggy back-to-back.',
        effect: {},
        stance: { tag: 'One of the guys' },
      },
      {
        id: 'msx_bday_home',
        label: 'STAY HOME',
        blurb: 'Ice bath, film, bed. Game day is game day.',
        effect: {},
        stance: { tag: 'Pro' },
      },
    ],
  },
  {
    id: 'msx_burner_account',
    theme: 'media',
    gate: { minSeason: 3, weight: 0.7 },
    title: 'THEY FOUND YOUR BURNER',
    prompt: 'An anonymous account that liked some ugly posts has been traced back to you.',
    options: [
      {
        id: 'msx_burner_own',
        label: 'OWN UP TO IT',
        blurb: 'Admit it, apologize to the room, wear it.',
        effect: {},
        stance: { tag: 'Accountable' },
      },
      {
        id: 'msx_burner_deny',
        label: 'DENY IT',
        blurb: '"Not my account." Nobody in the locker room buys it.',
        effect: {},
        stance: { tag: 'Stonewalling' },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Outcomes - how each option lands, resolved against the player's status
// ---------------------------------------------------------------------------

export interface MidResolveCtx {
  role: Role;
  phase: CareerPhase;
  age: number;
}

export interface MidResolution {
  effect: SeasonEffect;
  /** Change to the standing with the current team (usually negative). */
  franchiseDelta: number;
  /** Change to team chemistry (0..100). Negative from drama, positive from bonding. */
  chemistryDelta: number;
  /** One-line description of how it actually landed - a real consequence. */
  note: string;
}

interface ResolveArgs {
  rng: Rng;
  /** 0.6 … 1.5 severity multiplier for the season. */
  m: number;
  star: boolean;
  young: boolean;
}

type OutcomeFn = (a: ResolveArgs) => Partial<MidResolution> & { effect?: SeasonEffect };

/** "The front office isn't happy - the situation is tense." Feeds trade odds. */
function frontOfficeCold(a: ResolveArgs): Partial<MidResolution> {
  return {
    franchiseDelta: -Math.round((a.star ? 22 : 12) * a.m),
    chemistryDelta: -Math.round(6 * a.m),
    effect: { teamMult: 1 - 0.015 * a.m },
    note: 'The front office is not happy. The situation around you gets tense.',
  };
}

/** A groggy stretch or a nagging distraction - a real hit to your play. */
function ownGameDips(a: ResolveArgs, ovr = 0): Partial<MidResolution> {
  return {
    effect: ovr > 0 ? { overallHit: ovr } : { impactMult: 1 - (0.03 + 0.05 * a.m) },
    note:
      ovr > 0
        ? `It costs you a real step - about ${ovr} off your overall.`
        : 'It nags at your game the rest of the year.',
  };
}

/**
 * Per-option resolvers. Every branch produces a *concrete* consequence - lost
 * overall, a chemistry swing, a colder front office (which raises trade odds),
 * or a genuine spark. Anything not listed just blows over.
 */
export const MIDSEASON_OUTCOMES: Record<string, OutcomeFn> = {
  // Fight with the star
  msx_fight_hash: (a) => ({
    effect: { roleBias: -(0.2 + 0.4 * a.m), mpgBias: -(2 + 3 * a.m) },
    chemistryDelta: -Math.round(4 * a.m),
    note: 'You fold in around him - fewer touches, smaller role for a while.',
  }),
  msx_fight_trade: (a) => ({
    effect: { forceTrade: true, impactMult: 1 + 0.02 * a.m },
    chemistryDelta: -20,
    note: 'One of you had to go. You get your wish - moved by the deadline.',
  }),
  // Nightclub photo
  msx_club_apology: () => ({ note: 'You get in front of it. It blows over in a week.' }),
  msx_club_own: (a) => ({
    ...frontOfficeCold(a),
    note: 'Ownership is furious behind closed doors. The room notices, and so do rivals.',
  }),
  // Benched in the 4th
  msx_bench_meeting: frontOfficeCold,
  msx_bench_accept: (a) => ({
    effect: { growth: { basketballIQ: 1 } },
    chemistryDelta: Math.round(3 * a.m),
    note: 'You take the coaching. The staff trusts you more for it.',
  }),
  // Viral practice clip
  msx_viral_milk: (a) => ownGameDips(a),
  msx_viral_lock: (a) => ({
    effect: { impactMult: 1 + 0.02 * a.m },
    note: 'Back to work - you stay sharp.',
  }),
  // Family emergency
  msx_family_home: (a) => ({
    effect: { injuredGames: Math.round(5 + 4 * a.m) },
    chemistryDelta: Math.round(4 * a.m),
    note: 'You miss a road trip - the guys have your back when you return.',
  }),
  msx_family_stay: () => ({
    effect: { hype: -1 },
    note: 'It sits with you, but the team pulls together.',
  }),
  // Tech-happy stretch
  msx_ref_rein: () => ({
    effect: { growth: { basketballIQ: 1 } },
    note: 'You reel it in. The calls start going your way again.',
  }),
  msx_ref_edge: (a) => ({
    effect: { injuredGames: Math.round(2 + 3 * a.m), impactMult: 1 + 0.02 * a.m },
    note: 'You eat a one-game suspension, but the edge stays - and it shows.',
  }),
  // Cryptic tweet
  msx_tweet_clarify: () => ({ note: 'You walk it back. The beat moves on.' }),
  msx_tweet_silence: frontOfficeCold,
  // "Not a real winner"
  msx_legend_fuel: (a) => ({
    effect: { impactMult: 1 + 0.05 + 0.02 * a.m, awardMult: { scoring: 1.06 } },
    note: 'You tape it to your locker and answer on the floor.',
  }),
  msx_legend_brush: () => ({ note: "Old man yells at cloud. You've got a game in an hour." }),
  // Position change
  msx_pos_embrace: (a) => ({
    effect: { growth: { playmaking: 1, perimeterDefense: 1 } },
    chemistryDelta: Math.round(3 * a.m),
    note: 'You buy in. More versatile is more valuable - the staff loves it.',
  }),
  msx_pos_resist: (a) =>
    a.rng() < 0.5
      ? {
          effect: { impactMult: 1 + 0.03 * a.m, roleBias: 0.2 },
          note: 'The staff fixes the rotation. You go back to shining in your spot.',
        }
      : frontOfficeCold(a),
  // Agent leaks the number
  msx_leak_lean: (a) => ({
    ...frontOfficeCold(a),
    effect: { teamMult: 1 - 0.01 * a.m },
    note: 'You confirm the number. The front office bristles and the room gets tense.',
  }),
  msx_leak_downplay: () => ({ note: '"I let my agent handle business." It fades.' }),
  // Rookie prank
  msx_prank_own: (a) => ({
    chemistryDelta: Math.round(3 * a.m),
    note: 'You take the rookies to dinner. The room is tighter for it.',
  }),
  msx_prank_laugh: (a) => ({
    chemistryDelta: -Math.round(9 * a.m),
    note: 'Half the locker room lets it go. The other half remembers.',
  }),
  // Gambling probe (cleared)
  msx_probe_pr: () => ({ note: 'You get ahead of it and turn the page.' }),
  msx_probe_silent: frontOfficeCold,
  // All-Star captain buzz
  msx_allstar_chase: (a) => ({
    effect: { teamMult: 1 - (0.02 + 0.02 * a.m) },
    chemistryDelta: -Math.round(7 * a.m),
    note: 'You campaign. Teammates notice the shot count creep up.',
  }),
  msx_allstar_defer: (a) => ({
    effect: { teamMult: 1 + 0.02 + 0.02 * a.m },
    chemistryDelta: Math.round(5 * a.m),
    note: 'You let the record make the case. The room rallies around you.',
  }),
  // Teammate's birthday
  msx_bday_out: (a) => ({
    chemistryDelta: Math.round(12 + 6 * a.m),
    effect: { overallHit: 2 },
    note: 'The room loves you for it - but a groggy month costs you ~2 overall.',
  }),
  msx_bday_home: (a) => ({
    chemistryDelta: -Math.round(8 + 4 * a.m),
    note: "The professional call - and the guys notice you didn't show.",
  }),
  // Burner account
  msx_burner_own: () => ({
    chemistryDelta: -60,
    note: 'You come clean. The locker room ices you out - trade talk starts within the week.',
  }),
  msx_burner_deny: (a) => ({
    effect: { overallHit: 3 },
    chemistryDelta: -Math.round(10 * a.m),
    note: 'Nobody believes you. It gnaws at your game all year - about 3 off your overall.',
  }),
};

/**
 * Turn a chosen option into this season's concrete consequence, rolled and
 * scaled by status. Consumes RNG - call once, at resolve time.
 */
export function resolveMidseason(rng: Rng, optionId: string, ctx: MidResolveCtx): MidResolution {
  const fn = MIDSEASON_OUTCOMES[optionId];
  const star = ctx.role === 'franchise' || ctx.role === 'starter';
  const young = ctx.phase === 'rookie' || ctx.phase === 'rising';
  const m = 0.6 + rng() * 0.9; // 0.6 … 1.5

  const out = fn?.({ rng, m, star, young }) ?? { note: 'It blows over in a week.' };
  return {
    effect: out.effect ?? {},
    franchiseDelta: out.franchiseDelta ?? 0,
    chemistryDelta: out.chemistryDelta ?? 0,
    note: out.note ?? 'It blows over in a week.',
  };
}

// ---------------------------------------------------------------------------

let index: Map<string, { scenario: Scenario; optionId: string }> | null = null;

export function buildMidseasonIndex(): Map<string, { scenario: Scenario; optionId: string }> {
  if (index) return index;
  const map = new Map<string, { scenario: Scenario; optionId: string }>();
  const ids = new Set<string>();
  for (const s of MIDSEASON_SCENARIOS) {
    if (ids.has(s.id)) throw new Error(`Duplicate mid-season scenario id "${s.id}"`);
    ids.add(s.id);
    if (s.options.length < 2 || s.options.length > 4) {
      throw new Error(`Mid-season "${s.id}" must have 2–4 options, has ${s.options.length}`);
    }
    for (const o of s.options) {
      if (map.has(o.id)) throw new Error(`Duplicate mid-season option id "${o.id}"`);
      if (o.effect.ratings) {
        throw new Error(`Mid-season option "${o.id}" must not touch ratings`);
      }
      map.set(o.id, { scenario: s, optionId: o.id });
    }
  }
  index = map;
  return map;
}

export function findMidseasonOption(
  optionId: string,
): { scenario: Scenario; option: GameOption } | null {
  const hit = buildMidseasonIndex().get(optionId);
  if (!hit) return null;
  const option = hit.scenario.options.find((o) => o.id === optionId)!;
  return { scenario: hit.scenario, option };
}

function gateMatches(s: Scenario, ctx: ScenarioContext): boolean {
  const g = s.gate;
  if (g.phase && !g.phase.includes(ctx.phase)) return false;
  if (g.role && !g.role.includes(ctx.role)) return false;
  if (g.market && !g.market.includes(ctx.market)) return false;
  if (g.minAge !== undefined && ctx.age < g.minAge) return false;
  if (g.maxAge !== undefined && ctx.age > g.maxAge) return false;
  if (g.minSeason !== undefined && ctx.seasonNumber < g.minSeason) return false;
  if (g.maxSeason !== undefined && ctx.seasonNumber > g.maxSeason) return false;
  if (g.once && ctx.firedScenarioIds.has(s.id)) return false;
  if (g.predicate && !g.predicate(ctx)) return false;
  return true;
}

export function eligibleMidseason(ctx: ScenarioContext): Scenario[] {
  return MIDSEASON_SCENARIOS.filter((s) => gateMatches(s, ctx));
}

/** Weight-pick a mid-season situation, or `null` if none fits this state. */
export function pickMidseason(rng: Rng, ctx: ScenarioContext): Scenario | null {
  const eligible = eligibleMidseason(ctx);
  if (eligible.length === 0) return null;
  return weightedPick(
    rng,
    eligible.map((s) => [s, s.gate.weight ?? 1] as const),
  );
}
