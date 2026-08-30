import type { CareerSummaryDto } from '@chipy/shared';
import { IdolatryBar } from '../../components/IdolatryBar.js';
import { countryName, teamName } from '../../lib/format.js';

type Standing = CareerSummaryDto['franchises'][number];
type National = CareerSummaryDto['nationalTeam'];

/**
 * "Idolatry" - how beloved you are, club by club and with the national team.
 * Each is a progress bar toward legend.
 */
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
    <div className="space-y-4">
      <h3 className="font-bold">Idolatry</h3>

      {clubs.length > 0 && (
        <div className="space-y-3">
          {clubs.map((f) => (
            <IdolatryBar
              key={f.teamId}
              label={teamName(f.teamId)}
              tier={f.tier}
              progress={f.progress}
              detail={`${f.seasons} ${f.seasons === 1 ? 'season' : 'seasons'}${
                f.rings > 0 ? ` · ${f.rings}× 🏆` : ''
              }`}
            />
          ))}
        </div>
      )}

      {nationalTeam.tier !== 'none' && (
        <IdolatryBar
          label={`${countryName(nationalTeam.country)} - national team`}
          tier={nationalTeam.tier}
          progress={nationalTeam.progress}
          detail={`${nationalTeam.caps} ${nationalTeam.caps === 1 ? 'call-up' : 'call-ups'}${
            nationalTeam.medals > 0 ? ` · ${nationalTeam.medals}× 🥇` : ''
          }`}
        />
      )}
    </div>
  );
}
