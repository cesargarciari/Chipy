import { runCareer, type CareerSummary, type PlayerProfile } from '@chipy/engine';
import { careerSummarySchema } from '@chipy/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LegacyCard } from './LegacyCard.js';

function autoPlay(seed: string, profile: PlayerProfile): CareerSummary {
  const choices: Array<{ nodeId: string; choiceId: string }> = [];
  for (let i = 0; i < 120; i += 1) {
    const res = runCareer({ seed, profile, choices });
    if (res.status === 'complete') return res.summary;
    const p = res.pending;
    const opts =
      p.kind === 'prologue'
        ? p.prologue!.choices.map((c) => c.id)
        : p.kind === 'landing'
          ? p.landing!.offers.map((o) => o.choiceId)
          : p.season!.decision.options.map((o) => o.id);
    choices.push({ nodeId: p.nodeId, choiceId: opts.find((o) => o !== 'retire') ?? opts[0]! });
  }
  throw new Error('no finish');
}

const summary = careerSummarySchema.parse(
  autoPlay('legacy-ui', {
    name: 'Jordan Reyes',
    position: 'C',
    archetype: 'back_to_basket_hub',
    market: 'large',
  }),
);

describe('<LegacyCard />', () => {
  it('shows the player, legacy grade, and trophy case', () => {
    render(<LegacyCard summary={summary} />);
    expect(screen.getByRole('heading', { name: 'Jordan Reyes' })).toBeInTheDocument();
    expect(screen.getByText(`${summary.legacy.score} legacy`)).toBeInTheDocument();
    expect(screen.getByText('Trophy case')).toBeInTheDocument();
    expect(screen.getByText(/Season by season \(\d+\)/)).toBeInTheDocument();
  });

  it('renders career calls only when choiceStats are provided', () => {
    const { rerender } = render(<LegacyCard summary={summary} />);
    expect(screen.queryByText('Career-defining calls')).not.toBeInTheDocument();

    rerender(
      <LegacyCard
        summary={summary}
        choiceStats={[
          {
            nodeId: 'highschool',
            choiceId: 'skills_camp',
            label: 'Grind the skills-camp circuit',
            count: 2,
            pct: 40,
          },
        ]}
      />,
    );
    expect(screen.getByText('Career-defining calls')).toBeInTheDocument();
    expect(screen.getByText('40% of players')).toBeInTheDocument();
  });

  it('copies the share link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<LegacyCard summary={summary} shareUrl="https://chipy.test/c/abcdefghijkl" />);
    await userEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(writeText).toHaveBeenCalledWith('https://chipy.test/c/abcdefghijkl');
  });
});
