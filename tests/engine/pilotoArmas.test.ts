import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { weaponStatsAt } from '../../src/effects/schema';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import type { RotationProject } from '../../src/engine/project';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

/** Mavuika do exemplo com a arma e o refino pedidos, sem rolls (a arma é a única diferença entre refinos). */
function project(weapon: string, refinement: number, stacks?: Record<string, number>, who = 0): RotationProject {
  const base = sampleProject();
  const zero = { CR: 0, CD: 0, 'ATK%': 0, EM: 0, ER: 0, ATK: 0, 'HP%': 0, HP: 0, 'DEF%': 0, DEF: 0 };
  return { ...base, compat: 'none' as const, members: base.members.map((m, i) => (i === who ? { ...m, weapon, refinement, manualRolls: zero, ...(stacks ? { stacks } : {}) } : m)) };
}
const stats = (p: RotationProject, who = 0) => {
  const r = resolveProject(p, game, effects);
  return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).memberStats[who];
};
const buff = (p: RotationProject, id: string) => resolveProject(p, game, effects).team.members[0].characterEffect?.buffs.find((b) => b.id === id)!;
const bennett = sampleProject().members.findIndex((m) => m.character === 'Bennett');

describe('piloto de armas: valores por refinamento no cálculo', () => {
  it('A Thousand Blazing Suns: Dano Crítico e ATK em Nightsoul (x1,75), R1 = 35%/49% e R5 = 70%/98%', () => {
    const a = stats(project('A Thousand Blazing Suns', 1));
    const b = stats(project('A Thousand Blazing Suns', 5));
    expect(b.critDmg - a.critDmg).toBeCloseTo(0.7 - 0.35, 9);
    expect(b.atk).toBeGreaterThan(a.atk);
    const w = (r: number) => weaponStatsAt(resolveProject(project('A Thousand Blazing Suns', r), game, effects).team.members[0].weaponEffect!, r);
    expect([w(1).atkPct, w(5).atkPct]).toEqual([0.49, 0.98]);
  });

  it('Calamity Queller: DMG elemental 12% -> 24% e ATK por stack 3,2% -> 6,4% (6 stacks; 3 stacks = metade)', () => {
    const a = stats(project('Calamity Queller', 1));
    const b = stats(project('Calamity Queller', 5));
    expect(b.dmgBonus - a.dmgBonus).toBeCloseTo(0.12, 9);
    expect(buff(project('Calamity Queller', 1), 'arma:stacks').stats.atkPct).toBeCloseTo(0.192, 9);
    expect(buff(project('Calamity Queller', 5), 'arma:stacks').stats.atkPct).toBeCloseTo(0.384, 9);
    expect(buff(project('Calamity Queller', 1, { 'arma:stacks': 3 }), 'arma:stacks').stats.atkPct).toBeCloseTo(0.096, 9);
  });

  it("Xiphos' Moonlight: Recarga do dono = 0,036%/0,072% por Maestria e a equipe recebe 30% disso", () => {
    const a = stats(project("Xiphos' Moonlight", 1));
    const b = stats(project("Xiphos' Moonlight", 5));
    expect(a.em).toBe(b.em);
    expect(a.em).toBeGreaterThan(0);
    expect(b.er - a.er).toBeCloseTo(a.em * (0.00072 - 0.00036), 9);
    expect(buff(project("Xiphos' Moonlight", 1), 'arma:er-time').convert!.perPoint).toBeCloseTo(0.000108, 9);
    expect(buff(project("Xiphos' Moonlight", 5), 'arma:er-time').convert!.perPoint).toBeCloseTo(0.000216, 9);
  });

  it("Moonweaver's Dawn: +20%/+40% sempre; o extra (16%/32% até 60 de energia) só para Supremo de custo <= 60 (Bennett), não para a Mavuika (100)", () => {
    expect(bennett).toBeGreaterThan(0);
    const b1 = stats(project("Moonweaver's Dawn", 1, undefined, bennett), bennett);
    const b5 = stats(project("Moonweaver's Dawn", 5, undefined, bennett), bennett);
    expect(b5.dmgByType.burst - b1.dmgByType.burst).toBeCloseTo((0.4 + 0.32) - (0.2 + 0.16), 9);
    const m1 = stats(project("Moonweaver's Dawn", 1));
    const m5 = stats(project("Moonweaver's Dawn", 5));
    expect(m5.dmgByType.burst - m1.dmgByType.burst).toBeCloseTo(0.2, 9);
  });

  it('Peak Patrol Song: 2 stacks de DEF e DMG elemental no dono; DMG da equipe por 1.000 de DEF com teto', () => {
    const s1 = buff(project('Peak Patrol Song', 1), 'arma:stacks').stats;
    const s5 = buff(project('Peak Patrol Song', 5), 'arma:stacks').stats;
    expect([s1.dmgPct, s1.defPct]).toEqual([0.2, 0.16]);
    expect([s5.dmgPct, s5.defPct]).toEqual([0.4, 0.32]);
    const c1 = buff(project('Peak Patrol Song', 1), 'arma:def-time').convert!;
    const c5 = buff(project('Peak Patrol Song', 5), 'arma:def-time').convert!;
    expect([c1.perPoint, c1.cap]).toEqual([0.00008, 0.256]);
    expect([c5.perPoint, c5.cap]).toEqual([0.00016, 0.512]);
  });
});
