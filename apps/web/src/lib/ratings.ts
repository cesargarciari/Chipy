import { defenseRatingOf, type EffectChip, type Ratings } from '@chipy/engine';

/**
 * The engine keeps eight rated skills, but the UI collapses interior + perimeter
 * defense into a single **DEFENSE** number for a cleaner card.
 */
export interface DisplayAxis {
  key: string;
  label: string;
  short: string;
}

export const DISPLAY_AXES: DisplayAxis[] = [
  { key: 'finishing', label: 'FINISHING', short: 'FIN' },
  { key: 'midRange', label: 'MID-RANGE', short: 'MID' },
  { key: 'threePoint', label: 'THREE-POINT', short: '3PT' },
  { key: 'playmaking', label: 'PLAYMAKING', short: 'PLY' },
  { key: 'defense', label: 'DEFENSE', short: 'DEF' },
  { key: 'rebounding', label: 'REBOUNDING', short: 'REB' },
  { key: 'basketballIQ', label: 'BASKETBALL IQ', short: 'IQ' },
];

/**
 * The value to show for a display axis. DEFENSE folds the two D ratings, weighted
 * toward the stronger one (engine `defenseRatingOf`), so a one-way stopper still
 * reads elite and a true two-way defender can climb past 85 into the 90s.
 */
export function displayRatingValue(ratings: Ratings, key: string): number {
  if (key === 'defense') {
    return defenseRatingOf(ratings.interiorDefense, ratings.perimeterDefense);
  }
  return ratings[key as keyof Ratings];
}

/**
 * Fold `perimeterDefense` + `interiorDefense` effect chips into one `DEFENSE`
 * chip (deltas summed), leaving every other chip untouched and in order.
 */
export function mergeDefenseChips(chips: EffectChip[]): EffectChip[] {
  const out: EffectChip[] = [];
  let defDelta = 0;
  let defNominal = 0;
  let defHadNominal = false;
  let defAt = -1;
  for (const c of chips) {
    if (c.key === 'perimeterDefense' || c.key === 'interiorDefense') {
      if (defAt === -1) defAt = out.length;
      defDelta += c.delta;
      defNominal += c.nominal ?? c.delta;
      if (c.nominal !== undefined) defHadNominal = true;
      continue;
    }
    out.push(c);
  }
  if (defAt !== -1 && (defDelta !== 0 || defHadNominal)) {
    out.splice(defAt, 0, {
      key: 'defense',
      label: 'DEFENSE',
      short: 'DEF',
      delta: defDelta,
      ...(defHadNominal && defNominal !== defDelta ? { nominal: defNominal } : {}),
    });
  }
  return out;
}

/** Map an effect-chip key to the display-axis key it lights on the strip. */
export function toDisplayKey(key: string): string {
  return key === 'perimeterDefense' || key === 'interiorDefense' ? 'defense' : key;
}
