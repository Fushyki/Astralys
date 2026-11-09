import { describe, expect, it } from 'vitest';
import { parseArtifactText, setKeyOf, statKey } from '../../src/features/good/artifactOcr';

const SETS = [
  { name: "Gladiator's Finale", namePt: 'Final do Gladiador', rarity: 5 },
  { name: 'Emblem of Severed Fate', namePt: 'Emblema do Destino Rompido', rarity: 5 },
  { name: 'Resolution of Sojourner', namePt: 'Resolução de Sojourner', rarity: 4 },
];

describe('stat pelo nome', () => {
  it('inglês e português, % ou fixo', () => {
    expect(statKey('CRIT Rate', true)).toBe('critRate_');
    expect(statKey('Taxa CRIT', true)).toBe('critRate_');
    expect(statKey('Dano CRIT', true)).toBe('critDMG_');
    expect(statKey('ATK', false)).toBe('atk');
    expect(statKey('ATQ', true)).toBe('atk_');
    expect(statKey('Proficiência Elemental', false)).toBe('eleMas');
    expect(statKey('Recarga de Energia', true)).toBe('enerRech_');
    expect(statKey('Pyro DMG Bonus', true)).toBe('pyro_dmg_');
    expect(statKey('Bônus de Dano Hydro', true)).toBe('hydro_dmg_');
    expect(statKey('Healing Bonus', true)).toBe('heal_');
  });
  it('chave do set como no Genshin Optimizer', () => {
    expect(setKeyOf("Gladiator's Finale")).toBe('GladiatorsFinale');
  });
});

describe('texto lido do print', () => {
  it('artefato em inglês, com stat principal em duas linhas', () => {
    const p = parseArtifactText(
      ["Gladiator's Nostalgia", 'Sands of Eon', 'ATK%', '46.6%', '+20', '• CRIT Rate+3.9%', '• CRIT DMG+14.0%', '• HP+299', '• Elemental Mastery+23', "Gladiator's Finale", "2-Piece Set: ATK +18%"].join('\n'),
      SETS,
    );
    expect(p.setKey).toBe('GladiatorsFinale');
    expect(p.slotKey).toBe('sands');
    expect(p.level).toBe(20);
    expect(p.mainStatKey).toBe('atk_');
    expect(p.substats).toEqual([{ key: 'critRate_', value: 3.9 }, { key: 'critDMG_', value: 14 }, { key: 'hp', value: 299 }, { key: 'eleMas', value: 23 }]);
    expect(p.rarity).toBe(5);
  });
  it('artefato em português, vírgula decimal e milhar', () => {
    const p = parseArtifactText(
      ['Flor da Vida', 'PV', '4.780', '+20', 'Taxa CRIT+6,2%', 'Dano CRIT+7,8%', 'ATQ+5,3%', 'Recarga de Energia+5,2%', 'Final do Gladiador', 'Conjunto de 2 peças: ATQ +18%'].join('\n'),
      SETS,
    );
    expect(p.setKey).toBe('GladiatorsFinale');
    expect(p.slotKey).toBe('flower');
    expect(p.mainStatKey).toBe('hp');
    expect(p.substats.map((s) => [s.key, s.value])).toEqual([['critRate_', 6.2], ['critDMG_', 7.8], ['atk_', 5.3], ['enerRech_', 5.2]]);
  });
  it('sem set conhecido avisa, e a posição vem do stat principal', () => {
    const p = parseArtifactText(['Pyro DMG Bonus', '46.6%', '+16', 'CRIT Rate+3.1%', 'DEF+19', 'HP+239'].join('\n'), SETS);
    expect(p.setKey).toBeNull();
    expect(p.slotKey).toBe('goblet');
    expect(p.level).toBe(16);
    expect(p.notes.join(' ')).toMatch(/set/i);
  });
  it('as linhas do bônus do set não viram substats', () => {
    const p = parseArtifactText(['Plume of Death', 'ATK', '311', '+20', 'CRIT DMG+7.8%', 'ATK%+5.8%', 'DEF+23', 'HP+209', "Emblem of Severed Fate", '2-Piece Set: Energy Recharge +20%'].join('\n'), SETS);
    expect(p.slotKey).toBe('plume');
    expect(p.mainStatKey).toBe('atk');
    expect(p.substats).toHaveLength(4);
    expect(p.substats.some((s) => s.key === 'enerRech_')).toBe(false);
  });
});
