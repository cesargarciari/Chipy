import { describe, expect, it } from 'vitest';
import { describeChoice } from '../src/index.js';

describe('describeChoice', () => {
  it('labels prologue options', () => {
    expect(describeChoice('highschool', 'skills_camp')).toBe('GYM RAT');
    expect(describeChoice('recruiting', 'blue_blood')).toBe('BLUE-BLOOD');
  });

  it('labels season scenario options', () => {
    expect(describeChoice('s3', 'identity_box_killer')).toBe('BOX KILLER');
    expect(describeChoice('s12', 'ring_lead_young')).toBe('LEAD THE YOUNG GUYS');
  });

  it('labels retirement', () => {
    expect(describeChoice('s9', 'retire')).toBe('Retire');
  });

  it('returns null for per-player choices (offers, schools, declare/return/transfer)', () => {
    expect(describeChoice('landing', 'offer_1')).toBeNull();
    expect(describeChoice('s5', 'offer_2')).toBeNull();
    expect(describeChoice('college1', 'duke')).toBeNull();
    expect(describeChoice('cy1', 'cy_declare_1')).toBeNull();
  });

  it('returns null for anything unknown', () => {
    expect(describeChoice('s5', 'not_a_real_option')).toBeNull();
  });
});
