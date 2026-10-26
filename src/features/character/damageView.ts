/**
 * Reação e crítico com que o dano de um golpe é mostrado. Uma escolha só por personagem do projeto, compartilhada entre
 * Resumo, Talentos, Avançado e Otimizar: o objetivo é saber o dano da build atual, então todas as telas mostram o mesmo número.
 */
import { create } from 'zustand';
import type { ReactionChoice } from '../../engine';

export type CritView = 'noCrit' | 'avg' | 'crit';
interface View { reaction: ReactionChoice; crit: CritView }
interface Store {
  views: Record<string, View>;
  patch: (key: string, p: Partial<View>) => void;
}

const DEFAULT: View = { reaction: 'none', crit: 'avg' };

export const useDamageViews = create<Store>((set) => ({
  views: {},
  patch: (key, p) => set((s) => ({ views: { ...s.views, [key]: { ...(s.views[key] ?? DEFAULT), ...p } } })),
}));

export function useDamageView(projectId: string, character: string) {
  const key = `${projectId}:${character}`;
  const view = useDamageViews((s) => s.views[key]) ?? DEFAULT;
  const patch = useDamageViews((s) => s.patch);
  return {
    reaction: view.reaction,
    crit: view.crit,
    setReaction: (reaction: ReactionChoice) => patch(key, { reaction }),
    setCrit: (crit: CritView) => patch(key, { crit }),
  };
}
