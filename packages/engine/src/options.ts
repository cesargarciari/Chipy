import { clamp, roundTo } from './rng.js';
import {
  ATTR_LABELS,
  ATTR_TAGS,
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

/**
 * How much of an option's *written* rating bump actually lands. Deliberately
 * heavy so ratings climb slowly - a `+8` reads as `+4`, a `+3` as `+2`. Basketball
 * IQ is suppressed hard on top (it barely declines with age, so it used to
 * ratchet straight to 99). `rare` breakthrough options bypass this entirely.
 */
const RATING_SCALE = 0.85;
const IQ_SCALE = 0.26;

function scaleRatingDelta(key: RatingKey, nominal: number): number {
  const s = key === 'basketballIQ' ? IQ_SCALE : RATING_SCALE;
  return Math.round(nominal * s);
}

/** An option's rating effect after the global slowdown (unless it's a rare breakthrough). */
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

/**
 * Turn a flat effect into ordered chips: money first, then ratings (biggest
 * first), then meta. When `current` ratings are passed, each rating chip's
 * `delta` is trimmed to the room actually left under 99 (or above 25) so the
 * card promises exactly what the player will get - `nominal` keeps the original.
 */
export function describeEffects(effect: OptionEffect, current?: Ratings): EffectChip[] {
  const chips: EffectChip[] = [];

  // Money is the headline for endorsements and perk buys - always pinned first.
  if (effect.money) {
    chips.push({ key: 'money', label: 'MONEY', short: '$', delta: effect.money });
  }

  const ratingChips: EffectChip[] = [];
  for (const key of RATING_KEYS) {
    const nominal = effect.ratings?.[key];
    if (!nominal) continue;
    let delta = nominal;
    if (current) {
      const room = nominal > 0 ? 99 - current[key] : 25 - current[key];
      delta =
        nominal > 0 ? Math.max(0, Math.min(nominal, room)) : Math.min(0, Math.max(nominal, room));
    }
    // Keep a fully-capped chip (delta 0) so the player sees the stat is maxed.
    ratingChips.push({
      key,
      label: ATTR_LABELS[key]!,
      short: ATTR_TAGS[key]!,
      delta,
      ...(delta !== nominal ? { nominal } : {}),
    });
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

/** The serialisable, render-ready view of an option. */
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

/**
 * Apply an option's deterministic `effect` and register its lingering
 * `stance.growthBias`. Returns a new state; the input is not mutated. The
 * `stance` sim knobs (impactMult, roleBias, …) are read separately by the
 * season pipeline via `optionStanceEffect`.
 */
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
  // Positive money is income (banked and counted toward career earnings); negative
  // money is a purchase (bank only). The shop only offers affordable buys.
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
