import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 'system' follows the OS setting. index.html reads the same key before first paint. */
export type ThemeChoice = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  theme: ThemeChoice;
  setTheme: (theme: ThemeChoice) => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'chipy.theme' },
  ),
);

const DARK_QUERY = '(prefers-color-scheme: dark)';

const canMatch = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

function subscribeToSystem(onChange: () => void): () => void {
  if (!canMatch()) return () => {};
  const mql = window.matchMedia(DARK_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function systemPrefersDark(): boolean {
  return canMatch() && window.matchMedia(DARK_QUERY).matches;
}

/** True when the visitor asked the OS for less motion. */
export function prefersReducedMotion(): boolean {
  return canMatch() && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** The theme actually on screen, for the few things CSS variables can't reach (canvas, image export). */
export function useResolvedTheme(): ResolvedTheme {
  const theme = useTheme((s) => s.theme);
  const systemDark = useSyncExternalStore(subscribeToSystem, systemPrefersDark, () => false);
  if (theme === 'system') return systemDark ? 'dark' : 'light';
  return theme;
}
