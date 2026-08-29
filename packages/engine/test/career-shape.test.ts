import { describe, expect, it } from 'vitest';
import {
  ARCHETYPE_DEFS,
  AWARD_IDS,
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
      name: 'X',
      position: arch.position as Position,
      archetype: arch.id,
      market: (['small', 'mid', 'large'] as const)[i % 3]!,
    });
  });

  it('every career has a plausible length and monotonic ages', () => {
    for (const s of summaries) {
      expect(s.seasons.length).toBeGreaterThanOrEqual(1);
      expect(s.seasons.length).toBeLessThanOrEqual(25);
      for (let i = 1; i < s.seasons.length; i += 1) {
        expect(s.seasons[i]!.age).toBe(s.seasons[i - 1]!.age + 1);
        expect(s.seasons[i]!.index).toBe(s.seasons[i - 1]!.index + 1);
      }
      expect(s.seasons[0]!.age).toBe(19);
    }
  });

  it('ratings stay inside the legal band', () => {
    for (const s of summaries) {
      for (const key of RATING_KEYS) {
        expect(s.finalRatings[key]).toBeGreaterThanOrEqual(RATING_FLOOR);
        expect(s.finalRatings[key]).toBeLessThanOrEqual(RATING_CEIL);
      }
      expect(s.peakOverall).toBeGreaterThanOrEqual(s.finalOverall - 40);
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
        score >= 800 ? 'S' : score >= 580 ? 'A' : score >= 375 ? 'B' : score >= 190 ? 'C' : 'D';
      expect(grade).toBe(expected);
    }
  });

  it('produces a spread of outcomes, not all legends', () => {
    const grades = summaries.reduce<Record<string, number>>((acc, s) => {
      acc[s.legacy.grade] = (acc[s.legacy.grade] ?? 0) + 1;
      return acc;
    }, {});
    // No single grade dominates everything, and both tails exist.
    expect(Math.max(...Object.values(grades))).toBeLessThan(summaries.length * 0.75);
    expect((grades.C ?? 0) + (grades.D ?? 0)).toBeGreaterThan(0);
    expect((grades.S ?? 0) + (grades.A ?? 0)).toBeGreaterThan(0);
  });

  it('MVPs are rare across the population', () => {
    const mvpTotal = summaries.reduce((n, s) => n + (s.awards.mvp ?? 0), 0);
    expect(mvpTotal).toBeLessThan(summaries.length * 0.25);
  });
});
