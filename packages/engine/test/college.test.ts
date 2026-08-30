import { describe, expect, it } from 'vitest';
import { runCareer } from '../src/index.js';
import { SAMPLE_PROFILE } from './helpers.js';

type Choice = { nodeId: string; choiceId: string };

/** Play the prologue + college with a per-year decision, then stop at the draft. */
function throughCollege(seed: string, cyChoice: (year: number) => string) {
  const choices: Choice[] = [
    { nodeId: 'highschool', choiceId: 'skills_camp' },
    { nodeId: 'recruiting', choiceId: 'blue_blood' },
  ];
  for (let i = 0; i < 12; i += 1) {
    const res = runCareer({ seed, profile: SAMPLE_PROFILE, choices });
    if (res.status !== 'awaiting_choice') break;
    const p = res.pending;
    if (p.kind === 'college_pick') {
      choices.push({ nodeId: p.nodeId, choiceId: p.collegePick!.schools[0]!.id });
    } else if (p.kind === 'college_year') {
      const year = Number(p.nodeId.slice(2));
      choices.push({ nodeId: p.nodeId, choiceId: cyChoice(year) });
    } else {
      break; // reached the landing node
    }
  }
  return choices;
}

describe('college years', () => {
  it('declare after one year → summary has a single college season', () => {
    const choices = throughCollege('c1', () => 'cy_declare_1');
    // finish the career
    let res = runCareer({ seed: 'c1', profile: SAMPLE_PROFILE, choices });
    while (res.status === 'awaiting_choice') {
      const p = res.pending;
      const opts =
        p.kind === 'landing'
          ? p.landing!.offers.map((o) => o.id)
          : p.kind === 'overseas_offer'
            ? p.overseasOffer!.options.map((o) => o.id)
            : p.kind === 'chemistry'
              ? p.chemistry!.decision.options.map((o) => o.id)
              : p.kind === 'midseason'
                ? p.midseason!.decision.options.map((o) => o.id)
                : p.kind === 'farewell'
                  ? p.farewell!.options.map((o) => o.id)
                  : p.season!.decision.options.map((o) => o.id);
      choices.push({ nodeId: p.nodeId, choiceId: opts.find((o) => o !== 'retire') ?? opts[0]! });
      res = runCareer({ seed: 'c1', profile: SAMPLE_PROFILE, choices });
    }
    expect(res.status).toBe('complete');
    if (res.status !== 'complete') return;
    expect(res.summary.college?.years).toHaveLength(1);
    expect(res.summary.college?.years[0]?.stats.ppg).toBeGreaterThan(0);
    expect(res.summary.college?.years[0]?.result.length).toBeGreaterThan(3);
  });

  it('transfer routes through a fresh college pick', () => {
    const choices = throughCollege('c2', (y) => (y === 1 ? 'cy_transfer_1' : 'cy_declare_2'));
    const nodeIds = choices.map((c) => c.nodeId);
    expect(nodeIds).toContain('college1');
    expect(nodeIds).toContain('college2');
    expect(nodeIds).toContain('cy1');
    expect(nodeIds).toContain('cy2');
  });

  it('return keeps the same school for the next year', () => {
    const choices = throughCollege('c3', (y) => (y === 1 ? 'cy_return_1' : 'cy_declare_2'));
    const nodeIds = choices.map((c) => c.nodeId);
    expect(nodeIds).toContain('cy1');
    expect(nodeIds).toContain('cy2');
    // no second school pick on a return
    expect(nodeIds).not.toContain('college2');
  });
});
