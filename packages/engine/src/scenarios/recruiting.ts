import { int, type Rng } from '../rng.js';
import type { GameOption, PrologueNode } from '../types.js';
import { balancedEffect, PLAYMAKING, rollEdge, SCORING, SLASHING } from './prologue-roll.js';

/** Recruiting only picks a school tier. The actual school comes in college1. */
export const RECRUITING_TEMPLATE = {
  id: 'recruiting',
  stage: 'Recruiting',
  title: 'THE DECISION',
  prompt: 'The letters are in and the cameras are on. Where do you take your talents?',
  options: [
    {
      id: 'blue_blood',
      label: 'BLUE-BLOOD',
      blurb: 'Bright lights, a loaded roster, a coach who sends players to the lottery.',
      tag: 'Pedigree',
    },
    {
      id: 'mid_major_hub',
      label: 'MID-MAJOR',
      blurb: 'A development-first program where you start day one and get 30 shots.',
      tag: 'High usage',
    },
    {
      id: 'overseas_pro',
      label: 'OVERSEAS PRO',
      blurb: 'Get paid now, practise against seasoned men, live far from home.',
      tag: 'Pro habits',
    },
  ],
} as const;

/** Builds the recruiting choice. All three tiers are worth about the same, with a small random bonus on one. */
export function buildRecruitingNode(rng: Rng): PrologueNode {
  const TARGET = 5;
  const edge = rollEdge(rng, 3);
  const bumpFor = (i: number) => (i === edge.index ? edge.bump : 0);
  const t = RECRUITING_TEMPLATE;
  const stock = () => int(rng, 4, 6);

  const options: GameOption[] = [
    {
      ...t.options[0],
      effect: { ...balancedEffect(rng, PLAYMAKING, TARGET + bumpFor(0), 0), draftStock: stock() },
      stance: { tag: t.options[0].tag },
    },
    {
      ...t.options[1],
      effect: { ...balancedEffect(rng, SCORING, TARGET + bumpFor(1), 1), draftStock: stock() },
      stance: { tag: t.options[1].tag, roleBias: 0.2 },
    },
    {
      ...t.options[2],
      effect: { ...balancedEffect(rng, SLASHING, TARGET + bumpFor(2), 2), draftStock: stock() },
      stance: { tag: t.options[2].tag },
    },
  ];

  return { id: t.id, stage: t.stage, title: t.title, prompt: t.prompt, options };
}
