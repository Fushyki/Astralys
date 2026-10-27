/**
 * Operações puras sobre o projeto (sem React, sem estado). Sempre devolvem um projeto NOVO; nunca mutam.
 * O estado (Zustand) só orquestra histórico e persistência em cima disto.
 */
import { effectiveDuration, type ExtraBuff, type ActionRef, type BuffWindow, type MoveRef, type RotationProject } from '../../engine';

const MIN_EXECUTIONS = 1;

const touch = (p: RotationProject): RotationProject => ({ ...p, meta: { ...p.meta, updatedAt: new Date().toISOString() } });

/** Gera um id de ação que ainda não existe no projeto: a1, a2, ... */
export function nextActionId(project: RotationProject): string {
  const used = new Set(project.actions.map((a) => a.id));
  for (let n = project.actions.length + 1; ; n++) {
    const id = `a${n}`;
    if (!used.has(id)) return id;
  }
}

export const clampTime = (t: number) => (Number.isFinite(t) ? Math.max(0, Math.round(t * 100) / 100) : 0);

export interface NewAction {
  member: number;
  move: MoveRef;
  time: number;
  displayName?: string;
  executions?: number;
  reaction?: ActionRef['reaction'];
  activeTags?: string[];
  /** Pontos do recurso do golpe (Espírito Lutador): ver `ActionRef.points`. */
  points?: number;
}

export function addAction(project: RotationProject, input: NewAction): RotationProject {
  const member = project.members[input.member];
  if (!member) throw new RangeError(`Membro ${input.member} não existe na equipe.`);
  if (member.character !== input.move.character) {
    throw new Error(`O golpe é de ${input.move.character}, mas o membro ${input.member} é ${member.character}.`);
  }
  const action: ActionRef = {
    id: nextActionId(project),
    member: input.member,
    move: { ...input.move, variant: input.move.variant ?? 0 },
    displayName: input.displayName,
    executions: Math.max(MIN_EXECUTIONS, input.executions ?? 1),
    reaction: input.reaction ?? 'none',
    activeTags: input.activeTags ?? [],
    ...(input.points !== undefined ? { points: input.points } : {}),
    // Ações novas seguem as janelas de buff: arrastar no tempo muda os buffs que valem.
    tagSource: 'windows',
    dmgAdjust: 0,
    time: clampTime(input.time),
  };
  return touch({ ...project, actions: [...project.actions, action] });
}

export function updateAction(project: RotationProject, id: string, patch: Partial<Omit<ActionRef, 'id'>>): RotationProject {
  if (!project.actions.some((a) => a.id === id)) return project;
  const next = {
    ...patch,
    ...(patch.time !== undefined ? { time: clampTime(patch.time) } : {}),
    ...(patch.executions !== undefined ? { executions: Math.max(MIN_EXECUTIONS, patch.executions) } : {}),
  };
  const actions = project.actions.map((a) => (a.id === id ? { ...a, ...next } : a));
  return touch({ ...project, actions, buffWindows: followAnchors(project.buffWindows, actions, new Set([id])) });
}

/** Buff de teste (editor de build): sempre ligado, para um personagem ou todos. */
export function addExtra(project: RotationProject, extra: ExtraBuff): RotationProject {
  return touch({ ...project, extras: [...project.extras, extra] });
}

/** Remove um buff de teste; os interruptores (`disabled`) dos que vinham depois seguem o novo número. */
export function removeExtra(project: RotationProject, index: number): RotationProject {
  if (index < 0 || index >= project.extras.length) return project;
  const renum = (id: string) => id.replace(/(m\d+:extra-|^extra-)(\d+)(@.*)?$/, (all, pre: string, n: string, rest: string | undefined) => {
    const k = Number(n);
    return k === index ? '' : `${pre}${k > index ? k - 1 : k}${rest ?? ''}`;
  });
  const disabled = project.disabled.map(renum).filter(Boolean);
  return touch({ ...project, extras: project.extras.filter((_, i) => i !== index), disabled });
}

