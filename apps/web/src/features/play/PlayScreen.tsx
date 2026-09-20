import type { PendingDecision } from '@chipy/engine';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runCareerSafe } from '../../lib/runCareerSafe.js';
import { useCareerRun } from '../../store/career.js';
import { ChemistryScreen } from './ChemistryScreen.js';
import { CollegePick } from './CollegePick.js';
import { CollegeYear } from './CollegeYear.js';
import { DecisionEcho, type DecisionEchoData } from './DecisionEcho.js';
import { FarewellScreen } from './FarewellScreen.js';
import { FinalsScreen } from './FinalsScreen.js';
import { LandingSpot } from './LandingSpot.js';
import { MidseasonScreen } from './MidseasonScreen.js';
import { OverseasOffer } from './OverseasOffer.js';
import { PrologueNodeView } from './PrologueNodeView.js';
import { SeasonScreen } from './SeasonScreen.js';

/** Looks up the option the player just picked so its label + effects can be
 * echoed on the node it leads into. `college_pick` (schools, no effects) and
 * `finals` (a bare {id,label} play call) don't carry effects, so they echo
 * with an empty list. */
function resolveChosenOption(p: PendingDecision, choiceId: string): DecisionEchoData | null {
  switch (p.kind) {
    case 'prologue': {
      const o = p.prologue?.options.find((o) => o.id === choiceId);
      return o ? { label: o.label, effects: o.effects } : null;
    }
    case 'college_pick': {
      const s = p.collegePick?.schools.find((s) => s.id === choiceId);
      return s ? { label: s.name, effects: [] } : null;
    }
    case 'college_year': {
      const o = p.collegeYear?.options.find((o) => o.id === choiceId);
      return o ? { label: o.label, effects: o.effects } : null;
    }
    case 'landing': {
      const o = p.landing?.offers.find((o) => o.id === choiceId);
      return o ? { label: o.label, effects: o.effects } : null;
    }
    case 'season': {
      const o = p.season?.decision.options.find((o) => o.id === choiceId);
      return o ? { label: o.label, effects: o.effects } : null;
    }
    case 'midseason': {
      const o = p.midseason?.decision.options.find((o) => o.id === choiceId);
      return o ? { label: o.label, effects: o.effects } : null;
    }
    case 'chemistry': {
      const o = p.chemistry?.decision.options.find((o) => o.id === choiceId);
      return o ? { label: o.label, effects: o.effects } : null;
    }
    case 'finals': {
      const o = p.finals?.game.options.find((o) => o.id === choiceId);
      return o ? { label: o.label, effects: [] } : null;
    }
    case 'farewell': {
      const o = p.farewell?.options.find((o) => o.id === choiceId);
      return o ? { label: o.label, effects: o.effects } : null;
    }
    case 'overseas_offer': {
      const o = p.overseasOffer?.options.find((o) => o.id === choiceId);
      return o ? { label: o.label, effects: o.effects } : null;
    }
    default:
      return null;
  }
}

export function PlayScreen() {
  const navigate = useNavigate();
  const { seed, profile, choices, choose, reset } = useCareerRun();
  const [echo, setEcho] = useState<DecisionEchoData | null>(null);
  const [echoSeq, setEchoSeq] = useState(0);

  const result = useMemo(
    () => (profile ? runCareerSafe({ seed, profile, choices }) : null),
    [seed, profile, choices],
  );

  useEffect(() => {
    if (!profile) {
      navigate('/create', { replace: true });
    } else if (result?.status === 'error') {
      // A saved career that no longer replays - wipe it and start fresh.
      reset();
      navigate('/create', { replace: true });
    } else if (result?.status === 'complete') {
      navigate('/legacy', { replace: true });
    }
  }, [profile, result, navigate, reset]);

  if (!profile || !result || result.status !== 'awaiting_choice') return null;

  const p = result.pending;
  const onChoose = (choiceId: string) => {
    setEcho(resolveChosenOption(p, choiceId));
    setEchoSeq((n) => n + 1);
    choose(p.nodeId, choiceId);
  };

  return (
    <div className="space-y-4">
      {echo && <DecisionEcho echo={echo} echoSeq={echoSeq} />}
      {/* `key` remounts on every node so the entrance animation re-fires. */}
      <div key={p.nodeId} className="space-y-4">
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
            recentDeltas={echo?.effects}
            echoSeq={echoSeq}
          />
        )}
        {p.kind === 'midseason' && (
          <MidseasonScreen
            midseason={p.midseason!}
            onChoose={onChoose}
            recentDeltas={echo?.effects}
            echoSeq={echoSeq}
          />
        )}
        {p.kind === 'chemistry' && (
          <ChemistryScreen
            chemistry={p.chemistry!}
            onChoose={onChoose}
            recentDeltas={echo?.effects}
            echoSeq={echoSeq}
          />
        )}
        {p.kind === 'finals' && (
          <FinalsScreen finals={p.finals!} onChoose={onChoose} echoSeq={echoSeq} />
        )}
        {p.kind === 'farewell' && <FarewellScreen farewell={p.farewell!} onChoose={onChoose} />}
        {p.kind === 'overseas_offer' && (
          <OverseasOffer
            overseasOffer={p.overseasOffer!}
            onChoose={onChoose}
            onBuyPerk={(choiceId) =>
              p.overseasOffer!.shop && choose(p.overseasOffer!.shop.nodeId, choiceId)
            }
            recentDeltas={echo?.effects}
            echoSeq={echoSeq}
          />
        )}
      </div>
    </div>
  );
}
