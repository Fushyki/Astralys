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
function run(members: { character: string; constellation?: number }[], actions: Act[]) {
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
  const actionsOut = evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions;
  return Object.assign(actionsOut, { tags: [...new Set(asm.buffs.map((b) => b.tag))] });
}

describe('Mavuika C2: Sunfell Slice soma 120% do ATK ao dano base', () => {
  const burst: Act = { member: 0, talent: 'burst', label: 'Skill DMG' };
  it('C1 sem dano fixo; C2 soma 1,2 x ATK (com todos os buffs ligados, como o dano fixo lê)', () => {
    const [c1] = run([{ character: 'Mavuika', constellation: 1 }], [burst]);
    const all = run([{ character: 'Mavuika', constellation: 2 }], [burst]).tags;
    const [c2] = run([{ character: 'Mavuika', constellation: 2 }], [{ ...burst, tags: all }]);
    expect(c1.flatDamage).toBe(0);
    expect(c2.flatDamage).toBeCloseTo(1.2 * c2.stats.atk, 6);
    expect(c2.avg).toBeGreaterThan(c1.avg);
  });
  it('Normal da Ignimoto soma 0,6 x ATK; Normal comum não recebe', () => {
    const mk = (label: string, talent: 'normal' | 'skill') => ({ member: 0, talent, label });
    const all = run([{ character: 'Mavuika', constellation: 2 }], [mk('Flamestrider Normal Attack 1-Hit DMG', 'skill')]).tags;
    const [ign] = run([{ character: 'Mavuika', constellation: 2 }], [{ ...mk('Flamestrider Normal Attack 1-Hit DMG', 'skill'), tags: all }]);
    const [comum] = run([{ character: 'Mavuika', constellation: 2 }], [{ ...mk('1-Hit DMG', 'normal'), tags: all }]);
    expect(ign.flatDamage).toBeCloseTo(0.6 * ign.stats.atk * ign.action.executions * Math.max(1, ign.action.move.hits), 6);
    expect(comum.flatDamage).toBe(0);
  });
});

describe('Mavuika C6: golpes extras do Anel (200% do ATK) e do Anel de Incêndio (500%)', () => {
  it('só existem a partir da C6, com Pyro e a escala do texto', () => {
    const [a, b] = run([{ character: 'Mavuika', constellation: 6 }], [{ member: 0, talent: 'proc', label: 'char:c6a' }, { member: 0, talent: 'proc', label: 'char:c6b' }]);
    expect(a.scale.atk).toBeCloseTo(2, 9);
    expect(b.scale.atk).toBeCloseTo(5, 9);
    expect(a.element).toBe('Pyro');
    expect(a.avg).toBeGreaterThan(0);
    expect(b.avg / a.avg).toBeCloseTo(2.5, 6);
  });
  it('na C5 o golpe extra não existe (escala zerada)', () => {
    const [a] = run([{ character: 'Mavuika', constellation: 5 }], [{ member: 0, talent: 'proc', label: 'char:c6a' }]);
    expect(a.avg ?? 0).toBe(0);
  });
});

describe('Bennett C4: ataque extra = 135% do 2º ataque da Carga Nível 1', () => {
  it('escala = 135% x 92/176 do golpe (2º ataque), no mesmo nível de talento', () => {
    const [extra, charge] = run([{ character: 'Bennett', constellation: 4 }], [{ member: 0, talent: 'proc', label: 'char:c4' }, { member: 0, talent: 'skill', label: 'Charge Level 1 DMG' }]);
    expect(extra.scale.atk / charge.scale.atk).toBeCloseTo((1.35 * 92) / 176, 9);
    expect(extra.avg).toBeGreaterThan(0);
  });
  it('o 2º ataque vale 92/176 do golpe nos 15 níveis (dados do Lunaris)', () => {
    const m = game.moves.find((x) => x.character === 'Bennett' && x.talent === 'skill' && x.label === 'Charge Level 1 DMG')!;
    expect(m.hits).toBe(2);
    // nível 1: 84% + 92% = 176%
    expect(m.scale.atk[0]).toBeCloseTo(1.76, 9);
  });
});

