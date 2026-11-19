/** Cliente da API (FastAPI): galeria de times e Enka. Mensagens de erro já em português. */
import { API_URL } from './config';

/** O que o link público devolve (sem login). */
export interface PublicProject {
  id: string;
  nome: string;
  character_name: string;
  author: string;
  dados: unknown;
  atualizado_em: string;
}

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const STATUS_TEXT: Record<number, string> = {
  403: 'Você não tem permissão para isso.',
  404: 'Não encontrado.',
  413: 'O time é grande demais para publicar.',
  429: 'Muitas tentativas. Espere um pouco e tente de novo.',
  503: 'O servidor está indisponível no momento.',
};

/** O FastAPI manda `detail` como texto ou como lista de erros de validação. */
export function messageOf(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0] as { msg?: string };
    if (first?.msg) return first.msg.replace(/^Value error, /, '');
  }
  return STATUS_TEXT[status] ?? `Erro ${status} ao falar com o servidor.`;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  } catch {
    throw new ApiError('Não consegui falar com o servidor. Verifique a conexão.', 0);
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* resposta sem corpo */
  }
  if (!res.ok) throw new ApiError(messageOf(res.status, body), res.status);
  return body as T;
}

/** Time da galeria (sem conta). `resumo` é o `TeamSummary` calculado por quem publicou. */
export interface CommunityTeam {
  id: string;
  nome: string;
  author: string;
  version: string;
  members: string[];
  resumo: import('../features/community/teamSummary').TeamSummary;
  criado_em: string;
}

export const getPublic = async (id: string): Promise<PublicProject> => {
  const t = await call<CommunityTeam & { dados: unknown }>(`/times/${encodeURIComponent(id)}`);
  return { id: t.id, nome: t.nome, character_name: t.members[0] ?? '', author: t.author, dados: t.dados, atualizado_em: t.criado_em };
};

export const publishTeam = (body: { nome: string; author: string; version: string; members: string[]; resumo: unknown; dados: unknown }) =>
  call<{ id: string; edit_token: string }>('/times', { method: 'POST', body: JSON.stringify(body) });

export const unpublishTeam = (id: string, auth: { editToken?: string; adminToken?: string }) =>
  call<{ mensagem: string }>(`/times/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Edit-Token': auth.editToken ?? '', 'X-Admin-Token': auth.adminToken ?? '' },
  });

export const listTeams = (f: { q: string; personagem: string; versao: string; offset: number; limit: number }) => {
  const qs = new URLSearchParams({ limit: String(f.limit), offset: String(f.offset) });
  if (f.q.trim()) qs.set('q', f.q.trim());
  if (f.personagem) qs.set('personagem', f.personagem);
  if (f.versao) qs.set('versao', f.versao);
  return call<CommunityTeam[]>(`/times?${qs}`);
};


/** O código é o do dono do site? Resolve com true/false (erro de rede conta como false). */
export const verifyAdmin = (code: string): Promise<boolean> =>
  code ? call<{ admin: boolean }>('/admin/verificar', { headers: { 'X-Admin-Token': code } }).then((r) => r.admin, () => false) : Promise.resolve(false);
