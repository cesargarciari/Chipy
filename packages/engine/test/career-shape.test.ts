import { describe, expect, it } from 'vitest';
import {
  ARCHETYPE_DEFS,
  AWARD_IDS,
  COUNTRIES,
  RATING_KEYS,
  RATING_CEIL,
  RATING_FLOOR,
  type Position,
} from '../src/index.js';
import { autoPlay } from './helpers.js';

const AWARD_SET = new Set<string>(AWARD_IDS);

describe('career shape (200 random careers)', () => {
  const summaries = Array.from({ length: 200 }, (_, i) => {
    const arch = ARCHETYPE_DEFS[i % ARCHETYPE_DEFS.length]!;
    return autoPlay(`shape-${i}`, {
      name: 'Test Player',
      position: arch.position as Position,
      archetype: arch.id,
      market: (['small', 'mid', 'large'] as const)[i % 3]!,
      jerseyNumber: i % 100,
      country: COUNTRIES[i % COUNTRIES.length]!.id,
      handedness: i % 5 === 0 ? 'left' : 'right',
    });
  });

  it('every career has a plausible length and monotonic ages', () => {
    for (const s of summaries) {
      expect(s.seasons.length).toBeGreaterThanOrEqual(1);
      // NBA + overseas years together stay within the career cap.
      expect(s.seasons.length + s.overseasSeasons.length).toBeLessThanOrEqual(25);
      // Ages always move forward; overseas years can leave a gap in the NBA list.
      for (let i = 1; i < s.seasons.length; i += 1) {
        expect(s.seasons[i]!.age).toBeGreaterThan(s.seasons[i - 1]!.age);
      }
      for (let i = 1; i < s.overseasSeasons.length; i += 1) {
        expect(s.overseasSeasons[i]!.age).toBeGreaterThan(s.overseasSeasons[i - 1]!.age);
      }
      // Rookie age is 19 plus one year for every extra season spent in school.
      const collegeYears = s.college?.years.length ?? 1;
      expect(s.seasons[0]!.age).toBe(19 + Math.max(0, collegeYears - 1));
      expect(collegeYears).toBeGreaterThanOrEqual(1);
    }
  });

  it('ratings stay inside the legal band', () => {
    for (const s of summaries) {
      for (const key of RATING_KEYS) {
        expect(s.finalRatings[key]).toBeGreaterThanOrEqual(RATING_FLOOR);
        expect(s.finalRatings[key]).toBeLessThanOrEqual(RATING_CEIL);
      }
      expect(s.peakOverall).toBeLessThanOrEqual(RATING_CEIL);
    }
  });

  it('every award id is known, and a champion season is really a championship', () => {
    for (const s of summaries) {
      for (const id of Object.keys(s.awards)) expect(AWARD_SET.has(id)).toBe(true);
      for (const season of s.seasons) {
        for (const a of season.awards) expect(AWARD_SET.has(a)).toBe(true);
        if (season.awards.includes('champion')) expect(season.teamResult).toBe('champion');
        if (season.awards.includes('finals_mvp')) expect(season.awards).toContain('champion');
      }
    }
  });

  it('legacy grade matches its score band', () => {
    for (const s of summaries) {
      const { score, grade } = s.legacy;
      const expected =
        score >= 940 ? 'S' : score >= 650 ? 'A' : score >= 400 ? 'B' : score >= 300 ? 'C' : 'D';
      expect(grade).toBe(expected);
    }
  });

  it('produces a spread of outcomes, not all legends', () => {
    const grades = summaries.reduce<Record<string, number>>((acc, s) => {
      acc[s.legacy.grade] = (acc[s.legacy.grade] ?? 0) + 1;
      return acc;
    }, {});
    expect(Math.max(...Object.values(grades))).toBeLessThan(summaries.length * 0.75);
    expect((grades.C ?? 0) + (grades.D ?? 0)).toBeGreaterThan(0);
    expect((grades.S ?? 0) + (grades.A ?? 0)).toBeGreaterThan(0);
  });

  it('MVPs are rare across the population', () => {
    const mvpTotal = summaries.reduce((n, s) => n + (s.awards.mvp ?? 0), 0);
    expect(mvpTotal).toBeLessThan(summaries.length * 0.25);
  });

  it('stat continuity: no played season craters below 0.6x the last played season', () => {
    for (const s of summaries) {
      let lastPlayed: number | null = null;
      for (const season of s.seasons) {
        if (season.stats.gp === 0) continue;
        if (lastPlayed !== null && lastPlayed >= 6) {
          expect(season.stats.ppg).toBeGreaterThanOrEqual(lastPlayed * 0.6 - 0.05);
        }
        lastPlayed = season.stats.ppg;
      }
    }
  });
});