/** Quantos golpes um buff de dano fixo atinge: um número, "all" (todos os golpes) ou undefined (volta ao do cadastro). */
export function setFlatStacks(project: RotationProject, id: string, value: number | 'all' | undefined): RotationProject {
  const next = { ...(project.flatStacks ?? {}) };
  if (value === undefined) delete next[id];
  else next[id] = value === 'all' ? 'all' : Math.max(1, Math.round(value));
  return touch({ ...project, flatStacks: next });
}

/** Janelas "Por golpe": começam `delay` s depois do golpe-gatilho e acompanham se ele mudar de lugar (a duração fica). */
function followAnchors(windows: BuffWindow[], actions: ActionRef[], moved: Set<string>): BuffWindow[] {
  return windows.map((w) => {
    if (!w.anchor || !moved.has(w.anchor.actionId)) return w;
    const trigger = actions.find((a) => a.id === w.anchor!.actionId);
    if (!trigger) return w;
    const start = clampTime(trigger.time + w.anchor.delay);
    const len = Math.max(MIN_WINDOW, w.end - w.start);
    return { ...w, start, end: clampTime(start + len) };
  });
}

export const moveAction = (project: RotationProject, id: string, time: number) => updateAction(project, id, { time });

export function removeAction(project: RotationProject, id: string): RotationProject {
  const gone = project.actions.find((a) => a.id === id);
  if (!gone) return project;
  const actions = project.actions.filter((a) => a.id !== id);
  const chains = { ...project.chains };
  if (gone.chainId && !actions.some((a) => a.chainId === gone.chainId)) delete chains[gone.chainId];
  const buffWindows = project.buffWindows.map((w) => (w.anchor?.actionId === id ? { ...w, anchor: undefined } : w));
  return touch({ ...project, actions, chains, buffWindows });
}

/** Duplica uma ação logo depois dela (+0,5 s). Devolve o projeto e o id da cópia. */
export function duplicateAction(project: RotationProject, id: string): { project: RotationProject; newId: string | null } {
  const src = project.actions.find((a) => a.id === id);
  if (!src) return { project, newId: null };
  const newId = nextActionId(project);
  const copy: ActionRef = { ...src, id: newId, chainId: undefined, time: clampTime(src.time + 0.5), activeTags: [...src.activeTags] };
  return { project: touch({ ...project, actions: [...project.actions, copy] }), newId };
}

export function renameProject(project: RotationProject, name: string): RotationProject {
  const trimmed = name.trim();
  return trimmed ? touch({ ...project, name: trimmed.slice(0, 120) }) : project;
}

/** Ações em ordem cronológica (estável nos empates). */
export const chronological = (project: RotationProject): ActionRef[] => [...project.actions].sort((a, b) => a.time - b.time);


// ---------- Janelas de buff ----------

export const MIN_WINDOW = 0.1;
export const DEFAULT_WINDOW = 4;

export function nextWindowId(project: RotationProject): string {
  const used = new Set(project.buffWindows.map((w) => w.id));
  for (let n = project.buffWindows.length + 1; ; n++) {
    const id = `w${n}`;
    if (!used.has(id)) return id;
  }
}

/** Nova janela da fonte `tag` começando em `start`, com `length` segundos. */
export function addWindow(project: RotationProject, tag: string, start: number, length = DEFAULT_WINDOW): RotationProject {
  const s = clampTime(start);
  const win: BuffWindow = { id: nextWindowId(project), tag, start: s, end: clampTime(s + Math.max(MIN_WINDOW, length)) };
  return touch({ ...project, buffWindows: [...project.buffWindows, win] });
}

/** Move/redimensiona uma janela garantindo início ≥ 0 e duração mínima. */
export function updateWindow(project: RotationProject, id: string, patch: { start?: number; end?: number }): RotationProject {
  const w = project.buffWindows.find((x) => x.id === id);
  if (!w) return project;
  const start = clampTime(patch.start ?? w.start);
  const end = Math.max(clampTime(patch.end ?? w.end), start + MIN_WINDOW);
  if (start === w.start && end === w.end) return project;
  return touch({ ...project, buffWindows: project.buffWindows.map((x) => (x.id === id ? { ...x, start, end: clampTime(end) } : x)) });
}

