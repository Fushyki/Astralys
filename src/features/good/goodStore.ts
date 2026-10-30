/**
 * Bases de dados do inventário GOOD no navegador (localStorage), como o "Base de Dados" do Genshin Optimizer: o usuário pode
 * ter várias (a dele, a de um amigo...) e uma fica ativa. Cada base é guardada separada, então trocar de base nunca mistura itens.
 * Os times também são da base: trocar de base troca tudo (personagens, armas, artefatos e times), e nada se mistura.
 * Tudo é validado na leitura; falhas de armazenamento são toleradas.
 */
import { parseGood, type Good } from './goodImport';

const LEGACY_KEY = 'astralys:inventario-good';
const INDEX_KEY = 'astralys:bases';
const DATA_KEY = (id: string) => `astralys:base:${id}`;
const BIND_KEY = 'astralys:base-dos-times';

export interface DatabaseInfo {
  id: string;
  name: string;
  updatedAt: string;
  characters: number;
  artifacts: number;
  weapons: number;
}
interface Index { active: string | null; list: DatabaseInfo[] }

const read = (k: string): unknown => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const write = (k: string, v: unknown): boolean => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
};
const infoOf = (id: string, name: string, g: Good): DatabaseInfo => ({ id, name, updatedAt: new Date().toISOString(), characters: g.characters.length, artifacts: g.artifacts.length, weapons: g.weapons.length });
const newId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Lê o índice; na primeira vez, traz o inventário antigo (uma base só) para "Base 1". */
function readIndex(): Index {
  const raw = read(INDEX_KEY) as Index | null;
  if (raw && Array.isArray(raw.list)) return raw;
  const legacy = read(LEGACY_KEY);
  if (legacy) {
    try {
      const g = parseGood(legacy);
      const id = newId();
      const idx: Index = { active: id, list: [infoOf(id, 'Base 1', g)] };
      if (write(DATA_KEY(id), g) && write(INDEX_KEY, idx)) {
        try {
          localStorage.removeItem(LEGACY_KEY);
        } catch {
          /* fica o antigo; a base nova já existe */
        }
      }
      return idx;
    } catch {
      /* inventário antigo inválido: começa sem bases */
    }
  }
  return { active: null, list: [] };
}

export const listDatabases = (): DatabaseInfo[] => readIndex().list;

export function activeDatabaseId(): string | null {
  const { active, list } = readIndex();
  return list.some((d) => d.id === active) ? active : (list[0]?.id ?? null);
}

export function setActiveDatabase(id: string): void {
  const idx = readIndex();
  if (idx.list.some((d) => d.id === id)) write(INDEX_KEY, { ...idx, active: id });
}

function loadById(id: string | null): Good | null {
  if (!id) return null;
  try {
    const raw = read(DATA_KEY(id));
    return raw ? parseGood(raw) : null;
  } catch {
    return null;
  }
}

const bindings = (): Record<string, string> => (read(BIND_KEY) as Record<string, string> | null) ?? {};

/**
 * Base a que o time pertence. Time sem ligação (de antes das bases) fica na primeira base; sem nenhuma base, é de todas.
 * Os times de cada base aparecem só quando ela está em uso, como no Genshin Optimizer.
 */
export function databaseOfProject(projectId: string): string | null {
  const { list } = readIndex();
  const id = bindings()[projectId];
  return id && list.some((d) => d.id === id) ? id : (list[0]?.id ?? null);
}

/** O time aparece na lista da base em uso? (O exemplo embutido aparece em todas.) */
export function projectInActiveDatabase(projectId: string): boolean {
  if (projectId === 'exemplo' || readIndex().list.length === 0) return true;
  return databaseOfProject(projectId) === activeDatabaseId();
}

/** Time novo (criado, duplicado, importado) nasce na base em uso. */
export function bindNewProject(projectId: string): void {
  const id = activeDatabaseId();
  if (id && projectId !== 'exemplo') bindProject(projectId, id);
}

/** Tira a ligação de um time (ao apagá-lo). */
export function unbindProject(projectId: string): void {
  const b = bindings();
  delete b[projectId];
  write(BIND_KEY, b);
}

export function bindProject(projectId: string, databaseId: string): void {
  write(BIND_KEY, { ...bindings(), [projectId]: databaseId });
}

/** Inventário em uso. Sem argumento: a base ativa (telas gerais). Com o id de um time: a base dele. */
export function loadGood(projectId?: string): Good | null {
  return loadById(projectId ? databaseOfProject(projectId) : activeDatabaseId());
}

/** Grava na base dada (padrão: a ativa; sem nenhuma, cria "Base 1"). */
export function saveGood(good: Good, databaseId?: string): boolean {
  const idx = readIndex();
  const id = databaseId ?? activeDatabaseId() ?? newId();
  const old = idx.list.find((d) => d.id === id);
  const info = infoOf(id, old?.name ?? `Base ${idx.list.length + 1}`, good);
  if (!write(DATA_KEY(id), good)) return false;
  return write(INDEX_KEY, { active: idx.active && idx.list.some((d) => d.id === idx.active) ? idx.active : id, list: old ? idx.list.map((d) => (d.id === id ? info : d)) : [...idx.list, info] });
}

/** Cria uma base nova (fica ativa se for a única) e devolve o id, ou null se o armazenamento falhou. */
export function createDatabase(name: string, good: Good): string | null {
  const idx = readIndex();
  const id = newId();
  if (!write(DATA_KEY(id), good)) return null;
  const list = [...idx.list, infoOf(id, name.trim() || `Base ${idx.list.length + 1}`, good)];
  return write(INDEX_KEY, { active: idx.active && idx.list.some((d) => d.id === idx.active) ? idx.active : id, list }) ? id : null;
}

export function renameDatabase(id: string, name: string): void {
  const idx = readIndex();
  if (name.trim()) write(INDEX_KEY, { ...idx, list: idx.list.map((d) => (d.id === id ? { ...d, name: name.trim() } : d)) });
}

/** Apaga a base (e só ela). Times ligados a ela passam a usar a ativa na próxima vez que abrirem. */
export function deleteDatabase(id: string): void {
  const idx = readIndex();
  const list = idx.list.filter((d) => d.id !== id);
  try {
    localStorage.removeItem(DATA_KEY(id));
  } catch {
    /* sem armazenamento: nada a apagar */
  }
  write(INDEX_KEY, { active: idx.active === id ? (list[0]?.id ?? null) : idx.active, list });
}

/** Apaga a base dada (padrão: a ativa). */
export function clearGood(databaseId?: string): void {
  const id = databaseId ?? activeDatabaseId();
  if (id) deleteDatabase(id);
}

/** Lê uma base específica (para a prévia e a exportação). */
export const loadDatabase = (id: string): Good | null => loadById(id);
