/** Busca a vitrine de um jogador pelo UID, pelo backend do Astralys (o Enka.Network não aceita chamadas do navegador). */
import type { EnkaResponse } from '../features/enka/enkaImport';
import { ApiError, messageOf } from './api';
import { API_URL } from './config';

export const UID_PATTERN = /^\d{9,10}$/;

export async function fetchEnka(uid: string): Promise<EnkaResponse> {
  const clean = uid.trim();
  if (!UID_PATTERN.test(clean)) throw new ApiError('O UID tem 9 ou 10 números. Está em Perfil, no canto inferior direito da tela do jogo.', 422);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/enka/${clean}`);
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
  return body as EnkaResponse;
}
