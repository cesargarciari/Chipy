import { describe, expect, it } from 'vitest';
import {
  ARCHETYPE_DEFS,
  COUNTRIES,
  PERKS,
  SHOE_BRANDS,
  buildMidseasonIndex,
  describeChoice,
  describeEffects,
  getPerk,
  runCareer,
  type Position,
} from '../src/index.js';
import { autoPlay, SAMPLE_PROFILE } from './helpers.js';

const population = Array.from({ length: 160 }, (_, i) => {
  const arch = ARCHETYPE_DEFS[i % ARCHETYPE_DEFS.length]!;
  return autoPlay(`econ-${i}`, {
    name: 'Test',
    position: arch.position as Position,
    archetype: arch.id,
    market: (['small', 'mid', 'large'] as const)[i % 3]!,
    jerseyNumber: i % 100,
    country: COUNTRIES[i % COUNTRIES.length]!.id,
    handedness: i % 5 === 0 ? ('left' as const) : ('right' as const),
  });
});

describe('economy', () => {
  it('every career banks real money and never goes into the red', () => {
    for (const s of population) {
      expect(s.careerEarnings).toBeGreaterThan(0);
      expect(s.peakSalary).toBeGreaterThan(0);
      expect(s.peakSalary).toBeLessThanOrEqual(44);
      for (const season of s.seasons) {
        expect(season.salary).toBeGreaterThan(0);
        expect(season.salary).toBeLessThanOrEqual(44);
      }
      // Career earnings is at least the sum of the biggest single season.
      expect(s.careerEarnings).toBeGreaterThanOrEqual(s.peakSalary);
    }
  });

  it('spans a wide earnings range across the population', () => {
    const earns = population.map((s) => s.careerEarnings).sort((a, b) => a - b);
    expect(earns[0]!).toBeLessThan(150);
    expect(earns.at(-1)!).toBeGreaterThan(250);
  });
});

describe('perks', () => {
  it('the season screen carries an affordable, not-yet-owned shop; buys stick', () => {
    // The shop is an aside on the season pending — buy the first option each
    // season by recording a `perks{n}` choice before the `s{n}` choice.
    const profile = SAMPLE_PROFILE;
    const choices: Array<{ nodeId: string; choiceId: string }> = [];
    let bought = 0;
    for (let step = 0; step < 800; step += 1) {
      const res = runCareer({ seed: 'perk-walk', profile, choices });
      if (res.status === 'complete') {
        for (const id of res.summary.perks) expect(PERKS.some((p) => p.id === id)).toBe(true);
        expect(bought).toBeGreaterThan(0);
        expect(res.summary.perks.length).toBeGreaterThan(0);
        return;
      }
      const p = res.pending;
      if (p.kind === 'season' || p.kind === 'overseas_offer') {
        const shop = p.kind === 'season' ? p.season!.shop : p.overseasOffer!.shop;
        const buy = shop?.items.find((i) => i.affordable && !i.owned);
        const justBought = choices.filter((c) => c.nodeId === shop?.nodeId).length;
        if (shop && buy && justBought === 0) {
          expect(getPerk(buy.perkId)).toBeTruthy();
          expect(buy.cost).toBeGreaterThan(0);
          expect(shop.bank).toBeGreaterThanOrEqual(buy.cost);
          bought += 1;
          choices.push({ nodeId: shop.nodeId, choiceId: buy.choiceId });
          continue;
        }
      }
      let choiceId: string;
      if (p.kind === 'prologue') choiceId = p.prologue!.options[0]!.id;
      else if (p.kind === 'college_pick') choiceId = p.collegePick!.schools[0]!.id;
      else if (p.kind === 'college_year')
        choiceId = p.collegeYear!.options.find((o) => o.id.startsWith('cy_declare'))!.id;
      else if (p.kind === 'landing') choiceId = p.landing!.offers[0]!.id;
      else if (p.kind === 'midseason') choiceId = p.midseason!.decision.options[0]!.id;
      else if (p.kind === 'chemistry') choiceId = p.chemistry!.decision.options[1]!.id;
      else if (p.kind === 'overseas_offer') choiceId = p.overseasOffer!.options[0]!.id;
      else if (p.kind === 'farewell') choiceId = 'quiet_goodbye';
      else {
        const opts = p.season!.decision.options;
        choiceId = (opts.find((o) => o.id !== 'retire') ?? opts[0]!).id;
      }
      choices.push({ nodeId: p.nodeId, choiceId });
    }
    throw new Error('career did not terminate');
  });

  it('perk purchases show a negative money chip and are comparable choices', () => {
    const chips = describeEffects({ money: -2 });
    expect(chips[0]).toMatchObject({ key: 'money', delta: -2 });
    expect(describeChoice('perks4', 'buy_shooting_trainer')).toBe('Shooting trainer');
    expect(describeChoice('perks4', 'perks_done')).toBeNull();
  });
});

