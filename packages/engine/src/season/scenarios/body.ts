import type { Scenario } from '../scenario-types.js';

export const bodyScenarios: Scenario[] = [
  {
    id: 'body_conditioning',
    theme: 'body',
    gate: { weight: 0.9 },
    title: 'SUMMER SHAPE',
    prompt: 'How hard do you push the body this offseason?',
    options: [
      {
        id: 'cond_grind',
        label: 'THE FULL GRIND',
        blurb: 'Two-a-days from July. Show up a monster.',
        effect: { athleticism: 3, durability: 6 },
      },
      {
        id: 'cond_balanced',
        label: 'BALANCED BLOCK',
        blurb: 'Strength, skill, and rest in equal measure.',
        effect: { ratings: { basketballIQ: 2 }, durability: 3 },
      },
      {
        id: 'cond_rest',
        label: 'REST AND RESET',
        blurb: 'Heal every nagging thing before camp.',
        effect: { durability: 5 },
        stance: { roleBias: -0.2 },
      },
    ],
  },
  {
    id: 'body_load_mgmt',
    theme: 'body',
    gate: { minAge: 30, weight: 1.1 },
    title: 'THE LOAD-MANAGEMENT ERA',
    prompt: 'Sports science says sit. Your competitiveness says play.',
    options: [
      {
        id: 'load_sit',
        label: 'SIT THE BACK-TO-BACKS',
        blurb: 'Fresh legs for the games that matter.',
        effect: { durability: 6 },
        stance: { roleBias: -0.4 },
      },
      {
        id: 'load_play',
        label: 'PLAY EVERY NIGHT',
        blurb: 'The fans paid to see you. Suit up.',
        effect: { durability: -2, ratings: { finishing: 2 } },
        stance: { impactMult: 1.04 },
      },
      {
        id: 'load_hybrid',
        label: 'PICK YOUR SPOTS',
        blurb: 'Play the rivals, rest the also-rans.',
        effect: { durability: 4 },
      },
    ],
  },
  {
    id: 'body_rehab',
    theme: 'body',
    gate: { predicate: (c) => c.durability < 64 },
    title: 'REHAB CROSSROADS',
    prompt: "The body's been fragile. How do you come back?",
    options: [
      {
        id: 'rehab_aggressive',
        label: 'RUSH BACK',
        blurb: 'The team needs you now.',
        effect: { athleticism: 2, durability: -3, ratings: { finishing: 2 } },
        stance: { impactMult: 1.03 },
      },
      {
        id: 'rehab_patient',
        label: 'DO IT RIGHT',
        blurb: 'Full rebuild of the movement pattern.',
        effect: { durability: 9 },
      },
      {
        id: 'rehab_reinvent',
        label: 'CHANGE YOUR GAME',
        blurb: 'Less explosion, more skill.',
        effect: { ratings: { basketballIQ: 4, threePoint: 4 }, durability: 3 },
        stance: { roleBias: -0.3 },
      },
    ],
  },
  {
    id: 'body_recovery_tech',
    theme: 'body',
    gate: { minAge: 28, once: true },
    title: 'INVEST IN RECOVERY',
    prompt: 'A chunk of your salary could go to keeping you healthy.',
    options: [
      {
        id: 'rec_science',
        label: 'CRYO, SLEEP, HYPERBARIC',
        blurb: 'A personal lab that follows you on the road.',
        effect: { durability: 7 },
      },
      {
        id: 'rec_oldschool',
        label: 'OLD SCHOOL',
        blurb: 'Ice baths and stretching. It worked before.',
        effect: { durability: 3, ratings: { basketballIQ: 2 } },
      },
      {
        id: 'rec_analytics',
        label: 'A DATA TEAM',
        blurb: 'They tell you exactly when to push and when to pull.',
        effect: { ratings: { basketballIQ: 5 }, durability: 2 },
      },
    ],
  },
];
