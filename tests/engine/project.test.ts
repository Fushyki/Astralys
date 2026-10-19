import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  ProjectResolveError,
  RotationProjectSchema,
  assembleTeam,
  optimizeTeam,
  parseProject,
  resolveProject,
  type EffectsData,
  type GameData,
  type RotationProject,
} from '../../src/engine';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));

const data: GameData = {
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
const sample = json<unknown>('src/features/rotation/sample/mavuika-iansan.json');

const clone = (): RotationProject => structuredClone(parseProject(sample));

describe('projeto de exemplo (JSON salvo)', () => {
  it('passa na validação e sobrevive a ida e volta em JSON', () => {
    const p = parseProject(sample);
    expect(p.schemaVersion).toBe(1);
    expect(p.members).toHaveLength(4);
    expect(p.actions).toHaveLength(24);
    expect(parseProject(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });

  it('resolvido e otimizado reproduz a planilha: DPR 3.790.496,07 e DPS 216.599,78', () => {
    const r = resolveProject(parseProject(sample), data, effects);
    const o = optimizeTeam({
      members: r.team.members,
      assembly: assembleTeam(r.team),
      config: r.team.config,
      actions: r.actions,
      flatEffects: r.flatEffects,
      ampCoefficient: r.ampCoefficient,
    });
    expect(o.result.totals.avg).toBeCloseTo(3790496.072, 2);
    expect(o.result.totals.dps).toBeCloseTo(216599.7756, 2);
    expect(o.result.members[0].share).toBeCloseTo(0.95266, 4);
  });

  it('as ações saem em ordem cronológica', () => {
    const r = resolveProject(parseProject(sample), data, effects);
    const times = r.actions.map((a) => a.time!);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(r.actions[0].move.character).toBe('Citlali'); // Obsidian Tzitzimitl a 0,4 s
  });

  it('o modo planilha usa o coeficiente 2,78; o modo normal usa o padrão do motor', () => {
    expect(resolveProject(parseProject(sample), data, effects).ampCoefficient).toBe(2.78);
    const p = clone();
    p.compat = 'none';
    expect(resolveProject(p, data, effects).ampCoefficient).toBeUndefined();
  });
});

describe('validação do projeto', () => {
  it('recusa versão desconhecida e equipe vazia ou grande demais', () => {
    expect(() => parseProject({ ...(sample as object), schemaVersion: 2 })).toThrow();
    const p = clone();
    expect(() => parseProject({ ...p, members: [] })).toThrow();
    expect(() => parseProject({ ...p, members: [...p.members, ...p.members] })).toThrow();
  });

  it('recusa ação cujo membro não existe ou não é o dono do golpe', () => {
    const p = clone();
    p.actions[0].member = 9;
    expect(RotationProjectSchema.safeParse(p).success).toBe(false);

    const q = clone();
    q.actions[0].member = 3; // golpe da Mavuika atribuído ao Bennett
    const res = RotationProjectSchema.safeParse(q);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.issues[0].message).toMatch(/Mavuika/);
  });

  it('recusa ids de ação repetidos', () => {
    const p = clone();
    p.actions[1].id = p.actions[0].id;
    expect(RotationProjectSchema.safeParse(p).success).toBe(false);
  });

  it('recusa nível de talento e duração inválidos', () => {
    const p = clone();
    p.members[0].talents.skill = 16;
    expect(RotationProjectSchema.safeParse(p).success).toBe(false);
    const q = clone();
    q.config.rotationDuration = 0;
    expect(RotationProjectSchema.safeParse(q).success).toBe(false);
  });

  it('aplica padrões: ação sem reação nem etiquetas é válida', () => {
    const p = clone();
    const raw = JSON.parse(JSON.stringify(p));
    delete raw.actions[0].reaction;
    delete raw.actions[0].activeTags;
    delete raw.actions[0].dmgAdjust;
    delete raw.actions[0].executions;
    const parsed = parseProject(raw);
    expect(parsed.actions[0]).toMatchObject({ reaction: 'none', activeTags: [], dmgAdjust: 0, executions: 1 });
  });
});

describe('resolução: erros claros quando algo não existe nos dados', () => {
  it('arma, personagem e golpe inexistentes', () => {
    const w = clone();
    w.members[0].weapon = 'Espada Inexistente';
    expect(() => resolveProject(w, data, effects)).toThrow(ProjectResolveError);
    expect(() => resolveProject(w, data, effects)).toThrow(/Espada Inexistente/);

    const m = clone();
    m.actions[0].move.label = 'Golpe Fantasma';
    expect(() => resolveProject(m, data, effects)).toThrow(/Golpe Fantasma/);
  });
});
