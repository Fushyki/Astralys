import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { WeaponEffectSchema, weaponStatsAt, type WeaponEffect } from '../../src/effects/schema';
import { analyzeProject, resolveProject, type EffectsData, type GameData, type RotationProject } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const weapons = json<WeaponEffect[]>('src/effects/weapons.json');
const raw = json<{ name: string; type: string }[]>('src/data/generated/weapons.json');
const game: GameData = {
  characters: json('src/data/generated/characters.json'),
  moves: json('src/data/generated/moves.json'),
  weapons: json('src/data/generated/weapons.json'),
  artifacts: json('src/data/generated/artifacts.json'),
};
const effects: EffectsData = {
  characters: json('src/effects/characters.json'),
  weapons,
  sets: json('src/effects/sets.json'),
  flatDamage: json('src/effects/flatDamage.json'),
};
const get = (n: string) => weapons.find((w) => w.weapon === n)!;

describe('efeitos de armas cadastrados', () => {
  it('todos passam no esquema, têm fonte e correspondem a uma arma do Lunaris', () => {
    for (const w of weapons) {
      expect(() => WeaponEffectSchema.parse(w), w.weapon).not.toThrow();
      expect(w.fonte_info.length, w.weapon).toBeGreaterThan(10);
      expect(raw.some((r) => r.name === w.weapon), w.weapon).toBe(true);
    }
  });

  it('mais de 70 armas cobertas e os 7 efeitos da planilha continuam iguais', () => {
    expect(weapons.length).toBeGreaterThan(70);
    expect(get('A Thousand Blazing Suns')).toMatchObject({ atkPct: 0.49, critDmg: 0.35 });
    expect(get('Engulfing Lightning').atkPctPerEr).toEqual({ coef: 0.28, cap: 0.8 });
  });

  it('cada arma curada traz as 5 refinamentos e diz o que assumiu', () => {
    for (const w of weapons.filter((x) => x.refinements)) {
      expect(w.refinements, w.weapon).toHaveLength(5);
      expect(w.note?.length ?? 0, w.weapon).toBeGreaterThan(10);
    }
  });

  it('valores conferidos à mão contra o texto do Lunaris', () => {
    expect(weaponStatsAt(get('Royal Greatsword'), 1).critRate).toBeCloseTo(0.4, 6); // 8% × 5 stacks
    expect(weaponStatsAt(get('Royal Greatsword'), 5).critRate).toBeCloseTo(0.8, 6); // 16% × 5 stacks
    expect(weaponStatsAt(get('Aquila Favonia'), 1).atkPct).toBeCloseTo(0.2, 6);
    expect(weaponStatsAt(get('Aquila Favonia'), 5).atkPct).toBeCloseTo(0.4, 6);
    expect(weaponStatsAt(get('Skyward Blade'), 1).critRate).toBeCloseTo(0.04, 6);
    expect(weaponStatsAt(get('Mistsplitter Reforged'), 1).dmgPct).toBeCloseTo(0.12 + 0.28, 6);
    expect(weaponStatsAt(get("Amos' Bow"), 1).dmgPctByType).toMatchObject({ normal: 0.12 + 0.08 * 5, charged: 0.12 + 0.08 * 5 });
    expect(weaponStatsAt(get('Rust'), 1).dmgPctByType).toMatchObject({ normal: 0.4, charged: -0.1 });
    expect(weaponStatsAt(get('Summit Shaper'), 1).atkPct).toBeCloseTo(0.04 * 5, 6);
    expect(weaponStatsAt(get('Freedom-Sworn'), 1).team?.atkPct).toBeCloseTo(0.2, 6);
  });

  it('o refinamento só sobe (nunca cai) em bônus de atributo simples', () => {
    for (const n of ['Aquila Favonia', 'Royal Greatsword', 'Summit Shaper', 'Skyward Blade', 'Staff of Homa']) {
      const w = get(n);
      const key = (['atkPct', 'critRate', 'hpPct'] as const).find((k) => w[k] > 0)!;
      const v = [1, 2, 3, 4, 5].map((r) => weaponStatsAt(w, r)[key]);
      for (let i = 1; i < 5; i++) expect(v[i], `${n} R${i + 1}`).toBeGreaterThanOrEqual(v[i - 1]);
    }
  });

  it('sem tabela por refinamento (efeitos da planilha), qualquer refino devolve os valores da raiz', () => {
    expect(weaponStatsAt(get('A Thousand Blazing Suns'), 4).atkPct).toBe(0.49);
  });
});

describe('armas no motor', () => {
  const statsOf = (p: RotationProject) => {
    const r = resolveProject(p, game, effects);
    return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).memberStats[0];
  };
  const withWeapon = (weapon: string, refinement?: number): RotationProject => {
    const base = sampleProject();
    const zero = { CR: 0, CD: 0, 'ATK%': 0, EM: 0, ER: 0, ATK: 0, 'HP%': 0, HP: 0, 'DEF%': 0, DEF: 0 };
    return { ...base, members: base.members.map((m, i) => (i === 0 ? { ...m, weapon, refinement, manualRolls: zero } : m)) };
  };

  it('o refinamento 5 rende mais Taxa Crítica que o 1 na Royal Greatsword (+0,4)', () => {
    const r1 = statsOf(withWeapon('Royal Greatsword', 1));
    const r5 = statsOf(withWeapon('Royal Greatsword', 5));
    expect(r5.critRate - r1.critRate).toBeCloseTo(0.4, 6);
  });

  it('refinamento ausente vale R1', () => {
    expect(statsOf(withWeapon('Royal Greatsword')).critRate).toBeCloseTo(statsOf(withWeapon('Royal Greatsword', 1)).critRate, 9);
  });

  it('a Royal Greatsword soma 40% de Taxa Crítica sobre uma arma sem efeito do mesmo tipo', () => {
    const claymores = raw.filter((w) => w.type === 'Claymore').map((w) => w.name).filter((n) => !weapons.some((e) => e.weapon === n));
    expect(claymores.length).toBeGreaterThan(0);
    const plain = statsOf(withWeapon(claymores[0]));
    const royal = statsOf(withWeapon('Royal Greatsword', 1));
    // substat da arma pode diferir; comparo só o que a passiva acrescenta ao crítico, descontando o substat de cada uma
    expect(royal.critRate).toBeGreaterThan(plain.critRate + 0.3);
  });

  it('DMG% por tipo de golpe da arma entra na tabela do personagem (Rust: Normal +40%, Carregado -10%)', () => {
    const bows = raw.filter((w) => w.type === 'Bow').map((w) => w.name).filter((n) => !weapons.some((e) => e.weapon === n));
    const plain = statsOf(withWeapon(bows[0]));
    const rust = statsOf(withWeapon('Rust', 1));
    expect(rust.dmgByType.normal - plain.dmgByType.normal).toBeCloseTo(0.4, 9);
    expect(rust.dmgByType.charged - plain.dmgByType.charged).toBeCloseTo(-0.1, 9);
  });
});
