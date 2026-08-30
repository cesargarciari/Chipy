import type { PendingDecision } from '@chipy/engine';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { Card, CardBody } from '../../components/ui/card.js';

const COLLEGE_YEAR_LABEL = ['', 'Freshman', 'Sophomore', 'Junior'] as const;
const ACADEMY_YEAR_LABEL = ['', 'First', 'Second', 'Third'] as const;

export function CollegeYear({
  year,
  onChoose,
}: {
  year: NonNullable<PendingDecision['collegeYear']>;
  onChoose: (choiceId: string) => void;
}) {
  const { recap, options, tier } = year;
  const s = recap.stats;
  const academy = tier === 'overseas';
  const yearLabel = academy
    ? (ACADEMY_YEAR_LABEL[recap.year] ?? `Year ${recap.year}`)
    : (COLLEGE_YEAR_LABEL[recap.year] ?? `Year ${recap.year}`);

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl">{recap.school.toUpperCase()}</h2>
            <span className="text-xs uppercase tracking-wide text-ink-dim">
              {yearLabel} {academy ? 'season' : 'year'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ['PPG', s.ppg],
              ['RPG', s.rpg],
              ['APG', s.apg],
              ['FG%', (s.fgPct * 100).toFixed(0)],
            ].map(([label, val]) => (
              <div key={label} className="rounded-lg bg-court-800 py-2">
                <div className="font-display text-xl leading-none tabular-nums">{val}</div>
                <div className="text-[10px] uppercase tracking-wide text-ink-dim">{label}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-amber">{recap.result}</p>
          <p className="text-sm text-ink-dim">{recap.headline}</p>
        </CardBody>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((o) => (
          <ChoiceCard
            key={o.id}
            title={o.label}
            description={o.blurb}
            effects={o.effects}
            tag={o.tag}
            watermark={o.watermark}
            onClick={() => onChoose(o.id)}
          />
        ))}
      </div>
    </div>
  );
}
