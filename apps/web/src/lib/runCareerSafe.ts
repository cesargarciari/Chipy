import { runCareer, type RunCareerArgs, type RunCareerResult } from '@chipy/engine';

export type SafeRunResult = RunCareerResult | { status: 'error'; message: string };

/** Runs the career but returns an error instead of crashing, usually when a save is from an older engine. */
export function runCareerSafe(args: RunCareerArgs): SafeRunResult {
  try {
    return runCareer(args);
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}