/** Desloca a janela inteira mantendo a duração. */
export function shiftWindow(project: RotationProject, id: string, start: number): RotationProject {
  const w = project.buffWindows.find((x) => x.id === id);
  if (!w) return project;
  const s = clampTime(start);
  return updateWindow(project, id, { start: s, end: s + (w.end - w.start) });
}

export function removeWindow(project: RotationProject, id: string): RotationProject {
  if (!project.buffWindows.some((w) => w.id === id)) return project;
  return touch({ ...project, buffWindows: project.buffWindows.filter((w) => w.id !== id) });
}

export function setTagSource(project: RotationProject, id: string, source: 'manual' | 'windows'): RotationProject {
  return updateAction(project, id, { tagSource: source });
}

/**
 * Converte as etiquetas manuais (perfis da planilha) em janelas: uma janela por TRECHO de golpes seguidos (na ordem
 * do tempo) que usam a etiqueta. Assim cada golpe continua com exatamente as mesmas etiquetas de antes, e o dano
 * não muda. Uma etiqueta usada em golpes separados por um golpe sem ela vira duas janelas.
 */
export function windowsFromProfiles(project: RotationProject): RotationProject {
  const manual = project.actions.filter((a) => a.tagSource === 'manual');
  if (manual.length === 0) return project;

  const ordered = chronological(project);
  const tags = [...new Set(manual.flatMap((a) => a.activeTags))].sort((x, y) => x.localeCompare(y));
  const has = (a: ActionRef, tag: string) => a.tagSource === 'manual' && a.activeTags.includes(tag);

  const derived = new Set(tags);
  let next: RotationProject = { ...project, buffWindows: project.buffWindows.filter((w) => !derived.has(w.tag)) };
  for (const tag of tags) {
    let i = 0;
    while (i < ordered.length) {
      if (!has(ordered[i], tag)) {
        i++;
        continue;
      }
      let j = i;
      while (j + 1 < ordered.length && has(ordered[j + 1], tag)) j++;
      const start = ordered[i].time;
      const last = ordered[j].time;
      const following = ordered[j + 1]?.time;
      const end = Math.max(Math.min(last + MIN_WINDOW, following ?? Infinity), last + 0.05);
      next = touch({ ...next, buffWindows: [...next.buffWindows, { id: nextWindowId(next), tag, start, end }] });
      i = j + 1;
    }
  }
  return touch({ ...next, actions: next.actions.map((a) => (a.tagSource === 'manual' ? { ...a, tagSource: 'windows' as const } : a)) });
}


// ---------- Realinhar ----------

export const DEFAULT_REALIGN_STEP = 0.5;
export const MIN_REALIGN_STEP = 0.1;

/**
 * Mapeia um instante antigo para o novo, de forma contínua e monótona: entre dois golpes interpola, antes do
 * primeiro e depois do último desloca igual ao primeiro/último. Assim uma janela de buff continua cobrindo
 * exatamente os mesmos golpes depois de realinhar.
 */
function makeWarp(oldTimes: number[], newTimes: number[]): (t: number) => number {
  // Golpes no mesmo instante antigo viram um único ponto de apoio (o primeiro).
  const knots: [number, number][] = [];
  oldTimes.forEach((o, i) => {
    if (knots.length === 0 || o > knots[knots.length - 1][0]) knots.push([o, newTimes[i]]);
  });
  return (t) => {
    if (knots.length === 0) return t;
    const [o0, n0] = knots[0];
    if (t <= o0) return n0 + (t - o0);
    const [oL, nL] = knots[knots.length - 1];
    if (t >= oL) return nL + (t - oL);
    for (let k = 1; k < knots.length; k++) {
      const [oa, na] = knots[k - 1];
      const [ob, nb] = knots[k];
      if (t <= ob) return na + ((t - oa) / (ob - oa)) * (nb - na);
    }
    return t;
  };
}

