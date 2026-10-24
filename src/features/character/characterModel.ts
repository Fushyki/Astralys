/**
 * Modelo da calculadora do personagem: tabela de dano sem nomes repetidos, reações possíveis com os elementos do
 * time, reações que o personagem dispara e a lista de buffs recebidos (com a janela e quanto do dano dependia deles).
 * Funções puras sobre o resultado do motor.
 */
import type { Element, Move, Talent } from '../../data/schema';
import {
  ampMultiplier,
  assembleTeam,
  reactionTable,
  type AnalysisBundle,
  type ReactionChoice,
  type ReactionRow,
  type ResolvedProject,
  type RotationProject,
  type TeamBuff,
} from '../../engine';
import { deltaChips } from '../team/teamModel';
import type { DamageRow } from '../../engine';

// ---------- Tabela de dano ----------

export interface MoveLine {
  id: string;
  name: string;
  /** Acertos que o golpe soma (2× etc.). */
  hits: number;
  noCrit: number;
  crit: number;
  avg: number;
  /** A reação escolhida se aplicou a este golpe. */
  reacted: boolean;
  /** Elemento do dano (o do kit; Físico nos ataques normais de arma). */
  element: string;
  /** Tipo do golpe (normal, carregado, queda, habilidade, supremo). */
  hitType: string;
}

export interface MoveGroup {
  talent: Talent;
  title: string;
  level: number;
  lines: MoveLine[];
}

const TALENT_TITLE: Record<Talent, string> = { normal: 'Ataque normal', skill: 'Habilidade', burst: 'Supremo' };

/** "Dano do 1° Golpe" → "1° golpe"; "Dano de Ataque Carregado" → "Ataque carregado". */
export function cleanMoveName(label: string): string {
  const stripped = label.replace(/^Dano\s+(?:do|da|de|dos|das)\s+/i, '').trim();
  const base = stripped || label;
  // palavras genéricas de golpe ficam em minúscula (menos a primeira); nomes próprios do kit são preservados
  const lowered = base.replace(/\b(Golpe|Golpes|Ataque|Carregado|Imersivo|Normal|Habilidade|Supremo)\b/g, (w) => w.toLowerCase());
  return lowered.charAt(0).toUpperCase() + lowered.slice(1);
}

/** Os `n` golpes que mais dão dano médio, do maior ao menor (para o resumo do personagem). */
export function topHits(groups: MoveGroup[], n = 5): (MoveLine & { talent: Talent })[] {
  return groups
    .flatMap((g) => g.lines.map((l) => ({ ...l, talent: g.talent })))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, n);
}

const PLUNGE_VARIANT = ['(baixa altitude)', '(alta altitude)'];

/** Nome de exibição de um golpe, em português quando o Lunaris traz. */
export function displayName(m: Move): string {
  if (m.hitType === 'plunge' && m.variants === 2) return `Queda ${PLUNGE_VARIANT[m.variant]}`;
  const base = cleanMoveName(m.labelPt ?? m.label);
  if (m.variants > 1) return `${base} (${m.variant + 1}/${m.variants})`;
  if (base === 'Habilidade') return m.talent === 'burst' ? 'Dano do supremo' : 'Dano da habilidade';
  return base;
}

