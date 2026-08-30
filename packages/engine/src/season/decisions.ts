import type { ClubOffer, GameOption, OptionView, TeamOffer } from '../types.js';

/** Offered in the free-agency node once the player is retirement-eligible. */
export const RETIRE_OPTION: GameOption = {
  id: 'retire',
  label: 'RETIRE',
  blurb: 'Call a press conference and walk away on your own terms.',
  effect: {},
};

export const RETIRE_VIEW: OptionView = {
  id: RETIRE_OPTION.id,
  label: RETIRE_OPTION.label,
  blurb: RETIRE_OPTION.blurb,
  effects: [],
  watermark: 'END',
};

/**
 * The two ways to bow out, offered once age (not injury) has decided this is
 * the end. "Farewell tour" buys one last ceremonial season; "quiet goodbye"
 * ends it now.
 */
export const FAREWELL_TOUR_VIEW: OptionView = {
  id: 'farewell_tour',
  label: 'FAREWELL TOUR',
  blurb: 'One more season. Every arena, one last ovation, a rocking chair at every stop.',
  effects: [],
  tag: 'One more year',
  watermark: 'LAP',
};

export const QUIET_GOODBYE_VIEW: OptionView = {
  id: 'quiet_goodbye',
  label: 'QUIET GOODBYE',
  blurb: 'No tour, no speeches. You call it now and walk away on your own terms.',
  effects: [],
  tag: 'Retire now',
  watermark: 'END',
};

const money = (m: number): string => `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;

/** A team offer rendered as an option card. */
export function teamOfferView(offer: TeamOffer, resign: boolean): OptionView {
  return {
    id: offer.choiceId,
    label: `${offer.team.city.toUpperCase()} ${offer.team.name.toUpperCase()}`,
    blurb: `${resign ? 'Run it back — ' : ''}${offer.years}yr · ${money(offer.salary)}/yr. ${offer.pitch}`,
    effects: [{ key: 'money', label: 'MONEY', short: '$', delta: offer.salary }],
    tag: `${money(offer.salary)}/yr`,
    watermark: resign ? 'STAY' : 'SIGN',
  };
}

/** A EuroLeague club offer rendered as an option card. */
export function clubOfferView(offer: ClubOffer): OptionView {
  const stay = offer.choiceId === 'euro_stay';
  return {
    id: offer.choiceId,
    label: offer.club.name.toUpperCase(),
    blurb: `${offer.years}yr · ${money(offer.salary)}/yr. ${offer.pitch}`,
    effects: [{ key: 'money', label: 'MONEY', short: '$', delta: offer.salary }],
    tag: `${money(offer.salary)}/yr`,
    watermark: stay ? 'STAY' : 'EURO',
  };
}

/** The "sign a veteran deal back in the NBA" option, shown once value recovers. */
export function nbaReturnView(salary: number): OptionView {
  return {
    id: 'nba_return',
    label: 'BACK TO THE NBA',
    blurb: `A team wants you back. ${money(salary)}/yr, prove it again.`,
    effects: [{ key: 'money', label: 'MONEY', short: '$', delta: salary }],
    tag: 'NBA',
    watermark: 'NBA',
  };
}
