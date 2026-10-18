/**
 * Operações puras sobre o projeto (sem React, sem estado). Sempre devolvem um projeto NOVO; nunca mutam.
 * O estado (Zustand) só orquestra histórico e persistência em cima disto.
 */
import type { ActionRef, MoveRef, RotationProject } from '../../engine';

const MIN_EXECUTIONS = 1;

const touch = (p: RotationProject): RotationProject => ({ ...p, meta: { ...p.meta, updatedAt: new Date().toISOString() } });

/** Gera um id de ação que ainda não existe no projeto: a1, a2, ... */
export function nextActionId(project: RotationProject): string {
  const used = new Set(project.actions.map((a) => a.id));
  for (let n = project.actions.length + 1; ; n++) {
    const id = `a${n}`;
    if (!used.has(id)) return id;
  }
}

export const clampTime = (t: number) => (Number.isFinite(t) ? Math.max(0, Math.round(t * 100) / 100) : 0);

export interface NewAction {
  member: number;
  move: MoveRef;
  time: number;
  displayName?: string;
  executions?: number;
  reaction?: ActionRef['reaction'];
  activeTags?: string[];
}

export function addAction(project: RotationProject, input: NewAction): RotationProject {
  const member = project.members[input.member];
  if (!member) throw new RangeError(`Membro ${input.member} não existe na equipe.`);
  if (member.character !== input.move.character) {
    throw new Error(`O golpe é de ${input.move.character}, mas o membro ${input.member} é ${member.character}.`);
  }
  const action: ActionRef = {
    id: nextActionId(project),
    member: input.member,
    move: { ...input.move, variant: input.move.variant ?? 0 },
    displayName: input.displayName,
    executions: Math.max(MIN_EXECUTIONS, input.executions ?? 1),
    reaction: input.reaction ?? 'none',
    activeTags: input.activeTags ?? [],
    dmgAdjust: 0,
    time: clampTime(input.time),
  };
  return touch({ ...project, actions: [...project.actions, action] });
}

export function updateAction(project: RotationProject, id: string, patch: Partial<Omit<ActionRef, 'id'>>): RotationProject {
  if (!project.actions.some((a) => a.id === id)) return project;
  const next = {
    ...patch,
    ...(patch.time !== undefined ? { time: clampTime(patch.time) } : {}),
    ...(patch.executions !== undefined ? { executions: Math.max(MIN_EXECUTIONS, patch.executions) } : {}),
  };
  return touch({ ...project, actions: project.actions.map((a) => (a.id === id ? { ...a, ...next } : a)) });
}

export const moveAction = (project: RotationProject, id: string, time: number) => updateAction(project, id, { time });

export function removeAction(project: RotationProject, id: string): RotationProject {
  if (!project.actions.some((a) => a.id === id)) return project;
  return touch({ ...project, actions: project.actions.filter((a) => a.id !== id) });
}

/** Duplica uma ação logo depois dela (+0,5 s). Devolve o projeto e o id da cópia. */
export function duplicateAction(project: RotationProject, id: string): { project: RotationProject; newId: string | null } {
  const src = project.actions.find((a) => a.id === id);
  if (!src) return { project, newId: null };
  const newId = nextActionId(project);
  const copy: ActionRef = { ...src, id: newId, time: clampTime(src.time + 0.5), activeTags: [...src.activeTags] };
  return { project: touch({ ...project, actions: [...project.actions, copy] }), newId };
}

export function renameProject(project: RotationProject, name: string): RotationProject {
  const trimmed = name.trim();
  return trimmed ? touch({ ...project, name: trimmed.slice(0, 120) }) : project;
}

/** Ações em ordem cronológica (estável nos empates). */
export const chronological = (project: RotationProject): ActionRef[] => [...project.actions].sort((a, b) => a.time - b.time);
