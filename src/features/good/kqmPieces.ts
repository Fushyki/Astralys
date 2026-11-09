/**
 * Transforma os rolls do KQM (total por substat, em todo o build) em 5 artefatos concretos: cada peça com até 4 substats
 * distintos (nunca o do main stat), no máximo 9 procs (5★ +20) ou 7 (4★ +16) e no máximo 6 (ou 5) por substat.
 * Cada roll vale 85% do máximo (média do KQM, alternando rolls de 80% e 90%), então o total bate com o que o motor usa.
 */
import { MAX_ROLLS_PER_SUBSTAT, ROLLS_PER_PIECE, SUBSTATS, type Rolls, type Substat } from '../../engine/artifacts';
import { SUB_MAX, type SubKey } from './artifactProcs';
import type { GoodArtifact } from './goodImport';

const SLOTS = ['flower', 'plume', 'sands', 'goblet', 'circlet'] as const;
type Slot = (typeof SLOTS)[number];

export const SUB_KEY: Record<Substat, SubKey> = { CR: 'critRate_', CD: 'critDMG_', 'ATK%': 'atk_', EM: 'eleMas', ER: 'enerRech_', ATK: 'atk', 'HP%': 'hp_', HP: 'hp', 'DEF%': 'def_', DEF: 'def' };
const MAIN_KEY: Record<string, string> = { 'ATK%': 'atk_', 'HP%': 'hp_', 'DEF%': 'def_', EM: 'eleMas', ER: 'enerRech_', CR: 'critRate_', CD: 'critDMG_', Healing: 'heal_' };

/** `location` das peças feitas à mão: não vêm do inventário e não podem ser trocadas ao abrir o projeto. */
export const MANUAL_LOCATION = 'manual';

export interface KqmConfig {
  rarity: Record<Slot, 4 | 5>;
  sands: string;
  goblet: string;
  circlet: string;
}

/** Valor de `n` rolls: metade em 80% e metade em 90% do máximo, arredondado como o jogo mostra. */
export function rollsToValue(key: SubKey, n: number, rarity: 4 | 5): number {
  const a = Math.floor(n / 2);
  const steps = 8 * a + 9 * (n - a);
  const v = (steps * SUB_MAX[rarity][key]) / 10;
  return key.endsWith('_') ? Math.round(v * 100) / 100 : Math.round(v);
}

export function kqmPieces(rolls: Rolls, cfg: KqmConfig, setKey: string, element: string): { pieces: GoodArtifact[]; leftover: number } {
  const mainOf = (slot: Slot) => (slot === 'flower' ? 'hp' : slot === 'plume' ? 'atk' : cfg[slot] === 'DMG%' ? `${element.toLowerCase()}_dmg_` : (MAIN_KEY[cfg[slot]] ?? cfg[slot]));
  const idx = (r: 4 | 5) => (r === 5 ? 0 : 1);
  const left = Object.fromEntries(SUBSTATS.map((s) => [s, Math.max(0, Math.round(rolls[s] ?? 0))])) as Record<Substat, number>;
  const cap = SLOTS.map((s) => ROLLS_PER_PIECE[idx(cfg.rarity[s])]);
  const subs: Partial<Record<Substat, number>>[] = SLOTS.map(() => ({}));
  // O substat com mais rolls pendentes vai primeiro; cada pedaço cai na peça com mais espaço (até 4 substats por peça).
  for (const s of [...SUBSTATS].sort((a, b) => left[b] - left[a])) {
    while (left[s] > 0) {
      const slotsOk = SLOTS.map((slot, i) => ({ slot, i })).filter(({ slot, i }) => {
        const has = s in subs[i];
        const full = Object.keys(subs[i]).length >= 4 && !has;
        return !full && SUB_KEY[s] !== mainOf(slot) && cap[i] > 0 && (subs[i][s] ?? 0) < MAX_ROLLS_PER_SUBSTAT[idx(cfg.rarity[slot])];
      });
      if (slotsOk.length === 0) break;
      const best = slotsOk.reduce((a, b) => (cap[b.i] > cap[a.i] ? b : a));
      const room = MAX_ROLLS_PER_SUBSTAT[idx(cfg.rarity[best.slot])] - (subs[best.i][s] ?? 0);
      const give = Math.min(left[s], room, cap[best.i]);
      subs[best.i][s] = (subs[best.i][s] ?? 0) + give;
      cap[best.i] -= give;
      left[s] -= give;
    }
  }
  const pieces = SLOTS.map((slot, i): GoodArtifact => {
    const rarity = cfg.rarity[slot];
    return {
      setKey, slotKey: slot, rarity, level: rarity === 5 ? 20 : 16, mainStatKey: mainOf(slot), location: MANUAL_LOCATION,
      substats: (Object.entries(subs[i]) as [Substat, number][]).map(([s, n]) => ({ key: SUB_KEY[s], value: rollsToValue(SUB_KEY[s], n, rarity) })),
    };
  });
  return { pieces, leftover: SUBSTATS.reduce((t, s) => t + left[s], 0) };
}
