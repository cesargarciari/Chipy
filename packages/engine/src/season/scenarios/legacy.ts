import type { Scenario } from '../scenario-types.js';

export const legacyScenarios: Scenario[] = [
  {
    id: 'legacy_ring_chase',
    theme: 'legacy',
    gate: { phase: ['veteran', 'decline'], weight: 1.1 },
    title: 'ONE MORE SHOT AT A RING',
    prompt: 'The window is closing. What do you sacrifice for it?',
    options: [
      {
        id: 'ring_sacrifice',
        label: 'SACRIFICE TOUCHES',
        blurb: 'Fewer shots, more winning plays.',
        effect: { ratings: { basketballIQ: 3, perimeterDefense: 2 } },
        stance: { tag: 'Team-first', impactMult: 0.9, teamMult: 1.14 },
      },
      {
        id: 'ring_closer',
        label: 'BE THE CLOSER',
        blurb: 'The ball in your hands with the game on the line.',
        effect: { ratings: { midRange: 5, threePoint: 4 } },
        stance: { impactMult: 1.06, teamMult: 1.04 },
      },
      {
        id: 'ring_lead_young',
        label: 'LEAD THE YOUNG GUYS',
        blurb: 'Turn a talented team into a real one.',
        effect: { ratings: { basketballIQ: 5 } },
        stance: { tag: 'Mentor', teamMult: 1.08, roleBias: -0.3 },
      },
    ],
  },
  {
    id: 'legacy_stat_chase',
    theme: 'legacy',
    gate: { phase: ['veteran', 'decline'], role: ['starter', 'franchise'] },
    title: 'THE RECORD BOOKS',
    prompt: 'A career milestone is within reach.',
    options: [
      {
        id: 'stat_hunt',
        label: 'HUNT THE MILESTONE',
        blurb: 'Get the number. Frame the box score.',
        effect: { ratings: { finishing: 5, midRange: 4 } },
        stance: { impactMult: 1.08, teamMult: 0.96, awardMult: { scoring: 1.1 } },
      },
      {
        id: 'stat_balanced',
        label: 'A COMPLETE GAME',
        blurb: 'Fill every column. Let history sort it out.',
        effect: { ratings: { playmaking: 4, threePoint: 3, rebounding: 2 } },
      },
      {
        id: 'stat_letit_come',
        label: 'LET IT COME',
        blurb: 'Play right. The numbers follow.',
        effect: { ratings: { basketballIQ: 4 }, durability: 2 },
      },
    ],
  },
  {
    id: 'legacy_last_dance',
    theme: 'legacy',
    gate: { minAge: 34, once: true },
    title: 'THE LAST DANCE',
    prompt: 'Everyone knows this is close to the end. How do you spend it?',
    options: [
      {
        id: 'last_empty_tank',
        label: 'EMPTY THE TANK',
        blurb: 'Leave nothing. Worry about the body later.',
        effect: { ratings: { finishing: 4 }, athleticism: 2, durability: -3 },
        stance: { impactMult: 1.06 },
      },
      {
        id: 'last_pace',
        label: 'PACE YOURSELF',
        blurb: 'Be there in the fourth quarter of the season.',
        effect: { durability: 5 },
        stance: { roleBias: -0.3 },
      },
      {
        id: 'last_role_player',
        label: 'REINVENT AS A ROLE PLAYER',
        blurb: 'Spacing and switchability. Extend it a year.',
        effect: { ratings: { threePoint: 6, perimeterDefense: 4 } },
        stance: { tag: '3-and-D', roleBias: -0.4 },
      },
    ],
  },
  {
    id: 'legacy_stay_or_chase',
    theme: 'legacy',
    gate: { minAge: 30, role: ['franchise'], once: true },
    title: 'STAY OR CHASE?',
    prompt: 'You could be a lifer here — or go win somewhere else.',
    options: [
      {
        id: 'stay_lifer',
        label: 'FRANCHISE LIFER',
        blurb: 'One jersey. One city. One statue.',
        effect: { ratings: { basketballIQ: 2 } },
        stance: { teamMult: 1.05 },
      },
      {
        id: 'stay_test_waters',
        label: 'TEST THE WATERS',
        blurb: 'See what a contender would give up for you.',
        effect: { ratings: { finishing: 3 } },
        stance: { teamMult: 0.98, valueMult: 1.05, valueMultSeasons: 3 },
      },
      {
        id: 'stay_superteam',
        label: 'TAKE LESS, BUILD A SUPERTEAM',
        blurb: 'Rings over recognition.',
        effect: { ratings: { basketballIQ: 3 } },
        stance: { impactMult: 0.94, teamMult: 1.12 },
      },
    ],
  },
];
