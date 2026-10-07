import { defenseRatingOf, type EffectChip, type Ratings } from '@chipy/engine';

/** The UI shows both defense ratings as one DEFENSE number. */
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

/** The value to show for a stat. DEFENSE uses the engine's combined defense rating. */
export function displayRatingValue(ratings: Ratings, key: string): number {
  if (key === 'defense') {
    return defenseRatingOf(ratings.interiorDefense, ratings.perimeterDefense);
  }
  return ratings[key as keyof Ratings];
}

/** Combines the two defense chips into one DEFENSE chip. */
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

/** Maps a chip key to its stat tile. */
export function toDisplayKey(key: string): string {
  return key === 'perimeterDefense' || key === 'interiorDefense' ? 'defense' : key;
}
