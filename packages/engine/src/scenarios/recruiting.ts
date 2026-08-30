import { int, type Rng } from '../rng.js';
import type { GameOption, PrologueNode } from '../types.js';
import { balancedEffect, PLAYMAKING, rollEdge, SCORING, SLASHING } from './prologue-roll.js';

/**
 * The recruiting choice only picks a *tier*. `college1` then offers real
 * programs from that tier and a freshman year is simulated — so the real
 * draft-stock swing comes from the school + how you play, not from here. The
 * effects on these options are light, equal-value tier flavour, rerolled per
 * career.
 */
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
      id: 'g_league_ignite',
      label: 'G LEAGUE IGNITE',
      blurb: 'A paid development team built to prepare prospects for the next level.',
      tag: 'Pro prep',
    },
    {
      id: 'overseas_pro',
      label: 'OVERSEAS PRO',
      blurb: 'Get paid now, practise against seasoned men, live far from home.',
      tag: 'Pro habits',
    },
  ],
} as const;

/**
 * Four tier options of equal card value (~5 shown attribute points plus a
 * similar draft-stock bump), with one getting a small random edge each career.
 * The pool and athleticism/durability share are rerolled per playthrough so no
 * tier is a permanent best pick.
 */
export function buildRecruitingNode(rng: Rng): PrologueNode {
  const TARGET = 5;
  const edge = rollEdge(rng, 4);
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
    {
      ...t.options[3],
      effect: { ...balancedEffect(rng, PLAYMAKING, TARGET + bumpFor(3), 2), draftStock: stock() },
      stance: { tag: t.options[3].tag },
    },
  ];

  return { id: t.id, stage: t.stage, title: t.title, prompt: t.prompt, options };
}
