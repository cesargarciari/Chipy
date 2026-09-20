import { useEffect, useRef, useState } from 'react';

/**
 * Large statement text whose words brighten one at a time as the section
 * crosses into view, muted to full ink in reading order. A single
 * IntersectionObserver on the block drives it; per-word stagger comes from
 * a CSS transition-delay, so there is no scroll listener and no per-word
 * observer. Fires once - it never re-mutes on scroll away.
 */
export function TaglineReveal({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  let wordIndex = 0;

  return (
    <p
      ref={ref}
      className="max-w-2xl text-balance text-center font-display text-3xl leading-tight tracking-wide sm:text-4xl"
    >
      {lines.map((line, lineIndex) => (
        <span key={line} className="block">
          {line.split(' ').map((word) => {
            const delay = wordIndex * 50;
            wordIndex += 1;
            return (
              <span
                key={`${lineIndex}-${word}-${wordIndex}`}
                className={`inline-block transition-[color,opacity] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
                  active ? 'text-ink opacity-100' : 'text-ink-dim opacity-30'
                }`}
                style={{ transitionDelay: `${delay}ms` }}
              >
                {word}&nbsp;
              </span>
            );
          })}
        </span>
      ))}
    </p>
  );
}
