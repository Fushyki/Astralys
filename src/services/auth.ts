/**
 * Serviço de Autenticação e SSO para Astralys & Ametist Suite
 * Conecta-se ao microsserviço ms-identity (FastAPI + JWT + MySQL)
 */

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
  return (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
};

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
};

export const getStoredUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
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
 * Encerra a sessão ativa do usuário no SSO
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
