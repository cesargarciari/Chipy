import type { CareerSummaryDto } from '@chipy/shared';
import { IdolatryBar } from '../../components/IdolatryBar.js';
import { countryName, teamName } from '../../lib/format.js';

type Standing = CareerSummaryDto['franchises'][number];
type National = CareerSummaryDto['nationalTeam'];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** How much each team and your country love you. */
export function FranchiseStandings({
  franchises,
  nationalTeam,
}: {
  franchises: Standing[];
  nationalTeam: National;
}) {
  const clubs = franchises.filter((f) => f.tier !== 'none').slice(0, 5);
  if (clubs.length === 0 && nationalTeam.tier === 'none') return null;

  return (
    <div className="space-y-6">
      <h3 className="text-[1.0625rem] text-ink">Idolatry</h3>

      {clubs.length > 0 && (
        <div className="space-y-5">
          {clubs.map((f) => (
            <IdolatryBar
              key={f.teamId}
              label={teamName(f.teamId)}
              tier={f.tier}
              progress={f.progress}
              detail={[
                plural(f.seasons, 'season', 'seasons'),
                f.rings > 0 ? plural(f.rings, 'ring', 'rings') : null,
              ]
                .filter(Boolean)
                .join(', ')}
            />
          ))}
        </div>
      )}

      {nationalTeam.tier !== 'none' && (
        <IdolatryBar
          label={`${countryName(nationalTeam.country)} national team`}
          tier={nationalTeam.tier}
          progress={nationalTeam.progress}
          detail={[
            plural(nationalTeam.caps, 'call-up', 'call-ups'),
            nationalTeam.medals > 0 ? plural(nationalTeam.medals, 'medal', 'medals') : null,
          ]
            .filter(Boolean)
            .join(', ')}
        />
      )}
    </div>
  );
}
