import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { receivedBuffs } from '../../src/features/character/characterModel';
import { setBuffEnabled } from '../../src/features/rotation/projectOps';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T,>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

describe('buff de arma para o time: Thrilling Tales of Dragon Slayers', () => {
  it('chega aos aliados (24% de ATK no R1) e só conta depois de ligado', () => {
    const base = { ...sampleProject(), compat: 'none' as const };
    // Bennett (índice 3) é espadachim, mas o buff não depende do tipo: usa a arma no Citlali (catalisador, índice 1).
    const members = base.members.map((m, i) => (i === 1 ? { ...m, weapon: 'Thrilling Tales of Dragon Slayers', refinement: 1, gearManual: true } : m));
    const p = { ...base, members, enabled: [] as string[], disabled: [] as string[] };
    const view = (x: typeof p) => {
      const r = resolveProject(x, game, effects);
      const b = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects });
      return { total: b.optimization.result.totals.avg, cards: receivedBuffs(x, r, b, 0).filter((c) => c.gear && /ATK/.test(c.value) && /próximo/i.test(c.name)) };
    };
    const off = view(p);
    expect(off.cards).toHaveLength(1);
    expect(off.cards[0].value).toContain('24%');
    expect(off.cards[0].active).toBe(false);
    const c = off.cards[0];
    const on = setBuffEnabled(p, { toggleId: c.toggleId, baseId: c.id, gear: true, receiver: 'Mavuika', receivers: c.receivers }, true);
    expect(view(on as typeof p).cards[0].active).toBe(true);
  });
});
