import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

// Só passa depois de `npx tsx scripts/curate-effects.ts` com o lote cryo-c registrado.
const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const effectOf = (name: string) => (effects.characters as { character: string; buffs: any[]; procs: any[]; infos: any[] }[]).find((c) => c.character === name)!;

type Act = { member?: number; talent: 'normal' | 'skill' | 'burst' | 'proc'; label: string; tags?: string[] };
type Mem = { character: string; constellation?: number; factions?: ('hexerei' | 'moonsign')[] };
function run(members: Mem[], a: Act) {
  const p = {
    ...sampleProject(), compat: 'none', elementMode: 'personagem',
    members: members.map((m) => ({ ...defaultMember(m.character, game), ...m })),
    actions: [{ id: 'a0', member: a.member ?? 0, move: { character: members[a.member ?? 0].character, talent: a.talent, label: a.label, variant: 0 }, executions: 1, reaction: 'none', activeTags: a.tags ?? [], tagSource: 'manual', dmgAdjust: 0, time: 0 }],
    buffWindows: [], disabled: [],
  };
  const r = resolveProject(p as never, game, effects);
  const asm = assembleTeam(r.team);
  const [out] = evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions;
  return { out, tags: [...new Set(asm.buffs.map((b) => b.tag))] };
}
const solo = (character: string, constellation: number, a: Act) => run([{ character, constellation }], a);
const L = (c: string, t: Act['talent'], label: string) => expect(game.moves.some((m) => m.character === c && m.talent === t && m.label === label)).toBe(true);

describe('rótulos dos golpes usados existem', () => {
  it('moves.json', () => {
    L('Freminet', 'skill', 'Level 0 Shattering Pressure DMG');
    L('Wriothesley', 'normal', 'Charged Attack DMG');
    L('Wriothesley', 'normal', '1-Hit DMG');
    L('Wriothesley', 'burst', 'Skill DMG');
    L('Charlotte', 'burst', 'Skill DMG');
    L('Escoffier', 'skill', 'Skill DMG');
    L('Skirk', 'normal', '1-Hit DMG');
    L('Lohen', 'skill', 'Etched Into Bone and Soul DMG');
    L('Lohen', 'normal', '1-Hit DMG');
  });
});

describe('Freminet', () => {
  const hit: Act = { talent: 'skill', label: 'Level 0 Shattering Pressure DMG' };
  it('A4: +40% de DMG de habilidade na janela', () => {
    const off = solo('Freminet', 0, hit).out;
    const on = solo('Freminet', 0, { ...hit, tags: ['label:Freminet A4'] }).out;
    expect(on.stats.dmgByType.skill - off.stats.dmgByType.skill).toBeCloseTo(0.4, 9);
  });
  it('C1: +15% de Taxa Crítica na janela (só a partir da C1)', () => {
    const off = solo('Freminet', 1, hit).out;
    const on = solo('Freminet', 1, { ...hit, tags: ['label:Freminet C1'] }).out;
    expect(on.critRate - off.critRate).toBeCloseTo(0.15, 9);
  });
  it('C4: ATK sobe com a janela; C6: +36% de Dano Crítico (3 stacks)', () => {
    const off = solo('Freminet', 6, hit).out;
    const c4 = solo('Freminet', 6, { ...hit, tags: ['label:Freminet C4'] }).out;
    const c6 = solo('Freminet', 6, { ...hit, tags: ['label:Freminet C6'] }).out;
    expect(c4.stats.atk).toBeGreaterThan(off.stats.atk);
    expect(c6.critDmg - off.critDmg).toBeCloseTo(0.36, 9);
  });
});

describe('Wriothesley', () => {
  const charged: Act = { talent: 'normal', label: 'Charged Attack DMG' };
  it('A4: ATK sobe com os stacks de Prosecution Edict', () => {
    const off = solo('Wriothesley', 0, charged).out;
    const on = solo('Wriothesley', 0, { ...charged, tags: ['label:Wriothesley A4'] }).out;
    expect(on.stats.atk).toBeGreaterThan(off.stats.atk);
  });
  it('C1: o Rebuke passa a +200% e substitui o A1 (+50%), sem somar', () => {
    const off = solo('Wriothesley', 1, charged).out;
    const off0 = solo('Wriothesley', 0, charged).out;
    const a1 = solo('Wriothesley', 0, { ...charged, tags: ['label:Wriothesley A1'] }).out;
    const both = solo('Wriothesley', 1, { ...charged, tags: ['label:Wriothesley A1', 'label:Wriothesley C1 (Rebuke)'] }).out;
    expect(a1.stats.dmgByType.charged - off0.stats.dmgByType.charged).toBeCloseTo(0.5, 9);
    expect(both.stats.dmgByType.charged - off.stats.dmgByType.charged).toBeCloseTo(2, 9);
  });
  it('C2: +40% x 5 stacks no Supremo; 125% Normal e 130% Carregado com 5 stacks', () => {
    const burst: Act = { talent: 'burst', label: 'Skill DMG' };
    const off = solo('Wriothesley', 2, burst).out;
    const on = solo('Wriothesley', 2, { ...burst, tags: ['label:Wriothesley C2 (Supremo)'] }).out;
    expect(on.stats.dmgByType.burst - off.stats.dmgByType.burst).toBeCloseTo(2, 9);
    const n = solo('Wriothesley', 2, { talent: 'normal', label: '1-Hit DMG', tags: ['label:Wriothesley C2 (5 stacks)'] }).out;
    const c = solo('Wriothesley', 2, { ...charged, tags: ['label:Wriothesley C2 (5 stacks)'] }).out;
    expect(n.stats.baseMultByType.normal).toBeCloseTo(0.25, 9);
    expect(c.stats.baseMultByType.charged).toBeCloseTo(0.3, 9);
  });
  it('C6: crítico do Rebuke e o gelo extra de 100% do Carregado', () => {
    const off = solo('Wriothesley', 6, charged).out;
    const on = solo('Wriothesley', 6, { ...charged, tags: ['label:Wriothesley C6'] }).out;
    expect(on.critRate - off.critRate).toBeCloseTo(0.1, 9);
    expect(on.critDmg - off.critDmg).toBeCloseTo(0.8, 9);
    const extra = solo('Wriothesley', 6, { talent: 'proc', label: 'char:c6i' }).out;
    expect(extra.scale.atk / off.scale.atk).toBeCloseTo(1, 6);
  });
});