describe('mid-season situations', () => {
  it('fire on a real share of seasons, each resolving to a known option', () => {
    let seasonsWithMid = 0;
    let totalSeasons = 0;
    const index = buildMidseasonIndex();
    for (const s of population) {
      for (const season of s.seasons) {
        totalSeasons += 1;
        if (season.midseasonId !== null) {
          seasonsWithMid += 1;
          expect(season.midseasonHeadline).toBeTruthy();
        }
      }
    }
    const rate = seasonsWithMid / totalSeasons;
    expect(rate).toBeGreaterThan(0.1);
    expect(rate).toBeLessThan(0.45);
    expect(index.size).toBeGreaterThan(20);
  });

  it('labels a mid-season choice for the "also chose" rollup', () => {
    expect(describeChoice('ms5', 'msx_fight_trade')).toBe('FORCE A TRADE');
    expect(describeChoice('ms5', 'not_real')).toBeNull();
  });

  it('never touches ratings — every mid-season option is ratings-free', () => {
    for (const [, hit] of buildMidseasonIndex()) {
      const opt = hit.scenario.options.find((o) => o.id === hit.optionId)!;
      expect(opt.effect.ratings).toBeUndefined();
      expect(opt.stance?.growthBias).toBeUndefined();
    }
  });
});

describe('draft randomness', () => {
  it('the same profile drafts across a wide range of slots on different seeds', () => {
    const slots = new Set<number | 'ud'>();
    for (let i = 0; i < 120; i += 1) {
      const s = autoPlay(`draft-${i}`, {
        name: 'Draft Test',
        position: 'PG',
        archetype: 'combo_guard',
        market: 'large',
        jerseyNumber: 5,
        country: 'USA',
        handedness: 'right',
      });
      slots.add(s.draft.undrafted ? 'ud' : s.draft.pick!);
    }
    // Not clustered on two or three slots.
    expect(slots.size).toBeGreaterThan(15);
  });
});

describe('franchise standing + career moments', () => {
  it('accrues a per-team standing, and a ring can push it to idol', () => {
    let sawIdol = false;
    let sawNegative = false;
    for (const s of population) {
      for (const f of s.franchises) {
        expect(f.seasons).toBeGreaterThanOrEqual(1);
        if (f.tier === 'idol') {
          expect(f.rings).toBeGreaterThanOrEqual(1); // a ring gates Idol
          sawIdol = true;
        }
        if (f.tier === 'legend') {
          expect(f.seasons).toBeGreaterThanOrEqual(6); // Legend needs real tenure
          sawIdol = true;
        }
        if (f.score < 0) sawNegative = true;
      }
      // A jersey retired by an idol/legend names that franchise.
      if (s.legacy.jerseyRetired && s.legacy.jerseyRetiredBy) {
        expect(typeof s.legacy.jerseyRetiredBy).toBe('string');
      }
    }
    // Over 160 careers at least one franchise idol shows up.
    expect(sawIdol).toBe(true);
    // …and mid-season drama can drop a standing below zero.
    expect(sawNegative).toBe(true);
  });

  it('carries an idolatry progress (0..100) per team and for the national side', () => {
    let sawFranchiseProgress = false;
    let sawNationalCaps = false;
    for (const s of population) {
      for (const f of s.franchises) {
        expect(f.progress).toBeGreaterThanOrEqual(0);
        expect(f.progress).toBeLessThanOrEqual(100);
        if (f.progress > 0) sawFranchiseProgress = true;
      }
      const nt = s.nationalTeam;
      expect(nt.progress).toBeGreaterThanOrEqual(0);
      expect(nt.progress).toBeLessThanOrEqual(100);
      expect(nt.medals).toBeLessThanOrEqual(nt.caps || Infinity);
      if (nt.caps > 0) sawNationalCaps = true;
    }
    expect(sawFranchiseProgress).toBe(true);
    expect(sawNationalCaps).toBe(true);
  });

  it('emits big-moment cards keyed to the season they happened', () => {
    let sawAward = false;
    let sawRing = false;
    for (const s of population) {
      for (const m of s.moments) {
        expect(m.title.length).toBeGreaterThan(2);
        expect(m.seasonIndex).toBeGreaterThanOrEqual(1);
        if (m.kind === 'award') sawAward = true;
        if (m.kind === 'ring') sawRing = true;
      }
    }
    expect(sawAward).toBe(true);
    expect(sawRing).toBe(true);
  });
});

describe('overseas + shoe deals', () => {
  it('a low-value career can reach the EuroLeague and win there', () => {
    // Scan a wider net for the overseas path (it is deliberately uncommon).
    let sawOverseas = false;
    let sawEuroTitle = false;
    for (let i = 0; i < 400 && !(sawOverseas && sawEuroTitle); i += 1) {
      const arch = ARCHETYPE_DEFS[i % ARCHETYPE_DEFS.length]!;
      const s = autoPlay(`euro-${i}`, {
        name: 'Test',
        position: arch.position as Position,
        archetype: arch.id,
        market: 'small',
        jerseyNumber: i % 100,
        country: COUNTRIES[i % COUNTRIES.length]!.id,
        handedness: 'right' as const,
      });
      if (s.overseasSeasons.length > 0) {
        sawOverseas = true;
        for (const os of s.overseasSeasons) {
          expect(os.salary).toBeGreaterThan(0);
          expect(os.country.length).toBeGreaterThan(2);
        }
        if ((s.awards.euroleague_champion ?? 0) > 0) sawEuroTitle = true;
      }
    }
    expect(sawOverseas).toBe(true);
    expect(sawEuroTitle).toBe(true);
  });

  it('a fame-80 career picks a shoe brand exactly once', () => {
    let sawShoe = false;
    for (const s of population) {
      if (s.shoeDeal) {
        sawShoe = true;
        expect(Object.values(SHOE_BRANDS)).toContain(s.shoeDeal);
        const shoePicks = s.choices.filter((c) => c.choiceId.startsWith('shoe_'));
        expect(shoePicks.length).toBe(1);
      }
    }
    expect(sawShoe).toBe(true);
  });
});
