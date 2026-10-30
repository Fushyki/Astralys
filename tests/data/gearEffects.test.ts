import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

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

/** Projeto de exemplo sem o modo planilha, com os 4 membros trocados pelos pedidos. */
function project(members: { character: string; weapon?: string; primarySet?: string; secondarySet?: string; constellation?: number }[]) {
  const base = sampleProject();
  const p = {
    ...base,
    compat: undefined,
    members: members.map((m) => {
      const d = defaultMember(m.character, game);
      return { ...d, ...m, weapon: m.weapon ?? d.weapon };
    }),
    actions: [],
    buffWindows: [],
  };
  return resolveProject(p as never, game, effects);
}

describe('cobertura de efeitos', () => {
  it('todo personagem, arma de 4 e 5 estrelas e set de 4 e 5 estrelas tem efeito cadastrado', () => {
    const chars = new Set(effects.characters.map((c) => c.character));
    const weapons = new Set(effects.weapons.map((w) => w.weapon));
    const sets = new Set(effects.sets.map((s) => s.set));
    expect(game.characters.filter((c) => !chars.has(c.name)).map((c) => c.name)).toEqual([]);
    expect(game.weapons.filter((w) => w.rarity >= 4 && !weapons.has(w.name)).map((w) => w.name)).toEqual([]);
    expect(game.artifacts.filter((a) => a.rarity >= 4 && !sets.has(a.name)).map((a) => a.name)).toEqual([]);
  });

  it('o que não vira número diz o motivo: toda passiva e constelação cobre os 8 itens do personagem', () => {
    for (const c of effects.characters) {
      const srcs = new Set([...(c.notes ?? []).map((n) => n.src), ...(c.buffs ?? []).map((b) => (b.minConstellation ? `const${b.minConstellation}` : ''))]);
      expect(srcs.size, c.character).toBeGreaterThan(0);
    }
  });
});

describe('buffs de arma e set', () => {
  it('Emblem of Severed Fate: DMG do Supremo = 25% da Recarga, com teto de 75%', () => {
    const team = project([{ character: 'Mavuika', weapon: 'Dull Blade', primarySet: 'Emblem of Severed Fate' }]);
    const m = team.team.members[0];
    const b = m.characterEffect!.buffs.find((x) => x.id.endsWith('er-burst'))!;
    expect(b.convert).toMatchObject({ from: 'er', perPoint: 0.25, cap: 0.75, to: ['burst'] });
  });

  it('Jade Vista: Maestria por aliado do mesmo elemento e ATK por aliado de outro (os 3 outros membros)', () => {
    const r = project([
      { character: 'Tighnari', weapon: 'Jade Vista' }, { character: 'Nahida' }, { character: 'Xingqiu' }, { character: 'Zhongli' },
    ]);
    const buffs = r.team.members[0].characterEffect!.buffs.filter((b) => b.id.startsWith('arma:'));
    const em = buffs.find((b) => b.stats?.em)!;
    const atk = buffs.find((b) => b.stats?.atkPct)!;
    expect(em.stats!.em).toBeCloseTo(64, 6); // 1 aliado Dendro (Nahida) × 64 (R1)
    expect(atk.stats!.atkPct).toBeCloseTo(0.24, 6); // 2 aliados de outro elemento × 12%
  });

  it("Wanderer's Troupe só vale para Catalisador ou Arco", () => {
    const withTroupe = (character: string) => project([{ character, primarySet: "Wanderer's Troupe" }]).team.members[0].characterEffect?.buffs.some((b) => b.id.includes('carregado')) ?? false;
    expect(withTroupe('Nahida')).toBe(true); // Catalisador
    expect(withTroupe('Mavuika')).toBe(false); // Montante
  });

  it("Moonweaver's Dawn: o extra depende do custo de energia do Supremo", () => {
    const stat = (character: string, id: string) => project([{ character, weapon: "Moonweaver's Dawn" }]).team.members[0].characterEffect?.buffs.some((b) => b.id.endsWith(id)) ?? false;
    const cost = (n: string) => game.characters.find((c) => c.name === n)!.burst.energyCost!;
    const low = game.characters.find((c) => c.weapon === 'Sword' && (c.burst.energyCost ?? 99) <= 40)!;
    const mid = game.characters.find((c) => c.weapon === 'Sword' && cost(c.name) > 40 && cost(c.name) <= 60)!;
    expect(stat(low.name, 'e40')).toBe(true);
    expect(stat(mid.name, 'e40')).toBe(false);
    expect(stat(mid.name, 'e60')).toBe(true);
  });

  it('Cinnabar Spindle vira dano fixo de habilidade por DEF; Wavebreaker soma a energia do time', () => {
    const r = project([{ character: 'Qiqi', weapon: 'Cinnabar Spindle' }]);
    const f = r.flatEffects.find((e) => e.name.startsWith('Cinnabar Spindle'))!;
    expect(f).toMatchObject({ sourceStat: 'DEF', perPoint: 0.4, hitTypes: ['skill'] });
    const p = project([{ character: 'Xiangling', weapon: "Wavebreaker's Fin" }, { character: 'Bennett' }]);
    const b = p.team.members[0].characterEffect!.buffs.find((x) => x.id.endsWith('energia'))!;
    expect(b.convert).toMatchObject({ from: 'partyEnergy', cap: 0.4 });
  });
});

describe('mecânicas novas dos buffs', () => {
  it('redução de DEF de constelação soma ao cenário (Ayaka C4 -30%)', () => {
    // Debuff com duração: vira janela, o cenário fixo não muda.
    const none = assembleTeam(project([{ character: 'Kamisato Ayaka', constellation: 3 }]).team, {});
    const c4 = assembleTeam(project([{ character: 'Kamisato Ayaka', constellation: 4 }]).team, {});
    expect(c4.enemyDefRed).toBeCloseTo(none.enemyDefRed, 9);
    expect(c4.buffs.find((b) => b.id === 'cbuff-shred-0-c4')?.delta.defShred).toBeCloseTo(0.3, 6);
  });

  it('Ayato: Namisen é dano fixo por HP, e na C2 ganha o 5º stack', () => {
    const flat = (c: number) => project([{ character: 'Kamisato Ayato', constellation: c }]).flatEffects.filter((e) => e.name.includes('Namisen'));
    const c0 = flat(0);
    expect(c0).toHaveLength(1);
    expect(c0[0]).toMatchObject({ sourceStat: 'HP', hitTypes: ['normal'] });
    expect(flat(2)).toHaveLength(2);
  });

  it('Vodyanitsa C1: ATK fixo dos aliados = 0,8% do HP máximo dela', () => {
    const r = project([{ character: 'Vodyanitsa', constellation: 1 }, { character: 'Bennett' }]);
    const b = r.team.members[0].characterEffect!.buffs.find((x) => x.id === 'c1')!;
    expect(b.convert).toMatchObject({ from: 'hp', perPoint: 0.008, to: ['atkFlat'] });
    expect(b.scope).toBe('others');
  });

  it('modo planilha: os 4 personagens da planilha ficam sem passivas curadas (o gabarito não muda)', () => {
    const p = sampleProject();
    const r = resolveProject(p, game, effects);
    for (const m of r.team.members) expect(m.characterEffect?.buffs ?? []).toEqual([]);
  });
});
