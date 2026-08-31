import { describe, expect, it } from 'vitest';
import {
  FINALS_SCENARIOS,
  buildFinalsGame,
  finalsCorrectCount,
  mulberry32,
  resolveFinals,
  runCareer,
  type PlayerProfile,
} from '../src/index.js';
import { autoPlay } from './helpers.js';

const star = (over: Partial<PlayerProfile> = {}): PlayerProfile => ({
  name: 'F',
  position: 'SF',
  archetype: 'point_forward',
  market: 'large',
  jerseyNumber: 7,
  country: 'USA',
  handedness: 'right',
  ...over,
});

/** id -> soundness across every scenario (ids are globally unique). */
const SOUNDNESS = new Map<string, number>(
  FINALS_SCENARIOS.flatMap((s) => s.plays.map((p) => [p.id, p.soundness] as const)),
);

type Pending = Extract<ReturnType<typeof runCareer>, { status: 'awaiting_choice' }>['pending'];

function pick(p: Pending): string {
  switch (p.kind) {
    case 'prologue':
      return p.prologue!.options[0]!.id;
    case 'college_pick':
      return p.collegePick!.schools[0]!.id;
    case 'college_year':
      return (
        p.collegeYear!.options.find((o) => o.id.startsWith('cy_declare')) ??
        p.collegeYear!.options[0]!
      ).id;
    case 'landing':
      return p.landing!.offers[0]!.id;
    case 'midseason':
      return p.midseason!.decision.options[0]!.id;
    case 'chemistry':
      return p.chemistry!.decision.options[1]!.id;
    case 'overseas_offer':
      return p.overseasOffer!.options[0]!.id;
    case 'farewell':
      return 'quiet_goodbye';
    case 'finals':
      return p.finals!.game.options[0]!.id;
    default: {
      const opts = p.season!.decision.options;
      return (opts.find((o) => o.id !== 'retire' && o.id !== 'demand_trade') ?? opts[0]!).id;
    }
  }
}

/**
 * Walk a career; at the first Finals, take the play with the wanted soundness
 * (0 = always wins, 2 = always loses). Returns the season that Finals decided.
 */
function playToFirstFinals(seed: string, wantSoundness: number) {
  const choices: Array<{ nodeId: string; choiceId: string }> = [];
  let finalsSeasonIndex = -1;
  for (let step = 0; step < 600; step += 1) {
    const res = runCareer({ seed, profile: star(), choices });
    if (res.status === 'complete') {
      return {
        summary: res.summary,
        finalsSeasonIndex,
        finalsSeason: res.summary.seasons.find((s) => s.index === finalsSeasonIndex) ?? null,
      };
    }
    const p = res.pending;
    let choiceId: string;
    if (p.kind === 'finals' && finalsSeasonIndex === -1) {
      const opt = p.finals!.game.options.find((o) => SOUNDNESS.get(o.id) === wantSoundness);
      choiceId = (opt ?? p.finals!.game.options[0]!).id;
      finalsSeasonIndex = Number(p.nodeId.replace('finals', ''));
    } else {
      choiceId = pick(p);
    }
    choices.push({ nodeId: p.nodeId, choiceId });
  }
  throw new Error('career did not finish');
}

describe('finals mini-game: the pure resolution', () => {
  it('a real favourite has two winning plays, an underdog run has one', () => {
    expect(finalsCorrectCount(0.66)).toBe(2);
    expect(finalsCorrectCount(0.85)).toBe(2);
    expect(finalsCorrectCount(0.65)).toBe(1);
    expect(finalsCorrectCount(0)).toBe(1);

    for (const scenario of FINALS_SCENARIOS) {
      const winsFav = scenario.plays.filter((p) => resolveFinals(scenario.id, p.id, 0.8).won);
      const winsDog = scenario.plays.filter((p) => resolveFinals(scenario.id, p.id, 0.2).won);
      expect(winsFav.map((p) => p.soundness).sort()).toEqual([0, 1]);
      expect(winsDog.map((p) => p.soundness)).toEqual([0]);
    }
  });

  it('the outcome text is the chosen play’s own good / bad line', () => {
    for (const scenario of FINALS_SCENARIOS) {
      for (const play of scenario.plays) {
        const win = resolveFinals(scenario.id, play.id, 0.9);
        const loss = resolveFinals(scenario.id, play.id, 0.1);
        if (play.soundness === 0) {
          expect(win.won).toBe(true);
          expect(win.outcome).toBe(play.good);
        }
        if (play.soundness === 2) {
          expect(loss.won).toBe(false);
          expect(loss.outcome).toBe(play.bad);
        }
      }
    }
  });

  it('builds three real options and shuffles them deterministically', () => {
    const a = buildFinalsGame(mulberry32(1234));
    const b = buildFinalsGame(mulberry32(1234));
    expect(a).toEqual(b); // same derived stream -> same scenario + order
    expect(a.options).toHaveLength(3);
    const scenario = FINALS_SCENARIOS.find((s) => s.id === a.scenarioId)!;
    expect(a.options.map((o) => o.id).sort()).toEqual(scenario.plays.map((p) => p.id).sort());
  });
});

