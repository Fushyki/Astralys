import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseProject } from '../../src/engine';
import { energyMembers, energyResults, withEnergy, buildEnergyInput, FALLBACK_PARTICLES } from '../../src/features/energy/energyModel';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const characters = json<any[]>('src/data/generated/characters.json');
const particles = json<any[]>('src/effects/particles.json');

describe('tabela de partículas', () => {
  it('toda entrada tem personagem do Lunaris e fonte_info', () => {
    const names = new Set(characters.map((c) => c.name));
    for (const p of particles) {
      expect(names.has(p.character), p.character).toBe(true);
      expect(p.fonte_info.length).toBeGreaterThan(10);
      expect(p.particles).toBeGreaterThanOrEqual(0);
    }
  });

  it('cobre a equipe de referência', () => {
    for (const n of ['Mavuika', 'Citlali', 'Iansan', 'Bennett']) expect(particles.some((p) => p.character === n), n).toBe(true);
  });
});

describe('calculadora de recarga ligada ao projeto', () => {
  const project = sampleProject();
  const infos = energyMembers(project, characters, particles);

  it('usa o custo do Supremo do Lunaris e as partículas da tabela', () => {
    expect(infos.map((i) => i.member.burstCost)).toEqual([0, 60, 70, 60]);
    expect(infos[3].member.particles).toBeCloseTo(2.25, 6);
  });

  it('a Mavuika (sem custo de Supremo) é ignorada e os demais têm recarga necessária', () => {
    const r = energyResults(project, infos);
    expect(r[0].status).toBe('ignored');
    for (const x of r.slice(1)) expect(x.neededER).toBeGreaterThan(1);
  });

  it('personagem fora da tabela usa o padrão', () => {
    const odd = energyMembers(project, characters, []);
    expect(odd[0].member.particles).toBe(FALLBACK_PARTICLES);
    expect(odd[0].tableParticles).toBeUndefined();
  });

  it('configurar um personagem muda só o dele e sobrevive a salvar e ler', () => {
    const next = withEnergy(project, { slot: { name: 'Citlali', value: { flat: 20 } }, enemyParticles: 9 });
    const reread = parseProject(JSON.parse(JSON.stringify(next)));
    const before = energyResults(project, infos);
    const after = energyResults(reread, infos);
    expect(after[1].neededER).toBeLessThan(before[1].neededER);
    expect(after[2].neededER).toBeCloseTo(energyResults({ ...project, meta: { ...project.meta, energy: { enemyParticles: 9, margin: 'medium', slots: {} } } }, infos)[2].neededER, 9);
    expect(reread.meta.energy?.enemyParticles).toBe(9);
  });

  it('referências a quem saiu da equipe são descartadas', () => {
    const next = withEnergy(project, { slot: { name: 'Citlali', value: { onField: ['Citlali', 'Fantasma'], favTarget: 'Fantasma', favProcs: 2 } } });
    const input = buildEnergyInput(next, infos);
    expect(input.slots[1].onFieldReceivers).toEqual([1]);
    expect(input.slots[1].favTarget).toBeNull();
  });
});
