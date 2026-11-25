/** Lote 1 da comparação com o Genshin Optimizer (Issue #49). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { pointExtra } from '../../src/engine/project';
import { activeCharacterBuffs } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const member = (name: string) => resolveProject({ ...sampleProject(), compat: 'none', members: [defaultMember(name, game)], actions: [] } as never, game, effects).team.members[0];
const buff = (name: string, id: string) => activeCharacterBuffs(member(name)).find((b) => b.id === id)!;
const extra = (name: string, talent: string, label: string, points?: number) => pointExtra({ talent, label }, member(name).characterEffect, { normal: 10, skill: 10, burst: 10 }, points)?.atk ?? 0;

describe('lote 1', () => {
  it('Neuvillette A1 multiplica só o Julgamento Equitativo', () => {
    expect(buff('Neuvillette', 'a1').moveMult!.labels).toEqual(['Charged Attack: Equitable Judgment']);
    expect(buff('Neuvillette', 'a1').stats).toBeUndefined();
  });
  it('Chevreuse A4 vale para ela também', () => expect(buff('Chevreuse', 'a4').scope).toBe('team'));
  it('multiplicadores e DEF fixa seguem o nível do talento (10)', () => {
    expect(buff('Wanderer', 'skill').moveMult!.extra).toBeCloseTo(0.5372, 4);
    expect(buff('Yoimiya', 'skill').moveMult!.extra).toBeCloseTo(0.6174, 4);
    expect(buff('Gorou', 'skill-def').stats!.defFlat).toBeCloseTo(371, 0);
  });
  it('recursos somam por ponto, com o bônus de teto do Heizou', () => {
    expect(extra('Lyney', 'skill', 'Skill DMG', 5)).toBeCloseTo(5 * 0.9576, 4);
    expect(extra('Shikanoin Heizou', 'skill', 'Skill DMG', 3)).toBeCloseTo(3 * 1.0238, 4);
    expect(extra('Shikanoin Heizou', 'skill', 'Skill DMG', 4)).toBeCloseTo(4 * 1.0238 + 2.0477, 4);
    expect(extra('Raiden Shogun', 'burst', 'Musou no Hitotachi Base DMG', 60)).toBeCloseTo(60 * 0.07, 4);
    expect(extra('Raiden Shogun', 'burst', '1-Hit DMG', 60)).toBeCloseTo(60 * 0.0131, 4);
  });
});
