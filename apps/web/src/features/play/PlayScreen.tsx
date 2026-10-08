import type { PendingDecision, SeasonPreview } from '@chipy/engine';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SCHOOL_TIER_LABELS } from '../../lib/format.js';
import { useT, type Dictionary } from '../../lib/i18n.js';
import { runCareerSafe } from '../../lib/runCareerSafe.js';
import { useCareerRun } from '../../store/career.js';
import { ChemistryScreen } from './ChemistryScreen.js';
import { CollegePick } from './CollegePick.js';
import { CollegeYear, collegeYearLabel } from './CollegeYear.js';
import { DecisionEcho, type DecisionEchoData } from './DecisionEcho.js';
import { FarewellScreen } from './FarewellScreen.js';
import { FinalsScreen } from './FinalsScreen.js';
import { LandingSpot } from './LandingSpot.js';
import { MidseasonScreen } from './MidseasonScreen.js';
import { OverseasOffer, overseasPhase } from './OverseasOffer.js';
import { PlayerCard } from './PlayerCard.js';
import { PrologueNodeView } from './PrologueNodeView.js';
import { SeasonScreen } from './SeasonScreen.js';

/** Finds the option the player just picked so it can be shown on the next screen. */
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

/** The stat line behind this decision, once there is one. */
function previewOf(p: PendingDecision): SeasonPreview | null {
  return (
    p.season?.preview ??
    p.midseason?.preview ??
    p.chemistry?.preview ??
    p.finals?.preview ??
    p.overseasOffer?.preview ??
    p.farewell?.preview ??
    null
  );
}

/** Where in the career this decision sits, for the player card. */
function phaseOf(p: PendingDecision, t: Dictionary): string | null {
  switch (p.kind) {
    case 'prologue':
      return p.prologue?.stage ?? null;
    case 'college_pick':
      return p.collegePick ? SCHOOL_TIER_LABELS[p.collegePick.tier] : null;
    case 'college_year':
      return p.collegeYear ? collegeYearLabel(p.collegeYear) : null;
    case 'landing':
      return t.play.phase.draftNight;
    case 'season':
      return p.season?.decision.kind === 'free_agency'
        ? t.play.phase.freeAgency
        : t.play.phase.offseason;
    case 'midseason':
      return t.play.phase.midseason;
    case 'chemistry':
      return t.play.phase.lockerRoom;
    case 'finals':
      return p.finals?.game.kicker ?? null;
    case 'overseas_offer':
      return p.overseasOffer ? overseasPhase(p.overseasOffer.reason) : null;
    case 'farewell':
      return t.play.phase.farewell;
    default:
      return null;
  }
}

export function PlayScreen() {
  const navigate = useNavigate();
  const t = useT();
  const { seed, profile, choices, choose, reset } = useCareerRun();
  const [echo, setEcho] = useState<DecisionEchoData | null>(null);
  const [echoSeq, setEchoSeq] = useState(0);
  const [highlight, setHighlight] = useState<readonly string[] | undefined>(undefined);
  const stageRef = useRef<HTMLDivElement>(null);

  const result = useMemo(
    () => (profile ? runCareerSafe({ seed, profile, choices }) : null),
    [seed, profile, choices],
  );
  const onHoverKeys = useCallback(
    (keys: readonly string[] | null) => setHighlight(keys ?? undefined),
    [],
  );

  useEffect(() => {
    if (!profile) {
      navigate('/create', { replace: true });
    } else if (result?.status === 'error') {
      // The saved career can't be replayed anymore, so start over.
      reset();
      navigate('/create', { replace: true });
    } else if (result?.status === 'complete') {
      navigate('/legacy', { replace: true });
    }
  }, [profile, result, navigate, reset]);

  const nodeId = result?.status === 'awaiting_choice' ? result.pending.nodeId : null;
  useEffect(() => {
    // A new call starts at its question, even if the last one was picked from far down the page.
    const top = stageRef.current?.getBoundingClientRect().top;
    if (top !== undefined && top < 0) window.scrollTo({ top: 0 });
  }, [nodeId]);

  if (!profile || !result || result.status !== 'awaiting_choice') return null;

  const p = result.pending;
  const onChoose = (choiceId: string) => {
    setEcho(resolveChosenOption(p, choiceId));
    setEchoSeq((n) => n + 1);
    setHighlight(undefined);
    choose(p.nodeId, choiceId);
  };
  const shop =
    p.kind === 'season'
      ? p.season?.shop
      : p.kind === 'overseas_offer'
        ? p.overseasOffer?.shop
        : undefined;
  const buyPerk = (choiceId: string) => shop && choose(shop.nodeId, choiceId);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-10 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-16 lg:pt-12">
      <aside className="min-w-0 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1 lg:self-start">
        <PlayerCard
          profile={profile}
          preview={previewOf(p)}
          phase={phaseOf(p, t)}
          highlight={highlight}
          recentDeltas={echo?.effects}
          echoSeq={echoSeq}
          shop={shop}
          onBuyPerk={buyPerk}
          onHoverKeys={onHoverKeys}
        />
      </aside>

      <div ref={stageRef} className="min-w-0 lg:col-start-1 lg:row-start-1">
        {echo && (
          <div className="mb-10">
            <DecisionEcho echo={echo} echoSeq={echoSeq} />
          </div>
        )}
        {/* The key replays the whole scene on every new decision. */}
        <div key={p.nodeId}>
          {p.kind === 'prologue' && <PrologueNodeView node={p.prologue!} onChoose={onChoose} />}
          {p.kind === 'college_pick' && <CollegePick pick={p.collegePick!} onChoose={onChoose} />}
          {p.kind === 'college_year' && <CollegeYear year={p.collegeYear!} onChoose={onChoose} />}
          {p.kind === 'landing' && <LandingSpot landing={p.landing!} onChoose={onChoose} />}
          {p.kind === 'season' && (
            <SeasonScreen
              season={p.season!}
              profile={profile}
              onChoose={onChoose}
              onHoverKeys={onHoverKeys}
            />
          )}
          {p.kind === 'midseason' && (
            <MidseasonScreen
              midseason={p.midseason!}
              onChoose={onChoose}
              onHoverKeys={onHoverKeys}
            />
          )}
          {p.kind === 'chemistry' && (
            <ChemistryScreen
              chemistry={p.chemistry!}
              onChoose={onChoose}
              onHoverKeys={onHoverKeys}
            />
          )}
          {p.kind === 'finals' && <FinalsScreen finals={p.finals!} onChoose={onChoose} />}
          {p.kind === 'farewell' && <FarewellScreen farewell={p.farewell!} onChoose={onChoose} />}
          {p.kind === 'overseas_offer' && (
            <OverseasOffer
              overseasOffer={p.overseasOffer!}
              onChoose={onChoose}
              onHoverKeys={onHoverKeys}
            />
          )}
        </div>
      </div>
    </div>
  );
}
