import type { CareerMomentDto } from '@chipy/shared';
import { MomentCard } from '../../components/MomentCard.js';

/**
 * The stack of big beats from the season that just ended, shown at the top of
 * the next season screen. Purely presentational - clears itself next season.
 */
export function MomentsBanner({ moments }: { moments: CareerMomentDto[] }) {
  if (moments.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold uppercase tracking-widest text-amber">
        {moments.length === 1 ? 'That season' : 'That season · a lot happened'}
      </div>
      {moments.map((m, i) => (
        <MomentCard key={`${m.id}-${i}`} moment={m} />
      ))}
    </div>
  );
}
