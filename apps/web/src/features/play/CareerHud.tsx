import type { SeasonPreview } from '@chipy/engine';
import { IdolatryBar } from '../../components/IdolatryBar.js';
import { RatingStrip } from '../../components/RatingStrip.js';
import { countryName, moneyM } from '../../lib/format.js';

/**
 * The persistent heads-up display above every in-career decision: a big
 * OVERALL with FAME beside it, the money line (bank / salary / market value),
 * and the stat-tile strip — `highlight` keys lit gold while an option is hovered.
 */
export function CareerHud({
  preview,
  highlight,
}: {
  preview: SeasonPreview;
  highlight?: readonly string[];
}) {
  const ovrDelta =
    preview.previousOverall !== null ? preview.overall - preview.previousOverall : null;

  return (
    <div className="space-y-3 rounded-2xl border border-court-700 bg-court-900/60 p-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-5xl leading-none text-ink">{preview.overall}</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">
              Overall
            </span>
            {ovrDelta !== null && ovrDelta !== 0 && (
              <span
                className={`font-mono text-xs ${ovrDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {ovrDelta > 0 ? '▲' : '▼'}
                {Math.abs(ovrDelta)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl leading-none text-amber">{preview.hype}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">Fame</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Money label="Bank" value={preview.bank} tone="text-emerald-400" />
          <Money label="Salary" value={preview.salary} suffix="/yr" />
          <Money label="Value" value={preview.marketValue} suffix="/yr" tone="text-amber" />
        </div>
      </div>

      <RatingStrip
        ratings={preview.ratings}
        athleticism={preview.athleticism}
        durability={preview.durability}
        highlight={highlight}
        raised={preview.raisedKeys}
      />

      {(preview.franchiseTier !== 'none' || preview.nationalTeam.tier !== 'none') && (
        <div className="grid gap-2 sm:grid-cols-2">
          {preview.league === 'nba' && preview.team && preview.franchiseTier !== 'none' && (
            <IdolatryBar
              label="Club idolatry"
              tier={preview.franchiseTier}
              progress={preview.franchiseProgress}
            />
          )}
          {preview.nationalTeam.tier !== 'none' && (
            <IdolatryBar
              label={`${countryName(preview.nationalTeam.country)} NT`}
              tier={preview.nationalTeam.tier}
              progress={preview.nationalTeam.progress}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Money({
  label,
  value,
  suffix = '',
  tone = 'text-ink',
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-ink-dim">{label}</span>
      <span className={`font-mono font-bold ${tone}`}>
        {moneyM(value)}
        {suffix}
      </span>
    </span>
  );
}
