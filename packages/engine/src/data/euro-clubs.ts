import type { ClubRef } from '../types.js';

/** EuroLeague / top domestic clubs a struggling NBA player can sign with. */
const C = (id: string, name: string, country: string, prestige: number): ClubRef => ({
  id,
  name,
  country,
  prestige,
});

export const EURO_CLUBS: readonly ClubRef[] = [
  C('real_madrid', 'Real Madrid', 'Spain', 0.94),
  C('barcelona', 'FC Barcelona', 'Spain', 0.9),
  C('panathinaikos', 'Panathinaikos', 'Greece', 0.88),
  C('olympiacos', 'Olympiacos', 'Greece', 0.87),
  C('fenerbahce', 'Fenerbahçe', 'Turkey', 0.85),
  C('efes', 'Anadolu Efes', 'Turkey', 0.84),
  C('zalgiris', 'Žalgiris Kaunas', 'Lithuania', 0.82),
  C('monaco', 'AS Monaco', 'France', 0.82),
  C('baskonia', 'Baskonia', 'Spain', 0.78),
  C('milano', 'Olimpia Milano', 'Italy', 0.79),
  C('partizan', 'Partizan Belgrade', 'Serbia', 0.8),
  C('crvena_zvezda', 'Crvena Zvezda', 'Serbia', 0.78),
  C('maccabi', 'Maccabi Tel Aviv', 'Israel', 0.83),
  C('virtus', 'Virtus Bologna', 'Italy', 0.77),
];

const BY_ID = new Map(EURO_CLUBS.map((c) => [c.id, c]));

export function getEuroClub(id: string): ClubRef {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`Unknown club "${id}"`);
  return c;
}
