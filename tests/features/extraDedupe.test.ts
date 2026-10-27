import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { memberBuffCards } from '../../src/features/character/characterModel';
import { dropDuplicateExtras, findDuplicateExtras } from '../../src/features/rotation/extraDedupe';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

describe('buffs extras duplicados', () => {
  it('a lista de buffs de um personagem não repete nenhum buff (sem origem conhecida só uma vez)', () => {
    const p = sampleProject();
    const r = resolveProject(p, game, effects);
    const b = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
    for (let i = 0; i < p.members.length; i++) {
      const ids = memberBuffCards(p, r, b, i).map((c) => c.id);
      expect(new Set(ids).size, p.members[i].character).toBe(ids.length);
    }
  });

  it('no exemplo, o +25% e o +15% de DMG têm origem (Iansan C6 e Bennett C6); só o +30% de ATK segue sem origem', () => {
    const p = sampleProject();
    const unknown = p.extras.filter((e) => /origem não identificada/i.test(e.description ?? ''));
    expect(unknown.map((e) => `${e.stat} ${e.value}`)).toEqual(['ATK% 0.3', 'ATK% 0.3']);
    expect(p.extras.some((e) => e.description === 'Iansan C6: +25% de DMG')).toBe(true);
    expect(p.extras.some((e) => e.description === 'Bennett C6 (Fogo e Coragem): +15% de DMG')).toBe(true);
  });

  it('fora da planilha, um extra igual a um buff já modelado é descartado com aviso', () => {
    const base = sampleProject();
    const p = { ...base, compat: 'none' as const, extras: [{ target: 'Mavuika', stat: 'ATK%', value: 0.3, team: false, description: 'cópia da A1' }, { target: 'Mavuika', stat: 'ATK%', value: 0.123, team: false, description: 'único' }] };
    const dups = findDuplicateExtras(p, game, effects);
    expect(dups.map((d) => d.index)).toEqual([0]);
    const r = dropDuplicateExtras(p, game, effects);
    expect(r.project.extras.map((e) => e.description)).toEqual(['único']);
    expect(r.warnings[0]).toMatch(/^Buff ignorado: já calculado por .*Mavuika/);
    // modo planilha: as passivas curadas ficam de fora, então os extras valem
    expect(findDuplicateExtras({ ...p, compat: 'planilha' }, game, effects)).toEqual([]);
  });
});
