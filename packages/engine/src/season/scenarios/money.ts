import type { Scenario } from '../scenario-types.js';

export const moneyScenarios: Scenario[] = [
  {
    id: 'money_endorsements',
    theme: 'money',
    gate: { minAge: 23, once: true },
    title: 'THE ENDORSEMENT PUSH',
    prompt: 'The offers are piling up on your agent’s desk.',
    options: [
      {
        id: 'endorse_all',
        label: 'CHASE EVERY DEAL',
        blurb: 'If they are paying, you are posing.',
        effect: { money: 6 },
        stance: { impactMult: 0.98 },
      },
      {
        id: 'endorse_flagship',
        label: 'ONE FLAGSHIP PARTNER',
        blurb: 'Say no to twelve, yes to one.',
        effect: { money: 3 },
      },
      {
        id: 'endorse_invest',
        label: 'INVEST IT QUIETLY',
        blurb: 'No billboards. Just index funds.',
        effect: { ratings: { basketballIQ: 3 }, durability: 3 },
      },
    ],
  },
  {
    id: 'money_business',
    theme: 'money',
    gate: { minAge: 27, once: true },
    title: 'BUILD SOMETHING OFF THE COURT',
    prompt: 'You want a second act ready before the first one ends.',
    options: [
      {
        id: 'biz_tech',
        label: 'TECH INVESTING',
        blurb: 'A fund, a few founders, a lot of reading.',
        effect: { ratings: { basketballIQ: 4 }, money: 3 },
      },
      {
        id: 'biz_hospitality',
        label: 'A RESTAURANT GROUP',
        blurb: 'Your name on the door in three cities.',
        effect: { money: 4 },
        stance: { teamMult: 0.99 },
      },
      {
        id: 'biz_simple',
        label: 'KEEP IT SIMPLE',
        blurb: 'The job is basketball. Everything else waits.',
        effect: { durability: 3, ratings: { finishing: 2 } },
      },
    ],
  },
  {
    id: 'money_leverage',
    theme: 'money',
    gate: { minSeason: 4, role: ['franchise'], once: true },
    title: 'LEVERAGE',
    prompt: 'You are extension-eligible and the front office is nervous.',
    options: [
      {
        id: 'lev_holdout',
        label: 'HOLD OUT FOR THE MAX',
        blurb: 'Every dollar. On principle.',
        effect: {},
        stance: { teamMult: 0.97, impactMult: 1.02, valueMult: 1.06, valueMultSeasons: 3 },
      },
      {
        id: 'lev_play_out',
        label: 'PLAY IT OUT',
        blurb: 'Bet on yourself. Free agency next summer.',
        effect: { ratings: { finishing: 3 }, durability: 2 },
      },
      {
        id: 'lev_extend',
        label: 'EXTEND EARLY',
        blurb: 'Take a hometown discount, keep the peace.',
        effect: { ratings: { basketballIQ: 3 } },
        stance: { teamMult: 1.03 },
      },
    ],
  },
];
