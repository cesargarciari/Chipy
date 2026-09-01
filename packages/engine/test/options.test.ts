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

  it('drops a rating chip entirely once that stat is at the 99 cap', () => {
    const chips = describeEffects(
      { ratings: { threePoint: 6, finishing: 4 } },
      { ...ratingsAt(50), threePoint: 99 },
    );
    expect(chips.map((c) => c.key)).toEqual(['finishing']);
  });

  it('shows DEFENSE as the tile move (an average of the two D bumps), never their sum', () => {
    // +4 to each D at 60/60: DEFENSE is a weighted average, so the tile moves +4.
    const even = describeEffects(
      { ratings: { interiorDefense: 4, perimeterDefense: 4 } },
      ratingsAt(60),
    );
    const def = even.find((c) => c.key === 'defense')!;
    expect(def).toMatchObject({ short: 'DEF', delta: 4 });
    expect(def.nominal).toBeUndefined(); // nothing trimmed - a straight number, no strikethrough

    // A lopsided bump into the weaker end moves the blended tile less, but the
    // number stays clean - no "pulled down" nominal.
    const lopsided = describeEffects(
      { ratings: { interiorDefense: 6 } },
      { ...ratingsAt(60), perimeterDefense: 88 },
    );
    const d2 = lopsided.find((c) => c.key === 'defense')!;
    expect(d2.delta).toBeGreaterThan(0);
    expect(d2.delta).toBeLessThan(6);
    expect(d2.nominal).toBeUndefined();
  });

  it('keeps a trimmed DEFENSE nominal only when the 99 cap actually bites', () => {
    const chips = describeEffects(
      { ratings: { interiorDefense: 8, perimeterDefense: 8 } },
      { ...ratingsAt(96), interiorDefense: 98, perimeterDefense: 98 },
    );
    const def = chips.find((c) => c.key === 'defense')!;
    expect(def.nominal).toBeGreaterThan(def.delta);
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
