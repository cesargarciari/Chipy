import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { CourtLines } from '../components/CourtLines.js';
import { Button } from '../components/ui/button.js';
import { SampleCall } from '../features/landing/SampleCall.js';
import { TaglineReveal } from '../features/landing/TaglineReveal.js';
import { useT } from '../lib/i18n.js';
import { runCareerSafe } from '../lib/runCareerSafe.js';
import { useCareerRun } from '../store/career.js';

export function Home() {
  const navigate = useNavigate();
  const t = useT();
  const { seed, profile, choices } = useCareerRun();

  const inProgress =
    profile !== null && runCareerSafe({ seed, profile, choices }).status === 'awaiting_choice';

  return (
    <div>
      {/* The greeting, under the center circle. The only thing that moves on load. */}
      <section className="relative isolate overflow-hidden">
        <CourtLines
          variant="center"
          className="enter absolute inset-0 -z-10 h-full w-full [mask-image:radial-gradient(ellipse_55%_60%_at_50%_50%,black,transparent)] [--blur:0px] [--rise:0px]"
        />
        <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-6xl flex-col items-center justify-center px-4 pb-24 pt-16 text-center sm:px-6">
          <h1
            className="enter t-voice text-[clamp(3.5rem,2rem+6.5vw,7.5rem)] leading-[0.95] tracking-[-0.03em] text-ink"
            style={{ '--i': 1 } as CSSProperties}
          >
            {t.home.greeting}
          </h1>
          <p
            className="enter t-lead mt-7 max-w-[42ch] text-ink/65"
            style={{ '--i': 2 } as CSSProperties}
          >
            {t.home.subhead}
          </p>
          <div
            className="enter mt-11 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
            style={{ '--i': 3 } as CSSProperties}
          >
            <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate('/create')}>
              {t.home.startNew}
            </Button>
            {inProgress && (
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => navigate('/play')}
              >
                {t.home.resume}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Statement with proof: a real call, playable here. */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:py-36">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div className="lg:pt-3">
            <h2 className="t-title max-w-[15ch]">{t.home.sampleTitle}</h2>
            <p className="t-lead mt-5 max-w-[34ch] text-ink/65">{t.home.sampleLead}</p>
          </div>
          <SampleCall />
        </div>
      </section>

      {/* The arc of a career, as a ledger. */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:pb-36">
        <ol>
          {t.home.promises.map((p) => (
            <li
              key={p.title}
              className="grid grid-cols-1 gap-3 border-t border-ink/10 py-9 lg:grid-cols-2 lg:gap-16 lg:py-12"
            >
              <h3 className="t-title text-[clamp(1.625rem,1.3rem+1.2vw,2.25rem)]">{p.title}</h3>
              <p className="t-lead max-w-[44ch] text-ink/65 lg:pt-1.5">{p.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* The one place the page flips its lights. */}
      <section className="scheme-flip bg-ground text-ink">
        <div className="mx-auto max-w-6xl px-4 py-32 sm:px-6 lg:py-44">
          <TaglineReveal lines={[...t.home.tagline]} />
          <div className="mt-14">
            {inProgress ? (
              <Button size="lg" onClick={() => navigate('/play')}>
                {t.home.keepPlaying}
              </Button>
            ) : (
              <Button size="lg" onClick={() => navigate('/create')}>
                {t.home.startYourCareer}
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