describe('Bennett C6: +15% de DMG Pyro só para quem é Pyro', () => {
  it('Mavuika (Pyro) ganha +15%; Iansan (Electro) não', () => {
    const team = [{ character: 'Bennett', constellation: 6 }, { character: 'Mavuika' }, { character: 'Iansan' }];
    const acts = (tags: string[]): Act[] => [{ member: 1, talent: 'skill', label: 'Skill DMG', tags }, { member: 2, talent: 'skill', label: 'Skill DMG', tags }];
    const off = run(team, acts([]));
    const on = run(team, acts(['label:Bennett C6']));
    expect(on[0].stats.dmgBonus - off[0].stats.dmgBonus).toBeCloseTo(0.15, 9);
    expect(on[1].stats.dmgBonus - off[1].stats.dmgBonus).toBeCloseTo(0, 9);
  });
});

describe('Mavuika C2: +200 de ATK base', () => {
  it('soma 200 ao ATK base antes dos % de ATK (C1 não tem)', () => {
    const act: Act = { member: 0, talent: 'burst', label: 'Skill DMG' };
    const [c1] = run([{ character: 'Mavuika', constellation: 1 }], [act]);
    const [c2] = run([{ character: 'Mavuika', constellation: 2 }], [act]);
    expect(c2.stats.atk).toBeGreaterThan(c1.stats.atk + 200);
  });
});

describe('Flins C4: reforça o A4 em vez de somar', () => {
  it('C3 usa 8% (teto 160); C4 usa 10% (teto 220) no lugar', () => {
    const act: Act = { member: 0, talent: 'normal', label: '1-Hit DMG' };
    const [c3] = run([{ character: 'Flins', constellation: 3 }], [act]);
    const [c4] = run([{ character: 'Flins', constellation: 4 }], [act]);
    const em0 = (st: { atk: number }, per: number, cap: number) => Math.min(per * st.atk, cap);
    // C4 ganha +20% de ATK; compara cada um com a própria fórmula
    expect(c4.stats.em - c3.stats.em).toBeCloseTo(em0(c4.stats, 0.1, 220) - em0(c3.stats, 0.08, 160), 6);
  });
});

describe('Iansan: ATK do Supremo por nível e por pontos de Espírito da Noite', () => {
  const effect = JSON.parse(readFileSync(path.join(root, 'src/effects/characters.json'), 'utf8')).find((c: { character: string }) => c.character === 'Iansan');
  const b = effect.buffs.find((x: { id: string }) => x.id === 'escala');
  it('27% do ATK com 42 pontos, 0,5% por ponto abaixo; teto do nível 1 ao 15 (330 a 890)', () => {
    expect(b.convert.perPoint).toBeCloseTo(0.27, 9);
    expect(b.stacks.max).toBe(42);
    expect(b.stacks.table[20] * 0.27).toBeCloseTo(20 * 0.005, 5);
    expect(b.stacks.table[42]).toBe(1);
    expect(b.convert.capByLevel.table[0]).toBe(330);
    expect(b.convert.capByLevel.table[14]).toBe(890);
  });
});

describe('Informativos (cura, escudo, energia, recarga): fora do cálculo', () => {
  const chars = JSON.parse(readFileSync(path.join(root, 'src/effects/characters.json'), 'utf8'));
  it('Iansan C1: energia com o número do Lunaris, sem buff no cálculo', () => {
    const e = chars.find((c: { character: string }) => c.character === 'Iansan');
    expect(e.infos).toEqual([expect.objectContaining({ src: 'const1', kind: 'energia', text: expect.stringContaining('15 de Energia a cada 6 pontos') })]);
    expect(e.buffs.some((b: { minConstellation: number }) => b.minConstellation === 1)).toBe(false);
  });
});
