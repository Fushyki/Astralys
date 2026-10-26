/**
 * Otimizador de artefatos: filtros do inventário GOOD (como as configurações do Genshin Optimizer), solver exato e
 * relatório de cada build. Tudo puro (roda na thread principal ou no worker).
 */
import { GoodSchema, loadoutFromPieces, norm, type Good, type GoodArtifact, type Loadout } from '../good/goodImport';
import type { Element } from '../../data/schema';
import type { GameData } from '../../engine';
import { createEvaluator, elementOf, type BuildReport, type Constraints, type EvaluatorInput, type Objective } from './evaluator';
import { allPatterns, patternLabel, solveSteps, type Build, type Piece, type SetConfig, type SolveOptions, type SolveStats } from './solver';
import { addInto, pieceLevel, pieceVector, DIM, DIMS, SLOT_ORDER, type SlotKey } from './vector';

export { GoodSchema };

/** Configuração do usuário (equivale ao "OptConfig" do Genshin Optimizer). */
export interface OptimizerConfig {
  /** Faixa de nível das peças que entram (0 a 20). */
  levelMin: number;
  levelMax: number;
  /** Main stats permitidos em areia, cálice e tiara (chaves GOOD, ex.: "atk_", "eleMas", "pyro_dmg_"). Vazio/ausente = todos. */
  mainStats: Partial<Record<'sands' | 'goblet' | 'circlet', string[]>>;
  /** Sets que podem dar bônus (chaves GOOD). Ausente = todos. */
  allowedSets?: string[];
  /**
   * Peças de sets fora de `allowedSets` continuam valendo como peça extra, sem bônus (padrão). Com `false` elas saem do
   * inventário e a busca só usa peças dos sets permitidos (isso força 5 peças do mesmo set quando só um está marcado).
   */
  fillerSets?: boolean;
  /** Peças que estão em outros personagens: 'none' (padrão), 'all' ou a lista das chaves dos personagens que "emprestam". */
  borrowFrom: 'none' | 'all' | string[];
  /** Quantos builds devolver. */
  topN: number;
  /** Tolerância da busca (0 = exata). */
  epsilon?: number;
  objective: Objective;
  constraints: Constraints;
}

export const DEFAULT_CONFIG: OptimizerConfig = {
  levelMin: 0,
  levelMax: 20,
  mainStats: {},
  borrowFrom: 'none',
  topN: 5,
  objective: { kind: 'team' },
  constraints: {},
};

export interface FilteredInventory {
  /** Peças que entram na busca, na ordem de `Piece.index`. */
  artifacts: GoodArtifact[];
  slots: Piece[][];
  /** Quantas peças cada filtro tirou (para explicar ao usuário). */
  removed: { level: number; main: number; set: number; equippedByOthers: number };
  /** Peças que o personagem tem equipadas (cada posição), se tiver as 5. */
  equipped: GoodArtifact[] | null;
  /** Nomes dos sets que podem dar bônus (undefined = todos): restringe os padrões de set do solver. */
  onlySets?: Set<string>;
}

