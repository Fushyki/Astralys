import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import type { Element } from '../../src/data/schema';

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

/** Exemplo: Mavuika (Pyro), Citlali (Cryo), Iansan (Electro, com o Scroll) e Bennett (Pyro). */
const project = () => ({ ...sampleProject(), compat: undefined });
const scrollTargets = (reacted?: Element[]) => {
  const p = project();
  p.members[2] = { ...p.members[2], ...(reacted ? { reacted } : {}) };
  const a = assembleTeam(resolveProject(p, game, effects).team, {});
  const targets = (id: string) => a.buffs.find((b) => b.id === `cbuff-2-set4-Scroll of the Hero of Cinder City:${id}`)?.targets.slice().sort() ?? [];
  return { reacao: targets('reacao'), noite: targets('noite') };
};

describe('Scroll of the Hero of Cinder City: elementos da reação', () => {
  it('sem escolha, vale só para o elemento do dono (Electro)', () => {
    expect(scrollTargets().reacao).toEqual(['Iansan']);
  });
  it('com Pyro na reação, vale para Pyro e Electro (as duas faixas)', () => {
    const t = scrollTargets(['Pyro']);
    expect(t.reacao).toEqual(['Bennett', 'Iansan', 'Mavuika']);
    expect(t.noite).toEqual(t.reacao);
  });
  it('um elemento que não reagiu fica de fora (Cryo)', () => {
    expect(scrollTargets(['Pyro']).reacao).not.toContain('Citlali');
    expect(scrollTargets(['Pyro', 'Cryo']).reacao).toContain('Citlali');
  });
});

describe('Viridescent Venerer: RES só dos elementos espalhados', () => {
  const res = (reacted?: Element[]) => {
    const p = project();
    p.members[1] = { ...p.members[1], primarySet: 'Viridescent Venerer', secondarySet: undefined, fourPiece: true, ...(reacted ? { reacted } : {}) };
    return assembleTeam(resolveProject(p, game, effects).team, {  }).enemyRes;
  };
  it('sem escolha mantém o antigo (elementos do time)', () => {
    expect(res().Pyro).toBeLessThan(res(['Hydro']).Pyro);
  });
  it('com escolha, só os elementos escolhidos perdem RES', () => {
    const base = res(['Hydro']);
    expect(base.Hydro).toBeLessThan(base.Electro);
    expect(base.Electro).toBeCloseTo(res([]).Electro, 9);
  });
});
