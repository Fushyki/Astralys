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

it('Viridescent Venerer reduz em 40% a RES só dos elementos que existem no time', () => {
  const members = ['Columbina', 'Flins', 'Sucrose'].map((n) => defaultMember(n, game));
  Object.assign(members[2], { primarySet: 'Viridescent Venerer', secondarySet: undefined, fourPiece: true });
  const p: any = { ...sampleProject(), compat: 'none', elementMode: 'personagem', members, actions: [], buffWindows: [], disabled: [] };
  const r = resolveProject(p, game, effects);
  const res = assembleTeam({ ...r.team, disabled: [] }).enemyRes;
  expect(res.Hydro).toBeCloseTo(0.1 - 0.4, 9);
  expect(res.Electro).toBeCloseTo(0.1 - 0.4, 9);
  expect(res.Pyro).toBeCloseTo(0.1, 9);
  expect(res.Cryo).toBeCloseTo(0.1, 9);
});
