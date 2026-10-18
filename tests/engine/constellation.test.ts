import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, effectiveTalents, resolveProject, type EffectsData, type GameData, type RotationProject } from '../../src/engine';
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

describe('constelações e níveis de talento', () => {
  const mavuika = game.characters.find((c) => c.name === 'Mavuika')!;

  it('o Lunaris diz qual talento sobe na C3 e na C5 (Mavuika: Supremo e Habilidade)', () => {
    expect(mavuika.constellationBoosts).toEqual({ c3: 'burst', c5: 'skill' });
  });

  it('C0 a C2 não mudam; C3 sobe o Supremo; C5 sobe também a Habilidade', () => {
    const base = { normal: 9, skill: 8, burst: 7 };
    expect(effectiveTalents(base, 0, mavuika)).toEqual(base);
    expect(effectiveTalents(base, 2, mavuika)).toEqual(base);
    expect(effectiveTalents(base, 3, mavuika)).toEqual({ normal: 9, skill: 8, burst: 10 });
    expect(effectiveTalents(base, 5, mavuika)).toEqual({ normal: 9, skill: 11, burst: 10 });
    expect(effectiveTalents(base, 6, mavuika)).toEqual({ normal: 9, skill: 11, burst: 10 });
  });

  it('o nível nunca passa de 15 e personagem sem dado de constelação não muda', () => {
    expect(effectiveTalents({ normal: 10, skill: 14, burst: 15 }, 5, mavuika)).toEqual({ normal: 10, skill: 15, burst: 15 });
    expect(effectiveTalents({ normal: 1, skill: 1, burst: 1 }, 6, {})).toEqual({ normal: 1, skill: 1, burst: 1 });
  });

  it('quase todos os personagens jogáveis têm os dois talentos de constelação identificados', () => {
    const withBoth = game.characters.filter((c) => c.constellationBoosts?.c3 && c.constellationBoosts?.c5);
    expect(withBoth.length / game.characters.length).toBeGreaterThan(0.9);
    for (const c of withBoth) expect(c.constellationBoosts!.c3, c.name).not.toBe(c.constellationBoosts!.c5);
  });

  const dprWith = (constellation?: number) => {
    const base = sampleProject();
    const p: RotationProject = { ...base, members: base.members.map((m, i) => (i === 0 ? { ...m, constellation } : m)) };
    const r = resolveProject(p, game, effects);
    return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).optimization.result.totals.avg;
  };

  it('no motor, a C3 da Mavuika sobe o Supremo e o dano da rotação; C0 reproduz a planilha', () => {
    expect(dprWith(undefined)).toBeCloseTo(3790496.07, 1);
    expect(dprWith(0)).toBeCloseTo(3790496.07, 1);
    expect(dprWith(3)).toBeGreaterThan(dprWith(0));
  });

  it('a constelação sobrevive ao salvar e ler o projeto', () => {
    const base = sampleProject();
    const withC = { ...base, members: base.members.map((m, i) => (i === 0 ? { ...m, constellation: 6 } : m)) };
    const again = JSON.parse(JSON.stringify(withC));
    expect(again.members[0].constellation).toBe(6);
  });

  it('linhas de constelação do comparador: C3 rende mais que C0 (só o +3 do Supremo) para a Mavuika', async () => {
    const { compareWeapons } = await import('../../src/engine');
    const { resolveMember } = await import('../../src/engine');
    const project = sampleProject();
    const resolved = resolveProject(project, game, effects);
    const cands = [0, 3].map((c) => ({
      weapon: project.members[0].weapon,
      constellation: c,
      team: { ...resolved.team, members: resolved.team.members.map((m, i) => (i === 0 ? resolveMember({ ...project.members[0], constellation: c || undefined }, game, effects, project.config.minRollsPerSubstat) : m)) },
    }));
    const rows = compareWeapons({ member: 0, candidates: cands, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });
    const get = (c: number) => rows.find((r) => r.constellation === c)!.teamAvg;
    expect(get(0)).toBeCloseTo(3790496.07, 1);
    expect(get(3)).toBeGreaterThan(get(0));
  });
});
