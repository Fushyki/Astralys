/**
 * Operações puras sobre a equipe: adicionar, remover, trocar e editar membros, e rolls manuais.
 * As etiquetas de buff carregam o índice do membro (`gear:3`, `char:2`), então remover um membro reindexa
 * ações, janelas e perfis para que nada passe a apontar para a pessoa errada.
 */
import type { Character, Weapon } from '../../data/schema';
import { MAX_TEAM_SIZE, SUBSTATS, type GameData, type MemberRef, type RotationProject, type Substat } from '../../engine';

const touch = (p: RotationProject): RotationProject => ({ ...p, meta: { ...p.meta, updatedAt: new Date().toISOString() } });

const MEMBER_TAG = /^(gear|char):(\d+)$/;

/** Reindexa uma etiqueta depois de remover o membro `removed`. Devolve null se a etiqueta era dele. */
export function remapTag(tag: string, removed: number): string | null {
  const m = MEMBER_TAG.exec(tag);
  if (!m) return tag;
  const idx = Number(m[2]);
  if (idx === removed) return null;
  return idx > removed ? `${m[1]}:${idx - 1}` : tag;
}

export function updateMember(project: RotationProject, index: number, patch: Partial<MemberRef>): RotationProject {
  if (!project.members[index]) return project;
  return touch({ ...project, members: project.members.map((m, i) => (i === index ? { ...m, ...patch } : m)) });
}

export function addMember(project: RotationProject, ref: MemberRef): RotationProject {
  if (project.members.length >= MAX_TEAM_SIZE) return project;
  if (project.members.some((m) => m.character === ref.character)) return project;
  return touch({ ...project, members: [...project.members, ref] });
}

/** Remove um membro e tudo que dependia dele. Não remove o último membro. */
export function removeMember(project: RotationProject, index: number): RotationProject {
  if (project.members.length <= 1 || !project.members[index]) return project;
  return touch({
    ...project,
    members: project.members.filter((_, i) => i !== index),
    actions: project.actions
      .filter((a) => a.member !== index)
      .map((a) => ({
        ...a,
        member: a.member > index ? a.member - 1 : a.member,
        activeTags: a.activeTags.map((t) => remapTag(t, index)).filter((t): t is string => t !== null),
      })),
    buffWindows: project.buffWindows.flatMap((w) => {
      const tag = remapTag(w.tag, index);
      return tag === null ? [] : [{ ...w, tag }];
    }),
    profiles: Object.fromEntries(
      Object.entries(project.profiles).map(([name, tags]) => [name, tags.map((t) => remapTag(t, index)).filter((t): t is string => t !== null)]),
    ),
  });
}

/**
 * Troca o personagem de uma vaga. Os golpes do personagem antigo não existem no novo, então as ações dessa vaga
 * saem; as janelas de buff da vaga ficam (apontam para "a arma/set daquela vaga").
 */
export function replaceMember(project: RotationProject, index: number, ref: MemberRef): RotationProject {
  if (!project.members[index]) return project;
  if (project.members.some((m, i) => i !== index && m.character === ref.character)) return project;
  return touch({
    ...project,
    members: project.members.map((m, i) => (i === index ? ref : m)),
    actions: project.actions.filter((a) => a.member !== index),
  });
}

// ---------- Rolls manuais ----------

/** Passa o membro para o modo manual, partindo de uma distribuição (normalmente a que o otimizador escolheu). */
export function useManualRolls(project: RotationProject, index: number, start: Record<Substat, number>): RotationProject {
  return updateMember(project, index, { manualRolls: { ...start } });
}

export const useAutoRolls = (project: RotationProject, index: number): RotationProject => {
  const m = project.members[index];
  if (!m?.manualRolls) return project;
  const { manualRolls: _drop, ...rest } = m;
  void _drop;
  return touch({ ...project, members: project.members.map((x, i) => (i === index ? rest : x)) });
};

/** Aceita rolls fracionários (duas casas): o inventário GOOD traz somas reais de substats, que não são inteiras. */
export function setManualRoll(project: RotationProject, index: number, substat: Substat, value: number): RotationProject {
  const m = project.members[index];
  if (!m?.manualRolls) return project;
  const v = Math.max(0, Math.min(60, Math.round((Number.isFinite(value) ? value : 0) * 100) / 100));
  return updateMember(project, index, { manualRolls: { ...m.manualRolls, [substat]: v } });
}

// ---------- Fábrica de membros ----------

/** Armas que o personagem pode usar, das mais fortes para as mais fracas (raridade, depois ATK base). */
export function weaponsFor(character: Character, weapons: Weapon[]): Weapon[] {
  return weapons.filter((w) => w.type === character.weapon).sort((a, b) => b.rarity - a.rarity || b.baseAtk - a.baseAtk || a.name.localeCompare(b.name));
}

/** Um membro razoável para começar: melhor arma disponível, sem sets, mains de dano e talentos 10. */
export function defaultMember(characterName: string, data: Pick<GameData, 'characters' | 'weapons'>): MemberRef {
  const character = data.characters.find((c) => c.name === characterName);
  if (!character) throw new Error(`Personagem "${characterName}" não existe nos dados do jogo.`);
  const weapon = weaponsFor(character, data.weapons)[0];
  if (!weapon) throw new Error(`Não há armas para ${character.name} (${character.weapon}).`);
  return {
    character: character.name,
    weapon: weapon.name,
    artifacts: {
      rarity: { flower: 5, plume: 5, sands: 5, goblet: 5, circlet: 5 },
      sands: 'ATK%',
      goblet: 'DMG%',
      circlet: 'CR',
    },
    talents: { normal: 10, skill: 10, burst: 10 },
    minER: 0,
  };
}

export const ALL_SUBSTATS = SUBSTATS;
