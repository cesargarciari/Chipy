import type { PendingDecision } from '@chipy/engine';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PerksDrawer } from './PerksDrawer.js';

type PerkShop = NonNullable<NonNullable<PendingDecision['season']>['shop']>;
type PerkItem = PerkShop['items'][number];

const item = (over: Partial<PerkItem>): PerkItem => ({
  choiceId: 'buy_shooting_trainer',
  perkId: 'shooting_trainer',
  name: 'Shooting trainer',
  blurb: 'Reps before and after practice.',
  category: 'training',
  kind: 'yearly',
  cost: 2,
  owned: false,
  affordable: true,
  highlight: ['threePoint'],
  tags: ['+3PT growth'],
  ...over,
});

const shop: PerkShop = {
  nodeId: 'perks5',
  bank: 6.4,
  items: [
    item({}),
    item({
      choiceId: 'buy_private_chef',
      perkId: 'private_chef',
      name: 'Private chef',
      owned: true,
      affordable: false,
    }),
    item({
      choiceId: 'buy_home_gym',
      perkId: 'home_gym',
      name: 'Home gym complex',
      cost: 18,
      affordable: false,
    }),
  ],
};

describe('<PerksDrawer />', () => {
  it('is collapsed by default, then shows the bank and every perk', async () => {
    render(<PerksDrawer shop={shop} onBuy={() => {}} />);
    expect(screen.queryByText('Shooting trainer')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /perks shop/i }));
    expect(screen.getByRole('dialog', { name: 'Perks shop' })).toBeInTheDocument();
    // bank shown in the header, no minus sign anywhere on the price
    expect(screen.getAllByText('$6.4M').length).toBeGreaterThan(0);
    expect(screen.getByText('Shooting trainer')).toBeInTheDocument();
    expect(screen.getByText('Private chef')).toBeInTheDocument();
    expect(screen.getByText('Home gym complex')).toBeInTheDocument();
    expect(screen.queryByText('−$2M')).not.toBeInTheDocument();
  });

  it('buys an affordable perk against the perks node id', async () => {
    const onBuy = vi.fn();
    render(<PerksDrawer shop={shop} onBuy={onBuy} />);
    await userEvent.click(screen.getByRole('button', { name: /perks shop/i }));
    await userEvent.click(screen.getByRole('button', { name: /shooting trainer/i }));
    expect(onBuy).toHaveBeenCalledWith('buy_shooting_trainer');
  });

  it('deactivates owned and unaffordable perks', async () => {
    const onBuy = vi.fn();
    render(<PerksDrawer shop={shop} onBuy={onBuy} />);
    await userEvent.click(screen.getByRole('button', { name: /perks shop/i }));

    const owned = screen.getByRole('button', { name: /private chef/i });
    const tooDear = screen.getByRole('button', { name: /home gym complex/i });
    expect(owned).toBeDisabled();
    expect(tooDear).toBeDisabled();

    await userEvent.click(owned);
    await userEvent.click(tooDear);
    expect(onBuy).not.toHaveBeenCalled();
  });
});
