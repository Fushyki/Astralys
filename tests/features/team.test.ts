import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RotationProjectSchema, analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import * as ops from '../../src/features/rotation/projectOps';
import * as team from '../../src/features/rotation/teamOps';

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
const analyze = (p: ReturnType<typeof sampleProject>) => {
  const r = resolveProject(p, game, effects);
  return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
};

describe('remapTag', () => {
  it('reindexa só etiquetas de membro, depois do removido', () => {
    expect(team.remapTag('gear:3', 1)).toBe('gear:2');
    expect(team.remapTag('char:0', 1)).toBe('char:0');
    expect(team.remapTag('gear:1', 1)).toBeNull();
    expect(team.remapTag('label:Scroll', 1)).toBe('label:Scroll');
  });
});

describe('remover membro', () => {
  const p = ops.windowsFromProfiles(sampleProject());
  const removed = team.removeMember(p, 1); // tira a Citlali

  it('tira o membro, as ações dele e reindexa os seguintes', () => {
    expect(removed.members.map((m) => m.character)).toEqual(['Mavuika', 'Iansan', 'Bennett']);
    expect(removed.actions.every((a) => a.move.character === removed.members[a.member].character)).toBe(true);
    expect(removed.actions.length).toBe(p.actions.length - 4);
  });

  it('janelas e etiquetas acompanham o novo índice; as da Citlali somem', () => {
    const tags = removed.buffWindows.map((w) => w.tag);
    const had = (tag: string) => p.buffWindows.find((w) => w.tag === tag)!;
    // A Citlali (membro 1) tinha 'gear:1'; essa janela some, e nenhuma etiqueta antiga dela sobra
    expect(p.buffWindows.some((w) => w.tag === 'gear:1')).toBe(true);
    expect(tags).not.toContain('gear:3'); // o Bennett agora é o membro 2
    expect(removed.buffWindows.length).toBe(p.buffWindows.filter((w) => !['gear:1', 'char:1'].includes(w.tag)).length);
    // O 'gear:3' do Bennett virou 'gear:2' com os mesmos tempos; o 'char:2' da Iansan virou 'char:1'
    const bennett = removed.buffWindows.find((w) => w.tag === 'gear:2')!;
    expect([bennett.start, bennett.end]).toEqual([had('gear:3').start, had('gear:3').end]);
    const iansan = removed.buffWindows.find((w) => w.tag === 'char:1')!;
    expect([iansan.start, iansan.end]).toEqual([had('char:2').start, had('char:2').end]);
    // Nenhuma ação aponta para um membro que não existe mais
    const names = removed.members.length;
    const allActionTags = removed.actions.flatMap((a) => a.activeTags);
    expect(allActionTags.every((t) => !/^(gear|char):(\d+)$/.test(t) || Number(t.split(':')[1]) < names)).toBe(true);
  });

  it('o projeto continua válido e calculável', () => {
    expect(RotationProjectSchema.safeParse(JSON.parse(JSON.stringify(removed))).success).toBe(true);
    expect(analyze(removed).optimization.result.totals.avg).toBeGreaterThan(0);
  });

  it('não remove o último membro nem índice inexistente; não muta o original', () => {
    const solo = team.removeMember(team.removeMember(team.removeMember(sampleProject(), 3), 2), 1);
    expect(solo.members).toHaveLength(1);
    expect(team.removeMember(solo, 0)).toBe(solo);
    expect(team.removeMember(p, 9)).toBe(p);
    const frozen = JSON.stringify(p);
    team.removeMember(p, 0);
    expect(JSON.stringify(p)).toBe(frozen);
  });
});

