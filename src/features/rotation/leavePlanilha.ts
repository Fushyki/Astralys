/**
 * O modo planilha saiu do site: todo time passa a usar todos os efeitos do jogo. Esta troca vale para times que ainda o têm
 * (salvos antes, importados de arquivo ou compartilhados). A duração fica fixa na que o time já tinha e os buffs extras que
 * repetem um buff já calculado saem (na planilha eles eram a única fonte desses números).
 */
import type { RotationProject } from '../../engine';
import type { LoadedData } from './data';
import { dropDuplicateExtras } from './extraDedupe';
import { loadStoredProject, saveProject } from './persistence';

export function leavePlanilha(project: RotationProject, data: LoadedData): { project: RotationProject; warnings: string[] } {
  if (project.compat !== 'planilha') return { project, warnings: [] };
  return dropDuplicateExtras({ ...project, compat: 'none', config: { ...project.config, durationManual: true } }, data.game, data.effects);
}

const PREFIX = 'astralys:projeto:';
const storedIds = (): string[] => {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).map((k) => k.slice(PREFIX.length));
  } catch {
    return [];
  }
};

/** Há time salvo neste navegador ainda no modo planilha? (leitura barata, sem os dados do jogo) */
export const hasPlanilhaProjects = (): boolean => storedIds().some((id) => loadStoredProject(id)?.compat === 'planilha');

/** Converte e grava os times salvos que ainda estão no modo planilha. Devolve quantos mudaram. */
export function migratePlanilhaProjects(data: LoadedData): number {
  let n = 0;
  for (const id of storedIds()) {
    const p = loadStoredProject(id);
    if (p?.compat !== 'planilha') continue;
    if (saveProject(leavePlanilha(p, data).project)) n++;
  }
  return n;
}
