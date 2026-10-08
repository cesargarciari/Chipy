import type { PendingDecision } from '@chipy/engine';
import { ShoppingBag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn.js';
import { moneyM } from '../../lib/format.js';
import { useT } from '../../lib/i18n.js';

type PerkShop = NonNullable<NonNullable<PendingDecision['season']>['shop']>;
type PerkItem = PerkShop['items'][number];

/** The perks shop. A pill with the bank opens a sheet of perks; buy several before closing it. */
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const t = useT();
  const ownedCount = shop.items.filter((i) => i.owned).length;
  const buyable = shop.items.filter((i) => i.affordable && !i.owned).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.play.perksShop.ariaLabel}
        title={t.play.perksShop.tooltip(ownedCount, moneyM(shop.bank))}
        className="relative inline-flex h-9 shrink-0 items-center gap-2 rounded-full pl-3 pr-3.5 text-ink/75 inset-ring inset-ring-ink/13 transition-[color,box-shadow,scale] duration-200 hover:text-ink hover:inset-ring-ink/30 active:scale-[.97]"
      >
        <ShoppingBag size={15} strokeWidth={1.75} />
        <span className="t-num text-sm">{moneyM(shop.bank)}</span>
        {buyable > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-accent px-1 text-[0.625rem] font-medium leading-none text-on-accent">
            {buyable}
          </span>
        )}
      </button>

      {/* Portaled, so the sticky player card's stacking context can't trap the sheet under the stage. */}
      {open &&
        createPortal(
          <div
            className="gala-scrim fixed inset-0 z-50 flex items-end justify-center bg-ground/60 backdrop-blur-md sm:items-center sm:p-6"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t.play.perksShop.ariaLabel}
              className="sheet-in max-h-[88dvh] w-full max-w-3xl overflow-y-auto rounded-t-sheet bg-float p-6 shadow-float sm:rounded-sheet sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <h3 className="t-title text-[1.75rem]">{t.play.perksShop.title}</h3>
                  <p className="mt-2 text-sm text-ink/60">{t.play.perksShop.subtitle}</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-right">
                    <div className="t-label">{t.play.perksShop.inTheBank}</div>
                    <div className="t-num mt-1 text-xl leading-none text-up">
                      {moneyM(shop.bank)}
                    </div>
                  </div>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={t.play.perksShop.close}
                    className="grid h-9 w-9 place-items-center rounded-full bg-ink/6 text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink"
                  >
                    <X size={16} strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              {shop.items.length === 0 ? (
                <p className="text-sm text-ink/60">{t.play.perksShop.empty}</p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {shop.items.map((item) => (
                    <PerkTile
                      key={item.perkId}
                      item={item}
                      onBuy={onBuy}
                      onHoverKeys={onHoverKeys}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body,
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
  const t = useT();
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
        'flex flex-col gap-2 rounded-2xl p-4 text-left transition-[background-color,box-shadow,scale] duration-200',
        item.owned
          ? 'bg-accent/8 inset-ring inset-ring-accent/50'
          : selectable
            ? 'bg-ink/4 hover:bg-ink/7 active:scale-[.98]'
            : 'cursor-not-allowed bg-ink/3 opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[0.9375rem] font-medium leading-snug text-ink">{item.name}</span>
        <span className="flex shrink-0 items-baseline gap-1">
          <span
            className={cn(
              't-num text-base leading-none',
              item.owned ? 'text-accent-ink' : 'text-up',
            )}
          >
            {moneyM(item.cost)}
          </span>
          <span className="text-[0.6875rem] text-ink/60">
            {item.kind === 'yearly' ? t.play.perksShop.perYear : t.play.perksShop.once}
          </span>
        </span>
      </div>

      <p className="text-[0.8125rem] leading-snug text-ink/60">{item.blurb}</p>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-ink/6 px-2 py-0.5 text-[0.6875rem] text-ink/65"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-1 t-label">
        {item.owned ? (
          <span className="text-accent-ink">{t.play.perksShop.owned}</span>
        ) : item.affordable ? (
          <span>{item.category}</span>
        ) : (
          <span>{t.play.perksShop.need(moneyM(item.cost))}</span>
        )}
      </div>
    </button>
  );
}
