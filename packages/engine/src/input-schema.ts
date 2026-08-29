import { z } from 'zod';
import { ARCHETYPE_IDS, MARKETS, POSITIONS } from './types.js';

export const playerProfileSchema = z.object({
  name: z.string().trim().min(2).max(24),
  position: z.enum(POSITIONS),
  archetype: z.enum(ARCHETYPE_IDS),
  market: z.enum(MARKETS),
});

export const choiceSelectionSchema = z.object({
  nodeId: z.string().regex(/^(highschool|recruiting|landing|s\d{1,2})$/, 'invalid node id'),
  choiceId: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[a-z][a-z0-9_]*$/, 'invalid choice id'),
});

/**
 * Engine input. `choices` may be empty (to fetch the first node) or partial
 * (to fetch the next). `@chipy/shared` layers a minimum length on top for the
 * "persist a finished career" API call.
 */
export const runCareerInputSchema = z.object({
  seed: z.union([z.number().int(), z.string().min(1).max(64)]),
  profile: playerProfileSchema,
  choices: z.array(choiceSelectionSchema).max(30),
});

export type PlayerProfileInput = z.infer<typeof playerProfileSchema>;
export type ChoiceSelectionInput = z.infer<typeof choiceSelectionSchema>;
export type RunCareerInput = z.infer<typeof runCareerInputSchema>;
