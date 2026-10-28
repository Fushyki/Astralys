import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { buildCardModel, hitTypeLookup } from '../../src/features/card/cardModel';
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

const model = (mutate?: (p: ReturnType<typeof sampleProject>) => void) => {
  const p = sampleProject();
  mutate?.(p);
  const resolved = resolveProject(p, game, effects);
  const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });
  return buildCardModel(p, bundle, game.characters, hitTypeLookup(resolved));
};

describe('modelo do card infográfico', () => {
  const m = model();

  it('traz os números da rotação de referência', () => {
    expect(m.dpr).toBeCloseTo(3790496.07, 1);
    expect(m.dps).toBeCloseTo(216599.78, 1);
    expect(m.duration).toBe(17.5);
  });

  it('um membro por personagem, com a participação somando 100%', () => {
    expect(m.members.map((x) => x.name)).toEqual(['Mavuika', 'Citlali', 'Iansan', 'Bennett']);
    expect(m.members.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 6);
    expect(m.members[0].share).toBeCloseTo(0.9527, 3);
  });

  it('build: arma, sets, main stats abreviados e ER final', () => {
    const mav = m.members[0];
    expect(mav.weapon).toBe('A Thousand Blazing Suns');
    expect(mav.sets).toContain('Obsidian Codex');
    expect(mav.mains).toBe('EM / DMG / CD');
    expect(mav.er).toBeCloseTo(1.11, 2);
    expect(mav.element).toBe('Pyro');
    expect(mav.icon).toMatch(/Mavuika/);
  });

  it('a sequência agrupa os golpes por personagem na ordem do tempo', () => {
    expect(m.sequence.startsWith('Citlali')).toBe(true);
    expect(m.sequence).toContain('Mavuika');
    expect(m.sequence.split(' · ').length).toBeGreaterThanOrEqual(4);
  });

  it('repetições seguidas viram ×N', () => {
    expect(m.sequence).toMatch(/×\d/);
  });

  it('usa o título e o selo do projeto quando existem', () => {
    const c = model((p) => { p.meta.card = { title: 'Meu card', badge: 'F2P', tag: 'Meta 7.1' }; });
    expect([c.title, c.badge, c.tag]).toEqual(['Meu card', 'F2P', 'Meta 7.1']);
    expect(m.title).toBe(sampleProject().name);
    expect(m.tag).toBe('');
  });
});

describe('modelo do card para compartilhar', () => {
  const m = model();

  it('rotação: uma faixa por personagem, com os 24 golpes de 0 a 1, os Supremos marcados e o maior com peso 1', () => {
    expect(m.lanes.map((l) => l.member)).toEqual([0, 1, 2, 3]);
    const hits = m.lanes.flatMap((l) => l.hits);
    expect(hits).toHaveLength(24);
    expect(hits.every((h) => h.at >= 0 && h.at <= 1 && h.weight > 0 && h.weight <= 1)).toBe(true);
    expect(hits.filter((h) => h.burst).length).toBeGreaterThanOrEqual(4);
    expect(Math.max(...hits.map((h) => h.weight))).toBe(1);
    // cada golpe está na faixa do próprio personagem
    expect(m.lanes.every((l) => l.hits.every((h) => h.member === l.member))).toBe(true);
  });

  it('golpe contínuo vira UMA entrada (início, fim e execuções) e reação lançada à mão não entra', () => {
    const c = model((p) => {
      const mav = p.actions.filter((x) => x.member === 0).slice(0, 3);
      mav.forEach((x, i) => { x.chainId = 'c9'; x.time = 2 + i; });
      p.chains = { ...p.chains, c9: { every: 1, until: 4 } };
      p.actions.push({ ...p.actions[0], id: 'rx', move: { character: 'Mavuika', talent: 'reaction', label: 'overloaded', variant: 0 }, time: 5 });
    });
    const hits = c.lanes.flatMap((l) => l.hits);
    expect(hits).toHaveLength(24 - 3 + 1); // 3 execuções viram 1; a reação some
    const chain = c.lanes[0].hits.find((h) => h.count === 3)!;
    expect(chain.ticks).toHaveLength(3);
    expect(chain.to!).toBeGreaterThan(chain.at);
    expect(c.sequence).toMatch(/×3/);
  });

  it('reação principal, cor de destaque padrão e cores por membro (o 2º Pyro é mais escuro)', () => {
    expect(m.reaction?.name).toBe('Derreter');
    expect(m.reaction?.fraction).toBeCloseTo(0.553, 2);
    expect(m.accent).toBe('#e9c46a');
    expect(m.nick).toBe('');
    expect(m.members[0].color).toBe('#f08a5d');
    expect(m.members[3].color).not.toBe(m.members[0].color);
  });

  it('apelido e cor vêm das preferências do projeto', () => {
    const c = model((p) => { p.meta.card = { nick: ' Davi ', accent: '#8fd3e8' }; });
    expect(c.nick).toBe('Davi');
    expect(c.accent).toBe('#8fd3e8');
  });
});
