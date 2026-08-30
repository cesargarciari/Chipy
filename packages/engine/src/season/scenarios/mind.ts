import type { Scenario } from '../scenario-types.js';

export const mindScenarios: Scenario[] = [
  {
    id: 'mind_film',
    theme: 'mind',
    gate: { weight: 0.9 },
    title: 'TAPE STUDY',
    prompt: 'How deep do you go into the film this year?',
    options: [
      {
        id: 'film_obsessive',
        label: 'OBSESSIVE',
        blurb: 'Every possession, every opponent, all summer.',
        effect: { ratings: { basketballIQ: 7 } },
        stance: { growthBias: { basketballIQ: 1 } },
      },
      {
        id: 'film_situational',
        label: 'SITUATIONAL',
        blurb: 'Late-clock, out-of-timeout, playoff tendencies.',
        effect: { ratings: { basketballIQ: 4, perimeterDefense: 2 } },
      },
      {
        id: 'film_instinct',
        label: 'TRUST INSTINCTS',
        blurb: 'Overthinking is slower than reacting.',
        effect: { ratings: { finishing: 2 }, athleticism: 3 },
      },
    ],
  },
  {
    id: 'mind_psych',
    theme: 'mind',
    gate: { minSeason: 3, once: true },
    title: 'THE MENTAL GAME',
    prompt: 'The physical work is done. What about the head?',
    options: [
      {
        id: 'psych_coach',
        label: 'HIRE A PERFORMANCE COACH',
        blurb: 'Someone in your corner for the hard nights.',
        effect: { ratings: { basketballIQ: 5 }, durability: 2 },
        stance: { impactMult: 1.03 },
      },
      {
        id: 'psych_routine',
        label: 'MEDITATION AND ROUTINE',
        blurb: 'Same warmup, same breath, every game.',
        effect: { durability: 4, ratings: { basketballIQ: 3 } },
      },
      {
        id: 'psych_tough',
        label: 'TOUGH IT OUT',
        blurb: 'You have gotten this far on will.',
        effect: { durability: 2, ratings: { finishing: 3 } },
      },
    ],
  },
  {
    id: 'mind_slump',
    theme: 'mind',
    gate: { minSeason: 2 },
    title: 'THE SHOOTING SLUMP',
    prompt: 'Six weeks of bricks. The doubt is creeping in.',
    options: [
      {
        id: 'slump_shoot_out',
        label: 'SHOOT YOUR WAY OUT',
        blurb: 'The next one is going in. And the one after.',
        effect: { ratings: { threePoint: 5, finishing: 3 } },
        stance: { impactMult: 1.04 },
      },
      {
        id: 'slump_simplify',
        label: 'SIMPLIFY',
        blurb: 'Cut the tough shots. Take what the defense gives.',
        effect: { ratings: { basketballIQ: 4, playmaking: 3 } },
        stance: { roleBias: -0.2 },
      },
      {
        id: 'slump_defense',
        label: 'LEAN ON DEFENSE',
        blurb: 'If the shot is not there, take the ball away.',
        effect: { ratings: { perimeterDefense: 6, interiorDefense: 3 } },
      },
    ],
  },
  {
    id: 'mind_stay_course',
    theme: 'mind',
    gate: { weight: 0.5 },
    title: 'STAY THE COURSE',
    prompt: 'No drama this offseason. Just work. Where do you put it?',
    options: [
      {
        id: 'course_grind',
        label: 'KEEP GRINDING',
        blurb: 'A little better at everything.',
        effect: { ratings: { basketballIQ: 2 }, durability: 2 },
      },
      {
        id: 'course_weakness',
        label: 'SHARPEN A WEAKNESS',
        blurb: 'Attack the thing scouts wrote in their reports.',
        effect: { ratings: { perimeterDefense: 3, threePoint: 3 } },
      },
      {
        id: 'course_strength',
        label: 'DOUBLE DOWN ON STRENGTHS',
        blurb: 'Be undeniable at the thing you do best.',
        effect: { ratings: { finishing: 4 } },
      },
    ],
  },
];
