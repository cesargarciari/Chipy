import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChoiceCard } from './ChoiceCard.js';

describe('<ChoiceCard />', () => {
  it('renders title, blurb, effect chips and watermark', () => {
    render(
      <ChoiceCard
        title="BOX KILLER"
        description="You live off buckets."
        effects={[
          { key: 'finishing', label: 'FINISHING', short: 'FIN', delta: 8 },
          { key: 'hype', label: 'FAME', short: 'FAME', delta: -2 },
        ]}
        tag="Scoring focus"
        watermark="FIN"
        onClick={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { name: 'BOX KILLER' })).toBeInTheDocument();
    expect(screen.getByText('You live off buckets.')).toBeInTheDocument();
    expect(screen.getByText('+8')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
    expect(screen.getByText('FINISHING')).toBeInTheDocument();
    expect(screen.getByText('Scoring focus')).toBeInTheDocument();
    expect(screen.getByText('FIN', { selector: 'span[aria-hidden]' })).toBeInTheDocument();
  });

  it('merges perimeter + interior defense chips into one DEFENSE chip', () => {
    render(
      <ChoiceCard
        title="LOCKDOWN"
        description="Guard everyone."
        effects={[
          { key: 'perimeterDefense', label: 'PERIMETER D', short: 'DEF', delta: 5 },
          { key: 'interiorDefense', label: 'INTERIOR D', short: 'RIM', delta: 3 },
        ]}
        onClick={() => {}}
      />,
    );
    expect(screen.getByText('DEFENSE')).toBeInTheDocument();
    expect(screen.getByText('+8')).toBeInTheDocument();
    expect(screen.queryByText('PERIMETER D')).not.toBeInTheDocument();
  });

  it('renders a money chip as a dollar figure and reports hovered stat keys', async () => {
    const onHoverKeys = vi.fn();
    render(
      <ChoiceCard
        title="APEX"
        description="The giant."
        effects={[
          { key: 'money', label: 'MONEY', short: '$', delta: 25 },
          { key: 'hype', label: 'FAME', short: 'FAME', delta: 6 },
        ]}
        onHoverKeys={onHoverKeys}
        onClick={() => {}}
      />,
    );
    expect(screen.getByText('+$25M')).toBeInTheDocument();
    await userEvent.hover(screen.getByRole('button'));
    expect(onHoverKeys).toHaveBeenCalledWith(['hype']); // money key filtered out
    await userEvent.unhover(screen.getByRole('button'));
    expect(onHoverKeys).toHaveBeenCalledWith(null);
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<ChoiceCard title="X" description="y" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
