import {
  ARCHETYPE_IDS,
  AWARD_IDS,
  CONFERENCES,
  COUNTRIES,
  MARKETS,
  POSITIONS,
} from '@chipy/engine';
import { z } from 'zod';

/**
 * A zod mirror of `@chipy/engine`'s `CareerSummary` (engine v4). Lets the API
 * validate what it stores and returns, and gives both apps one transport type.
 */

const rating = z.number().int().min(25).max(99);
/** $M figures — non-negative, one decimal place at most in practice. */
const money = z.number().nonnegative().max(2000);
const COUNTRY_IDS = COUNTRIES.map((c) => c.id) as [string, ...string[]];

export const ratingsSchema = z.object({
  finishing: rating,
  midRange: rating,
  threePoint: rating,
  playmaking: rating,
  perimeterDefense: rating,
  interiorDefense: rating,
  rebounding: rating,
  basketballIQ: rating,
});

export const playerProfileSchema = z.object({
  name: z.string().min(2).max(24),
  position: z.enum(POSITIONS),
  archetype: z.enum(ARCHETYPE_IDS),
  market: z.enum(MARKETS),
  jerseyNumber: z.number().int().min(0).max(99),
  country: z.enum(COUNTRY_IDS),
  handedness: z.enum(['left', 'right']),
});

export const collegeStatLineSchema = z.object({
  gp: z.number().int().min(0).max(45),
  ppg: z.number().min(0),
  rpg: z.number().min(0),
  apg: z.number().min(0),
  fgPct: z.number().min(0).max(1),
});

export const collegeSeasonSchema = z.object({
  year: z.number().int().min(1).max(3),
  school: z.string(),
  stats: collegeStatLineSchema,
  result: z.string(),
  headline: z.string(),
});

export const collegeSchema = z.object({
  finalSchool: z.string(),
  tier: z.enum(['blue_blood', 'mid_major', 'overseas']),
  years: z.array(collegeSeasonSchema).min(1).max(3),
});

export const teamRefSchema = z.object({
  id: z.string().min(2).max(4),
  city: z.string(),
  name: z.string(),
  conference: z.enum(CONFERENCES),
  market: z.enum(MARKETS),
});

export const draftResultSchema = z.object({
  undrafted: z.boolean(),
  pick: z.number().int().min(1).max(60).nullable(),
  round: z.union([z.literal(1), z.literal(2)]).nullable(),
});

export const seasonStatLineSchema = z.object({
  gp: z.number().int().min(0).max(82),
  mpg: z.number().min(0).max(48),
  ppg: z.number().min(0),
  rpg: z.number().min(0),
  apg: z.number().min(0),
  spg: z.number().min(0),
  bpg: z.number().min(0),
  tsPct: z.number().min(0).max(1),
});

export const awardIdSchema = z.enum(AWARD_IDS);
export const awardTallySchema = z.partialRecord(awardIdSchema, z.number().int().nonnegative());

const roleSchema = z.enum(['franchise', 'starter', 'rotation', 'bench', 'fringe']);
const phaseSchema = z.enum(['rookie', 'rising', 'prime', 'veteran', 'decline']);
const teamResultSchema = z.enum([
  'champion',
  'finals',
  'conf_finals',
  'second_round',
  'first_round',
  'play_in',
  'lottery',
  'missed_season',
]);

export const leagueSchema = z.enum(['nba', 'overseas']);

export const euroResultSchema = z.enum([
  'euroleague_champion',
  'euroleague_final_four',
  'domestic_title',
  'euro_playoffs',
  'euro_missed',
]);

export const seasonRecordSchema = z.object({
  index: z.number().int().positive(),
  age: z.number().int().min(18).max(50),
  league: leagueSchema,
  teamId: z.string(),
  role: roleSchema,
  phase: phaseSchema,
  scenarioId: z.string(),
  decisionId: z.string(),
  decisionHeadline: z.string(),
  eventId: z.string(),
  eventHeadline: z.string(),
  midseasonId: z.string().nullable(),
  midseasonHeadline: z.string().nullable(),
  stats: seasonStatLineSchema,
  teamResult: teamResultSchema,
  awards: z.array(awardIdSchema),
  overallAfter: rating,
  ratingsAfter: ratingsSchema,
  injuredGames: z.number().int().min(0).max(82),
  salary: money,
  recap: z.string(),
  seed: z.number().int().min(0).max(15),
  grade: z.enum(['S', 'A', 'B', 'C', 'D']),
});

export const overseasSeasonSchema = z.object({
  index: z.number().int().positive(),
  age: z.number().int().min(18).max(50),
  club: z.string(),
  country: z.string(),
  stats: seasonStatLineSchema,
  result: euroResultSchema,
  awards: z.array(awardIdSchema),
  salary: money,
  headline: z.string(),
  grade: z.enum(['S', 'A', 'B', 'C', 'D']),
});

