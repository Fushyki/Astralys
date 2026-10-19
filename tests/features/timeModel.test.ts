import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleForApp } from '../../src/features/rotation/persistence';
import { summarize } from '../../src/features/rotation/summary';
import { mainReaction } from '../../src/features/team/teamModel';
import { buffValues, burstLabel, cumulativeCurve, quickRead, topHits } from '../../src/features/time/timeModel';

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
const summary = summarize(bundle, resolved);

describe('curva de dano acumulado', () => {
  const curve = cumulativeCurve(bundle);

  it('tem um ponto por golpe, cresce sempre e termina no dano médio da rotação', () => {
    expect(curve).toHaveLength(24);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].t).toBeGreaterThanOrEqual(curve[i - 1].t);
      expect(curve[i].total).toBeGreaterThanOrEqual(curve[i - 1].total);
    }
    expect(curve[curve.length - 1].total).toBeCloseTo(3790496.07, 1);
  });

  it('marca os Supremos e o da Mavuika vale ~1,24 mi', () => {
    const bursts = curve.filter((p) => p.burst);
    expect(bursts.length).toBeGreaterThanOrEqual(4);
    const mav = bursts.find((p) => p.member === 0)!;
    expect(mav.avg).toBeCloseTo(1239638, -2);
    expect(burstLabel(mav, 'Mavuika')).toBe('Q Mavuika +1,24 mi');
  });
});

describe('ranking de golpes', () => {
  const top = topHits(bundle, 10);
  it('ordena do maior para o menor, com a posição e a participação', () => {
    expect(top[0].rank).toBe(1);
    expect(top[0].name).toMatch(/Supremo \(200 FS\)/);
    expect(top[0].fraction).toBeCloseTo(0.327, 2);
    for (let i = 1; i < top.length; i++) expect(top[i - 1].avg).toBeGreaterThanOrEqual(top[i].avg);
  });
});

describe('valor dos buffs e leitura rápida', () => {
  const values = buffValues(summary, bundle);
  const text = quickRead(summary, values, mainReaction(bundle));

  it('entre os buffs de equipe, o ATK fixo do Bennett é o mais valioso (~21,8% na planilha)', () => {
    const best = values.find((v) => !v.flagged && v.team)!;
    expect(best.label).toMatch(/ATK fixo/);
    expect(best.fraction).toBeGreaterThan(0.18);
    expect(best.fraction).toBeLessThan(0.26);
  });

  it('os buffs sem origem ficam sinalizados', () => {
    expect(values.some((v) => v.flagged)).toBe(true);
  });

  it('três frases: hipercarry, buff mais valioso e buffs sem origem', () => {
    expect(text).toHaveLength(3);
    expect(text[0]).toMatch(/Hipercarry: Mavuika causa 95%/);
    expect(text[1]).toMatch(/O buff mais valioso é .* \(\d+,\d%\)\./);
    expect(text[2]).toMatch(/sem origem/);
  });

  it('sem hipercarry e sem buffs sem origem, a frase muda', () => {
    const split = { ...summary, members: summary.members.map((m, i) => ({ ...m, fraction: i < 2 ? 0.4 : 0.1 })) };
    const t = quickRead(split, values.filter((v) => !v.flagged), { name: 'Derreter', fraction: 0.55 });
    expect(t[0]).toMatch(/Dano dividido/);
    expect(t[2]).toMatch(/55,0% do dano vem de Derreter/);
  });
});
