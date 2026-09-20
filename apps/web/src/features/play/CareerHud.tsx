import { STATUS_TIER_LABELS, type EffectChip, type SeasonPreview } from '@chipy/engine';
import { IdolatryBar } from '../../components/IdolatryBar.js';
import { RatingStrip } from '../../components/RatingStrip.js';
import { cn } from '../../lib/cn.js';
import { countryName, moneyM } from '../../lib/format.js';
import { useT } from '../../lib/i18n.js';

/**
 * The persistent heads-up display above every in-career decision: a big
 * OVERALL with FAME beside it, the money line (bank / salary / market value),
 * and the stat-tile strip - `highlight` keys lit gold while an option is hovered.
 *
 * `recentDeltas` (the effects of whatever was just chosen) does two things:
 * it lights a brief tick on the RatingStrip tiles that moved, and it tints
 * the panel's border warm or cool depending on whether that one call was a
 * net gain or a net cost - an ambient read on how the last decision landed,
 * not just how the whole season is trending.
 */
export function CareerHud({
  preview,
  highlight,
  recentDeltas,
  echoSeq,
}: {
  preview: SeasonPreview;
  highlight?: readonly string[];
  recentDeltas?: readonly EffectChip[];
  echoSeq?: number;
}) {
  const t = useT();
  const ovrDelta =
    preview.previousOverall !== null ? preview.overall - preview.previousOverall : null;
  const momentum = (recentDeltas ?? []).reduce(
    (sum, e) => (e.key === 'money' ? sum : sum + e.delta),
    0,
  );

  return (
    <div
      className={cn(
        'space-y-3 rounded-2xl border bg-court-900/60 p-3 transition-colors duration-500',
        momentum > 0 ? 'border-amber/45' : momentum < 0 ? 'border-rose-500/40' : 'border-court-700',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-5xl leading-none text-ink">{preview.overall}</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">
              {t.play.overall}
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
          <span className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">
            {t.play.fame}
          </span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Money label={t.play.bank} value={preview.bank} tone="text-emerald-400" />
          <Money label={t.play.salary} value={preview.salary} suffix="/yr" />
          <Money label={t.play.value} value={preview.marketValue} suffix="/yr" tone="text-amber" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-baseline gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-ink-dim">{t.play.status}</span>
          <span className="text-xs font-bold text-ink">
            {STATUS_TIER_LABELS[preview.statusTier]}
          </span>
        </span>
        {preview.league === 'nba' && (
          <span
            className="inline-flex items-baseline gap-1.5"
            title="How you gel with teammates - low chemistry gets you traded"
          >
            <span className="text-[11px] uppercase tracking-wide text-ink-dim">
              {t.play.chemistry}
            </span>
            <span
              className={`text-xs font-bold ${
                preview.chemistry >= 55
                  ? 'text-emerald-400'
                  : preview.chemistry >= 35
                    ? 'text-amber'
                    : 'text-rose-400'
              }`}
            >
              {preview.chemistry}
            </span>
          </span>
        )}
        {preview.league === 'nba' && preview.tradeChance >= 0.14 && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
              preview.tradeChance >= 0.22
                ? 'bg-rose-500/15 text-rose-400'
                : 'bg-amber/15 text-amber'
            }`}
            title="Rough odds you're moved before next season"
          >
            ⇄ {t.play.tradeRisk} {Math.round(preview.tradeChance * 100)}%
          </span>
        )}
        {preview.ringWindow > 0 && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber"
            title="You're a proven winner - the title window is still open"
          >
            🏆 {t.play.contentionWindow} · {preview.ringWindow}y
          </span>
        )}
      </div>

      <RatingStrip
        ratings={preview.ratings}
        athleticism={preview.athleticism}
        durability={preview.durability}
        highlight={highlight}
        recentDeltas={recentDeltas}
        echoSeq={echoSeq}
      />

      {(preview.franchiseTier !== 'none' || preview.nationalTeam.tier !== 'none') && (
        <div className="grid gap-2 sm:grid-cols-2">
          {preview.franchiseTier !== 'none' && (
            <IdolatryBar
              label={t.play.clubIdolatry}
              tier={preview.franchiseTier}
              progress={preview.franchiseProgress}
            />
          )}
          {preview.nationalTeam.tier !== 'none' && (
            <IdolatryBar
              label={t.play.nationalTeamLabel(countryName(preview.nationalTeam.country))}
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
