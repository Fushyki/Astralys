/**
 * Solver EXATO do melhor conjunto de 5 artefatos, na linha do que o Genshin Optimizer faz: poda por dominância,
 * enumeração dos padrões de set (4 peças, 2+2, 2 peças e sem set) e busca em profundidade com limite superior.
 *
 * Por que é exato: a função de valor é MONÓTONA nos stats (mais stat nunca piora o resultado; uma restrição não cumprida
 * vale -Infinity e só pode passar a cumprir com mais stats). Então o valor do melhor conjunto possível que ainda
 * contém uma escolha parcial é no máximo o valor da escolha parcial somada ao MÁXIMO de cada stat das posições
 * restantes ("peça virtual"). Se esse limite não passa do N-ésimo melhor conjunto já achado, o galho inteiro sai sem
 * perder nada. A dominância tem a mesma garantia: uma peça que N outras da mesma posição e do mesmo set igualam ou
 * superam em todos os stats nunca entra entre os N melhores.
 *
 * Cada padrão de set vira VARIANTES que dividem o espaço sem sobrepor regras: em "4 peças de X" uma posição é a peça
 * extra (qualquer set) e as outras 4 só aceitam X; em "2 peças de X" escolhe-se quais 2 ou 3 posições levam X e as outras
 * só aceitam outros sets, todos diferentes entre si. Listas pequenas e limites mais justos.
 *
 * Puro (sem React, sem motor): quem calcula o valor é a função `evaluate`.
 */
import { DIMS, dominates, type Vec } from './vector';

export interface Piece {
  /** Índice único da peça na lista de candidatas (para dedupe e para voltar ao inventário). */
  index: number;
  /** 0 a 4, na ordem flor, pluma, areia, cálice, tiara. */
  slot: number;
  set: string;
  vec: Vec;
  /** Main stat (areia, cálice e tiara): peças de main stats diferentes nunca entram juntas na "peça virtual". */
  group?: string;
}

/** O que o motor entende como bônus de set. */
export interface SetConfig {
  primarySet?: string;
  secondarySet?: string;
  fourPiece?: boolean;
}

/** Valor do conjunto (maior é melhor). `-Infinity` = restrição não cumprida. Monótono em `vec`. */
export type Evaluate = (vec: Vec, config: SetConfig) => number;

export type PatternKind = 'four' | 'two-two' | 'two' | 'none';
export interface Pattern {
  kind: PatternKind;
  /** four e two: [X]; two-two: [X, Y]; none: []. */
  sets: string[];
}

export function patternConfig(p: Pattern): SetConfig {
  if (p.kind === 'four') return { primarySet: p.sets[0] };
  if (p.kind === 'two-two') return { primarySet: p.sets[0], secondarySet: p.sets[1] };
  if (p.kind === 'two') return { primarySet: p.sets[0], fourPiece: false };
  return {};
}

export const patternLabel = (p: Pattern) =>
  p.kind === 'four' ? `4 peças de ${p.sets[0]}` : p.kind === 'two-two' ? `2 + 2: ${p.sets[0]} e ${p.sets[1]}` : p.kind === 'two' ? `2 peças de ${p.sets[0]}` : 'Sem set';

