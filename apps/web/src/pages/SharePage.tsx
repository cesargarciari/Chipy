import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button.js';
import { Card, CardBody } from '../components/ui/card.js';
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

  if (isLoading) return <p className="py-10 text-center text-ink-dim">Loading career…</p>;

  if (isError || !data) {
    return (
      <Card>
        <CardBody className="space-y-4 text-center">
          <p className="text-ink-dim">
            {(error as Error)?.message ?? 'That career could not be found.'}
          </p>
          <Button onClick={() => navigate('/create')}>Start your own career</Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <LegacyCard
        summary={data.summary}
        choiceStats={data.choiceStats}
        shareUrl={window.location.href}
      />
      <Button variant="outline" className="w-full" onClick={() => navigate('/create')}>
        Run your own career
      </Button>
    </div>
  );
}
