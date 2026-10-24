import { describe, expect, it } from 'vitest';
import { calculateEnergy, statusOf, type EnergyMember, type EnergySlot } from '../../src/engine';

const slot = (p: Partial<EnergySlot> = {}): EnergySlot => ({ skillUses: 0, onFieldReceivers: [], favProcs: 0, favTarget: null, flat: 0, fieldTime: 0.15, useBurst: true, ...p });
const m = (name: string, element: EnergyMember['element'], burstCost: number, particles: number): EnergyMember => ({ name, element, burstCost, particles });

describe('recarga de energia: absorção de partículas', () => {
  const pyro = [m('Bennett', 'Pyro', 60, 2.25), m('Xiangling', 'Pyro', 80, 3), m('Xingqiu', 'Hydro', 80, 5)];

  it('mesmo elemento: ×3 em campo e ×1,8 fora', () => {
    const r = calculateEnergy({ members: pyro, enemyParticles: 0, slots: [slot({ skillUses: 1, onFieldReceivers: [0] }), slot(), slot()] });
    expect(r[0].baseFromSkills).toBeCloseTo(2.25 * 3, 6);
    expect(r[1].baseFromSkills).toBeCloseTo(2.25 * 1.8, 6);
  });

  it('elemento diferente: ×1 em campo e ×0,6 fora', () => {
    const r = calculateEnergy({ members: pyro, enemyParticles: 0, slots: [slot({ skillUses: 1, onFieldReceivers: [2] }), slot(), slot()] });
    expect(r[2].baseFromSkills).toBeCloseTo(2.25 * 1.0, 6);
    expect(r[1].baseFromSkills).toBeCloseTo(2.25 * 1.8, 6); // mesmo elemento, fora de campo
  });

  it('dividir entre dois em campo reparte metade para cada', () => {
    const r = calculateEnergy({ members: pyro, enemyParticles: 0, slots: [slot({ skillUses: 2, onFieldReceivers: [1, 2] }), slot(), slot()] });
    expect(r[1].baseFromSkills).toBeCloseTo(2 * 2.25 * (0.5 * 3 + 0.5 * 1.8), 6);
    expect(r[2].baseFromSkills).toBeCloseTo(2 * 2.25 * (0.5 * 1 + 0.5 * 0.6), 6);
  });

  it('partículas de inimigos são neutras: ×2 em campo, ×1,2 fora', () => {
    const r = calculateEnergy({ members: pyro, enemyParticles: 6, slots: [slot({ fieldTime: 1 }), slot({ fieldTime: 0 }), slot({ fieldTime: 0.5 })] });
    expect(r[0].baseFromEnemies).toBeCloseTo(12, 6);
    expect(r[1].baseFromEnemies).toBeCloseTo(7.2, 6);
    expect(r[2].baseFromEnemies).toBeCloseTo(6 * (0.5 * 2 + 0.5 * 1.2), 6);
  });

  it('Favonius: 3 partículas neutras por ativação, ×2 só para quem está em campo', () => {
    const r = calculateEnergy({ members: pyro, enemyParticles: 0, slots: [slot({ favProcs: 2, favTarget: 1 }), slot(), slot()] });
    expect(r[1].baseFromFavonius).toBeCloseTo(2 * 3 * 2, 6);
    expect(r[0].baseFromFavonius).toBeCloseTo(2 * 3 * 1.2, 6);
  });

  it('o personagem pode ter partículas por uso diferentes do padrão', () => {
    const r = calculateEnergy({ members: pyro, enemyParticles: 0, slots: [slot({ skillUses: 1, particlesOverride: 3, onFieldReceivers: [0] }), slot(), slot()] });
    expect(r[0].baseFromSkills).toBeCloseTo(9, 6);
  });
});

