import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, parseProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { summarize, WHY_ROWS } from '../../src/features/rotation/summary';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = {
  characters: json('src/data/generated/characters.json'),
  moves: json('src/data/generated/moves.json'),
  weapons: json('src/data/generated/weapons.json'),
  artifacts: json('src/data/generated/artifacts.json'),
};
const effects: EffectsData = {
  characters: json('src/effects/characters.json'),
  weapons: json('src/effects/weapons.json'),
  sets: json('src/effects/sets.json'),
  flatDamage: json('src/effects/flatDamage.json'),
};

const project = parseProject(json('src/features/rotation/sample/mavuika-iansan.json'));
const resolved = resolveProject(project, game, effects);
const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });
const s = summarize(bundle, resolved);

describe('resumo da rotação de exemplo (gabarito)', () => {
  it('KPIs principais', () => {
    expect(s.avg).toBeCloseTo(3790496.07, 1);
    expect(s.dps).toBeCloseTo(216599.78, 1);
    expect(s.noCrit).toBeCloseTo(1204976.35, 1);
    expect(s.crit).toBeCloseTo(3867780.11, 1);
    expect(s.duration).toBe(17.5);
    expect(s.actionCount).toBe(24);
  });

  it('golpe mais forte: o Supremo da Mavuika, 32,7% do total, aos 7,4 s', () => {
    expect(s.strongest!.name).toMatch(/Supremo/);
    expect(s.strongest!.avg).toBeCloseTo(1239638.47, 1);
    expect(s.strongest!.fraction).toBeCloseTo(0.327, 3);
    expect(s.strongest!.time).toBe(7.4);
  });

  it('fontes somam 100% e só listam as que existem', () => {
    expect(s.sources.reduce((x, p) => x + p.fraction, 0)).toBeCloseTo(1, 9);
    expect(s.sources.map((p) => p.key)).toEqual(['charged', 'skill', 'burst', 'amplifying']);
    expect(s.sources.find((p) => p.key === 'amplifying')!.fraction).toBeCloseTo(0.5527, 3);
  });

  it('reações: só amplificadoras têm valor; as outras famílias aparecem a 0', () => {
    expect(s.reactions.map((r) => r.label)).toEqual(['Amplificadoras (Derreter, Vaporizar)', 'Transformativas', 'Lunares']);
    expect(s.reactions[0].fraction).toBeCloseTo(0.5527, 3);
    expect(s.reactions[1].fraction).toBe(0);
    expect(s.reactionShare).toBeCloseTo(0.5527, 3);
  });

  it('personagens com a fatia do gabarito', () => {
    expect(s.members.map((m) => m.name)).toEqual(['Mavuika', 'Citlali', 'Iansan', 'Bennett']);
    expect(s.members[0].fraction).toBeCloseTo(0.95266, 4);
    expect(s.members.reduce((x, m) => x + m.fraction, 0)).toBeCloseTo(1, 9);
  });

  it('"de onde vem o dano": ordenado, e o Obsidian Codex lidera', () => {
    const top = s.why.filter((w) => !w.flag);
    for (let i = 1; i < top.length; i++) expect(top[i - 1].fraction).toBeGreaterThanOrEqual(top[i].fraction);
    expect(top[0].fraction).toBeCloseTo(0.268, 2); // Obsidian Codex (4 peças)
    expect(top.length).toBeLessThanOrEqual(WHY_ROWS);
  });

  it('buffs sem origem aparecem sempre, mesmo fora do topo, com o valor no nome', () => {
    const flagged = s.why.filter((w) => w.flag);
    expect(flagged.length).toBeGreaterThanOrEqual(2);
    expect(flagged.every((w) => w.flag === 'a confirmar' && /sem origem conhecida/.test(w.label))).toBe(true);
    expect(flagged.some((w) => /\+30% ATK/.test(w.label))).toBe(true);
    expect(s.why.some((w) => /origem não identificada/.test(w.label))).toBe(false);
  });
});
