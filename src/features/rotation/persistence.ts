/**
 * Persistência local dos projetos (localStorage). Tudo é validado com Zod na leitura, então um dado
 * corrompido ou de outra versão é ignorado em vez de quebrar a tela. O armazenamento pode falhar
 * (modo privado, cota cheia): todas as funções toleram isso.
 */
import { parseProject, type RotationProject } from '../../engine';
import { bindNewProject, databaseOfProject, projectInActiveDatabase, unbindProject } from '../good/goodStore';
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
    const isNew = localStorage.getItem(KEY(project.id)) === null;
    localStorage.setItem(KEY(project.id), JSON.stringify(project));
    if (isNew) bindNewProject(project.id);
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
    unbindProject(id);
  } catch {
    /* sem armazenamento: nada a apagar */
  }
}

/** Projeto salvo com esse id; para o exemplo, cai no projeto de exemplo; senão null. */
export function loadProject(id: string): RotationProject | null {
  return loadStoredProject(id) ?? (id === SAMPLE_ID ? sampleForApp() : null);
}

// ---------- Cofre (lista de projetos salvos) ----------

export type VaultCardFormat = 'portrait' | 'wide' | 'tall';
const VAULT_CARD_KEY = 'astralys:times:card';

/** Formato do card que a tela Times mostra em TODOS os times (preferência do navegador; padrão 4:5). */
export function loadVaultCardFormat(): VaultCardFormat {
  try {
    const v = localStorage.getItem(VAULT_CARD_KEY);
    return v === 'wide' || v === 'tall' ? v : 'portrait';
  } catch {
    return 'portrait';
  }
}

export function saveVaultCardFormat(f: VaultCardFormat): void {
  try {
    localStorage.setItem(VAULT_CARD_KEY, f);
  } catch {
    /* sem armazenamento: a escolha vale só até recarregar */
  }
}

const PREFIX = 'astralys:projeto:';

export interface ProjectSummary {
  id: string;
  name: string;
  members: string[];
  actions: number;
  updatedAt: string;
  isSample: boolean;
  favorite: boolean;
  /** Compartilhado por link público. */
  shared: boolean;
  /** Versão do jogo (patch) com que o time foi montado; vazia se não se sabe. */
  gameVersion: string;
}

export const summarize = (p: RotationProject): ProjectSummary => ({
  id: p.id,
  name: p.name,
  members: p.members.map((m) => m.character),
  actions: p.actions.length,
  updatedAt: p.meta.updatedAt,
  isSample: p.id === SAMPLE_ID,
  favorite: !!p.meta.favorite,
  shared: !!p.meta.shared,
  gameVersion: p.gameVersion ?? '',
});

/** Projetos da base em uso, do mais recente ao mais antigo; o exemplo entra se ainda não foi editado. */
export function listProjects(): ProjectSummary[] {
  const out: ProjectSummary[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const p = loadStoredProject(key.slice(PREFIX.length));
      if (p && projectInActiveDatabase(p.id)) out.push(summarize(p));
    }
  } catch {
    /* sem armazenamento: só o exemplo */
  }
  if (!out.some((p) => p.id === SAMPLE_ID)) out.push(summarize(sampleForApp()));
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Os projetos realmente salvos neste navegador (sem o exemplo embutido). */
export function listStoredProjects(): RotationProject[] {
  const out: RotationProject[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const p = loadStoredProject(key.slice(PREFIX.length));
      if (p) out.push(p);
    }
  } catch {
    /* sem armazenamento: nada a listar */
  }
  return out;
}

export const newProjectId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Cópia independente (id novo, datas atuais). */
export function cloneProject(p: RotationProject, name = `${p.name} (cópia)`): RotationProject {
  const now = new Date().toISOString();
  return { ...p, id: newProjectId(), name, meta: { ...p.meta, createdAt: now, updatedAt: now } };
}

/** Ids dos times guardados que pertencem a essa base. */
export const projectIdsOfDatabase = (databaseId: string): string[] => listStoredProjects().filter((p) => databaseOfProject(p.id) === databaseId).map((p) => p.id);
