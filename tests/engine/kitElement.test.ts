import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, kitElement, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { defaultMember } from '../../src/features/rotation/teamOps';
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
const ch = (name: string) => game.characters.find((c) => c.name === name)!;

describe('elemento padrão dos golpes pelo kit', () => {
  it('ataque normal de arma física é Físico; habilidade e supremo têm o elemento do personagem', () => {
    const flins = ch('Flins');
    expect(kitElement(flins, { talent: 'normal', hitType: 'normal', label: '1-Hit DMG' })).toBe('Physical');
    expect(kitElement(flins, { talent: 'normal', hitType: 'charged', label: 'Charged Attack DMG' })).toBe('Physical');
    expect(kitElement(flins, { talent: 'normal', hitType: 'plunge', label: 'Plunge DMG' })).toBe('Physical');
    // os golpes de Ataque Normal feitos durante a habilidade são Electro
    expect(kitElement(flins, { talent: 'skill', hitType: 'normal', label: '1-Hit DMG' })).toBe('Electro');
    expect(kitElement(flins, { talent: 'skill', hitType: 'skill', label: 'Northland Spearstorm DMG' })).toBe('Electro');
    expect(kitElement(flins, { talent: 'burst', hitType: 'burst', label: 'Initial Skill DMG' })).toBe('Electro');
  });

  it('catalisador usa o elemento no ataque normal; arco só no tiro carregado completo', () => {
    expect(kitElement(ch('Nahida'), { talent: 'normal', hitType: 'normal', label: '1-Hit DMG' })).toBe('Dendro');
    const ganyu = ch('Ganyu');
    expect(kitElement(ganyu, { talent: 'normal', hitType: 'normal', label: '1-Hit DMG' })).toBe('Physical');
    expect(kitElement(ganyu, { talent: 'normal', hitType: 'charged', label: 'Aimed Shot' })).toBe('Physical');
    expect(kitElement(ganyu, { talent: 'normal', hitType: 'charged', label: 'Fully-Charged Aimed Shot' })).toBe('Cryo');
    expect(kitElement(ganyu, { talent: 'normal', hitType: 'normal', label: 'Frostflake Arrow DMG' })).toBe('Cryo');
  });

  it('a infusão do personagem troca o Físico dos ataques normais (e só deles)', () => {
    const hutao = ch('Hu Tao');
    expect(kitElement(hutao, { talent: 'normal', hitType: 'normal', label: '1-Hit DMG' }, 'Pyro')).toBe('Pyro');
    expect(kitElement(hutao, { talent: 'normal', hitType: 'plunge', label: 'Plunge DMG' }, 'Pyro')).toBe('Pyro');
    // arco não recebe infusão
    expect(kitElement(ch('Ganyu'), { talent: 'normal', hitType: 'normal', label: '1-Hit DMG' }, 'Pyro')).toBe('Physical');
  });
});

describe('o projeto usa o elemento do kit', () => {
  const build = (names: string[], mode: 'kit' | 'personagem', infusion?: 'Electro') => {
    const base = sampleProject();
    const members = names.map((n) => ({ ...defaultMember(n, game), gearManual: undefined, ...(n === names[0] && infusion ? { normalInfusion: infusion } : {}) }));
    const actions = (talent: 'normal' | 'skill', label: string, hitType: string, i: number) => ({
      id: `a${i}`, member: 0, move: { character: names[0], talent, label, variant: 0 }, executions: 1, reaction: 'none' as const,
      activeTags: [], tagSource: 'manual' as const, dmgAdjust: 0, time: i,
    });
    const first = game.moves.find((m) => m.character === names[0] && m.talent === 'normal' && m.hitType === 'normal')!;
    return { ...base, compat: 'none' as const, elementMode: mode, members, buffWindows: [], disabled: [], enabled: [], actions: [actions('normal', first.label, first.hitType, 0)] };
  };
  const elementOf = (p: ReturnType<typeof build>) => {
    const r = resolveProject(p, game, effects);
    const b = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
    return b.optimization.result.actions[0].element;
  };

  it('Flins: o primeiro golpe do ataque normal é Físico no modo kit e Electro no modo antigo', () => {
    expect(elementOf(build(['Flins'], 'kit'))).toBe('Physical');
    expect(elementOf(build(['Flins'], 'personagem'))).toBe('Electro');
    expect(elementOf(build(['Flins'], 'kit', 'Electro'))).toBe('Electro');
  });

  it('o gabarito da planilha não muda (modo planilha usa sempre o elemento do personagem)', () => {
    const p = sampleProject();
    const r = resolveProject(p, game, effects);
    expect(r.team.config.elementMode).toBe('character');
  });
});
