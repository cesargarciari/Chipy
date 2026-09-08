import type { Scenario } from '../scenario-types.js';

/**
 * The one-per-career leap. Every option is `rare` (the client renders it gold)
 * and - because rare options skip the global rating slowdown - actually lands
 * its full `+12` (trimmed only by the 99 cap). Uncommon: it turns up for roughly
 * one career in six, at most once, and only for a player who has already carved
 * out a role. (At weight 0.3 it was ~1-in-10 and most players never saw it.)
 */
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
        // Both D ratings move the full +12: the DEFENSE tile is their weighted
        // average, so a lopsided split would only lift it ~+6 and this leap would
        // read as half the size of the others.
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
