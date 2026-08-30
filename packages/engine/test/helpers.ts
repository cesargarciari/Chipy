import { runCareer, type CareerSummary, type PlayerProfile } from '../src/index.js';

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

/** Options available at whatever node `runCareer` is currently asking about. */
function pendingOptionIds(
  res: Extract<ReturnType<typeof runCareer>, { status: 'awaiting_choice' }>,
) {
  const p = res.pending;
  switch (p.kind) {
    case 'prologue':
      return p.prologue!.options.map((o) => o.id);
    case 'college_pick':
      return p.collegePick!.schools.map((s) => s.id);
    case 'college_year':
      return p.collegeYear!.options.map((o) => o.id);
    case 'landing':
      return p.landing!.offers.map((o) => o.id);
    case 'season':
      return p.season!.decision.options.map((o) => o.id);
    case 'midseason':
      return p.midseason!.decision.options.map((o) => o.id);
    case 'chemistry':
      return p.chemistry!.decision.options.map((o) => o.id);
    case 'overseas_offer':
      return p.overseasOffer!.options.map((o) => o.id);
    case 'farewell':
      return p.farewell!.options.map((o) => o.id);
  }
}

/** Run a full career, resolving every pending node with the given strategy. */
export function autoPlay(
  seed: string | number,
  profile: PlayerProfile,
  strategy: Strategy = 'random',
): CareerSummary {
  const pick = seededPicker(`${seed}:${strategy}`);
  const choices: Array<{ nodeId: string; choiceId: string }> = [];

  for (let step = 0; step < 600; step += 1) {
    const res = runCareer({ seed, profile, choices });
    if (res.status === 'complete') return res.summary;

    const opts = pendingOptionIds(res)!;
    let idx =
      strategy === 'first'
        ? 0
        : strategy === 'last'
          ? opts.length - 1
          : Math.floor(pick() * opts.length);
    if (opts[idx] === 'retire' && opts.length > 1) idx = (idx + 1) % opts.length;
    // Don't loop college forever.
    const declare = opts.findIndex((o) => o.startsWith('cy_declare'));
    if (declare >= 0 && (strategy !== 'last' || step > 6)) idx = declare;

    choices.push({ nodeId: res.pending.nodeId, choiceId: opts[idx]! });
  }
  throw new Error('career did not terminate within 600 steps');
}

export const SAMPLE_PROFILE: PlayerProfile = {
  name: 'Test Player',
  position: 'SF',
  archetype: 'point_forward',
  market: 'large',
  jerseyNumber: 7,
  country: 'USA',
  handedness: 'right',
};
