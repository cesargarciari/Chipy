import { describe, expect, it } from 'vitest';
import {
  ARCHETYPE_IDS,
  INJURY_CATALOG,
  MIDSEASON_SCENARIOS,
  mulberry32,
  prologueViews,
  rollSeasonInjury,
  runCareer,
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

describe('games-played math', () => {
  it('every injury entry records exactly 82 − games played', () => {
    let checked = 0;
    for (let i = 0; i < 120; i += 1) {
      const s = autoPlay(`gm-${i}`, profileFor(i));
      for (const inj of s.injuryHistory) {
        const rec = s.seasons.find((x) => x.index === inj.seasonIndex);
        if (!rec) continue; // overseas season
        expect(inj.gamesMissed).toBe(82 - rec.stats.gp);
        expect(rec.injuredGames).toBe(82 - rec.stats.gp);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('injuries make sense', () => {
  it('only surgery-grade injuries carry a season-ending flag or an OVR hit', () => {
    for (const t of INJURY_CATALOG) {
      const nasty =
        t.type === 'torn ACL' ||
        t.type === 'torn Achilles' ||
        t.type === 'ruptured patellar tendon';
      if (nasty) {
        expect(t.seasonEnding).toBe(true);
        expect(t.games).toEqual([82, 82]);
        expect(t.ovrHit?.[0] ?? 0).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('a rolled ACL / Achilles is always out for the year and drops OVR ≥ 2', () => {
    const rng = mulberry32(42);
    let seen = 0;
    for (let i = 0; i < 6000 && seen < 40; i += 1) {
      const r = rollSeasonInjury(rng, { age: 31, durability: 45, injuryCount: 3, injuryResist: 0 });
      if (!r || r.severity !== 'severe') continue;
      seen += 1;
      expect(r.seasonEnding).toBe(true);
      expect(r.gamesMissed).toBe(82);
      expect(r.overallHit).toBeGreaterThanOrEqual(2);
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('a severe injury visibly drops the overall in the summary', () => {
    let sampled = 0;
    for (let i = 0; i < 300 && sampled < 8; i += 1) {
      const s = autoPlay(`ovr-${i}`, profileFor(i));
      for (const inj of s.injuryHistory.filter((x) => x.severity === 'severe')) {
        const cur = s.seasons.find((x) => x.index === inj.seasonIndex);
        const prev = s.seasons.find((x) => x.index === inj.seasonIndex - 1);
        if (!cur || !prev) continue;
        sampled += 1;
        expect(prev.overallAfter - cur.overallAfter).toBeGreaterThanOrEqual(2);
      }
    }
    expect(sampled).toBeGreaterThan(0);
  });
});

describe('recruiting + overseas clubs', () => {
  it('no longer offers G League Ignite', () => {
    const recruiting = prologueViews().find((n) => n.id === 'recruiting')!;
    const ids = recruiting.options.map((o) => o.id);
    expect(ids).not.toContain('g_league_ignite');
    expect(ids).toEqual(['blue_blood', 'mid_major_hub', 'overseas_pro']);
  });
});

describe('age normalization', () => {
  it('rookie age is 19 + (college years − 1)', () => {
    for (let i = 0; i < 120; i += 1) {
      const s = autoPlay(`age-${i}`, profileFor(i));
      const cy = s.college?.years.length ?? 1;
      expect(s.seasons[0]!.age).toBe(19 + Math.max(0, cy - 1));
    }
  });
});

describe('chemistry + midseason', () => {
  it('the preview exposes a chemistry value in range', () => {
    for (let step = 0; step < 60; step += 1) {
      const res = runCareer({
        seed: 'chem',
        profile: profileFor(0),
        choices: gather('chem', step),
      });
      if (res.status !== 'awaiting_choice') break;
      const preview =
        res.pending.season?.preview ??
        res.pending.midseason?.preview ??
        res.pending.overseasOffer?.preview;
      if (preview) {
        expect(preview.chemistry).toBeGreaterThanOrEqual(0);
        expect(preview.chemistry).toBeLessThanOrEqual(100);
      }
    }
  });

  it('the burner-account and birthday scenarios exist with real forks', () => {
    const ids = MIDSEASON_SCENARIOS.map((s) => s.id);
    expect(ids).toContain('msx_burner_account');
    expect(ids).toContain('msx_teammate_birthday');
  });
});

/** Walk `count` steps into a career always taking option 0, for preview probing. */
function gather(seed: string, count: number) {
  const choices: Array<{ nodeId: string; choiceId: string }> = [];
  for (let step = 0; step < count; step += 1) {
    const res = runCareer({ seed, profile: profileFor(0), choices });
    if (res.status !== 'awaiting_choice') break;
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
    else if (p.kind === 'overseas_offer') id = p.overseasOffer!.options[0]!.id;
    else if (p.kind === 'farewell') id = 'quiet_goodbye';
    else {
      const opts = p.season!.decision.options;
      id = (opts.find((o) => o.id !== 'retire' && o.id !== 'demand_trade') ?? opts[0]!).id;
    }
    choices.push({ nodeId: p.nodeId, choiceId: id });
  }
  return choices;
}

describe('quiet goodbye', () => {
  it('never grants an extra season', () => {
    for (let i = 0; i < 80; i += 1) {
      const seed = `qg-${i}`;
      const profile = profileFor(i);
      const choices: Array<{ nodeId: string; choiceId: string }> = [];
      let seasonsAtFarewell = -1;
      for (let step = 0; step < 400; step += 1) {
        const res = runCareer({ seed, profile, choices });
        if (res.status === 'complete') {
          if (seasonsAtFarewell >= 0) {
            expect(res.summary.seasons.length + res.summary.overseasSeasons.length).toBe(
              seasonsAtFarewell,
            );
          }
          break;
        }
        const p = res.pending;
        let id: string;
        if (p.kind === 'farewell') {
          seasonsAtFarewell = p.farewell!.preview.seasonNumber - 1;
          id = 'quiet_goodbye';
        } else if (p.kind === 'prologue') id = p.prologue!.options[0]!.id;
        else if (p.kind === 'college_pick') id = p.collegePick!.schools[0]!.id;
        else if (p.kind === 'college_year')
          id = (
            p.collegeYear!.options.find((o) => o.id.startsWith('cy_declare')) ??
            p.collegeYear!.options[0]!
          ).id;
        else if (p.kind === 'landing') id = p.landing!.offers[0]!.id;
        else if (p.kind === 'midseason') id = p.midseason!.decision.options[0]!.id;
        else if (p.kind === 'overseas_offer') id = p.overseasOffer!.options[0]!.id;
        else {
          const opts = p.season!.decision.options;
          id = (opts.find((o) => o.id !== 'retire' && o.id !== 'demand_trade') ?? opts[0]!).id;
        }
        choices.push({ nodeId: p.nodeId, choiceId: id });
      }
    }
  });
});
