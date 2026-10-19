/**
 * Constantes de artefatos: valores de main stat, peças fixas e valor por roll de substat.
 * Fonte: aba "Stats" da planilha de referência (padrão KQM: média de roll; 5★ = nível 20, 4★ = nível 16).
 * Os valores por roll são a MÉDIA do roll, não o máximo. Índice [0] = 5★, [1] = 4★.
 */
export type Rarity = 4 | 5;
export type PieceSlot = 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';

const idx = (rarity: Rarity) => (rarity === 5 ? 0 : 1);
export const pick = (pair: readonly [number, number], rarity: Rarity) => pair[idx(rarity)];

export const MAIN_STAT_VALUES = {
  sands: {
    'ATK%': [0.466, 0.348], EM: [187, 139], ER: [0.518, 0.387], 'HP%': [0.466, 0.348], 'DEF%': [0.583, 0.435],
  },
  goblet: {
    'DMG%': [0.466, 0.348], 'ATK%': [0.466, 0.348], EM: [187, 139], 'HP%': [0.466, 0.348], 'DEF%': [0.583, 0.435],
  },
  circlet: {
    CR: [0.311, 0.232], CD: [0.622, 0.464], 'ATK%': [0.466, 0.348], EM: [187, 139],
    'HP%': [0.466, 0.348], 'DEF%': [0.583, 0.435], Healing: [0.359, 0.268],
  },
} as const satisfies Record<'sands' | 'goblet' | 'circlet', Record<string, readonly [number, number]>>;

export const FLOWER_HP = [4780, 3571] as const;
export const PLUME_ATK = [311, 232] as const;

export const SUBSTATS = ['CR', 'CD', 'ATK%', 'EM', 'ER', 'ATK', 'HP%', 'HP', 'DEF%', 'DEF'] as const;
export type Substat = (typeof SUBSTATS)[number];

/** Valor médio por roll de cada substat. */
export const SUBSTAT_ROLL_VALUES: Record<Substat, readonly [number, number]> = {
  CR: [0.033, 0.0264],
  CD: [0.066, 0.0529],
  'ATK%': [0.0495, 0.0396],
  EM: [19.5, 15.86],
  ER: [0.055, 0.044],
  ATK: [18.5, 13.23],
  'HP%': [0.0495, 0.0396],
  HP: [254, 203.15],
  'DEF%': [0.062, 0.0496],
  DEF: [19.5, 15.74],
};

/** Máximo de rolls num mesmo substat por peça. */
export const MAX_ROLLS_PER_SUBSTAT = [6, 5] as const;
/** Rolls de substat por peça (iniciais + upgrades). */
export const ROLLS_PER_PIECE = [9, 7] as const;

export const PIECE_SLOTS: PieceSlot[] = ['flower', 'plume', 'sands', 'goblet', 'circlet'];

export type Rolls = Record<Substat, number>;
export const zeroRolls = (): Rolls => ({ CR: 0, CD: 0, 'ATK%': 0, EM: 0, ER: 0, ATK: 0, 'HP%': 0, HP: 0, 'DEF%': 0, DEF: 0 });