export function filterInventory(good: Good, characterKey: string, element: Element, config: OptimizerConfig, setName: (key: string) => string): FilteredInventory {
  const removed = { level: 0, main: 0, set: 0, equippedByOthers: 0 };
  const mine = norm(characterKey);
  const artifacts: GoodArtifact[] = [];
  const slots: Piece[][] = [[], [], [], [], []];
  const allowedSets = config.allowedSets ? new Set(config.allowedSets.map(norm)) : undefined;
  const strictSets = config.fillerSets === false;

  for (const a of good.artifacts) {
    if (a.rarity < 4) continue;
    const level = pieceLevel(a);
    if (level < config.levelMin || level > config.levelMax) { removed.level++; continue; }
    const loc = norm(a.location);
    if (loc !== '' && loc !== mine) {
      const borrowed = config.borrowFrom === 'all' || (Array.isArray(config.borrowFrom) && config.borrowFrom.some((k) => norm(k) === loc));
      if (!borrowed) { removed.equippedByOthers++; continue; }
    }
    if (allowedSets && strictSets && !allowedSets.has(norm(a.setKey))) { removed.set++; continue; }
    const slot = a.slotKey as SlotKey;
    if (slot === 'sands' || slot === 'goblet' || slot === 'circlet') {
      const allowed = config.mainStats[slot];
      if (allowed && allowed.length && !allowed.includes(a.mainStatKey)) { removed.main++; continue; }
    }
    const index = artifacts.length;
    artifacts.push(a);
    slots[SLOT_ORDER.indexOf(slot)].push({
      index, slot: SLOT_ORDER.indexOf(slot), set: setName(a.setKey), vec: pieceVector(a, element),
      group: slot === 'sands' || slot === 'goblet' || slot === 'circlet' ? a.mainStatKey : undefined,
    });
  }
  const eq = good.artifacts.filter((a) => norm(a.location) === mine);
  const bySlot = Object.fromEntries(eq.map((a) => [a.slotKey, a]));
  const equipped = SLOT_ORDER.every((s) => bySlot[s]) ? SLOT_ORDER.map((s) => bySlot[s]) : null;
  const onlySets = allowedSets && !strictSets ? new Set(good.artifacts.filter((a) => allowedSets.has(norm(a.setKey))).map((a) => setName(a.setKey))) : undefined;
  return { artifacts, slots, removed, equipped, onlySets };
}

export interface OptimizedBuild {
  /** Identifica o conjunto (índices das peças no inventário filtrado): igual entre os workers. */
  key: string;
  pieces: GoodArtifact[];
  config: SetConfig;
  /** Texto do bônus de set (ex.: "4 peças de Obsidian Codex"). */
  setLabel: string;
  report: BuildReport;
  /** O que o motor precisa para "Equipar" (main stats, sets e rolls). */
  loadout: Loadout;
}

export interface OptimizerResult {
  builds: OptimizedBuild[];
  /** Build que o personagem usa hoje (null se não tem as 5 peças no inventário). */
  equipped: OptimizedBuild | null;
  inventory: Pick<FilteredInventory, 'removed'> & { pieces: number };
  stats: SolveStats & { combinations: number };
  stopped: boolean;
  /** O build equipado usa peças que os filtros (nível, main stat, set, dono) deixam de fora: ele não entra na busca. */
  equippedOutside: boolean;
}

export interface RunInput extends Omit<EvaluatorInput, 'objective' | 'constraints'> {
  good: Good;
  characterKey: string;
  config: OptimizerConfig;
  onProgress?: (s: SolveStats, best: number) => void;
  onPattern?: SolveOptions['onPattern'];
  shouldStop?: () => boolean;
}

/** Build com exatamente uma peça em cada uma das 5 posições. */
export const isComplete = (b: Pick<Build, 'pieces'>): boolean =>
  b.pieces.length === SLOT_ORDER.length && SLOT_ORDER.every((_, i) => b.pieces.some((p) => p.slot === i));

function patternOf(config: SetConfig): { kind: 'four' | 'two-two' | 'two' | 'none'; sets: string[] } {
  if (config.primarySet && config.secondarySet) return { kind: 'two-two', sets: [config.primarySet, config.secondarySet] };
  if (config.primarySet && config.fourPiece === false) return { kind: 'two', sets: [config.primarySet] };
  if (config.primarySet) return { kind: 'four', sets: [config.primarySet] };
  return { kind: 'none', sets: [] };
}

export interface RunHandle {
  /** Conduza com `for (const _ of steps)` (cada passo é um ponto em que dá para ceder o controle). */
  steps: Generator<void, void, void>;
  /** Resultado (vale depois de `steps` terminar, ou parcial se parou). */
  result: () => OptimizerResult;
}

export interface RunControl {
  partition?: { index: number; count: number };
  floor?: () => number;
  onThreshold?: (value: number) => void;
}

