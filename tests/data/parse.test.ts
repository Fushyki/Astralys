import { describe, it, expect } from 'vitest';
import {
  hitTypeFor,
  isDamageLabel,
  normalizeStat,
  parseDamageValue,
  parseSeconds,
} from '../../scripts/lib/parse';

const one = (raw: string) => {
  const p = parseDamageValue(raw);
  expect(p, `deveria interpretar "${raw}"`).not.toBeNull();
  return p!;
};

describe('parseDamageValue: formatos reais do Lunaris', () => {
  it('"80.04%" = 80,04% de ATK, 1 acerto', () => {
    const p = one('80.04%');
    expect(p.variants).toHaveLength(1);
    expect(p.variants[0].scale.atk).toBeCloseTo(0.8004, 6);
    expect(p.variants[0].hits).toBe(1);
  });

  it('"36.48% x2" soma os 2 acertos (como a coluna da planilha)', () => {
    const v = one('36.48% x2').variants[0];
    expect(v.scale.atk).toBeCloseTo(0.7296, 6);
    expect(v.hits).toBe(2);
  });

  it('"22.65%x3" (sem espaço) e "14.1%*4"', () => {
    expect(one('22.65%x3').variants[0]).toMatchObject({ hits: 3 });
    expect(one('22.65%x3').variants[0].scale.atk).toBeCloseTo(0.6795, 6);
    expect(one('14.1%*4').variants[0]).toMatchObject({ hits: 4 });
  });

  it('"110.5%+120.02%" = 2 acertos distintos somados (Bennett Carregado nv10 = 2,3052)', () => {
    const v = one('110.5%+120.02%').variants[0];
    expect(v.scale.atk).toBeCloseTo(2.3052, 6);
    expect(v.hits).toBe(2);
  });

  it('"14.78%+16.26%+19.22%" = 3 acertos', () => {
    const v = one('14.78%+16.26%+19.22%').variants[0];
    expect(v.hits).toBe(3);
    expect(v.scale.atk).toBeCloseTo(0.5026, 6);
  });

  it('escala mista num só acerto: "103.2% ATK+206.4% Elemental Mastery"', () => {
    const v = one('103.2% ATK+206.4% Elemental Mastery').variants[0];
    expect(v.hits).toBe(1);
    expect(v.scale.atk).toBeCloseTo(1.032, 6);
    expect(v.scale.em).toBeCloseTo(2.064, 6);
  });

  it('outros atributos: DEF, Max HP, EM', () => {
    expect(one('120% DEF').variants[0].scale).toMatchObject({ def: 1.2, atk: 0 });
    expect(one('12.8% Max HP').variants[0].scale.hp).toBeCloseTo(0.128, 6);
    expect(one('196.16% Elemental Mastery').variants[0].scale.em).toBeCloseTo(1.9616, 6);
  });

  it('parte fixa somada: "160% DEF+770"', () => {
    const v = one('160% DEF+770').variants[0];
    expect(v.scale.def).toBeCloseTo(1.6, 6);
    expect(v.scale.flat).toBe(770);
  });

  it('variantes baixa/alta: "127.84%/159.68%"', () => {
    const p = one('127.84%/159.68%');
    expect(p.variants).toHaveLength(2);
    expect(p.variants[0].scale.atk).toBeCloseTo(1.2784, 6);
    expect(p.variants[1].scale.atk).toBeCloseTo(1.5968, 6);
  });

  it('variantes com atributo só na última parte: "25.23%/43.26% Max HP"', () => {
    const p = one('25.23%/43.26% Max HP');
    expect(p.variants[0].scale.hp).toBeCloseTo(0.2523, 6);
    expect(p.variants[1].scale.hp).toBeCloseTo(0.4326, 6);
    expect(p.variants[0].scale.atk).toBe(0);
  });

  it('5 variantes (Yanfei): "98.23%/115.56%/132.9%/150.23%/167.57%"', () => {
    expect(one('98.23%/115.56%/132.9%/150.23%/167.57%').variants).toHaveLength(5);
  });

  it('grupo repetido: "(67.2% ATK+134.4% Elemental Mastery)x2"', () => {
    const v = one('(67.2% ATK+134.4% Elemental Mastery)x2').variants[0];
    expect(v.hits).toBe(2);
    expect(v.scale.atk).toBeCloseTo(1.344, 6);
    expect(v.scale.em).toBeCloseTo(2.688, 6);
  });

  it('multiplicador com atributo: "4.87% Max HP x3"', () => {
    const v = one('4.87% Max HP x3').variants[0];
    expect(v.hits).toBe(3);
    expect(v.scale.hp).toBeCloseTo(0.1461, 6);
  });

  it('multiplicador por termo: "93.6%x2+50.4%x2" = 4 acertos (Varka)', () => {
    const v = one('93.6%x2+50.4%x2').variants[0];
    expect(v.hits).toBe(4);
    expect(v.scale.atk).toBeCloseTo(2.88, 6);
  });

  it('qualificador com "/": "92% Elemental Mastery/Beacon"', () => {
    const p = one('92% Elemental Mastery/Beacon');
    expect(p.qualifier).toBe('Beacon');
    expect(p.variants[0].scale.em).toBeCloseTo(0.92, 6);
  });

  it('qualificadores por unidade: "each", "per Paw", "/Strike"', () => {
    expect(one('72% each').qualifier).toBe('each');
    expect(one('41.92% per Paw').qualifier).toBe('per Paw');
    expect(one('55.13%/Strike').qualifier).toBe('Strike');
    expect(one('72% each').variants[0].scale.atk).toBeCloseTo(0.72, 6);
  });

  // "0.4%/Point" e "1.6% ATK per Fighting Spirit" têm a mesma forma de "55.13%/Strike": quem os exclui é o RÓTULO (isDamageLabel), não o valor.
  it('rejeita o que não é dano reconhecível', () => {
    for (const raw of [
      '10s', '20/s', '2 Characters 22.32%', '24% Normal Attack DMG', '100.24% Cryo + 48.69% Physical',
      '', 'abc', '5/7',
    ]) {
      expect(parseDamageValue(raw), raw).toBeNull();
    }
  });
});