/**
 * Mantém a ORDEM atual dos golpes (pelo tempo em que foram colocados) e os redistribui um logo depois do outro,
 * sem espaços vazios nem sobreposição: o primeiro em `start`, os seguintes a cada `step` segundos.
 * As janelas de buff acompanham os golpes que cobriam. Se já estiver alinhado, devolve o mesmo projeto.
 */
export function realignActions(project: RotationProject, step = DEFAULT_REALIGN_STEP, start = 0): RotationProject {
  if (project.actions.length === 0) return project;
  const s = Math.max(MIN_REALIGN_STEP, Number.isFinite(step) ? step : DEFAULT_REALIGN_STEP);
  const origin = clampTime(start);

  const order = project.actions.map((a, i) => ({ a, i })).sort((x, y) => x.a.time - y.a.time || x.i - y.i);
  const newTime = new Map<string, number>();
  order.forEach(({ a }, k) => newTime.set(a.id, clampTime(origin + k * s)));

  const unchanged = project.actions.every((a) => newTime.get(a.id) === a.time);
  if (unchanged) return project;

  const warp = makeWarp(order.map(({ a }) => a.time), order.map(({ a }) => newTime.get(a.id)!));
  return touch({
    ...project,
    actions: project.actions.map((a) => ({ ...a, time: newTime.get(a.id)! })),
    buffWindows: project.buffWindows.map((w) => {
      const st = clampTime(warp(w.start));
      return { ...w, start: st, end: Math.max(clampTime(warp(w.end)), clampTime(st + MIN_WINDOW)) };
    }),
  });
}

/** Fim do último golpe, para ajustar a duração da rotação (0 se não há golpes). */
export const lastActionTime = (project: RotationProject): number => project.actions.reduce((m, a) => Math.max(m, a.time), 0);

// ---------- Cenário (inimigo e duração) ----------

type Config = RotationProject['config'];

/** Atualiza o cenário respeitando os limites do esquema; valores inválidos são ignorados. */
export function updateConfig(project: RotationProject, patch: Partial<Config>): RotationProject {
  const next: Config = { ...project.config };
  const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  if (num(patch.rotationDuration) && patch.rotationDuration > 0) {
    next.rotationDuration = Math.round(patch.rotationDuration * 100) / 100;
    next.durationManual = true;
  }
  if (patch.durationManual === false) next.durationManual = false;
  if (num(patch.enemyLevel)) next.enemyLevel = Math.min(200, Math.max(1, Math.round(patch.enemyLevel)));
  if (num(patch.characterLevel)) next.characterLevel = Math.min(100, Math.max(1, Math.round(patch.characterLevel)));
  if (num(patch.enemyBaseRes)) next.enemyBaseRes = Math.min(2, Math.max(-1, Math.round(patch.enemyBaseRes * 1000) / 1000));
  if (num(patch.enemyDefRed)) next.enemyDefRed = Math.min(0.9, Math.max(0, Math.round(patch.enemyDefRed * 1000) / 1000));
  if (num(patch.minRollsPerSubstat)) next.minRollsPerSubstat = Math.min(6, Math.max(0, Math.round(patch.minRollsPerSubstat)));
  if (JSON.stringify(next) === JSON.stringify(project.config)) return project;
  let out = touch({ ...project, config: next });
  // A duração escolhida manda: golpe contínuo que passa dela é cortado nela, e o que ia até o fim da rotação acompanha.
  if (next.rotationDuration !== project.config.rotationDuration && next.durationManual) {
    const was = effectiveDuration(project);
    const target = next.rotationDuration;
    for (const [id, c] of Object.entries(project.chains)) {
      const head = chainOf(out, id)[0];
      if (!head || !(c.until > target + 1e-9 || Math.abs(c.until - was) < 1e-9)) continue;
      out = rebuildChain(out, id, { start: head.time, every: c.every, until: Math.max(target, head.time + 0.01) });
    }
  }
  return out;
}


// ---------- Fontes desligadas ----------

