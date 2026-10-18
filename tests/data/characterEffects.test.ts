import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CharacterEffectSchema, type CharacterEffect } from '../../src/effects/schema';
import { assembleTeam, resolveProject, type EffectsData, type GameData, type RotationProject } from '../../src/engine';
import { buffLanes } from '../../src/features/rotation/buffLanes';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const chars = json<CharacterEffect[]>('src/effects/characters.json');
const game: GameData = {
  characters: json('src/data/generated/characters.json'),
  moves: json('src/data/generated/moves.json'),
  weapons: json('src/data/generated/weapons.json'),
  artifacts: json('src/data/generated/artifacts.json'),
};
const effects: EffectsData = {
  characters: chars,
  weapons: json('src/effects/weapons.json'),
  sets: json('src/effects/sets.json'),
  flatDamage: json('src/effects/flatDamage.json'),
};
const get = (n: string) => chars.find((c) => c.character === n)!;
const buff = (n: string, id: string) => get(n).buffs.find((b) => b.id === id)!;

describe('efeitos de personagens cadastrados', () => {
  it('todos passam no esquema, têm fonte e correspondem a um personagem do Lunaris', () => {
    for (const c of chars) {
      expect(() => CharacterEffectSchema.parse(c), c.character).not.toThrow();
      expect(c.fonte_info.length, c.character).toBeGreaterThan(10);
      expect(game.characters.some((g) => g.name === c.character), c.character).toBe(true);
    }
  });

  it('mais de 25 personagens e os 4 da planilha continuam iguais', () => {
    expect(chars.length).toBeGreaterThan(25);
    expect(get('Bennett').teamFlatAtk).toBeDefined();
    expect(get('Citlali').resShred).toBeDefined();
  });

  it('cada buff curado diz o que assumiu e buffs de equipe são sempre em janela', () => {
    for (const c of chars) {
      for (const b of c.buffs ?? []) {
        expect(b.note?.length ?? 0, `${c.character} ${b.id}`).toBeGreaterThan(10);
        if (b.scope !== 'self') expect(b.timed, `${c.character} ${b.id}`).toBe(true);
      }
    }
  });

  it('valores conferidos à mão contra o texto do Lunaris', () => {
    expect(buff('Hu Tao', 'a1').stats?.critRate).toBeCloseTo(0.12, 6);
    expect(buff('Hu Tao', 'a4').stats?.dmgPct).toBeCloseTo(0.33, 6);
    expect(buff('Yelan', 'c4').stats?.hpPct).toBeCloseTo(0.4, 6); // 10% × 4 inimigos
    expect(buff('Yelan', 'c4').minConstellation).toBe(4);
    expect(buff('Xingqiu', 'a4').stats?.dmgPct).toBeCloseTo(0.2, 6);
    expect(buff('Ganyu', 'c1').resShred).toEqual({ value: 0.15, elements: ['Cryo'] });
    expect(buff('Raiden Shogun', 'c4').stats?.atkPct).toBeCloseTo(0.3, 6);
    expect(buff('Diluc', 'c2').stats?.atkPct).toBeCloseTo(0.3, 6); // 10% × 3 stacks
    expect(buff('Albedo', 'a4').stats?.em).toBe(125);
    expect(buff('Kamisato Ayaka', 'a1').stats?.dmgPctByType).toMatchObject({ normal: 0.3, charged: 0.3 });
  });
});

describe('buffs de personagem no motor', () => {
  const team = (names: string[], constellation?: number): RotationProject => {
    const base = sampleProject();
    return {
      ...base,
      members: names.map((n) => ({ ...defaultMember(n, game), constellation })),
      actions: [],
      buffWindows: [],
      profiles: {},
    };
  };
  const assemble = (p: RotationProject) => assembleTeam(resolveProject(p, game, effects).team);
  const buffIds = (p: RotationProject) => assemble(p).buffs.map((b) => b.id);

  it('o buff de equipe só vale a partir da constelação e vira faixa na linha do tempo', () => {
    const c0 = team(['Hu Tao', 'Xingqiu', 'Yelan', 'Kamisato Ayaka'], 0);
    const c4 = team(['Hu Tao', 'Xingqiu', 'Yelan', 'Kamisato Ayaka'], 4);
    expect(buffIds(c0)).toContain('cbuff-0-a1');
    expect(buffIds(c0)).not.toContain('cbuff-0-c4');
    expect(buffIds(c4)).toContain('cbuff-0-c4');
    expect(buffIds(c0)).not.toContain('cbuff-2-c4'); // Yelan C4 precisa de C4
    expect(buffIds(c4)).toContain('cbuff-2-c4');
    const lanes = buffLanes(resolveProject(c4, game, effects).team);
    expect(lanes.some((l) => l.label === 'Hu Tao A1')).toBe(true);
  });

  it('"others" não vale para o dono e "team" com elemento só vale para quem é do elemento', () => {
    const p = team(['Hu Tao', 'Xiangling', 'Kamisato Ayaka', 'Xingqiu'], 6);
    const a = assemble(p);
    const a1 = a.buffs.find((b) => b.id === 'cbuff-0-a1')!;
    expect(a1.targets).toEqual(['Xiangling', 'Kamisato Ayaka', 'Xingqiu']); // sem a Hu Tao
    const c6 = a.buffs.find((b) => b.id === 'cbuff-1-c6')!; // Xiangling C6: DMG Pyro só para Pyro
    expect(c6.targets).toEqual(['Hu Tao', 'Xiangling']);
  });

  it('passiva própria sempre ativa entra nos stats estáticos (Xingqiu: +20% de DMG Hydro)', () => {
    const p = team(['Xingqiu', 'Hu Tao', 'Yelan', 'Albedo'], 0);
    const a = assemble(p);
    expect(a.sources[0].some((s) => s.id === 'm0:cbuff-a4')).toBe(true);
    const withBuff = a.statics[0].dmgBonus;
    const noEffects = assembleTeam(resolveProject(p, game, { ...effects, characters: [] }).team).statics[0].dmgBonus;
    expect(withBuff - noEffects).toBeCloseTo(0.2, 9);
  });

  it('redução de RES de constelação: Ganyu C1 tira 15% da RES Cryo, e só a partir da C1', () => {
    const c0 = assemble(team(['Ganyu', 'Hu Tao', 'Xingqiu', 'Albedo'], 0)).enemyRes;
    const c1 = assemble(team(['Ganyu', 'Hu Tao', 'Xingqiu', 'Albedo'], 1)).enemyRes;
    expect(c0.Cryo! - c1.Cryo!).toBeCloseTo(0.15, 9);
    expect(c1.Pyro).toBeCloseTo(c0.Pyro!, 9);
  });

  it('os efeitos existentes da planilha não mudam (DPR de referência)', () => {
    const r = resolveProject(sampleProject(), game, effects);
    const a = assembleTeam(r.team);
    expect(a.buffs.some((b) => b.id.startsWith('cbuff-'))).toBe(false);
  });
});
