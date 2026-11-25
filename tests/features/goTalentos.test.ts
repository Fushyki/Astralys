import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { GO_TALENT_CHARACTERS, goRequest } from '../../src/features/talentos/goRequest';
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