/** Agrupa as linhas por talento, com o nível efetivo, e desambigua nomes repetidos com um número. */
export function moveGroups(rows: DamageRow[], levels: Record<Talent, number>): MoveGroup[] {
  const names = rows.map((r) => displayName(r.move));
  const seen = new Map<string, number>();
  const total = new Map<string, number>();
  const keyOf = (i: number) => `${rows[i].move.talent}|${names[i]}`;
  names.forEach((_, i) => total.set(keyOf(i), (total.get(keyOf(i)) ?? 0) + 1));
  const finalNames = names.map((n, i) => {
    if ((total.get(keyOf(i)) ?? 0) <= 1) return n;
    const k = (seen.get(keyOf(i)) ?? 0) + 1;
    seen.set(keyOf(i), k);
    return `${n} (${k})`;
  });
  const groups: MoveGroup[] = [];
  for (const talent of ['normal', 'skill', 'burst'] as const) {
    const lines: MoveLine[] = rows
      .map((r, i) => ({ r, name: finalNames[i] }))
      .filter(({ r }) => r.move.talent === talent)
      .map(({ r, name }) => ({ id: r.move.id, name, hits: r.move.hits, noCrit: r.noCrit, crit: r.crit, avg: r.avg, reacted: r.reactionApplied, element: r.element, hitType: r.move.hitType }));
    if (lines.length) groups.push({ talent, title: TALENT_TITLE[talent], level: levels[talent], lines });
  }
  return groups;
}

// ---------- Reações ----------

/** Reações amplificadoras e aditivas que o elemento do personagem dispara com os elementos do time. */
export function reactionOptions(element: Element | undefined, teamElements: (Element | undefined)[]): ReactionChoice[] {
  if (!element) return ['none'];
  const has = (el: Element) => teamElements.includes(el);
  const out: ReactionChoice[] = ['none'];
  // melt: Pyro (×2) sobre Cryo, ou Cryo (×1,5) sobre Pyro
  if ((element === 'Pyro' && has('Cryo')) || (element === 'Cryo' && has('Pyro'))) out.push('melt');
  // vaporize: Hydro (×2) sobre Pyro, ou Pyro (×1,5) sobre Hydro
  if ((element === 'Hydro' && has('Pyro')) || (element === 'Pyro' && has('Hydro'))) out.push('vaporize');
  if (element === 'Dendro' && has('Electro')) out.push('spread');
  if (element === 'Electro' && has('Dendro')) out.push('aggravate');
  return out;
}

export const REACTION_LABEL: Record<string, string> = {
  none: 'Sem reação',
  melt: 'Derreter',
  vaporize: 'Vaporizar',
  spread: 'Intensificar',
  aggravate: 'Propagar',
};

export interface ReactionInfo {
  id: string;
  name: string;
  kind: 'amplificadora' | 'transformativa' | 'lunar';
  /** Multiplicador (amplificadoras, ex.: ×3,29) ou dano (transformativas e lunares). */
  value: { type: 'mult' | 'damage'; amount: number };
}

const NEEDS: Record<string, { elements: Element[]; kind: ReactionInfo['kind'] }> = {
  overloaded: { elements: ['Pyro', 'Electro'], kind: 'transformativa' },
  electrocharged: { elements: ['Electro', 'Hydro'], kind: 'transformativa' },
  superconduct: { elements: ['Cryo', 'Electro'], kind: 'transformativa' },
  burning: { elements: ['Pyro', 'Dendro'], kind: 'transformativa' },
  bloom: { elements: ['Dendro', 'Hydro'], kind: 'transformativa' },
  hyperbloom: { elements: ['Dendro', 'Hydro', 'Electro'], kind: 'transformativa' },
  burgeon: { elements: ['Dendro', 'Hydro', 'Pyro'], kind: 'transformativa' },
  lunarcharged: { elements: ['Electro', 'Hydro'], kind: 'lunar' },
  lunarcrystallize: { elements: ['Geo', 'Hydro'], kind: 'lunar' },
};

