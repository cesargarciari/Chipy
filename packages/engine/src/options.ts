import { clamp, roundTo } from './rng.js';
import { defenseRatingOf } from './ratings.js';
import {
  ATTR_LABELS,
  ATTR_TAGS,
  RATING_CEIL,
  RATING_FLOOR,
  RATING_KEYS,
  type CareerState,
  type EffectChip,
  type GameOption,
  type OptionEffect,
  type OptionView,
  type RatingKey,
  type Ratings,
} from './types.js';

const META_KEYS = ['athleticism', 'durability', 'hype', 'draftStock'] as const;

/** Ratings boosts are scaled down so players improve slowly. Basketball IQ is scaled down even more. Rare breakthroughs skip this. */
const RATING_SCALE = 0.85;
const IQ_SCALE = 0.26;

function scaleRatingDelta(key: RatingKey, nominal: number): number {
  const s = key === 'basketballIQ' ? IQ_SCALE : RATING_SCALE;
  return Math.round(nominal * s);
}

/** The rating changes an option actually gives after scaling. */
export function effectiveRatings(option: GameOption): Partial<Ratings> {
  const src = option.effect.ratings;
  if (!src) return {};
  if (option.rare) return { ...src };
  const out: Partial<Ratings> = {};
  for (const key of RATING_KEYS) {
    const nominal = src[key];
    if (nominal) out[key] = scaleRatingDelta(key, nominal);
  }
  return out;
}

/** Turns an effect into chips: money first, then ratings, then the rest. With current ratings, chips show only what fits under the 99 cap. */
export function describeEffects(effect: OptionEffect, current?: Ratings): EffectChip[] {
  const chips: EffectChip[] = [];

  // Money always goes first.
  if (effect.money) {
    chips.push({ key: 'money', label: 'MONEY', short: '$', delta: effect.money });
  }

  const ratingChips: EffectChip[] = [];
  for (const key of RATING_KEYS) {
    if (key === 'perimeterDefense' || key === 'interiorDefense') continue; // folded below
    const nominal = effect.ratings?.[key];
    if (!nominal) continue;
    let delta = nominal;
    if (current) {
      const room = nominal > 0 ? 99 - current[key] : 25 - current[key];
      delta =
        nominal > 0 ? Math.max(0, Math.min(nominal, room)) : Math.min(0, Math.max(nominal, room));
    }
    // Skip stats already at the cap.
    if (current && delta === 0) continue;
    ratingChips.push({
      key,
      label: ATTR_LABELS[key]!,
      short: ATTR_TAGS[key]!,
      delta,
      ...(delta !== nominal ? { nominal } : {}),
    });
  }

  // Both defense ratings show as one DEFENSE chip using their average.
  const perimNom = effect.ratings?.perimeterDefense ?? 0;
  const intNom = effect.ratings?.interiorDefense ?? 0;
  if (perimNom || intNom) {
    const blend = (i: number, p: number) => 0.66 * Math.max(i, p) + 0.34 * Math.min(i, p);
    let delta: number;
    let uncapped: number;
    if (current) {
      const before = defenseRatingOf(current.interiorDefense, current.perimeterDefense);
      const cappedInt = clamp(current.interiorDefense + intNom, RATING_FLOOR, RATING_CEIL);
      const cappedPerim = clamp(current.perimeterDefense + perimNom, RATING_FLOOR, RATING_CEIL);
      delta = defenseRatingOf(cappedInt, cappedPerim) - before;
      uncapped =
        Math.round(blend(current.interiorDefense + intNom, current.perimeterDefense + perimNom)) -
        before;
    } else {
      // Without current ratings, use the average of the two boosts.
      delta = uncapped = Math.round((intNom + perimNom) / 2);
    }
    if (!current || delta !== 0) {
      ratingChips.push({
        key: 'defense',
        label: 'DEFENSE',
        short: 'DEF',
        delta,
        ...(uncapped !== delta ? { nominal: uncapped } : {}),
      });
    }
  }
  ratingChips.sort(
    (a, b) =>
      Math.abs(b.delta) - Math.abs(a.delta) || Math.abs(b.nominal ?? 0) - Math.abs(a.nominal ?? 0),
  );
  chips.push(...ratingChips);

  for (const key of META_KEYS) {
    if (key === 'draftStock') continue; // internal, not shown
    const delta = effect[key];
    if (delta) {
      chips.push({ key, label: ATTR_LABELS[key]!, short: ATTR_TAGS[key]!, delta });
    }
  }
  return chips;
}

/** The option ready to send to the client. */
export function optionView(option: GameOption, current?: Ratings): OptionView {
  const effects = describeEffects({ ...option.effect, ratings: effectiveRatings(option) }, current);
  return {
    id: option.id,
    label: option.label,
    blurb: option.blurb,
    effects,
    tag: option.stance?.tag,
    watermark: option.watermark ?? effects[0]?.short ?? '···',
    ...(option.rare ? { rare: true } : {}),
  };
}

function addRatings(base: Ratings, deltas: Partial<Ratings> | undefined): Ratings {
  if (!deltas) return base;
  const next = { ...base };
  for (const key of RATING_KEYS) {
    next[key] = clamp(Math.round(next[key] + (deltas[key] ?? 0)), 25, 99);
  }
  return next;
}

/** Applies an option's effect and saves its growth boost. Returns a new state. */
export function applyOption(state: CareerState, option: GameOption): CareerState {
  const e = { ...option.effect, ratings: effectiveRatings(option) };
  const growthBiases = [...state.growthBiases];
  if (option.stance?.growthBias) {
    growthBiases.push({
      ratings: option.stance.growthBias,
      seasonsLeft: option.stance.growthBiasSeasons ?? 3,
    });
  }
  const valueMods = [...state.valueMods];
  if (option.stance?.valueMult && option.stance.valueMult !== 1) {
    valueMods.push({
      mult: option.stance.valueMult,
      seasonsLeft: option.stance.valueMultSeasons ?? 3,
    });
  }
  // Positive money counts as income, negative money is a purchase.
  const money = e.money ?? 0;
  return {
    ...state,
    ratings: addRatings(state.ratings, e.ratings),
    athleticism: clamp(state.athleticism + (e.athleticism ?? 0), 0, 100),
    durability: clamp(state.durability + (e.durability ?? 0), 0, 100),
    hype: clamp(state.hype + (e.hype ?? 0), 0, 100),
    draftStock: clamp(state.draftStock + (e.draftStock ?? 0), 0, 100),
    bank: roundTo(state.bank + money, 1),
    careerEarnings: roundTo(state.careerEarnings + Math.max(0, money), 1),
    growthBiases,
    valueMods,
  };
}
