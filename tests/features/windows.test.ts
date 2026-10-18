import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { analyzeProject, parseProject, resolveProject, tagsAt, type BuffWindow, type EffectsData, type GameData } from '../../src/engine';
import * as ops from '../../src/features/rotation/projectOps';
import { sampleProject } from '../../src/features/rotation/persistence';
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
const total = (p: ReturnType<typeof sampleProject>) => {
  const r = resolveProject(p, game, effects);
  return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).optimization.result.totals.avg;
};

describe('tagsAt', () => {
  const w = (tag: string, start: number, end: number, id = `${tag}${start}`): BuffWindow => ({ id, tag, start, end });

  it('início incluído, fim excluído', () => {
    const windows = [w('a', 2, 5)];
    expect(tagsAt(windows, 1.99)).toEqual([]);
    expect(tagsAt(windows, 2)).toEqual(['a']);
    expect(tagsAt(windows, 4.99)).toEqual(['a']);
    expect(tagsAt(windows, 5)).toEqual([]);
  });

  it('várias janelas, sobreposição e etiquetas sem repetição, em ordem', () => {
    const windows = [w('b', 0, 10), w('a', 3, 6), w('a', 5, 8, 'a2')];
    expect(tagsAt(windows, 5.5)).toEqual(['a', 'b']);
    expect(tagsAt(windows, 9)).toEqual(['b']);
    expect(tagsAt([], 3)).toEqual([]);
  });
});

describe('operações de janelas', () => {
  it('adicionar cria id único e começo ≥ 0', () => {
    const p = ops.addWindow(sampleProject(), 'label:Scroll', -3, 5);
    const win = p.buffWindows[0];
    expect(win).toMatchObject({ tag: 'label:Scroll', start: 0, end: 5 });
    const q = ops.addWindow(p, 'gear:3', 2);
    expect(new Set(q.buffWindows.map((x) => x.id)).size).toBe(2);
    expect(q.buffWindows[1].end - q.buffWindows[1].start).toBe(ops.DEFAULT_WINDOW);
  });

  it('redimensionar respeita a duração mínima e não inverte', () => {
    let p = ops.addWindow(sampleProject(), 'gear:3', 2, 4);
    const id = p.buffWindows[0].id;
    p = ops.updateWindow(p, id, { end: 1 }); // fim antes do início
    expect(p.buffWindows[0]).toMatchObject({ start: 2, end: 2.1 });
    p = ops.updateWindow(p, id, { start: 9 });
    expect(p.buffWindows[0].end).toBeGreaterThan(p.buffWindows[0].start);
  });

  it('deslocar mantém a duração', () => {
    let p = ops.addWindow(sampleProject(), 'gear:3', 2, 4);
    p = ops.shiftWindow(p, p.buffWindows[0].id, 7);
    expect(p.buffWindows[0]).toMatchObject({ start: 7, end: 11 });
    p = ops.shiftWindow(p, p.buffWindows[0].id, -5);
    expect(p.buffWindows[0]).toMatchObject({ start: 0, end: 4 });
  });

  it('remover e id inexistente', () => {
    const p = ops.addWindow(sampleProject(), 'gear:3', 2);
    expect(ops.removeWindow(p, p.buffWindows[0].id).buffWindows).toHaveLength(0);
    expect(ops.removeWindow(p, 'x')).toBe(p);
    expect(ops.updateWindow(p, 'x', { start: 1 })).toBe(p);
  });

  it('nunca muta o original', () => {
    const p = sampleProject();
    const frozen = JSON.stringify(p);
    ops.windowsFromProfiles(p);
    ops.addWindow(p, 'gear:3', 1);
    expect(JSON.stringify(p)).toBe(frozen);
  });
});

