import { runCareer } from '@chipy/engine';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareerRun } from '../../store/career.js';
import { LandingSpot } from './LandingSpot.js';
import { PrologueNodeView } from './PrologueNodeView.js';
import { SeasonScreen } from './SeasonScreen.js';

export function PlayScreen() {
  const navigate = useNavigate();
  const { seed, profile, choices, choose } = useCareerRun();

  const result = useMemo(
    () => (profile ? runCareer({ seed, profile, choices }) : null),
    [seed, profile, choices],
  );

  useEffect(() => {
    if (!profile) navigate('/create', { replace: true });
    else if (result?.status === 'complete') navigate('/legacy', { replace: true });
  }, [profile, result, navigate]);

  if (!profile || !result || result.status !== 'awaiting_choice') return null;

  const p = result.pending;
  const onChoose = (choiceId: string) => choose(p.nodeId, choiceId);

  return (
    <div className="space-y-4">
      {p.kind === 'prologue' && <PrologueNodeView node={p.prologue!} onChoose={onChoose} />}
      {p.kind === 'landing' && <LandingSpot landing={p.landing!} onChoose={onChoose} />}
      {p.kind === 'season' && (
        <SeasonScreen season={p.season!} profile={profile} onChoose={onChoose} />
      )}
    </div>
  );
}
