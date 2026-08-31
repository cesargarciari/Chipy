import type { Rng } from '../rng.js';
import type { TeamResult } from '../types.js';

/** Pick one item from a list using the given stream. */
function one<T>(rng: Rng, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)]!;
}

const LOST_SERIES_SWING = [
  'a buzzer-beater',
  'a wild overtime',
  'a fourth-quarter collapse',
  'a monster night from their star',
  'a brutal officiating call',
  'a cold shooting night at the worst time',
  'a Game 7 for the ages',
] as const;

const WON_SERIES_SWING = [
  'closing it out on the road',
  'a wire-to-wire Game 5',
  'a double-overtime thriller',
  'a fourth-quarter surge',
  'a defensive clamp-down in the fourth',
  'a road win to steal it',
] as const;

/** "first round" / "second round" / "conference finals" phrasing. */
function roundName(result: TeamResult): string {
  switch (result) {
    case 'first_round':
      return 'first round';
    case 'second_round':
      return 'second round';
    case 'conf_finals':
      return 'conference finals';
    default:
      return 'playoffs';
  }
}

/**
 * A one-line, randomly-flavoured account of how the season ended. Deterministic
 * for a given stream (call it with a derived RNG keyed on seed + season, so it
 * never perturbs the main simulation stream). Playoff results get a series
 * length, a venue and a swing moment; the rest get a short line.
 */
export function seasonRecap(rng: Rng, args: { result: TeamResult; missedGames: number }): string {
  if (args.missedGames >= 82) {
    return one(rng, [
      'The whole year went to the training room. A lost season.',
      'Injury wiped it out before it started. A season in a suit on the bench.',
      'Rehab, not basketball. The season never happened.',
    ]);
  }

  const r = args.result;

  if (r === 'missed_season' || r === 'lottery') {
    return one(rng, [
      'Out of the playoff race by March. A lottery year.',
      'The pieces never fit. Home for the postseason.',
      'A long spring of development minutes and ping-pong balls.',
      'Missed the bracket. Back to the drawing board.',
    ]);
  }

  if (r === 'play_in') {
    return one(rng, [
      `Bounced in the play-in, one win short of the bracket, on ${one(rng, LOST_SERIES_SWING)}.`,
      'Lost a win-or-go-home play-in game by two. Season over on the spot.',
      'Squeezed into the play-in, then ran out of gas before the first round.',
    ]);
  }

  // ---- A real playoff series -------------------------------------------------
  const swept = rng() < 0.22;
  const games = swept ? 4 : one(rng, [5, 5, 6, 6, 7]);
  const venue = one(rng, ['at home', 'on the road']);
  const lostSwing = one(rng, LOST_SERIES_SWING);
  const wonSwing = one(rng, WON_SERIES_SWING);

  if (r === 'champion') {
    if (swept) return 'Swept the Finals. A wire-to-wire run to the title.';
    return one(rng, [
      `Won it all, closing out the Finals in ${games} with ${wonSwing}.`,
      `Champions. Took the Finals in ${games}, ${wonSwing}.`,
      games === 7
        ? 'Won the title in a seven-game Finals that had everything.'
        : `Lifted the trophy after a ${games}-game Finals.`,
    ]);
  }

  if (r === 'finals') {
    if (swept) return 'Reached the Finals and got swept. A lopsided ending to a great year.';
    return games === 7
      ? 'Lost the Finals in seven. As close as it gets without winning.'
      : `Fell in the Finals in ${games}, undone by ${lostSwing}.`;
  }

  if (r === 'conf_finals') {
    if (swept) return 'Swept in the conference finals. The gap was real.';
    return `One win from the Finals: lost the conference finals in ${games} on ${lostSwing}.`;
  }

  // first_round / second_round
  const where = roundName(r);
  if (swept) {
    return one(rng, [
      `Swept out of the ${where} in four, never in the series.`,
      `A lopsided ${where} matchup: gone in four.`,
      `Ran into a buzzsaw in the ${where} and got swept.`,
    ]);
  }
  if (games === 5) {
    return one(rng, [
      `Lost the ${where} in a heartbreaking five, ${lostSwing} ${venue} ending it.`,
      `Out in the ${where} in five, a gentleman's sweep.`,
      `Dropped the ${where} in five despite ${lostSwing}.`,
    ]);
  }
  if (games === 6) {
    return one(rng, [
      `Bounced in the ${where} in six, ${lostSwing} ${venue}.`,
      `A hard-fought ${where}: lost in six.`,
    ]);
  }
  return one(rng, [
    `Pushed the ${where} to seven before falling ${venue} on ${lostSwing}.`,
    `A ${where} classic, lost in Game 7 by a possession.`,
  ]);
}
