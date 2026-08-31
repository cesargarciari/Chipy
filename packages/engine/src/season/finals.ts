import { clamp, type Rng } from '../rng.js';

/**
 * The NBA Finals as a single decisive possession the player calls, instead of a
 * coin flip. When a career reaches the Finals the engine poses one of these
 * scenarios: three real plays, ranked by how sound they are. How good the team
 * was decides how many of the three actually win it (a genuine title favourite
 * has two right answers; an underdog run has only one). Pick a winning play and
 * you see its `good` line and lift the trophy; pick a losing one and you see the
 * `bad` line (the shot rims out, the pass is picked) and fall in the Finals.
 *
 * Nothing here touches the main RNG stream - `buildFinalsGame` runs off a
 * derived stream and `resolveFinals` is pure - so a career replays byte for byte
 * whether or not it ever reached a Finals.
 */

export interface FinalsPlay {
  id: string;
  /** The play call, as a full sentence. Carries no hint of whether it's right. */
  label: string;
  /** Shown when this play wins the title. */
  good: string;
  /** Shown when this play loses the Finals. */
  bad: string;
  /** 0 = the soundest read, 2 = hero ball. The `correctCount` best plays win. */
  soundness: 0 | 1 | 2;
}

export interface FinalsScenario {
  id: string;
  /** The moment: score, clock, who has the ball. */
  situation: string;
  prompt: string;
  plays: [FinalsPlay, FinalsPlay, FinalsPlay];
}

export const FINALS_SCENARIOS: readonly FinalsScenario[] = [
  {
    id: 'fin_logo_trap',
    situation:
      'Game 7, tied, twelve seconds left. The ball is in your hands past half court when two defenders come to trap you above the break.',
    prompt: 'Make the read.',
    plays: [
      {
        id: 'fin_trap_kick',
        label: 'Split the trap with a live dribble and kick to the open shooter in the corner.',
        good: 'You slip the seam, draw the third defender, and whip it to the corner. Buried at the buzzer. Champions.',
        bad: 'You pick the dribble up a beat early. The pass floats, the closeout gets there, and it clangs off the front rim.',
        soundness: 0,
      },
      {
        id: 'fin_trap_drive',
        label: 'Split the trap and get all the way to the rim yourself.',
        good: 'You knife between both bodies and lay it high off the glass before the help arrives. It drops. Title.',
        bad: 'The weakside help steps up, you leave your feet with nowhere to go, and it is stripped at the rim.',
        soundness: 1,
      },
      {
        id: 'fin_trap_pullup',
        label: 'Rise straight up over the trap from thirty feet.',
        good: 'You get it off clean before the second man arrives and it never touches the net. Ballgame.',
        bad: 'Two hands in your face. It is a contested heave, and it rims out as the horn sounds.',
        soundness: 2,
      },
    ],
  },
  {
    id: 'fin_up_three',
    situation:
      'You are up three, six seconds left, and they are inbounding under their own basket. Everyone in the building knows they need a three.',
    prompt: 'Call the coverage.',
    plays: [
      {
        id: 'fin_up3_switch',
        label: 'Switch every screen, top-lock the shooters, and live with a two.',
        good: 'Every action gets switched, they never get a clean look, and the runner at the buzzer is well short. Champions.',
        bad: 'A miscommunication on the last switch springs their shooter in the corner. He rises and drills it, and you lose in overtime.',
        soundness: 0,
      },
      {
        id: 'fin_up3_foul',
        label: 'Foul before they can get into a shooting motion.',
        good: 'You wrap him up at half court before the catch. He splits the free throws, you rebound, game over. Ring.',
        bad: 'The whistle comes a half-second late, mid-gather on a three. Four-point play, and they win it at the line.',
        soundness: 1,
      },
      {
        id: 'fin_up3_sag',
        label: 'Pack the paint and dare them to beat you from deep.',
        good: 'They drive it into the crowd, kick to a covered shooter, and the three is a brick. It is over.',
        bad: 'You give them the exact look they wanted: pitch to the wing, clean catch-and-shoot, splash. They steal it in overtime.',
        soundness: 2,
      },
    ],
  },
  {
    id: 'fin_elbow_iso',
    situation:
      'Tie game, last shot, no timeouts. You catch it at the elbow with a step on your man and the clock running down.',
    prompt: 'Go get it.',
    plays: [
      {
        id: 'fin_iso_spot',
        label:
          'Back him down to your spot and rise into the turnaround you have hit a thousand times.',
        good: 'Two dribbles to the block, a bump to create space, and the fadeaway is pure. Title.',
        bad: 'He fights you off the catch, you settle a step behind the spot, and it is front rim as time expires.',
        soundness: 0,
      },
      {
        id: 'fin_iso_screen',
        label: 'Wave the big up for a quick screen and read the coverage.',
        good: 'The big sets it, they drop, and you snake into a clean pull-up from fifteen. Wet. Champions.',
        bad: 'They blitz the screen hard, you pick up your dribble, and the pass out is a hair late. Turnover, horn.',
        soundness: 1,
      },
      {
        id: 'fin_iso_hero',
        label: 'Wave everyone through and take him one-on-one from the top for the win.',
        good: 'You cross him over, rise from twenty-two, and it never touches iron. Ballgame.',
        bad: 'He walls you up, a second defender digs, and the stepback is heavily contested. Off the back iron.',
        soundness: 2,
      },
    ],
  },
  {
    id: 'fin_slob_set',
    situation:
      'Down one, four seconds on the clock, ball out of bounds on the sideline in the frontcourt. The huddle is on you to make the call.',
    prompt: 'Draw it up.',
    plays: [
      {
        id: 'fin_slob_star',
        label: 'Come off the double screen yourself and catch it going downhill.',
        good: 'You rub off both screens, catch it in rhythm at the elbow, and rise. Good. Champions, at the buzzer.',
        bad: 'They switch it seamlessly and meet you at the catch. You go up off balance from eighteen and it is short.',
        soundness: 0,
      },
      {
        id: 'fin_slob_corner',
        label: 'Skip it to the shooter spotting up in the weakside corner.',
        good: 'The defense loads to the ball, you skip it cross-court, and the corner three is clean. It drops. Title.',
        bad: 'The pass hangs just long enough for the closeout. Pump, one dribble, and the runner is off the mark.',
        soundness: 1,
      },
      {
        id: 'fin_slob_lob',
        label: 'Backscreen lob to the finisher at the rim.',
        good: 'The backscreen catches the help sleeping, the lob is perfect, and it is a two-handed flush at the horn. Champions.',
        bad: 'Their back-line safety never bit. He picks off the lob at the rim, and the game is over.',
        soundness: 2,
      },
    ],
  },
];

