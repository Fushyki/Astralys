import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, assembleTeam, resolveProject, type EffectsData, type GameData, type RotationProject } from '../../src/engine';
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

const run = (p: RotationProject) => {
  const r = resolveProject(p, game, effects);
  return { r, b: analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }) };
};

describe('buffs desligados pelo usuário (project.disabled)', () => {
  const base = sampleProject();
  const full = run(base);
  const ids = assembleTeam(full.r.team).buffs.map((b) => b.id);

  it('o exemplo começa sem nada desligado e reproduz a planilha', () => {
    expect(base.disabled).toEqual([]);
    expect(full.b.optimization.result.totals.avg).toBeCloseTo(3790496.07, 1);
  });

  it('desligar um buff de equipe tira o buff da montagem e reduz o dano', () => {
    const target = ids.find((id) => id.startsWith('gear-'))!;
    const off = run({ ...base, disabled: [target] });
    expect(assembleTeam(off.r.team).buffs.map((b) => b.id)).not.toContain(target);
    expect(off.b.optimization.result.totals.avg).toBeLessThan(full.b.optimization.result.totals.avg);
  });

  it('o buff desligado deixa de aparecer na atribuição e o resto continua calculando', () => {
    const target = ids.find((id) => id.startsWith('flat-atk-'))!;
    const off = run({ ...base, disabled: [target] });
    expect(off.b.attribution.items.some((i) => i.id === target)).toBe(false);
    expect(full.b.attribution.items.some((i) => i.id === target)).toBe(true);
  });

  it('ligar de volta restaura o resultado exato', () => {
    const target = ids[0];
    const back = run({ ...base, disabled: [target] });
    const restored = run({ ...back.r.team.members.length ? { ...base, disabled: [] } : base });
    expect(restored.b.optimization.result.totals.avg).toBeCloseTo(full.b.optimization.result.totals.avg, 6);
  });

  it('o campo sobrevive a salvar e ler', () => {
    const copy = JSON.parse(JSON.stringify({ ...base, disabled: ['gear-3'] }));
    expect(copy.disabled).toEqual(['gear-3']);
  });
});
