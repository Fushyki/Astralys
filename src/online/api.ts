/** Cliente da API de identidade e projetos (FastAPI). Mensagens de erro já em português. */
import type { RotationProject } from '../engine';
import { API_URL } from './config';

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  avatar_url?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

/** Projeto como o servidor guarda: o JSON do Astralys vai inteiro em `dados`. */
export interface RemoteProject {
  id: string;
  nome: string;
  character_name: string;
  role: string;
  version: string;
  is_public: boolean;
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
  401: 'Sessão expirada ou dados incorretos. Entre de novo.',
  403: 'Você não tem permissão para isso.',
  404: 'Não encontrado.',
  413: 'O projeto é grande demais para a conta.',
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

async function call<T>(path: string, init: RequestInit & { token?: string | null } = {}): Promise<T> {
  const { token, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
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

export const register = (nome: string, email: string, senha: string) =>
  call<Usuario>('/auth/register', { method: 'POST', body: JSON.stringify({ nome, email, senha }) });

export const login = (email: string, senha: string) =>
  call<TokenResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) });

export const logout = (token: string) => call<{ mensagem: string }>('/auth/logout', { method: 'POST', token });

export const me = (token: string) => call<Usuario>('/usuarios/me', { token });

export const listRemote = (token: string) => call<RemoteProject[]>('/astralys/projetos', { token });

export const deleteRemote = (token: string, id: string) =>
  call<{ mensagem: string }>(`/astralys/projetos/${encodeURIComponent(id)}`, { method: 'DELETE', token });

/** Converte o projeto local no formato do servidor. */
export function toRemote(p: RotationProject) {
  return {
    id: p.id,
    nome: p.name.slice(0, 255),
    character_name: (p.members[0]?.character ?? 'Time').slice(0, 100),
    role: 'Time',
    version: (p.gameVersion || '1.0').slice(0, 20),
    dados: p as unknown as Record<string, unknown>,
    is_public: false,
  };
}

/** Envia vários projetos de uma vez; o servidor devolve a lista completa da conta. */
export const syncRemote = (token: string, projects: RotationProject[]) =>
  call<RemoteProject[]>('/astralys/projetos/sync', { method: 'POST', token, body: JSON.stringify({ projetos: projects.map(toRemote) }) });
