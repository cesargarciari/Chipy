import { PERKS, getPerk } from '../data/perks.js';
import { roundTo } from '../rng.js';
import {
  RATING_LABELS,
  type AwardAffinity,
  type CareerState,
  type GameOption,
  type PerkCategory,
  type PerkDef,
  type PerkKind,
  type RatingKey,
} from '../types.js';
import type { SeasonEffect } from './effects.js';

export interface AggregatePerkEffect {
  growthBias: Partial<Record<RatingKey, number>>;
  durabilityPerYear: number;
  injuryResist: number;
  impactMult: number;
  awardMult: AwardAffinity;
  hypePerYear: number;
  slumpResist: number;
  valueMult: number;
}

/**
 * Everything the player's owned + active-yearly perks add up to, for one season.
 * Perks are an edge, not a cheat code, so the totals are aggressively capped —
 * stacking the whole shop gets you a fraction more than buying two smart ones.
 */
export function aggregatePerkEffect(state: CareerState): AggregatePerkEffect {
  let impactBonus = 0;
  let awardBonus = 0;
  const agg: AggregatePerkEffect = {
    growthBias: {},
    durabilityPerYear: 0,
    injuryResist: 0,
    impactMult: 1,
    awardMult: { scoring: 1, playmaking: 1, defense: 1, rebounding: 1 },
    hypePerYear: 0,
    slumpResist: 0,
    valueMult: 1,
  };

  for (const id of [...state.ownedPerks, ...state.yearlyPerks]) {
    const e = getPerk(id).effect;
    for (const [k, v] of Object.entries(e.growthBias ?? {})) {
      agg.growthBias[k as RatingKey] = (agg.growthBias[k as RatingKey] ?? 0) + (v ?? 0);
    }
    agg.durabilityPerYear += e.durabilityPerYear ?? 0;
    agg.injuryResist = 1 - (1 - agg.injuryResist) * (1 - (e.injuryResist ?? 0));
    impactBonus += (e.impactMult ?? 1) - 1;
    for (const key of ['scoring', 'playmaking', 'defense', 'rebounding'] as const) {
      awardBonus = Math.max(awardBonus, (e.awardMult?.[key] ?? 1) - 1);
    }
    agg.hypePerYear += e.hypePerYear ?? 0;
    agg.slumpResist = 1 - (1 - agg.slumpResist) * (1 - (e.slumpResist ?? 0));
    agg.valueMult *= e.valueMult ?? 1;
  }

  // Per-rating growth nudge from perks tops out well below the ±1.6 decision cap.
  for (const k of Object.keys(agg.growthBias) as RatingKey[]) {
    agg.growthBias[k] = Math.min(agg.growthBias[k] ?? 0, 0.35);
  }
  agg.durabilityPerYear = Math.min(agg.durabilityPerYear, 2.2);
  agg.injuryResist = Math.min(agg.injuryResist, 0.6);
  agg.slumpResist = Math.min(agg.slumpResist, 0.6);
  agg.impactMult = 1 + Math.min(impactBonus, 0.03);
  const am = 1 + Math.min(awardBonus, 0.03);
  agg.awardMult = { scoring: am, playmaking: am, defense: am, rebounding: am };
  agg.hypePerYear = Math.min(agg.hypePerYear, 4);
  agg.valueMult = Math.min(agg.valueMult, 1.25);
  return agg;
}

/**
 * Pay this year's fee for each active yearly perk from the bank. Perks that can't
 * be covered lapse (and reappear in the shop). Mutates `state`.
 */
export function renewYearlyPerks(state: CareerState): { lapsed: string[] } {
  const lapsed: string[] = [];
  const kept: string[] = [];
  for (const id of state.yearlyPerks) {
    const cost = getPerk(id).cost;
    if (state.bank >= cost) {
      state.bank = roundTo(state.bank - cost, 1);
      kept.push(id);
    } else {
      lapsed.push(id);
    }
  }
  state.yearlyPerks = kept;
  return { lapsed };
}

const CATEGORY_TAG: Record<PerkCategory, string> = {
  training: 'Training',
  body: 'Body',
  brand: 'Brand',
  analytics: 'Analytics',
  facility: 'Facility',
};

/** The `GameOption` a perk purchase records — one shape, reused by shop + apply. */
function perkBuyOption(p: PerkDef): GameOption {
  return {
    id: `buy_${p.id}`,
    label: p.name,
    blurb: `${p.kind === 'yearly' ? `$${p.cost}M / year` : `$${p.cost}M · permanent`} — ${p.blurb}`,
    effect: { money: -p.cost },
    stance: { tag: CATEGORY_TAG[p.category] },
    watermark: '$',
  };
}

