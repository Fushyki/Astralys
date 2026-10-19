import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, tagsAt, type EffectsData, type GameData, type RotationProject } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import * as ops from '../../src/features/rotation/projectOps';
import { useRotationStore } from '../../src/features/rotation/store';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = {
  characters: json('src/data/generated/characters.json'),
  moves: json('src/data/generated/moves.json'),
  weapons: json('src/data/generated/weapons.json'),
  artifacts: json('src/data/generated/artifacts.json'),
};
const effects: EffectsData = {
  characters: json('src/effects/characters.json'),
  weapons: json('src/effects/weapons.json'),
  sets: json('src/effects/sets.json'),
  flatDamage: json('src/effects/flatDamage.json'),
};
const analyze = (p: RotationProject) => {
  const r = resolveProject(p, game, effects);
  return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
};
const byTime = (p: RotationProject) => [...p.actions].sort((a, b) => a.time - b.time);

describe('realinhar: ordem, intervalo e espaços', () => {
  const src = sampleProject();
  const out = ops.realignActions(src, 0.5);

  it('mantém a ordem em que os golpes foram colocados', () => {
    expect(byTime(out).map((a) => a.id)).toEqual(byTime(src).map((a) => a.id));
  });

  it('fica seguido: começa em 0 e cada golpe vem 0,5 s depois do anterior', () => {
    const times = byTime(out).map((a) => a.time);
    times.forEach((t, k) => expect(t).toBeCloseTo(k * 0.5, 9));
    for (let i = 1; i < times.length; i++) expect(times[i] - times[i - 1]).toBeCloseTo(0.5, 9); // sem espaços
    expect(new Set(times).size).toBe(times.length); // sem sobreposição
  });

  it('só os tempos mudam: o resto das ações fica igual', () => {
    for (const a of out.actions) {
      const before = src.actions.find((x) => x.id === a.id)!;
      expect({ ...a, time: 0 }).toEqual({ ...before, time: 0 });
    }
  });

  it('aceita outro intervalo e outro início', () => {
    const p = ops.realignActions(src, 1.5, 2);
    const times = byTime(p).map((a) => a.time);
    expect(times[0]).toBe(2);
    expect(times[1]).toBe(3.5);
    expect(times[times.length - 1]).toBeCloseTo(2 + 1.5 * (src.actions.length - 1), 9);
  });

  it('empates de tempo mantêm a ordem original (estável)', () => {
    let p = ops.addAction(src, { member: 3, move: { character: 'Bennett', talent: 'burst', label: 'Skill DMG', variant: 0 }, time: 5 });
    p = ops.addAction(p, { member: 3, move: { character: 'Bennett', talent: 'skill', label: 'Press DMG', variant: 0 }, time: 5 });
    const first = p.actions[p.actions.length - 2].id;
    const second = p.actions[p.actions.length - 1].id;
    const r = ops.realignActions(p);
    expect(r.actions.find((a) => a.id === first)!.time).toBeLessThan(r.actions.find((a) => a.id === second)!.time);
  });

  it('intervalo inválido ou pequeno demais vira o mínimo ou o padrão', () => {
    const tiny = byTime(ops.realignActions(src, 0.01)).map((a) => a.time);
    expect(tiny[1] - tiny[0]).toBeCloseTo(ops.MIN_REALIGN_STEP, 9);
    const nan = byTime(ops.realignActions(src, NaN)).map((a) => a.time);
    expect(nan[1] - nan[0]).toBeCloseTo(ops.DEFAULT_REALIGN_STEP, 9);
  });

  it('já alinhado devolve o MESMO projeto (sem criar histórico)', () => {
    expect(ops.realignActions(out, 0.5)).toBe(out);
    expect(ops.realignActions({ ...src, actions: [] })).toEqual({ ...src, actions: [] });
  });

  it('não muta o original', () => {
    const frozen = JSON.stringify(src);
    ops.realignActions(src, 0.7);
    expect(JSON.stringify(src)).toBe(frozen);
  });

  it('o fim do último golpe serve para ajustar a duração', () => {
    expect(ops.lastActionTime(out)).toBeCloseTo((src.actions.length - 1) * 0.5, 9);
    expect(ops.lastActionTime({ ...src, actions: [] })).toBe(0);
  });
});

