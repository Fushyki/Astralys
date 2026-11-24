import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { laneInfos } from '../../src/features/rotation/rotationModel';
import { assembleTeam, evaluateRotation, flatId, flatTag, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { setFlatStacks } from '../../src/features/rotation/projectOps';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T,>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const names = ['Shenhe', 'Skirk'];
const skirkMove = game.moves.find((m) => m.character === 'Skirk' && m.talent === 'burst')!;
const icy = effects.flatDamage.find((e) => e.source === 'Shenhe' && e.stacks)!;
const LEAD = flatId(icy);
const STACKS = icy.stacks!;

function run(times: number[], extra: Record<string, unknown> = {}, flatStacks: Record<string, number | 'all'> = {}, flatManual?: string[]) {
  const base = { ...sampleProject(), compat: 'none' as const };
  const acts = times.map((t, i) => ({
    id: `a${i}`, member: 1, move: { character: 'Skirk', talent: 'burst', label: skirkMove.label, variant: skirkMove.variant }, executions: 1, reaction: 'none',
    activeTags: [flatTag(icy)], tagSource: 'manual', dmgAdjust: 0, time: t, ...(i === 0 ? extra : {}),
  }));
  const p = { ...base, members: names.map((n) => ({ ...defaultMember(n, game), constellation: 0 })), actions: acts, buffWindows: [], disabled: [], flatStacks, flatManual };
  const r = resolveProject(p as never, game, effects);
  const res = evaluateRotation({ members: r.team.members, assembly: assembleTeam(r.team), config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions);
  return { res, r, project: p };
}
const lead = (a: { flatUse?: { id: string; hits: number }[] }) => a.flatUse?.find((u) => u.id === LEAD);

describe('buffs de dano fixo: quantos golpes e quais golpes consomem', () => {
  it('o buff existe com os stacks do cadastro e os golpes o consomem em ordem de TEMPO (não da lista)', () => {
    const { res } = run([10, 2]);
    // o golpe de 2 s vem depois na lista, mas é o primeiro no tempo: consome primeiro
    const hits = Math.max(1, skirkMove.hits);
    const early = res.actions.find((a) => a.action.id === 'a1')!;
    const late = res.actions.find((a) => a.action.id === 'a0')!;
    expect(lead(early)!.hits).toBe(Math.min(hits, STACKS));
    expect(lead(late)!.hits).toBe(Math.min(hits, Math.max(0, STACKS - lead(early)!.hits)));
  });

  it('modo manual: só os golpes marcados consomem, em qualquer ponto da rotação', () => {
    const none = run([1, 2, 3], {}, {}, [LEAD]).res;
    expect(none.actions.every((a) => lead(a)!.off && lead(a)!.hits === 0)).toBe(true);
    const picked = run([1, 2, 3], { flatOn: [LEAD] }, {}, [LEAD]).res; // só o golpe a0 (instante 1) marcado
    expect(lead(picked.actions.find((a) => a.action.id === 'a0')!)!.hits).toBeGreaterThan(0);
    expect(picked.actions.filter((a) => a.action.id !== 'a0').every((a) => lead(a)!.hits === 0)).toBe(true);
    expect(lead(picked.actions[0])!.manual).toBe(true);
  });

  it('modo manual ignora o limite de stacks: todo golpe marcado recebe o buff', () => {
    const { res } = run([1, 2], { flatOn: [LEAD] }, { [LEAD]: 1 }, [LEAD]);
    const marked = res.actions.find((a) => a.action.id === 'a0')!;
    expect(lead(marked)!.hits).toBe(Math.max(1, skirkMove.hits)); // 1 stack no cadastro, mesmo assim todos os acertos
  });

  it('automático: só os golpes dentro da janela do buff consomem; manual ignora a janela', () => {
    const outside = run([1, 2], { activeTags: [] }).res; // a0 fora da janela
    const a0 = outside.actions.find((a) => a.action.id === 'a0')!;
    expect(lead(a0)!.outside).toBe(true);
    expect(lead(a0)!.hits).toBe(0);
    expect(lead(outside.actions.find((a) => a.action.id === 'a1')!)!.hits).toBeGreaterThan(0);
    const manual = run([1, 2], { activeTags: [], flatOn: [LEAD] }, {}, [LEAD]).res;
    expect(lead(manual.actions.find((a) => a.action.id === 'a0')!)!.hits).toBeGreaterThan(0);
  });

  it('o buff com limite de golpes ganha uma faixa no plano de combate', () => {
    const { r, project } = run([1]);
    const tags = laneInfos(project as never, r).filter((l) => l.tag.startsWith('flat:')).map((l) => l.tag);
    expect(tags).toContain(flatTag(icy));
    expect(tags.every((t) => names.some((n) => t.startsWith(`flat:${n}|`)))).toBe(true); // só de quem está no time (Shenhe e Skirk aqui)
  });

  it('field: "on" vale só para o 1º personagem do time (em campo) e "off" para os demais', () => {
    const { r } = run([1]); // golpe do membro 1 (Skirk): fora de campo
    const hitsOf = (field: 'on' | 'off') => {
      const flatEffects = r.flatEffects.map((e) => (flatId(e) === LEAD ? { ...e, targets: 'all' as const, field } : e));
      const res = evaluateRotation({ members: r.team.members, assembly: assembleTeam(r.team), config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects }, r.actions);
      return res.actions[0].flatUse?.find((u) => u.id === LEAD)?.hits ?? 0;
    };
    expect(hitsOf('on')).toBe(0);
    expect(hitsOf('off')).toBeGreaterThan(0);
  });

  it('um golpe pode ser tirado do buff (guarda os stacks para os outros)', () => {
    const { res } = run([1, 2], { flatOff: [LEAD] });
    const off = res.actions.find((a) => a.action.id === 'a0')!;
    const on = res.actions.find((a) => a.action.id === 'a1')!;
    expect(lead(off)!.off).toBe(true);
    expect(lead(off)!.hits).toBe(0);
    expect(lead(on)!.hits).toBeGreaterThan(0);
    expect(off.flatDamage).toBe(0);
    expect(on.flatDamage).toBeGreaterThan(0);
  });

  it('"todos os golpes" tira o limite e "N golpes" muda o limite', () => {
    const many = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const limited = run(many).res.actions.reduce((n, a) => n + (lead(a)?.hits ?? 0), 0);
    expect(limited).toBe(STACKS);
    const all = run(many, {}, { [LEAD]: 'all' }).res.actions.reduce((n, a) => n + (lead(a)?.hits ?? 0), 0);
    expect(all).toBe(many.length * Math.max(1, skirkMove.hits));
    const three = run(many, {}, { [LEAD]: STACKS + 3 }).res.actions.reduce((n, a) => n + (lead(a)?.hits ?? 0), 0);
    expect(three).toBe(STACKS + 3);
  });

  it('setFlatStacks guarda no projeto e volta ao cadastro com undefined', () => {
    const { project } = run([1]);
    const a = setFlatStacks(project as never, LEAD, 'all');
    expect(a.flatStacks[LEAD]).toBe('all');
    expect(setFlatStacks(a, LEAD, undefined).flatStacks[LEAD]).toBeUndefined();
    expect(flatId({ source: icy.source, name: icy.name })).toBe(LEAD);
  });
});
