/** Endereços das imagens do Lunaris e limpeza dos textos de passivas. */
const BASE = 'https://api.lunaris.moe/data/assets';

/** Ícone da arma (o Lunaris traz o nome do arquivo em `weaponIcon`). */
export const weaponIconUrl = (icon: string) => `${BASE}/weaponicon/${icon}.webp`;

/** Número da peça no nome do arquivo do ícone: UI_RelicIcon_<set>_<n>. */
const PIECE_NUMBER = { flower: 4, plume: 2, sands: 5, goblet: 1, circlet: 3 } as const;
export type PieceKey = keyof typeof PIECE_NUMBER;

/** Ícone de uma peça de um set (o id do set do Lunaris é o mesmo do arquivo). */
/**
 * Sets em que o Lunaris não tem a imagem de todas as peças (conferido nos 66 sets; o resto tem as 5). Nesses o ícone usa uma peça que existe
 * em vez de dar 404. Lista fixa, sem pedido extra: não pesa. Se um sync novo trouxer sets assim, é só acrescentar aqui.
 */
const ONLY_PIECES: Record<number, number[]> = { 15004: [4], 15009: [3], 15010: [3], 15011: [3], 15012: [3], 15013: [3] };

export const pieceIconUrl = (setId: number, slot: PieceKey) => {
  const n = PIECE_NUMBER[slot];
  const only = ONLY_PIECES[setId];
  return `${BASE}/artifacts/UI_RelicIcon_${setId}_${only && !only.includes(n) ? only[0] : n}.webp`;
};

import { cleanLunarisMarkup } from '../data/clean';

/** Texto de passiva do Lunaris sem as marcas de cor e com as quebras de linha viradas em espaço. */
export const cleanText = (text: string | undefined): string =>
  cleanLunarisMarkup(text ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\\n|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
