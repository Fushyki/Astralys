import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData, type RotationProject } from '../../src/engine';
import { hitBuffRows } from '../../src/features/rotation/rotationModel';
import { sampleProject } from '../../src/features/rotation/persistence';

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
const analyze = (p: RotationProject) => {
  const r = resolveProject(p, game, effects);
  return { r, b: analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }) };
};

describe('desligar um buff só para um golpe (tagsOff)', () => {
  // Projeto por janelas: o Supremo da Mavuika com todos os buffs do exemplo ligados no tempo dele.
  const base = (() => {
    const p = { ...sampleProject(), compat: undefined } as RotationProject;
    return { ...p, actions: p.actions.map((a) => ({ ...a, tagSource: 'manual' as const })) };
  })();
  const burst = base.actions.find((a) => a.move.talent === 'burst' && a.member === 0)!;

  it('a lista traz as faixas que cobrem o golpe, todas ligadas no começo', () => {
    const { r, b } = analyze(base);
    const rows = hitBuffRows(base, r, b, burst.id);
    expect(rows.length).toBeGreaterThan(2);
    expect(rows.every((x) => x.on)).toBe(true);
  });

  it('desligar uma faixa tira a etiqueta só desse golpe e o dano dele cai', () => {
    const { r, b } = analyze(base);
    const row = hitBuffRows(base, r, b, burst.id).sort((x, y) => y.effect - x.effect)[0];
    expect(row.effect).toBeGreaterThan(0);
    const off: RotationProject = { ...base, actions: base.actions.map((a) => (a.id === burst.id ? { ...a, tagsOff: [row.tag] } : a)) };
    const { r: r2, b: b2 } = analyze(off);
    const hit = (res: typeof b) => res.optimization.result.actions.find((x) => x.action.id === burst.id)!;
    expect(hit(b2).action.activeTags).not.toContain(row.tag);
    expect(hit(b2).avg).toBeLessThan(hit(b).avg);
    // só esse golpe mudou: os outros mantêm as etiquetas
    const other = base.actions.find((a) => a.id !== burst.id && a.activeTags.includes(row.tag))!;
    expect(b2.optimization.result.actions.find((x) => x.action.id === other.id)!.action.activeTags).toContain(row.tag);
    // a linha aparece desligada, com o ganho que ele daria
    const again = hitBuffRows(off, r2, b2, burst.id).find((x) => x.tag === row.tag)!;
    expect(again.on).toBe(false);
    expect(again.effect).toBeGreaterThan(0);
  });
});
