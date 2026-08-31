import { describe, expect, it } from 'vitest';
import { runCareer, type PlayerProfile, type Position } from '../src/index.js';
import { autoPlay } from './helpers.js';

const profile = (over: Partial<PlayerProfile> = {}): PlayerProfile => ({
  name: 'T',
  position: 'SF',
  archetype: 'three_level_wing',
  market: 'mid',
  jerseyNumber: 7,
  country: 'USA',
  handedness: 'right',
  ...over,
});

describe('draft slot drives talent', () => {
  it(
    'higher picks reach a higher peak overall, but a few second-rounders still become stars',
    { timeout: 30_000 },
    () => {
      const firstRound: number[] = [];
      const secondRound: number[] = [];
      for (let i = 0; i < 260; i += 1) {
        const s = autoPlay(`v412-draft-${i}`, profile({ archetype: 'point_forward' }));
        const peak = Math.max(0, ...s.seasons.map((x) => x.overallAfter));
        if (s.draft.undrafted || s.draft.pick! > 30) secondRound.push(peak);
        else if (s.draft.pick! <= 14) firstRound.push(peak);
      }
      const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
      expect(firstRound.length).toBeGreaterThan(10);
      expect(secondRound.length).toBeGreaterThan(20);

      // Lottery picks clearly out-develop second-round / undrafted starts.
      expect(mean(firstRound) - mean(secondRound)).toBeGreaterThan(4.5);

      // A genuine slice of the late group still peaks star-level, but a lottery
      // pick is markedly likelier to (the mean-gap check above is the real
      // invariant; this just guards against the slot ceasing to matter).
      const lateStars = secondRound.filter((p) => p >= 86).length / secondRound.length;
      const lottoStars = firstRound.filter((p) => p >= 86).length / firstRound.length;
      expect(lateStars).toBeGreaterThan(0.03);
      expect(lottoStars - lateStars).toBeGreaterThan(0.2);
    },
  );
});

describe('DPOY leans on bigs and wings', () => {
  it(
    'centres, power forwards and small forwards win it far more than guards',
    { timeout: 60_000 },
    () => {
      const arche: Record<Position, PlayerProfile['archetype']> = {
        PG: 'two_way_pg',
        SG: 'three_and_d_guard',
        SF: 'three_and_d_wing',
        PF: 'two_way_forward',
        C: 'rim_protector',
      };
      const dpoy: Record<Position, number> = { PG: 0, SG: 0, SF: 0, PF: 0, C: 0 };
      for (const pos of ['PG', 'SG', 'SF', 'PF', 'C'] as const) {
        for (let i = 0; i < 60; i += 1) {
          const s = autoPlay(
            `v412-dpoy-${pos}-${i}`,
            profile({ position: pos, archetype: arche[pos] }),
          );
          dpoy[pos] += s.awards.dpoy ?? 0;
        }
      }
      const bigs = dpoy.C + dpoy.PF + dpoy.SF;
      const guards = dpoy.PG + dpoy.SG;
      expect(dpoy.C).toBeGreaterThan(0);
      expect(dpoy.PF).toBeGreaterThan(0);
      expect(bigs).toBeGreaterThan(guards * 3 + 2);
      expect(dpoy.PG).toBeLessThanOrEqual(dpoy.C);
    },
  );
});

describe('modest-overall veterans sign short deals', () => {
  it('a sub-77 player past 23 is only ever offered one or two years', { timeout: 40_000 }, () => {
    let checkedLow = 0;
    let sawStarLongDeal = false;
    for (let i = 0; i < 120; i += 1) {
      const seed = `v412-contract-${i}`;
      const p = profile({
        archetype: (['floor_general', 'rim_protector', 'stretch_four'] as const)[i % 3],
      });
      const choices: Array<{ nodeId: string; choiceId: string }> = [];
      for (let step = 0; step < 400; step += 1) {
        const res = runCareer({ seed, profile: p, choices });
        if (res.status === 'complete') break;
        const pend = res.pending;

        if (pend.kind === 'season' && pend.season!.decision.kind === 'free_agency') {
          const { overall, age } = pend.season!.preview;
          for (const o of pend.season!.decision.options) {
            const m = /(\d+)yr/.exec(o.blurb ?? '');
            if (!m) continue;
            const years = Number(m[1]);
            if (overall < 77 && age >= 24) {
              checkedLow += 1;
              expect(years).toBeLessThanOrEqual(2);
            }
            if (overall >= 85 && age <= 29 && years >= 4) sawStarLongDeal = true;
          }
        }

        let id: string;
        if (pend.kind === 'prologue') id = pend.prologue!.options[0]!.id;
        else if (pend.kind === 'college_pick') id = pend.collegePick!.schools[0]!.id;
        else if (pend.kind === 'college_year')
          id = (
            pend.collegeYear!.options.find((o) => o.id.startsWith('cy_declare')) ??
            pend.collegeYear!.options[0]!
          ).id;
        else if (pend.kind === 'landing') id = pend.landing!.offers[0]!.id;
        else if (pend.kind === 'midseason') id = pend.midseason!.decision.options[0]!.id;
        else if (pend.kind === 'chemistry') id = pend.chemistry!.decision.options[1]!.id;
        else if (pend.kind === 'overseas_offer') id = pend.overseasOffer!.options[0]!.id;
        else if (pend.kind === 'farewell') id = 'quiet_goodbye';
        else {
          const opts = pend.season!.decision.options;
          id = (opts.find((o) => o.id !== 'retire' && o.id !== 'demand_trade') ?? opts[0]!).id;
        }
        choices.push({ nodeId: pend.nodeId, choiceId: id });
      }
    }
    expect(checkedLow).toBeGreaterThan(20);
    // Sanity that the cap is overall-driven, not a blanket squeeze.
    expect(sawStarLongDeal).toBe(true);
  });
});
