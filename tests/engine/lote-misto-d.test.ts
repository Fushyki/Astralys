import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

type Act = { member: number; talent: 'normal' | 'skill' | 'burst' | 'proc'; label: string; tags?: string[] };
type Mem = { character: string; constellation?: number };
function run(members: Mem[], actions: Act[]) {
  const p = {
    ...sampleProject(), compat: 'none', elementMode: 'personagem',
    members: members.map((m) => ({ ...defaultMember(m.character, game), ...m })),
    actions: actions.map((a, i) => ({
      id: `a${i}`, member: a.member, move: { character: members[a.member].character, talent: a.talent, label: a.label, variant: 0 },
      executions: 1, reaction: 'none', activeTags: a.tags ?? [], tagSource: 'manual', dmgAdjust: 0, time: i,
    })),
    buffWindows: [], disabled: [],
  };
  const r = resolveProject(p as never, game, effects);
  const asm = assembleTeam(r.team);
  const out = evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions;
  return Object.assign(out, { tags: [...new Set(asm.buffs.map((b) => b.tag))] });
}
const has = (name: string, label: string) => game.moves.some((m) => m.character === name && m.label === label);

describe('rótulos usados existem em moves.json', () => {
  it('golpes dos testes', () => {
    expect(has('Odette', 'Skill DMG')).toBe(true);
    expect(has('Alyosha', 'Press DMG')).toBe(true);
    expect(has('Aether (Cryo)', '1-Hit DMG')).toBe(true);
    expect(has('Aether (Electro)', 'Charged Attack DMG')).toBe(true);
    expect(has('Aether (Electro)', 'Falling Thunder DMG')).toBe(true);
  });
});

describe('Odette', () => {
  const skill: Act = { member: 0, talent: 'skill', label: 'Skill DMG' };
  it('C2: RES Cryo -20% só na janela (e Electro/Anemo nas suas)', () => {
    const m: Mem[] = [{ character: 'Odette', constellation: 2 }];
    const [off] = run(m, [skill]);
    expect(off.stats.resShred.Cryo ?? 0).toBe(0);
    const [cryo] = run(m, [{ ...skill, tags: ['label:Odette C2 (RES Cryo)'] }]);
    const [ele] = run(m, [{ ...skill, tags: ['label:Odette C2 (RES Electro)'] }]);
    const [ane] = run(m, [{ ...skill, tags: ['label:Odette C2 (RES Anemo)'] }]);
    expect(cryo.stats.resShred.Cryo).toBeCloseTo(0.2, 9);
    expect(ele.stats.resShred.Electro).toBeCloseTo(0.2, 9);
    expect(ane.stats.resShred.Anemo).toBeCloseTo(0.2, 9);
  });
  it('C2: ATK% por stack só na janela', () => {
    const m: Mem[] = [{ character: 'Odette', constellation: 2 }];
    const [off] = run(m, [skill]);
    const [on] = run(m, [{ ...skill, tags: ['label:Odette C2'] }]);
    expect(on.stats.atk).toBeGreaterThan(off.stats.atk);
  });
  it('Snow Swan\'s Dream do Supremo entra como janela da própria Odette', () => {
    const on = run([{ character: 'Odette' }], [{ ...skill, tags: ["label:Odette: Snow Swan's Dream"] }]);
    expect(on.tags).toContain("label:Odette: Snow Swan's Dream");
  });
});

describe('Alyosha', () => {
  const press: Act = { member: 0, talent: 'skill', label: 'Press DMG' };
  it("Hunter's Precision: ATK% só na janela, dentro do teto do nível 15 (27,56%)", () => {
    const [off] = run([{ character: 'Alyosha' }], [press]);
    const [on] = run([{ character: 'Alyosha' }], [{ ...press, tags: ["label:Alyosha: Hunter's Precision (ATK)"] }]);
    expect(on.stats.atk).toBeGreaterThan(off.stats.atk);
  });
  it('A4 (Stellar-Conduct): entra como janela', () => {
    const on = run([{ character: 'Alyosha' }], [{ ...press, tags: ['label:Alyosha A4 (Stellar-Conduct)'] }]);
    expect(on.tags).toContain('label:Alyosha A4 (Stellar-Conduct)');
  });
});

describe('Viajante Cryo e Electro (Aether e Lumine)', () => {
  for (const who of ['Aether', 'Lumine']) {
    it(`${who} (Cryo) C2: 60 de Maestria; com o reforço Estelar ligado, 120`, () => {
      const m: Mem[] = [{ character: `${who} (Cryo)`, constellation: 2 }];
      const hit: Act = { member: 0, talent: 'normal', label: '1-Hit DMG' };
      const [off] = run(m, [hit]);
      const [base] = run(m, [{ ...hit, tags: ['label:Viajante C2'] }]);
      const [both] = run(m, [{ ...hit, tags: ['label:Viajante C2', 'label:Viajante C2 (Stellar Glimmer)'] }]);
      expect(base.stats.em - off.stats.em).toBeCloseTo(60, 6);
      expect(both.stats.em - off.stats.em).toBeCloseTo(120, 6);
    });
    it(`${who} (Electro) A4: Detonate soma 100% do ATK em cada um dos 2 acertos do Carregado`, () => {
      const m: Mem[] = [{ character: `${who} (Electro)` }];
      const [r] = run(m, [{ member: 0, talent: 'normal', label: 'Charged Attack DMG' }]);
      expect(r.flatDamage).toBeCloseTo(2 * r.stats.atk, 6);
      const [plain] = run(m, [{ member: 0, talent: 'normal', label: '1-Hit DMG' }]);
      expect(plain.flatDamage).toBe(0);
    });
    it(`${who} (Electro) C2: RES Electro -15% só na janela`, () => {
      const m: Mem[] = [{ character: `${who} (Electro)`, constellation: 2 }];
      const fall: Act = { member: 0, talent: 'burst', label: 'Falling Thunder DMG' };
      const [off] = run(m, [fall]);
      const [on] = run(m, [{ ...fall, tags: ['label:Viajante C2'] }]);
      expect(off.stats.resShred.Electro ?? 0).toBe(0);
      expect(on.stats.resShred.Electro).toBeCloseTo(0.15, 9);
    });
    it(`${who} (Electro) A4: raio do Detonate é um golpe extra de 200% do ATK`, () => {
      const [r] = run([{ character: `${who} (Electro)` }], [{ member: 0, talent: 'proc', label: 'char:a3raio' }]);
      expect(r.avg).toBeGreaterThan(0);
    });
  }
});
