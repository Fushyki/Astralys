/** Armas e sets com duração no texto viram janelas, abertas sozinhas pelos golpes da rotação (#72). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, autoIntervals, autoTagIntervals, resolveProject, type EffectsData, type GameData, type MemberRef, type RotationProject } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import { adoptAutoWindows, removeWindow, setAutoWindows } from '../../src/features/rotation/projectOps';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

type Spec = [member: number, talent: 'normal' | 'skill' | 'burst', time: number, chain?: string];
function project(members: [string, Partial<MemberRef>?][], hits: Spec[], more: Partial<RotationProject> = {}): RotationProject {
  const actions = hits.map(([member, talent, time, chainId], i) => {
    const character = members[member][0];
    const move = game.moves.find((m) => m.character === character && m.talent === talent)!;
    return { id: `a${i}`, member, move: { character, talent, label: move.label, variant: 0 }, executions: 1, reaction: 'none' as const, activeTags: [], tagSource: 'windows' as const, dmgAdjust: 0, time, ...(chainId ? { chainId } : {}) };
  });
  return {
    ...sampleProject(), compat: 'none', extras: [], buffWindows: [], autoOff: [], disabled: [], enabled: [],
    members: members.map(([name, patch]) => ({ ...defaultMember(name, game), gearManual: false, ...patch })),
    actions, ...more,
  };
}
const COVENANT = 'label:Covenant of Frost and Snow: Passiva';
const tags = (p: RotationProject, tag: string) => resolveProject(p, game, effects).actions.map((a) => a.activeTags.includes(tag));

describe('autoIntervals', () => {
  const hit = (member: number, talent: 'normal' | 'skill' | 'burst', time: number) => ({ member, time, move: { talent, hitType: talent } as never });
  const base = { member: 0, duration: 4, on: [] };

  it('une as janelas que se encostam e respeita a espera entre ativações', () => {
    const actions = [hit(0, 'skill', 0), hit(0, 'skill', 3), hit(0, 'skill', 20), hit(1, 'skill', 30)];
    expect(autoIntervals(base, actions)).toEqual([[0, 7], [20, 24]]);
    expect(autoIntervals({ ...base, cooldown: 10 }, actions)).toEqual([[0, 4], [20, 24]]);
    expect(autoIntervals({ ...base, by: 'others' }, actions)).toEqual([[30, 34]]);
  });

  it('duas fontes na mesma faixa viram janelas sem sobreposição', () => {
    const actions = [hit(0, 'skill', 0), hit(1, 'skill', 2)];
    const buff = { tag: 'gear:0', auto: [base, { ...base, member: 1 }] } as never;
    expect(autoTagIntervals([buff], [], actions).get('gear:0')).toEqual([[0, 6]]);
  });

  it('periódico, em revezamento', () => {
    const actions = [hit(0, 'normal', 45)];
    expect(autoIntervals({ ...base, duration: 10, periodic: true, cooldown: 10, sequence: { index: 1, length: 3 } }, actions)).toEqual([[10, 20], [40, 50]]);
  });

  it('alonga com golpes até o teto e não corre fora de campo', () => {
    const ext = { on: ['normal' as const], add: 2, max: 4, every: 1 };
    expect(autoIntervals({ ...base, on: ['skill'], extend: ext }, [hit(0, 'skill', 0), hit(0, 'normal', 1), hit(0, 'normal', 3), hit(0, 'normal', 5)])).toEqual([[0, 8]]);
    // outro membro age de 1 s a 11 s: os 10 s não contam
    expect(autoIntervals({ ...base, on: ['skill'], pauseOff: true }, [hit(0, 'skill', 0), hit(1, 'skill', 1), hit(0, 'burst', 11)])).toEqual([[0, 14]]);
  });
});

describe('janelas automáticas no projeto', () => {
  const ganyu: [string, Partial<MemberRef>] = ['Ganyu', { weapon: 'Covenant of Frost and Snow' }];
  const rotation: Spec[] = [[0, 'normal', 0], [0, 'skill', 1], [0, 'normal', 12.5], [0, 'normal', 13.5]];

  it('Covenant: 12 s a partir do uso da Habilidade, só dentro deles', () => {
    const p = project([ganyu], rotation);
    expect(tags(p, COVENANT)).toEqual([false, true, true, false]);
    const r = resolveProject(p, game, effects);
    expect(r.team.members[0].weaponEffect!.em).toBe(0);
  });

  it('execuções seguintes de um golpe contínuo não contam como novo uso', () => {
    expect(tags(project([ganyu], [[0, 'skill', 0, 'c1'], [0, 'skill', 10, 'c1'], [0, 'normal', 15]]), COVENANT)).toEqual([true, true, false]);
  });

  it('janela do usuário substitui a automática; faixa tirada não volta; golpe desligado fica sem', () => {
    const win = [{ id: 'w1', tag: COVENANT, start: 12, end: 20 }];
    expect(tags(project([ganyu], rotation, { buffWindows: win }), COVENANT)).toEqual([false, false, true, true]);
    expect(tags(project([ganyu], rotation, { autoOff: [COVENANT] }), COVENANT)).toEqual([false, false, false, false]);
    const p = project([ganyu], rotation);
    p.actions[1] = { ...p.actions[1], tagsOff: [COVENANT] };
    expect(tags(p, COVENANT)).toEqual([false, false, true, false]);
  });

  it('Husk: janela de 6 s depois de cada golpe do dono; no modo planilha não muda', () => {
    const noelle: [string, Partial<MemberRef>] = ['Noelle', { primarySet: 'Husk of Opulent Dreams', fourPiece: true }];
    const p = project([noelle], [[0, 'normal', 0], [0, 'normal', 8]]);
    const tag = 'label:Husk of Opulent Dreams: Stacks da passiva';
    expect(tags(p, tag)).toEqual([true, true]);
    const sheet = resolveProject({ ...p, compat: 'planilha' }, game, effects).team.members[0];
    expect(sheet.primarySet!.effect!.fourPiece!.buffs[0].timed).toBe(false);
  });

  it('clicar na janela automática a torna do usuário; apagá-la tira o buff até pedir a automática de novo', () => {
    const adopted = adoptAutoWindows(project([ganyu], rotation), COVENANT, [[1, 13]]);
    expect(adopted.project.buffWindows).toEqual([{ id: adopted.ids[0], tag: COVENANT, start: 1, end: 13 }]);
    const removed = removeWindow(adopted.project, adopted.ids[0]);
    expect(removed.autoOff).toEqual([COVENANT]);
    expect(tags(removed, COVENANT)).toEqual([false, false, false, false]);
    expect(tags(setAutoWindows(removed, COVENANT, true), COVENANT)).toEqual([false, true, true, false]);
  });

  it('a passiva própria com duração segue contando na Recarga exigida (e nos mínimos do otimizador)', () => {
    const p = project([['Xiangling', { weapon: 'Engulfing Lightning' }]], [[0, 'burst', 0]]);
    const { team } = resolveProject(p, game, effects);
    const buff = assembleTeam(team).buffs.find((b) => b.id === 'cbuff-0-arma:recarga')!;
    expect([buff.sheet, buff.delta.er]).toEqual([true, 0.3]);
  });

  it('quem já tinha ligado ou desligado a passiva antiga continua igual', () => {
    const on = (more: Partial<RotationProject>) => {
      const r = resolveProject(project([['Ganyu', { weapon: 'Covenant of Frost and Snow', gearManual: true }]], rotation, more), game, effects);
      return !r.team.disabled!.includes('cbuff-0-arma:tempo-0');
    };
    expect(on({})).toBe(false);
    expect(on({ enabled: ['m0:weapon'] })).toBe(true);
    expect(on({ enabled: ['m0:weapon'], disabled: ['m0:weapon'] })).toBe(false);
  });
});
