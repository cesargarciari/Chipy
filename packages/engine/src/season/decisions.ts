import type { CareerPhase, SeasonDecisionOption } from '../types.js';
import type { SeasonEffect } from './effects.js';

export interface DecisionDef {
  id: string;
  label: string;
  blurb: string;
  headline: string;
  effect: SeasonEffect;
  /** `retire` — end the career instead of playing this season. */
  terminal?: boolean;
}

const EARLY: DecisionDef[] = [
  {
    id: 'add_gogo_move',
    label: 'Add a go-to move',
    blurb: 'Spend the summer building a counter for every kind of defense.',
    headline: 'You add a go-to move and a counter, and defenders stop cheating off you.',
    effect: { growth: { midRange: 2, finishing: 1 }, awardMult: { scoring: 1.05 } },
  },
  {
    id: 'lockdown_summer',
    label: 'Commit to the defensive end',
    blurb: 'Film, footwork, and conditioning until you can guard three positions.',
    headline: 'You come back able to switch onto anyone.',
    effect: { growth: { perimeterDefense: 2, interiorDefense: 1 }, awardMult: { defense: 1.1 } },
  },
  {
    id: 'playmaking_reps',
    label: 'Learn to run a team',
    blurb: 'Thousands of pick-and-roll reps and film with the coaching staff.',
    headline: 'The game slows down; you start seeing the second and third option.',
    effect: { growth: { playmaking: 2, basketballIQ: 1 }, awardMult: { playmaking: 1.05 } },
  },
  {
    id: 'add_strength',
    label: 'Add strength and explosiveness',
    blurb: 'A full offseason in the weight room and on the track.',
    headline: 'You show up fifteen pounds of muscle heavier and still bouncy.',
    effect: { athleticism: 2, durability: 2, growth: { finishing: 1, rebounding: 1 } },
  },
];

const PRIME: DecisionDef[] = [
  {
    id: 'chase_scoring',
    label: 'Hunt the scoring title',
    blurb: 'Green light from everywhere, every possession.',
    headline: 'You take — and make — more shots than anyone in the league.',
    effect: { impactMult: 1.06, mpgBias: 1, awardMult: { scoring: 1.18 }, teamMult: 0.98 },
  },
  {
    id: 'anchor_defense',
    label: 'Anchor the defense',
    blurb: 'Take the toughest assignment and quarterback the back line every night.',
    headline: 'Opponents game-plan away from wherever you are.',
    effect: { growth: { perimeterDefense: 1, interiorDefense: 1 }, awardMult: { defense: 1.22 } },
  },
  {
    id: 'facilitate',
    label: 'Run the offense through you',
    blurb: 'Everything starts in your hands; you make everyone else better.',
    headline: 'Teammates have career years playing off your reads.',
    effect: {
      growth: { playmaking: 2, basketballIQ: 1 },
      awardMult: { playmaking: 1.2 },
      teamMult: 1.03,
    },
  },
  {
    id: 'sacrifice_to_win',
    label: 'Sacrifice stats to win',
    blurb: 'Fewer shots, more winning plays, all-in on a title.',
    headline: 'Your numbers dip and your team surges.',
    effect: { impactMult: 0.92, teamMult: 1.12 },
  },
];

const LATE: DecisionDef[] = [
  {
    id: 'reinvent_role',
    label: 'Reinvent as a 3-and-D role player',
    blurb: 'Trade usage for spacing and switchability; extend the career.',
    headline: 'You reinvent yourself as a connector who still guards and shoots.',
    effect: { growth: { threePoint: 2, perimeterDefense: 1 }, roleBias: -0.3, durability: 1 },
  },
  {
    id: 'mentor_core',
    label: 'Mentor the young core',
    blurb: 'Be the voice in the locker room and on the bench.',
    headline: 'The young players credit you for their leap.',
    effect: { growth: { basketballIQ: 2 }, teamMult: 1.08, hype: 2 },
  },
  {
    id: 'one_more_run',
    label: 'One more max-effort run',
    blurb: 'Empty the tank; worry about the body later.',
    headline: 'You will yourself to one more big season.',
    effect: { impactMult: 1.05, athleticism: -1, durability: -2 },
  },
  {
    id: 'chase_ring',
    label: 'Fit in on a contender',
    blurb: 'Whatever the team needs, in service of a title.',
    headline: 'You take a smaller role for a real shot at a ring.',
    effect: { impactMult: 0.95, teamMult: 1.1 },
  },
];

const RETIRE: DecisionDef = {
  id: 'retire',
  label: 'Retire',
  blurb: 'Call a press conference and walk away on your own terms.',
  headline: 'You announce your retirement to a standing ovation.',
  effect: {},
  terminal: true,
};

const ALL_DEFS = [...EARLY, ...PRIME, ...LATE, RETIRE];
const BY_ID = new Map(ALL_DEFS.map((d) => [d.id, d]));

function poolFor(phase: CareerPhase): DecisionDef[] {
  if (phase === 'rookie' || phase === 'rising') return EARLY;
  if (phase === 'prime') return PRIME;
  return LATE;
}

export interface OffseasonDecision {
  title: string;
  prompt: string;
  defs: DecisionDef[];
  options: SeasonDecisionOption[];
}

export function offseasonDecision(
  phase: CareerPhase,
  retirementEligible: boolean,
): OffseasonDecision {
  const defs = [...poolFor(phase)];
  if (retirementEligible) defs.push(RETIRE);
  return {
    title:
      phase === 'prime'
        ? 'The prime years'
        : phase === 'veteran' || phase === 'decline'
          ? 'The back nine'
          : 'The next step',
    prompt: 'What do you dedicate this offseason to?',
    defs,
    options: defs.map((d) => ({ id: d.id, label: d.label, blurb: d.blurb })),
  };
}

export function getDecisionDef(choiceId: string): DecisionDef | undefined {
  return BY_ID.get(choiceId);
}