/** Config que o motor veria para estas 5 peças (a mesma regra dos padrões). */
export function configOfPieces(pieces: readonly Piece[]): SetConfig {
  const counts = new Map<string, number>();
  for (const p of pieces) counts.set(p.set, (counts.get(p.set) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  if (ranked[0] && ranked[0][1] >= 4) return { primarySet: ranked[0][0] };
  if (ranked[0] && ranked[0][1] >= 2 && ranked[1] && ranked[1][1] >= 2) return { primarySet: ranked[0][0], secondarySet: ranked[1][0] };
  if (ranked[0] && ranked[0][1] >= 2) return { primarySet: ranked[0][0], fourPiece: false };
  return {};
}

export interface Build {
  pieces: Piece[];
  value: number;
  config: SetConfig;
}

export interface SolveStats {
  evaluations: number;
  /** Peças descartadas por dominância (somando todas as posições, antes dos padrões). */
  dominated: number;
  /** Variantes de padrão (cada padrão se divide em algumas). */
  patterns: number;
  patternsDone: number;
  stopped: boolean;
}

export interface SolveOptions {
  slots: Piece[][];
  evaluate: Evaluate;
  /** Quantos conjuntos devolver (padrão 5). */
  topN?: number;
  /** Padrões a considerar. Padrão: todos os que as peças permitem. */
  patterns?: Pattern[];
  /**
   * Quais stats influenciam o valor com este bônus de set (true = influencia). Os que não influenciam saem da
   * comparação de dominância, o que descarta muito mais peças. Detectado numericamente por quem avalia; se omitido,
   * todos contam.
   */
  relevantDims?: (config: SetConfig) => boolean[];
  /**
   * Tolerância relativa (0 = exato). Um galho só continua se o limite superior dele passar do N-ésimo melhor por mais
   * que isso: com 0,005 nenhum resultado perdido é pior que 0,5% do que o exato daria, e a busca costuma ser muito mais rápida.
   */
  epsilon?: number;
  /** Conjuntos já conhecidos (ex.: o build equipado): sobem o limiar de poda desde o começo. */
  seeds?: Build[];
  onProgress?: (s: SolveStats, best: number) => void;
  /** Chamado ao terminar cada variante (diagnóstico). */
  onPattern?: (info: { pattern: Pattern; sizes: number[]; evaluations: number; bound: number; skipped: boolean }) => void;
  /** Devolva true para parar (o que já foi achado é devolvido). */
  shouldStop?: () => boolean;
  /**
   * Piso de poda vindo de fora (ex.: o N-ésimo melhor que OUTRO worker já achou). Vale sem perda: se N conjuntos com
   * valor maior ou igual a ele existem, nenhum conjunto abaixo dele entra entre os N melhores.
   */
  floor?: () => number;
  /** Avisa quando o N-ésimo melhor muda (para repassar o piso aos outros workers). */
  onThreshold?: (value: number) => void;
  /** Divide o trabalho entre workers: este processa os padrões de índice `index` (módulo `count`). */
  partition?: { index: number; count: number };
}

/** Padrões que o inventário permite: um set só entra se tiver peças em posições suficientes. */
export function allPatterns(slots: readonly Piece[][], onlySets?: ReadonlySet<string>, fullBonus = false): Pattern[] {
  const slotsOf = new Map<string, Set<number>>();
  slots.forEach((list, i) => {
    for (const p of list) {
      if (onlySets && !onlySets.has(p.set)) continue;
      if (!slotsOf.has(p.set)) slotsOf.set(p.set, new Set());
      slotsOf.get(p.set)!.add(i);
    }
  });
  const names = [...slotsOf.keys()].sort();
  // `fullBonus`: o usuário marcou sets, então o build tem que dar o bônus completo deles (4 peças ou 2+2), sem "sem set" nem 2 peças soltas.
  const out: Pattern[] = fullBonus && names.length ? [] : [{ kind: 'none', sets: [] }];
  for (const x of names) {
    const n = slotsOf.get(x)!.size;
    if (n >= 4) out.push({ kind: 'four', sets: [x] });
    if (n >= 2 && !fullBonus) out.push({ kind: 'two', sets: [x] });
  }
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      if (slotsOf.get(names[i])!.size >= 2 && slotsOf.get(names[j])!.size >= 2) out.push({ kind: 'two-two', sets: [names[i], names[j]] });
    }
  }
  return out;
}

/**
 * Tira as peças que `topN` outras da MESMA posição e do MESMO set igualam ou superam em todos os stats. Em empate
 * total só a de menor índice domina, para não eliminar as duas.
 */
