import { pick, type Rng } from '../rng.js';
import { RATING_KEYS, type GameOption, type PrologueNode } from '../types.js';
import { balancedEffect, GLASS, rollEdge, SCORING, SLASHING } from './prologue-roll.js';

/** The text is fixed, the numbers are rolled each career. */
export const HIGH_SCHOOL_TEMPLATE = {
  id: 'highschool',
  stage: 'High School',
  title: 'THE SUMMER CIRCUIT',
  prompt:
    "You're a consensus top-100 recruit with one summer left to make your name. How do you spend it?",
  options: [
    {
      id: 'aau_superteam',
      label: 'RING CHASER',
      blurb: 'Join the loaded AAU superteam and chase the EYBL title.',
      tag: 'Winning pedigree',
    },
    {
      id: 'hometown_loyalty',
      label: 'HOMETOWN HERO',
      blurb: 'Carry your local program and pour in 28 a night.',
      tag: 'Ball-dominant',
    },
    {
      id: 'skills_camp',
      label: 'GYM RAT',
      blurb: 'Skip the games for trainers, film, and combine prep.',
      tag: 'Development',
    },
  ],
} as const;

/** Builds the summer circuit choice. All three options are worth about the same, with a small random bonus on one. */
export function buildHighSchoolNode(rng: Rng): PrologueNode {
  const TARGET = 8;
  const edge = rollEdge(rng, 3);
  const bumpFor = (i: number) => (i === edge.index ? edge.bump : 0);
  const t = HIGH_SCHOOL_TEMPLATE;

  const options: GameOption[] = [
    {
      ...t.options[0],
      // Ring chaser: defense and feel, with a bit of IQ growth.
      effect: balancedEffect(rng, SLASHING, TARGET + bumpFor(0), 1),
      stance: {
        tag: t.options[0].tag,
        teamMult: 1.02,
        impactMult: 0.99,
        growthBias: { basketballIQ: 1 },
        growthBiasSeasons: 3,
      },
    },
    {
      ...t.options[1],
      // Hometown hero: scorer with high usage.
      effect: balancedEffect(rng, SCORING, TARGET + bumpFor(1), 0),
      stance: { tag: t.options[1].tag, impactMult: 1.03, roleBias: 0.2 },
    },
    {
      ...t.options[2],
      // Gym rat: more athleticism and durability, plus a random growth boost.
      effect: balancedEffect(rng, GLASS, TARGET + bumpFor(2), 2),
      stance: {
        tag: t.options[2].tag,
        growthBias: { [pick(rng, RATING_KEYS)]: 1 },
        growthBiasSeasons: 3,
      },
    },
  ];

  return { id: t.id, stage: t.stage, title: t.title, prompt: t.prompt, options };
}