describe('isDamageLabel / hitTypeFor', () => {
  it('reconhece dano direto', () => {
    for (const l of ['Aimed Shot', 'Fully-Charged Aimed Shot', 'Level 1 Aimed Shot', 'Pyro DoT', 'Riptide Slash', 'Charged Attack', '1-Hit DMG', 'Skill DMG', 'Low/High Plunge DMG', 'Tri-Karma Purification DMG', 'Flamestrider Charged Attack Cyclic DMG'])
      expect(isDamageLabel(l), l).toBe(true);
  });

  it('exclui bônus, cura, duração, custo e recarga', () => {
    for (const l of [
      'Sunfell Slice DMG Bonus', 'Pyro: DMG Bonus', 'Dusk Bolt DMG Increase', 'DMG Absorption', 'Healing',
      'Charged Attack Stamina Cost', 'Inherited HP', 'Scorching Threshold', 'Bond of Life Gain', 'Mitigation', 'DMG Reduction', 'CD', 'Energy Cost', 'Base Duration', 'Tri-Karma Purification Trigger Interval',
    ])
      expect(isDamageLabel(l), l).toBe(false);
  });

  it('classifica o tipo de golpe', () => {
    expect(hitTypeFor('1-Hit DMG', 'normal')).toBe('normal');
    expect(hitTypeFor('Charged Attack DMG', 'normal')).toBe('charged');
    expect(hitTypeFor('Plunge DMG', 'normal')).toBe('plunge');
    expect(hitTypeFor('Fully-Charged Aimed Shot', 'normal')).toBe('charged');
    expect(hitTypeFor('Pyro DoT', 'burst')).toBe('burst');
    expect(hitTypeFor('Swift Stormflight DMG', 'normal')).toBe('normal');
    expect(hitTypeFor('Skill DMG', 'skill')).toBe('skill');
    expect(hitTypeFor('Charge Level 1 DMG', 'skill')).toBe('skill');
    expect(hitTypeFor('Skill DMG', 'burst')).toBe('burst');
    // Normais "dentro" da Habilidade (Mavuika em Flamestrider) contam como Normal
    expect(hitTypeFor('Flamestrider Normal Attack 1-Hit DMG', 'skill')).toBe('normal');
    expect(hitTypeFor('Flamestrider Charged Attack Cyclic DMG', 'skill')).toBe('charged');
    expect(hitTypeFor('Flamestrider Plunge DMG', 'skill')).toBe('plunge');
  });
});

describe('parseSeconds / normalizeStat', () => {
  it('segundos simples', () => {
    expect(parseSeconds('12s')).toBe(12);
    expect(parseSeconds('0.30000001192092896s')).toBeCloseTo(0.3, 6);
    expect(parseSeconds('5/7.5/10s')).toBeNull();
    expect(parseSeconds('Max 6s')).toBeNull();
  });

  it('stats de ascensão em fração', () => {
    expect(normalizeStat('CRIT DMG%', 38.4)).toEqual({ stat: 'CD', value: 0.384 });
    expect(normalizeStat('CRIT Rate%', 11)).toEqual({ stat: 'CR', value: 0.11 });
    expect(normalizeStat('Elemental Mastery', 115)).toEqual({ stat: 'EM', value: 115 });
    expect(normalizeStat('Pyro DMG Bonus%', 28.8)?.stat).toBe('Pyro%');
    expect(normalizeStat('Physical DMG Bonus%', 25)?.stat).toBe('Physical%');
    expect(normalizeStat('atk', 359)).toBeNull();
  });
});
