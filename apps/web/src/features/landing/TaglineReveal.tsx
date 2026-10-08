import { useInView } from '../../lib/useInView.js';

/** Big text where each word comes up like arena lights, in order, the first time it is seen. */
export function TaglineReveal({ lines }: { lines: string[] }) {
  const [ref, active] = useInView<HTMLParagraphElement>(0.5);
  let wordIndex = 0;

  return (
    <p
      ref={ref}
      className="max-w-[22ch] text-[clamp(2.25rem,1.4rem+3.6vw,4.5rem)] leading-[1.04] tracking-[-0.035em]"
    >
      {lines.map((line, lineIndex) => (
        <span key={line} className="block">
          {line.split(' ').map((word) => {
            const delay = wordIndex * 70;
            wordIndex += 1;
            return (
              <span
                key={`${lineIndex}-${word}-${wordIndex}`}
                className={`inline-block transition-colors duration-700 ease-out motion-reduce:transition-none ${
                  active ? 'text-ink' : 'text-ink/18'
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