/** Liga ou desliga uma fonte/buff (id do motor, ex.: "gear-3", "extra-0"). */
export function setSourceEnabled(project: RotationProject, id: string, enabled: boolean): RotationProject {
  const has = project.disabled.includes(id);
  if (enabled === !has) return project;
  return touch({ ...project, disabled: enabled ? project.disabled.filter((x) => x !== id) : [...project.disabled, id] });
}

/** Liga ou desliga o modo planilha (os 4 personagens da planilha só com os efeitos dela, para o gabarito bater). */
export function setCompat(project: RotationProject, compat: RotationProject['compat']): RotationProject {
  return project.compat === compat ? project : touch({ ...project, compat });
}

/** Qual interruptor de buff o usuário mexeu. */
export interface BuffToggle {
  /** Id gravado em `disabled`: o da fonte (estática) ou `<buff>@<Nome>` (buff de time só para quem recebe). */
  toggleId: string;
  /** Id do buff no motor (sem o `@Nome`). */
  baseId: string;
  /** Vem de arma/set de um membro com `gearManual` (começa desligado e o religar vai para `enabled`). */
  gear: boolean;
  /** Quem recebe (para o `@Nome`) e todos os membros que recebem o buff. */
  receiver: string;
  receivers: string[];
}

/**
 * Liga ou desliga um buff. Buff de arma/set (que começa desligado) ao ser ligado entra em `enabled`; como o buff de time
 * vale para todos os que recebem, ligá-lo para um personagem desliga o mesmo buff para os outros (só ele passa a recebê-lo).
 */
export function setBuffEnabled(project: RotationProject, t: BuffToggle, enabled: boolean): RotationProject {
  let disabled = project.disabled.filter((x) => x !== t.toggleId);
  let on = project.enabled;
  const perReceiver = t.toggleId !== t.baseId;
  if (enabled) {
    if (t.gear && !on.includes(t.baseId)) {
      on = [...on, t.baseId];
      if (perReceiver) for (const r of t.receivers) if (r !== t.receiver && !disabled.includes(`${t.baseId}@${r}`)) disabled = [...disabled, `${t.baseId}@${r}`];
    }
  } else {
    disabled = [...disabled, t.toggleId];
    if (t.gear && !perReceiver) on = on.filter((x) => x !== t.baseId);
  }
  const same = disabled.length === project.disabled.length && disabled.every((x, i) => x === project.disabled[i]) && on === project.enabled;
  return same ? project : touch({ ...project, disabled, enabled: on });
}

/** Elemento padrão dos golpes sem elemento escolhido: pelo kit do jogo ou sempre o do personagem (como os projetos antigos). */
export function setElementMode(project: RotationProject, elementMode: RotationProject['elementMode']): RotationProject {
  return project.elementMode === elementMode ? project : touch({ ...project, elementMode });
}


// ---------- Inserção de golpes (painel "Golpes") ----------

/** Espaço padrão entre golpes inseridos (s). */
export const DEFAULT_GAP = 0.4;
export type InsertMode = 'order' | 'marker';

/**
 * Instante onde o próximo golpe de `member` entra.
 * Em ordem: depois do último golpe, com o espaço. No instante marcado: o do marcador, empurrado para depois de um golpe
 * do MESMO personagem que esteja a menos de `gap` dali (golpes nunca ficam sobrepostos).
 */
export function insertTime(project: RotationProject, opts: { mode: InsertMode; gap: number; marker: number; member: number }): number {
  const gap = Math.max(0.05, opts.gap);
  if (opts.mode === 'order') return project.actions.length === 0 ? 0 : clampTime(lastActionTime(project) + gap);
  let t = clampTime(opts.marker);
  for (let guard = 0; guard < 200; guard++) {
    const clash = project.actions.find((a) => a.member === opts.member && Math.abs(a.time - t) < gap - 1e-9);
    if (!clash) break;
    t = clampTime(clash.time + gap);
  }
  return t;
}

