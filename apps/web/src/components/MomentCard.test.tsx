import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MomentCard } from './MomentCard.js';

describe('<MomentCard />', () => {
  it('renders the title and subtitle', () => {
    render(
      <MomentCard
        moment={{
          seasonIndex: 6,
          kind: 'ring',
          id: 'champion',
          awardId: 'champion',
          title: 'CHAMPION',
          subtitle: 'Age 26 · Denver Nuggets · your first ring',
          teamId: 'DEN',
        }}
      />,
    );
    expect(screen.getByText('CHAMPION')).toBeInTheDocument();
    expect(screen.getByText(/your first ring/)).toBeInTheDocument();
  });

  it('falls back to a kind glyph when no artwork exists for the moment', () => {
    render(
      <MomentCard
        moment={{
          seasonIndex: 8,
          kind: 'franchise',
          id: 'franchise_idol',
          title: 'AN IDOL',
          subtitle: 'the city has adopted you',
          // no awardId, and a team id with no logo file → emoji glyph
          teamId: 'ZZZ',
        }}
      />,
    );
    expect(screen.getByText('AN IDOL')).toBeInTheDocument();
    expect(screen.getByText('💛')).toBeInTheDocument();
  });

  it('renders an injury moment', () => {
    render(
      <MomentCard
        moment={{
          seasonIndex: 11,
          kind: 'injury',
          id: 'injury_torn_acl',
          title: 'TORN ACL',
          subtitle: 'Age 30 · 58 games missed',
          teamId: 'ZZZ',
        }}
      />,
    );
    expect(screen.getByText('TORN ACL')).toBeInTheDocument();
    expect(screen.getByText('🩼')).toBeInTheDocument();
  });
});
