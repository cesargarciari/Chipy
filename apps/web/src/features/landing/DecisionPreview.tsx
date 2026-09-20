/**
 * A static illustration of what one in-career decision looks like, styled
 * after ScenarioFrame but never wired to real choices. Rows render as plain
 * divs (not buttons) so nothing here reads as clickable - it is a preview,
 * not a control.
 */
const OPTIONS = [
  { label: 'Chase the bag', blurb: 'Different city, four more years guaranteed.' },
  { label: 'Chase the ring', blurb: 'Half the money, one shot at history.' },
  { label: 'Bet on yourself', blurb: 'One more prove it year in the jersey you know.' },
];

export function DecisionPreview() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-court-700 bg-court-900">
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber to-transparent" />
      <div className="space-y-4 p-5">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber">
            Offseason, year 4
          </div>
          <h3 className="mt-1 font-display text-2xl italic leading-tight tracking-wide text-ink">
            Two offers, one summer
          </h3>
          <p className="mt-1 text-sm text-ink-dim">
            A rebuilding team offers the max. The champs offer a ring and a pay cut.
          </p>
        </div>
        <div className="space-y-2">
          {OPTIONS.map((option) => (
            <div
              key={option.label}
              className="flex items-start gap-3 border border-court-700 bg-court-950/40 p-3"
            >
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-court-600" />
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-ink">
                  {option.label}
                </div>
                <div className="text-xs text-ink-dim">{option.blurb}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
