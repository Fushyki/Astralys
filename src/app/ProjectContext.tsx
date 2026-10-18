/** Contexto compartilhado pelas telas de um projeto: projeto aberto, dados do jogo e resultado do motor (um só cálculo). */
import { createContext, useContext } from 'react';
import type { AnalysisBundle, ResolvedProject, RotationProject } from '../engine';
import type { LoadedData } from '../features/rotation/data';
import type { Summary } from '../features/rotation/summary';

export interface ProjectView {
  id: string;
  project: RotationProject;
  data: LoadedData;
  bundle: AnalysisBundle;
  resolved: ResolvedProject;
  /** O resultado ainda é de antes da última edição (o worker está calculando). */
  stale: boolean;
  /** Os membros do resultado são os mesmos do projeto (evita ler stats de um membro recém-trocado). */
  inSync: boolean;
  summary: Summary;
  /** Uma cor por membro (a variação escura vale para o segundo do mesmo elemento). */
  colors: string[];
}

const Ctx = createContext<ProjectView | null>(null);
export const ProjectProvider = Ctx.Provider;

export function useProjectView(): ProjectView {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProjectView só funciona dentro do ProjectLayout.');
  return v;
}
