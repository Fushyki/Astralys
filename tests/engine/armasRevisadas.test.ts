/** Passivas que passaram a entrar no cálculo na revisão de todas as armas (#58). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData, type MemberRef } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

/** Stats do dono e o 1º golpe Normal dele, sozinho, com a arma pedida. */
function run(character: string, patch: Partial<MemberRef>, disabled: string[] = []) {
  const move = game.moves.find((m) => m.character === character && m.hitType === 'normal')!;
  const p = {
    ...sampleProject(), compat: 'none' as const, extras: [], buffWindows: [], disabled,
    members: [{ ...defaultMember(character, game), gearManual: false, ...patch }],
    actions: [{ id: 'a', member: 0, move: { character, talent: move.talent, label: move.label, variant: 0 }, executions: 1, reaction: 'none' as const, activeTags: [], tagSource: 'manual' as const, dmgAdjust: 0, time: 0 }],
  };
  const r = resolveProject(p, game, effects);
  const assembly = assembleTeam(r.team);
  const a = evaluateRotation({ members: r.team.members, assembly, config: r.team.config, rolls: [minimumRolls(2)], flatEffects: r.flatEffects }, r.actions).actions[0];
  return { stats: a.stats, flat: a.flatDamage };
}

describe('revisão das armas', () => {
  it('Staff of Homa: ATK por HP máximo (0,8% no R1, 1,6% no R5)', () => {
    for (const [refinement, k] of [[1, 0.008], [5, 0.016]] as const) {
      const patch = { weapon: 'Staff of Homa', refinement };
      const on = run('Hu Tao', patch).stats;
      const off = run('Hu Tao', patch, ['cbuff-0-arma:hp-atk']).stats;
      expect(on.atk - off.atk).toBeCloseTo(k * on.hp, 3);
    }
  });
  it('Redhorn: o dano por DEF entra no golpe Normal', () => {
    const { stats, flat } = run('Noelle', { weapon: 'Redhorn Stonethresher' });
    expect(flat).toBeCloseTo(0.4 * stats.def, 3);
  });
  it('Wolf-Fang e Heretic: os stacks escolhidos mudam o valor', () => {
    const atk = (n: number) => run('Kaeya', { weapon: "Heretic's Molten Blade", stacks: { 'arma:distancia': n } }).stats.atk;
    expect(atk(18)).toBeGreaterThan(atk(0));
    const kit = (n: number) => resolveProject({ ...sampleProject(), compat: 'none', members: [{ ...defaultMember('Kaeya', game), weapon: 'Wolf-Fang', stacks: { 'arma:taxa-hab': n } }] }, game, effects).team.members[0].characterEffect!.buffs.find((b) => b.id === 'arma:taxa-hab')!;
    expect(kit(2).stats!.critRateByType.skill).toBeCloseTo(0.04, 9);
    expect(kit(4).stats!.critRateByType.skill).toBeCloseTo(0.08, 9);
  });
  it('3 estrelas com efeito simples entram (Cool Steel +12% de DMG)', () => {
    const a = run('Kaeya', { weapon: 'Cool Steel' }).stats.dmgBonus;
    const b = run('Kaeya', { weapon: "Traveler's Handy Sword" }).stats.dmgBonus;
    expect(a - b).toBeCloseTo(0.12, 9);
  });
});

describe('uma caixa por condição e versões alternativas', () => {
  const at = (weapon: string, r = 1) => {
    const w = effects.weapons.find((x) => x.weapon === weapon)!;
    return { root: w.refinements![r - 1], by: Object.fromEntries(w.refinements![r - 1].buffs.map((b) => [b.id, b.stats!])) };
  };
  it('separadas somam o mesmo de antes', () => {
    const s = at('Sunny Morning Sleep-In');
    expect(s.root.em).toBe(0);
    expect(s.by.redemoinho.em + s.by.habilidade.em + s.by.supremo.em).toBeCloseTo(248, 9);
    const a = at('Azurelight');
    expect(a.by.habilidade.atkPct + a.by['sem-energia'].atkPct).toBeCloseTo(0.48, 9);
  });
  it('a faixa da versão alternativa, por cima da base, dá os números dela (R1 e R5)', () => {
    for (const r of [1, 5]) {
      const k = r === 1 ? 1 : 2;
      const d = at('Deathmatch', r).by;
      expect(d.um.atkPct + d.dois.atkPct).toBeCloseTo(0.16 * k, 9);
      expect(d.dois.defPct).toBeCloseTo(0.16 * k, 9);
      const n = at('New Bough', r).by;
      expect(n.stacks.atkPct + n.radiance.atkPct).toBeCloseTo(0.06 * 3 * k, 9);
      expect(n.stacks.em + n.radiance.em).toBeCloseTo(0, 9);
      const w = at("Winter's Heavy Heart", r).by;
      expect(w.cryo.em + w['radiance-cryo'].em).toBeCloseTo(20 * k, 9);
      expect(w['radiance-electro'].em).toBeCloseTo(20 * k, 9);
      expect(w.electro.atkPct + w['radiance-electro'].atkPct).toBeCloseTo(0, 9);
    }
  });
  it('Engulfing Lightning respeita o refino e a Recarga extra tem caixa', () => {
    for (const [refinement, coef, er] of [[1, 0.28, 0.3], [5, 0.56, 0.5]] as const) {
      expect(at('Engulfing Lightning', refinement).root.atkPctPerEr!.coef).toBeCloseTo(coef, 9);
      const patch = { weapon: 'Engulfing Lightning', refinement };
      const on = run('Xiangling', patch).stats;
      const off = run('Xiangling', patch, ['m0:cbuff-arma:recarga']).stats;
      expect(on.er - off.er).toBeCloseTo(er, 9);
      expect(on.atk).toBeGreaterThan(off.atk);
    }
  });
});

