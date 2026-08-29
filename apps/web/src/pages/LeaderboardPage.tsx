import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardTitle } from '../components/ui/card.js';
import { api } from '../lib/api.js';
import { GRADE_TONE, LEGACY_TIER_LABELS, archetypeLabel } from '../lib/format.js';

export function LeaderboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.leaderboard({ limit: 25 }),
    retry: 1,
  });

  return (
    <Card>
      <CardBody className="space-y-4">
        <CardTitle>This month&apos;s greatest careers</CardTitle>

        {isLoading && <p className="text-sm text-ink-dim">Loading…</p>}
        {isError && (
          <p className="text-sm text-ink-dim">
            Leaderboard is offline right now. Start the API to see rankings.
          </p>
        )}
        {data && data.entries.length === 0 && (
          <p className="text-sm text-ink-dim">No careers yet this month — be the first.</p>
        )}

        {data && data.entries.length > 0 && (
          <ol className="divide-y divide-court-800">
            {data.entries.map((entry, i) => (
              <li key={entry.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="w-6 text-right font-mono text-ink-dim">{i + 1}</span>
                <Link
                  to={`/c/${entry.id}`}
                  className="min-w-0 flex-1 truncate font-semibold hover:text-amber"
                >
                  {entry.name}
                </Link>
                <span className="hidden text-ink-dim sm:inline">
                  {entry.position} · {archetypeLabel(entry.archetype)}
                </span>
                <span className="hidden text-xs text-ink-dim md:inline">
                  {LEGACY_TIER_LABELS[entry.legacyTier]}
                </span>
                {entry.rings > 0 && <span className="text-xs text-amber">{entry.rings}× 🏆</span>}
                <span className={`w-5 text-center font-black ${GRADE_TONE[entry.legacyGrade]}`}>
                  {entry.legacyGrade}
                </span>
                <span className="w-12 text-right font-mono tabular-nums">{entry.legacyScore}</span>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
