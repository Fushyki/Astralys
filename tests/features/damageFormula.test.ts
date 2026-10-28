import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, assembleTeam, damageTable, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { damageFormula, formulaText } from '../../src/features/character/damageFormula';
import { sampleProject } from '../../src/features/rotation/persistence';
import { formatInt } from '../../src/ui/format';

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

describe('cálculo do dano de um golpe', () => {
  const r = resolveProject(sampleProject(), game, effects);
  const b = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
  const assembly = assembleTeam(r.team, { rolls: b.optimization.rolls });
  const rows = damageTable({ team: r.team, assembly, rolls: b.optimization.rolls, member: 0, moves: game.moves, reaction: 'melt', ampCoefficient: r.ampCoefficient });
  const burst = rows.find((x) => x.move.talent === 'burst' && x.reactionApplied)!;
  const f = damageFormula({ result: burst.result, team: r.team, assembly, member: 0, ampCoefficient: r.ampCoefficient });

  it('a fórmula de uma linha termina no dano médio da tabela', () => {
    expect(f.expr.endsWith(`= ${formatInt(burst.avg)}`)).toBe(true);
    expect(f.detailed).toBe(true);
  });
  it('tem um bloco para cada fator: base, ATK, bônus, crítico, DEF, RES e reação', () => {
    const ids = f.blocks.map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining(['base', 'atk', 'dmg', 'cr', 'cd', 'def', 'res', 'reaction', 'crit']));
  });
  it('o ATK total do bloco é o do motor e lista a base e as fontes', () => {
    const atk = f.blocks.find((x) => x.id === 'atk')!;
    expect(atk.total).toBe(formatInt(burst.result.stats.atk));
    expect(atk.terms[0].label).toMatch(/ATK base/);
    expect(atk.terms.length).toBeGreaterThan(3);
  });
  it('o texto para copiar traz o título e todos os blocos', () => {
    const t = formulaText('Supremo', f);
    expect(t).toMatch(/^Supremo: Base /);
    for (const x of f.blocks) expect(t).toContain(x.title);
  });
  it('sem crítico o fator de crítico é ×1', () => {
    const n = damageFormula({ result: burst.result, team: r.team, assembly, member: 0, mode: 'noCrit' });
    expect(n.blocks.find((x) => x.id === 'crit')!.total).toBe('×1,000');
    expect(n.expr.endsWith(`= ${formatInt(burst.noCrit)}`)).toBe(true);
  });
});
