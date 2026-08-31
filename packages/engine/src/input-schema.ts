import { z } from 'zod';
import { ARCHETYPE_IDS, MARKETS, POSITIONS } from './types.js';
import { COUNTRIES } from './data/countries.js';

const COUNTRY_IDS = COUNTRIES.map((c) => c.id) as [string, ...string[]];

export const playerProfileSchema = z.object({
  name: z.string().trim().min(2).max(24),
  position: z.enum(POSITIONS),
  archetype: z.enum(ARCHETYPE_IDS),
  market: z.enum(MARKETS),
  jerseyNumber: z.number().int().min(0).max(99),
  country: z.enum(COUNTRY_IDS),
  handedness: z.enum(['left', 'right']),
});

export const choiceSelectionSchema = z.object({
  nodeId: z
    .string()
    .regex(
      /^(highschool|recruiting|college[123]|cy[123]|landing|s\d{1,2}|perks\d{1,2}|ms\d{1,2}|chem\d{1,2}|finals\d{1,2}|overseas_offer\d{1,2}|farewell\d{1,2})$/,
      'invalid node id',
    ),
  choiceId: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z][a-z0-9_]*$/, 'invalid choice id'),
});

/**
 * Engine input. `choices` may be empty (to fetch the first node) or partial
 * (to fetch the next). `@chipy/shared` layers a minimum length on top for the
 * "persist a finished career" API call. The cap is generous: a long career with
 * a busy perks shop can run well past 100 recorded choices.
 */
export const runCareerInputSchema = z.object({
  seed: z.union([z.number().int(), z.string().min(1).max(64)]),
  profile: playerProfileSchema,
  choices: z.array(choiceSelectionSchema).max(400),
});

export type PlayerProfileInput = z.infer<typeof playerProfileSchema>;
export type ChoiceSelectionInput = z.infer<typeof choiceSelectionSchema>;
export type RunCareerInput = z.infer<typeof runCareerInputSchema>;
