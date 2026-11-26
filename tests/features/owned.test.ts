/** Personagem que entra em um time passa a ser "meu" (#63). */
import { describe, expect, it } from 'vitest';
import { ownedCharacters } from '../../src/features/good/owned';

describe('meus personagens', () => {
  const teams = [{ members: ['Skirk', 'Furina'], isSample: false }, { members: ['Mavuika'], isSample: true }];
  it('quem está num time é meu, sem precisar de inventário; o exemplo não conta', () => {
    expect([...ownedCharacters(null, teams)].sort()).toEqual(['furina', 'skirk']);
  });
  it('soma o inventário sem repetir', () => {
    expect(ownedCharacters({ characters: [{ key: 'Skirk' }, { key: 'KamisatoAyaka' }] }, teams).size).toBe(3);
  });
});