/** Como `runOptimizer`, mas em passos, para o worker ceder o controle e dividir a busca. */
export function startOptimizer(input: RunInput, control: RunControl = {}): RunHandle {
  const { good, game } = input;
  const element = elementOf(input.resolved, input.member);
  const setName = (key: string) => game.artifacts.find((x) => norm(x.name) === norm(key))?.name ?? key;
  const inv = filterInventory(good, input.characterKey, element, input.config, setName);
  // Só builds completos: sem peça em alguma posição não há build (nada de builds parciais).
  const empty = SLOT_ORDER.filter((_, i) => inv.slots[i].length === 0);
  if (empty.length) throw new Error(`Depois dos filtros não sobrou nenhuma peça para: ${empty.join(', ')}. O otimizador só monta builds com as 5 peças.`);

  const evaluator = createEvaluator({ ...input, objective: input.config.objective, constraints: input.config.constraints });
  const reportOf = (pieces: GoodArtifact[], config: SetConfig): OptimizedBuild => {
    const key = pieces.map((a) => inv.artifacts.indexOf(a)).join('.');
    const vec = new Float64Array(DIMS);
    for (const a of pieces) addInto(vec, pieceVector(a, element));
    const report = evaluator.report(vec, config);
    return { key, pieces, config, setLabel: patternLabel(patternOf(config)), report, loadout: loadoutFromPieces(pieces, game) };
  };

  // O build equipado, se as peças dele passam nos filtros, já sobe o limiar de poda.
  const seeds: Build[] = [];
  if (inv.equipped) {
    const flat = inv.slots.flat();
    const pieces = inv.equipped.map((a) => flat.find((p) => inv.artifacts[p.index] === a));
    if (pieces.every((p): p is Piece => !!p)) {
      const vec = new Float64Array(DIMS);
      for (const p of pieces) addInto(vec, p.vec);
      const cfg = loadoutFromPieces(inv.equipped, game);
      const config = { primarySet: cfg.primarySet, secondarySet: cfg.secondarySet, fourPiece: cfg.fourPiece };
      const providers = [config.primarySet, config.secondarySet].filter((x): x is string => !!x).map(setName);
      // O equipado só entra como ponto de partida se o bônus dele vem de sets permitidos.
      const full = !!config.secondarySet || (!!config.primarySet && config.fourPiece !== false);
      if (!inv.onlySets || (full && providers.every((x) => inv.onlySets!.has(x)))) seeds.push({ pieces, config, value: evaluator.evaluate(vec, config) });
    }
  }

  // Stats que influenciam o valor: sensibilidade numérica em 3 pontos (zero, meio e máximo do inventário), por bônus de set,
  // somando os stats que as restrições mínimas usam. Um stat sem efeito nos 3 pontos sai da comparação de dominância.
  const maxSum = new Float64Array(DIMS);
  for (const list of inv.slots) {
    const m = new Float64Array(DIMS);
    for (const p of list) for (let i = 0; i < DIMS; i++) if (p.vec[i] > m[i]) m[i] = p.vec[i];
    for (let i = 0; i < DIMS; i++) maxSum[i] += m[i];
  }
  const c = input.config.constraints;
  const constrained = new Set<number>();
  if (c.er !== undefined) constrained.add(DIM.er);
  if (c.cr !== undefined) constrained.add(DIM.cr);
  if (c.cd !== undefined) constrained.add(DIM.cd);
  if (c.em !== undefined) constrained.add(DIM.em);
  if (c.hp !== undefined) [DIM.hpFlat, DIM.hpPct].forEach((d) => constrained.add(d));
  if (c.atk !== undefined) [DIM.atkFlat, DIM.atkPct].forEach((d) => constrained.add(d));
  if (c.def !== undefined) [DIM.defFlat, DIM.defPct].forEach((d) => constrained.add(d));
  const relevantDims = (config: SetConfig): boolean[] =>
    Array.from({ length: DIMS }, (_, d) => {
      if (constrained.has(d)) return true;
      if (maxSum[d] <= 0) return false;
      for (const k of [0, 0.5, 1]) {
        const a = new Float64Array(DIMS);
        for (let i = 0; i < DIMS; i++) a[i] = maxSum[i] * k;
        const b = Float64Array.from(a);
        b[d] += maxSum[d];
        const fa = evaluator.evaluate(a, config);
        const fb = evaluator.evaluate(b, config);
        if (fa !== fb && !(Math.abs(fb - fa) <= 1e-9 * Math.max(1, Math.abs(fa)))) return true;
      }
      return false;
    });

  const gen = solveSteps({
    epsilon: input.config.epsilon,
    relevantDims,
    seeds,
    slots: inv.slots,
    evaluate: evaluator.evaluate,
    topN: input.config.topN,
    patterns: allPatterns(inv.slots, inv.onlySets, !!inv.onlySets),
    onProgress: input.onProgress,
    onPattern: input.onPattern,
    shouldStop: input.shouldStop,
    partition: control.partition,
    floor: control.floor,
    onThreshold: control.onThreshold,
  });
  let solved: { builds: Build[]; stats: SolveStats } | undefined;
  let latest = seeds;
  function* steps(): Generator<void, void, void> {
    let r = gen.next();
    while (!r.done) {
      yield;
      r = gen.next();
    }
    solved = r.value;
  }

  const toBuild = (b: Build) => reportOf(b.pieces.map((p) => inv.artifacts[p.index]), b.config);
  let equipped: OptimizedBuild | null = null;
  if (inv.equipped) {
    const vec = new Float64Array(DIMS);
    for (const a of inv.equipped) addInto(vec, pieceVector(a, element));
    const cfg = loadoutFromPieces(inv.equipped, game);
    equipped = reportOf(inv.equipped, { primarySet: cfg.primarySet, secondarySet: cfg.secondarySet, fourPiece: cfg.fourPiece });
  }
  const equippedOutside = !!inv.equipped && !inv.equipped.every((a) => inv.artifacts.includes(a));
  const combinations = inv.slots.reduce((n, l) => n * Math.max(1, l.length), 1);
  void latest;
  const result = (): OptimizerResult => {
    const done = solved ?? { builds: seeds, stats: { evaluations: 0, dominated: 0, patterns: 0, patternsDone: 0, stopped: true } };
    return {
      builds: done.builds.filter(isComplete).map(toBuild),
      equipped,
      inventory: { removed: inv.removed, pieces: inv.artifacts.length },
      stats: { ...done.stats, combinations },
      stopped: done.stats.stopped,
      equippedOutside,
    };
  };
  return { steps: steps(), result };
}

