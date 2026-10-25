/**
 * Operações puras sobre o projeto (sem React, sem estado). Sempre devolvem um projeto NOVO; nunca mutam.
 * O estado (Zustand) só orquestra histórico e persistência em cima disto.
 */
import type { ActionRef, BuffWindow, MoveRef, RotationProject } from '../../engine';

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
  return touch({ ...project, actions: project.actions.map((a) => (a.id === id ? { ...a, ...next } : a)) });
}

export const moveAction = (project: RotationProject, id: string, time: number) => updateAction(project, id, { time });

export function removeAction(project: RotationProject, id: string): RotationProject {
  if (!project.actions.some((a) => a.id === id)) return project;
  return touch({ ...project, actions: project.actions.filter((a) => a.id !== id) });
}

/** Duplica uma ação logo depois dela (+0,5 s). Devolve o projeto e o id da cópia. */
export function duplicateAction(project: RotationProject, id: string): { project: RotationProject; newId: string | null } {
  const src = project.actions.find((a) => a.id === id);
  if (!src) return { project, newId: null };
  const newId = nextActionId(project);
  const copy: ActionRef = { ...src, id: newId, time: clampTime(src.time + 0.5), activeTags: [...src.activeTags] };
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
  return touch({ ...project, config: next });
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
