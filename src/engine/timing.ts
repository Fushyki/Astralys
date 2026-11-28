/**
 * Efeitos de arma e set com duração no texto do jogo. `timedWeapon`/`timedSet` transformam as partes marcadas em
 * `timing` em buffs de janela; `applyAutoWindows` abre essas janelas sozinhas, a partir dos golpes da rotação,
 * enquanto o usuário não criar as dele.
 */
import type { AutoSource, AutoWindow, CharacterBuff, FlatDamageEffect, SetEffect, TimedPart, WeaponEffect, WeaponStats } from '../effects/schema';
import { flatTag, type RotationAction } from './rotation';
import type { TeamBuff } from './stats';

// ---------- Partes com duração viram janelas ----------

const STAT_ZERO = { atkPct: 0, dmgPct: 0, critRate: 0, critDmg: 0, em: 0, er: 0, hpPct: 0, defPct: 0, defIgnore: 0, atkFlat: 0, atkBaseFlat: 0, hpFlat: 0, defFlat: 0, physDmgPct: 0, physCritDmg: 0 };
const BY_TYPE = ['dmgPctByType', 'reactionBonus'] as const;

type Gear = Partial<Pick<WeaponStats, 'team' | 'buffs' | 'flat'>> & { resShred?: NonNullable<SetEffect['fourPiece']>['resShred'] };

function withParts<T extends Gear>(gear: T, parts: readonly TimedPart[], legacy: 'weapon' | 'set4p', wielder: string): T {
  const root = { ...gear } as unknown as Record<string, unknown>;
  const added: CharacterBuff[] = [];
  let buffs = gear.buffs ?? [];
  let flat = gear.flat ?? [];
  let team = gear.team;
  let resShred = gear.resShred;
  parts.forEach((p, n) => {
    const auto: AutoWindow | undefined = p.auto && (!p.wielders || p.wielders.includes(wielder)) ? { ...p.auto, ...(p.pausesFor?.includes(wielder) ? { pauseOff: true } : {}) } : undefined;
    const when = { duration: p.duration, ...(auto ? { auto } : {}) };
    if (p.root) {
      const stats: Record<string, unknown> = { ...STAT_ZERO, dmgPctByType: {}, critRateByType: {}, critDmgByType: {}, baseMultByType: {}, reactionBonus: {} };
      let any = false;
      for (const key of p.root) {
        const value = root[key];
        const byType = (BY_TYPE as readonly string[]).includes(key);
        if (byType ? !value || Object.keys(value as object).length === 0 : !value) continue;
        stats[key] = value;
        root[key] = byType ? {} : 0;
        any = true;
      }
      if (any) added.push({ id: `tempo-${n}`, label: p.label ?? 'Passiva', minConstellation: 0, scope: 'self', timed: true, flat: [], stats: stats as unknown as CharacterBuff['stats'], legacy, ...when });
    }
    if (p.buff) buffs = buffs.map((b) => (b.id === p.buff ? { ...b, timed: true, ...when, ...(!b.timed && b.scope === 'self' ? { legacy: 'static' as const } : {}) } : b));
    if (p.flat) flat = flat.map((f) => (f.name === p.flat ? { ...f, ...when } : f));
    if (p.team && team) team = { ...team, ...when };
    if (p.res && resShred) resShred = { ...resShred, ...when };
  });
  return { ...(root as unknown as T), buffs: [...added, ...buffs], flat, ...(team ? { team } : {}), ...(resShred ? { resShred } : {}) };
}

export function timedWeapon(effect: WeaponEffect | undefined, wielder: string): WeaponEffect | undefined {
  if (!effect?.timing?.length) return effect;
  const timing = effect.timing;
  return { ...withParts(effect, timing, 'weapon', wielder), ...(effect.refinements ? { refinements: effect.refinements.map((r) => withParts(r, timing, 'weapon', wielder)) } : {}) };
}

export function timedSet(effect: SetEffect | undefined, wielder: string): SetEffect | undefined {
  if (!effect?.timing?.length || !effect.fourPiece) return effect;
  return { ...effect, fourPiece: withParts(effect.fourPiece, effect.timing, 'set4p', wielder) };
}

// ---------- Janelas automáticas ----------

/**
 * A fonte de janela de um membro. Quem não tem golpe de dano num talento (`silent`: o Supremo do Xiao, a Habilidade do
 * Wriothesley) não tem como marcar o uso dele na rotação: o que só abriria por ele abre pelos ataques. Com atraso
 * (efeito de quando o estado acaba) não há como saber quando: fica sem janela automática.
 */
