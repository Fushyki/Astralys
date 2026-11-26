/** A cópia dos dados que o site importa (`scripts/app-data.ts`) só pode perder o que o site não lê. */
import { describe, expect, it } from 'vitest';
import { appData } from '../../scripts/app-data';
import { analyzeProject, memberProcs, resolveProject } from '../../src/engine';
import { loadData, teamNames } from '../../src/features/rotation/data';
import { buildNewTeam } from '../../src/features/rotation/newTeam';
import { sampleForApp, sampleProject } from '../../src/features/rotation/persistence';
import effects from '../../src/effects/characters.json';
import flatDamage from '../../src/effects/flatDamage.json';
import setEffects from '../../src/effects/sets.json';
import weaponEffects from '../../src/effects/weapons.json';
import levels from '../../src/data/generated/levels.json';
import moves from '../../src/data/generated/moves.json';
import talents from '../../src/data/generated/talents.json';
import artifacts from '../../src/data/generated/artifacts.json';
import characters from '../../src/data/generated/characters.json';
import weapons from '../../src/data/generated/weapons.json';
import type { ArtifactSet, Character, Weapon } from '../../src/data/schema';

const app = appData();
type Text = { description?: string; descriptionPt?: string; params?: number[] };
const full = (list: unknown) => list as Record<string, any>[];

describe('dados do site', () => {
  it('armas: só saem os params e o inglês que tem português', () => {
    const slim = app['weapons.json'] as Weapon[];
    const back = slim.map((w, i) => ({
      ...w,
      passive: w.passive && { ...w.passive, refinements: w.passive.refinements.map((r: Text, k: number) => ({ ...full(weapons)[i].passive.refinements[k], ...r })) },
    }));
    expect(back).toEqual(weapons);
    for (const r of slim.flatMap((w) => (w.passive?.refinements ?? []) as Text[])) {
      expect(r.params).toBeUndefined();
      expect(r.descriptionPt ?? r.description).toBeTruthy();
    }
  });

  it('sets: só saem o bônus de 1 peça, os params e o inglês que tem português', () => {
    const slim = app['artifacts.json'] as ArtifactSet[];
    expect(slim.map((s) => s.name)).toEqual(full(artifacts).map((s) => s.name));
    slim.forEach((s, i) => {
      const { onePiece: _, ...kept } = full(artifacts)[i].bonuses;
      expect(Object.keys(s.bonuses)).toEqual(Object.keys(kept));
      for (const [k, b] of Object.entries(s.bonuses) as [string, Text][]) expect(b.descriptionPt ?? b.description).toBe(kept[k].descriptionPt ?? kept[k].description);
    });
  });

  it('golpes, efeitos e talentos: os arquivos por personagem juntos são os originais', () => {
    const of = (kind: string) => full(characters).map((c) => app[`${kind}/${c.id}.json`]);
    const sorted = (list: unknown[]) => list.map((x) => JSON.stringify(x)).sort();
    expect(sorted(of('moves').flat())).toEqual(sorted(moves));
    expect(sorted(of('effects').flat())).toEqual(sorted(effects));
    expect(sorted(of('talents').filter(Boolean))).toEqual(sorted(talents));
  });

  it('o resultado do motor é o mesmo com a cópia do time e com os dados completos', async () => {
    const game = { characters, moves, weapons, artifacts, levels } as unknown as Parameters<typeof resolveProject>[1];
    const fx = { characters: effects, weapons: weaponEffects, sets: setEffects, flatDamage } as unknown as Parameters<typeof resolveProject>[2];
    for (const project of [sampleForApp(), sampleProject()]) {
      const own = await loadData(teamNames(project));
      const run = (g: typeof game, e: typeof fx) => {
        const r = resolveProject(project, g, e);
        return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).optimization.result.totals;
      };
      expect(run(own.game, own.effects)).toEqual(run(game, fx));
    }
  });

  it('cada personagem sozinho monta o mesmo time e os mesmos golpes extras que com todos carregados', async () => {
    const names = full(characters).map((c) => c.name as string);
    const all = await loadData(names);
    for (const name of names) {
      const own = await loadData([name]);
      const project = buildNewTeam({ characters: [name], rotation: 'basic' }, all.game, all.effects);
      const mine = resolveProject(project, own.game, own.effects);
      const theirs = resolveProject(project, all.game, all.effects);
      expect(mine, name).toEqual(theirs);
      expect(memberProcs(mine.team.members[0], own.game.moves), name).toEqual(memberProcs(theirs.team.members[0], all.game.moves));
    }
  });

  it('personagens: só saem as partículas', () => {
    const slim = app['characters.json'] as Character[];
    expect(slim.map((c, i) => ({ ...c, particles: full(characters)[i].particles }))).toEqual(characters);
  });
});
