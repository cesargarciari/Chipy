import { describe, expect, it } from 'vitest';
import { EURO_CLUBS, runCareer, type PlayerProfile } from '../src/index.js';

const EURO_IDS = new Set(EURO_CLUBS.map((c) => c.id));

const profile = (over: Partial<PlayerProfile> = {}): PlayerProfile => ({
  name: 'E',
  position: 'SF',
  archetype: 'three_level_wing',
  market: 'mid',
  jerseyNumber: 7,
  country: 'USA',
  handedness: 'right',
  ...over,
});

/** Walk a career, calling `onPending` for every node, resolving with `choose`. */
function walk(
  seed: string,
  p: PlayerProfile,
  choose: (
    pending: Extract<ReturnType<typeof runCareer>, { status: 'awaiting_choice' }>['pending'],
  ) => string,
) {
  const choices: Array<{ nodeId: string; choiceId: string }> = [];
  for (let step = 0; step < 600; step += 1) {
    const res = runCareer({ seed, profile: p, choices });
    if (res.status === 'complete') return res.summary;
    choices.push({ nodeId: res.pending.nodeId, choiceId: choose(res.pending) });
  }
  throw new Error('career did not finish');
}

const firstNonRetire = (opts: { id: string }[]) =>
  (opts.find((o) => o.id !== 'retire' && o.id !== 'demand_trade') ?? opts[0]!).id;

describe('overseas: return to the NBA offers a choice of two teams', () => {
  it(
    'a EuroLeague contract-year node with a viable return shows exactly two NBA-return options',
    { timeout: 30_000 },
    () => {
      let sawReturnNode = 0;
      let allHadTwo = true;
      for (let i = 0; i < 200; i += 1) {
        walk(
          `v416-return-${i}`,
          profile({ position: (['PG', 'SG', 'SF', 'PF', 'C'] as const)[i % 5]! }),
          (p) => {
            if (p.kind === 'overseas_offer') {
              const returns = p.overseasOffer!.options.filter((o) => o.id.startsWith('nba_return'));
              if (p.overseasOffer!.reason === 'contract_up' && returns.length > 0) {
                sawReturnNode += 1;
                if (returns.length !== 2) allHadTwo = false;
                // Each carries a real NBA team id.
                for (const r of returns)
                  expect(r.teamId && /^[A-Z]{3}$/.test(r.teamId)).toBeTruthy();
                return returns[0]!.id; // take a return offer
              }
              return firstNonRetire(p.overseasOffer!.options);
            }
            if (p.kind === 'prologue') return p.prologue!.options[0]!.id;
            if (p.kind === 'college_pick') return p.collegePick!.schools[0]!.id;
            if (p.kind === 'college_year')
              return (
                p.collegeYear!.options.find((o) => o.id.startsWith('cy_declare')) ??
                p.collegeYear!.options[0]!
              ).id;
            if (p.kind === 'landing') return p.landing!.offers[0]!.id;
            if (p.kind === 'midseason') return p.midseason!.decision.options[0]!.id;
            if (p.kind === 'chemistry') return p.chemistry!.decision.options[1]!.id;
            if (p.kind === 'farewell') return 'quiet_goodbye';
            return firstNonRetire(p.season!.decision.options);
          },
        );
      }
      expect(sawReturnNode).toBeGreaterThan(3);
      expect(allHadTwo).toBe(true);
    },
  );
});

describe('farewell tour is a scripted lap', () => {
  it(
    'the season after choosing the tour never offers free agency, retire, or a trade demand',
    { timeout: 30_000 },
    () => {
      let toursChecked = 0;
      let violations = 0;
      for (let i = 0; i < 160; i += 1) {
        let choseTour = false;
        walk(
          `v416-farewell-${i}`,
          profile({ position: (['PG', 'SG', 'SF', 'PF', 'C'] as const)[i % 5]! }),
          (p) => {
            if (p.kind === 'farewell') {
              choseTour = true;
              return 'farewell_tour';
            }
            if (p.kind === 'season' && choseTour) {
              toursChecked += 1;
              if (p.season!.decision.kind === 'free_agency') violations += 1;
              if (
                p.season!.decision.options.some((o) => o.id === 'retire' || o.id === 'demand_trade')
              ) {
                violations += 1;
              }
            }
            if (p.kind === 'prologue') return p.prologue!.options[0]!.id;
            if (p.kind === 'college_pick') return p.collegePick!.schools[0]!.id;
            if (p.kind === 'college_year')
              return (
                p.collegeYear!.options.find((o) => o.id.startsWith('cy_declare')) ??
                p.collegeYear!.options[0]!
              ).id;
            if (p.kind === 'landing') return p.landing!.offers[0]!.id;
            if (p.kind === 'midseason') return p.midseason!.decision.options[0]!.id;
            if (p.kind === 'chemistry') return p.chemistry!.decision.options[1]!.id;
            if (p.kind === 'overseas_offer') return firstNonRetire(p.overseasOffer!.options);
            return firstNonRetire(p.season!.decision.options);
          },
        );
      }
      expect(toursChecked).toBeGreaterThan(10);
      expect(violations).toBe(0);
    },
  );
});

describe('overseas clubs build idolatry', () => {
  it(
    'a EuroLeague career leaves a franchise standing for its clubs, no NBA team while overseas',
    { timeout: 30_000 },
    () => {
      let sawEuroStanding = false;
      for (let i = 0; i < 200 && !sawEuroStanding; i += 1) {
        const s = walk(
          `v416-idol-${i}`,
          profile({ position: (['PG', 'SG', 'SF', 'PF', 'C'] as const)[i % 5]! }),
          (p) => {
            if (p.kind === 'overseas_offer') {
              // Stay overseas: re-sign or move, never take the NBA return.
              const stay = p.overseasOffer!.options.find(
                (o) => !o.id.startsWith('nba_return') && o.id !== 'retire',
              );
              return (stay ?? p.overseasOffer!.options[0]!).id;
            }
            if (p.kind === 'prologue') return p.prologue!.options[0]!.id;
            if (p.kind === 'college_pick') return p.collegePick!.schools[0]!.id;
            if (p.kind === 'college_year')
              return (
                p.collegeYear!.options.find((o) => o.id.startsWith('cy_declare')) ??
                p.collegeYear!.options[0]!
              ).id;
            if (p.kind === 'landing') return p.landing!.offers[0]!.id;
            if (p.kind === 'midseason') return p.midseason!.decision.options[0]!.id;
            if (p.kind === 'chemistry') return p.chemistry!.decision.options[1]!.id;
            if (p.kind === 'farewell') return 'farewell_tour';
            return firstNonRetire(p.season!.decision.options);
          },
        );

        if (s.overseasSeasons.length >= 2) {
          const euro = s.franchises.filter((f) => EURO_IDS.has(f.teamId));
          if (euro.length > 0) {
            sawEuroStanding = true;
            // The club actually accrued seasons + a real tier.
            expect(euro.some((f) => f.seasons >= 2 && f.tier !== 'none')).toBe(true);
          }
        }
        // An overseas season never coincides with an NBA-team assignment: the
        // per-season NBA records and the overseas records are disjoint by index.
        const nbaIdx = new Set(s.seasons.map((x) => x.index));
        for (const o of s.overseasSeasons) expect(nbaIdx.has(o.index)).toBe(false);
      }
      expect(sawEuroStanding).toBe(true);
    },
  );
});