/** Reações que ESTE personagem dispara com os elementos do time, com o multiplicador ou o dano da reação. */
export function characterReactions(args: {
  element: Element | undefined;
  teamElements: (Element | undefined)[];
  em: number;
  characterLevel: number;
  enemy: Parameters<typeof reactionTable>[0]['enemy'];
  ampCoefficient?: number;
  /** Bônus de dano de reação do personagem (sets, armas, passivas). */
  reactionBonus?: Parameters<typeof reactionTable>[0]['reactionBonus'];
}): ReactionInfo[] {
  const { element, teamElements, em } = args;
  if (!element) return [];
  const out: ReactionInfo[] = [];
  for (const kind of reactionOptions(element, teamElements)) {
    if (kind !== 'melt' && kind !== 'vaporize') continue;
    const amp = ampMultiplier(kind, element, em, 0, args.ampCoefficient);
    if (amp > 1) out.push({ id: kind, name: `${REACTION_LABEL[kind]} (${element})`, kind: 'amplificadora', value: { type: 'mult', amount: amp } });
  }
  const table = reactionTable({ characterLevel: args.characterLevel, em, enemy: args.enemy, reactionBonus: args.reactionBonus });
  const has = (el: Element) => teamElements.includes(el);
  for (const row of table) {
    const rule = NEEDS[row.id];
    if (!rule || !rule.elements.includes(element) || !rule.elements.every(has)) continue;
    out.push({ id: row.id, name: row.name, kind: rule.kind, value: { type: 'damage', amount: row.total } });
  }
  // Redemoinho: só se o time tem Anemo e o personagem é de um elemento que o redemoinho espalha
  if (has('Anemo') && ['Pyro', 'Hydro', 'Electro', 'Cryo'].includes(element)) {
    const swirl = table.find((r: ReactionRow) => r.id === `swirl-${element}`);
    if (swirl) out.push({ id: swirl.id, name: swirl.name, kind: 'transformativa', value: { type: 'damage', amount: swirl.total } });
  }
  return out;
}

// ---------- Buffs recebidos ----------

export interface ReceivedBuff {
  id: string;
  /** Id que liga/desliga o buff SÓ para este personagem (`<buff>@<Nome>`); fontes dele mesmo usam o próprio id. */
  toggleId: string;
  /** O buff está desligado para todo o time (em "Rotação e buffs"): daqui não dá para religar só um. */
  lockedOff: boolean;
  /** Vem de arma ou set de um membro com `gearManual` (começa desligado). */
  gear: boolean;
  /** Quem recebe este buff (nomes), para o interruptor. */
  receivers: string[];
  name: string;
  /** Quem dá o buff (índice do membro) ou null para fontes do time. */
  giver: number | null;
  giverName: string;
  /** Janelas em segundos, como texto ("5,9–17,5 s"); "o tempo todo" se não há janelas. */
  window: string;
  value: string;
  active: boolean;
  /** Fração do dano deste personagem que some sem o buff (null se desligado ou sem cálculo). */
  share: number | null;
  /** O buff veio de uma fonte sem origem confirmada. */
  needsConfirmation: boolean;
}

const NEEDS_CONFIRMATION = /origem não identificada|confirme/i;

function giverOf(b: TeamBuff): number | null {
  const m = /^(?:gear|flat-atk|cbuff)-(\d+)/.exec(b.id);
  return m ? Number(m[1]) : null;
}

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

/** Janelas do projeto de uma etiqueta, como "5,9–17,5 s". */
export function windowText(project: RotationProject, tag: string): string {
  const ws = project.buffWindows.filter((w) => w.tag === tag).sort((a, b) => a.start - b.start);
  if (ws.length === 0) return 'sem janela';
  return ws.map((w) => `${fmt(w.start)}–${fmt(w.end)} s`).join(', ');
}

