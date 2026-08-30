import { weightedPick, type Rng } from '../rng.js';
import type { GameOption } from '../types.js';
import type { SeasonEffect } from './effects.js';

/**
 * The chemistry channel - a lightweight question that fires on its own roll,
 * separate from the fame / mid-season one, so both can land in the same season
 * (they're about different things). Every scenario is the same shape of choice:
 * be one of the guys (chemistry up, but a night out / time away costs you a
 * couple of overall points) or keep it strictly professional (chemistry down).
 */
export interface ChemistryScenario {
  id: string;
  title: string;
  prompt: string;
  /** [0] is the sociable / +chemistry option, [1] is the professional / -chemistry one. */
  options: [GameOption, GameOption];
}

const social = (id: string, label: string, blurb: string): GameOption => ({
  id,
  label,
  blurb,
  effect: {},
  stance: { tag: 'One of the guys' },
});
const pro = (id: string, label: string, blurb: string): GameOption => ({
  id,
  label,
  blurb,
  effect: {},
  stance: { tag: 'Strictly business' },
});

export const CHEMISTRY_SCENARIOS: readonly ChemistryScenario[] = [
  {
    id: 'chm_team_dinner',
    title: 'THE TEAM DINNER',
    prompt:
      'The guys booked a long table after the shootaround. You were not planning a late night.',
    options: [
      social('chm_dinner_join', 'PULL UP A CHAIR', 'Stay for the whole thing, pick up the cheque.'),
      pro('chm_dinner_skip', 'ORDER IN, WATCH FILM', 'Recovery, tape, bed. You have a job to do.'),
    ],
  },
  {
    id: 'chm_players_camp',
    title: 'A PLAYERS-ONLY CAMP',
    prompt: 'The group chat wants everyone to fly out for a week of workouts this summer.',
    options: [
      social('chm_camp_go', 'FLY OUT FOR IT', 'A grind of a week, but the room comes back tight.'),
      pro('chm_camp_solo', 'TRAIN YOUR OWN WAY', 'Your program, your trainers, your schedule.'),
    ],
  },
  {
    id: 'chm_rookie_mentor',
    title: 'THE ROOKIE WANTS IN',
    prompt: 'The lottery pick keeps asking you to stay after and work with him.',
    options: [
      social(
        'chm_rookie_yes',
        'TAKE HIM UNDER YOUR WING',
        'Extra sessions eat into your own reps.',
      ),
      pro('chm_rookie_no', "HE'LL FIGURE IT OUT", 'You had to. So does he.'),
    ],
  },
  {
    id: 'chm_night_out',
    title: 'A NIGHT OUT, PRE BACK-TO-BACK',
    prompt: 'The vets are going out. There is a road game tomorrow night.',
    options: [
      social('chm_night_roll', 'ROLL WITH THEM', 'You can drag yourself through one tired game.'),
      pro('chm_night_rest', 'REST UP', 'Nothing good happens after midnight in this league.'),
    ],
  },
  {
    id: 'chm_feud_mediate',
    title: 'TWO TEAMMATES ARE BEEFING',
    prompt: 'It has been frosty in the locker room for a week and everyone can feel it.',
    options: [
      social('chm_feud_broker', 'BROKER THE PEACE', 'Playing therapist all week drains you.'),
      pro('chm_feud_stayout', 'STAY OUT OF IT', 'Not your circus. You just hoop.'),
    ],
  },
  {
    id: 'chm_charity_gala',
    title: "A TEAMMATE'S CHARITY GALA",
    prompt: 'He asked you personally to show up and say a few words.',
    options: [
      social('chm_gala_speak', 'SHOW UP AND SPEAK', 'A long night in a tux, home at 1 a.m.'),
      pro('chm_gala_donate', 'SEND A DONATION', 'The cheque clears either way.'),
    ],
  },
];

export interface ChemResolution {
  effect: SeasonEffect;
  chemistryDelta: number;
  note: string;
}

const CHEM_NOTE: Record<string, string> = {
  chm_dinner_join: 'The room warms to you; the short night takes a small edge off your game.',
  chm_dinner_skip: 'Professional to a fault. The guys stop inviting you.',
  chm_camp_go: 'You come into camp tight with the group, a touch worn down.',
  chm_camp_solo: 'You show up in great shape and a step removed from the room.',
  chm_rookie_yes: 'The locker room respects it; the extra hours cost you a little of your own.',
  chm_rookie_no: 'Fair enough, but the young guys notice who helped and who did not.',
  chm_night_roll: 'One of the guys now. A little heavy-legged on the second night.',
  chm_night_rest: 'You feel fresh. You also feel like an outsider.',
  chm_feud_broker: 'You patch it up; playing counsellor for a month nicks your focus.',
  chm_feud_stayout: 'The tension lingers and a few teammates hold the distance against you.',
  chm_gala_speak: 'He will not forget it. A late night, but only a slight one.',
  chm_gala_donate: 'Generous, but he wanted you there, not your money.',
};

/**
 * Resolve a chemistry choice. The sociable option (`[0]`) trades a *small*
 * overall dip (1, occasionally 2) for a chemistry gain; the professional option
 * (`[1]`) trades chemistry away.
 */
export function resolveChemistry(rng: Rng, scenarioId: string, optionId: string): ChemResolution {
  const scenario = CHEMISTRY_SCENARIOS.find((s) => s.id === scenarioId);
  const isSocial = scenario?.options[0]?.id === optionId;
  const m = 0.7 + rng() * 0.6; // 0.7 .. 1.3

  if (isSocial) {
    const hit = rng() < 0.75 ? 1 : 2;
    return {
      effect: { overallHit: hit, chemistry: Math.round(12 + 8 * m) },
      chemistryDelta: Math.round(12 + 8 * m),
      note: CHEM_NOTE[optionId] ?? 'The room warms to you.',
    };
  }
  return {
    effect: { chemistry: -Math.round(8 + 7 * m) },
    chemistryDelta: -Math.round(8 + 7 * m),
    note: CHEM_NOTE[optionId] ?? 'You keep your distance, and it costs you goodwill.',
  };
}

export function pickChemistryScenario(rng: Rng, firedIds: ReadonlySet<string>): ChemistryScenario {
  const fresh = CHEMISTRY_SCENARIOS.filter((s) => !firedIds.has(s.id));
  const pool = fresh.length > 0 ? fresh : CHEMISTRY_SCENARIOS;
  return weightedPick(
    rng,
    pool.map((s) => [s, 1] as const),
  );
}

export function findChemistryOption(optionId: string): { scenario: ChemistryScenario } | null {
  const scenario = CHEMISTRY_SCENARIOS.find((s) => s.options.some((o) => o.id === optionId));
  return scenario ? { scenario } : null;
}
