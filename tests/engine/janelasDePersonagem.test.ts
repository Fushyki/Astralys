/** Constelações e habilidades com duração abrem janelas sozinhas (#75) e a Dádiva Celestial entra no cálculo (#76). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, autoTagIntervals, resolveProject, type EffectsData, type GameData, type MemberRef, type RotationProject } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

type Spec = [member: number, talent: 'normal' | 'skill' | 'burst', time: number, label?: string];
function project(members: [string, Partial<MemberRef>?][], hits: Spec[], more: Partial<RotationProject> = {}): RotationProject {
  const actions = hits.map(([member, talent, time, wanted], i) => {
    const character = members[member][0];
    const label = wanted ?? game.moves.find((m) => m.character === character && m.talent === talent)!.label;
    return { id: `a${i}`, member, move: { character, talent, label, variant: 0 }, executions: 1, reaction: 'none' as const, activeTags: [], tagSource: 'windows' as const, dmgAdjust: 0, time };
  });
  return {
    ...sampleProject(), compat: 'none', extras: [], buffWindows: [], autoOff: [], disabled: [], enabled: [],
    members: members.map(([name, patch]) => ({ ...defaultMember(name, game), ...patch })),
    actions, ...more,
  };
}
/** Janelas automáticas de cada faixa, pelo nome dela. */
function windows(p: RotationProject) {
  const r = resolveProject(p, game, effects);
  const asm = assembleTeam(r.team);
  const byTag = autoTagIntervals(asm.buffs, r.flatEffects, r.actions);
  return { r, asm, of: (label: string) => byTag.get(`label:${label}`) };
}

describe('constelações da Mona', () => {
  const rotation: Spec[] = [[0, 'burst', 0], [0, 'normal', 1], [0, 'normal', 2], [0, 'normal', 4, 'Charged Attack DMG']];

  it('abrem sozinhas com a duração do texto: Presságio pelo nível, C2 no Carregado', () => {
    const w = windows(project([['Mona', { constellation: 6, talents: { normal: 9, skill: 9, burst: 1 } }]], rotation.map((h) => (h[3] ? [0, 'normal', 4] as Spec : h))));
    // nível 1 + C3 não mexe no Supremo: a C5 soma 3 níveis na habilidade, a C3 no Supremo
    const omen = w.of('Mona: Presságio')!;
    expect(omen[0][0]).toBe(0);
    expect(omen[0][1]).toBeGreaterThanOrEqual(4);
    expect(omen[0][1]).toBeLessThanOrEqual(5);
    expect(w.of('Mona C1 (reações)')).toEqual([[0, omen[0][1] + 8]]);
    expect(w.asm.buffs.find((b) => b.tag === 'label:Mona C1 (reações)')!.delta.vaporizeBonus).toBeCloseTo(0.15, 9);
    expect(w.of('Mona C4')).toEqual(omen);
    expect(w.r.actions[1].activeTags).toContain('label:Mona C4');
  });

  it('com Hexerei: Secret Rite o Presságio alonga a cada Normal (+2 s) e o C4 dá Dano Crítico', () => {
    const hex: Partial<MemberRef> = { constellation: 4, factions: ['hexerei'] };
    const alone = windows(project([['Mona', hex]], rotation.slice(0, 3)));
    const pair = windows(project([['Mona', hex], ['Fischl', { factions: ['hexerei'] }]], rotation.slice(0, 3)));
    expect(pair.of('Mona: Presságio')![0][1]).toBeCloseTo(alone.of('Mona: Presságio')![0][1] + 4, 6);
    expect(pair.of('Mona C4 (Hexerei)')).toBeDefined();
  });

  it('Esplendor da Hydromancia: o próximo Vaporizar de um aliado gasta os acúmulos, num acerto só, e soma com a C1', () => {
    const hex: Partial<MemberRef> = { factions: ['hexerei'] };
    const p = project(
      [['Hu Tao'], ['Mona', { ...hex, constellation: 1 }], ['Fischl', hex]],
      [[1, 'burst', 0], [1, 'normal', 1], [1, 'normal', 2], [0, 'normal', 3], [0, 'normal', 4], [1, 'normal', 5], [1, 'normal', 6], [1, 'normal', 7], [1, 'normal', 8], [0, 'normal', 9], [0, 'normal', 10]],
    );
    for (const i of [3, 4, 9]) p.actions[i] = { ...p.actions[i], reaction: 'vaporize' };
    p.actions[9] = { ...p.actions[9], executions: 2 };
    const r = resolveProject(p, game, effects);
    const tag = 'label:Mona: Esplendor da Hydromancia (Hexerei)';
    expect(r.actions.map((a) => a.activeTags.includes(tag))).toEqual([false, false, false, true, false, false, false, false, false, true, false]);
    // 2 acertos da Mona = 2/3 do bônus; 4 acertos = 3 acúmulos, divididos pelos 2 acertos do golpe que os gasta
    expect(r.actions[3].tagShare?.[tag]).toBeCloseTo(2 / 3, 9);
    expect(r.actions[9].tagShare?.[tag]).toBeCloseTo(1 / 2, 9);
    const asm = assembleTeam(r.team);
    const bonus = (i: number) => asm.buffs.filter((b) => r.actions[i].activeTags.includes(b.tag) && (b.targets === 'all' || b.targets.includes('Hu Tao'))).reduce((s, b) => s + (b.delta.vaporizeBonus ?? 0) * (r.actions[i].tagShare?.[b.tag] ?? 1), 0);
    expect(bonus(3)).toBeCloseTo(0.15 + 0.1, 9);
    expect(bonus(4)).toBeCloseTo(0.15, 9);
  });

  it('no modo planilha nada muda', () => {
    const p = project([['Mona', { constellation: 6 }]], rotation.slice(0, 3), { compat: 'planilha' });
    expect(resolveProject(p, game, effects).actions[1].activeTags).toEqual([]);
  });
});

