import { useState, type CSSProperties } from 'react';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { useT } from '../../lib/i18n.js';
import { useInView } from '../../lib/useInView.js';

const WATERMARKS = ['MAX', 'RING', '1YR'];

/**
 * A real decision, playable on the landing page. It deals in when scrolled to, and a pick
 * locks in exactly as it does in a career, then says what the call means.
 */
export function SampleCall() {
  const t = useT();
  const { title, prompt, options } = t.home.sampleCall;
  const [ref, live] = useInView<HTMLDivElement>(0.25);
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div ref={ref} className="deal-gate" data-live={live ? '' : undefined}>
      <h3
        className="enter t-jersey text-[clamp(2.25rem,1.6rem+2.2vw,3.5rem)] uppercase text-ink"
        style={{ '--i': 0 } as CSSProperties}
      >
        {title}
      </h3>
      <p
        className="enter t-lead mt-4 max-w-[46ch] text-ink/65"
        style={{ '--i': 1 } as CSSProperties}
      >
        {prompt}
      </p>

      <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:[&>*:last-child]:col-span-2">
        {options.map((o, i) => (
          <ChoiceCard
            key={o.label}
            index={2 + i}
            title={o.label}
            description={o.blurb}
            effects={o.effects}
            watermark={WATERMARKS[i]}
            selected={picked === i}
            className={
              picked !== null && picked !== i
                ? 'opacity-55 transition-opacity duration-300 hover:opacity-100'
                : 'transition-opacity duration-300'
            }
            onClick={() => setPicked(i)}
          />
        ))}
      </div>

      <div aria-live="polite" className="mt-8 min-h-[3.5rem]">
        {picked !== null && (
          <p
            key={picked}
            className="enter t-voice max-w-[40ch] text-[1.375rem] leading-snug text-ink"
          >
            {options[picked]?.outcome}
          </p>
        )}
      </div>
    </div>
  );
}
