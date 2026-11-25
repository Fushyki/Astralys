/** Death's Crossing limitado pelo time (#50) e regras de time no membro trocado da comparação (#51). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { resolveMember, swapMember } from '../../src/engine/project';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const project = (names: string[], stacks?: number) => ({ ...sampleProject(), compat: 'none' as const, extras: [], buffWindows: [], disabled: [], members: names.map((n, i) => ({ ...defaultMember(n, game), constellation: 4, ...(!i && stacks !== undefined ? { stacks: { a4n: stacks } } : {}) })), actions: [] });
/** Parte extra do multiplicador do Normal (0,7 = 170% do dano original). */
const normal = (names: string[], stacks?: number) => resolveProject(project(names, stacks), game, effects).team.members[0].characterEffect!.buffs.find((b) => b.id === 'a4n')?.moveMult!.extra ?? 0;

describe("Skirk: Death's Crossing", () => {
  it('1 acúmulo por colega Hydro ou Cryo', () => {
    expect(normal(['Skirk', 'Furina', 'Escoffier', 'Shenhe'])).toBeCloseTo(0.7, 6);
    expect(normal(['Skirk', 'Furina', 'Escoffier', 'Sucrose'])).toBeCloseTo(0.2, 6);
    expect(normal(['Skirk', 'Furina', 'Bennett', 'Sucrose'])).toBeCloseTo(0.1, 6);
    expect(normal(['Skirk', 'Bennett'])).toBe(0);
  });
  it('a escolha menor continua valendo e a maior respeita o time', () => {
    expect(normal(['Skirk', 'Furina', 'Escoffier', 'Shenhe'], 1)).toBeCloseTo(0.1, 6);
    expect(normal(['Skirk', 'Furina', 'Escoffier', 'Sucrose'], 3)).toBeCloseTo(0.2, 6);
    expect(normal(['Skirk', 'Furina', 'Escoffier', 'Shenhe'], 0)).toBe(0);
  });
  it('o ATK da C4 segue o mesmo teto', () => {
    const c4 = resolveProject(project(['Skirk', 'Furina', 'Escoffier', 'Sucrose']), game, effects).team.members[0].characterEffect!.buffs.find((b) => b.id === 'c4')!;
    expect(c4.stats!.atkPct).toBeCloseTo(0.2, 6);
  });
});

describe('membro trocado na comparação', () => {
  it('recebe as mesmas regras do cálculo principal', () => {
    const p = project(['Skirk', 'Furina', 'Escoffier', 'Shenhe']);
    const team = resolveProject(p, game, effects).team;
    for (const i of [0, 1, 2]) {
      const raw = resolveMember(p.members[i], game, effects, p.config.minRollsPerSubstat, p.config.characterLevel);
      expect(swapMember(team.members, i, raw, false)[i].characterEffect).toEqual(team.members[i].characterEffect);
    }
  });
});
