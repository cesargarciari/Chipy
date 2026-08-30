import type { PerkDef } from '../types.js';

/**
 * The perks shop. `yearly` perks cost their `cost` every season they're active
 * (auto-renewed from the bank); `permanent` perks cost `cost` once and never
 * lapse. Effects are deliberately modest - an edge, not a cheat code.
 */
const P = (
  id: string,
  name: string,
  category: PerkDef['category'],
  kind: PerkDef['kind'],
  cost: number,
  blurb: string,
  effect: PerkDef['effect'],
  minSeason?: number,
): PerkDef => ({ id, name, category, kind, cost, blurb, effect, minSeason });

export const PERKS: readonly PerkDef[] = [
  // ---- Yearly: cheaper, renew from the bank -------------------------------
  P(
    'shooting_trainer',
    'Shooting trainer',
    'training',
    'yearly',
    2,
    'Reps before and after every practice.',
    {
      growthBias: { threePoint: 0.8, midRange: 0.5 },
      impactMult: 1.015,
    },
  ),
  P('private_chef', 'Private chef', 'body', 'yearly', 1.5, 'Every meal built for recovery.', {
    durabilityPerYear: 1.4,
    injuryResist: 0.1,
  }),
  P(
    'strength_coach',
    'Strength & conditioning coach',
    'body',
    'yearly',
    2,
    'A program that follows you on the road.',
    {
      growthBias: { finishing: 0.5, rebounding: 0.4 },
      durabilityPerYear: 0.8,
    },
  ),
  P(
    'recovery_team',
    'Recovery team',
    'body',
    'yearly',
    3.5,
    'Cryo, massage, and sleep science on call.',
    {
      durabilityPerYear: 2,
      injuryResist: 0.22,
    },
  ),
  P(
    'film_room',
    'Personal film analyst',
    'analytics',
    'yearly',
    1.5,
    'Cut-ups of every opponent by morning.',
    {
      growthBias: { basketballIQ: 1 },
    },
  ),
  P(
    'sports_psych',
    'Sports psychologist',
    'analytics',
    'yearly',
    1.5,
    'Someone in your corner on the hard nights.',
    {
      slumpResist: 0.3,
      impactMult: 1.01,
    },
  ),
  P('social_media_mgr', 'Social-media manager', 'brand', 'yearly', 1, 'Your brand, handled.', {
    hypePerYear: 4,
  }),
  P('nutritionist', 'Nutritionist', 'body', 'yearly', 1, 'Dialed-in fuel and hydration.', {
    durabilityPerYear: 1,
  }),
  P(
    'skills_dev_coach',
    'Skills-development coach',
    'training',
    'yearly',
    2.5,
    'A summer plan and a season plan.',
    {
      growthBias: { finishing: 0.4, playmaking: 0.4, perimeterDefense: 0.3 },
    },
  ),

  // ---- Permanent: expensive, mid-career, never lapse -------------------
  P(
    'personal_court',
    'Personal court',
    'facility',
    'permanent',
    13,
    'A full gym at home. Reps whenever you want.',
    {
      growthBias: { finishing: 0.5, threePoint: 0.4 },
      impactMult: 1.02,
    },
    4,
  ),
  P(
    'home_gym_complex',
    'Home training complex',
    'facility',
    'permanent',
    22,
    'Court, weight room, pool, med bay.',
    {
      growthBias: { finishing: 0.3, threePoint: 0.3, playmaking: 0.3, perimeterDefense: 0.3 },
      durabilityPerYear: 1.5,
    },
    6,
  ),
  P(
    'brand_partnership',
    'Brand partnership',
    'brand',
    'permanent',
    10,
    'Equity, not just a check.',
    {
      valueMult: 1.1,
      hypePerYear: 4,
    },
    3,
  ),
  P(
    'analytics_group',
    'Private analytics group',
    'analytics',
    'permanent',
    16,
    'A staff that games out every matchup.',
    {
      awardMult: { scoring: 1.05, playmaking: 1.05, defense: 1.05, rebounding: 1.05 },
      growthBias: { basketballIQ: 0.6 },
    },
    5,
  ),
  P(
    'medical_team',
    'Private medical team',
    'body',
    'permanent',
    20,
    'The best surgeons and physios on retainer.',
    {
      injuryResist: 0.4,
      durabilityPerYear: 2,
    },
    5,
  ),
];

const BY_ID = new Map(PERKS.map((p) => [p.id, p]));

export function getPerk(id: string): PerkDef {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`Unknown perk "${id}"`);
  return p;
}

export function perkExists(id: string): boolean {
  return BY_ID.has(id);
}
