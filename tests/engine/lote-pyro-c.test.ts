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
type Mem = { character: string; constellation?: number; factions?: ('hexerei' | 'moonsign')[] };
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
const tagsOf = (members: Mem[]) => run(members, [{ member: 0, talent: 'normal', label: '1-Hit DMG' }]).tags;

describe('Gaming A4 e C6: o Charmed Cloudstrider é golpe de habilidade no Lunaris', () => {
  const cloud: Act = { member: 0, talent: 'skill', label: 'Plunging Attack: Charmed Cloudstrider DMG' };
  it('o golpe é de habilidade (e o Imersivo comum não é)', () => {
    expect(game.moves.find((m) => m.character === 'Gaming' && m.label === cloud.label)!.hitType).toBe('skill');
  });
  it('A4: +20% de DMG só com a janela ligada', () => {
    const [off] = run([{ character: 'Gaming' }], [cloud]);
    const [on] = run([{ character: 'Gaming' }], [{ ...cloud, tags: ['label:Gaming A4'] }]);
    expect(on.stats.dmgByType.skill - off.stats.dmgByType.skill).toBeCloseTo(0.2, 9);
    expect(on.avg).toBeGreaterThan(off.avg);
  });
  it('C6: +20% de Taxa e +40% de Dano Crítico no golpe (C5 não tem)', () => {
    const [c5] = run([{ character: 'Gaming', constellation: 5 }], [cloud]);
    const [c6] = run([{ character: 'Gaming', constellation: 6 }], [cloud]);
    expect(c6.critDmg - c5.critDmg).toBeCloseTo(0.4, 9);
    expect(c6.critRate).toBeGreaterThan(c5.critRate);
  });
});

describe('Durin: A1, A4 e C6 viram janelas', () => {
  const burst: Act = { member: 0, talent: 'burst', label: 'Dragon of White Flame DMG' };
  it('A1: RES Pyro -20% só dentro da janela', () => {
    const [off] = run([{ character: 'Durin' }], [burst]);
    const [on] = run([{ character: 'Durin' }], [{ ...burst, tags: ['label:Durin A1'] }]);
    expect(off.stats.resShred.Pyro ?? 0).toBe(0);
    expect(on.stats.resShred.Pyro).toBeCloseTo(0.2, 9);
  });
  it('A1 com 2 Hexerei: 35% no lugar de 20% (não soma)', () => {
    const team: Mem[] = [{ character: 'Durin', factions: ['hexerei'] }, { character: 'Nicole', factions: ['hexerei'] }];
    const [on] = run(team, [{ ...burst, tags: tagsOf(team) }]);
    expect(on.stats.resShred.Pyro).toBeCloseTo(0.35, 6);
    const solo = run([{ character: 'Durin' }], [{ ...burst, tags: tagsOf([{ character: 'Durin' }]) }])[0];
    expect(solo.stats.resShred.Pyro).toBeCloseTo(0.2, 6);
  });
  it('A4: +3% por 100 de ATK, até 75%, só na janela', () => {
    const [off] = run([{ character: 'Durin' }], [burst]);
    const [on] = run([{ character: 'Durin' }], [{ ...burst, tags: ['label:Durin A4'] }]);
    expect(on.stats.dmgByType.burst - off.stats.dmgByType.burst).toBeCloseTo(Math.min(0.0003 * on.stats.atk, 0.75), 6);
  });
  it('C6: DEF do inimigo -30% só na janela', () => {
    const [off] = run([{ character: 'Durin', constellation: 6 }], [burst]);
    const [on] = run([{ character: 'Durin', constellation: 6 }], [{ ...burst, tags: ['label:Durin C6 (DEF do inimigo)'] }]);
    expect(off.stats.defShred).toBe(0);
    expect(on.stats.defShred).toBeCloseTo(0.3, 9);
  });
});

describe('Nicole: ATK do Grace of Kenosis, A4, C2 em equipe e RES por elemento', () => {
  const hit: Act = { member: 1, talent: 'normal', label: '1-Hit DMG' };
  it('Grace of Kenosis: ATK fixo no aliado, dentro do teto do nível (330 a 780)', () => {
    const team: Mem[] = [{ character: 'Nicole' }, { character: 'Durin' }];
    const [off] = run(team, [hit]);
    const [on] = run(team, [{ ...hit, tags: ['label:Nicole: Grace of Kenosis (ATK)'] }]);
    const gain = on.stats.atk - off.stats.atk;
    expect(gain).toBeGreaterThan(0);
    expect(gain).toBeLessThanOrEqual(780);
  });
  it('C2: +300 de ATK extra vale também para ela (time), e só a partir da C2', () => {
    const own: Act = { member: 0, talent: 'skill', label: 'Skill DMG', tags: ['label:Nicole C2'] };
    const [c1] = run([{ character: 'Nicole', constellation: 1 }], [own]);
    const [c2] = run([{ character: 'Nicole', constellation: 2 }], [own]);
    expect(c2.stats.atk - c1.stats.atk).toBeCloseTo(300, 6);
  });
  it('C2: RES Pyro -25% na janela do elemento', () => {
    const own: Act = { member: 0, talent: 'skill', label: 'Skill DMG' };
    const [off] = run([{ character: 'Nicole', constellation: 2 }], [own]);
    const [on] = run([{ character: 'Nicole', constellation: 2 }], [{ ...own, tags: ['label:Nicole C2: RES Pyro do inimigo'] }]);
    expect(off.stats.resShred.Pyro ?? 0).toBe(0);
    expect(on.stats.resShred.Pyro).toBeCloseTo(0.25, 9);
  });
});

describe('Viajante Pyro (Aether e Lumine)', () => {
  for (const who of ['Aether (Pyro)', 'Lumine (Pyro)']) {
    it(`${who} A4: Carregado: Inferno soma 200% do ATK em cada um dos 2 acertos`, () => {
      const charged: Act = { member: 0, talent: 'normal', label: 'Charged Attack DMG' };
      const [r] = run([{ character: who }], [{ ...charged, tags: tagsOf([{ character: who }]) }]);
      expect(r.flatDamage).toBeCloseTo(2 * 2 * r.stats.atk, 6);
      const [plain] = run([{ character: who }], [{ member: 0, talent: 'normal', label: '1-Hit DMG' }]);
      expect(plain.flatDamage).toBe(0);
    });
    it(`${who} C1: +6% e +9% de DMG nas janelas`, () => {
      const hit: Act = { member: 0, talent: 'normal', label: '1-Hit DMG' };
      const [off] = run([{ character: who, constellation: 1 }], [hit]);
      const [a] = run([{ character: who, constellation: 1 }], [{ ...hit, tags: ['label:Viajante C1'] }]);
      const [b] = run([{ character: who, constellation: 1 }], [{ ...hit, tags: ['label:Viajante C1 (Nightsoul)'] }]);
      expect(a.stats.dmgBonus - off.stats.dmgBonus).toBeCloseTo(0.06, 9);
      expect(b.stats.dmgBonus - off.stats.dmgBonus).toBeCloseTo(0.09, 9);
    });
  }
});
