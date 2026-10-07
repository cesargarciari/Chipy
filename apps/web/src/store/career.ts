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
  /** One entry per choice, in order. */
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
          // Each perk purchase is added as its own choice.
          if (/^perks\d+$/.test(nodeId)) {
            return { choices: [...s.choices, { nodeId, choiceId }] };
          }
          // Changing an earlier choice drops everything after it.
          const i = s.choices.findIndex((c) => c.nodeId === nodeId);
          const base = i === -1 ? s.choices : s.choices.slice(0, i);
          return { choices: [...base, { nodeId, choiceId }] };
        }),
      undoLast: () => set((s) => ({ choices: s.choices.slice(0, -1) })),
      reset: () => set({ profile: null, seed: randomSeed(), choices: [] }),
    }),
    // Saved per engine version, so old saves start fresh after rule changes.
    { name: `chipy.run.${ENGINE_VERSION}` },
  ),
);
