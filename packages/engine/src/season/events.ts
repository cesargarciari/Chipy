import { weightedPick, type Rng } from '../rng.js';
import type { Role } from '../types.js';
import type { SeasonEffect } from './effects.js';

export interface EventContext {
  age: number;
  role: Role;
  teamStrength: number;
  contractYearsLeft: number;
  seasonIndex: number;
  /** 0..1 from perks — scales bad-luck event weight down. */
  slumpResist: number;
}

interface EventDef {
  id: string;
  weight: (c: EventContext) => number;
  apply: (rng: Rng, c: EventContext) => { headline: string; effect: SeasonEffect };
}

const resist = (r: number) => Math.max(0.15, 1 - r);

// Injuries are their own per-season system now (`season/injuries.ts`), rolled
// independently of this single "flavour event" so a career can't dodge them all.
const EVENTS: EventDef[] = [
  {
    id: 'quiet_year',
    weight: () => 3,
    apply: () => ({
      headline: 'A steady, professional season — nothing to write home about.',
      effect: {},
    }),
  },
  {
    id: 'breakout',
    weight: (c) => (c.age <= 25 ? 2.4 : 1.0),
    apply: () => ({
      headline: 'Something clicks — you go on a two-month tear the whole league notices.',
      effect: {
        impactMult: 1.14,
        hype: 6,
        growth: { finishing: 1, threePoint: 1, basketballIQ: 1 },
      },
    }),
  },
  {
    id: 'slump',
    weight: (c) => 1.4 * resist(c.slumpResist),
    apply: () => ({
      headline: "You can't buy a bucket for six weeks and the bench eats your minutes.",
      effect: { impactMult: 0.9, hype: -3, roleBias: -0.4 },
    }),
  },
  {
    id: 'coaching_change',
    weight: (c) => (c.teamStrength < 0.5 ? 1.6 : 0.8),
    apply: (rng) => {
      const up = rng() < 0.5;
      return {
        headline: up
          ? 'A midseason coaching change unlocks your role.'
          : 'A new coach arrives and your role shrinks overnight.',
        effect: { roleBias: up ? 0.6 : -0.6, mpgBias: up ? 3 : -4 },
      };
    },
  },
  {
    id: 'deadline_trade',
    weight: (c) =>
      (c.teamStrength < 0.45 ? 1.4 : 0.6) +
      (c.contractYearsLeft <= 1 ? 0.8 : 0) +
      (c.role === 'bench' ? 0.4 : 0),
    apply: () => ({
      headline: 'The phone rings at the trade deadline — you have a new home.',
      effect: { forceTrade: true },
    }),
  },
  {
    id: 'locker_room_leader',
    weight: (c) => (c.age >= 27 ? 1.6 : 0.5),
    apply: () => ({
      headline: 'Teammates start looking to you in every huddle.',
      effect: { growth: { basketballIQ: 2 }, teamMult: 1.06, hype: 2 },
    }),
  },
  {
    id: 'teammate_feud',
    weight: (c) => 0.9 * resist(c.slumpResist),
    apply: () => ({
      headline: 'A public spat with a teammate drags on for weeks.',
      effect: { impactMult: 0.94, teamMult: 0.95, hype: 1 },
    }),
  },
  {
    id: 'clutch_moment',
    weight: (c) => (c.role === 'franchise' || c.role === 'starter' ? 1.4 : 0.5),
    apply: () => ({
      headline: 'You bury a buzzer-beater on national TV. The legend grows.',
      effect: { hype: 8, awardMult: { scoring: 1.1 } },
    }),
  },
  {
    id: 'load_management',
    weight: (c) => (c.age >= 30 ? 1.6 : 0),
    apply: () => ({
      headline: 'The staff rests you on back-to-backs to keep you fresh for spring.',
      effect: { mpgBias: -4, durability: 2, injuredGames: 6 },
    }),
  },
  {
    id: 'all_star_snub',
    weight: (c) => (c.age >= 24 && c.age <= 32 ? 1.1 : 0.3),
    apply: () => ({
      headline:
        'Left off the All-Star team, you play the second half with a chip on your shoulder.',
      effect: { hype: 3, growth: { midRange: 1, threePoint: 1 }, impactMult: 1.04 },
    }),
  },
];

export function rollEvent(
  rng: Rng,
  ctx: EventContext,
): { id: string; headline: string; effect: SeasonEffect } {
  const entries = EVENTS.map((e) => [e, Math.max(0, e.weight(ctx))] as const).filter(
    ([, w]) => w > 0,
  );
  const chosen = weightedPick(rng, entries);
  const { headline, effect } = chosen.apply(rng, ctx);
  return { id: chosen.id, headline, effect };
}
