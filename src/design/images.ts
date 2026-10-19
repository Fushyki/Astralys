/** Endereços das imagens do Lunaris e limpeza dos textos de passivas. */
const BASE = 'https://api.lunaris.moe/data/assets';

/** Ícone da arma (o Lunaris traz o nome do arquivo em `weaponIcon`). */
export const weaponIconUrl = (icon: string) => `${BASE}/weaponicon/${icon}.webp`;

/** Número da peça no nome do arquivo do ícone: UI_RelicIcon_<set>_<n>. */
const PIECE_NUMBER = { flower: 4, plume: 2, sands: 5, goblet: 1, circlet: 3 } as const;
export type PieceKey = keyof typeof PIECE_NUMBER;

/** Ícone de uma peça de um set (o id do set do Lunaris é o mesmo do arquivo). */
export const pieceIconUrl = (setId: number, slot: PieceKey) => `${BASE}/artifacts/UI_RelicIcon_${setId}_${PIECE_NUMBER[slot]}.webp`;

/** Texto de passiva do Lunaris sem as marcas de cor e com as quebras de linha viradas em espaço. */
export const cleanText = (text: string | undefined): string =>
  (text ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\\n|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
