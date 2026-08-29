import { jitter } from '../rng.js';
import type { PrologueNode } from '../types.js';

export const recruitingNode: PrologueNode = {
  id: 'recruiting',
  stage: 'Recruiting',
  title: 'The Decision',
  prompt: 'The letters are in and the cameras are on. Where do you take your talents?',
  choices: [
    {
      id: 'blue_blood',
      label: 'Commit to a blue-blood',
      blurb: 'Bright lights, a loaded roster, and a coach who sends players to the lottery.',
      resolve: ({ rng }) => ({
        ratings: {
          basketballIQ: 3 + jitter(rng, 2),
          perimeterDefense: 2 + jitter(rng, 2),
          playmaking: -2,
        },
        hype: 12 + jitter(rng, 3),
        draftStock: 8 + jitter(rng, 3),
        headline:
          'You come off the bench for a Final Four team. Modest numbers, but you guarded everyone and NBA staffs trust the pedigree.',
      }),
    },
    {
      id: 'mid_major_hub',
      label: 'Pick a development-first mid-major',
      blurb: 'Somewhere you start on day one and get thirty shots if you want them.',
      resolve: ({ rng }) => ({
        ratings: {
          finishing: 4 + jitter(rng, 2),
          threePoint: 4 + jitter(rng, 2),
          playmaking: 3 + jitter(rng, 2),
          basketballIQ: 2,
        },
        hype: -2 + jitter(rng, 2),
        draftStock: 2 + jitter(rng, 2),
        headline:
          'You post 22-6-5 as a freshman and drag them into March. Evaluators keep circling "level of competition."',
      }),
    },
    {
      id: 'g_league_ignite',
      label: 'Join the G League Ignite',
      blurb: 'A paid development team built to prepare prospects for the next level.',
      resolve: ({ rng }) => ({
        ratings: {
          perimeterDefense: 3 + jitter(rng, 2),
          basketballIQ: 3 + jitter(rng, 1),
        },
        athleticism: 2 + jitter(rng, 2),
        hype: 2 + jitter(rng, 2),
        draftStock: 6 + jitter(rng, 3),
        headline:
          'You spend a year scrimmaging against grown professionals. The film is exactly what front offices want to study.',
      }),
    },
    {
      id: 'overseas_pro',
      label: 'Sign overseas as a pro',
      blurb: 'Get paid now, practice against seasoned men, live far from home.',
      resolve: ({ rng }) => ({
        ratings: {
          perimeterDefense: 4 + jitter(rng, 2),
          basketballIQ: 4 + jitter(rng, 2),
        },
        athleticism: 3 + jitter(rng, 2),
        hype: -4 + jitter(rng, 2),
        durability: 3,
        draftStock: 5 + jitter(rng, 3),
        headline:
          'A season against veterans hardens your game and your body. Casual fans have no idea who you are yet.',
      }),
    },
  ],
};
