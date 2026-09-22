import { ArrowRight, ChevronDown } from 'lucide-react';
import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button.js';
import { DecisionPreview } from '../features/landing/DecisionPreview.js';
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
    <div className="relative isolate flex flex-col">
      {/* Arena light: one warm pool behind the headline, never a spotlight in the eye. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-20 -z-10 mx-auto h-105 w-full max-w-180"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 50% 46%, rgba(249,115,22,0.11), transparent 72%)',
        }}
      />

      {/* min-h roughly discounts the AppShell header + footer so the hero sits
          centered in the first viewport on tall screens and flows normally on short ones. */}
      <section className="flex min-h-[calc(100dvh-9.5rem)] flex-col items-center justify-center gap-10 py-12 sm:gap-14">
        <div className="decision-enter flex flex-col items-center gap-5 text-center">
          <h1 className="max-w-2xl text-pretty text-4xl italic font-light tracking-tight text-ink sm:text-6xl">
            {t.home.headline}{' '}
            <span className="font-medium not-italic text-amber">{t.home.headlineAccent}</span>
          </h1>
          <p className="max-w-md text-pretty text-base leading-relaxed text-ink-dim sm:max-w-2xl sm:text-lg">
            {t.home.subhead}
          </p>
        </div>

        <div className="decision-enter flex flex-col items-center gap-3">
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              size="lg"
              className="w-full sm:w-auto sm:min-w-56"
              onClick={() => navigate('/create')}
            >
              {t.home.startNew}
            </Button>
            {inProgress && (
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto sm:min-w-56"
                onClick={() => navigate('/play')}
              >
                {t.home.resume}
              </Button>
            )}
          </div>
        </div>

        <div className="flex w-full max-w-2xl flex-col items-center gap-2.5 border-t border-court-800 pt-8 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-dim sm:flex-row sm:justify-between sm:gap-4">
          {t.home.arc.map((step, i) => (
            <Fragment key={step}>
              <span className="whitespace-nowrap">{step}</span>
              {i < t.home.arc.length - 1 && (
                <>
                  <ArrowRight
                    aria-hidden
                    className="hidden h-3.5 w-3.5 shrink-0 text-court-600 sm:block"
                  />
                  <span aria-hidden className="h-3 w-px bg-court-700 sm:hidden" />
                </>
              )}
            </Fragment>
          ))}
        </div>

        <ChevronDown aria-hidden className="scroll-cue h-5 w-5 text-court-600" />
      </section>

      <section className="flex flex-col items-center gap-16 border-t border-court-800 px-4 py-20 sm:py-24">
        <div className="flex flex-col items-center gap-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink-dim">
            {t.home.sampleCallLabel}
          </span>
          <DecisionPreview />
        </div>

        <TaglineReveal lines={[...t.home.tagline]} />

        {inProgress ? (
          <Button size="lg" className="min-w-56" onClick={() => navigate('/play')}>
            {t.home.keepPlaying}
          </Button>
        ) : (
          <Button size="lg" className="min-w-56" onClick={() => navigate('/create')}>
            {t.home.startYourCareer}
          </Button>
        )}
      </section>
    </div>
  );
}
