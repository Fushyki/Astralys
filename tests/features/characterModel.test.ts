import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, analyzeProject, damageTable, effectiveTalents, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { characterReactions, cleanMoveName, memberBuffCards, moveGroups, reactionOptions, receivedBuffs } from '../../src/features/character/characterModel';
import { sampleProject } from '../../src/features/rotation/persistence';

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

const project = sampleProject();
const resolved = resolveProject(project, game, effects);
const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });
const elements = resolved.team.members.map((m) => m.character.element);

describe('tabela de dano sem nomes repetidos', () => {
  const assembly = assembleTeam(resolved.team);
  const rows = damageTable({ team: resolved.team, assembly, rolls: bundle.optimization.rolls, member: 0, moves: game.moves, reaction: 'none', ampCoefficient: resolved.ampCoefficient });
  const groups = moveGroups(rows, effectiveTalents(project.members[0].talents, 0, resolved.team.members[0].character));

  it('limpa o prefixo "Dano de/do" dos nomes em português', () => {
    expect(cleanMoveName('Dano do 1° Golpe')).toBe('1° golpe');
    expect(cleanMoveName('Dano de Ataque Carregado')).toBe('Ataque carregado');
    expect(cleanMoveName('Ring of Searing')).toBe('Ring of Searing');
  });

  it('nenhum nome se repete dentro do personagem', () => {
    const names = groups.flatMap((g) => g.lines.map((l) => l.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('as quedas de baixa e alta altitude viram duas linhas distintas', () => {
    const names = groups.flatMap((g) => g.lines.map((l) => l.name));
    expect(names.some((n) => /baixa altitude/.test(n))).toBe(true);
    expect(names.some((n) => /alta altitude/.test(n))).toBe(true);
  });

  it('um grupo por talento, com o nível efetivo', () => {
    expect(groups.map((g) => g.title)).toEqual(['Ataque normal', 'Habilidade', 'Supremo']);
    expect(groups.every((g) => g.level === 10)).toBe(true);
  });
});

describe('reações possíveis com os elementos do time', () => {
  it('Pyro com Cryo no time: Derreter; sem Hydro, nada de Vaporizar', () => {
    expect(reactionOptions('Pyro', elements)).toEqual(['none', 'melt']);
    expect(reactionOptions('Cryo', elements)).toEqual(['none', 'melt']);
  });
  it('Electro sem Dendro no time não tem reação amplificadora nem aditiva', () => {
    expect(reactionOptions('Electro', elements)).toEqual(['none']);
  });
  it('casos de Hydro, Dendro e Electro com parceiros', () => {
    expect(reactionOptions('Hydro', ['Hydro', 'Pyro'])).toEqual(['none', 'vaporize']);
    expect(reactionOptions('Pyro', ['Pyro', 'Hydro', 'Cryo'])).toEqual(['none', 'melt', 'vaporize']);
    expect(reactionOptions('Dendro', ['Dendro', 'Electro'])).toEqual(['none', 'spread']);
    expect(reactionOptions('Electro', ['Electro', 'Dendro'])).toEqual(['none', 'aggravate']);
    expect(reactionOptions(undefined, [])).toEqual(['none']);
  });
});

describe('reações que o personagem dispara', () => {
  const stats = bundle.memberStats[0];
  const enemy = { level: 100, res: assembleTeam(resolved.team).enemyRes, defRed: 0 };
  const list = characterReactions({ element: 'Pyro', teamElements: elements, em: stats.em, characterLevel: 90, enemy });

  it('a Mavuika dispara Derreter (amplificadora) com o multiplicador do motor', () => {
    const melt = list.find((r) => r.id === 'melt')!;
    expect(melt.kind).toBe('amplificadora');
    // ×2 do Derreter Pyro × (1 + 25/9 × EM/(EM+1400)), EM 424
    expect(melt.value.amount).toBeCloseTo(2 * (1 + (25 / 9) * (stats.em / (stats.em + 1400))), 6);
  });

  it('com Electro no time dispara Sobrecarga (transformativa) e não Supercondutor', () => {
    expect(list.some((r) => r.id === 'overloaded' && r.kind === 'transformativa' && r.value.amount > 0)).toBe(true);
    expect(list.some((r) => r.id === 'superconduct')).toBe(false);
  });

  it('só entram reações cujo conjunto de elementos o time tem', () => {
    const noElectro = characterReactions({ element: 'Pyro', teamElements: ['Pyro', 'Cryo'], em: 100, characterLevel: 90, enemy });
    expect(noElectro.some((r) => r.id === 'overloaded')).toBe(false);
  });
});

describe('buffs recebidos', () => {
  const list = receivedBuffs(project, resolved, bundle, 0);

  it('lista os buffs de equipe que atingem a Mavuika, do mais valioso ao menos', () => {
    expect(list.length).toBeGreaterThan(4);
    const shares = list.map((b) => b.share ?? -1);
    for (let i = 1; i < shares.length; i++) expect(shares[i - 1]).toBeGreaterThanOrEqual(shares[i]);
  });

  it('o ATK fixo do Bennett responde por ~22% do dano da Mavuika (21,8% na planilha)', () => {
    const flat = list.find((b) => b.id === 'flat-atk-3')!;
    expect(flat.giverName).toBe('Bennett');
    expect(flat.share!).toBeGreaterThan(0.15);
    expect(flat.share!).toBeLessThan(0.3);
    expect(flat.value).toMatch(/ATK fixo/);
  });

  it('buffs sem origem confirmada vêm marcados', () => {
    expect(list.some((b) => b.needsConfirmation)).toBe(true);
  });

  it('um buff desligado continua na lista, sem participação calculada', () => {
    const off = receivedBuffs({ ...project, disabled: ['flat-atk-3'] }, resolveProject({ ...project, disabled: ['flat-atk-3'] }, game, effects), bundle, 0);
    const flat = off.find((b) => b.id === 'flat-atk-3')!;
    expect(flat.active).toBe(false);
    expect(flat.share).toBeNull();
  });

  it('sem janelas (perfis da planilha) a janela aparece como "sem janela"', () => {
    expect(list.every((b) => typeof b.window === 'string')).toBe(true);
  });
});

describe('buffs ligados e desligados por personagem', () => {
  const names = resolved.team.members.map((m) => m.character.name);

  it('desligar `<buff>@<Nome>` tira o buff só desse personagem', () => {
    const off = assembleTeam({ ...resolved.team, disabled: [`gear-1@${names[2]}`] });
    const base = assembleTeam(resolved.team);
    const gearOf = (a: typeof base) => a.buffs.find((b) => b.id === 'gear-1');
    expect(gearOf(base)?.targets).toBe('all');
    const targets = gearOf(off)?.targets as string[];
    expect(targets).toEqual(names.filter((n) => n !== names[2]));
  });

  it('se todos os que recebem desligam, o buff some', () => {
    const disabled = names.map((n) => `gear-1@${n}`);
    expect(assembleTeam({ ...resolved.team, disabled }).buffs.some((b) => b.id === 'gear-1')).toBe(false);
  });

  it('a lista da Equipe traz equipamento, ressonância e buffs de aliados, cada um com o interruptor certo', () => {
    const cards = memberBuffCards(project, resolved, bundle, 0);
    expect(cards.some((c) => c.tag === 'Arma')).toBe(true);
    expect(cards.some((c) => c.tag === 'Set · 4 peças')).toBe(true);
    expect(cards.some((c) => c.tag === 'Ressonância')).toBe(true);
    const bennett = cards.find((c) => c.id === 'flat-atk-3')!;
    expect(bennett.toggleId).toBe(`flat-atk-3@${names[0]}`);
    expect(bennett.giverName).toBe('Bennett');
    // equipamento dele é de uma fonte própria (vale só para ele)
    expect(cards.find((c) => c.tag === 'Arma')!.toggleId).toMatch(/^m0:/);
  });

  it('desligar só para um personagem não desliga para os outros e baixa o dano dele', () => {
    const disabled = [`flat-atk-3@${names[0]}`];
    const p2 = { ...project, disabled };
    const r2 = resolveProject(p2, game, effects);
    const b2 = analyzeProject({ team: r2.team, actions: r2.actions, flatEffects: r2.flatEffects, ampCoefficient: r2.ampCoefficient });
    expect(b2.optimization.result.members[0].avg).toBeLessThan(bundle.optimization.result.members[0].avg);
    const mine = memberBuffCards(p2, r2, b2, 0).find((c) => c.id === 'flat-atk-3')!;
    expect(mine.active).toBe(false);
    const other = memberBuffCards(p2, r2, b2, 1).find((c) => c.id === 'flat-atk-3');
    expect(other?.active ?? true).toBe(true);
  });
});
