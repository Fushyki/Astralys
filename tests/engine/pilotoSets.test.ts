import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, assembleTeam, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import type { RotationProject } from '../../src/engine/project';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const zero = { CR: 0, CD: 0, 'ATK%': 0, EM: 0, ER: 0, ATK: 0, 'HP%': 0, HP: 0, 'DEF%': 0, DEF: 0 };

/** Exemplo (Mavuika, Citlali, Iansan, Bennett) sem rolls, com o set pedido no membro `who`. */
const withSet = (set?: string, fourPiece?: boolean, who = 0): RotationProject => {
  const base = sampleProject();
  return { ...base, compat: 'none' as const, members: base.members.map((m, i) => (i === who ? { ...m, primarySet: set, secondarySet: undefined, fourPiece, manualRolls: zero } : m)) };
};
const stats = (p: RotationProject, i = 0) => {
  const r = resolveProject(p, game, effects);
  return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).memberStats[i];
};
const set = (n: string) => effects.sets.find((s) => s.set === n)!;

describe('piloto de conjuntos', () => {
  it('Obsidian Codex: 2 peças +15% de DMG e 4 peças +40% de Taxa CRIT, no cálculo', () => {
    const none = stats(withSet(undefined));
    const two = stats(withSet('Obsidian Codex', false));
    const four = stats(withSet('Obsidian Codex'));
    expect(two.dmgBonus - none.dmgBonus).toBeCloseTo(0.15, 9);
    expect(two.critRate).toBeCloseTo(none.critRate, 9);
    expect(four.critRate - two.critRate).toBeCloseTo(0.4, 9);
    expect(set('Obsidian Codex').fonte_info).toContain('piloto-sets');
  });

  it('Instructor: 2 peças +80 de Maestria no dono; 4 peças +120 para a equipe inteira, só na janela de buff', () => {
    expect(stats(withSet('Instructor', false)).em - stats(withSet(undefined)).em).toBeCloseTo(80, 9);
    expect(set('Instructor').fourPiece?.team).toEqual({ atkPct: 0, dmgPct: 0, em: 120 });
    const a = assembleTeam(resolveProject(withSet('Instructor'), game, effects).team, {});
    const b = a.buffs.find((x) => x.id.includes('gear-0'));
    expect(b).toBeTruthy();
    expect(b!.delta.em).toBeCloseTo(120, 9);
    expect(b!.targets).toBe('all');
  });

  it('Scroll of the Hero of Cinder City: +12% por 15 s e +28% por 20 s (equipe, elementos da reação)', () => {
    const buffs = set('Scroll of the Hero of Cinder City').fourPiece!.buffs;
    const [reacao, noite] = ['reacao', 'noite'].map((id) => buffs.find((b) => b.id === id)!);
    expect([reacao.stats!.dmgPct, reacao.duration, noite.stats!.dmgPct, noite.duration]).toEqual([0.12, 15, 0.28, 20]);
    expect([reacao.scope, reacao.timed, reacao.forReacted]).toEqual(['team', true, true]);
    expect(set('Scroll of the Hero of Cinder City').twoPiece).toBeUndefined();
  });
});
