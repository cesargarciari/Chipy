import type { PendingDecision } from '@chipy/engine';
import { ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/cn.js';
import { moneyM } from '../../lib/format.js';

type PerkShop = NonNullable<NonNullable<PendingDecision['season']>['shop']>;
type PerkItem = PerkShop['items'][number];

const KIND_TAG: Record<PerkItem['kind'], string> = { yearly: '/yr', permanent: 'once' };

/**
 * The perks shop: a small cart button (it sits by the team name in the season
 * header) that opens a modal grid of perk tiles. Owned perks stay in the grid
 * with an orange highlight; perks you can't afford are greyed and unpickable.
 * Buying records a `perks{n}` choice and keeps the modal open so you can grab a
 * few.
 */
export function PerksDrawer({
  shop,
  onBuy,
  onHoverKeys,
}: {
  shop: PerkShop;
  onBuy: (choiceId: string) => void;
  onHoverKeys?: (keys: readonly string[] | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ownedCount = shop.items.filter((i) => i.owned).length;
  const buyable = shop.items.filter((i) => i.affordable && !i.owned).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Perks shop"
        title={`Perks shop · ${ownedCount} active · ${moneyM(shop.bank)} in bank`}
        className="relative inline-flex items-center gap-1.5 rounded-lg border border-court-700 bg-court-900/60 px-2 py-1 text-ink-dim transition-colors hover:border-amber hover:text-amber"
      >
        <ShoppingCart size={15} strokeWidth={1.75} />
        <span className="text-[11px] font-semibold uppercase tracking-wide">
          {moneyM(shop.bank)}
        </span>
        {buyable > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 text-[9px] font-bold leading-none text-court-950">
            {buyable}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-court-950/70 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Perks shop"
            className="max-h-[85dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-court-700 bg-court-900 p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-xl tracking-wide">Perks shop</h3>
                <p className="text-xs text-ink-dim">
                  Spend from the bank - yearly perks re-bill every offseason.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wide text-ink-dim">
                    In the bank
                  </div>
                  <div className="font-display text-lg leading-none text-emerald-400">
                    {moneyM(shop.bank)}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-lg px-2 py-1 text-sm text-ink-dim hover:text-ink"
                >
                  ✕
                </button>
              </div>
            </div>

            {shop.items.length === 0 ? (
              <p className="text-sm text-ink-dim">
                Nothing on the shelves yet - check back next season.
              </p>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {shop.items.map((item) => (
                  <PerkTile key={item.perkId} item={item} onBuy={onBuy} onHoverKeys={onHoverKeys} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function PerkTile({
  item,
  onBuy,
  onHoverKeys,
}: {
  item: PerkItem;
  onBuy: (choiceId: string) => void;
  onHoverKeys?: (keys: readonly string[] | null) => void;
}) {
  const selectable = item.affordable && !item.owned;
  const hoverOn = onHoverKeys ? () => onHoverKeys(item.highlight) : undefined;
  const hoverOff = onHoverKeys ? () => onHoverKeys(null) : undefined;

  return (
    <button
      type="button"
      disabled={!selectable}
      onClick={selectable ? () => onBuy(item.choiceId) : undefined}
      onMouseEnter={hoverOn}
      onMouseLeave={hoverOff}
      onFocus={hoverOn}
      onBlur={hoverOff}
      className={cn(
        'flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors',
        item.owned
          ? 'border-amber bg-amber/8'
          : selectable
            ? 'border-court-700 bg-court-900 hover:border-amber hover:bg-amber/4'
            : 'cursor-not-allowed border-court-800 bg-court-900/40 opacity-45',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-display text-sm leading-tight tracking-wide">{item.name}</span>
        <span
          className={cn(
            'shrink-0 font-display text-sm leading-none',
            item.owned ? 'text-amber' : 'text-emerald-400',
          )}
        >
          {moneyM(item.cost)}
          <span className="ml-0.5 text-[9px] uppercase tracking-wide text-ink-dim">
            {KIND_TAG[item.kind]}
          </span>
        </span>
      </div>

      <p className="text-[11px] leading-snug text-ink-dim">{item.blurb}</p>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((t) => (
            <span
              key={t}
              className="rounded bg-court-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-dim"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-0.5 text-[9px] font-bold uppercase tracking-widest">
        {item.owned ? (
          <span className="text-amber">Owned</span>
        ) : item.affordable ? (
          <span className="text-emerald-400/70">{item.category}</span>
        ) : (
          <span className="text-ink-dim">Need {moneyM(item.cost)}</span>
        )}
      </div>
    </button>
  );
}
