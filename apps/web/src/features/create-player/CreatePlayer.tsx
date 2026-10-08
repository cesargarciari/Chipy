import {
  COUNTRIES,
  MARKETS,
  POSITIONS,
  archetypesFor,
  getArchetype,
  getCountry,
  playerProfileSchema,
  randomSeed,
  type ArchetypeId,
  type Position,
} from '@chipy/engine';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button.js';
import { SURFACE } from '../../components/ui/card.js';
import { cn } from '../../lib/cn.js';
import { useT } from '../../lib/i18n.js';
import { firstFriendlyError } from '../../lib/validation.js';
import { useCareerRun } from '../../store/career.js';

const FIELD =
  'h-13 w-full rounded-2xl bg-raised px-4 text-[1.0625rem] text-ink inset-ring inset-ring-ink/10 ' +
  'outline-none transition-shadow duration-200 placeholder:text-ink/60 hover:inset-ring-ink/20 ' +
  'focus:inset-ring-2 focus:inset-ring-accent';

export function CreatePlayer() {
  const navigate = useNavigate();
  const t = useT();
  const start = useCareerRun((s) => s.start);

  const [name, setName] = useState('');
  const [position, setPosition] = useState<Position>('PG');
  const [archetype, setArchetype] = useState<ArchetypeId>(archetypesFor('PG')[0]!.id);
  // Defaults to 0. An empty field counts as 0.
  const [jersey, setJersey] = useState('0');
  const jerseyNumber =
    jersey === '' ? 0 : Math.max(0, Math.min(99, Math.trunc(Number(jersey) || 0)));
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
    // Home market is picked at random.
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

  const preview = {
    name: name.trim() || t.createPlayer.previewName,
    number: jerseyNumber,
    position,
    archetype: getArchetype(archetype).label,
    country: getCountry(country),
  };

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-20 lg:pt-14">
      <div className="min-w-0">
        <h1 className="enter t-title" style={{ '--i': 0 } as CSSProperties}>
          {t.createPlayer.title}
        </h1>
        <p
          className="enter t-lead mt-4 max-w-[46ch] text-ink/65"
          style={{ '--i': 1 } as CSSProperties}
        >
          {t.createPlayer.lead}
        </p>

        <div className="enter mt-8 lg:hidden" style={{ '--i': 2 } as CSSProperties}>
          <JerseyPreview {...preview} compact />
        </div>

        <form
          className="enter mt-10 space-y-9"
          style={{ '--i': 2 } as CSSProperties}
          onSubmit={onSubmit}
          noValidate
        >
          <div className="grid grid-cols-[1fr_6.5rem] gap-3 sm:gap-4">
            <label className="block">
              <FieldLabel>{t.createPlayer.name}</FieldLabel>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error?.field === 'name') setError(null);
                }}
                placeholder={t.createPlayer.namePlaceholder}
                className={cn(FIELD, error?.field === 'name' && 'inset-ring-2 inset-ring-down')}
                maxLength={24}
                aria-label="Name"
                aria-invalid={error?.field === 'name' || undefined}
              />
              {error?.field === 'name' && (
                <span className="mt-2 block text-sm text-down">{error.message}</span>
              )}
            </label>

            <label className="block">
              <FieldLabel>{t.createPlayer.jersey}</FieldLabel>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                value={jersey}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') return setJersey('');
                  const n = Math.trunc(Number(v));
                  if (Number.isFinite(n)) setJersey(String(Math.max(0, Math.min(99, n))));
                }}
                onBlur={() => {
                  if (jersey === '') setJersey('0');
                }}
                className={cn(
                  FIELD,
                  't-num text-center text-xl [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                )}
                aria-label="Jersey number"
              />
            </label>
          </div>

          <div className="grid gap-9 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
            <label className="block">
              <FieldLabel>{t.createPlayer.bornIn}</FieldLabel>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={cn(FIELD, 'cursor-pointer appearance-none pr-11')}
                  aria-label="Country"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60"
                />
              </div>
            </label>

            <div>
              <FieldLabel>{t.createPlayer.shootingHand}</FieldLabel>
              <Segmented>
                {(['left', 'right'] as const).map((h) => (
                  <SegmentButton key={h} on={h === handedness} onClick={() => setHandedness(h)}>
                    {h === 'left' ? t.createPlayer.lefty : t.createPlayer.righty}
                  </SegmentButton>
                ))}
              </Segmented>
            </div>
          </div>

          {/* Position and archetype sit together, since the archetypes depend on the position. */}
          <div className="space-y-6">
            <div>
              <FieldLabel>{t.createPlayer.position}</FieldLabel>
              <Segmented>
                {POSITIONS.map((p) => (
                  <SegmentButton key={p} on={p === position} onClick={() => pickPosition(p)}>
                    {p}
                  </SegmentButton>
                ))}
              </Segmented>
            </div>

            <div>
              <FieldLabel>{t.createPlayer.archetypeLabel(position)}</FieldLabel>
              <div key={position} className="grid gap-2 sm:grid-cols-2">
                {archetypes.map((a, i) => (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={a.id === archetype}
                    onClick={() => setArchetype(a.id)}
                    style={{ '--i': i } as CSSProperties}
                    className={cn(
                      'enter rounded-2xl p-4 text-left [--blur:4px] [--rise:6px] transition-[background-color,box-shadow,scale] duration-200 active:scale-[.985]',
                      a.id === archetype
                        ? 'bg-accent/7 inset-ring-2 inset-ring-accent'
                        : 'bg-ink/4 hover:bg-ink/7',
                    )}
                  >
                    <span className="block font-medium text-ink">{a.label}</span>
                    <span className="mt-0.5 block text-[0.8125rem] text-ink/60">{a.comps}</span>
                    <span className="mt-2 block text-sm leading-snug text-ink/65">{a.blurb}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && error.field !== 'name' && <p className="text-sm text-down">{error.message}</p>}

          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {t.createPlayer.submit}
          </Button>
        </form>
      </div>

      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <div className="enter" style={{ '--i': 2 } as CSSProperties}>
          <JerseyPreview {...preview} />
        </div>
      </aside>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-2.5 block text-sm text-ink/65">{children}</span>;
}

function Segmented({ children }: { children: ReactNode }) {
  return <div className="flex gap-1 rounded-full bg-ink/5 p-1">{children}</div>;
}

function SegmentButton({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'h-11 min-w-12 flex-1 rounded-full px-4 text-[0.9375rem] transition-[background-color,color,box-shadow] duration-200',
        on ? 'bg-float text-ink shadow-lift' : 'text-ink/60 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

/** The back of the jersey: the name across the shoulders, the number below, updating as you type. */
function JerseyPreview({
  name,
  number,
  position,
  archetype,
  country,
  compact = false,
}: {
  name: string;
  number: number;
  position: string;
  archetype: string;
  country: { flag: string; name: string };
  compact?: boolean;
}) {
  const fontSize = Math.min(40, 560 / Math.max(8, name.length));
  return (
    <div
      aria-hidden
      className={cn(
        SURFACE,
        'relative overflow-hidden rounded-sheet text-center',
        compact ? 'flex items-center gap-5 px-6 py-5 text-left' : 'px-8 pb-9 pt-8',
      )}
    >
      {compact ? (
        <>
          <span
            key={number}
            className="enter t-num text-[4.5rem] leading-[0.8] text-ink [--rise:8px]"
          >
            {number}
          </span>
          <span className="min-w-0">
            <span className="t-jersey block truncate text-2xl text-ink">{name}</span>
            <span className="mt-1.5 block text-sm text-ink/60">
              {position}, {archetype}
            </span>
          </span>
        </>
      ) : (
        <>
          <svg viewBox="0 0 400 110" className="mx-auto w-full overflow-visible text-ink">
            <path id="jersey-arch" d="M 20 96 Q 200 34 380 96" fill="none" />
            <text
              className="t-jersey fill-current tracking-[0.08em]"
              style={{ fontSize }}
              textAnchor="middle"
            >
              <textPath href="#jersey-arch" startOffset="50%">
                {name}
              </textPath>
            </text>
          </svg>
          <p
            key={number}
            className="enter t-num -mt-2 text-[10rem] leading-[0.82] text-ink [--rise:10px]"
          >
            {number}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-1.5">
            <span className="inline-flex h-7 items-center rounded-full bg-ink/6 px-3 text-xs text-ink/75">
              {position}
            </span>
            <span className="inline-flex h-7 items-center rounded-full bg-accent/14 px-3 text-xs text-accent-ink">
              {archetype}
            </span>
          </div>
          <p className="mt-4 text-sm text-ink/60">
            {country.flag} {country.name}
          </p>
        </>
      )}
    </div>
  );
}
