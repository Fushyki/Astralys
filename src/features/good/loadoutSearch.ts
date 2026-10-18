/**
 * Busca do melhor conjunto de 5 artefatos do inventário GOOD para um personagem, medindo o dano da rotação da
 * equipe inteira com os substats REAIS das peças. Heurística de subida (hill climbing) a partir de vários pontos de
 * partida (o conjunto equipado e o melhor conjunto de cada set), trocando uma peça por vez até não melhorar.
 * Não é busca exaustiva: o resultado é o melhor que a heurística achou, sempre pelo menos igual ao ponto de partida.
 */
import type { Rolls } from '../../engine';
import {
  assembleTeam,
  evaluateRotation,
  manualToRolls,
  resolveMember,
  type MemberRef,
  type RotationAction,
  type TeamInput,
} from '../../engine';
import type { FlatDamageEffect } from '../../effects/schema';
import type { GameData, EffectsData } from '../../engine';
import { SUBSTATS, SUBSTAT_ROLL_VALUES, type Substat } from '../../engine';
import { loadoutFromPieces, norm, type Good, type GoodArtifact, type Loadout } from './goodImport';

const SLOTS = ['flower', 'plume', 'sands', 'goblet', 'circlet'] as const;
export type SlotKey = (typeof SLOTS)[number];
export type Pieces = Record<SlotKey, GoodArtifact>;

export interface SearchInput {
  good: Good;
  characterName: string;
  member: number;
  team: TeamInput;
  /** Referência do membro no projeto (arma, talentos, constelação…); só os artefatos mudam. */
  ref: MemberRef;
  /** Rolls de todos os membros (os dos outros ficam como estão). */
  rolls: Rolls[];
  actions: readonly RotationAction[];
  flatEffects?: FlatDamageEffect[];
  ampCoefficient?: number;
  game: GameData;
  effects: EffectsData;
  minRolls: number;
  /** Peso de cada substat para ordenar as peças (ganho relativo de +1 roll). */
  weights: Partial<Record<Substat, number>>;
  /** Também considera peças equipadas em outros personagens. */
  allowEquippedByOthers: boolean;
  /** Quantas peças por posição entram na busca (as mais promissoras pela heurística). */
  candidatesPerSlot?: number;
  onProgress?: (evaluated: number) => void;
  /** Para cancelar: devolva true. */
  shouldStop?: () => boolean;
}

export interface SearchResult {
  pieces: Pieces;
  loadout: Loadout;
  /** Dano médio da rotação da equipe com este conjunto. */
  teamAvg: number;
  /** Dano com o conjunto equipado hoje no inventário (null se o personagem não tem as 5 peças). */
  equippedAvg: number | null;
  evaluated: number;
  stopped: boolean;
}

const PERCENT = new Set(['hp_', 'atk_', 'def_', 'enerRech_', 'critRate_', 'critDMG_']);
const SUB: Record<string, Substat> = { hp: 'HP', hp_: 'HP%', atk: 'ATK', atk_: 'ATK%', def: 'DEF', def_: 'DEF%', eleMas: 'EM', enerRech_: 'ER', critRate_: 'CR', critDMG_: 'CD' };

/** Nota da peça: rolls de cada substat (valor ÷ valor médio do roll 5★) × ganho relativo de +1 roll daquele substat. */
function pieceScore(a: GoodArtifact, weights: SearchInput['weights']): number {
  let total = 0;
  for (const s of a.substats) {
    const sub = SUB[s.key];
    if (!sub) continue;
    const value = PERCENT.has(s.key) ? s.value / 100 : s.value;
    total += (value / SUBSTAT_ROLL_VALUES[sub][0]) * (weights[sub] ?? 0);
  }
  return total;
}

