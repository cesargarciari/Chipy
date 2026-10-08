import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../store/theme.js';

/** A number that rolls to its new value, like a scoreboard, instead of swapping in place. */
export function RollingNumber({
  value,
  format = (n) => String(n),
  duration = 750,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (start === value) return;
    if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
      setShown(value);
      return;
    }
    const step = Number.isInteger(value) && Number.isInteger(start) ? 1 : 0.1;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - p) ** 4;
      setShown(Math.round((start + (value - start) * eased) / step) * step);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setShown(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{format(shown)}</span>;
}
