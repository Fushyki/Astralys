import { describe, expect, it } from 'vitest';
import { characterDisplayName, unmappedOwnerKeys } from '../../src/features/good/labels';

const chars = [{ name: 'Yumemizuki Mizuki' }, { name: 'Kaedehara Kazuha' }, { name: 'Mavuika' }];

describe('nome de personagem vindo do GOOD', () => {
  it('usa o nome oficial quando acha e separa as palavras quando não acha', () => {
    expect(characterDisplayName('YumemizukiMizuki', chars)).toBe('Yumemizuki Mizuki');
    expect(characterDisplayName('KaedeharaKazuha')).toBe('Kaedehara Kazuha');
    expect(characterDisplayName('HuTao')).toBe('Hu Tao');
    expect(characterDisplayName('Mavuika', chars)).toBe('Mavuika');
    expect(characterDisplayName('Traveler')).toBe('Viajante');
  });
  it('lista as chaves sem personagem correspondente', () => {
    expect(unmappedOwnerKeys(['Mavuika', 'Somnia', 'Traveler', '', 'Somnia'], chars)).toEqual(['Somnia', 'Traveler']);
  });
});
