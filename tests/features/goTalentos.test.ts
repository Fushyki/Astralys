import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { GO_TALENT_CHARACTERS, goRequest, rotationConditions } from '../../src/features/talentos/goRequest';
import { setCondition } from '../../src/features/rotation/projectOps';
import { removeMember } from '../../src/features/rotation/teamOps';
import { buildNewTeam } from '../../src/features/rotation/newTeam';
import { computeTalents, supported, type GoTalents } from '../../src/vendor/go/talentos';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const project = buildNewTeam({ characters: ['Zibai', 'Illuga'], rotation: 'basic' }, game);
const resolved = resolveProject(project, game, effects);
const rolls = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects }).optimization.rolls;
const run = (index: number, conds = {}) => computeTalents(goRequest(project, resolved, rolls, index, 'hit', conds));
const rows = (t: GoTalents, card: string) => t.cards.find((c) => c.key === card)!.blocks.flatMap((b) => (b.kind === 'rows' ? b.rows : []));

describe('aba Talentos pelas fichas do Genshin Optimizer', () => {
  it('a lista do site é a mesma empacotada', () => expect([...GO_TALENT_CHARACTERS].sort()).toEqual([...supported].sort()));

  it('os atributos calculados pela ficha batem com os do motor (sem buffs)', () => {
    for (const i of [0, 1]) {
      const go = run(i).stats;
      const m = resolved.team.members[i].character;
      expect(go.hp / m.baseHp).toBeCloseTo(1, 2);
      expect(go.atk).toBeGreaterThan(0);
    }
  });

  it('os golpes têm nome em português', () => {
    expect(rows(run(0), 'skill').map((r) => r.label)).toContain('Dano do 1° Golpe de Conversão de Fase Lunar');
    for (const card of ['auto', 'skill', 'burst']) for (const r of rows(run(1), card)) expect(r.label).not.toMatch(/^path_|\./);
  });

  it('as condições começam desligadas e a da Illuga aumenta o dano do Zibai', () => {
    const off = run(0);
    expect(off.cards.flatMap((c) => c.blocks).filter((b) => b.kind === 'cond' && b.value)).toEqual([]);
    const on = run(0, { Illuga: { burstSong: 'on' } });
    expect(rows(on, 'skill')[0].value as number).toBeGreaterThan(rows(off, 'skill')[0].value as number);
    expect(on.fromTeam.map((m) => m.key)).toEqual(['Illuga']);
  });
});

describe('condições da aba ligadas à rotação', () => {
  const linkedOf = (p: typeof project) => rotationConditions(p, resolveProject(p, game, effects), effects.characters);
  const toggle = (p: typeof project, owner: string, id: string, on: boolean) => setCondition(p, linkedOf(p)[owner][id].ids, on, resolveProject(p, game, effects).gearIds);
  const total = (p: typeof project) => {
    const r = resolveProject(p, game, effects);
    return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects }).optimization.result.totals.avg;
  };
  const burstFlat = (p: typeof project) => resolveProject(p, game, effects).flatEffects.filter((e) => /Illuga: Nightingale|Illuga A4/.test(e.name));

  it('cada condição ligada existe na ficha do GO', () => {
    const full = { ...project, members: project.members.map((m) => ({ ...m, constellation: 6 })) };
    const t = computeTalents(goRequest(full, resolveProject(full, game, effects), rolls, 0, 'hit', {}));
    const blocks = [...t.cards, ...t.fromTeam].flatMap((c) => c.blocks);
    const inSheet = blocks.flatMap((b) => (b.kind === 'cond' ? [`${b.owner}.${b.id}`] : []));
    const illuga = computeTalents(goRequest(full, resolveProject(full, game, effects), rolls, 1, 'hit', {})).cards.flatMap((c) => c.blocks);
    inSheet.push(...illuga.flatMap((b) => (b.kind === 'cond' ? [`${b.owner}.${b.id}`] : [])));
    for (const [owner, map] of Object.entries(linkedOf(full))) for (const id of Object.keys(map)) expect(inSheet).toContain(`${owner}.${id}`);
  });

  it('time novo começa desligado, e ligar muda o dano da rotação', () => {
    expect(linkedOf(project).Illuga.burstSong.value).toBe('');
    expect(burstFlat(project)).toEqual([]);
    const on = toggle(project, 'Illuga', 'burstSong', true);
    expect(linkedOf(on).Illuga.burstSong.value).toBe('on');
    expect(burstFlat(on)).toHaveLength(2);
    expect(total(on)).toBeGreaterThan(total(project));
    expect(burstFlat(toggle(on, 'Illuga', 'burstSong', false))).toEqual([]);
  });

  it('projeto salvo antes (sem condManual) continua ligado e desligar tira o dano fixo', () => {
    const saved = { ...project, members: project.members.map(({ condManual: _, ...m }) => m) };
    expect(linkedOf(saved).Illuga.burstSong.value).toBe('on');
    expect(burstFlat(saved)).toHaveLength(2);
    expect(burstFlat(toggle(saved, 'Illuga', 'burstSong', false))).toEqual([]);
  });

  it('a Maestria da A1 da Illuga entra com 2 membros Moonsign', () => {
    expect(resolved.team.members[1].characterEffect!.buffs.map((b) => b.id)).toContain('a1g');
    expect(linkedOf(project).Illuga.a1AfterSkillBurst.ids).toContain('cbuff-1-a1g');
  });

  it('remover um membro leva junto os interruptores', () => {
    const on = toggle(project, 'Illuga', 'burstSong', true);
    expect(removeMember(on, 0).enabled).toContain('cbuff-0-burst');
    expect(removeMember(on, 1).enabled).toEqual([]);
  });
});
