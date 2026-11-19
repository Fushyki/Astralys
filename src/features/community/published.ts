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

/** Id público -> id do projeto local, só dos times que ESTE navegador publicou. */
export const ownedPublic = (publicId: string): { projectId: string; token: string } | null => {
  const hit = Object.entries(read()).find(([, v]) => v.id === publicId);
  return hit ? { projectId: hit[0], token: hit[1].token } : null;
};

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

const ADMIN = 'astralys.admin';
/** Código do dono do site (campo "Código" das Configurações), guardado só no navegador dele; o servidor confere com `ADMIN_TOKEN`. */
export const adminToken = (): string => {
  try {
    return localStorage.getItem(ADMIN) ?? '';
  } catch {
    return '';
  }
};
export function setAdminToken(t: string): void {
  try {
    if (t) localStorage.setItem(ADMIN, t);
    else localStorage.removeItem(ADMIN);
  } catch {
    /* sem armazenamento: o modo admin não persiste */
  }
}

