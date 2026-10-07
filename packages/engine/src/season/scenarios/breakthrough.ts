import type { Scenario } from '../scenario-types.js';

/** A once-a-career +12 jump, shown in gold. Shows up in about one in six careers, only for players with a role. */
export const breakthroughScenarios: Scenario[] = [
  {
    id: 'scn_breakthrough',
    theme: 'training',
    gate: {
      once: true,
      weight: 0.55,
      minSeason: 3,
      maxSeason: 14,
      role: ['rotation', 'starter', 'franchise'],
    },
    title: 'IT ALL CLICKS',
    prompt:
      'One summer, something changes. The reps, the film, the confidence - it fuses. Where does the leap land?',
    options: [
      {
        id: 'brk_finishing',
        label: 'UNSTOPPABLE AT THE RIM',
        blurb: 'Nobody keeps you out of the paint anymore.',
        effect: { ratings: { finishing: 12 } },
        rare: true,
        stance: { tag: 'Breakthrough', impactMult: 1.03 },
      },
      {
        id: 'brk_threePoint',
        label: 'THE STROKE IS PURE',
        blurb: 'Off the catch, off the dribble, from the logo. It just goes in.',
        effect: { ratings: { threePoint: 12 } },
        rare: true,
        stance: { tag: 'Breakthrough', impactMult: 1.03 },
      },
      {
        id: 'brk_defense',
        label: 'A LOCKDOWN SWITCH',
        blurb: 'You start erasing the other team’s best option, one through five.',
        // Raise both defense ratings so the DEFENSE chip shows the full +12.
        effect: { ratings: { perimeterDefense: 12, interiorDefense: 12 } },
        rare: true,
        stance: { tag: 'Breakthrough', awardMult: { defense: 1.08 } },
      },
      {
        id: 'brk_playmaking',
        label: 'THE GAME SLOWS DOWN',
        blurb: 'You see the pass a beat before anyone else - the offense runs through you now.',
        effect: { ratings: { playmaking: 12 } },
        rare: true,
        stance: { tag: 'Breakthrough', roleBias: 0.3 },
      },
    ],
  },
];
