import { describe, expect, it } from 'vitest';
import { runCareer } from '../src/index.js';
import { SAMPLE_PROFILE } from './helpers.js';

describe('runCareer — partial evaluation', () => {
  it('asks for the high-school choice first', () => {
    const res = runCareer({ seed: 'flow', profile: SAMPLE_PROFILE, choices: [] });
    expect(res.status).toBe('awaiting_choice');
    if (res.status !== 'awaiting_choice') return;
    expect(res.pending.nodeId).toBe('highschool');
    expect(res.pending.kind).toBe('prologue');
    expect(res.pending.prologue?.choices.length).toBeGreaterThanOrEqual(2);
  });

  it('walks prologue -> draft -> landing -> season 1', () => {
    const seed = 'walk';
    let choices: Array<{ nodeId: string; choiceId: string }> = [];
    const seen: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      const res = runCareer({ seed, profile: SAMPLE_PROFILE, choices });
      if (res.status !== 'awaiting_choice') break;
      seen.push(res.pending.nodeId);
      const p = res.pending;
      const first =
        p.kind === 'prologue'
          ? p.prologue!.choices[0]!.id
          : p.kind === 'landing'
            ? p.landing!.offers[0]!.choiceId
            : p.season!.decision.options[0]!.id;
      choices = [...choices, { nodeId: p.nodeId, choiceId: first }];
    }
    expect(seen).toEqual(['highschool', 'recruiting', 'landing', 's1']);
  });

  it('landing offers are three real teams with a projected role', () => {
    const res = runCareer({
      seed: 'landing-check',
      profile: SAMPLE_PROFILE,
      choices: [
        { nodeId: 'highschool', choiceId: 'skills_camp' },
        { nodeId: 'recruiting', choiceId: 'blue_blood' },
      ],
    });
    expect(res.status).toBe('awaiting_choice');
    if (res.status !== 'awaiting_choice') return;
    const offers = res.pending.landing!.offers;
    expect(offers).toHaveLength(3);
    expect(new Set(offers.map((o) => o.team.id)).size).toBe(3);
    expect(offers[0]!.projectedMpg).toBeGreaterThan(0);
  });

  it('rejects a choice for the wrong node', () => {
    expect(() =>
      runCareer({
        seed: 'x',
        profile: SAMPLE_PROFILE,
        choices: [{ nodeId: 'recruiting', choiceId: 'blue_blood' }],
      }),
    ).toThrow(/highschool/);
  });

  it('rejects an unknown prologue choice', () => {
    expect(() =>
      runCareer({
        seed: 'x',
        profile: SAMPLE_PROFILE,
        choices: [{ nodeId: 'highschool', choiceId: 'nope' }],
      }),
    ).toThrow();
  });
});