export function pruneDominated(slots: readonly Piece[][], topN: number): { slots: Piece[][]; removed: number } {
  let removed = 0;
  const out = slots.map((list) => {
    const bySet = new Map<string, Piece[]>();
    for (const p of list) {
      if (!bySet.has(p.set)) bySet.set(p.set, []);
      bySet.get(p.set)!.push(p);
    }
    const kept: Piece[] = [];
    for (const group of bySet.values()) {
      for (const p of group) {
        let better = 0;
        for (const q of group) {
          if (q === p) continue;
          if (dominates(q.vec, p.vec) && (!dominates(p.vec, q.vec) || q.index < p.index)) {
            better++;
            if (better >= topN) break;
          }
        }
        if (better >= topN) removed++;
        else kept.push(p);
      }
    }
    return kept;
  });
  return { slots: out, removed };
}

interface Candidate {
  piece: Piece;
  /** 0 = set X, 1 = set Y, 2 = outro set. */
  role: 0 | 1 | 2;
}

/** Uma região do espaço de busca com regras de contagem simples. */
interface Variant {
  /** As listas já passaram pela dominância só nos stats relevantes. */
  masked?: boolean;
  /** Como agrupar as candidatas para comparar dominância (peças de grupos diferentes nunca se comparam). */
  groupOf?: (c: Candidate) => string;
  pattern: Pattern;
  config: SetConfig;
  lists: Candidate[][];
  /** Os sets "de fora" têm de ser todos diferentes (2 peças e sem set). */
  distinctOthers: boolean;
  /** 2 + 2: cada um dos dois sets precisa de 2 ou 3 peças. */
  countXY: boolean;
}

const keyOf = (pieces: readonly Piece[]) => pieces.map((p) => p.index).join('.');

/** Remove de `cands` as peças que `topN` outras do mesmo grupo igualam ou superam. `group` define o que se compara entre si. */
function pruneGroup(cands: Candidate[], topN: number, group: (c: Candidate) => string, mask?: boolean[]): Candidate[] {
  const dom = (a: Vec, b: Vec) => {
    for (let i = 0; i < DIMS; i++) if ((!mask || mask[i]) && a[i] < b[i] - 1e-12) return false;
    return true;
  };
  const groups = new Map<string, Candidate[]>();
  for (const c of cands) {
    const g = group(c);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(c);
  }
  const keep: Candidate[] = [];
  for (const list of groups.values()) {
    for (const c of list) {
      let better = 0;
      for (const o of list) {
        if (o === c) continue;
        if (dom(o.piece.vec, c.piece.vec) && (!dom(c.piece.vec, o.piece.vec) || o.piece.index < c.piece.index)) {
          better++;
          if (better >= topN) break;
        }
      }
      if (better < topN) keep.push(c);
    }
  }
  return keep;
}