const yieldToUi = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export async function searchBestLoadout(input: SearchInput): Promise<SearchResult> {
  const { good, member, team, ref, game, effects } = input;
  const charKey = good.characters.find((c) => norm(c.key) === norm(input.characterName))?.key ?? input.characterName;

  const usable = good.artifacts.filter((a) => {
    const loc = norm(a.location);
    return loc === '' || loc === norm(charKey) || input.allowEquippedByOthers;
  });
  const limit = input.candidatesPerSlot ?? 40;
  const pool = Object.fromEntries(
    SLOTS.map((slot) => [
      slot,
      usable
        .filter((a) => a.slotKey === slot)
        .map((a) => ({ a, score: pieceScore(a, input.weights) }))
        .sort((x, y) => y.score - x.score)
        .slice(0, limit)
        .map((x) => x.a),
    ]),
  ) as Record<SlotKey, GoodArtifact[]>;
  const empty = SLOTS.filter((s) => pool[s].length === 0);
  if (empty.length) throw new Error(`O inventário não tem peças para: ${empty.join(', ')}.`);

  let evaluated = 0;
  const cache = new Map<string, number>();
  const idOf = (a: GoodArtifact) => `${a.slotKey}|${a.setKey}|${a.mainStatKey}|${a.rarity}|${a.level ?? ''}|${a.substats.map((s) => `${s.key}:${s.value}`).join(',')}|${a.location}`;
  const evaluate = (p: Pieces): number => {
    const key = SLOTS.map((s) => idOf(p[s])).join('#');
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const lo = loadoutFromPieces(SLOTS.map((s) => p[s]), game);
    const memberRef: MemberRef = { ...ref, ...lo, manualRolls: lo.manualRolls };
    const resolved = resolveMember(memberRef, game, effects, input.minRolls);
    const members = team.members.map((m, i) => (i === member ? resolved : m));
    const nextTeam: TeamInput = { ...team, members };
    const rolls = input.rolls.map((r, i) => (i === member ? manualToRolls(lo.manualRolls, input.minRolls) : r));
    const result = evaluateRotation(
      { members, assembly: assembleTeam(nextTeam), config: team.config, rolls, flatEffects: input.flatEffects, ampCoefficient: input.ampCoefficient },
      input.actions,
    );
    evaluated++;
    cache.set(key, result.totals.avg);
    return result.totals.avg;
  };

  // ---- Pontos de partida ----
  const equipped = good.artifacts.filter((a) => norm(a.location) === norm(charKey));
  const equippedPieces = (): Pieces | null => {
    const by = Object.fromEntries(equipped.map((a) => [a.slotKey, a]));
    return SLOTS.every((s) => by[s]) ? (by as Pieces) : null;
  };
  const seeds: Pieces[] = [];
  const eq = equippedPieces();
  if (eq) seeds.push(eq);
  const best = Object.fromEntries(SLOTS.map((s) => [s, pool[s][0]])) as Pieces;
  seeds.push(best);
  // melhor peça de cada set, por posição, para os 6 sets mais completos
  const setCounts = new Map<string, number>();
  for (const s of SLOTS) for (const a of pool[s]) setCounts.set(a.setKey, (setCounts.get(a.setKey) ?? 0) + 1);
  const topSets = [...setCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k);
  for (const set of topSets) {
    const seed = Object.fromEntries(SLOTS.map((s) => [s, pool[s].find((a) => a.setKey === set) ?? pool[s][0]])) as Pieces;
    seeds.push(seed);
  }

  let bestPieces: Pieces = seeds[0];
  let bestAvg = -Infinity;
  let stopped = false;
  const equippedAvg = eq ? evaluate(eq) : null;

  outer: for (const seed of seeds) {
    let current = seed;
    let currentAvg = evaluate(current);
    for (let pass = 0; pass < 6; pass++) {
      let improved = false;
      for (const slot of SLOTS) {
        for (const candidate of pool[slot]) {
          if (candidate === current[slot]) continue;
          if (input.shouldStop?.()) { stopped = true; break outer; }
          const trial = { ...current, [slot]: candidate } as Pieces;
          const avg = evaluate(trial);
          if (avg > currentAvg + 1e-9) {
            current = trial;
            currentAvg = avg;
            improved = true;
          }
          if (evaluated % 150 === 0) {
            input.onProgress?.(evaluated);
            await yieldToUi();
          }
        }
      }
      if (!improved) break;
    }
    if (currentAvg > bestAvg) {
      bestAvg = currentAvg;
      bestPieces = current;
    }
  }
  if (!Number.isFinite(bestAvg)) bestAvg = evaluate(bestPieces);
  input.onProgress?.(evaluated);
  return { pieces: bestPieces, loadout: loadoutFromPieces(SLOTS.map((s) => bestPieces[s]), game), teamAvg: bestAvg, equippedAvg, evaluated, stopped };
}

/** Pesos por substat a partir do mapa de calor do motor (ganho relativo de +1 roll deste membro). */
export function weightsFromGains(gains: { member: number; substat: Substat; relativeGain: number }[], member: number): Partial<Record<Substat, number>> {
  const out: Partial<Record<Substat, number>> = {};
  for (const s of SUBSTATS) out[s] = gains.find((g) => g.member === member && g.substat === s)?.relativeGain ?? 0;
  return out;
}
