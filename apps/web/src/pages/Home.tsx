import { ArrowRight, ChevronDown } from 'lucide-react';
import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button.js';
import { DecisionPreview } from '../features/landing/DecisionPreview.js';
import { TaglineReveal } from '../features/landing/TaglineReveal.js';
import { runCareerSafe } from '../lib/runCareerSafe.js';
import { useCareerRun } from '../store/career.js';

/** The shape of every career, in three beats - echoes the hero, sets expectations. */
const ARC = ['Build a prospect', 'One call every offseason', 'A jersey in the rafters'];

export function Home() {
  const navigate = useNavigate();
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
          <h1 className="text-balance text-5xl leading-[0.95] tracking-tight sm:text-6xl">
            <span className="block">One prospect.</span>
            <span className="block">Fifteen years.</span>
            <span className="block text-amber">Your calls.</span>
          </h1>
          <p className="max-w-md text-pretty text-base leading-relaxed text-ink-dim sm:max-w-2xl sm:text-lg">
            Build an NBA prospect, get drafted, and steer a full career from the summer circuit to a
            jersey in the rafters.
          </p>
        </div>

        <div className="decision-enter flex flex-col items-center gap-3">
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              size="lg"
              className="w-full sm:w-auto sm:min-w-56"
              onClick={() => navigate('/create')}
            >
              Start a new career
            </Button>
            {inProgress && (
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto sm:min-w-56"
                onClick={() => navigate('/play')}
              >
                Resume your career
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-dim">No sign up. Runs entirely in your browser.</p>
        </div>

        <div className="flex w-full max-w-2xl flex-col items-center gap-2.5 border-t border-court-800 pt-8 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-dim sm:flex-row sm:justify-between sm:gap-4">
          {ARC.map((step, i) => (
            <Fragment key={step}>
              <span className="whitespace-nowrap">{step}</span>
              {i < ARC.length - 1 && (
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
            A sample call
          </span>
          <DecisionPreview />
        </div>

        <TaglineReveal
          lines={['Every offer has a catch.', 'Every year narrows who you can still become.']}
        />

        {inProgress ? (
          <Button size="lg" className="min-w-56" onClick={() => navigate('/play')}>
            Keep playing
          </Button>
        ) : (
          <Button size="lg" className="min-w-56" onClick={() => navigate('/create')}>
            Start your career
          </Button>
        )}
      </section>
    </div>
  );
}
