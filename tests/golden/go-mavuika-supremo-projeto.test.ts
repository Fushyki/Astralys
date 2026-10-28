/**
 * Mesmo caso do GO (Supremo da Mavuika, crítico com Derreter = 1.516.981), agora de ponta a ponta: o projeto real (time, artefatos, arma,
 * rotação e 200 pontos de Espírito Lutador no Supremo) passa por parseShare, resolveProject e analyzeProject. O GO não tem o decaimento
 * do A4 da Mavuika, então o buff entra com 20 s restantes e a janela começa no instante do golpe (8,9 s).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, pointExtra, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import { parseShare, projectFromShare } from '../../src/features/rotation/share';

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

describe('GO: Supremo da Mavuika de ponta a ponta (1.516.981)', () => {
  const mavuika = effects.characters.find((c) => c.character === 'Mavuika')!;

  it('o bônus por ponto vem do Lunaris e sobe com o nível do Supremo (2,88% no nv 10, 1,02% no Carregado da Ignimoto)', () => {
    const burst = mavuika.pointMoves.find((p) => p.talent === 'burst')!;
    const charged = mavuika.pointMoves.find((p) => p.labels.some((l) => /Charged Attack Cyclic/.test(l)))!;
    expect(burst.perPoint[9]).toBeCloseTo(0.0288, 6);
    expect(charged.perPoint[9]).toBeCloseTo(0.0102, 6);
    expect(burst.perPoint[14]).toBeGreaterThan(burst.perPoint[9]);
    expect(burst.perPoint[0]).toBeLessThan(burst.perPoint[9]);
    // 200 pontos no nível 10 = +576% do ATK somado à escala
    const t = { normal: 10, skill: 10, burst: 10 };
    expect(pointExtra({ talent: 'burst', label: 'Skill DMG' }, mavuika, t)!.atk).toBeCloseTo(5.76, 6);
    expect(pointExtra({ talent: 'burst', label: 'Skill DMG' }, mavuika, t, 0)).toBeUndefined();
  });

  it('o projeto real chega ao valor do GO (±0,5%)', () => {
    const file = parseShare(JSON.parse(readFileSync(path.join(root, 'tests/fixtures/mavuika-go.astralys-rotacao.json'), 'utf8')))!;
    const res = projectFromShare(file, { ...sampleProject(), compat: undefined } as never) as unknown as { project?: ReturnType<typeof sampleProject> } & ReturnType<typeof sampleProject>;
    const project = (res.project ?? res) as ReturnType<typeof sampleProject>;
    project.members[0] = { ...project.members[0], stacks: { ...(project.members[0].stacks ?? {}), a4: 10 } };
    const a4 = project.buffWindows.find((w) => w.tag === 'label:Mavuika A4')!;
    a4.start = 8.9;
    a4.end = 18.9;
    const r = resolveProject(project, game, effects);
    const b = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
    const i = r.actions.findIndex((a) => a.id === 'a8');
    const hit = b.optimization.result.actions[i];
    expect(project.actions.find((a) => a.id === 'a8')!.points).toBe(200);
    expect(Math.abs(hit.avg / 1_516_981 - 1)).toBeLessThan(0.005);
  });
});
