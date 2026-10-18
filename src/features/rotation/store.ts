/**
 * Estado do editor de rotação (Zustand): projeto aberto, seleção e histórico de desfazer/refazer.
 * A lógica de edição está em projectOps.ts; aqui só se orquestra histórico e seleção.
 */
import { create } from 'zustand';
import type { ActionRef, MemberRef, RotationProject, Substat } from '../../engine';
import * as ops from './projectOps';
import * as team from './teamOps';

const HISTORY_LIMIT = 100;

export interface RotationState {
  project: RotationProject | null;
  past: RotationProject[];
  future: RotationProject[];
  selectedActionId: string | null;
  selectedWindowId: string | null;
  /** Membro cujo build está aberto no editor. */
  selectedMember: number;
  /** Instante (s) marcado na régua; onde novos golpes são inseridos. */
  playhead: number;
  /** Há alterações desde que o projeto foi aberto ou salvo. */
  dirty: boolean;

  open: (project: RotationProject) => void;
  markSaved: () => void;
  select: (id: string | null) => void;
  selectWindow: (id: string | null) => void;
  selectMember: (index: number) => void;
  setPlayhead: (t: number) => void;

  addAction: (input: ops.NewAction) => string | null;
  updateAction: (id: string, patch: Partial<Omit<ActionRef, 'id'>>) => void;
  moveAction: (id: string, time: number) => void;
  removeAction: (id: string) => void;
  duplicateAction: (id: string) => void;
  rename: (name: string) => void;
  /** Marca ou desmarca o projeto como favorito no Vault (preferência: não entra no desfazer). */
  setFavorite: (favorite: boolean) => void;

  addWindow: (tag: string, start: number, length?: number) => string | null;
  updateWindow: (id: string, patch: { start?: number; end?: number }) => void;
  shiftWindow: (id: string, start: number) => void;
  removeWindow: (id: string) => void;
  setTagSource: (id: string, source: 'manual' | 'windows') => void;
  convertProfilesToWindows: () => void;
  realign: (step?: number) => void;
  updateConfig: (patch: Partial<RotationProject['config']>) => void;

  updateMember: (index: number, patch: Partial<MemberRef>) => void;
  addMember: (ref: MemberRef) => void;
  removeMember: (index: number) => void;
  replaceMember: (index: number, ref: MemberRef) => void;
  useManualRolls: (index: number, start: Record<Substat, number>) => void;
  useAutoRolls: (index: number) => void;
  setManualRoll: (index: number, substat: Substat, value: number) => void;

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
    selectedMember: 0,
    playhead: 0,
    dirty: false,

    open: (project) => set({ project, past: [], future: [], selectedActionId: null, selectedWindowId: null, selectedMember: 0, playhead: 0, dirty: false }),
    markSaved: () => set({ dirty: false }),
    select: (id) => set({ selectedActionId: id, ...(id ? { selectedWindowId: null } : {}) }),
    selectWindow: (id) => set({ selectedWindowId: id, ...(id ? { selectedActionId: null } : {}) }),
    selectMember: (index) => set({ selectedMember: index }),
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
    setFavorite: (favorite) => {
      const project = get().project;
      if (!project || project.meta.favorite === favorite) return;
      set({ project: { ...project, meta: { ...project.meta, favorite, updatedAt: new Date().toISOString() } }, dirty: true });
    },

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
    realign: (step) => commit(get().project && ops.realignActions(get().project!, step)),
    updateConfig: (patch) => commit(get().project && ops.updateConfig(get().project!, patch)),

    updateMember: (index, patch) => commit(get().project && team.updateMember(get().project!, index, patch)),
    addMember: (ref) => {
      const project = get().project;
      if (!project) return;
      const next = team.addMember(project, ref);
      commit(next);
      if (next !== project) set({ selectedMember: next.members.length - 1 });
    },
    removeMember: (index) => {
      const project = get().project;
      if (!project) return;
      const next = team.removeMember(project, index);
      commit(next, null);
      if (next !== project) set({ selectedMember: Math.min(get().selectedMember, next.members.length - 1), selectedWindowId: null });
    },
    replaceMember: (index, ref) => {
      const project = get().project;
      if (!project) return;
      commit(team.replaceMember(project, index, ref), null);
    },
    useManualRolls: (index, start) => commit(get().project && team.useManualRolls(get().project!, index, start)),
    useAutoRolls: (index) => commit(get().project && team.useAutoRolls(get().project!, index)),
    setManualRoll: (index, substat, value) => commit(get().project && team.setManualRoll(get().project!, index, substat, value)),

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
