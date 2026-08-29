import type { PrologueNode, PrologueNodeView } from '../types.js';
import { highSchoolNode } from './highschool.js';
import { recruitingNode } from './recruiting.js';

/** The two pre-draft scenario nodes, in order. */
export const PROLOGUE_NODES: readonly PrologueNode[] = [highSchoolNode, recruitingNode];

const BY_ID = new Map<string, PrologueNode>(PROLOGUE_NODES.map((n) => [n.id, n]));

export function getPrologueNode(id: string): PrologueNode | undefined {
  return BY_ID.get(id);
}

export function getPrologueChoice(nodeId: string, choiceId: string) {
  const node = BY_ID.get(nodeId);
  const choice = node?.choices.find((c) => c.id === choiceId);
  if (!choice) {
    throw new Error(`Unknown prologue choice "${choiceId}" for node "${nodeId}"`);
  }
  return choice;
}

/** Serialisable view for the client. */
export function prologueViews(): PrologueNodeView[] {
  return PROLOGUE_NODES.map((node) => ({
    id: node.id,
    stage: node.stage,
    title: node.title,
    prompt: node.prompt,
    choices: node.choices.map((c) => ({ id: c.id, label: c.label, blurb: c.blurb })),
  }));
}
