/** Redução de RES/DEF na aba Talentos: valor mostrado e caixa que a tira do cálculo (#53). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, labelTag, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { activeTeamDelta } from '../../src/engine/stats';
import { buffHome, conditionIds, shredRows } from '../../src/features/character/talents';
import { setCondition } from '../../src/features/rotation/projectOps';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const team = (names: string[]) => ({ ...sampleProject(), compat: 'none' as const, extras: [], buffWindows: [], disabled: [], actions: [], members: names.map((n) => defaultMember(n, game)) });
const raw = (who: string, id: string) => effects.characters.find((c) => c.character === who)!.buffs.find((b) => b.id === id)!;
const rows = (names: string[], who: string, id: string) => shredRows(raw(who, id), resolveProject(team(names), game, effects).team.members[names.indexOf(who)].characterEffect!.buffs.find((b) => b.id === id));

describe('redução de RES na aba Talentos', () => {
  it('mostra o valor que vale no time', () => {
    expect(rows(['Skirk', 'Furina', 'Escoffier', 'Shenhe'], 'Escoffier', 'a4')).toEqual([{ name: 'RES Hydro e Cryo do inimigo', value: '−55%' }]);
    expect(rows(['Escoffier', 'Bennett'], 'Escoffier', 'a4')).toEqual([{ name: 'RES Hydro e Cryo do inimigo', value: '−5%' }]);
    // Habilidade 10 sem o +1 do time: 30% (tabela do jogo).
    expect(rows(['Vodyanitsa', 'Bennett'], 'Vodyanitsa', 'skill')).toEqual([{ name: 'RES Hydro e Cryo do inimigo', value: '−30%' }]);
  });
  it('avisa quando o time não cumpre a regra', () => {
    expect(rows(['Linnea', 'Bennett'], 'Linnea', 'a1g')).toEqual([{ name: 'RES Geo do inimigo', value: 'não vale neste time' }]);
  });
  it('o Escudo de Jade do Zhongli aparece no cartão da habilidade', () => {
    expect(buffHome('shield')).toEqual({ kind: 'talent', talent: 'skill' });
  });
  it('desmarcar a caixa tira a redução do cálculo', () => {
    for (const [who, id] of [['Escoffier', 'a4'], ['Linnea', 'a1']] as const) {
      const p = team([who, 'Bennett']);
      const shred = (q: typeof p) => {
        const a = assembleTeam(resolveProject(q, game, effects).team);
        const timed = activeTeamDelta(a.buffs, who, new Set([labelTag(raw(who, id).label)])).resShred ?? {};
        const el = raw(who, id).resShred!.elements[0];
        return (timed[el] ?? 0) + 0.1 - (a.enemyRes[el] ?? 0.1);
      };
      expect(shred(p)).toBeGreaterThan(0.04);
      expect(shred(setCondition(p, conditionIds(0, raw(who, id)), false, []) as typeof p)).toBeCloseTo(0, 9);
    }
  });
});
