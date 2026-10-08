import {
  STATUS_TIER_LABELS,
  getArchetype,
  type EffectChip,
  type PendingDecision,
  type PlayerProfile,
  type SeasonPreview,
} from '@chipy/engine';
import { ArrowLeftRight, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { IdolatryBar } from '../../components/IdolatryBar.js';
import { RatingStrip } from '../../components/RatingStrip.js';
import { RollingNumber } from '../../components/RollingNumber.js';
import { SURFACE } from '../../components/ui/card.js';
import { clubCrest, teamLogo } from '../../lib/art.js';
import { cn } from '../../lib/cn.js';
import { countryLabel, countryName, moneyM, teamName } from '../../lib/format.js';
import { useT } from '../../lib/i18n.js';
import { PerksDrawer } from './PerksDrawer.js';

type PerkShop = NonNullable<NonNullable<PendingDecision['season']>['shop']>;

interface PlayerCardProps {
  profile: PlayerProfile;
  /** Null before the pros: the card shows the prospect instead of a stat line. */
  preview: SeasonPreview | null;
  /** Where in the career this decision sits, e.g. "Mid-season". */
  phase: string | null;
  highlight?: readonly string[];
  recentDeltas?: readonly EffectChip[];
  echoSeq: number;
  shop?: PerkShop;
  onBuyPerk?: (choiceId: string) => void;
  onHoverKeys?: (keys: readonly string[] | null) => void;
}

/**
 * The player, kept beside every decision. It stays mounted from one call to the next, so the
 * numbers roll and the bars slide instead of reappearing.
 */
export function PlayerCard({
  profile,
  preview,
  phase,
  highlight,
  recentDeltas,
  echoSeq,
  shop,
  onBuyPerk,
  onHoverKeys,
}: PlayerCardProps) {
  const t = useT();
  const crest = preview
    ? preview.league === 'overseas'
      ? clubCrest(preview.club?.id)
      : teamLogo(preview.team?.id)
    : undefined;
  const where = preview
    ? preview.league === 'overseas'
      ? (preview.club?.name ?? 'Overseas')
      : preview.team
        ? teamName(preview.team.id)
        : null
    : null;

  return (
    <div className={cn(SURFACE, 'rounded-card p-5 sm:p-6')}>
      <div className="flex items-start gap-3.5">
        {crest ? (
          <img src={crest} alt="" className="h-11 w-11 shrink-0 object-contain" />
        ) : (
          <span className="t-num grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink/6 text-lg text-ink">
            {profile.jerseyNumber}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="t-jersey text-[1.375rem] text-ink">{where ?? profile.name}</p>
          <p className="mt-1.5 flex flex-wrap gap-x-3 text-sm text-ink/60">
            {preview ? (
              <>
                <span>{t.play.season(preview.seasonNumber)}</span>
                <span>{t.play.age(preview.age)}</span>
              </>
            ) : (
              <span>{t.play.prospect}</span>
            )}
          </p>
        </div>
      </div>

      {(phase || preview?.contractYear || shop) && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {phase && <Pill>{phase}</Pill>}
          {preview?.contractYear && <Pill tone="accent">{t.play.phase.contractYear}</Pill>}
          {shop && onBuyPerk && (
            <span className="ml-auto">
              <PerksDrawer shop={shop} onBuy={onBuyPerk} onHoverKeys={onHoverKeys} />
            </span>
          )}
        </div>
      )}

      {preview ? (
        <ProLine
          preview={preview}
          profile={profile}
          highlight={highlight}
          recentDeltas={recentDeltas}
          echoSeq={echoSeq}
        />
      ) : (
        <ProspectLine profile={profile} />
      )}
    </div>
  );
}

function ProLine({
  preview,
  profile,
  highlight,
  recentDeltas,
  echoSeq,
}: {
  preview: SeasonPreview;
  profile: PlayerProfile;
  highlight?: readonly string[];
  recentDeltas?: readonly EffectChip[];
  echoSeq: number;
}) {
  const t = useT();
  const ovrDelta =
    preview.previousOverall !== null ? preview.overall - preview.previousOverall : null;
  const nba = preview.league === 'nba';
  const idolatry = (
    <>
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
    </>
  );
  const hasIdolatry = preview.franchiseTier !== 'none' || preview.nationalTeam.tier !== 'none';

  return (
    <>
      <p className="mt-5 text-sm text-ink/60">
        <span className="t-num text-ink/80">#{profile.jerseyNumber}</span> {profile.name}
      </p>

      <div className="mt-5 flex items-end gap-7">
        <div>
          <div className="flex items-start gap-1.5">
            <RollingNumber
              value={preview.overall}
              className="t-num text-[3.75rem] leading-[0.8] text-ink"
            />
            {ovrDelta !== null && ovrDelta !== 0 && (
              <span className={cn('t-num text-sm', ovrDelta > 0 ? 'text-up' : 'text-down')}>
                {ovrDelta > 0 ? '+' : ''}
                {ovrDelta}
              </span>
            )}
          </div>
          <div className="t-label mt-2.5">{t.play.overall}</div>
        </div>
        <div>
          <RollingNumber
            value={preview.hype}
            className="t-num text-[2.25rem] leading-[0.8] text-ink/85"
          />
          <div className="t-label mt-2.5">{t.play.fame}</div>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-ink/8 pt-4">
        <Money label={t.play.bank} value={preview.bank} />
        <Money label={t.play.salary} value={preview.salary} suffix="/yr" />
        <Money label={t.play.value} value={preview.marketValue} suffix="/yr" />
      </dl>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-sm">
        <span className="inline-flex items-baseline gap-2">
          <span className="t-label">{t.play.status}</span>
          <span className="text-ink">{STATUS_TIER_LABELS[preview.statusTier]}</span>
        </span>
        {nba && (
          <span
            className="inline-flex items-baseline gap-2"
            title="How you gel with teammates. Low chemistry gets you traded."
          >
            <span className="t-label">{t.play.chemistry}</span>
            <span
              className={cn(
                't-num',
                preview.chemistry >= 55
                  ? 'text-up'
                  : preview.chemistry >= 35
                    ? 'text-ink/80'
                    : 'text-down',
              )}
            >
              {preview.chemistry}
            </span>
          </span>
        )}
      </div>

      {((nba && preview.tradeChance >= 0.14) || preview.ringWindow > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {nba && preview.tradeChance >= 0.14 && (
            <Pill
              tone={preview.tradeChance >= 0.22 ? 'down' : 'neutral'}
              title="Rough odds you're moved before next season"
            >
              <ArrowLeftRight size={12} strokeWidth={2} aria-hidden />
              {t.play.tradeRisk} {Math.round(preview.tradeChance * 100)}%
            </Pill>
          )}
          {preview.ringWindow > 0 && (
            <Pill tone="gold" title="You're a proven winner. The title window is still open.">
              <Trophy size={12} strokeWidth={2} aria-hidden />
              {t.play.contentionWindow} {t.play.years(preview.ringWindow)}
            </Pill>
          )}
        </div>
      )}

      <div className="mt-6 lg:border-t lg:border-ink/8 lg:pt-5">
        <RatingStrip
          ratings={preview.ratings}
          athleticism={preview.athleticism}
          durability={preview.durability}
          highlight={highlight}
          recentDeltas={recentDeltas}
          echoSeq={echoSeq}
        />
      </div>

      {hasIdolatry && (
        <>
          <div className="mt-6 hidden space-y-4 border-t border-ink/8 pt-5 lg:block">
            {idolatry}
          </div>
          <details className="group mt-4 lg:hidden">
            <summary className="cursor-pointer list-none text-sm text-ink/60 marker:hidden">
              <span className="underline decoration-ink/25 underline-offset-4">
                {t.play.clubIdolatry}
              </span>
            </summary>
            <div className="mt-4 space-y-4">{idolatry}</div>
          </details>
        </>
      )}
    </>
  );
}

function ProspectLine({ profile }: { profile: PlayerProfile }) {
  const t = useT();
  return (
    <dl className="mt-6 hidden grid-cols-2 gap-x-4 gap-y-4 border-t border-ink/8 pt-5 text-sm lg:grid">
      <Detail label={t.createPlayer.position} value={profile.position} />
      <Detail label={t.createPlayer.jersey} value={`#${profile.jerseyNumber}`} />
      <Detail label={t.createPlayer.bornIn} value={countryLabel(profile.country)} />
      <Detail
        label={t.createPlayer.shootingHand}
        value={profile.handedness === 'left' ? t.createPlayer.lefty : t.createPlayer.righty}
      />
      <div className="col-span-2">
        <dt className="t-label">{t.createPlayer.archetypeLabel(profile.position)}</dt>
        <dd className="mt-1 text-ink">{getArchetype(profile.archetype).label}</dd>
      </div>
    </dl>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="t-label">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}

function Money({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="min-w-0">
      <dt className="t-label">{label}</dt>
      <dd className="t-num mt-1.5 truncate text-[1.0625rem] text-ink">
        <RollingNumber value={value} format={moneyM} />
        <span className="text-ink/60">{suffix}</span>
      </dd>
    </div>
  );
}

const PILL_TONE = {
  neutral: 'bg-ink/6 text-ink/70',
  accent: 'bg-accent/14 text-accent-ink',
  down: 'bg-down/12 text-down',
  gold: 'bg-gold/14 text-gold',
} as const;

function Pill({
  tone = 'neutral',
  title,
  children,
}: {
  tone?: keyof typeof PILL_TONE;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs',
        PILL_TONE[tone],
      )}
    >
      {children}
    </span>
  );
}
