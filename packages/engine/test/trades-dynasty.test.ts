import { describe, expect, it } from 'vitest';
import {
  ARCHETYPE_IDS,
  AWARD_IDS,
  runCareer,
  statusRank,
  statusTier,
  tradeChance,
  type PlayerProfile,
} from '../src/index.js';
import { autoPlay } from './helpers.js';

const profileFor = (i: number): PlayerProfile => ({
  name: 'T',
  position: 'SF',
  archetype: ARCHETYPE_IDS[i % ARCHETYPE_IDS.length]!,
  market: 'mid',
  jerseyNumber: i % 100,
  country: 'USA',
  handedness: 'right',
});

describe('status tier', () => {
  it('climbs with overall and is lifted by accolades', () => {
    const base = { peakOverall: 80, mvps: 0, allNba: 0, allStars: 0, hype: 40 };
    expect(statusTier({ ...base, overall: 68 })).toBe('fringe');
    expect(statusTier({ ...base, overall: 78 })).toBe('role_player');
    expect(statusTier({ ...base, overall: 84 })).toBe('role_player');
    expect(statusTier({ ...base, overall: 86 })).toBe('star');
    expect(statusTier({ ...base, overall: 88 })).toBe('star');
    expect(statusTier({ ...base, overall: 90 })).toBe('superstar');
    expect(statusTier({ ...base, overall: 95, peakOverall: 95, mvps: 2 })).toBe('generational');
    // an ageing ex-MVP keeps superstar status even at a modest overall
    expect(statusRank(statusTier({ ...base, overall: 79, mvps: 1 }))).toBe(statusRank('superstar'));
  });
});

describe('trade chance', () => {
  it('is higher on a bad team / thin role, lower for an idol or a superstar', () => {
    const bad = tradeChance({
      teamStrength: 0.2,
      role: 'bench',
      contractYearsLeft: 1,
      franchiseProgress: 5,
      franchiseTier: 'none',
      status: 'role_player',
      chemistry: 55,
      justTraded: false,
    });
    const safe = tradeChance({
      teamStrength: 0.8,
      role: 'franchise',
      contractYearsLeft: 4,
      franchiseProgress: 80,
      franchiseTier: 'idol',
      status: 'superstar',
      chemistry: 70,
      justTraded: false,
    });
    expect(bad).toBeGreaterThan(safe + 0.1);
    expect(bad).toBeLessThanOrEqual(0.26);
    expect(safe).toBeGreaterThanOrEqual(0.01);
    expect(
      tradeChance({
        teamStrength: 0.2,
        role: 'bench',
        contractYearsLeft: 1,
        franchiseProgress: 5,
        franchiseTier: 'none',
        status: 'role_player',
        chemistry: 55,
        justTraded: true,
      }),
    ).toBeLessThan(0.1);
  });

  it('a toxic locker room lifts the odds sharply, even for a star', () => {
    const base = {
      teamStrength: 0.6,
      role: 'starter' as const,
      contractYearsLeft: 3,
      franchiseProgress: 45,
      franchiseTier: 'favorite' as const,
      status: 'star' as const,
      justTraded: false,
    };
    const ok = tradeChance({ ...base, chemistry: 70 });
    const toxic = tradeChance({ ...base, chemistry: 5 });
    expect(toxic).toBeGreaterThan(ok + 0.2);
  });
});

