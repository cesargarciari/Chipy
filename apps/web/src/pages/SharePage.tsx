import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button.js';
import { LegacyCard } from '../features/legacy/LegacyCard.js';
import { api } from '../lib/api.js';

export function SharePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['career', id],
    queryFn: () => api.getCareer(id),
    enabled: id.length > 0,
    retry: 1,
  });

  if (isLoading) {
    return (
      <p className="mx-auto animate-pulse max-w-5xl px-4 py-24 text-center text-ink/60 sm:px-6">
        Loading career…
      </p>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <h1 className="t-title">That career isn&apos;t here.</h1>
        <p className="t-lead mt-4 text-ink/65">
          {(error as Error)?.message ?? 'That career could not be found.'}
        </p>
        <Button size="lg" className="mt-10" onClick={() => navigate('/create')}>
          Start your own career
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-10 pt-8 sm:px-6 lg:pt-14">
      <LegacyCard
        summary={data.summary}
        choiceStats={data.choiceStats}
        shareUrl={window.location.href}
      />
      <Button variant="secondary" size="lg" className="w-full" onClick={() => navigate('/create')}>
        Run your own career
      </Button>
    </div>
  );
}
