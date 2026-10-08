import type { PendingDecision } from '@chipy/engine';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { MomentModal, isHeadlineMoment } from '../../components/MomentModal.js';
import { ChoiceGrid, DEAL_START, Stage } from './Stage.js';

type OverseasOfferData = NonNullable<PendingDecision['overseasOffer']>;

const COPY: Record<OverseasOfferData['reason'], { phase: string; title: string; blurb: string }> = {
  washed_out: {
    phase: 'The NBA goes quiet',
    title: 'A way to keep playing.',
    blurb:
      'No NBA team is calling. But clubs in Europe want you as their centrepiece: a EuroLeague run, real money, and a shot at earning your way back.',
  },
  contract_up: {
    phase: 'Your EuroLeague deal is up',
    title: 'Where next?',
    blurb: 'Re-sign, move to a bigger club, or, if the league is watching again, go home.',
  },
};

/** The phase line the player card shows for this screen. */
export function overseasPhase(reason: OverseasOfferData['reason']): string {
  return COPY[reason].phase;
}

export function OverseasOffer({
  overseasOffer,
  onChoose,
  onHoverKeys,
}: {
  overseasOffer: OverseasOfferData;
  onChoose: (choiceId: string) => void;
  onHoverKeys: (keys: readonly string[] | null) => void;
}) {
  const copy = COPY[overseasOffer.reason];
  const headlineMoments = overseasOffer.preview.moments.filter(isHeadlineMoment);

  return (
    <>
      <MomentModal key={overseasOffer.preview.seasonNumber} moments={headlineMoments} />
      <Stage title={copy.title} prompt={copy.blurb}>
        <ChoiceGrid>
          {overseasOffer.options.map((o, i) => (
            <ChoiceCard
              key={o.id}
              index={DEAL_START + i}
              title={o.label}
              description={o.blurb}
              effects={o.effects}
              tag={o.tag}
              watermark={o.watermark}
              teamId={o.teamId}
              tone={o.id === 'retire' ? 'danger' : 'default'}
              onHoverKeys={onHoverKeys}
              onClick={() => onChoose(o.id)}
            />
          ))}
        </ChoiceGrid>
      </Stage>
    </>
  );
}