describe('trocar e adicionar membros', () => {
  it('trocar descarta as ações da vaga e mantém as janelas', () => {
    const p = ops.windowsFromProfiles(sampleProject());
    const ref = team.defaultMember('Kamisato Ayaka', game);
    const swapped = team.replaceMember(p, 1, ref);
    expect(swapped.members[1].character).toBe('Kamisato Ayaka');
    expect(swapped.actions.some((a) => a.member === 1)).toBe(false);
    expect(swapped.buffWindows).toEqual(p.buffWindows);
    expect(RotationProjectSchema.safeParse(JSON.parse(JSON.stringify(swapped))).success).toBe(true);
    expect(analyze(swapped).memberStats[1].atk).toBeGreaterThan(0);
  });

  it('não deixa repetir personagem na equipe', () => {
    const p = sampleProject();
    expect(team.replaceMember(p, 1, team.defaultMember('Mavuika', game))).toBe(p);
    expect(team.addMember(p, team.defaultMember('Mavuika', game))).toBe(p);
  });

  it('a equipe tem no máximo 4 membros; com vaga livre, adiciona', () => {
    const p = sampleProject();
    expect(team.addMember(p, team.defaultMember('Kamisato Ayaka', game))).toBe(p); // já tem 4
    const three = team.removeMember(p, 3);
    const four = team.addMember(three, team.defaultMember('Kamisato Ayaka', game));
    expect(four.members).toHaveLength(4);
  });

  it('um membro novo sem ações já aparece com stats', () => {
    const three = team.removeMember(sampleProject(), 3);
    const four = team.addMember(three, team.defaultMember('Kamisato Ayaka', game));
    const b = analyze(four);
    expect(b.memberStats[3].atk).toBeGreaterThan(1000);
    expect(b.crit[3]).toBeNull();
  });
});

describe('membro por defeito', () => {
  it('escolhe a melhor arma do tipo certo e mains razoáveis', () => {
    const ref = team.defaultMember('Kamisato Ayaka', game);
    const ayaka = game.characters.find((c) => c.name === 'Kamisato Ayaka')!;
    const weapon = game.weapons.find((w) => w.name === ref.weapon)!;
    expect(weapon.type).toBe(ayaka.weapon);
    expect(weapon.rarity).toBe(5);
    expect(ref.talents).toEqual({ normal: 10, skill: 10, burst: 10 });
    expect(ref.manualRolls).toBeUndefined();
  });

  it('armas sugeridas vêm ordenadas da mais forte para a mais fraca', () => {
    const ayaka = game.characters.find((c) => c.name === 'Kamisato Ayaka')!;
    const list = team.weaponsFor(ayaka, game.weapons);
    expect(list.every((w) => w.type === ayaka.weapon)).toBe(true);
    for (let i = 1; i < list.length; i++) expect(list[i - 1].rarity).toBeGreaterThanOrEqual(list[i].rarity);
  });

  it('personagem inexistente gera erro claro', () => {
    expect(() => team.defaultMember('Ninguém', game)).toThrow(/Ninguém/);
  });
});

describe('rolls manuais na equipe', () => {
  it('passar para manual, editar um roll e voltar ao automático', () => {
    let p = sampleProject();
    const start = analyze(p).optimization.rolls[0];
    p = team.useManualRolls(p, 0, start);
    expect(p.members[0].manualRolls).toEqual(start);
    p = team.setManualRoll(p, 0, 'CD', 12);
    expect(p.members[0].manualRolls!.CD).toBe(12);
    p = team.setManualRoll(p, 0, 'CD', -5);
    expect(p.members[0].manualRolls!.CD).toBe(0);
    p = team.setManualRoll(p, 0, 'CD', 999);
    expect(p.members[0].manualRolls!.CD).toBe(60);
    p = team.useAutoRolls(p, 0);
    expect(p.members[0].manualRolls).toBeUndefined();
  });

  it('editar roll sem estar em modo manual não faz nada', () => {
    const p = sampleProject();
    expect(team.setManualRoll(p, 0, 'CD', 5)).toBe(p);
    expect(team.useAutoRolls(p, 0)).toBe(p);
  });
});

describe('editar um membro', () => {
  it('trocar a arma muda o ATK e o dano (arma com efeito cadastrado)', () => {
    const p = sampleProject();
    const before = analyze(p);
    const q = team.updateMember(p, 0, { weapon: "Wolf's Gravestone" });
    const after = analyze(q);
    expect(after.memberStats[0].atk).not.toBeCloseTo(before.memberStats[0].atk, 0);
    expect(after.optimization.result.totals.avg).not.toBeCloseTo(before.optimization.result.totals.avg, 0);
  });

  it('subir o nível de talento aumenta o dano', () => {
    const p = sampleProject();
    const q = team.updateMember(p, 0, { talents: { normal: 10, skill: 13, burst: 13 } });
    expect(analyze(q).optimization.result.members[0].avg).toBeGreaterThan(analyze(p).optimization.result.members[0].avg);
  });

  it('índice inexistente devolve o mesmo projeto', () => {
    const p = sampleProject();
    expect(team.updateMember(p, 9, { minER: 1 })).toBe(p);
  });
});