export function autoSource(auto: AutoWindow, duration: number, member: number, silent: readonly string[] | undefined): AutoSource | undefined {
  const mute = !auto.by && auto.on.length > 0 && auto.on.every((t) => silent?.includes(t));
  if (mute && auto.delay) return undefined;
  return { ...auto, ...(mute ? { on: ['normal', 'charged', 'plunge'], cast: false } : {}), member, duration };
}

/** [início, fim) em segundos. */
export type Interval = [number, number];
type Hit = Pick<RotationAction, 'member' | 'move' | 'time' | 'repeat'> & Partial<Pick<RotationAction, 'reaction' | 'executions'>>;

const round = (t: number) => Math.round(t * 1000) / 1000;

/** O golpe é de um destes tipos? (Vazio = qualquer um. Habilidade e Supremo valem também pelo talento.) */
const matches = (a: Hit, on: readonly string[]) =>
  on.length === 0 || on.includes(a.move.hitType) || ((a.move.talent === 'skill' || a.move.talent === 'burst') && on.includes(a.move.talent));

/** Os golpes que a fonte aceita: tipo e, se pedido, um trecho do rótulo. */
const accepts = (s: AutoSource, a: Hit) => matches(a, s.on ?? []) && (!s.labels || s.labels.some((l) => a.move.label.includes(l)));

/** Trechos em que o membro está fora de campo: de quando outro age (golpe novo) até ele agir de novo. */
function offField(member: number, actions: readonly Hit[], forever: number): Interval[] {
  const turns = actions.filter((a) => !a.repeat && (a.move.talent === 'normal' || a.move.talent === 'skill' || a.move.talent === 'burst')).sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
  const out: Interval[] = [];
  let left: number | undefined;
  for (const a of turns) {
    if (a.member !== member) left ??= a.time ?? 0;
    else if (left !== undefined) { out.push([left, a.time ?? 0]); left = undefined; }
  }
  if (left !== undefined) out.push([left, forever]);
  return out;
}

/** Onde acaba a janela aberta em `start`: a duração, mais o tempo fora de campo (se não corre) e as extensões por golpe. */
function endRule(s: AutoSource, actions: readonly Hit[]): (start: number) => number {
  const forever = actions.reduce((m, a) => Math.max(m, a.time ?? 0), 0) + s.duration + (s.delay ?? 0);
  const off = s.pauseOff ? offField(s.member, actions, forever) : [];
  const ext = s.extend;
  const more = ext ? actions.filter((a) => a.member === s.member && matches(a, ext.on)).map((a) => a.time ?? 0).sort((x, y) => x - y) : [];
  return (start) => {
    let end = start + s.duration;
    let next = off.findIndex(([, b]) => b > start);
    const pause = (until: number) => {
      for (; next >= 0 && next < off.length && off[next][0] < Math.min(end, until); next++) end += off[next][1] - Math.max(off[next][0], start);
    };
    let added = 0;
    let last = -Infinity;
    for (const t of more) {
      if (t < start) continue;
      pause(t);
      if (t >= end || added >= ext!.max) break;
      if (t - last < (ext!.every ?? 0) - 1e-9) continue;
      const add = Math.min(ext!.add, ext!.max - added);
      added += add;
      end += add;
      last = t;
    }
    pause(Infinity);
    return end + (s.tail ?? 0);
  };
}

/**
 * Fonte com acúmulos que um aliado gasta (`consume`): quanto do bônus cheio cada golpe que os gasta leva (a fração dos
 * acúmulos, num acerto só) e os trechos em que havia acúmulo guardado.
 */
export function consumption(s: AutoSource, actions: readonly Hit[]): { spent: Map<Hit, number>; spans: Interval[] } {
  const spent = new Map<Hit, number>();
  const spans: Interval[] = [];
  const { reaction, max } = s.consume!;
  let stacks = 0;
  let since = 0;
  let until = 0;
  for (const a of [...actions].sort((x, y) => (x.time ?? 0) - (y.time ?? 0))) {
    const t = a.time ?? 0;
    if (stacks && t >= until - 1e-9) { spans.push([since, until]); stacks = 0; }
    const hits = Math.max(1, a.move.hits ?? 1) * (a.executions ?? 1);
    if (a.member === s.member) {
      if (!accepts(s, a)) continue;
      if (!stacks) since = t;
      stacks = Math.min(max, stacks + hits);
      until = round(t + s.duration);
    } else if (stacks && a.reaction === reaction) {
      spent.set(a, stacks / max / hits);
      spans.push([since, round(t + 0.001)]);
      stacks = 0;
    }
  }
  if (stacks) spans.push([since, until]);
  return { spent, spans };
}

