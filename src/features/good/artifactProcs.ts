/**
 * Procs (rolls) de um substat de artefato, deduzidos do valor mostrado no jogo.
 * Cada roll vale 70, 80, 90 ou 100% do máximo do substat (tabela do jogo, mesma do Genshin Optimizer), então
 * um valor V soma k rolls quando V/máx, em passos de 10%, cai entre 0,7k e 1,0k. O jogo mostra o valor arredondado
 * (1 casa nos %, inteiro nos fixos), por isso a conta aceita essa folga.
 */
export type SubKey = 'hp' | 'hp_' | 'atk' | 'atk_' | 'def' | 'def_' | 'eleMas' | 'enerRech_' | 'critRate_' | 'critDMG_';

/** Máximo de UM roll, por raridade (valores em unidades do GOOD: % em pontos percentuais). */
export const SUB_MAX: Record<4 | 5, Record<SubKey, number>> = {
  5: { hp: 298.75, hp_: 5.83, atk: 19.45, atk_: 5.83, def: 23.15, def_: 7.29, eleMas: 23.31, enerRech_: 6.48, critRate_: 3.89, critDMG_: 7.77 },
  4: { hp: 239, hp_: 4.66, atk: 15.56, atk_: 4.66, def: 18.52, def_: 5.83, eleMas: 18.65, enerRech_: 5.18, critRate_: 3.11, critDMG_: 6.22 },
};

export const SUB_KEYS = Object.keys(SUB_MAX[5]) as SubKey[];
const isPercent = (k: SubKey) => k.endsWith('_');

export interface ProcRange {
  /** Menor e maior número de rolls que explicam o valor; null = o valor não bate com nenhuma soma de rolls. */
  min: number;
  max: number;
}

/** Quantos rolls (de 1 a 6) o valor pode ter. Devolve null se o valor for impossível para esse substat. */
export function procRange(key: SubKey, value: number, rarity: 4 | 5 = 5): ProcRange | null {
  const max = SUB_MAX[rarity][key];
  if (!max || !(value > 0)) return null;
  const step = max / 10;
  const m = Math.round(value / step);
  // O valor exibido é arredondado: aceita meio passo da exibição (0,05 nos %, 0,5 nos fixos) e uma sobra mínima.
  const tol = (isPercent(key) ? 0.05 : 0.5) + 1e-6;
  const candidates = [m - 1, m, m + 1].filter((n) => Math.abs(n * step - value) <= tol);
  let lo = Infinity;
  let hi = 0;
  for (const n of candidates) {
    for (let k = 1; k <= 6; k++) {
      if (n >= 7 * k && n <= 10 * k) {
        lo = Math.min(lo, k);
        hi = Math.max(hi, k);
      }
    }
  }
  return hi === 0 ? null : { min: lo, max: hi };
}

/** Rolls de cada substat (o menor número possível) e o total; `ok` é falso se algum valor for impossível. */
export function artifactProcs(subs: readonly { key: string; value: number }[], rarity: 4 | 5 = 5): { perSub: (number | null)[]; total: number; ok: boolean } {
  const perSub = subs.map((s) => procRange(s.key as SubKey, s.value, rarity)?.min ?? null);
  return { perSub, total: perSub.reduce<number>((a, n) => a + (n ?? 0), 0), ok: perSub.every((n) => n !== null) };
}

/** Quantos rolls um artefato pode ter no total: um por substat inicial (3 ou 4) mais um a cada 4 níveis. */
export function maxProcs(rarity: 4 | 5, level: number): number {
  return Math.min(4, rarity === 5 ? 4 : 3) + Math.floor(level / 4);
}
