import {
  COUNTRIES,
  MARKETS,
  POSITIONS,
  archetypesFor,
  playerProfileSchema,
  randomSeed,
  type ArchetypeId,
  type Position,
} from '@chipy/engine';
import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn.js';
import { firstFriendlyError } from '../../lib/validation.js';
import { Button } from '../../components/ui/button.js';
import { Card, CardBody, CardTitle } from '../../components/ui/card.js';
import { useCareerRun } from '../../store/career.js';

export function CreatePlayer() {
  const navigate = useNavigate();
  const start = useCareerRun((s) => s.start);

  const [name, setName] = useState('');
  const [position, setPosition] = useState<Position>('PG');
  const [archetype, setArchetype] = useState<ArchetypeId>(archetypesFor('PG')[0]!.id);
  const [jerseyNumber, setJerseyNumber] = useState(() => 1 + Math.floor(randomSeed() % 30));
  const [country, setCountry] = useState('USA');
  const [handedness, setHandedness] = useState<'left' | 'right'>('right');
  const [error, setError] = useState<{ field: string; message: string } | null>(null);

  const archetypes = useMemo(() => archetypesFor(position), [position]);

  function pickPosition(p: Position) {
    setPosition(p);
    setArchetype(archetypesFor(p)[0]!.id); // archetypes are position-locked
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Home market is no longer a player choice — it's rolled with the career.
    const market = MARKETS[Math.floor(randomSeed() % MARKETS.length)]!;
    const parsed = playerProfileSchema.safeParse({
      name,
      position,
      archetype,
      market,
      jerseyNumber,
      country,
      handedness,
    });
    if (!parsed.success) {
      setError(firstFriendlyError(parsed.error));
      return;
    }
    start(parsed.data);
    navigate('/play');
  }

  return (
    <Card>
      <CardBody>
        <CardTitle>Create your prospect</CardTitle>
        <form className="mt-6 space-y-6" onSubmit={onSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-wide text-ink-dim">Name</span>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error?.field === 'name') setError(null);
                }}
                placeholder="e.g. Marcus Vale"
                className={cn(
                  'w-full rounded-lg border bg-court-800 px-3 py-2.5 text-ink outline-none focus:border-amber',
                  error?.field === 'name' ? 'border-rose-500' : 'border-court-600',
                )}
                maxLength={24}
                aria-label="Name"
              />
              {error?.field === 'name' && (
                <span className="text-xs text-rose-400">{error.message}</span>
              )}
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-wide text-ink-dim">Jersey #</span>
              <input
                type="number"
                min={0}
                max={99}
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(Math.max(0, Math.min(99, Number(e.target.value))))}
                className="w-20 rounded-lg border border-court-600 bg-court-800 px-3 py-2.5 text-center text-ink outline-none focus:border-amber"
                aria-label="Jersey number"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-wide text-ink-dim">Born in</span>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-court-600 bg-court-800 px-3 py-2.5 text-ink outline-none focus:border-amber"
                aria-label="Country"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-1.5">
              <span className="text-xs uppercase tracking-wide text-ink-dim">Shooting hand</span>
              <div className="flex gap-2">
                {(['left', 'right'] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHandedness(h)}
                    className={cn(
                      'rounded-lg border px-4 py-2.5 text-sm font-semibold capitalize transition-colors',
                      h === handedness
                        ? 'border-amber bg-amber/10 text-ink'
                        : 'border-court-600 text-ink-dim hover:text-ink',
                    )}
                  >
                    {h === 'left' ? 'Lefty' : 'Righty'}
                  </button>
                ))}
              </div>
            </div>
          </div>

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

          {error && error.field !== 'name' && (
            <p className="text-sm text-rose-400">{error.message}</p>
          )}

          <Button type="submit" size="lg" className="w-full">
            Enter the summer circuit
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
