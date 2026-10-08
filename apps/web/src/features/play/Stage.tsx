import { Children, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { CourtLines } from '../../components/CourtLines.js';
import { cn } from '../../lib/cn.js';

/** Where the options start dealing, after the preface, title and prompt. */
export const DEAL_START = 3;

/**
 * The scene for one decision. It arrives in order: whatever happened before (the preface), the
 * question, the stakes, then the options are dealt. Engine titles are set in jersey lettering;
 * sentence-case titles keep the calm display voice.
 */
export function Stage({
  title,
  prompt,
  preface,
  court = false,
  children,
}: {
  title: string;
  prompt?: string;
  preface?: ReactNode;
  /** Draw the half court behind the question. Saved for the biggest moments. */
  court?: boolean;
  children: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const caps = title === title.toUpperCase();

  // When the chosen card unmounts, focus falls to the body. Catch it on the new question instead.
  useEffect(() => {
    const active = document.activeElement;
    if (!active || active === document.body) heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section className="relative isolate">
      {court && (
        <CourtLines
          variant="half"
          className="enter absolute -top-10 right-0 -z-10 w-[min(34rem,90%)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        />
      )}
      {preface && (
        <div className="enter" style={{ '--i': 0 } as CSSProperties}>
          {preface}
        </div>
      )}
      <h2
        ref={heading}
        tabIndex={-1}
        className={cn(
          'enter text-ink outline-none',
          preface && 'mt-12',
          caps ? 't-jersey text-[clamp(2.5rem,1.7rem+2.8vw,4.25rem)]' : 't-title max-w-[22ch]',
        )}
        style={{ '--i': 1 } as CSSProperties}
      >
        {title}
      </h2>
      {prompt && (
        <p
          className="enter t-lead mt-4 max-w-[54ch] text-ink/65"
          style={{ '--i': 2 } as CSSProperties}
        >
          {prompt}
        </p>
      )}
      <div className="mt-9">{children}</div>
    </section>
  );
}

/** Two columns of options. A lone last card spans the row, so three options read as a set. */
export function ChoiceGrid({ children }: { children: ReactNode }) {
  const count = Children.count(children);
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-2',
        count % 2 === 1 && 'sm:[&>*:last-child]:col-span-2',
      )}
    >
      {children}
    </div>
  );
}
