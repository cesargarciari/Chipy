import { jitter } from '../rng.js';
import type { PrologueNode } from '../types.js';

export const highSchoolNode: PrologueNode = {
  id: 'highschool',
  stage: 'High School',
  title: 'The Summer Circuit',
  prompt:
    "You're a consensus top-100 recruit with one summer left to make your name. How do you spend it?",
  choices: [
    {
      id: 'aau_superteam',
      label: 'Join the AAU superteam',
      blurb: 'Chase rings with other blue-chippers on the Nike EYBL circuit.',
      resolve: ({ rng }) => ({
        ratings: { basketballIQ: 2 + jitter(rng, 2), playmaking: -1 },
        hype: 10 + jitter(rng, 3),
        draftStock: 4 + jitter(rng, 2),
        headline:
          'You win the EYBL title in a loaded backcourt. Scouts love the winning but wonder about your usage.',
      }),
    },
    {
      id: 'hometown_loyalty',
      label: 'Stay with your hometown program',
      blurb: 'Be the entire offense for the local squad you grew up with.',
      resolve: ({ rng }) => ({
        ratings: {
          finishing: 3 + jitter(rng, 2),
          midRange: 3 + jitter(rng, 2),
          threePoint: 2 + jitter(rng, 1),
        },
        hype: 2 + jitter(rng, 2),
        durability: -1,
        draftStock: 1 + jitter(rng, 1),
        headline:
          'You pour in 28 a night against lighter competition. The polish is obvious; the level of play is not.',
      }),
    },
    {
      id: 'skills_camp',
      label: 'Grind the skills-camp circuit',
      blurb: 'Trainers, film sessions, and combine prep instead of games.',
      resolve: ({ rng }) => ({
        ratings: {
          threePoint: 3 + jitter(rng, 2),
          basketballIQ: 3 + jitter(rng, 1),
        },
        athleticism: 4 + jitter(rng, 2),
        hype: -2 + jitter(rng, 2),
        durability: 2,
        draftStock: 3 + jitter(rng, 2),
        headline:
          'You add three inches to your vertical and a real pull-up jumper. The highlight reel is thin but the tape is clean.',
      }),
    },
  ],
};
