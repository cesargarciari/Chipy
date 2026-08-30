import { describe, expect, it } from 'vitest';
import { runCareer } from '../src/index.js';
import { SAMPLE_PROFILE } from './helpers.js';

function firstOption(res: ReturnType<typeof runCareer>): string {
  if (res.status !== 'awaiting_choice') throw new Error('expected awaiting_choice');
  const p = res.pending;
  if (p.kind === 'prologue') return p.prologue!.options[0]!.id;
  if (p.kind === 'college_pick') return p.collegePick!.schools[0]!.id;
  if (p.kind === 'college_year') {
    // Declare when scouts are sold; otherwise stay another year.
    const declare = p.collegeYear!.options.find((o) => o.id.startsWith('cy_declare'));
    return (declare ?? p.collegeYear!.options[0]!).id;
  }
  if (p.kind === 'landing') return p.landing!.offers[0]!.id;
  if (p.kind === 'farewell') return 'quiet_goodbye';
  if (p.kind === 'midseason') return p.midseason!.decision.options[0]!.id;
  if (p.kind === 'overseas_offer') return p.overseasOffer!.options[0]!.id;
  return p.season!.decision.options[0]!.id;
}

describe('runCareer — partial evaluation', () => {
  it('asks for the high-school choice first', () => {
    const res = runCareer({ seed: 'flow', profile: SAMPLE_PROFILE, choices: [] });
    expect(res.status).toBe('awaiting_choice');
    if (res.status !== 'awaiting_choice') return;
    expect(res.pending.nodeId).toBe('highschool');
    expect(res.pending.kind).toBe('prologue');
    expect(res.pending.prologue?.options.length).toBeGreaterThanOrEqual(2);
    // Every option carries render-ready effect chips.
    expect(res.pending.prologue?.options[0]?.watermark).toBeTruthy();
  });

  it('walks prologue -> college -> draft -> landing -> season 1', () => {
    const seed = 'walk';
    let choices: Array<{ nodeId: string; choiceId: string }> = [];
    const seen: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      const res = runCareer({ seed, profile: SAMPLE_PROFILE, choices });
      if (res.status !== 'awaiting_choice') break;
      seen.push(res.pending.nodeId);
      if (res.pending.nodeId === 's1') break;
      choices = [...choices, { nodeId: res.pending.nodeId, choiceId: firstOption(res) }];
    }
    // Prologue → at least one college year → landing → season 1, in that order.
    expect(seen[0]).toBe('highschool');
    expect(seen[1]).toBe('recruiting');
    expect(seen[2]).toBe('college1');
    expect(seen[3]).toMatch(/^cy\d$/);
    expect(seen.at(-2)).toBe('landing');
    expect(seen.at(-1)).toBe('s1');
  });

  it('college pick offers real programs and a freshman recap', () => {
    let choices: Array<{ nodeId: string; choiceId: string }> = [
      { nodeId: 'highschool', choiceId: 'skills_camp' },
      { nodeId: 'recruiting', choiceId: 'blue_blood' },
    ];
    let res = runCareer({ seed: 'college', profile: SAMPLE_PROFILE, choices });
    expect(res.status).toBe('awaiting_choice');
    if (res.status !== 'awaiting_choice') return;
    expect(res.pending.kind).toBe('college_pick');
    const schools = res.pending.collegePick!.schools;
    expect(schools.length).toBeGreaterThanOrEqual(4);
    expect(schools.every((s) => s.tier === 'blue_blood')).toBe(true);

    choices = [...choices, { nodeId: 'college1', choiceId: schools[0]!.id }];
    res = runCareer({ seed: 'college', profile: SAMPLE_PROFILE, choices });
    if (res.status !== 'awaiting_choice') throw new Error('expected cy1');
    expect(res.pending.kind).toBe('college_year');
    expect(res.pending.collegeYear!.recap.stats.ppg).toBeGreaterThan(0);
    expect(res.pending.collegeYear!.options.some((o) => o.id.startsWith('cy_declare'))).toBe(true);
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
});