/** Perks the player can buy right now (not owned, season unlocked, affordable). */
export function perkShopOptions(state: CareerState, seasonNumber: number): GameOption[] {
  const owned = new Set([...state.ownedPerks, ...state.yearlyPerks]);
  return PERKS.filter(
    (p) =>
      !owned.has(p.id) &&
      (p.minSeason === undefined || seasonNumber >= p.minSeason) &&
      state.bank >= p.cost,
  ).map(perkBuyOption);
}

/** Stat tiles a perk feeds — its growth-bias keys plus durability. */
export function perkHighlightKeys(p: PerkDef): string[] {
  const keys = Object.keys(p.effect.growthBias ?? {});
  if (p.effect.durabilityPerYear || p.effect.injuryResist) keys.push('durability');
  return keys;
}

/** Short human descriptors of what a perk does — the shop card's chips. */
export function perkEffectTags(p: PerkDef): string[] {
  const e = p.effect;
  const tags: string[] = [];
  for (const k of Object.keys(e.growthBias ?? {})) {
    tags.push(`+${RATING_LABELS[k as RatingKey] ?? k} growth`);
  }
  if ((e.durabilityPerYear ?? 0) > 0) tags.push('+ durability');
  if ((e.injuryResist ?? 0) > 0) tags.push('injury shield');
  if ((e.impactMult ?? 1) > 1) tags.push('+ on-court impact');
  if (e.awardMult && Object.values(e.awardMult).some((v) => (v ?? 1) > 1))
    tags.push('+ award odds');
  if ((e.hypePerYear ?? 0) > 0) tags.push('+ fame');
  if ((e.slumpResist ?? 0) > 0) tags.push('slump shield');
  if ((e.valueMult ?? 1) > 1) tags.push('+ market value');
  return tags;
}

/** One row in the perk shop — owned, affordable, or priced out (still shown). */
export interface PerkShopItem {
  /** `buy_<perkId>` — the choice recorded against `perks{n}`. */
  choiceId: string;
  perkId: string;
  name: string;
  blurb: string;
  category: PerkCategory;
  kind: PerkKind;
  /** Positive $M — the client shows this in green, never as `-$2M`. */
  cost: number;
  owned: boolean;
  /** `false` when priced out — the client greys the card and blocks the click. */
  affordable: boolean;
  /** Rating / `durability` tiles this perk feeds, for the strip hover. */
  highlight: string[];
  /** Short descriptors — `+3PT growth`, `injury shield` — for the card's chips. */
  tags: string[];
}

/** The whole shop for one offseason: the bank plus every visible perk. */
export interface PerkShop {
  /** `perks{n}` — the nodeId to record a `buy_<id>` purchase against. */
  nodeId: string;
  /** Spendable cash this offseason, in $M. */
  bank: number;
  /** Actionable perks first (affordable), then priced-out, then owned. */
  items: PerkShopItem[];
}

/**
 * Build the shop the client renders: every not-owned perk whose `minSeason` has
 * arrived (affordable or not) plus the ones already owned. Priced-out and owned
 * rows are kept so the shop is a stable list, not one that shrinks as you buy.
 */
export function buildPerkShop(state: CareerState, seasonNumber: number): PerkShop {
  const owned = new Set([...state.ownedPerks, ...state.yearlyPerks]);
  const items: PerkShopItem[] = PERKS.filter(
    (p) => owned.has(p.id) || p.minSeason === undefined || seasonNumber >= p.minSeason,
  ).map((p) => {
    const isOwned = owned.has(p.id);
    return {
      choiceId: `buy_${p.id}`,
      perkId: p.id,
      name: p.name,
      blurb: p.blurb,
      category: p.category,
      kind: p.kind,
      cost: p.cost,
      owned: isOwned,
      affordable: !isOwned && state.bank >= p.cost,
      highlight: perkHighlightKeys(p),
      tags: perkEffectTags(p),
    };
  });
  const rank = (i: PerkShopItem) => (i.owned ? 2 : i.affordable ? 0 : 1);
  items.sort((a, b) => rank(a) - rank(b) || a.cost - b.cost);
  return { nodeId: `perks${seasonNumber}`, bank: roundTo(state.bank, 1), items };
}

export function perkBuyId(choiceId: string): string | null {
  return choiceId.startsWith('buy_') ? choiceId.slice(4) : null;
}

/**
 * Fold the always-on perk bonuses into a one-season `SeasonEffect`. The
 * `growthBias` is applied separately (through the capped growth-bias channel),
 * not here.
 */
export function perkToSeasonEffect(agg: AggregatePerkEffect): SeasonEffect {
  return {
    durability: agg.durabilityPerYear,
    hype: agg.hypePerYear,
    impactMult: agg.impactMult,
    awardMult: agg.awardMult,
  };
}
