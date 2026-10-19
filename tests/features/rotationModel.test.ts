import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleForApp } from '../../src/features/rotation/persistence';
import { coveringBuffs, hitCascade, laneInfos } from '../../src/features/rotation/rotationModel';

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

const project = sampleForApp();
const resolved = resolveProject(project, game, effects);
const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });
const burst = bundle.optimization.result.actions.find((a) => /Supremo \(200 FS\)/.test(a.action.move.displayName))!;

describe('o exemplo do site abre com os buffs em janelas e o mesmo dano da planilha', () => {
  it('DPR 3.790.496 e DPS 216.600', () => {
    expect(bundle.optimization.result.totals.avg).toBeCloseTo(3790496.07, 1);
    expect(bundle.optimization.result.totals.dps).toBeCloseTo(216599.78, 1);
  });
  it('todas as ações seguem janelas e há janelas de buff', () => {
    expect(project.actions.every((a) => a.tagSource === 'windows')).toBe(true);
    expect(project.buffWindows.length).toBeGreaterThanOrEqual(6);
  });
});

describe('faixas de buff', () => {
  const lanes = laneInfos(project, resolved);

  it('uma faixa por fonte, com fonte, alvo e valor', () => {
    expect(lanes.length).toBeGreaterThanOrEqual(6);
    for (const l of lanes) {
      expect(l.value.length, l.tag).toBeGreaterThan(0);
      expect(l.source.length, l.tag).toBeGreaterThan(0);
    }
  });

  it('o ATK fixo do Bennett aparece com a cor do Bennett como fonte', () => {
    const flat = lanes.find((l) => l.tag === 'char:3')!;
    expect(flat.giver).toBe(3);
    expect(flat.value).toMatch(/ATK fixo/);
  });

  it('o buff de ATK da Citlali (TTDS) é atribuído à Citlali', () => {
    const ttds = lanes.find((l) => l.tag === 'label:TTDS')!;
    expect(ttds.giver).toBe(1);
    expect(ttds.source).toMatch(/Citlali/);
    expect(ttds.value).toMatch(/48% ATK/);
  });
});

describe('cascata do golpe', () => {
  const steps = hitCascade(burst);

  it('começa no dano base e termina no dano médio do golpe', () => {
    expect(steps[0].key).toBe('base');
    expect(steps[steps.length - 1].value).toBeCloseTo(burst.avg, 4);
  });

  it('os passos seguem a ordem do mockup: bônus, DEF, RES, reação e crítico médio', () => {
    expect(steps.map((s) => s.key)).toEqual(['base', 'dmg', 'def', 'res', 'reaction', 'crit']);
  });

  it('no Supremo da Mavuika: DEF ×0,487, Derreter ×3,29 e base 79.725 (o mockup mostra 79.403, valor ilustrativo)', () => {
    const f = Object.fromEntries(steps.map((s) => [s.key, s.factor]));
    expect(f.def).toBeCloseTo(0.487, 3);
    expect(f.reaction).toBeCloseTo(3.292, 3);
    expect(steps[0].value).toBeCloseTo(79724.66, 1);
  });
});

describe('buffs que cobrem o golpe', () => {
  const list = coveringBuffs(project, resolved, bundle, burst.action.id);

  it('lista os buffs ativos no golpe, do que mais pesa ao que menos pesa', () => {
    expect(list.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < list.length; i++) expect(list[i - 1].loss).toBeGreaterThanOrEqual(list[i].loss);
  });

  it('o ATK fixo do Bennett é o que mais pesa (~22%)', () => {
    expect(list[0].id).toBe('flat-atk-3');
    expect(list[0].loss).toBeGreaterThan(0.15);
    expect(list[0].loss).toBeLessThan(0.3);
  });

  it('golpe inexistente devolve lista vazia', () => {
    expect(coveringBuffs(project, resolved, bundle, 'nao-existe')).toEqual([]);
  });
});
