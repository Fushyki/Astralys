/**
 * A rotação contra a ficha do Genshin Optimizer, golpe a golpe: mesmo time, mesmos atributos e todas as condições ligadas.
 * Fora da comparação: a Ressonância Geo (no GO é condicional, o motor a aplica sempre), os 21 acúmulos do Supremo da Illuga
 * e a espera pelo Supremo dela (aqui liberados para todos os golpes, como no GO).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, labelTag, resolveProject, type EffectsData, type GameData, type RotationProject } from '../../src/engine';
import { memberProcs } from '../../src/engine/project';
import { minimumRolls } from '../../src/engine/stats';
import { setCondition } from '../../src/features/rotation/projectOps';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';
import { goRequest, rotationConditions } from '../../src/features/talentos/goRequest';
import { computeTalents } from '../../src/vendor/go/talentos';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const NAMES = ['Zibai', 'Illuga'];
const ALL_ON = { Zibai: { a1Moonfall: 'on', c1FirstStride: 'on', c4Splendor: 'on', c2ShiftMode: 'on', c6Point: '30' }, Illuga: { burstSong: 'on', a1AfterSkillBurst: 'on', c4BurstActive: 'on' } };
/** Na C4 o GO multiplica o próprio golpe do kit; no Astralys esse golpe é o extra de constelação. */
const C4_MOVE = 'Dano Adicional do 4º Golpe de Conversão de Fase Lunar';
const PROC_ROW: Record<string, string> = { 'char:c4': C4_MOVE, 'char:c2': 'constellation2' };

function compare(constellation: number) {
  const kit = NAMES.flatMap((n, member) => game.moves.filter((m) => m.character === n).map((m) => ({ member, ref: { character: n, talent: m.talent as string, label: m.label, variant: m.variant } })));
  let p = {
    ...sampleProject(), compat: 'none', elementMode: 'kit', extras: [], buffWindows: [], disabled: ['resonance-geo'], enabled: [], flatStacks: {} as Record<string, 'all'>,
    members: NAMES.map((n) => ({ ...defaultMember(n, game), constellation })), actions: [],
  } as unknown as RotationProject;
  const procs = resolveProject(p, game, effects).team.members.flatMap((m, member) => memberProcs(m, game.moves).filter((x) => x.key in PROC_ROW).map((x) => ({ member, ref: { character: NAMES[member], talent: 'proc', label: x.key, variant: 0 } })));
  const list = [...kit, ...procs];
  const tags = effects.characters.filter((e) => NAMES.includes(e.character)).flatMap((e) => e.buffs.filter((b) => b.timed).map((b) => labelTag(b.label)));
  p.actions = list.map(({ member, ref }, i) => ({ id: `a${i}`, member, move: ref, executions: 1, reaction: 'none', activeTags: tags, tagSource: 'manual', dmgAdjust: 0, time: i })) as RotationProject['actions'];
  for (const map of Object.values(rotationConditions(p, resolveProject(p, game, effects), effects.characters))) for (const c of Object.values(map)) p = setCondition(p, c.ids, true, resolveProject(p, game, effects).gearIds);
  for (const e of resolveProject(p, game, effects).flatEffects) p.flatStacks![`${e.source}|${e.name}`] = 'all';
  const r = resolveProject(p, game, effects);
  const rolls = r.team.members.map(() => minimumRolls(2));
  const result = evaluateRotation({ members: r.team.members, assembly: assembleTeam(r.team), config: r.team.config, rolls, flatEffects: r.flatEffects.map(({ afterBurst: _, ...e }) => e) }, r.actions);
  const sheet = NAMES.map((_, i) => computeTalents(goRequest(p, r, rolls, i, 'hit', ALL_ON)));

  return result.actions.flatMap((a) => {
    const i = list.findIndex((_, k) => `a${k}` === a.action.id);
    const { member, ref } = list[i];
    const rows = sheet[member].cards.flatMap((c) => c.blocks.flatMap((b) => (b.kind === 'text' ? [] : b.rows.map((row) => ({ ...row, card: c.key })))));
    const move = r.actions.find((x) => x.id === a.action.id)!.move;
    const wanted = ref.talent === 'proc' ? PROC_ROW[ref.label] : game.moves.find((m) => m.character === ref.character && m.talent === ref.talent && m.label === ref.label && m.variant === ref.variant)!.labelPt;
    if (ref.talent !== 'proc' && constellation >= 4 && wanted === C4_MOVE) return [];
    const row = rows.find((x) => x.element && (x.label === wanted || x.card === wanted));
    if (!row) return [];
    // O GO mostra o valor de um acerto; a rotação soma todos os acertos do golpe.
    return [{ who: `C${constellation} ${ref.character} ${wanted}`, ratio: a.noCrit / ((row.value as number) * Math.max(1, ref.talent === 'proc' ? 1 : move.hits)) }];
  });
}

describe('rotação × Genshin Optimizer (Zibai e Illuga)', () => {
  it.each([0, 6])('C%i: cada golpe com todas as condições ligadas', (constellation) => {
    const checked = compare(constellation);
    expect(checked.length).toBeGreaterThanOrEqual(constellation ? 21 : 19);
    expect(checked.filter((c) => Math.abs(c.ratio - 1) > 0.002)).toEqual([]);
    if (constellation) expect(checked.map((c) => c.who)).toEqual(expect.arrayContaining([`C6 Zibai ${C4_MOVE}`, 'C6 Illuga constellation2']));
  });
});
