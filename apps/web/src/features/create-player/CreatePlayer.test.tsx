import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CreatePlayer } from './CreatePlayer.js';

function renderScreen() {
  return render(
    <MemoryRouter>
      <CreatePlayer />
    </MemoryRouter>,
  );
}

describe('<CreatePlayer />', () => {
  it('shows a friendly error (not a raw zod string) when the name is empty', async () => {
    renderScreen();
    await userEvent.click(screen.getByRole('button', { name: /enter the summer circuit/i }));

    expect(
      screen.getByText('Give your player a name (at least 2 characters).'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Too small: expected string/i)).not.toBeInTheDocument();
  });

  it('locks archetypes to the chosen position', async () => {
    renderScreen();
    // PG archetypes by default
    expect(screen.getByRole('button', { name: /Floor General/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Rim Protector/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'C' }));
    expect(screen.getByRole('button', { name: /Rim Protector/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Floor General/ })).not.toBeInTheDocument();
  });

  it('has a jersey number and a country control', () => {
    renderScreen();
    expect(screen.getByLabelText('Jersey number')).toBeInTheDocument();
    expect(screen.getByLabelText('Country')).toBeInTheDocument();
  });
});