describe('finals mini-game: inside a career', () => {
  it('reaches the Finals node for star careers, and it replays byte-identically', () => {
    let sawFinals = 0;
    for (let i = 0; i < 40; i += 1) {
      const seed = `v419-reach-${i}`;
      const choices: Array<{ nodeId: string; choiceId: string }> = [];
      let hitFinals = false;
      for (let step = 0; step < 600; step += 1) {
        const res = runCareer({ seed, profile: star(), choices });
        if (res.status === 'complete') break;
        if (res.pending.kind === 'finals') hitFinals = true;
        choices.push({ nodeId: res.pending.nodeId, choiceId: pick(res.pending) });
      }
      if (hitFinals) {
        sawFinals += 1;
        const a = runCareer({ seed, profile: star(), choices });
        const b = runCareer({ seed, profile: star(), choices });
        expect(a).toEqual(b);
      }
    }
    expect(sawFinals).toBeGreaterThan(0);
  });

  it('the soundest play wins the title; hero ball loses in the Finals', () => {
    let wins = 0;
    let losses = 0;
    for (let i = 0; i < 30 && (wins < 3 || losses < 3); i += 1) {
      const seed = `v419-decide-${i}`;
      const won = playToFirstFinals(seed, 0);
      if (won.finalsSeason) {
        wins += 1;
        expect(won.finalsSeason.teamResult).toBe('champion');
        expect(won.finalsSeason.finalsHeadline).toMatch(/^NBA Finals: /);
      }
      const lost = playToFirstFinals(seed, 2);
      if (lost.finalsSeason) {
        losses += 1;
        expect(lost.finalsSeason.teamResult).toBe('finals');
        expect(lost.finalsSeason.finalsHeadline).toMatch(/falls short/);
      }
    }
    expect(wins).toBeGreaterThan(0);
    expect(losses).toBeGreaterThan(0);
  });

  it('non-Finals seasons carry a null finalsHeadline', () => {
    let checked = 0;
    for (let i = 0; i < 20; i += 1) {
      const s = autoPlay(`v419-null-${i}`, star());
      for (const season of s.seasons) {
        if (season.teamResult !== 'champion' && season.teamResult !== 'finals') {
          expect(season.finalsHeadline).toBeNull();
          checked += 1;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('award coherence (v4.19)', () => {
  it('an MVP season is always All-NBA First Team; a DPOY season is always All-Defense First Team', () => {
    let mvpSeasons = 0;
    let dpoySeasons = 0;
    const scan = (seed: string, p: PlayerProfile) => {
      for (const season of autoPlay(seed, p).seasons) {
        if (season.awards.includes('mvp')) {
          mvpSeasons += 1;
          expect(season.awards).toContain('all_nba_1');
          expect(season.awards).not.toContain('all_nba_2');
          expect(season.awards).not.toContain('all_nba_3');
        }
        if (season.awards.includes('dpoy')) {
          dpoySeasons += 1;
          expect(season.awards).toContain('all_defense_1');
          expect(season.awards).not.toContain('all_defense_2');
        }
      }
    };
    for (let i = 0; i < 90; i += 1) scan(`v419-mvp-${i}`, star());
    for (let i = 0; i < 90; i += 1) {
      scan(`v419-dpoy-${i}`, star({ position: 'C', archetype: 'rim_protector' }));
    }
    expect(mvpSeasons).toBeGreaterThan(0);
    expect(dpoySeasons).toBeGreaterThan(0);
  });

  it('a superstar-tier All-Star lands on one of the top two All-NBA teams', () => {
    // Not every All-Star year (a fringe pick can miss the teams) - but across a
    // long star career, All-NBA Third Team should be the exception, not the norm.
    let topTwo = 0;
    let third = 0;
    for (let i = 0; i < 60; i += 1) {
      for (const season of autoPlay(`v419-elite-${i}`, star()).seasons) {
        if (season.awards.includes('all_nba_1') || season.awards.includes('all_nba_2')) topTwo += 1;
        if (season.awards.includes('all_nba_3')) third += 1;
      }
    }
    expect(topTwo).toBeGreaterThan(third);
  });
});
