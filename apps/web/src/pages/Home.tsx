import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button.js';
import { Card, CardBody } from '../components/ui/card.js';
import { runCareerSafe } from '../lib/runCareerSafe.js';
import { useCareerRun } from '../store/career.js';

export function Home() {
  const navigate = useNavigate();
  const { seed, profile, choices } = useCareerRun();

  const inProgress =
    profile !== null && runCareerSafe({ seed, profile, choices }).status === 'awaiting_choice';

  return (
    <div className="space-y-8">
      <section className="space-y-3 pt-6 text-center">
        <h1 className="text-4xl font-black leading-tight sm:text-5xl">
          One prospect. <span className="text-amber">Fifteen years.</span> Your calls.
        </h1>
        <p className="mx-auto max-w-md text-ink-dim">
          Build an NBA prospect, get drafted, and steer a full career - one decision every offseason
          - from the summer circuit to a jersey in the rafters.
        </p>
      </section>

      <Card>
        <CardBody className="flex flex-col items-center gap-4">
          <Button size="lg" onClick={() => navigate('/create')}>
            Start a new career
          </Button>
          {inProgress && (
            <button
              className="text-sm text-ink-dim underline-offset-4 hover:text-ink hover:underline"
              onClick={() => navigate('/play')}
            >
              Resume your current career
            </button>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
