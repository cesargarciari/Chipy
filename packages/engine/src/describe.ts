import { perkExists, getPerk } from './data/perks.js';
import { prologueOptionLabel } from './scenarios/index.js';
import { CHEMISTRY_SCENARIOS } from './season/chemistry.js';
import { findMidseasonOption } from './season/midseason.js';
import { findScenarioOption } from './season/scenarios/index.js';

/**
 * Human label for a stored `(nodeId, choiceId)` - used by the API to render
 * "N% of players also chose X". Returns `null` for choices that are not
 * meaningfully comparable across players (team / club offers, school picks, and
 * the declare/return/transfer decisions, which are per-player).
 */
export function describeChoice(nodeId: string, choiceId: string): string | null {
  if (nodeId === 'highschool' || nodeId === 'recruiting') {
    return prologueOptionLabel(nodeId, choiceId);
  }
  if (choiceId === 'retire') return 'Retire';
  if (choiceId === 'farewell_tour') return 'Farewell tour';
  if (choiceId === 'quiet_goodbye') return 'Quiet goodbye';
  if (choiceId === 'demand_trade') return 'Demand a trade';
  if (choiceId === 'nba_return') return 'Return to the NBA';
  if (choiceId === 'perks_done') return null;
  if (choiceId.startsWith('buy_')) {
    const id = choiceId.slice(4);
    return perkExists(id) ? getPerk(id).name : null;
  }
  if (choiceId.startsWith('offer_') || choiceId.startsWith('euro_')) return null; // per-player
  if (choiceId.startsWith('cy_')) return null; // declare / return / transfer
  if (/^college[123]$/.test(nodeId)) return null; // school pick
  if (/^ms\d{1,2}$/.test(nodeId)) {
    return findMidseasonOption(choiceId)?.option.label ?? null;
  }
  if (/^chem\d{1,2}$/.test(nodeId)) {
    for (const s of CHEMISTRY_SCENARIOS) {
      const o = s.options.find((x) => x.id === choiceId);
      if (o) return o.label;
    }
    return null;
  }
  if (/^s\d{1,2}$/.test(nodeId)) {
    return (
      findScenarioOption(choiceId)?.scenario.options.find((o) => o.id === choiceId)?.label ?? null
    );
  }
  return null;
}
