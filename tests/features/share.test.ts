import { describe, expect, it } from 'vitest';
import { sampleProject } from '../../src/features/rotation/persistence';
import { applyShare, buildShare, parseShare, projectFromShare, remapMemberId } from '../../src/features/rotation/share';

describe('compartilhar rotação por arquivo', () => {
  it('só a rotação vai no arquivo quando é o que se pede, e sobrevive a JSON', () => {
    const p = sampleProject();
    const file = buildShare(p, ['rotation']);
    expect(file.team).toBeUndefined();
    expect(file.scenario).toBeUndefined();
    expect(file.rotation!.actions).toHaveLength(p.actions.length);
    expect(parseShare(JSON.parse(JSON.stringify(file)))).not.toBeNull();
    expect(parseShare({ schemaVersion: 1 })).toBeNull();
  });

  it('aplica em um time com os personagens em outra ordem (índices pelo nome)', () => {
    const p = sampleProject();
    const file = buildShare(p, ['rotation']);
    const reversed = { ...p, members: [...p.members].reverse(), actions: [], buffWindows: [], chains: {} };
    const r = applyShare(reversed, file, ['rotation']);
    expect(r.project.actions).toHaveLength(p.actions.length);
    for (const a of r.project.actions) expect(r.project.members[a.member].character).toBe(a.move.character);
    expect(r.warnings).toEqual([]);
  });

  it('personagem que não está no time fica de fora e avisa', () => {
    const p = sampleProject();
    const file = buildShare(p, ['rotation']);
    const smaller = { ...p, members: p.members.slice(0, 2), actions: [], buffWindows: [], chains: {} };
    const r = applyShare(smaller, file, ['rotation']);
    expect(r.project.actions.every((a) => a.member < 2)).toBe(true);
    expect(r.warnings.join(' ')).toMatch(/não está neste time/);
  });

  it('arquivo com a equipe vira um time novo; sem a equipe, avisa', () => {
    const p = sampleProject();
    const full = projectFromShare(buildShare(p, ['rotation', 'scenario', 'team']), sampleProject());
    expect(full.project.members.map((m) => m.character)).toEqual(p.members.map((m) => m.character));
    expect(full.project.actions).toHaveLength(p.actions.length);
    expect(full.project.id).not.toBe(p.id);
    expect(() => projectFromShare(buildShare(p, ['rotation']), sampleProject())).toThrow(/só tem a rotação/);
  });

  it('remapMemberId troca o índice nas formas de id com membro', () => {
    const map = new Map([[0, 2], [1, 0]]);
    expect(remapMemberId('gear:0', map)).toBe('gear:2');
    expect(remapMemberId('m1:weapon', map)).toBe('m0:weapon');
    expect(remapMemberId('cbuff-0-c1', map)).toBe('cbuff-2-c1');
    expect(remapMemberId('cbuff-res-1-a4', map)).toBe('cbuff-res-0-a4');
    expect(remapMemberId('set-res-shred-1', map)).toBe('set-res-shred-0');
    expect(remapMemberId('gear:3', map)).toBeNull();
    expect(remapMemberId('label:Bennett', map)).toBe('label:Bennett');
    expect(remapMemberId('resonance-pyro', map)).toBe('resonance-pyro');
  });
});
