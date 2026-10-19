/**
 * Importação de arquivos no navegador: a planilha .xlsx do theorycraft (modelo "Time/Rotação") e o JSON de um
 * projeto exportado. A biblioteca xlsx é pesada, então só é baixada quando um .xlsx é escolhido.
 */
import { importPlanilha, parseProject, projectFromPlanilha, type RotationProject } from '../../engine';
import type { LoadedData } from './data';
import { newProjectId } from './persistence';

export interface ImportResult {
  project: RotationProject;
  warnings: string[];
}

const baseName = (file: File) => file.name.replace(/\.[^.]+$/, '');

export async function importXlsx(file: File, data: LoadedData): Promise<ImportResult> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(await file.arrayBuffer());
  const imported = importPlanilha(wb, data.game, data.effects);
  if (imported.actions.length === 0) throw new Error('A aba "Rotação" não tem nenhum golpe.');
  const project = projectFromPlanilha(imported, {
    id: newProjectId(),
    name: baseName(file) || 'Planilha importada',
    gameVersion: data.meta.gameVersion,
  });
  return { project, warnings: imported.warnings };
}

export async function importJson(file: File): Promise<ImportResult> {
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error('O arquivo não é um JSON válido.');
  }
  const parsed = parseProject(raw);
  return { project: { ...parsed, id: newProjectId() }, warnings: [] };
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
}
