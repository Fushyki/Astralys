import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, assembleTeam, damageTable, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { effectivePoints, pointExtra } from '../../src/engine/project';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

describe('Mavuika: Espírito Lutador (pontos × % do ATK por ponto, lido do Lunaris)', () => {
  const mav = effects.characters.find((c) => c.character === 'Mavuika')!;
  const lv10 = { normal: 10, skill: 10, burst: 10 };

  it('valor por ponto no nível 10: 2,88% (Supremo), 1,02% (Carregado) e 0,51% (Normal da Ignimoto)', () => {
    expect(pointExtra({ talent: 'burst', label: 'Skill DMG' }, mav, lv10, 1)!.atk).toBeCloseTo(0.0288, 9);
    expect(pointExtra({ talent: 'skill', label: 'Flamestrider Charged Attack Cyclic DMG' }, mav, lv10, 1)!.atk).toBeCloseTo(0.0102, 9);
    expect(pointExtra({ talent: 'skill', label: 'Flamestrider Normal Attack 3-Hit DMG' }, mav, lv10, 1)!.atk).toBeCloseTo(0.0051, 9);
  });

  it('200 pontos (padrão e limite): +576% de ATK no Supremo e +204% no Carregado; sobe com o nível do Supremo', () => {
    expect(pointExtra({ talent: 'burst', label: 'Skill DMG' }, mav, lv10)!.atk).toBeCloseTo(5.76, 9);
    expect(pointExtra({ talent: 'burst', label: 'Skill DMG' }, mav, lv10, 500)!.atk).toBeCloseTo(5.76, 9);
    expect(pointExtra({ talent: 'skill', label: 'Flamestrider Charged Attack Final DMG' }, mav, lv10, 200)!.atk).toBeCloseTo(2.04, 9);
    expect(pointExtra({ talent: 'burst', label: 'Skill DMG' }, mav, { ...lv10, burst: 13 }, 200)!.atk).toBeCloseTo(0.034 * 200, 9);
    expect(pointExtra({ talent: 'burst', label: 'Skill DMG' }, mav, lv10, 0)).toBeUndefined();
    expect(pointExtra({ talent: 'skill', label: 'Skill DMG' }, mav, lv10)).toBeUndefined();
  });

  it('a tabela de dano do exemplo soma o bônus: Supremo crítico com Derreter ≈ 1.254.000 (era 729.654)', () => {
    const p = sampleProject();
    const r = resolveProject(p, game, effects);
    const assembly = assembleTeam(r.team);
    const bundle = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
    const rows = damageTable({ team: r.team, assembly, rolls: bundle.optimization.rolls, member: 0, moves: game.moves, reaction: 'melt', ampCoefficient: r.ampCoefficient });
    const burst = rows.find((x) => x.move.talent === 'burst' && x.move.label === 'Skill DMG')!;
    console.log('SUPREMO crit melt', Math.round(burst.crit));
    expect(burst.crit).toBeGreaterThan(1_200_000);
    expect(burst.crit).toBeLessThan(1_320_000);
  });
});

describe('Mavuika: pontos do Supremo valem no Cadinho da Vida e da Morte (7 s, acaba se ela sai de campo)', () => {
  const mav = effects.characters.find((c) => c.character === 'Mavuika')!;
  const members = [{ characterEffect: mav }, { characterEffect: undefined }];
  const burst = { talent: 'burst', label: 'Skill DMG' };
  const normal = { talent: 'skill', label: 'Flamestrider Normal Attack 1-Hit DMG' };
  const act = (member: number, move: { talent: string; label: string }, time: number, points?: number) => ({ member, move, time, points }) as Parameters<typeof effectivePoints>[0][number];

  it('Ignimoto herda os pontos do Supremo dentro de 7 s e vale 0 fora', () => {
    const p = effectivePoints([act(0, burst, 0, 150), act(0, normal, 3), act(0, normal, 7), act(0, normal, 7.5)], members);
    expect(p).toEqual([150, 150, 150, 0]);
  });
  it('sem Supremo antes, 0; outro membro agindo no meio encerra a janela; o campo do próprio golpe é ignorado', () => {
    expect(effectivePoints([act(0, normal, 1, 200)], members)).toEqual([0]);
    const p = effectivePoints([act(0, burst, 0, 200), act(1, { talent: 'skill', label: 'x' }, 2), act(0, normal, 3, 200), act(1, { talent: 'proc', label: 'y' }, 3.5)], members);
    expect(p).toEqual([200, undefined, 0, undefined]);
  });
  it('golpe contínuo de outro membro (ex.: Tempestade Gélida da Citlali, a cada 1 s) não encerra a janela', () => {
    const tick = (time: number) => ({ ...act(1, { talent: 'skill', label: 'Frostfall Storm DMG' }, time), chainId: 'c1' }) as Parameters<typeof effectivePoints>[0][number];
    expect(effectivePoints([act(0, burst, 0, 200), tick(1), tick(2), act(0, normal, 3, 200)], members)).toEqual([200, undefined, undefined, 200]);
  });
});