describe('recarga de energia: necessária, folga e faixas', () => {
  const members = [m('A', 'Cryo', 60, 5)];
  const base = (s: Partial<EnergySlot>) => calculateEnergy({ members, enemyParticles: 0, slots: [slot({ skillUses: 1, onFieldReceivers: [0], ...s })] })[0];

  it('custo ÷ energia por partículas, e a folga de 15%', () => {
    const r = base({}); // 5 × 3 = 15 de energia base
    expect(r.neededER).toBeCloseTo(60 / 15, 6);
    expect(r.safeER).toBeCloseTo((60 / 15) * 1.15, 6);
  });

  it('energia fixa abate do custo; nunca fica abaixo de 100%', () => {
    expect(base({ flat: 30 }).neededER).toBeCloseTo(30 / 15, 6);
    expect(base({ flat: 60 }).neededER).toBe(1);
    expect(base({ skillUses: 10 }).neededER).toBe(1);
  });

  it('quem não usa o Supremo (ou custa 0) é ignorado', () => {
    expect(base({ useBurst: false }).status).toBe('ignored');
    const free = calculateEnergy({ members: [m('Mavuika', 'Pyro', 0, 5)], enemyParticles: 0, slots: [slot({ skillUses: 1 })] })[0];
    expect(free.status).toBe('ignored');
    expect(free.neededER).toBe(1);
  });

  it('sem nenhuma partícula a recarga fica em 100% (evita dividir por zero)', () => {
    const r = calculateEnergy({ members, enemyParticles: 0, slots: [slot({ skillUses: 0 })] })[0];
    expect(r.neededER).toBe(1);
  });

  it('faixas: <135% confortável, 135–175 equilibrada, 175–215 alta, ≥215 crítica', () => {
    expect([1.0, 1.34, 1.35, 1.74, 1.75, 2.14, 2.15, 3].map(statusOf)).toEqual([
      'comfortable', 'comfortable', 'balanced', 'balanced', 'high', 'high', 'critical', 'critical',
    ]);
  });
});

describe('recarga de energia: cenário Mavuika (paridade com o app anterior)', () => {
  // Mavuika não usa Supremo e passa as partículas, divididas, a Iansan e Bennett; os demais ficam em campo por si.
  const members = [m('Mavuika', 'Pyro', 0, 5), m('Citlali', 'Cryo', 60, 5), m('Iansan', 'Electro', 70, 4), m('Bennett', 'Pyro', 60, 2.25)];
  const slots = [
    slot({ skillUses: 1, onFieldReceivers: [2, 3], fieldTime: 0.5, useBurst: false }),
    slot({ skillUses: 1, onFieldReceivers: [1], fieldTime: 0.15 }),
    slot({ skillUses: 1, onFieldReceivers: [2], fieldTime: 0.15, flat: 12 }),
    slot({ skillUses: 1, onFieldReceivers: [3], fieldTime: 0.2 }),
  ];
  const r = calculateEnergy({ members, slots, enemyParticles: 6 });

  it('reproduz os valores que o app anterior mostrava (202,2% / 205,2% / 185,7%)', () => {
    expect(r[1].neededER * 100).toBeCloseTo(202.2, 1);
    expect(r[2].neededER * 100).toBeCloseTo(205.2, 1);
    expect(r[3].neededER * 100).toBeCloseTo(185.7, 1);
    expect(r[0].status).toBe('ignored');
  });

  it('energia base por partículas confere (29,7 / 28,3 / 32,3)', () => {
    expect(r[1].totalBase).toBeCloseTo(29.7, 1);
    expect(r[2].totalBase).toBeCloseTo(28.3, 1);
    expect(r[3].totalBase).toBeCloseTo(32.3, 1);
  });
});

describe('Raiden Shogun no time', () => {
  it('dá 24 de energia fixa aos aliados (e não a si mesma)', () => {
    const team = [m('Raiden Shogun', 'Electro', 90, 3), m('Aliado', 'Electro', 80, 3)];
    const [raiden, ally] = calculateEnergy({ members: team, enemyParticles: 6, slots: [slot({ skillUses: 1, onFieldReceivers: [0] }), slot({ skillUses: 1, onFieldReceivers: [1] })] });
    expect(raiden.teamFlat).toBe(0);
    expect(ally.teamFlat).toBe(24);
    expect(ally.flatEnergy).toBe(24);
  });
});
