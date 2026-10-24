import { describe, expect, it } from 'vitest';
import { mergeTeams, parseBackup, resolveLegacyName, serializeBackup, type SavedEnergyTeam } from '../../src/features/energy/savedTeams';

const known = new Set(['Mavuika', 'Citlali', 'Iansan', 'Bennett', 'Raiden Shogun', 'Aether (Anemo)']);

const legacy = [
  {
    id: 1700000000000,
    name: 'Mavuika',
    rotationTime: 20,
    enemyParts: 8,
    slots: [
      { id: 1, name: 'Mavuika', e_uses: 1, funnel: 'Dividir (50% Slot 3 / 50% Slot 4)', fav: 0, fav_target: 'Ele mesmo (Em campo)', flat: 0, onfield: 0.5, use_burst: false, custom_part: 5 },
      { id: 2, name: 'Citlali', e_uses: 2, funnel: 'Ele mesmo (Em campo)', fav: 1, fav_target: 'Passar p/ Slot 1', flat: 0, onfield: 0.15, use_burst: true },
      { id: 3, name: 'Iansan', e_uses: 1, funnel: 'Passar p/ Slot 4', fav: 0, fav_target: 'Ele mesmo (Em campo)', flat: 12, onfield: 0.15, use_burst: true },
      { id: 4, name: 'Raiden', e_uses: 1, funnel: 'Fora de campo (Dividido)', fav: 0, fav_target: 'Ele mesmo (Em campo)', flat: 0, onfield: 0.2, use_burst: true },
    ],
  },
];

describe('backup da calculadora de recarga', () => {
  it('lê o backup da calculadora antiga e converte menus em quem fica em campo', () => {
    const { teams, skipped } = parseBackup(JSON.stringify(legacy), known);
    expect(skipped).toEqual([]);
    expect(teams).toHaveLength(1);
    const t = teams[0];
    expect(t.members).toEqual(['Mavuika', 'Citlali', 'Iansan', 'Raiden Shogun']);
    expect(t.energy.enemyParticles).toBe(8);
    expect(t.energy.slots.Mavuika.onField).toEqual(['Iansan', 'Raiden Shogun']);
    expect(t.energy.slots.Mavuika.useBurst).toBe(false);
    expect(t.energy.slots.Mavuika.particles).toBe(5);
    expect(t.energy.slots.Citlali).toMatchObject({ skillUses: 2, onField: ['Citlali'], favProcs: 1, favTarget: 'Mavuika' });
    expect(t.energy.slots.Iansan).toMatchObject({ onField: ['Raiden Shogun'], flat: 12 });
    expect(t.energy.slots['Raiden Shogun'].onField).toEqual([]);
  });

  it('ignora quem não existe nos dados e avisa', () => {
    const odd = [{ ...legacy[0], slots: [...legacy[0].slots.slice(0, 3), { id: 4, name: 'Nobody', e_uses: 1, funnel: 'x', fav: 0, flat: 0, onfield: 0.2 }] }];
    const { teams, skipped } = parseBackup(JSON.stringify(odd), known);
    expect(teams[0].members).toEqual(['Mavuika', 'Citlali', 'Iansan']);
    expect(skipped[0]).toMatch(/Nobody/);
  });

  it('o backup do Astralys volta igual e o mesclar mantém o mais novo de cada id', () => {
    const { teams } = parseBackup(JSON.stringify(legacy), known);
    const back = parseBackup(serializeBackup(teams), known);
    expect(back.teams).toEqual(teams);
    const newer: SavedEnergyTeam = { ...teams[0], name: 'novo', savedAt: '2999-01-01T00:00:00.000Z' };
    expect(mergeTeams(teams, [newer])[0].name).toBe('novo');
    expect(mergeTeams([newer], teams)[0].name).toBe('novo');
  });

  it('rejeita arquivo que não é backup', () => {
    expect(() => parseBackup('{"a":1}', known)).toThrow(/backup/);
    expect(() => parseBackup('oi', known)).toThrow(/JSON/);
  });

  it('resolve os nomes antigos', () => {
    expect(resolveLegacyName('Traveler (Anemo)', known)).toBe('Aether (Anemo)');
    expect(resolveLegacyName('Raiden', known)).toBe('Raiden Shogun');
    expect(resolveLegacyName('Nobody', known)).toBeNull();
  });
});