/** Insere o golpe no instante calculado; no modo marcado ele entra na posição cronológica da lista. */
export function insertAction(project: RotationProject, input: Omit<NewAction, 'time'>, opts: { mode: InsertMode; gap: number; marker: number }): RotationProject {
  const time = insertTime(project, { ...opts, member: input.member });
  const added = addAction(project, { ...input, time });
  if (opts.mode === 'order') return added;
  const created = added.actions[added.actions.length - 1];
  const rest = added.actions.slice(0, -1);
  let at = rest.length;
  while (at > 0 && rest[at - 1].time > time) at--;
  return { ...added, actions: [...rest.slice(0, at), created, ...rest.slice(at)] };
}

/** Move o golpe de posição na lista. Em ordem, os tempos são refeitos em sequência (com o espaço); no marcado, só a ordem muda. */
export function reorderActions(project: RotationProject, from: number, to: number, mode: InsertMode, gap: number): RotationProject {
  if (from === to || from < 0 || to < 0 || from >= project.actions.length || to >= project.actions.length) return project;
  const list = [...project.actions];
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  if (mode === 'marker') return touch({ ...project, actions: list });
  const singles = list.filter((a) => !a.chainId);
  if (singles.length === 0) return touch({ ...project, actions: list });
  const first = Math.min(...project.actions.filter((a) => !a.chainId).map((a) => a.time));
  const g = Math.max(0.05, gap);
  const times = new Map(singles.map((a, i) => [a.id, clampTime(first + i * g)]));
  const actions = list.map((a) => (times.has(a.id) ? { ...a, time: times.get(a.id)! } : a));
  return touch({ ...project, actions, buffWindows: followAnchors(project.buffWindows, actions, new Set(times.keys())) });
}

// ---------- Golpe contínuo (grupo de execuções) ----------

export function nextChainId(project: RotationProject): string {
  const used = new Set([...Object.keys(project.chains), ...project.actions.map((a) => a.chainId).filter(Boolean)]);
  for (let n = 1; ; n++) if (!used.has(`c${n}`)) return `c${n}`;
}

/** Instantes das execuções: de `start`, a cada `every`, até `until` (o fim não entra). Sempre pelo menos um. */
export function chainTimes(start: number, every: number, until: number): number[] {
  const step = Math.max(0.1, every);
  const out: number[] = [];
  for (let t = start; t < until - 1e-6 && out.length < 200; t += step) out.push(clampTime(t));
  return out.length ? out : [clampTime(start)];
}

/** As execuções do grupo, em ordem de tempo. */
export const chainOf = (project: RotationProject, chainId: string): ActionRef[] => project.actions.filter((a) => a.chainId === chainId).sort((a, b) => a.time - b.time);

/**
 * Até onde o golpe contínuo vai: a duração da rotação. Manual (Configurações) ou, no automático, o último golpe que NÃO é
 * contínuo (senão o contínuo definiria a própria duração).
 */
export function chainUntil(project: RotationProject): number {
  if (project.config.durationManual === true || project.compat === 'planilha') return project.config.rotationDuration;
  return project.actions.filter((a) => !a.chainId).reduce((m, a) => Math.max(m, a.time), 0);
}

/** Fim padrão do contínuo: a duração da rotação; se ela não cabe nem 2 execuções, 4 execuções. */
function defaultChainEnd(project: RotationProject, start: number, every: number): number {
  const end = chainUntil(project);
  return end > start + every ? end : start + Math.max(0.1, every) * 4;
}

/** Transforma o golpe em contínuo: a ação original vira a 1ª execução e as outras são cópias, a cada `every` até a duração. */
export function makeChain(project: RotationProject, id: string, params: { every: number; until?: number }): RotationProject {
  const src = project.actions.find((a) => a.id === id);
  if (!src) return project;
  const chainId = src.chainId ?? nextChainId(project);
  return rebuildChain({ ...project, actions: project.actions.map((a) => (a.id === id ? { ...a, chainId } : a)) }, chainId, { start: src.time, every: params.every, until: params.until ?? defaultChainEnd(project, src.time, params.every) });
}

