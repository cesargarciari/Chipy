import { mulberry32, type Rng } from '../rng.js';
import { optionView } from '../options.js';
import type { GameOption, PrologueNode, PrologueNodeView, Ratings } from '../types.js';
import { buildHighSchoolNode, HIGH_SCHOOL_TEMPLATE } from './highschool.js';
import { buildRecruitingNode, RECRUITING_TEMPLATE } from './recruiting.js';

export const PROLOGUE_NODE_IDS = ['highschool', 'recruiting'] as const;

/**
 * Build the two pre-draft nodes for one career. Ids / labels / blurbs are
 * fixed; the attribute numbers are rolled from `rng` so no summer-circuit
 * option is a permanent best pick.
 */
export function buildPrologueNodes(rng: Rng): PrologueNode[] {
  return [buildHighSchoolNode(rng), buildRecruitingNode(rng)];
}

/** Labels only — used by `describeChoice` for the "N% also chose" rollup. */
const LABELS: Record<string, Record<string, string>> = {
  highschool: Object.fromEntries(HIGH_SCHOOL_TEMPLATE.options.map((o) => [o.id, o.label])),
  recruiting: Object.fromEntries(RECRUITING_TEMPLATE.options.map((o) => [o.id, o.label])),
};

export function prologueOptionLabel(nodeId: string, optionId: string): string | null {
  return LABELS[nodeId]?.[optionId] ?? null;
}

export function getPrologueOption(node: PrologueNode, optionId: string): GameOption {
  const opt = node.options.find((o) => o.id === optionId);
  if (!opt) throw new Error(`Unknown prologue option "${optionId}" for node "${node.id}"`);
  return opt;
}

/** The chosen recruiting option maps to a school tier for the `college1` node. */
export function recruitingTier(optionId: string): 'blue_blood' | 'mid_major' | 'overseas' {
  if (optionId === 'blue_blood') return 'blue_blood';
  if (optionId === 'mid_major_hub') return 'mid_major';
  return 'overseas'; // overseas_pro
}

export function prologueView(node: PrologueNode, current?: Ratings): PrologueNodeView {
  return {
    id: node.id,
    stage: node.stage,
    title: node.title,
    prompt: node.prompt,
    options: node.options.map((o) => optionView(o, current)),
  };
}

/** A stable preview of the prologue for menus (fixed seed). */
export function prologueViews(): PrologueNodeView[] {
  return buildPrologueNodes(mulberry32(1)).map((n) => prologueView(n));
}
