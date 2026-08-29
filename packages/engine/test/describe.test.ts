import { describe, expect, it } from 'vitest';
import { describeChoice } from '../src/index.js';

describe('describeChoice', () => {
  it('labels prologue choices', () => {
    expect(describeChoice('highschool', 'skills_camp')).toMatch(/skills-camp/i);
    expect(describeChoice('recruiting', 'blue_blood')).toMatch(/blue-blood/i);
  });

  it('labels season offseason decisions', () => {
    expect(describeChoice('s3', 'chase_scoring')).toBe('Hunt the scoring title');
    expect(describeChoice('s12', 'mentor_core')).toBe('Mentor the young core');
  });

  it('labels retirement', () => {
    expect(describeChoice('s9', 'retire')).toBe('Retire');
  });

  it('returns null for team offers (not comparable across players)', () => {
    expect(describeChoice('landing', 'offer_1')).toBeNull();
    expect(describeChoice('s5', 'offer_2')).toBeNull();
  });

  it('returns null for anything unknown', () => {
    expect(describeChoice('s5', 'not_a_real_decision')).toBeNull();
    expect(describeChoice('weird', 'skills_camp')).toBeNull();
  });
});
