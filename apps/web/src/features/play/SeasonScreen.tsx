import type { PendingDecision, PlayerProfile } from '@chipy/engine';
import { Card, CardBody } from '../../components/ui/card.js';
import { RatingRadar } from '../../components/RatingRadar.js';
import { TEAM_RESULT_LABELS, teamName } from '../../lib/format.js';
import { AwardChips } from './AwardChips.js';
import { StatLine } from './StatLine.js';

type Season = NonNullable<PendingDecision['season']>;

export function SeasonScreen({
  season,
  profile,
  onChoose,
}: {
  season: Season;
  profile: PlayerProfile;
  onChoose: (choiceId: string) => void;
}) {
  const { preview, decision, offers } = season;
  const last = preview.lastSeason;
  const ovrDelta =
    preview.previousOverall !== null && last ? last.overallAfter - preview.previousOverall : null;

  return (
    <div className="space-y-4">
      {/* status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="font-semibold">
          Season {preview.seasonNumber} · Age {preview.age}
        </div>
        <div className="text-ink-dim">
          {teamName(preview.team.id)}
          {preview.contractYear && <span className="ml-2 text-amber">· contract year</span>}
        </div>
        <div className="font-mono">
          OVR {preview.overall}
          {ovrDelta !== null && ovrDelta !== 0 && (
            <span className={ovrDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {' '}
              {ovrDelta > 0 ? '▲' : '▼'}
              {Math.abs(ovrDelta)}
            </span>
          )}
        </div>
      </div>

      {/* last-season recap */}
      {last ? (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Last season — {teamName(last.teamId)}</h3>
              <span className="text-xs uppercase tracking-wide text-ink-dim">
                {TEAM_RESULT_LABELS[last.teamResult]}
              </span>
            </div>
            <p className="text-sm text-ink-dim">{last.eventHeadline}</p>
            <StatLine stats={last.stats} />
            <AwardChips awards={last.awards} />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="space-y-2">
            <h3 className="font-bold">Welcome to the league</h3>
            <p className="text-sm text-ink-dim">
              You&apos;re a {profile.position} with the {teamName(preview.team.id)}. Time to make
              your name.
            </p>
          </CardBody>
        </Card>
      )}

      {/* decision */}
      <Card>
        <CardBody className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-black">{decision.title}</h3>
              <p className="text-sm text-ink-dim">{decision.prompt}</p>
            </div>

            {offers ? (
              <div className="space-y-2">
                {offers.map((o) => (
                  <button
                    key={o.choiceId}
                    onClick={() => onChoose(o.choiceId)}
                    className="w-full rounded-xl border border-court-600 p-3 text-left transition-colors hover:border-amber hover:bg-amber/5"
                  >
                    <span className="block text-sm font-bold">
                      {o.team.city} {o.team.name} · {o.years}yr
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-dim">{o.pitch}</span>
                  </button>
                ))}
                {decision.options
                  .filter((opt) => opt.id === 'retire')
                  .map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onChoose(opt.id)}
                      className="w-full rounded-xl border border-court-700 p-3 text-left text-ink-dim transition-colors hover:border-rose-500 hover:text-ink"
                    >
                      <span className="block text-sm font-bold">{opt.label}</span>
                      <span className="mt-0.5 block text-xs">{opt.blurb}</span>
                    </button>
                  ))}
              </div>
            ) : (
              <div className="space-y-2">
                {decision.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onChoose(opt.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      opt.id === 'retire'
                        ? 'border-court-700 text-ink-dim hover:border-rose-500 hover:text-ink'
                        : 'border-court-600 hover:border-amber hover:bg-amber/5'
                    }`}
                  >
                    <span className="block text-sm font-bold text-ink">{opt.label}</span>
                    <span className="mt-0.5 block text-xs text-ink-dim">{opt.blurb}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden sm:block sm:w-56">
            <RatingRadar ratings={preview.ratings} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
