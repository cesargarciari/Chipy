import { describe, expect, it } from 'vitest';
import {
  BOTTOM_TEAMS,
  conferenceSeed,
  gradeSeason,
  runCareer,
  type PlayerProfile,
} from '../src/index.js';
import { autoPlay } from './helpers.js';

describe('conference seed', () => {
  it('is 1..15 and, across seeds, ranks players onto seasons at every level', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 120; i += 1) {
      const s = autoPlay(`v415-seed-${i}`, {
        name: 'S',
        position: (['PG', 'SG', 'SF', 'PF', 'C'] as const)[i % 5]!,
        archetype: 'three_level_wing',
        market: (['small', 'mid', 'large'] as const)[i % 3]!,
        jerseyNumber: i % 100,
        country: 'USA',
        handedness: 'right',
      });
      for (const season of s.seasons) {
        expect(season.seed).toBeGreaterThanOrEqual(1);
        expect(season.seed).toBeLessThanOrEqual(15);
        seen.add(season.seed);
      }
    }
    // The spread is real - not every season is a 1-seed nor a 15-seed.
    expect(seen.has(1)).toBe(true);
    expect([...seen].filter((x) => x >= 10).length).toBeGreaterThan(0);
  });

  it('a superstar lifts his own team a few seeds above the roster alone', () => {
    let better = 0;
    let worseOrSame = 0;
    for (let i = 0; i < 60; i += 1) {
      const bare = conferenceSeed(`v415-lift-${i}`, 'DAL', 5, 0);
      const withStar = conferenceSeed(`v415-lift-${i}`, 'DAL', 5, 30); // impact ~30
      if (withStar < bare) better += 1;
      else worseOrSame += 1;
    }
    expect(better).toBeGreaterThan(worseOrSame);
  });
});

describe('higher seeds win more titles', () => {
  it('titles concentrate in the top seeds; a 6-seed almost never wins', () => {
    const titlesBySeed: Record<number, number> = {};
    const seasonsBySeed: Record<number, number> = {};
    for (let i = 0; i < 220; i += 1) {
      const s = autoPlay(`v415-title-${i}`, {
        name: 'T',
        position: (['PG', 'SG', 'SF', 'PF', 'C'] as const)[i % 5]!,
        archetype: 'point_forward',
        market: 'large',
        jerseyNumber: i % 100,
        country: 'USA',
        handedness: 'right',
      });
      for (const season of s.seasons) {
        if (season.seed < 1) continue;
        seasonsBySeed[season.seed] = (seasonsBySeed[season.seed] ?? 0) + 1;
        if (season.teamResult === 'champion') {
          titlesBySeed[season.seed] = (titlesBySeed[season.seed] ?? 0) + 1;
        }
      }
    }
    const topTitles = (titlesBySeed[1] ?? 0) + (titlesBySeed[2] ?? 0) + (titlesBySeed[3] ?? 0);
    const lowTitles = Object.entries(titlesBySeed)
      .filter(([s]) => Number(s) >= 5)
      .reduce((n, [, c]) => n + c, 0);
    expect(topTitles).toBeGreaterThan(0);
    expect(topTitles).toBeGreaterThan(lowTitles * 5 + 3);
    // The very best seed wins at a healthy clip.
    expect((titlesBySeed[1] ?? 0) / (seasonsBySeed[1] ?? 1)).toBeGreaterThan(0.08);
  });
});

describe('the cellar-dwellers live in the lottery', () => {
  it('a roster-only Kings / Wizards / Nets seeds worse than the field, mostly out of the bracket', () => {
    expect([...BOTTOM_TEAMS]).toEqual(['SAC', 'WAS', 'BKN']);

    // Average conference seed with no player attached (roster strength alone),
    // over many career seeds and seasons.
    const avgSeed = (teamId: string) => {
      let sum = 0;
      let n = 0;
      for (let s = 0; s < 200; s += 1) {
        for (let yr = 0; yr < 6; yr += 1) {
          sum += conferenceSeed(`v415-cellar-${s}`, teamId, yr, 0);
          n += 1;
        }
      }
      return sum / n;
    };

    const cellarAvg = ['SAC', 'WAS', 'BKN'].map(avgSeed).reduce((a, b) => a + b, 0) / 3;
    // A neutral pair of ordinary East / West rosters for reference.
    const ordinaryAvg = ['ATL', 'MIN'].map(avgSeed).reduce((a, b) => a + b, 0) / 2;

    // A conference midpoint is seed 8. The cellar teams sit well below that and
    // clearly worse than an ordinary roster.
    expect(cellarAvg).toBeGreaterThan(9.5);
    expect(cellarAvg).toBeGreaterThan(ordinaryAvg + 1.5);
  });
});

describe('gradeSeason', () => {
  it('rewards accolades + a title; punishes a lost year', () => {
    const elite = gradeSeason({
      awards: ['mvp', 'all_nba_1', 'champion', 'finals_mvp'],
      teamResult: 'champion',
      seed: 1,
      impact: 30,
      role: 'franchise',
      gamesPlayed: 78,
    });
    const washout = gradeSeason({
      awards: [],
      teamResult: 'lottery',
      seed: 14,
      impact: 6,
      role: 'fringe',
      gamesPlayed: 40,
    });
    expect(elite).toBe('S');
    expect(washout).toBe('D');
  });

  it('every played career season carries a grade S..D', () => {
    const seed = 'v415-grade-cov';
    const profile: PlayerProfile = {
      name: 'G',
      position: 'SF',
      archetype: 'three_level_wing',
      market: 'mid',
      jerseyNumber: 9,
      country: 'USA',
      handedness: 'right',
    };
    const choices: Array<{ nodeId: string; choiceId: string }> = [];
    for (let step = 0; step < 400; step += 1) {
      const res = runCareer({ seed, profile, choices });
      if (res.status === 'complete') {
        for (const s of res.summary.seasons) expect('SABCD'.includes(s.grade)).toBe(true);
        for (const o of res.summary.overseasSeasons) expect('SABCD'.includes(o.grade)).toBe(true);
        expect(res.summary.seasons.length).toBeGreaterThan(3);
        return;
      }
      const p = res.pending;
      let id: string;
      if (p.kind === 'prologue') id = p.prologue!.options[0]!.id;
      else if (p.kind === 'college_pick') id = p.collegePick!.schools[0]!.id;
      else if (p.kind === 'college_year')
        id = (
          p.collegeYear!.options.find((o) => o.id.startsWith('cy_declare')) ??
          p.collegeYear!.options[0]!
        ).id;
      else if (p.kind === 'landing') id = p.landing!.offers[0]!.id;
      else if (p.kind === 'midseason') id = p.midseason!.decision.options[0]!.id;
      else if (p.kind === 'chemistry') id = p.chemistry!.decision.options[1]!.id;
      else if (p.kind === 'overseas_offer') id = p.overseasOffer!.options[0]!.id;
      else if (p.kind === 'farewell') id = 'quiet_goodbye';
      else {
        const opts = p.season!.decision.options;
        id = (opts.find((o) => o.id !== 'retire' && o.id !== 'demand_trade') ?? opts[0]!).id;
      }
      choices.push({ nodeId: p.nodeId, choiceId: id });
    }
    throw new Error('career did not finish');
  });
});
