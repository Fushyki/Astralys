import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, parseProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { buildNewTeam, defaultTeamName } from '../../src/features/rotation/newTeam';

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
const run = (p: ReturnType<typeof buildNewTeam>) => {
  const r = resolveProject(p, game, effects);
  return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
};

describe('time novo', () => {
  const names = ['Hu Tao', 'Xingqiu', 'Yelan', 'Zhongli'];

  it('rotação básica: habilidade e supremo de cada um, em ordem e sem repetir tempo', () => {
    const p = buildNewTeam({ characters: names, rotation: 'basic' }, game);
    expect(p.members.map((m) => m.character)).toEqual(names);
    expect(p.actions).toHaveLength(8);
    expect(p.actions.map((a) => a.move.talent)).toEqual(['skill', 'burst', 'skill', 'burst', 'skill', 'burst', 'skill', 'burst']);
    const times = p.actions.map((a) => a.time);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(times).size).toBe(times.length);
    expect(p.config.rotationDuration).toBeGreaterThan(times[times.length - 1]);
  });

  it('o projeto sai válido, sem nada do time de exemplo, e o motor calcula dano', () => {
    const p = buildNewTeam({ characters: names, rotation: 'basic' }, game);
    expect(() => parseProject(JSON.parse(JSON.stringify(p)))).not.toThrow();
    expect(p.extras).toEqual([]);
    expect(p.compat).toBe('none');
    expect(p.meta.favorite).toBeUndefined();
    const bundle = run(p);
    expect(bundle.optimization.result.totals.avg).toBeGreaterThan(0);
  });

  it('em branco: sem ações, e o motor aguenta (dano zero)', () => {
    const p = buildNewTeam({ characters: ['Citlali'], rotation: 'blank' }, game);
    expect(p.actions).toEqual([]);
    expect(run(p).optimization.result.totals.avg).toBe(0);
  });

  it('nome padrão, repetidos ignorados e no máximo 4', () => {
    expect(defaultTeamName(['A', 'B'])).toBe('A · B');
    const p = buildNewTeam({ characters: ['Citlali', 'Citlali', 'Bennett', 'Mavuika', 'Iansan', 'Xingqiu'], rotation: 'blank', name: '  Meu time ' }, game);
    expect(p.members.map((m) => m.character)).toEqual(['Citlali', 'Bennett', 'Mavuika', 'Iansan']);
    expect(p.name).toBe('Meu time');
  });

  it('usa os builds prontos de quem os tem e o padrão dos outros', () => {
    const base = buildNewTeam({ characters: ['Bennett'], rotation: 'blank' }, game).members[0];
    const pronto = { ...base, constellation: 6, refinement: 3 };
    const p = buildNewTeam({ characters: ['Bennett', 'Citlali'], builds: { Bennett: pronto }, rotation: 'blank' }, game);
    expect(p.members[0]).toMatchObject({ constellation: 6, refinement: 3 });
    expect(p.members[1].constellation).toBeUndefined();
  });

  it('exige pelo menos um personagem', () => {
    expect(() => buildNewTeam({ characters: [], rotation: 'blank' }, game)).toThrow(/pelo menos um/);
  });
});
