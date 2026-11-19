/** Preferências visuais do site (menu de configurações do cabeçalho). Ficam só neste navegador. */
import { create } from 'zustand';
import { adminToken, setAdminToken } from '../features/community/published';
import { loadVaultCardFormat, saveVaultCardFormat } from '../features/rotation/persistence';
import type { PosterFormat } from '../screens/card/PosterCard';

export type CardBg = 'color' | 'plain';
const BG_KEY = 'astralys:config:cardbg';

const loadBg = (): CardBg => {
  try {
    return localStorage.getItem(BG_KEY) === 'plain' ? 'plain' : 'color';
  } catch {
    return 'color';
  }
};
const applyBg = (v: CardBg) => { document.documentElement.dataset.cardBg = v; };

interface Settings {
  /** Fundo dos cards de personagem e de recarga: com a cor do personagem ou neutro. */
  cardBg: CardBg;
  /** Formato dos cards na lista de Times. */
  cardFormat: PosterFormat;
  /** Código de administrador (dono do site): libera a moderação da Comunidade. Vazio para os demais. */
  adminCode: string;
  setAdminCode: (v: string) => void;
  setCardBg: (v: CardBg) => void;
  setCardFormat: (f: PosterFormat) => void;
}

export const useSettings = create<Settings>((set) => ({
  cardBg: loadBg(),
  cardFormat: loadVaultCardFormat(),
  adminCode: adminToken(),
  setAdminCode: (v) => {
    setAdminToken(v.trim());
    set({ adminCode: v.trim() });
  },
  setCardBg: (v) => {
    applyBg(v);
    try { localStorage.setItem(BG_KEY, v); } catch { /* sem armazenamento: vale até recarregar */ }
    set({ cardBg: v });
  },
  setCardFormat: (f) => {
    saveVaultCardFormat(f);
    set({ cardFormat: f });
  },
}));

applyBg(useSettings.getState().cardBg);
