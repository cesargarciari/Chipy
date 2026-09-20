import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'en' | 'es';

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'chipy.lang' },
  ),
);
