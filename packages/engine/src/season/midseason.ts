import { weightedPick, type Rng } from '../rng.js';
import type { CareerPhase, GameOption, Role } from '../types.js';
import type { SeasonEffect } from './effects.js';
import type { Scenario, ScenarioContext } from './scenario-types.js';

/**
 * Bizarre, branching in-season situations — drawn ~30% of seasons in place of
 * the silent auto-event. These never touch ratings: they hit *this season's*
 * development instead (minutes, role, chemistry, focus) and how much the
 * front office / fans trust you. The concrete cost is rolled at resolve time
 * and scaled by the player's status — a young player loses minutes, a star just
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
        blurb: 'Clear the air. His team, his ball — you fit in around it.',
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
    prompt: 'You, a club, 2 a.m. — the night before a nationally televised game.',
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
    prompt: 'Someone — probably your agent — leaked what you want on the next deal.',
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
];

// ---------------------------------------------------------------------------
// Outcomes — how each option lands, resolved against the player's status
// ---------------------------------------------------------------------------

export type MidConsequence =
  | 'standing' // fans / front office cool on you
  | 'role' // minutes and games (young) or trust (star)
  | 'chemistry' // the team plays worse together for a stretch
  | 'focus' // your own production dips this year
  | 'neutral' // it blows over
  | 'spark'; // rare: you channel it (small, intangible, positive)

interface MidOutcome {
  consequence: MidConsequence;
  forceTrade?: boolean;
}

/**
 * Keyed by option id. The mature / team-first choice tends to be `neutral` (it
 * blows over), the dramatic one carries a development cost. Anything missing
 * resolves as `neutral`.
 */
export const MIDSEASON_OUTCOMES: Record<string, MidOutcome> = {
  msx_fight_hash: { consequence: 'role' },
  msx_fight_trade: { consequence: 'chemistry', forceTrade: true },
  msx_club_apology: { consequence: 'neutral' },
  msx_club_own: { consequence: 'chemistry' },
  msx_bench_meeting: { consequence: 'standing' },
  msx_bench_accept: { consequence: 'neutral' },
  msx_viral_milk: { consequence: 'focus' },
  msx_viral_lock: { consequence: 'neutral' },
  msx_family_home: { consequence: 'role' },
  msx_family_stay: { consequence: 'neutral' },
  msx_ref_rein: { consequence: 'neutral' },
  msx_ref_edge: { consequence: 'role' },
  msx_tweet_clarify: { consequence: 'neutral' },
  msx_tweet_silence: { consequence: 'standing' },
  msx_legend_fuel: { consequence: 'spark' },
  msx_legend_brush: { consequence: 'neutral' },
  msx_pos_embrace: { consequence: 'neutral' },
  msx_pos_resist: { consequence: 'chemistry' },
  msx_leak_lean: { consequence: 'standing' },
  msx_leak_downplay: { consequence: 'neutral' },
  msx_prank_own: { consequence: 'neutral' },
  msx_prank_laugh: { consequence: 'chemistry' },
  msx_probe_pr: { consequence: 'neutral' },
  msx_probe_silent: { consequence: 'standing' },
  msx_allstar_chase: { consequence: 'chemistry' },
  msx_allstar_defer: { consequence: 'spark' },
};

export interface MidResolveCtx {
  role: Role;
  phase: CareerPhase;
  age: number;
}

export interface MidResolution {
  effect: SeasonEffect;
  /** Change to the standing with the current team (usually negative). */
  franchiseDelta: number;
  /** One-line description of how it actually landed. */
  note: string;
}

/**
 * Turn a chosen option into this season's mechanical cost, rolled and scaled by
 * status. Consumes RNG — call once, at resolve time.
 */
export function resolveMidseason(rng: Rng, optionId: string, ctx: MidResolveCtx): MidResolution {
  const outcome = MIDSEASON_OUTCOMES[optionId] ?? { consequence: 'neutral' };
  const star = ctx.role === 'franchise' || ctx.role === 'starter';
  const young = ctx.phase === 'rookie' || ctx.phase === 'rising';
  const m = 0.6 + rng() * 0.9; // 0.6 … 1.5

  const effect: SeasonEffect = {};
  let franchiseDelta = 0;
  let note: string;

  switch (outcome.consequence) {
    case 'standing':
      franchiseDelta = -Math.round((star ? 24 : 13) * m);
      effect.teamMult = 1 - 0.015 * m;
      if (!star) effect.roleBias = -0.25 * m;
      note = star
        ? 'The front office and fans cool on you for a while.'
        : 'You slide down the pecking order.';
      break;
    case 'role':
      if (young) {
        effect.roleBias = -(0.4 + 0.55 * m);
        effect.mpgBias = -(3 + 4.5 * m);
        note = 'Your minutes get cut while it plays out.';
      } else if (star) {
        franchiseDelta = -Math.round(11 * m);
        effect.teamMult = 1 - 0.012 * m;
        note = "They can't sit you — but the trust dips.";
      } else {
        effect.roleBias = -(0.2 + 0.4 * m);
        effect.mpgBias = -(2 + 3 * m);
        note = 'A stretch of DNPs to send a message.';
      }
      break;
    case 'chemistry':
      effect.teamMult = 1 - (0.03 + 0.045 * m);
      note = 'The locker room feels it for a month.';
      break;
    case 'focus':
      effect.impactMult = 1 - (0.03 + 0.05 * m);
      note = 'It nags at your game for the rest of the year.';
      break;
    case 'spark':
      if (rng() < 0.5) effect.impactMult = 1 + 0.02 + 0.02 * m;
      else effect.teamMult = 1 + 0.02 + 0.025 * m;
      franchiseDelta = Math.round(6 * m);
      note = 'You channel it — the room rallies around you.';
      break;
    case 'neutral':
    default:
      effect.hype = rng() < 0.5 ? 2 : -2;
      note = 'It blows over in a week.';
  }

  if (outcome.forceTrade) {
    effect.forceTrade = true;
    effect.impactMult = (effect.impactMult ?? 1) * (1 + 0.02 * m);
    franchiseDelta = 0;
    note = 'You get your wish — moved at the deadline.';
  }

  return { effect, franchiseDelta, note };
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
