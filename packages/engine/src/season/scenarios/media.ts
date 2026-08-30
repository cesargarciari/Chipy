import type { Scenario } from '../scenario-types.js';

export const mediaScenarios: Scenario[] = [
  {
    id: 'media_platform',
    theme: 'media',
    gate: { maxAge: 26, once: true },
    title: 'YOUR PLATFORM',
    prompt: 'The following is growing fast. What do you do with it?',
    options: [
      {
        id: 'plat_brand',
        label: 'BUILD THE BRAND',
        blurb: 'Content, drops, a whole media company.',
        effect: { money: 5 },
        stance: { teamMult: 0.99 },
      },
      {
        id: 'plat_game',
        label: 'LET THE GAME TALK',
        blurb: 'Log off. Get buckets.',
        effect: { ratings: { basketballIQ: 3 }, durability: 2 },
      },
      {
        id: 'plat_spots',
        label: 'PICK YOUR SPOTS',
        blurb: 'Show up when it matters, disappear when it does not.',
        effect: { ratings: { midRange: 3, threePoint: 2 } },
      },
    ],
  },
  {
    id: 'media_snub',
    theme: 'media',
    gate: {
      minSeason: 3,
      role: ['starter', 'franchise'],
      predicate: (c) => !c.hasAward('all_star'),
    },
    title: 'THE SNUB',
    prompt: 'The All-Star reserves are out and your name is not on the list.',
    options: [
      {
        id: 'snub_chip',
        label: 'CHIP ON THE SHOULDER',
        blurb: 'Every game the rest of the year is personal.',
        effect: { ratings: { finishing: 3, threePoint: 3 } },
        stance: { impactMult: 1.05 },
      },
      {
        id: 'snub_high_road',
        label: 'THE HIGH ROAD',
        blurb: 'Congratulate the guys who made it. Keep working.',
        effect: { ratings: { basketballIQ: 3, perimeterDefense: 2 } },
      },
      {
        id: 'snub_ignore',
        label: 'TUNE IT OUT',
        blurb: 'Awards are noise. Winning is the point.',
        effect: { durability: 2, ratings: { perimeterDefense: 3 } },
      },
    ],
  },
  {
    id: 'media_hometown',
    theme: 'media',
    gate: { minAge: 27, once: true },
    title: 'RETURN TO YOUR ROOTS',
    prompt: 'The place that made you wants something back.',
    options: [
      {
        id: 'roots_gym',
        label: 'OPEN A GYM',
        blurb: 'Free courts and coaching for the next kid.',
        effect: { ratings: { basketballIQ: 2 } },
        stance: { teamMult: 1.03 },
      },
      {
        id: 'roots_foundation',
        label: 'A QUIET FOUNDATION',
        blurb: 'No cameras. Just help.',
        effect: { ratings: { basketballIQ: 3 }, durability: 2 },
      },
      {
        id: 'roots_focus',
        label: 'STAY LOCKED IN',
        blurb: "There's a season to win first.",
        effect: { ratings: { finishing: 3 }, durability: 2 },
      },
    ],
  },
];
