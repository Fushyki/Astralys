import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  CharacterEffectSchema,
  FlatDamageEffectSchema,
  SetEffectSchema,
  WeaponEffectSchema,
} from '../../src/effects/schema';

const root = path.resolve(__dirname, '../..');
const read = (rel: string): any[] => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));

const characters = read('src/data/generated/characters.json');
const weapons = read('src/data/generated/weapons.json');
const artifacts = read('src/data/generated/artifacts.json');

const charEffects = read('src/effects/characters.json');
const weaponEffects = read('src/effects/weapons.json');
const setEffects = read('src/effects/sets.json');
const flatEffects = read('src/effects/flatDamage.json');

describe('efeitos: estrutura', () => {
  it('passam nos esquemas Zod', () => {
    charEffects.forEach((e) => CharacterEffectSchema.parse(e));
    weaponEffects.forEach((e) => WeaponEffectSchema.parse(e));
    setEffects.forEach((e) => SetEffectSchema.parse(e));
    flatEffects.forEach((e) => FlatDamageEffectSchema.parse(e));
  });

  it('todo efeito diz de onde veio o número (fonte_info)', () => {
    for (const e of [...charEffects, ...weaponEffects, ...setEffects, ...flatEffects]) {
      expect(String(e.fonte_info ?? '').trim().length, JSON.stringify(e).slice(0, 60)).toBeGreaterThan(5);
    }
  });

  it('sem entradas duplicadas', () => {
    const dup = (xs: string[]) => xs.length - new Set(xs).size;
    expect(dup(charEffects.map((e) => e.character))).toBe(0);
    expect(dup(weaponEffects.map((e) => e.weapon))).toBe(0);
    expect(dup(setEffects.map((e) => e.set))).toBe(0);
  });
});

describe('efeitos: referências existem nos dados do Lunaris', () => {
  const charNames = new Set(characters.map((c) => c.name));
  const weaponNames = new Set(weapons.map((w) => w.name));
  const setNames = new Set(artifacts.map((a) => a.name));

  it('personagens', () => {
    for (const e of charEffects) expect(charNames.has(e.character), `personagem "${e.character}"`).toBe(true);
  });

  it('armas', () => {
    for (const e of weaponEffects) expect(weaponNames.has(e.weapon), `arma "${e.weapon}"`).toBe(true);
  });

  it('sets de artefatos', () => {
    for (const e of setEffects) expect(setNames.has(e.set), `set "${e.set}"`).toBe(true);
  });

  it('dano fixo: fonte e alvos', () => {
    for (const e of flatEffects) {
      // A Vodyanitsa pode ainda não existir no patch baixado; só validamos o que o Lunaris já conhece.
      const known = charNames.has(e.source);
      if (!known) continue;
      const targets: string[] = e.targets === 'all' ? [] : e.targets;
      for (const t of targets) expect(charNames.has(t), `alvo "${t}" de ${e.name}`).toBe(true);
    }
  });
});

describe('efeitos: valores semeados da planilha', () => {
  it('Iansan: ATK fixo = 37% do ATK total, teto 810', () => {
    const e = charEffects.find((x) => x.character === 'Iansan');
    expect(e.teamFlatAtk).toMatchObject({ perTotalAtk: 0.37, cap: 810 });
    expect(e.appliesToSelf).toBe(false);
  });

  it('Bennett: ATK fixo = 139% do ATK base, vale para si', () => {
    const e = charEffects.find((x) => x.character === 'Bennett');
    expect(e.teamFlatAtk).toMatchObject({ perBaseAtk: 1.39 });
    expect(e.appliesToSelf).toBe(true);
  });

  it('Citlali reduz 20% da RES de Pyro e Hydro', () => {
    const e = charEffects.find((x) => x.character === 'Citlali');
    expect(e.resShred).toEqual({ value: 0.2, elements: ['Pyro', 'Hydro'] });
  });

  it('Engulfing Lightning: 28% do ER acima de 100%, teto 80%', () => {
    const e = weaponEffects.find((x) => x.weapon === 'Engulfing Lightning');
    expect(e.atkPctPerEr).toEqual({ coef: 0.28, cap: 0.8 });
  });

  it('Shimenawa: +50% Normal e Carregado com 4 peças', () => {
    const e = setEffects.find((x) => x.set === "Shimenawa's Reminiscence");
    expect(e.fourPiece.dmgPctByType).toEqual({ normal: 0.5, charged: 0.5 });
  });
});
