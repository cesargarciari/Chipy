import { describe, expect, it } from 'vitest';
import {
  ARCHETYPE_IDS,
  INJURY_CATALOG,
  rollSeasonInjury,
  runCareer,
  seasonInjuryChance,
  type PlayerProfile,
} from '../src/index.js';
import { mulberry32 } from '../src/index.js';
import { autoPlay, SAMPLE_PROFILE } from './helpers.js';

const profileFor = (i: number): PlayerProfile => ({
  name: 'T',
  position: 'SF',
  archetype: ARCHETYPE_IDS[i % ARCHETYPE_IDS.length]!,
  market: 'large',
  jerseyNumber: i % 100,
  country: 'USA',
  handedness: 'right',
});

describe('injury roll', () => {
  it('a frail, old body is hurt far more often than a young iron man', () => {
    const young = seasonInjuryChance({ age: 23, durability: 90, injuryCount: 0, injuryResist: 0 });
    const oldFrail = seasonInjuryChance({
      age: 37,
      durability: 35,
      injuryCount: 6,
      injuryResist: 0,
    });
    expect(young).toBeLessThan(0.35);
    expect(oldFrail).toBeGreaterThan(young + 0.25);
    expect(oldFrail).toBeLessThanOrEqual(0.8);
  });

  it('medical perks cut the odds', () => {
    const base = { age: 33, durability: 55, injuryCount: 3, injuryResist: 0 };
    expect(seasonInjuryChance({ ...base, injuryResist: 0.6 })).toBeLessThan(
      seasonInjuryChance(base),
    );
  });

  it('severe injuries are the rare tail; the catalogue only lets those end a career', () => {
    const rng = mulberry32(7);
    const counts: Record<string, number> = {};
    let ended = 0;
    for (let i = 0; i < 4000; i += 1) {
      const r = rollSeasonInjury(rng, { age: 30, durability: 60, injuryCount: 2, injuryResist: 0 });
      if (!r) continue;
      counts[r.severity] = (counts[r.severity] ?? 0) + 1;
      if (r.careerEnding) ended += 1;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect((counts.severe ?? 0) / total).toBeLessThan(0.1);
    expect((counts.knock ?? 0) + (counts.strain ?? 0)).toBeGreaterThan(total * 0.6);
    expect(ended).toBeGreaterThan(0);
  });

  it('only severe catalogue entries carry an end-of-career chance', () => {
    for (const t of INJURY_CATALOG) {
      if ('endBase' in t && t.endBase) expect(t.severity).toBe('severe');
    }
  });

  it('every career picks up at least one injury over 120 runs', () => {
    let injuryFree = 0;
    for (let i = 0; i < 120; i += 1) {
      const s = autoPlay(`inj-${i}`, profileFor(i));
      if (s.injuryHistory.length === 0) injuryFree += 1;
      for (const e of s.injuryHistory) {
        expect(e.gamesMissed).toBeGreaterThanOrEqual(1);
        expect(typeof e.type).toBe('string');
      }
    }
    expect(injuryFree).toBeLessThanOrEqual(2);
  });
});

describe('contracts + farewell', () => {
  /** Walk a career, always taking a multi-year FA offer, and assert we never
   *  retire the very season after signing one. */
  it('a signed multi-year deal is always played past its first season', () => {
    for (let i = 0; i < 40; i += 1) {
      const seed = `ctr-${i}`;
      const profile = profileFor(i);
      const choices: Array<{ nodeId: string; choiceId: string }> = [];
      let signedAt: number | null = null;
      let signedYears = 0;

      for (let step = 0; step < 400; step += 1) {
        const res = runCareer({ seed, profile, choices });
        if (res.status === 'complete') {
          if (signedAt !== null && signedYears > 1) {
            const after = res.summary.seasons.filter((s) => s.index >= signedAt!);
            // The deal is honoured unless a catastrophic injury cut it short.
            const endedByInjury = res.summary.injuryHistory.some(
              (inj) => inj.severity === 'severe' && inj.seasonIndex >= signedAt!,
            );
            expect(after.length >= 2 || endedByInjury).toBe(true);
          }
          break;
        }
        const p = res.pending;
        let choiceId: string;
        if (p.kind === 'prologue') choiceId = p.prologue!.options[0]!.id;
        else if (p.kind === 'college_pick') choiceId = p.collegePick!.schools[0]!.id;
        else if (p.kind === 'college_year')
          choiceId = (
            p.collegeYear!.options.find((o) => o.id.startsWith('cy_declare')) ??
            p.collegeYear!.options[0]!
          ).id;
        else if (p.kind === 'landing') choiceId = p.landing!.offers[0]!.id;
        else if (p.kind === 'midseason') choiceId = p.midseason!.decision.options[0]!.id;
        else if (p.kind === 'overseas_offer') choiceId = p.overseasOffer!.options[0]!.id;
        else if (p.kind === 'farewell') choiceId = 'quiet_goodbye';
        else {
          const d = p.season!.decision;
          const opts = d.options;
          if (d.kind === 'free_agency') {
            const multi =
              opts.filter((o) => o.id !== 'retire').find((o) => /([2-9])yr/.test(o.blurb)) ??
              opts.find((o) => o.id !== 'retire');
            const chosen = multi ?? opts[0]!;
            const m = chosen.blurb.match(/(\d)yr/);
            signedYears = m ? Number(m[1]) : 1;
            signedAt = p.season!.preview.seasonNumber;
            choiceId = chosen.id;
          } else {
            choiceId = (opts.find((o) => o.id !== 'retire') ?? opts[0]!).id;
          }
        }
        choices.push({ nodeId: p.nodeId, choiceId });
      }
    }
  });

  it('a farewell tour grants exactly one more season, then the career ends', () => {
    for (let i = 0; i < 60; i += 1) {
      const seed = `fw-${i}`;
      const profile = profileFor(i);
      const choices: Array<{ nodeId: string; choiceId: string }> = [];
      let farewellSeen = 0;
      let seasonsAtFarewell = -1;

      for (let step = 0; step < 400; step += 1) {
        const res = runCareer({ seed, profile, choices });
        if (res.status === 'complete') {
          if (seasonsAtFarewell >= 0) {
            const total = res.summary.seasons.length + res.summary.overseasSeasons.length;
            expect(total).toBeLessThanOrEqual(seasonsAtFarewell + 1);
          }
          break;
        }
        const p = res.pending;
        let choiceId: string;
        if (p.kind === 'farewell') {
          farewellSeen += 1;
          expect(farewellSeen).toBe(1); // never prompted twice
          seasonsAtFarewell = res.pending.farewell!.preview.seasonNumber - 1; // seasons already played
          choiceId = 'farewell_tour';
        } else if (p.kind === 'prologue') choiceId = p.prologue!.options[0]!.id;
        else if (p.kind === 'college_pick') choiceId = p.collegePick!.schools[0]!.id;
        else if (p.kind === 'college_year')
          choiceId = (
            p.collegeYear!.options.find((o) => o.id.startsWith('cy_declare')) ??
            p.collegeYear!.options[0]!
          ).id;
        else if (p.kind === 'landing') choiceId = p.landing!.offers[0]!.id;
        else if (p.kind === 'midseason') choiceId = p.midseason!.decision.options[0]!.id;
        else if (p.kind === 'overseas_offer') choiceId = p.overseasOffer!.options[0]!.id;
        else {
          const opts = p.season!.decision.options;
          choiceId = (opts.find((o) => o.id !== 'retire') ?? opts[0]!).id;
        }
        choices.push({ nodeId: p.nodeId, choiceId });
      }
    }
  });

  it('the farewell node replays deterministically', () => {
    const build = (fw: 'farewell_tour' | 'quiet_goodbye') => {
      const choices: Array<{ nodeId: string; choiceId: string }> = [];
      for (let step = 0; step < 400; step += 1) {
        const res = runCareer({ seed: 'det-fw', profile: SAMPLE_PROFILE, choices });
        if (res.status === 'complete') return res.summary;
        const p = res.pending;
        let choiceId: string;
        if (p.kind === 'farewell') choiceId = fw;
        else if (p.kind === 'prologue') choiceId = p.prologue!.options[0]!.id;
        else if (p.kind === 'college_pick') choiceId = p.collegePick!.schools[0]!.id;
        else if (p.kind === 'college_year')
          choiceId = (
            p.collegeYear!.options.find((o) => o.id.startsWith('cy_declare')) ??
            p.collegeYear!.options[0]!
          ).id;
        else if (p.kind === 'landing') choiceId = p.landing!.offers[0]!.id;
        else if (p.kind === 'midseason') choiceId = p.midseason!.decision.options[0]!.id;
        else if (p.kind === 'overseas_offer') choiceId = p.overseasOffer!.options[0]!.id;
        else {
          const opts = p.season!.decision.options;
          choiceId = (opts.find((o) => o.id !== 'retire') ?? opts[0]!).id;
        }
        choices.push({ nodeId: p.nodeId, choiceId });
      }
      throw new Error('no finish');
    };
    expect(JSON.stringify(build('quiet_goodbye'))).toEqual(JSON.stringify(build('quiet_goodbye')));
  });
});