/** Buffs de equipe que atingem o membro, com janela, valor e quanto do dano dele dependia de cada um. */
export function receivedBuffs(project: RotationProject, resolved: ResolvedProject, bundle: AnalysisBundle, member: number): ReceivedBuff[] {
  const names = resolved.team.members.map((m) => m.character.name);
  const name = names[member];
  // Montagem SEM desligados: lista todos os buffs, inclusive os que o usuário desligou.
  const full = assembleTeam({ ...resolved.team, disabled: [] }, { rolls: bundle.optimization.rolls });
  const memberAvg = bundle.optimization.result.members[member]?.avg || 1;

  const fromBuffs = full.buffs
    .filter((b) => b.targets === 'all' || b.targets.includes(name))
    .map((b) => {
      const giver = giverOf(b);
      const attribution = bundle.attribution.items.find((i) => i.id === b.id);
      const mine = attribution?.perMember.find((p) => p.name === name);
      const label = b.description ?? b.id;
      const flagged = NEEDS_CONFIRMATION.test(label);
      const lockedOff = project.disabled.includes(b.id);
      const toggleId = `${b.id}@${name}`;
      const gear = resolved.gearIds.includes(b.id);
      const active = !lockedOff && !(gear && !project.enabled.includes(b.id)) && !project.disabled.includes(toggleId);
      return {
        id: b.id,
        toggleId,
        lockedOff,
        gear,
        receivers: b.targets === 'all' ? names : b.targets,
        name: flagged ? 'Buff sem origem conhecida' : label,
        giver,
        giverName: giver !== null ? names[giver] : 'Time',
        window: b.always ? 'o tempo todo' : windowText(project, b.tag),
        value: deltaChips(b.delta).join(', ') || '—',
        active,
        share: active && mine ? mine.contribution / memberAvg : null,
        needsConfirmation: flagged,
      };
    })
    ;

  // Buffs extras do projeto (inclusive os "sem origem conhecida") que valem só para este personagem, o tempo todo.
  const extras: ReceivedBuff[] = full.sources[member]
    .filter((src) => src.kind === 'extra')
    .map((src) => {
      const attribution = bundle.attribution.items.find((i) => i.id === src.id);
      const mine = attribution?.perMember.find((p) => p.name === name);
      const flagged = NEEDS_CONFIRMATION.test(src.label);
      const active = !project.disabled.includes(src.id);
      return {
        id: src.id,
        toggleId: src.id,
        lockedOff: false,
        gear: false,
        receivers: [name],
        name: flagged ? 'Buff sem origem conhecida' : src.label,
        giver: null,
        giverName: 'Projeto',
        window: 'o tempo todo',
        value: deltaChips(src.delta).join(', ') || '—',
        active,
        share: active && mine ? mine.contribution / memberAvg : null,
        needsConfirmation: flagged,
      };
    });

  return [...fromBuffs, ...extras].sort((a, b) => (b.share ?? -1) - (a.share ?? -1));
}



// ---------- Buffs do personagem na tela de Equipe ----------

export interface BuffCard {
  /** Id da fonte (para achar o valor no cálculo). */
  id: string;
  /** Id que o interruptor grava em `disabled`. */
  toggleId: string;
  name: string;
  /** De onde vem: Arma, Set · 4 peças, Passiva, C2, Ressonância… */
  tag: string;
  /** Quem dá o buff (índice do membro) ou null para fontes do time/projeto. */
  giver: number | null;
  giverName: string;
  /** "o tempo todo" ou as janelas da rotação em que ele vale. */
  window: string;
  chips: string[];
  active: boolean;
  /** Desligado para o time todo em "Rotação e buffs": aqui o interruptor fica travado. */
  lockedOff: boolean;
  /** Buff de arma ou set que começa desligado (o usuário escolhe quais ligar). */
  gear: boolean;
  /** Quem recebe o buff, para o interruptor por personagem. */
  receivers: string[];
  /** Fração do dano dele que some sem o buff (null se desligado). */
  share: number | null;
  needsConfirmation: boolean;
  /** Vale só enquanto uma janela da rotação o liga (senão vale o tempo todo). */
  timed: boolean;
}

const STATIC_TAG: Record<string, string> = { weapon: 'Arma', 'set-2p': 'Set · 2 peças', 'set-4p': 'Set · 4 peças', character: 'Passiva', resonance: 'Ressonância', extra: 'Extra' };

