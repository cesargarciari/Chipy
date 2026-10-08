import type { PendingDecision } from '@chipy/engine';
import type { CSSProperties } from 'react';
import { ChoiceCard } from '../../components/ChoiceCard.js';
import { ChoiceGrid, DEAL_START, Stage } from './Stage.js';

type CollegeYearData = NonNullable<PendingDecision['collegeYear']>;

const COLLEGE_YEAR_LABEL = ['', 'Freshman', 'Sophomore', 'Junior'] as const;
const ACADEMY_YEAR_LABEL = ['', 'First', 'Second', 'Third'] as const;

/** "Freshman year" at a college, "Second season" at an overseas academy. */
export function collegeYearLabel(year: CollegeYearData): string {
  const n = year.recap.year;
  return year.tier === 'overseas'
    ? `${ACADEMY_YEAR_LABEL[n] ?? `Year ${n}`} season`
    : `${COLLEGE_YEAR_LABEL[n] ?? `Year ${n}`} year`;
}

export function CollegeYear({
  year,
  onChoose,
}: {
  year: CollegeYearData;
  onChoose: (choiceId: string) => void;
}) {
  const { recap, options } = year;
  const s = recap.stats;

  return (
    <Stage title={recap.school.toUpperCase()} prompt={recap.headline}>
      <div
        className="enter border-b border-ink/8 pb-9"
        style={{ '--i': DEAL_START } as CSSProperties}
      >
        <dl className="grid max-w-md grid-cols-4 gap-4">
          {(
            [
              ['PPG', s.ppg],
              ['RPG', s.rpg],
              ['APG', s.apg],
              ['FG%', (s.fgPct * 100).toFixed(0)],
            ] as const
          ).map(([label, val]) => (
            <div key={label}>
              <dt className="t-label">{label}</dt>
              <dd className="t-num mt-1.5 text-[1.75rem] leading-none text-ink">{val}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-accent-ink">{recap.result}</p>
      </div>

      <div className="mt-9">
        <ChoiceGrid>
          {options.map((o, i) => (
            <ChoiceCard
              key={o.id}
              index={DEAL_START + 1 + i}
              title={o.label}
              description={o.blurb}
              effects={o.effects}
              tag={o.tag}
              watermark={o.watermark}
              onClick={() => onChoose(o.id)}
            />
          ))}
        </ChoiceGrid>
      </div>
    </Stage>
  );
}
