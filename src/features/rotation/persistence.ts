/**
 * Persistência local dos projetos (localStorage). Tudo é validado com Zod na leitura, então um dado
 * corrompido ou de outra versão é ignorado em vez de quebrar a tela. O armazenamento pode falhar
 * (modo privado, cota cheia): todas as funções toleram isso.
 */
import { parseProject, type RotationProject } from '../../engine';
import { windowsFromProfiles } from './projectOps';
import sample from './sample/mavuika-iansan.json';

export const SAMPLE_ID = 'exemplo';
const KEY = (id: string) => `astralys:projeto:${id}`;

/** O exemplo como está no JSON: etiquetas de buff manuais, como na planilha (usado pelos testes de gabarito). */
export const sampleProject = (): RotationProject => parseProject(sample);

/** O exemplo que o site abre: os buffs já em janelas na linha do tempo, com o mesmo dano da planilha. */
export const sampleForApp = (): RotationProject => windowsFromProfiles(sampleProject());

export function saveProject(project: RotationProject): boolean {
  try {
    localStorage.setItem(KEY(project.id), JSON.stringify(project));
    return true;
  } catch {
    return false;
  }
}

export function loadStoredProject(id: string): RotationProject | null {
  try {
    const raw = localStorage.getItem(KEY(id));
    return raw ? parseProject(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function deleteStoredProject(id: string): void {
  try {
    localStorage.removeItem(KEY(id));
  } catch {
    /* sem armazenamento: nada a apagar */
  }
}

/** Projeto salvo com esse id; para o exemplo, cai no projeto de exemplo; senão null. */
export function loadProject(id: string): RotationProject | null {
  return loadStoredProject(id) ?? (id === SAMPLE_ID ? sampleForApp() : null);
}

// ---------- Cofre (lista de projetos salvos) ----------

const PREFIX = 'astralys:projeto:';

export interface ProjectSummary {
  id: string;
  name: string;
  members: string[];
  actions: number;
  updatedAt: string;
  isSample: boolean;
}

export const summarize = (p: RotationProject): ProjectSummary => ({
  id: p.id,
  name: p.name,
  members: p.members.map((m) => m.character),
  actions: p.actions.length,
  updatedAt: p.meta.updatedAt,
  isSample: p.id === SAMPLE_ID,
});

/** Projetos salvos neste navegador, do mais recente ao mais antigo; o exemplo entra se ainda não foi editado. */
export function listProjects(): ProjectSummary[] {
  const out: ProjectSummary[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const p = loadStoredProject(key.slice(PREFIX.length));
      if (p) out.push(summarize(p));
    }
  } catch {
    /* sem armazenamento: só o exemplo */
  }
  if (!out.some((p) => p.id === SAMPLE_ID)) out.push(summarize(sampleForApp()));
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const newProjectId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Cópia independente (id novo, datas atuais). */
export function cloneProject(p: RotationProject, name = `${p.name} (cópia)`): RotationProject {
  const now = new Date().toISOString();
  return { ...p, id: newProjectId(), name, meta: { ...p.meta, createdAt: now, updatedAt: now } };
}