/** "Refazer pelo intervalo": recria as execuções a partir de Começa em / A cada / Até (a 1ª execução e a reação-base ficam). */
export function rebuildChain(project: RotationProject, chainId: string, params: { start: number; every: number; until?: number }): RotationProject {
  const members = chainOf(project, chainId);
  const head = members[0];
  if (!head) return project;
  const until = params.until ?? chainUntil({ ...project, actions: project.actions.filter((a) => a.chainId !== chainId) });
  const times = chainTimes(params.start, params.every, until);
  let next: RotationProject = { ...project, actions: project.actions.filter((a) => a.chainId !== chainId || a.id === head.id) };
  next = { ...next, actions: next.actions.map((a) => (a.id === head.id ? { ...a, time: times[0] } : a)) };
  for (const t of times.slice(1)) {
    next = { ...next, actions: [...next.actions, { ...head, id: nextActionId(next), time: t, activeTags: [...head.activeTags] }] };
  }
  return touch({ ...next, chains: { ...next.chains, [chainId]: { every: Math.max(0.1, params.every), until } } });
}

/** + Execução: uma nova execução depois da última (a cada `every`). */
export function addExecution(project: RotationProject, chainId: string): RotationProject {
  const list = chainOf(project, chainId);
  const last = list[list.length - 1];
  if (!last) return project;
  const every = project.chains[chainId]?.every ?? DEFAULT_GAP;
  const copy: ActionRef = { ...last, id: nextActionId(project), time: clampTime(last.time + every), activeTags: [...last.activeTags] };
  const until = Math.max(project.chains[chainId]?.until ?? 0, copy.time + 0.01);
  return touch({ ...project, actions: [...project.actions, copy], chains: { ...project.chains, [chainId]: { every, until } } });
}

/** Volta a ser golpe único: fica só a 1ª execução. */
export function dissolveChain(project: RotationProject, chainId: string): RotationProject {
  const list = chainOf(project, chainId);
  if (list.length === 0) return project;
  const keep = list[0].id;
  const chains = { ...project.chains };
  delete chains[chainId];
  return touch({ ...project, chains, actions: project.actions.filter((a) => a.chainId !== chainId || a.id === keep).map((a) => (a.id === keep ? { ...a, chainId: undefined } : a)) });
}

/** Remove o golpe contínuo inteiro. */
export function removeChain(project: RotationProject, chainId: string): RotationProject {
  const ids = new Set(project.actions.filter((a) => a.chainId === chainId).map((a) => a.id));
  if (ids.size === 0) return project;
  const chains = { ...project.chains };
  delete chains[chainId];
  return touch({
    ...project,
    chains,
    actions: project.actions.filter((a) => !ids.has(a.id)),
    buffWindows: project.buffWindows.map((w) => (w.anchor && ids.has(w.anchor.actionId) ? { ...w, anchor: undefined } : w)),
  });
}

/** "Reação em 1 de N": a reação vai a 1 execução a cada N, começando pela primeira; as demais ficam sem reação. */
export function reactionEveryN(project: RotationProject, chainId: string, n: number, reaction: ActionRef['reaction']): RotationProject {
  const step = Math.max(1, Math.round(n));
  const order = new Map(chainOf(project, chainId).map((a, i) => [a.id, i]));
  if (order.size === 0) return project;
  return touch({ ...project, actions: project.actions.map((a) => (order.has(a.id) ? { ...a, reaction: order.get(a.id)! % step === 0 ? reaction : 'none' } : a)) });
}

// ---------- Janelas: rotação inteira / janela / por golpe ----------

export type WindowMode = 'whole' | 'window' | 'anchor';

export const windowMode = (w: BuffWindow): WindowMode => (w.whole ? 'whole' : w.anchor ? 'anchor' : 'window');

