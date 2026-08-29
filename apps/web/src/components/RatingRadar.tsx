import { RATING_KEYS, RATING_LABELS, type Ratings } from '@chipy/engine';

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 84;
const RING_STEPS = [0.25, 0.5, 0.75, 1];

function point(index: number, magnitude: number): [number, number] {
  const angle = (Math.PI * 2 * index) / RATING_KEYS.length - Math.PI / 2;
  return [
    CENTER + Math.cos(angle) * RADIUS * magnitude,
    CENTER + Math.sin(angle) * RADIUS * magnitude,
  ];
}

function polygon(magnitudes: number[]): string {
  return magnitudes.map((m, i) => point(i, m).join(',')).join(' ');
}

/** Radar of the player's ratings, 25–99 mapped to 0–1. */
export function RatingRadar({ ratings }: { ratings: Ratings }) {
  const magnitudes = RATING_KEYS.map((k) => Math.max(0, Math.min(1, (ratings[k] - 25) / 74)));

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
          points={polygon(RATING_KEYS.map(() => step))}
          fill="none"
          stroke="var(--color-court-700)"
          strokeWidth={1}
        />
      ))}
      {RATING_KEYS.map((_, i) => {
        const [x, y] = point(i, 1);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="var(--color-court-700)"
            strokeWidth={1}
          />
        );
      })}

      <polygon
        points={polygon(magnitudes)}
        fill="color-mix(in srgb, var(--color-amber) 28%, transparent)"
        stroke="var(--color-amber)"
        strokeWidth={2}
      />

      {RATING_KEYS.map((key, i) => {
        const [x, y] = point(i, 1.18);
        return (
          <text
            key={key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-ink-dim text-[9px] font-semibold"
          >
            {RATING_LABELS[key]}
          </text>
        );
      })}
    </svg>
  );
}