/**
 * O build que o personagem usa hoje (as peças do inventário com o nome dele, uma por posição), avaliado com o MESMO avaliador
 * da busca: dá o "Build atual" sem rodar a busca e bate com o `equipped` do resultado. Sem nenhuma peça, null.
 */
export function evaluateEquipped(input: RunInput, own?: readonly GoodArtifact[]): OptimizedBuild | null {
  const { good, game } = input;
  const mine = norm(input.characterKey);
  const element = elementOf(input.resolved, input.member);
  // `own`: as peças que o projeto já aplicou ao personagem; sem elas valem as do inventário com o nome dele.
  const source = own?.length ? [...own] : good.artifacts.filter((a) => a.rarity >= 4 && norm(a.location) === mine);
  const pieces = SLOT_ORDER.map((slot) => source.find((a) => a.slotKey === slot)).filter((a): a is GoodArtifact => !!a);
  if (pieces.length === 0) return null;
  const evaluator = createEvaluator({ ...input, objective: input.config.objective, constraints: input.config.constraints });
  const vec = new Float64Array(DIMS);
  for (const a of pieces) addInto(vec, pieceVector(a, element));
  const loadout = loadoutFromPieces(pieces, game);
  const config: SetConfig = { primarySet: loadout.primarySet, secondarySet: loadout.secondarySet, fourPiece: loadout.fourPiece };
  return { key: 'equipado', pieces, config, setLabel: patternLabel(patternOf(config)), report: evaluator.report(vec, config), loadout };
}

export function runOptimizer(input: RunInput): OptimizerResult {
  const h = startOptimizer(input);
  for (const _ of h.steps) void _;
  return h.result();
}

/** Peças do GOOD que o personagem pode usar, por posição (para mostrar a contagem antes de buscar). */
export function countCandidates(good: Good, characterKey: string, element: Element, config: OptimizerConfig, game: Pick<GameData, 'artifacts'>) {
  const setName = (key: string) => game.artifacts.find((x) => norm(x.name) === norm(key))?.name ?? key;
  const inv = filterInventory(good, characterKey, element, config, setName);
  return { perSlot: inv.slots.map((l) => l.length), removed: inv.removed, total: inv.artifacts.length };
}
