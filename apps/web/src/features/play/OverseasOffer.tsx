import type { PendingDecision } from '@chipy/engine';
import { useState } from 'react';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { MomentModal, isHeadlineMoment } from '../../components/MomentModal.js';
import { CareerHud } from './CareerHud.js';
import { MomentsBanner } from './MomentsBanner.js';
import { PerksDrawer } from './PerksDrawer.js';

type OverseasOfferData = NonNullable<PendingDecision['overseasOffer']>;

const COPY: Record<OverseasOfferData['reason'], { kicker: string; title: string; blurb: string }> =
  {
    washed_out: {
      kicker: 'The NBA goes quiet',
      title: 'A way to keep playing',
      blurb:
        'No NBA team is calling. But clubs in Europe want you as their centrepiece — a EuroLeague run, real money, and a shot at earning your way back.',
    },
    contract_up: {
      kicker: 'Your EuroLeague deal is up',
      title: 'Where next?',
      blurb: 'Re-sign, move to a bigger club, or — if the league is watching again — go home.',
    },
  };

export function OverseasOffer({
  overseasOffer,
  onChoose,
  onBuyPerk,
}: {
  overseasOffer: OverseasOfferData;
  onChoose: (choiceId: string) => void;
  onBuyPerk: (choiceId: string) => void;
}) {
  const [highlight, setHighlight] = useState<readonly string[] | undefined>(undefined);
  const copy = COPY[overseasOffer.reason];
  const moments = overseasOffer.preview.moments;
  const headlineMoments = moments.filter(isHeadlineMoment);
  const bannerMoments = moments.filter((m) => !isHeadlineMoment(m));

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-ink-dim">{copy.kicker}</div>
        <h2 className="text-2xl">{copy.title}</h2>
        <p className="max-w-prose text-sm text-ink-dim">{copy.blurb}</p>
      </div>

      <MomentModal key={overseasOffer.preview.seasonNumber} moments={headlineMoments} />

      <MomentsBanner moments={bannerMoments} />

      <CareerHud preview={overseasOffer.preview} highlight={highlight} />

      {overseasOffer.shop && (
        <PerksDrawer
          shop={overseasOffer.shop}
          onBuy={onBuyPerk}
          onHoverKeys={(k) => setHighlight(k ?? undefined)}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {overseasOffer.options.map((o) => (
          <ChoiceCard
            key={o.id}
            title={o.label}
            description={o.blurb}
            effects={o.effects}
            tag={o.tag}
            watermark={o.watermark}
            tone={o.id === 'retire' ? 'danger' : 'default'}
            onHoverKeys={(k) => setHighlight(k ?? undefined)}
            onClick={() => onChoose(o.id)}
          />
        ))}
      </div>
    </div>
  );
}