export const injuryEntrySchema = z.object({
  seasonIndex: z.number().int().positive(),
  type: z.string(),
  gamesMissed: z.number().int().min(0).max(82),
  severity: z.enum(['knock', 'strain', 'moderate', 'severe']).optional(),
});

export const franchiseTierSchema = z.enum([
  'none',
  'known',
  'favorite',
  'cornerstone',
  'idol',
  'legend',
]);

export const franchiseStandingSchema = z.object({
  teamId: z.string(),
  seasons: z.number().int().nonnegative(),
  rings: z.number().int().nonnegative(),
  score: z.number().int(),
  tier: franchiseTierSchema,
  progress: z.number().min(0).max(100),
});

export const nationalStandingSchema = z.object({
  country: z.string(),
  caps: z.number().int().nonnegative(),
  medals: z.number().int().nonnegative(),
  score: z.number().int(),
  tier: franchiseTierSchema,
  progress: z.number().min(0).max(100),
});

export const careerMomentSchema = z.object({
  seasonIndex: z.number().int().positive(),
  kind: z.enum([
    'award',
    'ring',
    'trade',
    'signing',
    'franchise',
    'shoe',
    'milestone',
    'midseason',
    'injury',
  ]),
  id: z.string().max(40),
  title: z.string(),
  subtitle: z.string(),
  teamId: z.string().optional(),
  awardId: awardIdSchema.optional(),
  choice: z.string().optional(),
});

export const careerTotalsSchema = z.object({
  seasons: z.number().int().nonnegative(),
  games: z.number().int().nonnegative(),
  points: z.number().int().nonnegative(),
  rebounds: z.number().int().nonnegative(),
  assists: z.number().int().nonnegative(),
  steals: z.number().int().nonnegative(),
  blocks: z.number().int().nonnegative(),
  ppg: z.number().nonnegative(),
  rpg: z.number().nonnegative(),
  apg: z.number().nonnegative(),
});

export const legacySchema = z.object({
  score: z.number().int().nonnegative(),
  grade: z.enum(['S', 'A', 'B', 'C', 'D']),
  tier: z.enum([
    'inner_circle',
    'all_timer',
    'hall_of_famer',
    'franchise_great',
    'quality_starter',
    'solid_pro',
    'journeyman',
    'cup_of_coffee',
  ]),
  hallOfFame: z.boolean(),
  jerseyRetired: z.boolean(),
  jerseyRetiredBy: z.string().nullable(),
  verdict: z.string(),
});

export const timelineEntrySchema = z.object({
  nodeId: z.string(),
  choiceId: z.string(),
  stage: z.string(),
  headline: z.string(),
});

export const choiceSelectionSchema = z.object({
  nodeId: z.string().max(20),
  choiceId: z.string().max(40),
});

export const careerSummarySchema = z.object({
  engineVersion: z.string().min(1),
  seed: z.number().int().nonnegative(),
  profile: playerProfileSchema,
  choices: z.array(choiceSelectionSchema).min(3),
  draft: draftResultSchema,
  college: collegeSchema.nullable(),
  rookieTeam: teamRefSchema,
  seasons: z.array(seasonRecordSchema).min(1),
  finalRatings: ratingsSchema,
  finalOverall: rating,
  peakOverall: rating,
  awards: awardTallySchema,
  careerTotals: careerTotalsSchema,
  legacy: legacySchema,
  timeline: z.array(timelineEntrySchema),
  // v4 economy / perks / overseas / injuries
  careerEarnings: money,
  peakSalary: money,
  perks: z.array(z.string().max(40)),
  shoeDeal: z.string().nullable(),
  overseasSeasons: z.array(overseasSeasonSchema),
  injuryHistory: z.array(injuryEntrySchema),
  // v4.2 — franchise standing + the career's big moments
  franchises: z.array(franchiseStandingSchema),
  moments: z.array(careerMomentSchema),
  // v4.4 — national-team standing
  nationalTeam: nationalStandingSchema,
});

export type CareerSummaryDto = z.infer<typeof careerSummarySchema>;
export type SeasonRecordDto = z.infer<typeof seasonRecordSchema>;
export type OverseasSeasonDto = z.infer<typeof overseasSeasonSchema>;
export type InjuryEntryDto = z.infer<typeof injuryEntrySchema>;
export type FranchiseStandingDto = z.infer<typeof franchiseStandingSchema>;
export type NationalStandingDto = z.infer<typeof nationalStandingSchema>;
export type CareerMomentDto = z.infer<typeof careerMomentSchema>;
export type CollegeDto = z.infer<typeof collegeSchema>;
export type LegacyDto = z.infer<typeof legacySchema>;