export function setWindowMode(project: RotationProject, id: string, mode: WindowMode, duration: number): RotationProject {
  const w = project.buffWindows.find((x) => x.id === id);
  if (!w) return project;
  let next: BuffWindow;
  if (mode === 'whole') {
    next = { ...w, whole: true, anchor: undefined, start: 0, end: Math.max(MIN_WINDOW, clampTime(duration)) };
  } else if (mode === 'window') {
    next = { ...w, whole: undefined, anchor: undefined };
  } else {
    const before = chronological(project).filter((a) => a.time <= w.start + 1e-9);
    const trigger = before[before.length - 1] ?? chronological(project)[0];
    if (!trigger) return project;
    next = { ...w, whole: undefined, anchor: { actionId: trigger.id, delay: clampTime(Math.max(0, w.start - trigger.time)) } };
  }
  return touch({ ...project, buffWindows: project.buffWindows.map((x) => (x.id === id ? next : x)) });
}

/** "Começa depois de" + Atraso: ancora a janela a um golpe e a reposiciona (a duração fica). */
export function setWindowAnchor(project: RotationProject, id: string, anchor: { actionId: string; delay: number }): RotationProject {
  const w = project.buffWindows.find((x) => x.id === id);
  const trigger = project.actions.find((a) => a.id === anchor.actionId);
  if (!w || !trigger) return project;
  const delay = Math.round(anchor.delay * 100) / 100;
  const start = clampTime(trigger.time + delay);
  const len = Math.max(MIN_WINDOW, w.end - w.start);
  return touch({ ...project, buffWindows: project.buffWindows.map((x) => (x.id === id ? { ...x, whole: undefined, anchor: { actionId: anchor.actionId, delay }, start, end: clampTime(start + len) } : x)) });
}

/** Duração da janela: mexe no fim, mantendo o início. */
export function setWindowLength(project: RotationProject, id: string, length: number): RotationProject {
  const w = project.buffWindows.find((x) => x.id === id);
  return w ? updateWindow(project, id, { end: w.start + Math.max(MIN_WINDOW, length) }) : project;
}

/** Duplica a janela logo depois dela (mesma duração, sem âncora). */
export function duplicateWindow(project: RotationProject, id: string): { project: RotationProject; newId: string | null } {
  const w = project.buffWindows.find((x) => x.id === id);
  if (!w) return { project, newId: null };
  const newId = nextWindowId(project);
  const len = Math.max(MIN_WINDOW, w.end - w.start);
  const copy: BuffWindow = { id: newId, tag: w.tag, start: clampTime(w.end), end: clampTime(w.end + len) };
  return { project: touch({ ...project, buffWindows: [...project.buffWindows, copy] }), newId };
}

/**
 * Menor deslocamento (negativo) permitido ao empurrar para a esquerda a partir de `at`: os golpes da direita não passam dos
 * golpes e janelas que ficam à esquerda da linha.
 */
export function minPush(project: RotationProject, at: number): number {
  const before = [
    ...project.actions.filter((a) => a.time < at - 1e-9).map((a) => a.time),
    ...project.buffWindows.filter((w) => !w.whole && !w.anchor && w.end <= at + 1e-9).map((w) => w.end),
  ];
  return -(at - Math.max(0, ...before));
}

/**
 * "Empurrar a linha": tudo que está à direita de `at` anda `delta` segundos (golpes e janelas de buff; golpes contínuos
 * andam junto). Janela que a linha atravessa só estica ou encolhe; "rotação inteira" não muda; janela "por golpe" segue o golpe.
 */
export function pushFrom(project: RotationProject, at: number, delta: number): RotationProject {
  const d = Math.max(minPush(project, at), Math.round(delta * 100) / 100);
  if (!d) return project;
  const moved = new Set<string>();
  const actions = project.actions.map((a) => {
    if (a.time < at - 1e-9) return a;
    moved.add(a.id);
    return { ...a, time: clampTime(a.time + d) };
  });
  const shifted = project.buffWindows.map((w) => {
    if (w.whole || w.anchor) return w;
    if (w.start >= at - 1e-9) return { ...w, start: clampTime(w.start + d), end: clampTime(w.end + d) };
    if (w.end > at + 1e-9) return { ...w, end: clampTime(Math.max(w.start + MIN_WINDOW, w.end + d)) };
    return w;
  });
  return touch({ ...project, actions, buffWindows: followAnchors(shifted, actions, moved) });
}
