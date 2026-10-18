/**
 * Estado do editor de rotação (Zustand): projeto aberto, seleção e histórico de desfazer/refazer.
 * A lógica de edição está em projectOps.ts; aqui só se orquestra histórico e seleção.
 */
import { create } from 'zustand';
import type { ActionRef, RotationProject } from '../../engine';
import * as ops from './projectOps';

const HISTORY_LIMIT = 100;

export interface RotationState {
  project: RotationProject | null;
  past: RotationProject[];
  future: RotationProject[];
  selectedActionId: string | null;
  selectedWindowId: string | null;
  /** Instante (s) marcado na régua; onde novos golpes são inseridos. */
  playhead: number;
  /** Há alterações desde que o projeto foi aberto ou salvo. */
  dirty: boolean;

  open: (project: RotationProject) => void;
  markSaved: () => void;
  select: (id: string | null) => void;
  selectWindow: (id: string | null) => void;
  setPlayhead: (t: number) => void;

  addAction: (input: ops.NewAction) => string | null;
  updateAction: (id: string, patch: Partial<Omit<ActionRef, 'id'>>) => void;
  moveAction: (id: string, time: number) => void;
  removeAction: (id: string) => void;
  duplicateAction: (id: string) => void;
  rename: (name: string) => void;

  addWindow: (tag: string, start: number, length?: number) => string | null;
  updateWindow: (id: string, patch: { start?: number; end?: number }) => void;
  shiftWindow: (id: string, start: number) => void;
  removeWindow: (id: string) => void;
  setTagSource: (id: string, source: 'manual' | 'windows') => void;
  convertProfilesToWindows: () => void;

  undo: () => void;
  redo: () => void;
}

export const useRotationStore = create<RotationState>((set, get) => {
  /** Aplica uma alteração registrando o estado anterior no histórico. */
  const commit = (next: RotationProject | null, selected?: string | null) => {
    const { project, past } = get();
    if (!project || !next || next === project) return;
    set({
      project: next,
      past: [...past, project].slice(-HISTORY_LIMIT),
      future: [],
      dirty: true,
      ...(selected !== undefined ? { selectedActionId: selected } : {}),
    });
  };

  return {
    project: null,
    past: [],
    future: [],
    selectedActionId: null,
    selectedWindowId: null,
    playhead: 0,
    dirty: false,

    open: (project) => set({ project, past: [], future: [], selectedActionId: null, selectedWindowId: null, playhead: 0, dirty: false }),
    markSaved: () => set({ dirty: false }),
    select: (id) => set({ selectedActionId: id, ...(id ? { selectedWindowId: null } : {}) }),
    selectWindow: (id) => set({ selectedWindowId: id, ...(id ? { selectedActionId: null } : {}) }),
    setPlayhead: (t) => set({ playhead: ops.clampTime(t) }),

    addAction: (input) => {
      const project = get().project;
      if (!project) return null;
      const next = ops.addAction(project, input);
      const id = next.actions[next.actions.length - 1].id;
      commit(next, id);
      return id;
    },
    updateAction: (id, patch) => commit(get().project && ops.updateAction(get().project!, id, patch)),
    moveAction: (id, time) => commit(get().project && ops.moveAction(get().project!, id, time)),
    removeAction: (id) => {
      const project = get().project;
      if (!project) return;
      commit(ops.removeAction(project, id), get().selectedActionId === id ? null : undefined);
    },
    duplicateAction: (id) => {
      const project = get().project;
      if (!project) return;
      const { project: next, newId } = ops.duplicateAction(project, id);
      commit(next, newId ?? undefined);
    },
    rename: (name) => commit(get().project && ops.renameProject(get().project!, name)),

    addWindow: (tag, start, length) => {
      const project = get().project;
      if (!project) return null;
      const next = ops.addWindow(project, tag, start, length);
      const id = next.buffWindows[next.buffWindows.length - 1].id;
      commit(next);
      set({ selectedWindowId: id, selectedActionId: null });
      return id;
    },
    updateWindow: (id, patch) => commit(get().project && ops.updateWindow(get().project!, id, patch)),
    shiftWindow: (id, start) => commit(get().project && ops.shiftWindow(get().project!, id, start)),
    removeWindow: (id) => {
      const project = get().project;
      if (!project) return;
      commit(ops.removeWindow(project, id));
      if (get().selectedWindowId === id) set({ selectedWindowId: null });
    },
    setTagSource: (id, source) => commit(get().project && ops.setTagSource(get().project!, id, source)),
    convertProfilesToWindows: () => commit(get().project && ops.windowsFromProfiles(get().project!)),

    undo: () => {
      const { project, past, future } = get();
      if (!project || past.length === 0) return;
      set({ project: past[past.length - 1], past: past.slice(0, -1), future: [project, ...future], dirty: true });
    },
    redo: () => {
      const { project, past, future } = get();
      if (!project || future.length === 0) return;
      set({ project: future[0], past: [...past, project], future: future.slice(1), dirty: true });
    },
  };
});
