import { RATING_KEYS, type Ratings } from '@chipy/engine';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DISPLAY_AXES } from '../lib/ratings.js';
import { RatingStrip } from './RatingStrip.js';

const ratings = RATING_KEYS.reduce((acc, k, i) => {
  acc[k] = 50 + i;
  return acc;
}, {} as Ratings);

describe('<RatingStrip />', () => {
  it('renders one tile per display axis (defense merged) plus ATH and DUR', () => {
    render(<RatingStrip ratings={ratings} athleticism={77} durability={64} />);
    expect(screen.getByText('77')).toBeInTheDocument();
    expect(screen.getByText('64')).toBeInTheDocument();
    expect(screen.getByText('DEFENSE')).toBeInTheDocument();
    expect(screen.queryByText('PERIMETER D')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(DISPLAY_AXES.length + 2);
  });

  it('lights highlighted tiles gold, mapping either defense key to DEFENSE', () => {
    render(
      <RatingStrip
        ratings={ratings}
        athleticism={77}
        durability={64}
        highlight={['perimeterDefense', 'durability']}
      />,
    );
    const def = screen.getByText('DEFENSE').closest('[role="listitem"]');
    const dur = screen.getByText('DURABILITY').closest('[role="listitem"]');
    const iq = screen.getByText('BASKETBALL IQ').closest('[role="listitem"]');
    expect(def?.className).toContain('border-amber');
    expect(dur?.className).toContain('border-amber');
    expect(iq?.className).not.toContain('border-amber');
  });
});
