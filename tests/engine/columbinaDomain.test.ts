import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { assembleTeam, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

it('Domínio Lunar da Columbina dá DMG Lunar à equipe pelo nível do Supremo (tabela do Genshin Optimizer)', () => {
  const members = ['Columbina', 'Flins'].map((n) => ({ ...defaultMember(n, game), factions: ['moonsign'] as ('moonsign' | 'hexerei')[] }));
  Object.assign(members[0], { talents: { normal: 10, skill: 10, burst: 10 } });
  const p: any = { ...sampleProject(), compat: 'none', elementMode: 'personagem', members, actions: [], buffWindows: [], disabled: [] };
  const a = assembleTeam({ ...resolveProject(p, game, effects).team, disabled: [] });
  const b = a.buffs.find((x) => x.description.includes('Domínio Lunar'));
  expect(b).toBeDefined();
  expect((b!.delta as any).reactionBonus.lunarcharged).toBeCloseTo(0.4, 9);
});
