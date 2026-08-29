import { runCareer, type CareerSummary, type PlayerProfile } from '../src/index.js';

/** Deterministic pseudo-random picker so a test can "play" a whole career. */
function seededPicker(seed: string): () => number {
  let a = 2166136261 >>> 0;
  for (const ch of seed) {
    a ^= ch.charCodeAt(0);
    a = Math.imul(a, 16777619);
  }
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Strategy = 'first' | 'last' | 'random';

/** Run a full career, resolving every pending node with the given strategy. */
export function autoPlay(
  seed: string | number,
  profile: PlayerProfile,
  strategy: Strategy = 'random',
): CareerSummary {
  const pick = seededPicker(`${seed}:${strategy}`);
  const choices: Array<{ nodeId: string; choiceId: string }> = [];

  for (let step = 0; step < 120; step += 1) {
    const res = runCareer({ seed, profile, choices });
    if (res.status === 'complete') return res.summary;

    const p = res.pending;
    const opts =
      p.kind === 'prologue'
        ? p.prologue!.choices.map((c) => c.id)
        : p.kind === 'landing'
          ? p.landing!.offers.map((o) => o.choiceId)
          : p.season!.decision.options.map((o) => o.id);

    let idx =
      strategy === 'first'
        ? 0
        : strategy === 'last'
          ? opts.length - 1
          : Math.floor(pick() * opts.length);
    if (opts[idx] === 'retire' && opts.length > 1) idx = (idx + 1) % opts.length;

    choices.push({ nodeId: p.nodeId, choiceId: opts[idx]! });
  }

  throw new Error('career did not terminate within 120 steps');
}

export const SAMPLE_PROFILE: PlayerProfile = {
  name: 'Test Player',
  position: 'SF',
  archetype: 'point_forward',
  market: 'large',
};
