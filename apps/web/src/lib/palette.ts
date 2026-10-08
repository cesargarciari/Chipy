import type { ResolvedTheme } from '../store/theme.js';

/**
 * Hex copies of the index.css tokens, for SVG and image export. html-to-image can't resolve
 * CSS variables, so anything that gets copied as a picture paints with these instead.
 */
export const PALETTE: Record<
  ResolvedTheme,
  { ground: string; raised: string; ink: string; inkSoft: string; grid: string; accent: string }
> = {
  light: {
    ground: '#f5f3f1',
    raised: '#fcfbfa',
    ink: '#1b1511',
    inkSoft: '#6b625c',
    grid: '#e4dfda',
    accent: '#c14900',
  },
  dark: {
    ground: '#110e0c',
    raised: '#1a1614',
    ink: '#f3ede9',
    inkSoft: '#a39b96',
    grid: '#332d29',
    accent: '#f3934a',
  },
};
