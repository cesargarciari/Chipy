import type { CareerMomentDto } from '@chipy/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MomentModal, isHeadlineMoment } from './MomentModal.js';

const moment = (over: Partial<CareerMomentDto>): CareerMomentDto => ({
  seasonIndex: 4,
  kind: 'award',
  id: 'mvp',
  awardId: 'mvp',
  title: 'MOST VALUABLE PLAYER',
  subtitle: 'Age 25 · Denver Nuggets · your first',
  teamId: 'DEN',
  ...over,
});

describe('isHeadlineMoment', () => {
  it('flags MVP / DPOY / rings, not trades or all-NBA', () => {
    expect(isHeadlineMoment(moment({ awardId: 'mvp' }))).toBe(true);
    expect(isHeadlineMoment(moment({ awardId: 'dpoy' }))).toBe(true);
    expect(isHeadlineMoment(moment({ kind: 'ring', awardId: 'champion' }))).toBe(true);
    expect(isHeadlineMoment(moment({ kind: 'award', awardId: 'all_nba_1' }))).toBe(false);
    expect(isHeadlineMoment(moment({ kind: 'trade', awardId: undefined }))).toBe(false);
  });
});

describe('<MomentModal />', () => {
  it('renders nothing when there are no headline moments', () => {
    const { container } = render(<MomentModal moments={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('steps through each moment then calls onDone', async () => {
    const onDone = vi.fn();
    render(
      <MomentModal
        moments={[
          moment({ title: 'MVP' }),
          moment({ awardId: 'champion', kind: 'ring', title: 'CHAMPION' }),
        ]}
        onDone={onDone}
      />,
    );
    expect(screen.getByRole('dialog', { name: 'MVP' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('dialog', { name: 'CHAMPION' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onDone).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
