import type { Ratings } from '@chipy/engine';
import { DISPLAY_AXES, displayRatingValue } from '../lib/ratings.js';

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 84;
const RING_STEPS = [0.25, 0.5, 0.75, 1];
const AXES = DISPLAY_AXES;

// Explicit hex, not CSS vars / utility classes - `html-to-image` doesn't resolve
// custom properties inside the exported SVG, so the labels came out black.
const GRID = '#2a2a31'; // court-700
const LABEL = '#a1a1ad'; // ink-dim
const ACCENT = '#f97316'; // amber
const ACCENT_FILL = 'rgba(249, 115, 22, 0.28)';

function point(index: number, magnitude: number): [number, number] {
  const angle = (Math.PI * 2 * index) / AXES.length - Math.PI / 2;
  return [
    CENTER + Math.cos(angle) * RADIUS * magnitude,
    CENTER + Math.sin(angle) * RADIUS * magnitude,
  ];
}

function polygon(magnitudes: number[]): string {
  return magnitudes.map((m, i) => point(i, m).join(',')).join(' ');
}

/** Radar of the player's ratings (interior + perimeter D merged), 25–99 → 0–1. */
export function RatingRadar({ ratings }: { ratings: Ratings }) {
  const magnitudes = AXES.map((a) =>
    Math.max(0, Math.min(1, (displayRatingValue(ratings, a.key) - 25) / 74)),
  );

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full max-w-[280px]"
      role="img"
      aria-label="Player ratings radar"
    >
      {RING_STEPS.map((step) => (
        <polygon
          key={step}
          points={polygon(AXES.map(() => step))}
          fill="none"
          stroke={GRID}
          strokeWidth={1}
        />
      ))}
      {AXES.map((_, i) => {
        const [x, y] = point(i, 1);
        return <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke={GRID} strokeWidth={1} />;
      })}

      <polygon points={polygon(magnitudes)} fill={ACCENT_FILL} stroke={ACCENT} strokeWidth={2} />

      {AXES.map((axis, i) => {
        const [x, y] = point(i, 1.18);
        return (
          <text
            key={axis.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={LABEL}
            fontSize={9}
            fontWeight={600}
          >
            {axis.short}
          </text>
        );
      })}
    </svg>
  );
}
