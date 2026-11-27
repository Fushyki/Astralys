/** Preferências visuais do site (menu de configurações do cabeçalho). Ficam só neste navegador. */
import { create } from 'zustand';
import { adminToken, setAdminToken } from '../features/community/published';
import { verifyAdmin } from '../online/api';
import { ONLINE_ENABLED } from '../online/config';
import { toast } from './toast';
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

/** O que os retratos dos cards mostram; ligado por padrão. */
export type CardShow = 'cardWeapon' | 'cardGear';
const SHOW_KEY: Record<CardShow, string> = { cardWeapon: 'astralys:config:cardweapon', cardGear: 'astralys:config:cardgear' };
const loadShow = (k: CardShow): boolean => {
  try {
    return localStorage.getItem(SHOW_KEY[k]) !== 'off';
  } catch {
    return true;
  }
};

interface Settings {
  cardWeapon: boolean;
  cardGear: boolean;
  setCardShow: (k: CardShow, v: boolean) => void;
  /** Fundo dos cards de personagem e de recarga: com a cor do personagem ou neutro. */
  cardBg: CardBg;
  /** Formato dos cards na lista de Times. */
  cardFormat: PosterFormat;
  /** Código de administrador (dono do site): libera a moderação da Comunidade. Vazio para os demais. */
  adminCode: string;
  /** O servidor confirmou o código (selo ADM e botões de moderação só aparecem com isto). */
  adminOk: boolean;
  setAdminCode: (v: string) => void;
  setCardBg: (v: CardBg) => void;
  setCardFormat: (f: PosterFormat) => void;
}

let adminTimer: ReturnType<typeof setTimeout> | undefined;

export const useSettings = create<Settings>((set) => ({
  cardBg: loadBg(),
  cardWeapon: loadShow('cardWeapon'),
  cardGear: loadShow('cardGear'),
  setCardShow: (k, v) => {
    try { localStorage.setItem(SHOW_KEY[k], v ? 'on' : 'off'); } catch { /* sem armazenamento: vale até recarregar */ }
    set({ [k]: v } as Pick<Settings, CardShow>);
  },
  cardFormat: loadVaultCardFormat(),
  adminCode: adminToken(),
  adminOk: false,
  setAdminCode: (v) => {
    const code = v.trim();
    setAdminToken(code);
    set({ adminCode: code, adminOk: false });
    if (adminTimer) clearTimeout(adminTimer);
    if (!code || !ONLINE_ENABLED) return;
    // espera parar de digitar e pergunta ao servidor; só avisa quando acerta (quem não é admin não vê nada)
    adminTimer = setTimeout(() => {
      void verifyAdmin(code).then((ok) => {
        if (useSettings.getState().adminCode !== code) return;
        set({ adminOk: ok });
        if (ok) toast('Modo administrador ativado.');
      });
    }, 600);
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

// código guardado de uma visita anterior: confirma de novo no servidor
if (useSettings.getState().adminCode && ONLINE_ENABLED) {
  const code = useSettings.getState().adminCode;
  void verifyAdmin(code).then((ok) => {
    if (useSettings.getState().adminCode === code) useSettings.setState({ adminOk: ok });
  });
}
