import { describe, expect, it } from 'vitest';
import {
  defenseRatingOf,
  runCareer,
  tradeChance,
  type PlayerProfile,
  type Position,
} from '../src/index.js';
import { autoPlay } from './helpers.js';

describe('defenseRatingOf', () => {
  it('weights toward the stronger D so a one-way specialist still reads elite', () => {
    // A rim protector: elite inside, ordinary on the perimeter.
    expect(defenseRatingOf(96, 70)).toBeGreaterThanOrEqual(86);
    // Two equal middling D's land right between them.
    expect(defenseRatingOf(75, 75)).toBe(75);
    // A genuine two-way stopper climbs into the 90s (the old mean capped ~85).
    expect(defenseRatingOf(95, 92)).toBeGreaterThanOrEqual(90);
    // Never exceeds the 99 cap.
    expect(defenseRatingOf(99, 99)).toBe(99);
  });
});

describe('a superstar is not shopped out from under his feet', () => {
  it('caps involuntary trade odds near zero regardless of chemistry', () => {
    const base = {
      teamStrength: 0.3,
      role: 'franchise' as const,
      contractYearsLeft: 1,
      franchiseProgress: 10,
      franchiseTier: 'none' as const,
      chemistry: 5, // toxic
      justTraded: false,
    };
    expect(tradeChance({ ...base, status: 'superstar' })).toBeLessThanOrEqual(0.04);
    expect(tradeChance({ ...base, status: 'generational' })).toBeLessThanOrEqual(0.02);
    // A mere star still gets moved by a toxic room.
    expect(tradeChance({ ...base, status: 'star' })).toBeGreaterThan(0.2);
  });
});

describe('superstar-only exemptions', () => {
  it('never offers "practice fight" or "benched in the fourth" to an MVP-level player', () => {
    const profile = (p: Position, arch: PlayerProfile['archetype']): PlayerProfile => ({
      name: 'T',
      position: p,
      archetype: arch,
      market: 'large',
      jerseyNumber: 3,
      country: 'USA',
      handedness: 'right',
    });
    let superstarSeasons = 0;
    let flagged = 0;
    for (let i = 0; i < 140; i += 1) {
      const s = autoPlay(
        `v414-ss-${i}`,
        profile((['PG', 'SG', 'SF', 'PF', 'C'] as const)[i % 5]!, 'three_level_wing'),
      );
      for (const season of s.seasons) {
        // A player who already has an MVP or first-team All-NBA is unambiguously "the guy".
        const priorSeasons = s.seasons.filter((x) => x.index < season.index);
        const wasElite = priorSeasons.some(
          (x) => x.awards.includes('mvp') || x.awards.includes('all_nba_1'),
        );
        if (!wasElite) continue;
        superstarSeasons += 1;
        if (season.midseasonId === 'msx_star_fight' || season.midseasonId === 'msx_benched_4th') {
          flagged += 1;
        }
      }
    }
    expect(superstarSeasons).toBeGreaterThan(10);
    expect(flagged).toBe(0);
  });
});

describe('maxed attributes drop off option cards', () => {
  it('a scenario option never shows a rating chip for a stat already at 99', () => {
    const profile: PlayerProfile = {
      name: 'T',
      position: 'SF',
      archetype: 'three_level_wing',
      market: 'mid',
      jerseyNumber: 9,
      country: 'USA',
      handedness: 'right',
    };
    const choices: Array<{ nodeId: string; choiceId: string }> = [];
    let checked = 0;
    for (let step = 0; step < 400; step += 1) {
      const res = runCareer({ seed: 'v414-max', profile, choices });
      if (res.status === 'complete') break;
      const p = res.pending;
      if (p.kind === 'season' && p.season!.decision.kind === 'scenario') {
        for (const o of p.season!.decision.options) {
          for (const chip of o.effects) {
            // No "+0" rating chips at all - a capped stat is simply absent.
            if (chip.key !== 'money' && chip.key !== 'hype' && chip.key !== 'draftStock') {
              expect(chip.delta === 0).toBe(false);
              checked += 1;
            }
          }
        }
      }
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
    expect(checked).toBeGreaterThan(0);
  });
});