describe('realinhar: as janelas de buff continuam cobrindo os mesmos golpes', () => {
  const windowed = ops.windowsFromProfiles(sampleProject());

  it('cada golpe mantém exatamente as mesmas etiquetas de buff', () => {
    for (const step of [0.3, 0.5, 1, 2.5]) {
      const r = ops.realignActions(windowed, step);
      for (const a of windowed.actions) {
        const after = r.actions.find((x) => x.id === a.id)!;
        expect(tagsAt(r.buffWindows, after.time), `passo ${step}, golpe ${a.id}`).toEqual(tagsAt(windowed.buffWindows, a.time));
      }
    }
  });

  it('janela que cobria os golpes 3 a 5 continua cobrindo só esses', () => {
    let p = ops.addWindow(sampleProject(), 'label:Scroll', 8.5, 2.2); // 8,5 a 10,7
    p = { ...p, actions: p.actions.map((a) => ({ ...a, tagSource: 'windows' as const })) };
    const covered = (proj: RotationProject) => proj.actions.filter((a) => tagsAt(proj.buffWindows, a.time).includes('label:Scroll')).map((a) => a.id).sort();
    const before = covered(p);
    expect(before.length).toBeGreaterThan(0);
    expect(covered(ops.realignActions(p, 0.5))).toEqual(before);
  });

  it('janela antes do primeiro golpe e depois do último acompanham o deslocamento', () => {
    let p = ops.addWindow(sampleProject(), 'gear:3', 0, 0.3); // antes de tudo (golpes só a partir de 0,4)
    p = ops.addWindow(p, 'gear:1', 18, 2); // depois do último golpe (17,4)
    const r = ops.realignActions(p, 0.5);
    const first = r.buffWindows.find((w) => w.tag === 'gear:3')!;
    const last = r.buffWindows.find((w) => w.tag === 'gear:1')!;
    expect(first.start).toBeLessThanOrEqual(0.1);
    expect(last.start).toBeGreaterThan(ops.lastActionTime(r)); // continua depois do último golpe
    expect(last.end - last.start).toBeCloseTo(2, 1);
  });

  it('janelas nunca ficam invertidas nem negativas', () => {
    const r = ops.realignActions(windowed, 0.1);
    for (const w of r.buffWindows) {
      expect(w.start).toBeGreaterThanOrEqual(0);
      expect(w.end).toBeGreaterThan(w.start);
    }
  });

  it('ações com perfil fixo ganham tempo novo mas mantêm as etiquetas', () => {
    const src = sampleProject();
    const r = ops.realignActions(src, 0.5);
    for (const a of r.actions) expect(a.activeTags).toEqual(src.actions.find((x) => x.id === a.id)!.activeTags);
    expect(analyze(r).optimization.result.totals.avg).toBeCloseTo(analyze(src).optimization.result.totals.avg, 4);
  });
});

describe('cenário: duração e inimigo', () => {
  it('duração maior reduz o DPS na mesma proporção, sem mexer no dano total', () => {
    const p = sampleProject();
    const doubled = ops.updateConfig(p, { rotationDuration: 35 });
    const a = analyze(p).optimization.result.totals;
    const b = analyze(doubled).optimization.result.totals;
    expect(b.avg).toBeCloseTo(a.avg, 6);
    expect(b.dps).toBeCloseTo(a.dps / 2, 4);
  });

  it('um inimigo de nível menor recebe mais dano; mais RES, menos', () => {
    const p = sampleProject();
    const base = analyze(p).optimization.result.totals.avg;
    expect(analyze(ops.updateConfig(p, { enemyLevel: 90 })).optimization.result.totals.avg).toBeGreaterThan(base);
    expect(analyze(ops.updateConfig(p, { enemyBaseRes: 0.4 })).optimization.result.totals.avg).toBeLessThan(base);
  });

  it('limita valores absurdos e ignora inválidos', () => {
    const p = sampleProject();
    expect(ops.updateConfig(p, { enemyLevel: 9999 }).config.enemyLevel).toBe(200);
    expect(ops.updateConfig(p, { enemyLevel: -5 }).config.enemyLevel).toBe(1);
    expect(ops.updateConfig(p, { enemyDefRed: 5 }).config.enemyDefRed).toBe(0.9);
    expect(ops.updateConfig(p, { rotationDuration: 0 })).toBe(p);
    expect(ops.updateConfig(p, { rotationDuration: NaN })).toBe(p);
    expect(ops.updateConfig(p, { minRollsPerSubstat: 99 }).config.minRollsPerSubstat).toBe(6);
  });

  it('sem mudança devolve o mesmo projeto', () => {
    const p = sampleProject();
    expect(ops.updateConfig(p, { enemyLevel: p.config.enemyLevel })).toBe(p);
    expect(ops.updateConfig(p, {})).toBe(p);
  });
});

describe('estado: realinhar e cenário são desfazíveis', () => {
  beforeEach(() => useRotationStore.getState().open(sampleProject()));
  const st = () => useRotationStore.getState();

  it('realinhar é UM passo no histórico e desfaz por completo', () => {
    const before = st().project!;
    st().realign(0.5);
    expect(st().past).toHaveLength(1);
    expect(st().project!.actions.map((a) => a.time)).not.toEqual(before.actions.map((a) => a.time));
    st().undo();
    expect(st().project).toBe(before);
  });

  it('realinhar duas vezes seguidas não cria passo repetido', () => {
    st().realign(0.5);
    st().realign(0.5);
    expect(st().past).toHaveLength(1);
  });

  it('alterar a duração é desfazível', () => {
    st().updateConfig({ rotationDuration: 30 });
    expect(st().project!.config.rotationDuration).toBe(30);
    st().undo();
    expect(st().project!.config.rotationDuration).toBe(17.5);
  });
});
