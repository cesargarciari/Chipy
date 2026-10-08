import type { Ratings } from '@chipy/engine';
import { DISPLAY_AXES, displayRatingValue } from '../lib/ratings.js';
import { PALETTE } from '../lib/palette.js';
import { useResolvedTheme } from '../store/theme.js';

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 84;
const RING_STEPS = [0.25, 0.5, 0.75, 1];
const AXES = DISPLAY_AXES;

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

/** Radar chart of the player's ratings. Paints with hex values so the image export keeps them. */
export function RatingRadar({ ratings }: { ratings: Ratings }) {
  const c = PALETTE[useResolvedTheme()];
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
          stroke={c.grid}
          strokeWidth={1}
        />
      ))}
      {AXES.map((_, i) => {
        const [x, y] = point(i, 1);
        return (
          <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke={c.grid} strokeWidth={1} />
        );
      })}

      <polygon
        points={polygon(magnitudes)}
        fill={c.accent}
        fillOpacity={0.2}
        stroke={c.accent}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />

      {AXES.map((axis, i) => {
        const [x, y] = point(i, 1.2);
        return (
          <text
            key={axis.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={c.inkSoft}
            fontSize={9}
            fontWeight={500}
            letterSpacing="0.06em"
          >
            {axis.short}
          </text>
        );
      })}
    </svg>
  );
}