/** Tag do buff de personagem (`cbuff-<membro>-<id>`): constelação (C2) ou passiva. */
function characterBuffTag(resolved: ResolvedProject, memberIndex: number, buffId: string): string {
  const b = resolved.team.members[memberIndex]?.characterEffect?.buffs.find((x) => x.id === buffId);
  return b && b.minConstellation > 0 ? `C${b.minConstellation}` : 'Passiva';
}

/**
 * Tudo que o personagem recebe, para ligar e desligar na Equipe: o que vem do equipamento e das passivas dele
 * (arma, set, passivas), as ressonâncias e os buffs de equipe dos aliados, cada um com a janela e os números.
 */
export function memberBuffCards(project: RotationProject, resolved: ResolvedProject, bundle: AnalysisBundle, member: number): BuffCard[] {
  const names = resolved.team.members.map((m) => m.character.name);
  const name = names[member];
  const memberAvg = bundle.optimization.result.members[member]?.avg || 1;
  const full = assembleTeam({ ...resolved.team, disabled: [] }, { rolls: bundle.optimization.rolls });
  const shareOf = (id: string, active: boolean) => {
    const mine = bundle.attribution.items.find((i) => i.id === id)?.perMember.find((p) => p.name === name);
    return active && mine ? mine.contribution / memberAvg : null;
  };

  const cards: BuffCard[] = [];
  for (const src of full.sources[member]) {
    if (!(src.kind in STATIC_TAG)) continue;
    const isResonance = src.kind === 'resonance';
    const toggleId = isResonance ? src.id.replace(/^m\d+:/, '') : src.id;
    const gear = resolved.gearIds.includes(toggleId);
    const active = !project.disabled.includes(toggleId) && !(gear && !project.enabled.includes(toggleId));
    const cb = /^m\d+:cbuff-(.+)$/.exec(src.id);
    const flagged = NEEDS_CONFIRMATION.test(src.label);
    cards.push({
      id: src.id,
      toggleId,
      name: flagged ? 'Buff sem origem conhecida' : src.label,
      tag: cb ? characterBuffTag(resolved, member, cb[1]) : STATIC_TAG[src.kind],
      giver: isResonance || src.kind === 'extra' ? null : member,
      giverName: isResonance ? 'Time' : src.kind === 'extra' ? 'Projeto' : name,
      window: 'o tempo todo',
      chips: deltaChips(src.delta),
      active,
      lockedOff: false,
      gear,
      receivers: [name],
      share: shareOf(src.id, active),
      needsConfirmation: flagged,
      timed: false,
    });
  }
  if (full.resonanceAtkPct > 0) {
    const active = !project.disabled.includes('resonance-pyro');
    cards.push({
      id: 'resonance-pyro', toggleId: 'resonance-pyro', name: 'Ressonância Pyro (+25% de ATK)', tag: 'Ressonância', giver: null, giverName: 'Time',
      window: 'o tempo todo', chips: [`ATK +${Math.round(full.resonanceAtkPct * 100)}%`], active, lockedOff: false, gear: false, receivers: [name], share: shareOf('resonance-pyro', active), needsConfirmation: false, timed: false,
    });
  }

  for (const b of receivedBuffs(project, resolved, bundle, member)) {
    const idMatch = /^cbuff-(\d+)-(.+)$/.exec(b.id);
    const tag = b.id.startsWith('gear-') ? 'Arma/set' : b.id.startsWith('flat-atk-') ? 'Passiva' : idMatch ? characterBuffTag(resolved, Number(idMatch[1]), idMatch[2]) : 'Extra';
    cards.push({
      id: b.id, toggleId: b.toggleId, name: b.name, tag, giver: b.giver, giverName: b.giverName, window: b.window, chips: b.value === '—' ? [] : b.value.split(', '),
      active: b.active, lockedOff: b.lockedOff, gear: b.gear, receivers: b.receivers, share: b.share, needsConfirmation: b.needsConfirmation, timed: b.window !== 'o tempo todo',
    });
  }
  return cards;
}
