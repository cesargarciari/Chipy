import { describe, expect, it } from 'vitest';
import { RATING_KEYS, describeEffects, optionView, type Ratings } from '../src/index.js';

const ratingsAt = (fill: number): Ratings =>
  RATING_KEYS.reduce((acc, k) => {
    acc[k] = fill;
    return acc;
  }, {} as Ratings);

describe('describeEffects', () => {
  it('orders rating chips by magnitude, then meta chips', () => {
    const chips = describeEffects({ ratings: { finishing: 4, threePoint: 8 }, hype: 5 });
    expect(chips.map((c) => c.key)).toEqual(['threePoint', 'finishing', 'hype']);
    expect(chips[0]).toMatchObject({ short: '3PT', label: 'THREE-POINT', delta: 8 });
  });

  it('skips draftStock (internal) but keeps negatives', () => {
    const chips = describeEffects({ durability: -3, draftStock: 10 });
    expect(chips).toHaveLength(1);
    expect(chips[0]).toMatchObject({ short: 'DUR', delta: -3 });
  });

  it('trims a rating chip to the room left under 99 and keeps the nominal', () => {
    const chips = describeEffects({ ratings: { finishing: 8 } }, ratingsAt(95));
    expect(chips[0]).toMatchObject({ key: 'finishing', delta: 4, nominal: 8 });
  });

  it('shows a maxed stat as +0 rather than dropping it', () => {
    const chips = describeEffects({ ratings: { threePoint: 6 } }, ratingsAt(99));
    expect(chips[0]).toMatchObject({ key: 'threePoint', delta: 0, nominal: 6 });
  });
});

describe('optionView', () => {
  it('derives a watermark from the biggest effect when not overridden', () => {
    const v = optionView({
      id: 'x_test',
      label: 'TEST',
      blurb: 'a test',
      effect: { ratings: { perimeterDefense: 9, threePoint: 3 } },
      stance: { tag: 'Lockdown' },
    });
    expect(v.watermark).toBe('DEF');
    expect(v.tag).toBe('Lockdown');
    expect(v.effects[0]!.short).toBe('DEF');
  });

  it('respects an explicit watermark', () => {
    const v = optionView({ id: 'x2', label: 'X', blurb: 'y', effect: {}, watermark: 'FA' });
    expect(v.watermark).toBe('FA');
    expect(v.effects).toEqual([]);
  });

  it('scales an ordinary option down, but a rare breakthrough lands in full', () => {
    const normal = optionView({
      id: 'n',
      label: 'N',
      blurb: 'b',
      effect: { ratings: { threePoint: 8 } },
    });
    expect(normal.effects[0]!.delta).toBeLessThan(8);
    expect(normal.rare).toBeUndefined();

    const rare = optionView({
      id: 'r',
      label: 'R',
      blurb: 'b',
      effect: { ratings: { threePoint: 9 } },
      rare: true,
    });
    expect(rare.effects[0]!.delta).toBe(9);
    expect(rare.rare).toBe(true);
  });
});
