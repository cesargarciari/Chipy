import type { CareerPhase, GameOption, Market, Role } from '../types.js';

/** Read-only snapshot the scenario gates + predicates see. */
export interface ScenarioContext {
  seasonNumber: number;
  age: number;
  phase: CareerPhase;
  role: Role;
  overall: number;
  market: Market;
  hype: number;
  durability: number;
  hasAward: (id: string) => boolean;
  firedScenarioIds: ReadonlySet<string>;
}

export interface ScenarioGate {
  phase?: CareerPhase[];
  minAge?: number;
  maxAge?: number;
  minSeason?: number;
  maxSeason?: number;
  role?: Role[];
  market?: Market[];
  /** Fire at most once per career. */
  once?: boolean;
  /** Relative selection weight (default 1). */
  weight?: number;
  /** Escape hatch for anything the declarative gate can't express. */
  predicate?: (ctx: ScenarioContext) => boolean;
}

export interface Scenario {
  /** Globally unique. */
  id: string;
  theme: 'training' | 'body' | 'media' | 'team' | 'mind' | 'money' | 'legacy';
  gate: ScenarioGate;
  title: string;
  prompt: string;
  /** 2–4 options. */
  options: GameOption[];
}