describe('trades in a career', () => {
  it('a star can demand a trade, and it produces a trade moment', () => {
    let demandsFound = 0;
    let demandTradeMoments = 0;
    for (let i = 0; i < 50 && demandsFound < 3; i += 1) {
      const seed = `demand-${i}`;
      const profile = profileFor(i);
      const choices: Array<{ nodeId: string; choiceId: string }> = [];
      for (let step = 0; step < 400; step += 1) {
        const res = runCareer({ seed, profile, choices });
        if (res.status === 'complete') {
          demandTradeMoments += res.summary.moments.filter((m) => m.id === 'trade_demand').length;
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
        else if (p.kind === 'finals') choiceId = p.finals!.game.options[0]!.id;
        else if (p.kind === 'chemistry') choiceId = p.chemistry!.decision.options[1]!.id;
        else if (p.kind === 'overseas_offer') choiceId = p.overseasOffer!.options[0]!.id;
        else if (p.kind === 'farewell') choiceId = 'quiet_goodbye';
        else {
          const opts = p.season!.decision.options;
          const dt = opts.find((o) => o.id === 'demand_trade');
          if (dt) {
            demandsFound += 1;
            choiceId = 'demand_trade';
          } else {
            choiceId = (opts.find((o) => o.id !== 'retire') ?? opts[0]!).id;
          }
        }
        choices.push({ nodeId: p.nodeId, choiceId });
      }
    }
    expect(demandsFound).toBeGreaterThan(0);
    expect(demandTradeMoments).toBeGreaterThan(0);
  });

  it('the demand-trade node is only offered to star-and-up players', () => {
    for (let i = 0; i < 30; i += 1) {
      const seed = `gate-${i}`;
      const profile = profileFor(i);
      const choices: Array<{ nodeId: string; choiceId: string }> = [];
      for (let step = 0; step < 400; step += 1) {
        const res = runCareer({ seed, profile, choices });
        if (res.status === 'complete') break;
        const p = res.pending;
        if (
          p.kind === 'season' &&
          p.season!.decision.options.some((o) => o.id === 'demand_trade')
        ) {
          const rank = statusRank(p.season!.preview.statusTier);
          expect(rank).toBeGreaterThanOrEqual(statusRank('star'));
        }
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
        else if (p.kind === 'finals') choiceId = p.finals!.game.options[0]!.id;
        else if (p.kind === 'chemistry') choiceId = p.chemistry!.decision.options[1]!.id;
        else if (p.kind === 'overseas_offer') choiceId = p.overseasOffer!.options[0]!.id;
        else if (p.kind === 'farewell') choiceId = 'quiet_goodbye';
        else {
          const opts = p.season!.decision.options;
          choiceId = (opts.find((o) => o.id !== 'retire' && o.id !== 'demand_trade') ?? opts[0]!)
            .id;
        }
        choices.push({ nodeId: p.nodeId, choiceId });
      }
    }
  });
});

describe('championship window + no World Cup', () => {
  it('the ring window opens on a title and repeat rings are possible', () => {
    let ringCareers = 0;
    let repeatWithin5 = 0;
    let anyWc = 0;
    for (let i = 0; i < 200; i += 1) {
      const s = autoPlay(`ring-${i}`, profileFor(i));
      for (const id of Object.keys(s.awards)) {
        expect(AWARD_IDS.includes(id as (typeof AWARD_IDS)[number])).toBe(true);
        if (id.startsWith('wc_')) anyWc += 1;
      }
      const rings = s.seasons.filter((x) => x.teamResult === 'champion').map((x) => x.index);
      if (rings.length) ringCareers += 1;
      for (let k = 1; k < rings.length; k += 1) {
        if (rings[k]! - rings[k - 1]! <= 5) repeatWithin5 += 1;
      }
    }
    expect(anyWc).toBe(0);
    expect(ringCareers).toBeGreaterThan(0);
    // Repeat titles happen, but they're the exception — not every ring-winner.
    expect(repeatWithin5).toBeGreaterThan(0);
    expect(repeatWithin5).toBeLessThan(ringCareers);
  });

  it('a late-second-round / undrafted start goes overseas more often than a lottery pick', () => {
    let late = 0;
    let lateOverseas = 0;
    let early = 0;
    let earlyOverseas = 0;
    for (let i = 0; i < 260; i += 1) {
      const s = autoPlay(`draft-${i}`, profileFor(i));
      const isLate = s.draft.undrafted || (s.draft.pick ?? 0) >= 31;
      if (isLate) {
        late += 1;
        if (s.overseasSeasons.length > 0) lateOverseas += 1;
      } else {
        early += 1;
        if (s.overseasSeasons.length > 0) earlyOverseas += 1;
      }
    }
    const lateRate = lateOverseas / Math.max(1, late);
    const earlyRate = earlyOverseas / Math.max(1, early);
    expect(lateRate).toBeGreaterThan(earlyRate + 0.08);
  });
});
