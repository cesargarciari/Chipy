import type { ClubOffer, GameOption, OptionView, TeamOffer, TeamRef } from '../types.js';
import { contenderLabel } from './season-sim.js';

/** Shown in free agency once the player can retire. */
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

/** The two ways to retire when age ends the career. */
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

/** Stars can demand a trade, at a cost to their standing with the old team. */
export const DEMAND_TRADE_VIEW: OptionView = {
  id: 'demand_trade',
  label: 'DEMAND A TRADE',
  blurb: 'Tell the front office you want out. You will be moved before next season.',
  effects: [],
  tag: 'Force a move',
  watermark: 'OUT',
};

const money = (m: number): string => `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;

/** A team offer as an option card. */
export function teamOfferView(offer: TeamOffer, resign: boolean): OptionView {
  const titleOdds = Math.round(offer.contender * 100);
  return {
    id: offer.choiceId,
    label: `${offer.team.city.toUpperCase()} ${offer.team.name.toUpperCase()}`,
    blurb: `${resign ? 'Run it back - ' : ''}${offer.years}yr · ${money(offer.salary)}/yr · title odds with you ~${titleOdds}%. ${offer.pitch}`,
    effects: [{ key: 'money', label: 'MONEY', short: '$', delta: offer.salary }],
    tag: `${contenderLabel(offer.contender)} · ${money(offer.salary)}/yr`,
    watermark: resign ? 'STAY' : 'SIGN',
    teamId: offer.team.id,
  };
}

/** A EuroLeague club offer as an option card. */
export function clubOfferView(offer: ClubOffer): OptionView {
  const stay = offer.choiceId === 'euro_stay';
  return {
    id: offer.choiceId,
    label: offer.club.name.toUpperCase(),
    blurb: `${offer.years}yr · ${money(offer.salary)}/yr. ${offer.pitch}`,
    effects: [{ key: 'money', label: 'MONEY', short: '$', delta: offer.salary }],
    tag: `${money(offer.salary)}/yr`,
    watermark: stay ? 'STAY' : 'EURO',
    teamId: offer.club.id,
  };
}

/** An option to return to the NBA for each interested team. The team id is lowercased in the choice id. */
export function nbaReturnTeamView(team: TeamRef, salary: number): OptionView {
  return {
    id: `nba_return_${team.id.toLowerCase()}`,
    label: `${team.city.toUpperCase()} ${team.name.toUpperCase()}`,
    blurb: `They'll take a flyer on you: ${money(salary)}/yr, prove it all over again.`,
    effects: [{ key: 'money', label: 'MONEY', short: '$', delta: salary }],
    tag: `NBA return · ${money(salary)}/yr`,
    watermark: 'NBA',
    teamId: team.id,
  };
}
