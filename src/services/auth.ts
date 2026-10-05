/**
 * Serviço de Autenticação e SSO para Astralys & Ametist Suite
 * Conecta-se ao microsserviço ms-identity (FastAPI + JWT + PostgreSQL) e Supabase OAuth
 */

import { supabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  nome: string;
  avatar_url?: string | null;
  status_recado?: string | null;
  criado_em?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  usuario: UserProfile;
}


const STORAGE_KEY_TOKEN = 'astralys_sso_token';
const STORAGE_KEY_USER = 'astralys_sso_user';

export const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && envUrl !== 'http://localhost:8000') {
    return envUrl;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return 'https://astralys-api.onrender.com';
    }
  }
  return envUrl || 'http://localhost:8000';
};

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem('ametist_sso_token');
  } catch {
    return null;
  }
};

export const getStoredUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER) || localStorage.getItem('ametist_sso_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveAuthSession = (token: string, user: UserProfile): void => {
  try {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } catch (e) {
    console.warn('Erro ao salvar sessão no localStorage:', e);
  }
};

export const clearAuthSession = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
  } catch (e) {
    console.warn('Erro ao limpar sessão no localStorage:', e);
  }
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Realiza o login SSO com e-mail e senha
 */
export const login = async (email: string, senha: string): Promise<AuthResponse> => {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), senha })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Falha na autenticação' }));
    throw new Error(errorData.detail || 'E-mail ou senha incorretos.');
  }

  const data: AuthResponse = await response.json();
  saveAuthSession(data.access_token, data.usuario);
  return data;
};

/**
 * Cadastra um novo usuário no ecossistema Ametist & Astralys
 */
export const register = async (nome: string, email: string, senha: string): Promise<UserProfile> => {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: nome.trim(), email: email.trim(), senha })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Falha no cadastro' }));
    throw new Error(errorData.detail || 'Não foi possível cadastrar a conta.');
  }

  return response.json();
};

/**
 * Inicia o fluxo de Login do Google via Supabase OAuth
 */
export const loginWithGoogle = async (): Promise<void> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
    }
  });
  if (error) {
    throw new Error(`Erro no login do Google: ${error.message}`);
  }
};

/**
 * Sincroniza o perfil do Google com a API ms-identity e obtém o token JWT SSO
 */
export const syncOAuthUserWithBackend = async (googleUser: {
  email: string;
  nome: string;
  avatar_url?: string | null;
}): Promise<AuthResponse> => {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/auth/oauth-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: googleUser.email,
      nome: googleUser.nome,
      avatar_url: googleUser.avatar_url,
      provider: 'google'
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Falha ao sincronizar conta Google' }));
    throw new Error(err.detail || 'Não foi possível sincronizar sua conta Google.');
  }

  const data: AuthResponse = await response.json();
  saveAuthSession(data.access_token, data.usuario);
  return data;
};

/**
 * Encerra a sessão ativa do usuário no SSO (FastAPI e Supabase)
 */
export const logout = async (): Promise<void> => {
  const baseUrl = getApiBaseUrl();
  const token = getStoredToken();

  if (token) {
    try {
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (e) {
      console.warn('Não foi possível notificar o servidor sobre o logout:', e);
    }
  }

  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Erro ao deslogar do Supabase:', e);
  }

  clearAuthSession();
};

/**
 * Valida o token e retorna o perfil atualizado do usuário logado
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const token = getStoredToken();
  if (!token) return null;

  const baseUrl = getApiBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/usuarios/me`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAuthSession();
      }
      return null;
    }

    const user: UserProfile = await response.json();
    saveAuthSession(token, user);
    return user;
  } catch (e) {
    console.warn('Erro ao verificar sessão do usuário:', e);
    // Retorna usuário em cache se offline
    return getStoredUser();
  }
};

/**
 * Gera um ticket efêmero (60s) para SSO cross-app
 */
export const createSsoTicket = async (): Promise<string> => {
  const baseUrl = getApiBaseUrl();
  const token = getStoredToken();
  if (!token) throw new Error('Usuário não autenticado.');

  const response = await fetch(`${baseUrl}/auth/sso/ticket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Falha ao gerar ticket SSO.');
  }

  const data = await response.json();
  return data.ticket;
};

/**
 * Troca um ticket efêmero recebido via URL por uma sessão autenticada com novo JWT
 */
export const exchangeSsoTicket = async (ticket: string): Promise<AuthResponse> => {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/auth/sso/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Falha ao validar ticket SSO' }));
    throw new Error(errorData.detail || 'Ticket SSO inválido ou expirado.');
  }

  const data: AuthResponse = await response.json();
  saveAuthSession(data.access_token, data.usuario);
  return data;
};

/**
 * Processa ticket SSO na URL atual (se houver), limpando a barra de endereços
 */
export const checkAndConsumeUrlSsoTicket = async (): Promise<UserProfile | null> => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const ticket = params.get('sso_ticket');
  if (!ticket) return null;

  try {
    const res = await exchangeSsoTicket(ticket);
    params.delete('sso_ticket');
    const newSearch = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState({}, document.title, window.location.pathname + newSearch + window.location.hash);
    return res.usuario;
  } catch (err) {
    console.error('Falha ao consumir ticket SSO da URL:', err);
    params.delete('sso_ticket');
    const newSearch = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState({}, document.title, window.location.pathname + newSearch + window.location.hash);
    return null;
  }
};

/**
 * Constrói a URL para redirecionar para o Ametist com SSO autenticado
 */
export const buildAmetistSsoUrl = async (ametistBaseUrl: string = 'https://ametist-tier-maker.vercel.app'): Promise<string> => {
  try {
    const ticket = await createSsoTicket();
    const url = new URL(ametistBaseUrl);
    url.searchParams.set('sso_ticket', ticket);
    return url.toString();
  } catch {
    return ametistBaseUrl;
  }
};

