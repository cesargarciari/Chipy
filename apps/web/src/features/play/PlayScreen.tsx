import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { runCareerSafe } from '../../lib/runCareerSafe.js';
import { useCareerRun } from '../../store/career.js';
import { CollegePick } from './CollegePick.js';
import { CollegeYear } from './CollegeYear.js';
import { FarewellScreen } from './FarewellScreen.js';
import { LandingSpot } from './LandingSpot.js';
import { MidseasonScreen } from './MidseasonScreen.js';
import { OverseasOffer } from './OverseasOffer.js';
import { PrologueNodeView } from './PrologueNodeView.js';
import { SeasonScreen } from './SeasonScreen.js';

export function PlayScreen() {
  const navigate = useNavigate();
  const { seed, profile, choices, choose, reset } = useCareerRun();

  const result = useMemo(
    () => (profile ? runCareerSafe({ seed, profile, choices }) : null),
    [seed, profile, choices],
  );

  useEffect(() => {
    if (!profile) {
      navigate('/create', { replace: true });
    } else if (result?.status === 'error') {
      // A saved career that no longer replays — wipe it and start fresh.
      reset();
      navigate('/create', { replace: true });
    } else if (result?.status === 'complete') {
      navigate('/legacy', { replace: true });
    }
  }, [profile, result, navigate, reset]);

  if (!profile || !result || result.status !== 'awaiting_choice') return null;

  const p = result.pending;
  const onChoose = (choiceId: string) => choose(p.nodeId, choiceId);

  return (
    <div className="space-y-4">
      {p.kind === 'prologue' && <PrologueNodeView node={p.prologue!} onChoose={onChoose} />}
      {p.kind === 'college_pick' && <CollegePick pick={p.collegePick!} onChoose={onChoose} />}
      {p.kind === 'college_year' && <CollegeYear year={p.collegeYear!} onChoose={onChoose} />}
      {p.kind === 'landing' && <LandingSpot landing={p.landing!} onChoose={onChoose} />}
      {p.kind === 'season' && (
        <SeasonScreen
          season={p.season!}
          profile={profile}
          onChoose={onChoose}
          onBuyPerk={(choiceId) => choose(p.season!.shop.nodeId, choiceId)}
        />
      )}
      {p.kind === 'midseason' && <MidseasonScreen midseason={p.midseason!} onChoose={onChoose} />}
      {p.kind === 'farewell' && <FarewellScreen farewell={p.farewell!} onChoose={onChoose} />}
      {p.kind === 'overseas_offer' && (
        <OverseasOffer
          overseasOffer={p.overseasOffer!}
          onChoose={onChoose}
          onBuyPerk={(choiceId) =>
            p.overseasOffer!.shop && choose(p.overseasOffer!.shop.nodeId, choiceId)
          }
        />
      )}
    </div>
  );
}
