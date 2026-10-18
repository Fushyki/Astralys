/**
 * Operações puras sobre o projeto (sem React, sem estado). Sempre devolvem um projeto NOVO; nunca mutam.
 * O estado (Zustand) só orquestra histórico e persistência em cima disto.
 */
import type { ActionRef, BuffWindow, MoveRef, RotationProject } from '../../engine';

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
    // Ações novas seguem as janelas de buff: arrastar no tempo muda os buffs que valem.
    tagSource: 'windows',
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


// ---------- Janelas de buff ----------

export const MIN_WINDOW = 0.1;
export const DEFAULT_WINDOW = 4;

export function nextWindowId(project: RotationProject): string {
  const used = new Set(project.buffWindows.map((w) => w.id));
  for (let n = project.buffWindows.length + 1; ; n++) {
    const id = `w${n}`;
    if (!used.has(id)) return id;
  }
}

/** Nova janela da fonte `tag` começando em `start`, com `length` segundos. */
export function addWindow(project: RotationProject, tag: string, start: number, length = DEFAULT_WINDOW): RotationProject {
  const s = clampTime(start);
  const win: BuffWindow = { id: nextWindowId(project), tag, start: s, end: clampTime(s + Math.max(MIN_WINDOW, length)) };
  return touch({ ...project, buffWindows: [...project.buffWindows, win] });
}

/** Move/redimensiona uma janela garantindo início ≥ 0 e duração mínima. */
export function updateWindow(project: RotationProject, id: string, patch: { start?: number; end?: number }): RotationProject {
  const w = project.buffWindows.find((x) => x.id === id);
  if (!w) return project;
  const start = clampTime(patch.start ?? w.start);
  const end = Math.max(clampTime(patch.end ?? w.end), start + MIN_WINDOW);
  if (start === w.start && end === w.end) return project;
  return touch({ ...project, buffWindows: project.buffWindows.map((x) => (x.id === id ? { ...x, start, end: clampTime(end) } : x)) });
}

/** Desloca a janela inteira mantendo a duração. */
export function shiftWindow(project: RotationProject, id: string, start: number): RotationProject {
  const w = project.buffWindows.find((x) => x.id === id);
  if (!w) return project;
  const s = clampTime(start);
  return updateWindow(project, id, { start: s, end: s + (w.end - w.start) });
}

export function removeWindow(project: RotationProject, id: string): RotationProject {
  if (!project.buffWindows.some((w) => w.id === id)) return project;
  return touch({ ...project, buffWindows: project.buffWindows.filter((w) => w.id !== id) });
}

export function setTagSource(project: RotationProject, id: string, source: 'manual' | 'windows'): RotationProject {
  return updateAction(project, id, { tagSource: source });
}

/**
 * Converte as etiquetas manuais (perfis da planilha) em janelas: uma por etiqueta, do primeiro ao último golpe
 * que a usa. Todas as ações passam a seguir as janelas. O resultado pode mudar, porque uma ação dentro da janela
 * que antes não tinha aquela etiqueta passa a tê-la.
 */
export function windowsFromProfiles(project: RotationProject): RotationProject {
  const manual = project.actions.filter((a) => a.tagSource === 'manual');
  if (manual.length === 0) return project;

  const span = new Map<string, { min: number; max: number }>();
  for (const a of manual) {
    for (const tag of a.activeTags) {
      const cur = span.get(tag);
      span.set(tag, cur ? { min: Math.min(cur.min, a.time), max: Math.max(cur.max, a.time) } : { min: a.time, max: a.time });
    }
  }
  const derived = new Set(span.keys());
  const kept = project.buffWindows.filter((w) => !derived.has(w.tag));
  let next: RotationProject = { ...project, buffWindows: kept };
  for (const [tag, { min, max }] of [...span.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    next = addWindow(next, tag, min, max - min + MIN_WINDOW);
  }
  return touch({ ...next, actions: next.actions.map((a) => (a.tagSource === 'manual' ? { ...a, tagSource: 'windows' as const } : a)) });
}