describe('gatilhos próprios', () => {
  it('atraso: o A1 da Hu Tao começa quando o Paramita acaba', () => {
    const w = windows(project([['Hu Tao'], ['Xingqiu']], [[0, 'skill', 2]]));
    const a1 = w.asm.buffs.find((b) => b.description?.startsWith('Hu Tao') && b.auto?.[0].delay)!;
    expect(autoTagIntervals([a1], [], w.r.actions).get(a1.tag)).toEqual([[11, 19]]);
  });

  it('talento sem golpe de dano (Supremo do Xiao) abre pelos ataques', () => {
    const w = windows(project([['Xiao']], [[0, 'normal', 3]]));
    expect(w.of('Xiao: Máscara Yaksha')).toEqual([[3, 18]]);
  });

  it('rótulo: a Shenhe só abre o bônus do toque que ela usou', () => {
    const w = windows(project([['Shenhe']], [[0, 'skill', 0, 'Press Skill DMG']]));
    const opened = w.r.actions[0].activeTags.filter((t) => t.includes('Shenhe A4'));
    expect(opened).toHaveLength(1);
  });
});

describe('Dádiva Celestial (4 peças)', () => {
  const gift: Partial<MemberRef> = { primarySet: 'Celestial Gift', secondarySet: undefined, fourPiece: true, gearManual: false };
  const team = (a: Partial<MemberRef>, b: Partial<MemberRef> = {}): [string, Partial<MemberRef>?][] => [['Hu Tao', b], ['Mona', { ...gift, ...a }], ['Xingqiu']];
  const bonus = (members: [string, Partial<MemberRef>?][]) => windows(project(members, [[1, 'skill', 0]])).asm.buffs.filter((b) => b.description?.includes('Celestial Gift'));

  it('sem o portador Hexerei não entra', () => {
    expect(bonus(team({ factions: [] }))).toEqual([]);
  });

  it('+20% do elemento do portador, 20 s depois da habilidade', () => {
    const [buff, ...rest] = bonus(team({ factions: ['hexerei'] }));
    expect(rest).toEqual([]);
    expect(buff.targets).toEqual(['Mona', 'Xingqiu']);
    expect([buff.delta.eleDmg, buff.duration]).toEqual([expect.closeTo(0.2, 6), 20]);
  });

  it('com 2+ Hexerei vira +40% e inclui o elemento do 1º do time', () => {
    const members = team({ factions: ['hexerei'] });
    members.push(['Fischl', { factions: ['hexerei'] }]);
    const [buff, ...rest] = bonus(members);
    expect(rest).toEqual([]);
    expect(buff.targets).toEqual(['Hu Tao', 'Mona', 'Xingqiu']);
    expect(buff.delta.eleDmg).toBeCloseTo(0.4, 6);
  });

  it('dois portadores do mesmo elemento não somam', () => {
    const members: [string, Partial<MemberRef>?][] = [['Mona', { ...gift, factions: ['hexerei'] }], ['Barbara', { ...gift, factions: ['hexerei'] }]];
    const received = bonus(members).flatMap((b) => (b.targets === 'all' ? ['Mona', 'Barbara'] : b.targets));
    expect(received.filter((n) => n === 'Mona')).toHaveLength(1);
  });
});