/** Divide um padrão em variantes (ver o comentário do arquivo). */
function variantsOf(pattern: Pattern, slots: readonly Piece[][], topN: number): Variant[] {
  const config = patternConfig(pattern);
  const [X, Y] = pattern.sets;
  const cand = (piece: Piece): Candidate => ({ piece, role: piece.set === X ? 0 : piece.set === Y ? 1 : 2 });
  const all = slots.map((l) => l.map(cand));
  const ofSet = (i: number, set: string) => all[i].filter((c) => c.piece.set === set);
  const out: Variant[] = [];
  const push = (v: Variant) => {
    if (v.lists.every((l) => l.length > 0)) out.push(v);
  };

  if (pattern.kind === 'four') {
    for (let off = 0; off < 5; off++) {
      // a peça extra é de qualquer set; sem dominância entre sets (só uma peça de fora entra)
      const extra = pruneGroup(all[off], topN, (c) => (c.role === 0 ? 'X' : 'other'));
      push({ pattern, config, distinctOthers: false, countXY: false, groupOf: (c) => (c.role === 0 ? 'X' : 'other'), lists: all.map((l, i) => (i === off ? extra : ofSet(i, X))) });
    }
  } else if (pattern.kind === 'two-two') {
    const xy = (i: number) => all[i].filter((c) => c.role !== 2);
    const g2 = (c: Candidate) => (c.role === 0 ? 'X' : c.role === 1 ? 'Y' : 'other');
    push({ pattern, config, distinctOthers: false, countXY: true, groupOf: g2, lists: all.map((_, i) => xy(i)) });
    for (let off = 0; off < 5; off++) {
      const extra = pruneGroup(all[off], topN, (c) => (c.role === 0 ? 'X' : c.role === 1 ? 'Y' : 'other'));
      push({ pattern, config, distinctOthers: false, countXY: true, groupOf: g2, lists: all.map((_, i) => (i === off ? extra : xy(i))) });
    }
  } else if (pattern.kind === 'two') {
    // quais 2 ou 3 posições levam X; nas outras só entram peças de outros sets, todos diferentes
    for (let mask = 0; mask < 32; mask++) {
      const n = [0, 1, 2, 3, 4].filter((i) => mask & (1 << i)).length;
      if (n < 2 || n > 3) continue;
      push({ pattern, config, distinctOthers: true, countXY: false, groupOf: (c) => (c.role === 2 ? c.piece.set : 'X'), lists: all.map((l, i) => (mask & (1 << i) ? l.filter((c) => c.role === 0) : l.filter((c) => c.role === 2))) });
    }
  } else {
    push({ pattern, config, distinctOthers: true, countXY: false, groupOf: (c) => c.piece.set, lists: all });
  }
  return out;
}

/** Roda o solver até o fim, sem ceder o controle (testes e uso síncrono). */
export function solve(options: SolveOptions): { builds: Build[]; stats: SolveStats } {
  const g = solveSteps(options);
  let r = g.next();
  while (!r.done) r = g.next();
  return r.value;
}

/**
 * O mesmo solver como gerador: cede o controle (`yield`) a cada poucas centenas de avaliações, para o worker poder
 * atualizar o piso de poda, receber o pedido de parar e informar o progresso.
 */