describe('Charlotte', () => {
  it('C2: 30% no máximo, 10% com 1 inimigo (tabela corrigida)', () => {
    const c2 = effectOf('Charlotte').buffs.find((b) => b.id === 'c2');
    expect(c2.stats.atkPct).toBeCloseTo(0.3, 9);
    expect(c2.stacks.table[1] * c2.stats.atkPct).toBeCloseTo(0.1, 6);
  });
  it('C4: +10% de DMG do Supremo (não da habilidade)', () => {
    const burst: Act = { talent: 'burst', label: 'Skill DMG' };
    const off = solo('Charlotte', 4, burst).out;
    const on = solo('Charlotte', 4, { ...burst, tags: ['label:Charlotte C4'] }).out;
    expect(on.stats.dmgByType.burst - off.stats.dmgByType.burst).toBeCloseTo(0.1, 9);
    expect(on.stats.dmgByType.skill).toBe(off.stats.dmgByType.skill);
  });
});

describe('Escoffier A4: RES Hydro e Cryo em janela', () => {
  const skill: Act = { talent: 'skill', label: 'Skill DMG' };
  it('com 2 Hydro/Cryo no time: -10%, só na janela', () => {
    const team: Mem[] = [{ character: 'Escoffier' }, { character: 'Furina' }];
    const off = run(team, skill).out;
    const on = run(team, { ...skill, tags: ['label:Escoffier A4'] }).out;
    expect(off.stats.resShred.Cryo ?? 0).toBe(0);
    expect(on.stats.resShred.Cryo).toBeCloseTo(0.1, 9);
    expect(on.stats.resShred.Hydro).toBeCloseTo(0.1, 9);
  });
  it('é janela de tempo (não fica sempre ligado)', () => {
    expect(effectOf('Escoffier').buffs.find((b) => b.id === 'a4').timed).toBe(true);
  });
});

describe('Skirk C6: Havoc: Sever', () => {
  it('750% por stack no Supremo e 3 x 180% no Normal e ao ser atingida', () => {
    const at = (id: string) => solo('Skirk', 6, { talent: 'proc', label: `char:${id}` }).out.scale.atk;
    expect(at('c6b')).toBeCloseTo(7.5, 6);
    expect(at('c6n')).toBeCloseTo(5.4, 6);
    expect(at('c6c')).toBeCloseTo(5.4, 6);
  });
});

describe('Lohen', () => {
  it('A4 Hexerei: +40% de Normal e Carregado com 2 Hexerei', () => {
    const team: Mem[] = [{ character: 'Lohen', factions: ['hexerei'] }, { character: 'Nicole', factions: ['hexerei'] }];
    const hit: Act = { talent: 'normal', label: '1-Hit DMG' };
    const off = run(team, hit).out;
    const on = run(team, { ...hit, tags: run(team, hit).tags }).out;
    expect(on.stats.dmgByType.normal - off.stats.dmgByType.normal).toBeGreaterThanOrEqual(0.4 - 1e-9);
  });
  it('C2: golpe extra de 500% do ATK', () => {
    expect(solo('Lohen', 2, { talent: 'proc', label: 'char:c2e' }).out.scale.atk).toBeCloseTo(5, 6);
  });
  it('C6: +175% de Dano Crítico na habilidade especial e no Supremo', () => {
    const etched: Act = { talent: 'skill', label: 'Etched Into Bone and Soul DMG' };
    const off = solo('Lohen', 6, etched).out;
    const on = solo('Lohen', 6, { ...etched, tags: ['label:Lohen C6 (Dano Crítico)'] }).out;
    expect(on.critDmg - off.critDmg).toBeCloseTo(1.75, 9);
    const b = solo('Lohen', 6, { talent: 'burst', label: 'Skill DMG', tags: ['label:Lohen C6 (Dano Crítico)'] }).out;
    expect(b.critDmg).toBeGreaterThan(solo('Lohen', 6, { talent: 'burst', label: 'Skill DMG' }).out.critDmg);
  });
});
