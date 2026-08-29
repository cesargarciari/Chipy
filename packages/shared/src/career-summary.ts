import { ARCHETYPE_IDS, AWARD_IDS, CONFERENCES, MARKETS, POSITIONS } from '@chipy/engine';
import { z } from 'zod';

/**
 * A zod mirror of `@chipy/engine`'s `CareerSummary` (engine v2). Lets the API
 * validate what it stores and returns, and gives both apps one transport type.
 */

const rating = z.number().int().min(25).max(99);

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
  'lottery',
  'missed_season',
]);

export const seasonRecordSchema = z.object({
  index: z.number().int().positive(),
  age: z.number().int().min(18).max(50),
  teamId: z.string(),
  role: roleSchema,
  phase: phaseSchema,
  decisionId: z.string(),
  decisionHeadline: z.string(),
  eventId: z.string(),
  eventHeadline: z.string(),
  stats: seasonStatLineSchema,
  teamResult: teamResultSchema,
  awards: z.array(awardIdSchema),
  overallAfter: rating,
  ratingsAfter: ratingsSchema,
  injuredGames: z.number().int().min(0).max(82),
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
  nodeId: z.string().max(16),
  choiceId: z.string().max(32),
});

export const careerSummarySchema = z.object({
  engineVersion: z.string().min(1),
  seed: z.number().int().nonnegative(),
  profile: playerProfileSchema,
  choices: z.array(choiceSelectionSchema).min(3),
  draft: draftResultSchema,
  rookieTeam: teamRefSchema,
  seasons: z.array(seasonRecordSchema).min(1),
  finalRatings: ratingsSchema,
  finalOverall: rating,
  peakOverall: rating,
  awards: awardTallySchema,
  careerTotals: careerTotalsSchema,
  legacy: legacySchema,
  timeline: z.array(timelineEntrySchema),
});

export type CareerSummaryDto = z.infer<typeof careerSummarySchema>;
export type SeasonRecordDto = z.infer<typeof seasonRecordSchema>;
export type LegacyDto = z.infer<typeof legacySchema>;
