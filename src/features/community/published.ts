/** Times que ESTE navegador publicou: guarda o token que permite despublicar (o servidor só guarda o hash). */
const KEY = 'astralys.publicados';
const AUTHOR = 'astralys.autor';

type Map = Record<string, { id: string; token: string }>;

function read(): Map {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Map;
  } catch {
    return {};
  }
}

export const publishedOf = (projectId: string) => read()[projectId] ?? null;

export function rememberPublished(projectId: string, id: string, token: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), [projectId]: { id, token } }));
  } catch {
    /* sem armazenamento: o time fica publicado, mas não dá para despublicar daqui */
  }
}

export function forgetPublished(projectId: string): void {
  const { [projectId]: _, ...rest } = read();
  try {
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {
    /* nada a fazer */
  }
}

export const savedAuthor = (): string => {
  try {
    return localStorage.getItem(AUTHOR) ?? '';
  } catch {
    return '';
  }
};
export const saveAuthor = (name: string): void => {
  try {
    localStorage.setItem(AUTHOR, name);
  } catch {
    /* ignora */
  }
};
