import { runCareer, type RunCareerArgs, type RunCareerResult } from '@chipy/engine';

export type SafeRunResult = RunCareerResult | { status: 'error'; message: string };

/**
 * `runCareer` throws on an invalid `(seed, profile, choices)` tuple — most
 * often a career persisted under an older engine whose rules have since
 * changed. Callers render it straight from a restored store, so a throw would
 * blank the whole app. This wraps it: on any failure it returns
 * `{ status: 'error' }` and the caller resets to a clean slate.
 */
export function runCareerSafe(args: RunCareerArgs): SafeRunResult {
  try {
    return runCareer(args);
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}
