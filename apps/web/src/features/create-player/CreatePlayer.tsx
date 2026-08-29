import {
  MARKETS,
  POSITIONS,
  archetypesFor,
  playerProfileSchema,
  type ArchetypeId,
  type Market,
  type Position,
} from '@chipy/engine';
import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn.js';
import { Button } from '../../components/ui/button.js';
import { Card, CardBody, CardTitle } from '../../components/ui/card.js';
import { useCareerRun } from '../../store/career.js';

const MARKET_LABELS: Record<Market, string> = {
  small: 'Small market',
  mid: 'Mid market',
  large: 'Large market',
};

export function CreatePlayer() {
  const navigate = useNavigate();
  const start = useCareerRun((s) => s.start);

  const [name, setName] = useState('');
  const [position, setPosition] = useState<Position>('PG');
  const [archetype, setArchetype] = useState<ArchetypeId>(archetypesFor('PG')[0]!.id);
  const [market, setMarket] = useState<Market>('mid');
  const [error, setError] = useState<string | null>(null);

  const archetypes = useMemo(() => archetypesFor(position), [position]);

  function pickPosition(p: Position) {
    setPosition(p);
    setArchetype(archetypesFor(p)[0]!.id); // reset — archetypes are position-locked
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = playerProfileSchema.safeParse({ name, position, archetype, market });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your inputs');
      return;
    }
    start(parsed.data);
    navigate('/play');
  }

  return (
    <Card>
      <CardBody>
        <CardTitle>Create your prospect</CardTitle>
        <form className="mt-6 space-y-6" onSubmit={onSubmit}>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-ink-dim">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marcus Vale"
              className="w-full rounded-lg border border-court-600 bg-court-800 px-3 py-2.5 text-ink outline-none focus:border-amber"
              maxLength={24}
              aria-label="Name"
            />
          </label>

          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-ink-dim">Position</span>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => pickPosition(p)}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
                    p === position
                      ? 'border-amber bg-amber/10 text-ink'
                      : 'border-court-600 text-ink-dim hover:text-ink',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wide text-ink-dim">
              Archetype ({position})
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              {archetypes.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setArchetype(a.id)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-colors',
                    a.id === archetype
                      ? 'border-amber bg-amber/5'
                      : 'border-court-600 hover:border-court-500',
                  )}
                >
                  <span className="block text-sm font-bold text-ink">{a.label}</span>
                  <span className="mt-0.5 block text-xs text-amber-soft">{a.comps}</span>
                  <span className="mt-1 block text-xs text-ink-dim">{a.blurb}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-ink-dim">Home market</span>
            <div className="flex flex-wrap gap-2">
              {MARKETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMarket(m)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm transition-colors',
                    m === market
                      ? 'border-amber bg-amber/10 text-ink'
                      : 'border-court-600 text-ink-dim hover:text-ink',
                  )}
                >
                  {MARKET_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <Button type="submit" size="lg" className="w-full">
            Enter the summer circuit
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
