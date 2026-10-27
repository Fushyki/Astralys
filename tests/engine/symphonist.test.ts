import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { activeTeamDelta } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

describe('Symphonist of Scents (arma assinatura da Escoffier) na Iansan', () => {
  const base = sampleProject();
  const members = base.members.map((m) => (m.character === 'Iansan' ? { ...m, weapon: 'Symphonist of Scents', refinement: 1, constellation: 2 } : m));
  const p: any = { ...base, compat: 'none', members, extras: [], disabled: [], enabled: [] };
  const r = resolveProject(p, game, effects);
  const asm = assembleTeam({ ...r.team, disabled: [] });
  const ATK_FROM_IANSAN = (tags: string[]) => activeTeamDelta(asm.buffs, 'Mavuika', new Set(tags), (b) => (b.description ?? '').startsWith('Iansan')).atkPct;

  it('Sweet Echoes dá +32% de ATK (R1) ao time e a C2 soma +30%: Iansan dá 62% ao Mavuika', () => {
    expect(ATK_FROM_IANSAN(['label:Iansan: Sweet Echoes (ATK de quem cura e de quem foi curado)'.replace('Iansan: ', 'Symphonist of Scents: '), 'label:Iansan C2'])).toBeCloseTo(0.62, 9);
  });

  it('o ATK base (12%) e o de fora de campo (+12%) são só do portador', () => {
    expect(ATK_FROM_IANSAN([])).toBeCloseTo(0, 9);
    const names = asm.buffs.filter((b) => (b.description ?? '').includes('fora de campo')).map((b) => b.targets);
    expect(names).toEqual([['Iansan']]);
  });
});
