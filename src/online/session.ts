/** Sessão da conta: o token fica neste navegador (localStorage) e o usuário é recarregado ao abrir o site. */
import { create } from 'zustand';
import * as api from './api';
import { ONLINE_ENABLED } from './config';

const KEY = 'astralys.sessao';

interface Stored {
  token: string;
  usuario: api.Usuario;
}

const read = (): Stored | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
};

const write = (s: Stored | null) => {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* sem armazenamento: a sessão vale só até recarregar */
  }
};

interface SessionState {
  token: string | null;
  usuario: api.Usuario | null;
  signIn: (email: string, senha: string) => Promise<void>;
  signUp: (nome: string, email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Confere o token guardado; se o servidor o recusar, encerra a sessão. */
  restore: () => Promise<void>;
}

const initial = ONLINE_ENABLED ? read() : null;

export const useSession = create<SessionState>((set, get) => ({
  token: initial?.token ?? null,
  usuario: initial?.usuario ?? null,

  async signIn(email, senha) {
    const r = await api.login(email, senha);
    write({ token: r.access_token, usuario: r.usuario });
    set({ token: r.access_token, usuario: r.usuario });
  },

  async signUp(nome, email, senha) {
    await api.register(nome, email, senha);
    await get().signIn(email, senha);
  },

  async signOut() {
    const { token } = get();
    write(null);
    set({ token: null, usuario: null });
    if (token) await api.logout(token).catch(() => undefined);
  },

  async restore() {
    const { token } = get();
    if (!token) return;
    try {
      const usuario = await api.me(token);
      write({ token, usuario });
      set({ usuario });
    } catch (e) {
      if (e instanceof api.ApiError && (e.status === 401 || e.status === 403)) {
        write(null);
        set({ token: null, usuario: null });
      }
    }
  },
}));
