/** The parts of a zod error we use. */
export interface ZodIssueLike {
  path: ReadonlyArray<PropertyKey>;
  code?: string;
  message?: string;
}
export interface ZodErrorLike {
  issues: ReadonlyArray<ZodIssueLike>;
}

/** Friendly messages for form errors. */
const FRIENDLY: Record<string, string> = {
  name: 'Give your player a name (at least 2 characters).',
  'name.too_small': 'Give your player a name (at least 2 characters).',
  'name.too_big': "That name's a bit long - keep it under 24 characters.",
  jerseyNumber: 'Pick a jersey number between 0 and 99.',
  country: 'Choose where your player was born.',
  position: 'Pick a position.',
  archetype: 'Pick an archetype for that position.',
  market: 'Pick a home market.',
};

/** First form error with a friendly message. */
export function firstFriendlyError(error: ZodErrorLike): { field: string; message: string } {
  const issue = error.issues[0];
  const field = String(issue?.path[0] ?? '');
  const message =
    FRIENDLY[`${field}.${issue?.code}`] ??
    FRIENDLY[field] ??
    issue?.message ??
    'Check your inputs.';
  return { field, message };
}