describe('ações que seguem as janelas', () => {
  const burst = { character: 'Bennett', talent: 'burst' as const, label: 'Skill DMG', variant: 0 };

  it('ação nova usa janelas; a do exemplo continua manual', () => {
    const p = sampleProject();
    expect(p.actions.every((a) => a.tagSource === 'manual')).toBe(true);
    const q = ops.addAction(p, { member: 3, move: burst, time: 9 });
    expect(q.actions[q.actions.length - 1].tagSource).toBe('windows');
  });

  it('as etiquetas da ação vêm das janelas pelo tempo', () => {
    let p = ops.addAction(sampleProject(), { member: 3, move: burst, time: 9 });
    const id = p.actions[p.actions.length - 1].id;
    p = ops.addWindow(p, 'gear:3', 8, 3); // 8 a 11
    const at = (proj: typeof p) => resolveProject(proj, game, effects).actions.find((a) => a.id === id)!.activeTags;
    expect(at(p)).toEqual(['gear:3']);
    p = ops.moveAction(p, id, 12); // fora da janela
    expect(at(p)).toEqual([]);
  });

  it('o dano muda quando o golpe entra ou sai da janela do buff', () => {
    const base = ops.addAction(sampleProject(), { member: 0, move: { character: 'Mavuika', talent: 'skill', label: 'Flamestrider Sprint DMG', variant: 0 }, time: 9 });
    const withBuff = ops.addWindow(base, 'char:3', 0, 20); // ATK fixo do Bennett durante toda a rotação
    expect(total(withBuff)).toBeGreaterThan(total(base));
  });
});

describe('converter perfis em janelas', () => {
  it('cria uma janela por etiqueta e passa todas as ações para o modo janelas', () => {
    const p = ops.windowsFromProfiles(sampleProject());
    expect(p.actions.every((a) => a.tagSource === 'windows')).toBe(true);
    const tags = p.buffWindows.map((w) => w.tag);
    expect(new Set(tags).size).toBe(tags.length);
    expect(tags).toEqual(expect.arrayContaining(['char:3', 'gear:3', 'label:Scroll', 'label:TTDS']));
  });

  it('cada janela cobre todos os golpes que antes usavam aquela etiqueta', () => {
    const src = sampleProject();
    const p = ops.windowsFromProfiles(src);
    for (const a of src.actions) {
      const now = tagsAt(p.buffWindows, a.time);
      for (const tag of a.activeTags) expect(now, `${a.id} perdeu ${tag}`).toContain(tag);
    }
  });

  it('é idempotente e o projeto continua válido e calculável', () => {
    const once = ops.windowsFromProfiles(sampleProject());
    expect(ops.windowsFromProfiles(once)).toBe(once);
    expect(() => parseProject(JSON.parse(JSON.stringify(once)))).not.toThrow();
    expect(total(once)).toBeGreaterThan(1_000_000);
  });
});

describe('estado: janelas, régua e seleção', () => {
  beforeEach(() => useRotationStore.getState().open(sampleProject()));
  const st = () => useRotationStore.getState();

  it('adicionar janela seleciona a janela; selecionar ação limpa a janela', () => {
    const id = st().addWindow('label:Scroll', 3, 5)!;
    expect(st().selectedWindowId).toBe(id);
    expect(st().selectedActionId).toBeNull();
    st().select('row-5');
    expect(st().selectedWindowId).toBeNull();
  });

  it('desfaz e refaz operações de janela', () => {
    const id = st().addWindow('label:Scroll', 3, 5)!;
    st().shiftWindow(id, 6);
    expect(st().project!.buffWindows[0].start).toBe(6);
    st().undo();
    expect(st().project!.buffWindows[0].start).toBe(3);
    st().undo();
    expect(st().project!.buffWindows).toHaveLength(0);
    st().redo();
    expect(st().project!.buffWindows).toHaveLength(1);
  });

  it('remover a janela selecionada limpa a seleção; a régua nunca fica negativa', () => {
    const id = st().addWindow('gear:3', 2)!;
    st().removeWindow(id);
    expect(st().selectedWindowId).toBeNull();
    st().setPlayhead(-4);
    expect(st().playhead).toBe(0);
    st().setPlayhead(7.123);
    expect(st().playhead).toBe(7.12);
  });

  it('converter perfis é uma única operação desfazível', () => {
    st().convertProfilesToWindows();
    expect(st().project!.actions.every((a) => a.tagSource === 'windows')).toBe(true);
    st().undo();
    expect(st().project!.actions.every((a) => a.tagSource === 'manual')).toBe(true);
    expect(st().project!.buffWindows).toHaveLength(0);
  });
});