export function* solveSteps(options: SolveOptions): Generator<void, { builds: Build[]; stats: SolveStats }, void> {
  const topN = options.topN ?? 5;
  const { evaluate } = options;
  const dom = pruneDominated(options.slots, topN);
  const slots = dom.slots;
  let patterns = options.patterns ?? allPatterns(slots);
  if (options.partition) patterns = patterns.filter((_, i) => i % options.partition!.count === options.partition!.index);
  const stats: SolveStats = { evaluations: 0, dominated: dom.removed, patterns: 0, patternsDone: 0, stopped: false };

  const best: Build[] = [];
  const seen = new Set<string>();
  const eps = 1 + Math.max(0, options.epsilon ?? 0);
  const threshold = () => Math.max(best.length >= topN ? best[best.length - 1].value * eps : -Infinity, options.floor?.() ?? -Infinity);
  const insert = (b: Build) => {
    const key = keyOf(b.pieces);
    if (seen.has(key)) return;
    seen.add(key);
    best.push(b);
    best.sort((x, y) => y.value - x.value);
    if (best.length > topN) best.length = topN;
    if (best.length >= topN) options.onThreshold?.(best[best.length - 1].value);
  };
  for (const seed of options.seeds ?? []) if (Number.isFinite(seed.value)) insert(seed);

  const evalCount = (vec: Vec, config: SetConfig) => {
    stats.evaluations++;
    return evaluate(vec, config);
  };
  let sinceYield = 0;
  function* tick(): Generator<void, void, void> {
    if (++sinceYield < 200) return;
    sinceYield = 0;
    options.onProgress?.(stats, best[0]?.value ?? -Infinity);
    if (options.shouldStop?.()) stats.stopped = true;
    yield;
  }

  // Nós da busca: uma variante de set com as posições de main stat já fixadas ou não. O nó mais promissor (maior
  // limite superior) sai primeiro; um nó cujo limite não passa do limiar morre sem ser aberto. Fixar o main stat de
  // areia, cálice e tiara ANTES de escolher peças tira da "peça virtual" a mistura de mains que não existe de verdade.
  interface Prepared {
    variant: Variant;
    order: number[];
    ordered: Candidate[][];
    suffix: Vec[];
    bound: number;
  }
  const prepare = (variant: Variant): Prepared => {
    const order = [0, 1, 2, 3, 4].sort((a, b) => variant.lists[a].length - variant.lists[b].length || a - b);
    const ordered = order.map((i) => variant.lists[i]);
    // suffix[d] = soma, das posições d em diante, do máximo de cada stat (a "peça virtual").
    const suffix: Vec[] = Array.from({ length: 6 }, () => new Float64Array(DIMS));
    for (let d = 4; d >= 0; d--) {
      const m = new Float64Array(DIMS).fill(-Infinity);
      for (const c of ordered[d]) for (let i = 0; i < DIMS; i++) if (c.piece.vec[i] > m[i]) m[i] = c.piece.vec[i];
      for (let i = 0; i < DIMS; i++) suffix[d][i] = suffix[d + 1][i] + m[i];
    }
    return { variant, order, ordered, suffix, bound: evalCount(suffix[0], variant.config) };
  };
  /** Posição (2 a 4) com mais de um main stat nas candidatas, ou -1 se todas já estão fixadas. */
  const splittable = (v: Variant): number => {
    for (const slot of [2, 3, 4]) {
      const groups = new Set(v.lists[slot].map((c) => c.piece.group ?? ''));
      if (groups.size > 1) return slot;
    }
    return -1;
  };

  const maskCache = new Map<string, boolean[]>();
  const queue: Prepared[] = [];
  const push = (p: Prepared) => {
    if (p.bound <= threshold()) return;
    // inserção ordenada (maior primeiro)
    let lo = 0;
    let hi = queue.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (queue[mid].bound >= p.bound) lo = mid + 1;
      else hi = mid;
    }
    queue.splice(lo, 0, p);
  };
  for (const pattern of patterns) {
    for (const variant of variantsOf(pattern, slots, topN)) {
      stats.patterns++;
      push(prepare(variant));
    }
  }

  while (queue.length && !stats.stopped) {
    yield* tick();
    const prep = queue.shift()!;
    if (prep.bound <= threshold()) break; // a fila está ordenada: o resto também não passa
    const { variant, order, ordered, suffix } = prep;
    if (!variant.masked && options.relevantDims && variant.groupOf) {
      // dominância só nos stats que importam para este bônus de set; as listas encolhem e o limite aperta
      const key = `${variant.config.primarySet ?? ''}|${variant.config.secondarySet ?? ''}|${variant.config.fourPiece === false ? 'two' : 'four'}`;
      let mask = maskCache.get(key);
      if (!mask) {
        mask = options.relevantDims(variant.config);
        maskCache.set(key, mask);
      }
      const lists = variant.lists.map((l) => pruneGroup(l, topN, variant.groupOf!, mask));
      if (lists.every((l) => l.length > 0)) push(prepare({ ...variant, lists, masked: true }));
      continue;
    }
    const split = splittable(variant);
    if (split >= 0) {
      const byGroup = new Map<string, Candidate[]>();
      for (const c of variant.lists[split]) {
        const g = c.piece.group ?? '';
        if (!byGroup.has(g)) byGroup.set(g, []);
        byGroup.get(g)!.push(c);
      }
      for (const list of byGroup.values()) {
        const lists = variant.lists.map((l, i) => (i === split ? list : l));
        push(prepare({ ...variant, lists }));
      }
      stats.patterns += byGroup.size - 1;
      continue;
    }
    const evalsBefore = stats.evaluations;
    const sizes = ordered.map((l) => l.length);
    const chosen: Piece[] = new Array(5);
    const sum = new Float64Array(DIMS);
    const tmp = new Float64Array(DIMS);
    const usedOther: string[] = [];

    const feasible = (nx: number, ny: number, remaining: number, distinct: boolean): boolean => {
      if (!distinct) return false;
      if (variant.countXY) return nx <= 3 && ny <= 3 && Math.max(0, 2 - nx) + Math.max(0, 2 - ny) <= remaining;
      return true;
    };

    const dfs = function* (d: number, nx: number, ny: number): Generator<void, void, void> {
      const remaining = 5 - d - 1;
      const kids: { c: Candidate; bound: number }[] = [];
      for (const c of ordered[d]) {
        const nx2 = nx + (c.role === 0 ? 1 : 0);
        const ny2 = ny + (c.role === 1 ? 1 : 0);
        const distinct = !variant.distinctOthers || c.role !== 2 || !usedOther.includes(c.piece.set);
        if (!feasible(nx2, ny2, remaining, distinct)) continue;
        const v = c.piece.vec;
        const s = suffix[d + 1];
        for (let i = 0; i < DIMS; i++) tmp[i] = sum[i] + v[i] + s[i];
        const bound = evalCount(tmp, variant.config);
        if (bound <= threshold()) continue;
        kids.push({ c, bound });
        yield* tick();
        if (stats.stopped) return;
      }
      kids.sort((a, b) => b.bound - a.bound);
      for (const { c, bound } of kids) {
        if (stats.stopped) return;
        if (bound <= threshold()) break; // o limiar subiu e as outras filhas (ordenadas) também não passam
        const nx2 = nx + (c.role === 0 ? 1 : 0);
        const ny2 = ny + (c.role === 1 ? 1 : 0);
        chosen[d] = c.piece;
        if (d === 4) {
          const ok = !variant.countXY || (nx2 >= 2 && nx2 <= 3 && ny2 >= 2 && ny2 <= 3);
          if (ok) {
            const pieces = order.map((slot, j) => ({ slot, piece: chosen[j] })).sort((a, b) => a.slot - b.slot).map((x) => x.piece);
            insert({ pieces, value: bound, config: variant.config });
          }
          continue;
        }
        for (let i = 0; i < DIMS; i++) sum[i] += c.piece.vec[i];
        if (c.role === 2) usedOther.push(c.piece.set);
        yield* dfs(d + 1, nx2, ny2);
        if (c.role === 2) usedOther.pop();
        for (let i = 0; i < DIMS; i++) sum[i] -= c.piece.vec[i];
      }
    };
    yield* dfs(0, 0, 0);
    stats.patternsDone++;
    options.onPattern?.({ pattern: variant.pattern, sizes, evaluations: stats.evaluations - evalsBefore, bound: prep.bound, skipped: false });
    options.onProgress?.(stats, best[0]?.value ?? -Infinity);
  }
  return { builds: best, stats };
}

/** Força bruta: todos os conjuntos, com o config tirado das próprias peças. Só para testes e inventários pequenos. */
export function bruteForce(slots: readonly Piece[][], evaluate: Evaluate, topN = 5): Build[] {
  const out: Build[] = [];
  const sum = new Float64Array(DIMS);
  const pick: Piece[] = new Array(5);
  const rec = (d: number) => {
    if (d === 5) {
      sum.fill(0);
      for (const p of pick) for (let i = 0; i < DIMS; i++) sum[i] += p.vec[i];
      const config = configOfPieces(pick);
      out.push({ pieces: [...pick], value: evaluate(sum, config), config });
      return;
    }
    for (const p of slots[d]) {
      pick[d] = p;
      rec(d + 1);
    }
  };
  rec(0);
  return out.filter((b) => Number.isFinite(b.value)).sort((a, b) => b.value - a.value).slice(0, topN);
}
