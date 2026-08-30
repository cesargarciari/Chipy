import type { ClubRef } from '../types.js';

/** EuroLeague / top domestic clubs a struggling NBA player can sign with. */
const C = (id: string, name: string, country: string, prestige: number): ClubRef => ({
  id,
  name,
  country,
  prestige,
});

/**
 * The clubs a struggling NBA player can sign with. Kept to the set that has
 * crest artwork in the web (`apps/web/src/assets/clubs/`) so every overseas
 * offer card shows a badge - add a crest, add the club here.
 */
export const EURO_CLUBS: readonly ClubRef[] = [
  C('real_madrid', 'Real Madrid', 'Spain', 0.94),
  C('barcelona', 'FC Barcelona', 'Spain', 0.9),
  C('panathinaikos', 'Panathinaikos', 'Greece', 0.88),
  C('olympiacos', 'Olympiacos', 'Greece', 0.87),
  C('fenerbahce', 'Fenerbahçe', 'Turkey', 0.85),
  C('monaco', 'AS Monaco', 'France', 0.82),
  C('zalgiris', 'Žalgiris Kaunas', 'Lithuania', 0.82),
];

const BY_ID = new Map(EURO_CLUBS.map((c) => [c.id, c]));

export function getEuroClub(id: string): ClubRef {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`Unknown club "${id}"`);
  return c;
}
