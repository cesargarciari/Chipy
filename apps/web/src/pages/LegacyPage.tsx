import { careerSummarySchema } from '@chipy/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LegacyCard } from '../features/legacy/LegacyCard.js';
import { ApiError, api } from '../lib/api.js';
import { runCareerSafe } from '../lib/runCareerSafe.js';
import { useCareerRun } from '../store/career.js';

export function LegacyPage() {
  const navigate = useNavigate();
  const { seed, profile, choices, reset } = useCareerRun();

  const result = useMemo(
    () => (profile ? runCareerSafe({ seed, profile, choices }) : null),
    [seed, profile, choices],
  );
  const complete = result?.status === 'complete';

  useEffect(() => {
    if (!profile) {
      navigate('/create', { replace: true });
    } else if (result?.status === 'error') {
      reset();
      navigate('/create', { replace: true });
    } else if (result && !complete) {
      navigate('/play', { replace: true });
    }
  }, [profile, result, complete, navigate, reset]);

  const summary = useMemo(
    () => (result?.status === 'complete' ? careerSummarySchema.parse(result.summary) : null),
    [result],
  );

  const save = useQuery({
    queryKey: ['save-career', seed, JSON.stringify(profile), choices.length],
    queryFn: () => api.createCareer({ seed, profile: profile!, choices }),
    enabled: Boolean(summary),
    retry: 1,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (!summary) return null;

  const shareUrl = save.data ? `${window.location.origin}/c/${save.data.id}` : undefined;
  const saveError =
    save.error instanceof ApiError ? save.error.message : save.error ? 'unknown error' : null;

  return (
    <LegacyCard
      summary={summary}
      choiceStats={save.data?.choiceStats}
      shareUrl={shareUrl}
      saving={save.isLoading}
      saveError={saveError}
      onPlayAgain={() => {
        reset();
        navigate('/create');
      }}
    />
  );
}