/** Janelas que uma fonte abre sozinha nesta rotação, já unidas quando se encostam. */
export function autoIntervals(s: AutoSource, actions: readonly Hit[]): Interval[] {
  if (s.consume) return union(consumption(s, actions).spans);
  let starts: number[] = [];
  if (s.periodic && s.cooldown) {
    const last = actions.reduce((m, a) => Math.max(m, a.time ?? 0), 0);
    for (let t = 0; t <= last + 1e-9; t += s.cooldown) starts.push(round(t));
  } else {
    const opens = (a: Hit) => (s.by === 'team' || (s.by === 'others' ? a.member !== s.member : a.member === s.member)) && !(s.cast && a.repeat) && accepts(s, a);
    for (const t of actions.filter(opens).map((a) => a.time ?? 0).sort((x, y) => x - y)) {
      if (starts.length === 0 || !s.cooldown || t >= starts[starts.length - 1] + s.cooldown - 1e-9) starts.push(t);
    }
  }
  const seq = s.sequence;
  if (seq) starts = starts.filter((_, k) => k % seq.length === seq.index);
  const delay = s.delay;
  if (delay) starts = starts.map((t) => round(t + delay));
  const endOf = endRule(s, actions);
  return union(starts.map((t) => [t, round(endOf(t))]));
}

/** Une as janelas que se encostam ou se cobrem. */
function union(list: Interval[]): Interval[] {
  const out: Interval[] = [];
  for (const [start, end] of [...list].sort((a, b) => a[0] - b[0])) {
    const prev = out[out.length - 1];
    if (prev && start <= prev[1] + 1e-9) prev[1] = Math.max(prev[1], end);
    else out.push([start, end]);
  }
  return out;
}

/** Janelas automáticas de cada faixa (etiqueta) que tem alguma. Duas fontes na mesma faixa somam as janelas. */
export function autoTagIntervals(buffs: readonly TeamBuff[], flats: readonly FlatDamageEffect[], actions: readonly Hit[]): Map<string, Interval[]> {
  const sources = new Map<string, AutoSource[]>();
  const add = (tag: string, list: readonly AutoSource[] | undefined) => { if (list?.length) sources.set(tag, [...(sources.get(tag) ?? []), ...list]); };
  for (const b of buffs) add(b.tag, b.auto);
  for (const f of flats) add(flatTag(f), f.auto);
  // shortcut: a faixa é por nome; dois membros com a mesma arma ou o mesmo set dividem a faixa e as janelas dos dois.
  return new Map([...sources].map(([tag, list]) => [tag, union(list.flatMap((s) => autoIntervals(s, actions)))]));
}

/**
 * Põe nas ações as etiquetas das janelas automáticas, menos as faixas em `blocked` (o usuário já criou ou tirou as
 * janelas delas). Pode ser aplicado de novo com outros buffs (otimizador, comparação de armas): as anteriores saem.
 */
export function applyAutoWindows(actions: readonly RotationAction[], buffs: readonly TeamBuff[], flats: readonly FlatDamageEffect[] | undefined, blocked: ReadonlySet<string>): RotationAction[] {
  const tags = [...autoTagIntervals(buffs, flats ?? [], actions)].filter(([tag]) => !blocked.has(tag));
  // Faixas de acúmulo gasto: só o golpe que os leva recebe a etiqueta, na fração que couber.
  const spent = new Map<string, Map<Hit, number>>();
  for (const b of buffs) {
    for (const s of b.auto ?? []) if (s.consume) spent.set(b.tag, new Map([...(spent.get(b.tag) ?? []), ...consumption(s, actions).spent]));
  }
  return actions.map((a) => {
    const base = a.autoTags ? a.activeTags.filter((t) => !a.autoTags!.includes(t)) : a.activeTags;
    const t = a.time ?? 0;
    const covers = (tag: string, list: Interval[]) => spent.get(tag)?.has(a) ?? list.some(([s, e]) => t >= s - 1e-9 && t < e - 1e-9);
    const auto = tags.filter(([tag, list]) => !base.includes(tag) && covers(tag, list)).map(([tag]) => tag);
    if (!auto.length && !a.autoTags) return a;
    const on = auto.filter((tag) => !a.tagsOff?.includes(tag));
    const share = Object.fromEntries([
      ...Object.entries(a.tagShare ?? {}).filter(([tag]) => !a.autoTags?.includes(tag)),
      ...on.flatMap((tag) => { const k = spent.get(tag)?.get(a); return k !== undefined && k < 1 ? [[tag, k] as const] : []; }),
    ]);
    const { tagShare: _old, ...rest } = a;
    return { ...rest, activeTags: [...base, ...on], autoTags: auto, ...(Object.keys(share).length ? { tagShare: share } : {}) };
  });
}
