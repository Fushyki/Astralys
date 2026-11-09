/** Importação de arquivos no navegador: o JSON de um projeto exportado ou de uma rotação compartilhada. */
import { parseProject, type RotationProject } from '../../engine';
import type { LoadedData } from './data';
import { toast } from '../../app/toast';
import { newProjectId, sampleForApp } from './persistence';
import { dropDuplicateExtras } from './extraDedupe';
import { leavePlanilha } from './leavePlanilha';
import { parseShare, projectFromShare } from './share';

export interface ImportResult {
  project: RotationProject;
  warnings: string[];
}


/** Tira o modo planilha de arquivos antigos e descarta os buffs extras que repetem um buff já calculado (só com os dados do jogo carregados). */
export function withoutDuplicates(project: RotationProject, warnings: string[], data?: LoadedData): ImportResult {
  if (!data) return { project, warnings };
  const left = leavePlanilha(project, data);
  const r = dropDuplicateExtras(left.project, data.game, data.effects);
  return { project: r.project, warnings: [...warnings, ...left.warnings, ...r.warnings] };
}

export async function importJson(file: File, data?: LoadedData): Promise<ImportResult> {
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error('O arquivo não é um JSON válido.');
  }
  // Arquivo de "Compartilhar rotação" com a equipe dentro vira um time novo.
  const share = parseShare(raw);
  if (share) {
    const r = projectFromShare(share, { ...sampleForApp(), gameVersion: share.gameVersion });
    return withoutDuplicates(r.project, r.warnings, data);
  }
  const parsed = parseProject(raw);
  return withoutDuplicates({ ...parsed, id: newProjectId() }, [], data);
}

/** Baixa o projeto como arquivo .json. */
export function downloadProject(project: RotationProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^\w\-]+/g, '_') || 'projeto'}.astralys.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`Projeto exportado: ${a.download}`);
}