/**
 * How strong the Finals team is, 0..1. A genuine title favourite (a top roster
 * with a star playing at an MVP clip, or an open ring window) lands near 1; a
 * Cinderella run sits near 0. `>= 0.5` gets two winning plays, below it one.
 */
export function finalsEdge(args: {
  teamStrength: number;
  playerImpact: number;
  ringWindow: number;
}): number {
  const { teamStrength, playerImpact, ringWindow } = args;
  return clamp(
    (teamStrength - 0.45) * 1.7 +
      clamp((playerImpact - 14) / 20, 0, 0.5) +
      (ringWindow > 0 ? 0.08 : 0),
    0,
    1,
  );
}

/**
 * 2 winning plays for a genuine title favourite, 1 for everyone else - so a
 * coin-flip pick still fails a Finals more often than not unless the team really
 * was the best in the league.
 */
export function finalsCorrectCount(edge: number): 1 | 2 {
  return edge >= 0.66 ? 2 : 1;
}

export interface FinalsGameView {
  scenarioId: string;
  /** e.g. "NBA Finals". */
  kicker: string;
  situation: string;
  prompt: string;
  /** The three plays, order shuffled per career so "right" is never positional. */
  options: { id: string; label: string }[];
}

export interface FinalsResolution {
  won: boolean;
  /** The chosen play's `good` line (win) or `bad` line (loss). */
  outcome: string;
}

function getScenario(scenarioId: string): FinalsScenario {
  const s = FINALS_SCENARIOS.find((x) => x.id === scenarioId);
  if (!s) throw new Error(`Unknown finals scenario "${scenarioId}"`);
  return s;
}

/**
 * Pick the scenario and shuffle its plays. `rng` must be a derived stream (never
 * the main one) so replays line up. The count of winning plays is deliberately
 * not exposed - the player reads the floor, not a hint.
 */
export function buildFinalsGame(rng: Rng): FinalsGameView {
  const scenario = FINALS_SCENARIOS[Math.floor(rng() * FINALS_SCENARIOS.length)]!;
  const options = scenario.plays.map((p) => ({ id: p.id, label: p.label }));
  // Fisher-Yates on the derived stream - cosmetic only, resolution is by id.
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j]!, options[i]!];
  }
  return {
    scenarioId: scenario.id,
    kicker: 'NBA Finals',
    situation: scenario.situation,
    prompt: scenario.prompt,
    options,
  };
}

/**
 * Decide the Finals from the chosen play. Pure: the winning set is the
 * `correctCount` soundest plays, and `correctCount` comes straight from `edge`.
 */
export function resolveFinals(
  scenarioId: string,
  choiceId: string,
  edge: number,
): FinalsResolution {
  const scenario = getScenario(scenarioId);
  const play = scenario.plays.find((p) => p.id === choiceId);
  if (!play) throw new Error(`Unknown finals play "${choiceId}" for "${scenarioId}"`);
  const won = play.soundness < finalsCorrectCount(edge);
  return { won, outcome: won ? play.good : play.bad };
}
