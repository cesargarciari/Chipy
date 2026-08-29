import { getPrologueNode } from './scenarios/index.js';
import { getDecisionDef } from './season/decisions.js';

/**
 * Human label for a stored `(nodeId, choiceId)` — used by the API to render
 * "N% of players also chose X". Returns `null` for choices that are not
 * meaningfully comparable across players (team offers, which resolve to a
 * different team for everyone).
 */
export function describeChoice(nodeId: string, choiceId: string): string | null {
  if (nodeId === 'highschool' || nodeId === 'recruiting') {
    return getPrologueNode(nodeId)?.choices.find((c) => c.id === choiceId)?.label ?? null;
  }
  if (choiceId === 'retire') return 'Retire';
  if (choiceId.startsWith('offer_')) return null;
  if (/^s\d{1,2}$/.test(nodeId)) {
    return getDecisionDef(choiceId)?.label ?? null;
  }
  return null;
}
