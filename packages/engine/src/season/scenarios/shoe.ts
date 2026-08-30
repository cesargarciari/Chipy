import type { Scenario } from '../scenario-types.js';

/**
 * Fires once, the first offseason after fame hits 80. Each brand is a different
 * mix of up-front money, hype, and a lingering market-value tail. `simulate.ts`
 * reads the chosen option id back through `SHOE_BRANDS` to set `state.shoeDeal`.
 */
export const shoeScenarios: Scenario[] = [
  {
    id: 'scn_shoe_deal',
    theme: 'money',
    gate: { once: true, weight: 6, predicate: (ctx) => ctx.hype >= 80 },
    title: 'A SHOE DEAL IS ON THE TABLE',
    prompt: 'Four offers, four very different pitches. Whose logo goes on your chest?',
    options: [
      {
        id: 'shoe_apex',
        label: 'APEX - THE GIANT',
        blurb: 'Global distribution, a marketing budget the size of a small country.',
        effect: { money: 25, hype: 6 },
        stance: { tag: 'Blue chip' },
      },
      {
        id: 'shoe_stride',
        label: 'STRIDE - PERFORMANCE',
        blurb: 'Hoopers’ brand. They build the shoe around your foot.',
        effect: { money: 14, hype: 3 },
        stance: {
          tag: 'Performance',
          growthBias: { finishing: 0.5, threePoint: 0.4 },
          growthBiasSeasons: 4,
        },
      },
      {
        id: 'shoe_volt',
        label: 'VOLT - THE CHALLENGER',
        blurb: 'Smaller check, but you’re the face - and there’s equity in it.',
        effect: { money: 8, hype: 5 },
        stance: { tag: 'Upside', valueMult: 1.12, valueMultSeasons: 5 },
      },
      {
        id: 'shoe_own_label',
        label: 'YOUR OWN LABEL',
        blurb: 'Fund it yourself. All the risk, all the upside, all yours.',
        effect: { money: 4, hype: 8 },
        stance: { tag: 'Founder', valueMult: 1.2, valueMultSeasons: 6 },
      },
    ],
  },
];

export const SHOE_BRANDS: Record<string, string> = {
  shoe_apex: 'Apex',
  shoe_stride: 'Stride',
  shoe_volt: 'Volt',
  shoe_own_label: 'your own label',
};
