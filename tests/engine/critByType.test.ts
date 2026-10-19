import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import type { CharacterBuff } from '../../src/effects/schema';
import { sampleProject } from '../../src/features/rotation/persistence';

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
const base = resolveProject(sampleProject(), game, effects);
const zero = { atkPct: 0, dmgPct: 0, critRate: 0, critDmg: 0, em: 0, er: 0, hpPct: 0, defPct: 0, dmgPctByType: {}, critRateByType: {}, critDmgByType: {} };
const run = (stats: Partial<typeof zero>) => {
  const buff = { id: 'ct', label: 'CT', minConstellation: 0, scope: 'self', timed: false, stats: { ...zero, ...stats } } as CharacterBuff;
  const members = base.team.members.map((m, i) => (i === 0 ? { ...m, characterEffect: { ...m.characterEffect!, buffs: [buff] } } : m));
  return analyzeProject({ team: { ...base.team, members }, actions: base.actions, flatEffects: base.flatEffects, ampCoefficient: base.ampCoefficient });
};
const none = run({});

describe('crítico por tipo de golpe', () => {
  it('sem buff é igual ao gabarito', () => expect(none.optimization.result.totals.dps).toBeCloseTo(216_599.78, 1));

  it('Taxa Crítica de Supremo só muda os golpes de Supremo do dono', () => {
    const r = run({ critRateByType: { burst: 0.1 } });
    const before = none.optimization.result.actions;
    const after = r.optimization.result.actions;
    let burstHits = 0;
    after.forEach((a, i) => {
      const same = a.action.member !== 0 || a.action.move.hitType !== 'burst';
      if (same) expect(a.avg).toBeCloseTo(before[i].avg, 6);
      else if (a.crit > a.noCrit) {
        burstHits++;
        expect(a.avg).toBeGreaterThanOrEqual(before[i].avg);
      }
    });
    expect(burstHits).toBeGreaterThan(0);
    expect(r.optimization.result.totals.avg).toBeGreaterThan(none.optimization.result.totals.avg);
  });

  it('Dano Crítico por tipo também só afeta aquele tipo', () => {
    const r = run({ critDmgByType: { normal: 0.5 } });
    r.optimization.result.actions.forEach((a, i) => {
      const before = none.optimization.result.actions[i];
      if (a.action.member === 0 && a.action.move.hitType === 'normal') expect(a.crit).toBeGreaterThan(before.crit);
      else expect(a.crit).toBeCloseTo(before.crit, 6);
    });
  });
});
