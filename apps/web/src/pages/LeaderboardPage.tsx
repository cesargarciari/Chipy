import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { cn } from '../lib/cn.js';
import { GRADE_TONE, LEGACY_TIER_LABELS, archetypeLabel, moneyM } from '../lib/format.js';

export function LeaderboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.leaderboard({ limit: 25 }),
    retry: 1,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-8 sm:px-6 lg:pt-14">
      <h1 className="enter t-title max-w-[18ch]">This month&apos;s greatest careers.</h1>

      <div className="mt-12">
        {isLoading && <p className="animate-pulse text-ink/60">Loading…</p>}
        {isError && (
          <p className="t-lead text-ink/65">
            The leaderboard is offline right now. Try again later.
          </p>
        )}
        {data && data.entries.length === 0 && (
          <p className="t-lead text-ink/65">No careers yet this month. Be the first.</p>
        )}

        {data && data.entries.length > 0 && (
          <ol className="border-t border-ink/10">
            {data.entries.map((entry, i) => (
              <li
                key={entry.id}
                className="enter border-b border-ink/8 [--blur:4px] [--rise:8px]"
                style={{ '--i': Math.min(i, 8) + 1 } as CSSProperties}
              >
                <Link
                  to={`/c/${entry.id}`}
                  className="group -mx-3 flex items-center gap-4 rounded-2xl px-3 py-4 transition-colors hover:bg-ink/4"
                >
                  <span className="t-num w-7 text-right text-ink/60">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="t-jersey block truncate text-xl text-ink">{entry.name}</span>
                    <span className="mt-1 block truncate text-sm text-ink/60">
                      {entry.position}, {archetypeLabel(entry.archetype)}
                      <span className="hidden md:inline">
                        . {LEGACY_TIER_LABELS[entry.legacyTier]}
                      </span>
                    </span>
                  </span>
                  {entry.rings > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm text-gold">
                      <Trophy size={13} strokeWidth={2} aria-hidden />
                      <span className="t-num">{entry.rings}</span>
                      <span className="sr-only">rings</span>
                    </span>
                  )}
                  <span className="t-num hidden w-16 text-right text-sm text-ink/60 sm:inline">
                    {moneyM(entry.earnings)}
                  </span>
                  <span
                    className={cn('t-num w-6 text-center text-xl', GRADE_TONE[entry.legacyGrade])}
                  >
                    {entry.legacyGrade}
                  </span>
                  <span className="t-num w-14 text-right text-lg text-ink">
                    {entry.legacyScore}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
