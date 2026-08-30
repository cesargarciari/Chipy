import type { SchoolRef, SchoolTier } from '../types.js';

/**
 * College programs and overseas clubs. `prestige` sets the tournament / league
 * ceiling; `nbaPedigree` is the "sends players to the lottery" reputation that
 * boosts draft stock; `style.usage` is how ball-dominant you'll be (mid-majors
 * high, blue-bloods low); `style.dev` is the per-year growth flavour.
 */
const S = (
  id: string,
  name: string,
  tier: SchoolTier,
  prestige: number,
  nbaPedigree: number,
  usage: number,
  dev: SchoolRef['style']['dev'],
): SchoolRef => ({ id, name, tier, prestige, nbaPedigree, style: { usage, dev } });

export const SCHOOLS: readonly SchoolRef[] = [
  // ---- Blue-bloods: elite pedigree, you share touches -----------------
  S('duke', 'Duke', 'blue_blood', 0.92, 0.95, 0.58, { basketballIQ: 1, perimeterDefense: 1 }),
  S('unc', 'North Carolina', 'blue_blood', 0.9, 0.9, 0.6, { finishing: 1, playmaking: 1 }),
  S('kentucky', 'Kentucky', 'blue_blood', 0.9, 0.96, 0.62, { finishing: 1, perimeterDefense: 1 }),
  S('kansas', 'Kansas', 'blue_blood', 0.89, 0.88, 0.6, { basketballIQ: 1, midRange: 1 }),
  S('uconn', 'UConn', 'blue_blood', 0.88, 0.84, 0.58, { perimeterDefense: 1, interiorDefense: 1 }),
  S('ucla', 'UCLA', 'blue_blood', 0.85, 0.82, 0.6, { basketballIQ: 1, threePoint: 1 }),
  S('villanova', 'Villanova', 'blue_blood', 0.84, 0.8, 0.6, { threePoint: 1, basketballIQ: 1 }),
  S('arizona', 'Arizona', 'blue_blood', 0.84, 0.82, 0.62, { finishing: 1, rebounding: 1 }),
  S('michigan_st', 'Michigan State', 'blue_blood', 0.83, 0.78, 0.6, {
    rebounding: 1,
    perimeterDefense: 1,
  }),
  S('gonzaga', 'Gonzaga', 'blue_blood', 0.85, 0.8, 0.64, { finishing: 1, playmaking: 1 }),

  // ---- Mid-majors: you are the whole offense -------------------------
  S('saint_marys', "Saint Mary's", 'mid_major', 0.62, 0.5, 0.82, { threePoint: 1, playmaking: 1 }),
  S('san_diego_st', 'San Diego State', 'mid_major', 0.64, 0.52, 0.78, {
    perimeterDefense: 1,
    finishing: 1,
  }),
  S('dayton', 'Dayton', 'mid_major', 0.6, 0.5, 0.82, { finishing: 1, midRange: 1 }),
  S('vcu', 'VCU', 'mid_major', 0.58, 0.48, 0.8, { perimeterDefense: 1, playmaking: 1 }),
  S('murray_st', 'Murray State', 'mid_major', 0.52, 0.46, 0.86, { playmaking: 1, threePoint: 1 }),
  S('fau', 'Florida Atlantic', 'mid_major', 0.56, 0.44, 0.82, { threePoint: 1, finishing: 1 }),
  S('nevada', 'Nevada', 'mid_major', 0.55, 0.46, 0.82, { finishing: 1, midRange: 1 }),
  S('belmont', 'Belmont', 'mid_major', 0.48, 0.4, 0.88, { threePoint: 1, basketballIQ: 1 }),
  S('iona', 'Iona', 'mid_major', 0.46, 0.4, 0.86, { playmaking: 1, finishing: 1 }),
  S('loyola_chi', 'Loyola Chicago', 'mid_major', 0.5, 0.42, 0.8, {
    basketballIQ: 1,
    perimeterDefense: 1,
  }),

  // ---- Overseas / G League: pro habits, low hype --------------------
  S('gleague_ignite', 'G League Ignite', 'overseas', 0.6, 0.72, 0.74, {
    perimeterDefense: 1,
    finishing: 1,
  }),
  S('real_madrid', 'Real Madrid', 'overseas', 0.82, 0.6, 0.6, {
    basketballIQ: 2,
    perimeterDefense: 1,
  }),
  S('barcelona', 'FC Barcelona', 'overseas', 0.8, 0.58, 0.6, {
    basketballIQ: 2,
    interiorDefense: 1,
  }),
  S('maccabi', 'Maccabi Tel Aviv', 'overseas', 0.74, 0.54, 0.64, {
    basketballIQ: 1,
    interiorDefense: 1,
  }),
  S('asvel', 'ASVEL', 'overseas', 0.68, 0.56, 0.66, { perimeterDefense: 1, finishing: 1 }),
  S('partizan', 'Partizan', 'overseas', 0.72, 0.52, 0.66, { interiorDefense: 1, rebounding: 1 }),
  S('baskonia', 'Baskonia', 'overseas', 0.68, 0.54, 0.68, { threePoint: 1, basketballIQ: 1 }),
  S('melbourne', 'Melbourne United', 'overseas', 0.64, 0.58, 0.68, {
    perimeterDefense: 1,
    finishing: 1,
  }),
];

const BY_ID = new Map(SCHOOLS.map((s) => [s.id, s]));

export function getSchool(id: string): SchoolRef {
  const s = BY_ID.get(id);
  if (!s) throw new Error(`Unknown school "${id}"`);
  return s;
}

export function schoolsForTier(tier: SchoolTier): SchoolRef[] {
  return SCHOOLS.filter((s) => s.tier === tier);
}
