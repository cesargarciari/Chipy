import {
  ENGINE_VERSION,
  randomSeed,
  type ChoiceSelection,
  type PlayerProfile,
} from '@chipy/engine';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CareerRunState {
  seed: number;
  profile: PlayerProfile | null;
  /** One entry per resolved node, in order (prologue, landing, s1, s2, …). */
  choices: ChoiceSelection[];

  start: (profile: PlayerProfile) => void;
  choose: (nodeId: string, choiceId: string) => void;
  undoLast: () => void;
  reset: () => void;
}

export const useCareerRun = create<CareerRunState>()(
  persist(
    (set) => ({
      seed: randomSeed(),
      profile: null,
      choices: [],

      start: (profile) => set({ profile, seed: randomSeed(), choices: [] }),
      choose: (nodeId, choiceId) =>
        set((s) => {
          // The perks shop is a repeatable node — each purchase is an extra
          // choice appended in order, not a re-choice.
          if (/^perks\d+$/.test(nodeId)) {
            return { choices: [...s.choices, { nodeId, choiceId }] };
          }
          // Re-choosing an earlier node invalidates everything after it.
          const i = s.choices.findIndex((c) => c.nodeId === nodeId);
          const base = i === -1 ? s.choices : s.choices.slice(0, i);
          return { choices: [...base, { nodeId, choiceId }] };
        }),
      undoLast: () => set((s) => ({ choices: s.choices.slice(0, -1) })),
      reset: () => set({ profile: null, seed: randomSeed(), choices: [] }),
    }),
    // Key the store to the engine version — any rules change that could make a
    // persisted `choices` array un-replayable starts players from a clean slate.
    { name: `chipy.run.${ENGINE_VERSION}` },
  ),
);
