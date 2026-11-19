import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { loadoutFromPieces, type GoodArtifact } from '../../src/features/good/goodImport';
import { MANUAL_LOCATION } from '../../src/features/good/kqmPieces';
import { sampleForApp } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

/** Mesmo caminho do botão "Otimizado (KQM)": personagem sem peças, com os stats principais e o set das peças dadas. */
function redistribute(setKey: string, circlet: string): number[] {
  const project = sampleForApp();
  const i = project.members.findIndex((m) => m.character === 'Mavuika');
  const mk = (slotKey: GoodArtifact['slotKey'], mainStatKey: string): GoodArtifact => ({ setKey, slotKey, rarity: 5, level: 20, mainStatKey, substats: [], location: MANUAL_LOCATION });
  const pieces = [mk('flower', 'hp'), mk('plume', 'atk'), mk('sands', 'atk_'), mk('goblet', 'pyro_dmg_'), mk('circlet', circlet)];
  const lo = loadoutFromPieces(pieces, game);
  const probe = { ...project.members[i], pieces: undefined, piecesChoice: 'generic' as const, noArtifacts: undefined, manualRolls: undefined, forcedCritRolls: undefined, artifacts: lo.artifacts, primarySet: lo.primarySet, secondarySet: lo.secondarySet, fourPiece: lo.fourPiece };
  const r = resolveProject({ ...project, members: project.members.map((m, j) => (j === i ? probe : m)) }, game, effects);
  const rolls = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).optimization.rolls[i];
  return [rolls.CR, rolls.CD, rolls['ATK%'], rolls.EM, rolls.ER];
}

it('KQM redistribui os procs conforme o set e o stat principal das peças', () => {
  const codex = redistribute('ObsidianCodex', 'critDMG_');
  const gladiator = redistribute('GladiatorsFinale', 'critDMG_');
  expect(codex[0]).toBeLessThan(gladiator[0]); // +40% de Taxa do set: menos procs de CR
  expect(redistribute('ObsidianCodex', 'critRate_')[0]).toBeLessThan(codex[0]); // tiara com Taxa: menos procs de CR
});
