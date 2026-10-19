/**
 * Conta online. A API vem de `VITE_API_URL`; sem ela, o site funciona só neste navegador e nenhum botão de conta aparece.
 */
const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export const API_URL = raw.trim().replace(/\/+$/, '');
export const ONLINE_ENABLED = API_URL.length > 0;
