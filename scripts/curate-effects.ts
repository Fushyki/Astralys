/**
 * Gera os efeitos de sets (e, em outra seção, de armas) a partir dos textos e parâmetros do Lunaris
 * (`src/data/generated/`), seguindo uma tabela de curadoria escrita à mão em `scripts/curation/`.
 *
 *   npx tsx scripts/curate-effects.ts
 *
 * Regras (as do projeto: nunca inventar número de jogo):
 *  - todo valor vem de um parâmetro do Lunaris ({ p: índice, x: multiplicador }) ou, quando o número só aparece
 *    na descrição, de um literal declarado com `lit`;
 *  - o bônus de 2 peças dos sets é lido da própria descrição ("ATK +18%.") por um conjunto fechado de padrões;
 *  - cada efeito diz o que assumiu (stacks, condições) e o que NÃO entra em `note`;
 *  - entradas que já existem em `sets.json`/`weapons.json` (vindas da planilha de referência) são preservadas.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CharacterBuffSchema, CharacterEffectSchema, ProcSchema, SetEffectSchema, WeaponEffectSchema, type CharacterBuff, type CharacterEffect, type Proc, type SetEffect, type WeaponEffect, type WeaponFlat, type WeaponStats } from '../src/effects/schema';
import { FOUR_PIECE, type Val } from './curation/sets';
import { FOUR_PIECE_2 } from './curation/sets2';
import { PILOTO_SETS } from './curation/piloto-sets';
import { parseTwoPiece } from './lib/twoPiece';
import { POINT_MOVES } from './curation/points';
import { WEAPONS } from './curation/weapons';
import { WEAPONS_2 } from './curation/weapons2';
import { PILOTO_ARMAS } from './curation/piloto-armas';
import type { BuffCur, FlatCur, GearCur, ProcCur, StatsCur, Sum } from './curation/gear';
import { CHARACTERS as CHARACTERS_1 } from './curation/characters';
import { CHARACTERS_2 } from './curation/characters2';
import { CHARACTERS_3 } from './curation/characters3';
import { CHARACTERS_4 } from './curation/characters4';
import { CHARACTERS_5 } from './curation/characters5';
import { CHARACTERS_6, CHARACTERS_7, CHARACTERS_8, CHARACTERS_9, CHARACTERS_10 } from './curation/characters6';
import { CHARACTERS_11 } from './curation/characters7';
import { CHARACTERS_12 } from './curation/characters8';
import { CHARACTERS_13 } from './curation/characters9';
import { CHARACTERS_14 } from './curation/characters10';
import { CHARACTERS_15 } from './curation/characters11';
import { CHARACTERS_16 } from './curation/characters12';
import type { BuffCuration } from './curation/characters';
import { CHARACTER_NOTES } from './curation/charnotes';
import { CHARACTER_PROCS, CHARACTERS_PROC_BUFFS } from './curation/procs';
import { FACTIONS as LUNAR_FACTIONS, LUNAR_BUFFS, LUNAR_PROCS as MOON_PROCS, SPECIAL_MOVES as MOON_SPECIAL } from './curation/lunar';
import { EXTRA_BUFFS, EXTRA_FACTIONS, EXTRA_PROCS, EXTRA_SPECIAL } from './curation/extras';
import { PILOTO_BUFFS, PILOTO_NOTES, PILOTO_PROCS } from './curation/piloto-personagens';

/** Junta listas por personagem de vários arquivos de curadoria. */
const mergeLists = <T>(...all: Record<string, T[]>[]): Record<string, T[]> => {
  const out: Record<string, T[]> = {};
  for (const batch of all) for (const [k, v] of Object.entries(batch)) out[k] = [...(out[k] ?? []), ...v];
  return out;
};
const FACTIONS = mergeLists(LUNAR_FACTIONS, EXTRA_FACTIONS);
const LUNAR_PROCS = mergeLists(MOON_PROCS, EXTRA_PROCS, PILOTO_PROCS);
// Notas do piloto por agente: sobrepõem as dos lotes antigos (`null` apaga).
for (const [name, list] of Object.entries(PILOTO_NOTES)) {
  const cur: Record<string, unknown> = { ...(CHARACTER_NOTES[name] ?? {}) };
  for (const [src, n] of Object.entries(list)) { if (n === null) delete cur[src]; else cur[src] = n; }
  CHARACTER_NOTES[name] = cur as (typeof CHARACTER_NOTES)[string];
}
const SPECIAL_MOVES = mergeLists(MOON_SPECIAL, EXTRA_SPECIAL);

/** Junta os lotes: o mesmo personagem pode aparecer em mais de um e as listas se somam. */
const CHARACTER_BUFFS: Record<string, BuffCuration[]> = {};
for (const batch of [CHARACTERS_1, CHARACTERS_2, CHARACTERS_3, CHARACTERS_4, CHARACTERS_5, CHARACTERS_6, CHARACTERS_7, CHARACTERS_8, CHARACTERS_9, CHARACTERS_10, CHARACTERS_11, CHARACTERS_12, CHARACTERS_13, CHARACTERS_14, CHARACTERS_15, CHARACTERS_16, CHARACTERS_PROC_BUFFS, LUNAR_BUFFS, EXTRA_BUFFS, PILOTO_BUFFS]) {
  for (const [name, list] of Object.entries(batch)) CHARACTER_BUFFS[name] = [...(CHARACTER_BUFFS[name] ?? []), ...list];
}

const root = process.cwd();
const read = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const write = (rel: string, data: unknown) => writeFileSync(path.join(root, rel), JSON.stringify(data, null, 2) + '\n', 'utf8');

interface Bonus { description: string; params: number[] }
interface RawSet { name: string; bonuses: { onePiece?: Bonus; twoPiece?: Bonus; fourPiece?: Bonus } }
const meta = read<{ gameVersion: string }>('src/data/generated/meta.json');

/** Entradas feitas à mão (planilha de referência); as geradas por este script são refeitas a cada execução. */
const handMade = <T extends { fonte_info: string }>(list: T[]): T[] => list.filter((e) => !e.fonte_info.includes('scripts/curation/'));

/** Como chamar o que se conta em cada buff (o padrão da tela é "stacks"). */
const STACK_UNITS: Record<string, string> = {
  'Yelan:c4': 'inimigos marcados', 'Keqing:c6': 'efeitos ativos', 'Yanfei:a1': 'selos', 'Navia:c6': 'stacks acima de 3',
  'Aether (Dendro):a1': 'níveis de Luz de Lótus', 'Lumine (Dendro):a1': 'níveis de Luz de Lótus', 'Aether (Cryo):c6': 'stacks de Frostglow', 'Lumine (Cryo):c6': 'stacks de Frostglow',
};

/** Stacks/pontos de um buff: informado na curadoria ou o multiplicador inteiro `x` (2 a 20) dos valores de `stats` (todos iguais). */
function stackInfo(b: { stats?: unknown; stacks?: { max: number; unit?: string; levels?: Val[]; of?: string; default?: number; step?: number } | false }): { max: number; unit?: string; levels?: Val[]; of?: string; default?: number; step?: number } | undefined {
  if (b.stacks === false) return undefined;
  if (b.stacks) return b.stacks;
  const xs = new Set<number>();
  const walk = (x: unknown): void => {
    if (!x || typeof x !== 'object') return;
    const o = x as Record<string, unknown>;
    if (typeof o.x === 'number' && ('p' in o)) {
      if (Number.isInteger(o.x) && o.x >= 2 && o.x <= 20) xs.add(o.x);
      else xs.add(-1);
      return;
    }
    Object.values(o).forEach(walk);
  };
  walk(b.stats);
  const list = [...xs].filter((n) => n > 0);
  return list.length === 1 && !xs.has(-1) ? { max: list[0] } : undefined;
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;
const valueOf = (v: Val, params: number[], where: string, text = ''): number => {
  if (typeof v === 'number') return v;
  if ('lit' in v) return v.lit;
  if ('re' in v) {
    const m = new RegExp(v.re).exec(text);
    if (!m) throw new Error(`${where}: a expressão /${v.re}/ não casa com o texto do refinamento`);
    return round((parseFloat(m[1]) / 100) * (v.x ?? 1));
  }
  const raw = params[v.p];
  if (raw === undefined) throw new Error(`${where}: parâmetro ${v.p} não existe`);
  return round(raw * (v.x ?? 1));
};

/** Valor com multiplicador de stacks inteiro (`x` de 2 a 20), o mesmo critério de `stackInfo`. */
const stackX = (v: Val): number | undefined => (typeof v === 'object' && 'x' in v && v.x !== undefined && Number.isInteger(v.x) && v.x >= 2 && v.x <= 20 && ('p' in v || 're' in v) ? v.x : undefined);
const SUM_KEYS = ['atkPct', 'dmgPct', 'critRate', 'critDmg', 'em', 'er', 'hpPct', 'defPct', 'physDmgPct', 'physCritDmg', 'meltBonus'] as const;
const REC_KEYS = ['byType', 'critRateByType', 'critDmgByType', 'baseMultByType', 'reactionBonus'] as const;

/**
 * Separa os valores de arma/set que dependem de stacks (`x` = máximo) do resto: `base` fica na raiz e cada máximo vira um buff
 * `stacks` que o usuário escolhe (0 até o máximo), com os números do máximo como nos outros buffs com stacks.
 */
function splitStacks<T extends StatsCur>(cur: T): { base: T; groups: { max: number; stats: StatsCur }[] } {
  const base: Record<string, unknown> = { ...cur };
  const groups = new Map<number, Record<string, unknown>>();
  const cut = (sum: Sum | undefined): { rest: Sum | undefined; byX: Map<number, Val[]> } => {
    const items = (sum === undefined ? [] : Array.isArray(sum) ? sum : [sum]) as Val[];
    const byX = new Map<number, Val[]>();
    const rest: Val[] = [];
    for (const it of items) {
      const x = stackX(it);
      if (x === undefined) rest.push(it);
      else byX.set(x, [...(byX.get(x) ?? []), it]);
    }
    return { rest: rest.length === 0 ? undefined : rest.length === 1 ? rest[0] : rest, byX };
  };
  const group = (x: number) => groups.get(x) ?? (groups.set(x, {}), groups.get(x)!);
  const one = (items: Val[]) => (items.length === 1 ? items[0] : items);
  for (const k of SUM_KEYS) {
    const sum = (cur as unknown as Record<string, Sum | undefined>)[k];
    if (sum === undefined) continue;
    const { rest, byX } = cut(sum);
    if (byX.size === 0) continue;
    if (rest === undefined) delete base[k]; else base[k] = rest;
    for (const [x, items] of byX) group(x)[k] = one(items);
  }
  for (const k of REC_KEYS) {
    const rec = (cur as unknown as Record<string, Record<string, Sum> | undefined>)[k];
    if (!rec) continue;
    const nextBase: Record<string, Sum> = {};
    let touched = false;
    for (const [name, sum] of Object.entries(rec)) {
      const { rest, byX } = cut(sum);
      if (rest !== undefined) nextBase[name] = rest;
      for (const [x, items] of byX) {
        touched = true;
        const g = group(x);
        g[k] = { ...((g[k] as Record<string, Sum>) ?? {}), [name]: one(items) };
      }
    }
    if (touched) base[k] = nextBase;
  }
  return { base: base as T, groups: [...groups].sort((a, b) => a[0] - b[0]).map(([max, stats]) => ({ max, stats: stats as StatsCur })) };
}

const stackBuffs = (groups: { max: number; stats: StatsCur }[], c: Ctx, where: string): CharacterBuff[] =>
  groups.map((g) =>
    CharacterBuffSchema.parse({
      id: groups.length > 1 ? `stacks-${g.max}` : 'stacks', label: groups.length > 1 ? `Stacks (até ${g.max})` : 'Stacks da passiva', minConstellation: 0, scope: 'self', timed: false,
      stats: buffStats(g.stats, c), stacks: { max: g.max, ...(STACK_UNITS[where] ? { unit: STACK_UNITS[where] } : {}) },
    }),
  );

/** `stacks` de um buff pronto: máximo, nome da unidade e, se o efeito sobe aos saltos (10/20/30/48%), a tabela por quantidade. */
function stackMeta(b: { stats?: unknown; stacks?: { max: number; unit?: string; levels?: Val[]; of?: string; default?: number; step?: number } | false }, params: number[], where: string, unit?: string, text = '') {
  const info = stackInfo(b);
  if (!info) return undefined;
  let table: number[] | undefined;
  if (info.levels) {
    if (info.levels.length !== info.max) throw new Error(`${where}: "levels" precisa de ${info.max} valores (um por quantidade)`);
    const vals = info.levels.map((l) => valueOf(l, params, where, text));
    const top = vals[vals.length - 1];
    if (!top) throw new Error(`${where}: o valor do último nível é zero`);
    table = [0, ...vals.map((x) => round(x / top))];
  }
  const u = unit ?? info.unit;
  return { max: info.max, ...(u ? { unit: u } : {}), ...(table ? { table } : {}), ...(info.of ? { of: info.of } : {}), ...(info.default !== undefined ? { default: info.default } : {}), ...(info.step !== undefined ? { step: info.step } : {}) };
}

function buildSets(): SetEffect[] {
  const raw = read<RawSet[]>('src/data/generated/artifacts.json');
  const existing = handMade(read<SetEffect[]>('src/effects/sets.json'));
  const keep = new Map(existing.map((e) => [e.set, e]));
  const out: SetEffect[] = [];
  const source = `Lunaris ${meta.gameVersion} (descrição e parâmetros)`;

  for (const set of raw) {
    if (!set.bonuses.twoPiece || !set.bonuses.fourPiece) {
      // Sets de 1 peça ou sem bônus (Prayers, ???): só duração de status e utilidade, nada a calcular em dano.
      out.push(SetEffectSchema.parse({
        set: set.name, twoPieceMore: [], twoPieceBuffs: [], noDamage: true,
        note: set.bonuses.onePiece ? 'Só duração de status elemental recebido (1 peça): não muda o dano.' : 'Set sem bônus no jogo.',
        fonte_info: `${source}; scripts/curation/sets.ts (sem efeito em dano).`,
      }));
      continue;
    }
    const old = keep.get(set.name);
    if (old) {
      out.push(old);
      continue;
    }
    const cur = PILOTO_SETS[set.name] ?? FOUR_PIECE[set.name] ?? FOUR_PIECE_2[set.name];
    const two = PILOTO_SETS[set.name]?.twoPiece ?? parseTwoPiece(set.bonuses.twoPiece.description);
    const params = set.bonuses.fourPiece.params;
    const notes: string[] = [];
    if (!two) notes.push(`2 peças ("${set.bonuses.twoPiece.description.trim()}") não entra: sem efeito em dano.`);

    let fourPiece: SetEffect['fourPiece'];
    if (cur) {
      if (cur.expect && !set.bonuses.fourPiece.description.includes(cur.expect)) {
        throw new Error(`${set.name}: a descrição do 4 peças não contém "${cur.expect}" (o Lunaris mudou?)`);
      }
      const text = set.bonuses.fourPiece.description;
      const ctx: Ctx = { params, text, where: set.name };
      const v = (x: Val | undefined) => (x === undefined ? 0 : valueOf(x, params, set.name, text));
      const { base, groups } = splitStacks(cur);
      const crit = base.critRateByType || cur.critDmgByType ? [buildBuff({ id: 'crit-golpe', label: 'Crítico por golpe', stats: { critRateByType: base.critRateByType, critDmgByType: base.critDmgByType } }, ctx)] : [];
      fourPiece = {
        atkPct: v(base.atkPct), dmgPct: v(base.dmgPct), critRate: v(base.critRate), critDmg: v(base.critDmg), em: v(base.em),
        dmgPctByType: Object.fromEntries(Object.entries(base.byType ?? {}).map(([k, x]) => [k, v(x)])),
        meltBonus: v(base.meltBonus), vaporizeBonus: 0, er: v(base.er), hpPct: v(base.hpPct), defPct: v(base.defPct),
        ...(cur.resShred ? { resShred: { value: v(cur.resShred.value), elements: cur.resShred.elements, ...(cur.resShred.ifInTeam ? { ifInTeam: true } : {}), ...(cur.resShred.reacted ? { reacted: true } : {}) } } : {}),
        ...(cur.team ? { team: { atkPct: v(cur.team.atkPct), dmgPct: v(cur.team.dmgPct), em: v(cur.team.em) } } : {}),
        buffs: [...crit, ...stackBuffs(groups, ctx, set.name), ...(cur.buffs ?? []).map((b) => buildBuff(b, ctx))],
        flat: (cur.flat ?? []).map((f) => buildFlat(f, ctx)),
        reactionBonus: reactionsOf(base.reactionBonus, ctx),
        procs: (cur.procs ?? []).map((p) => buildProc(p, ctx)),
      };
      notes.push(cur.note);
    } else {
      notes.push('4 peças ainda não cadastrado: só o bônus de 2 peças conta.');
    }

    const entry: SetEffect = {
      set: set.name,
      ...(two ? { twoPiece: two[0], twoPieceMore: two.slice(1) } : { twoPieceMore: [] }),
      twoPieceBuffs: [],
      ...(cur?.noDamage ? { noDamage: true } : {}),
      ...(cur?.partial ? { partial: true } : {}),
      ...(fourPiece ? { fourPiece } : {}),
      note: notes.join(' '),
      fonte_info: `${source}; curadoria em scripts/curation/${set.name in PILOTO_SETS ? 'piloto-sets' : 'sets'}.ts.`,
    };
    out.push(SetEffectSchema.parse(entry));
  }
  const unknown = Object.keys({ ...FOUR_PIECE, ...FOUR_PIECE_2, ...PILOTO_SETS }).filter((n) => !raw.some((r) => r.name === n));
  if (unknown.length) throw new Error(`Curadoria com sets que não existem no Lunaris: ${unknown.join(', ')}`);
  return out;
}


// ---------- Armas ----------

interface RawWeapon {
  name: string;
  rarity: number;
  passive: { refinements: Bonus[] } | null;
}

const sumOf = (v: Sum | undefined, params: number[], where: string, text = ''): number =>
  v === undefined ? 0 : round(((Array.isArray(v) ? v : [v]) as Val[]).reduce((acc: number, x: Val) => acc + valueOf(x, params, where, text), 0));

type Ctx = { params: number[]; text: string; where: string };
const sm = (v: Sum | undefined, c: Ctx) => sumOf(v, c.params, c.where, c.text);
const byTypeOf = (b: StatsCur['byType'], c: Ctx) => Object.fromEntries(Object.entries(b ?? {}).map(([k, x]) => [k, sm(x, c)]));

/** Stats de um buff no formato do motor (todos os campos preenchidos). */
function buffStats(cur: StatsCur, c: Ctx) {
  return {
    atkPct: sm(cur.atkPct, c), dmgPct: sm(cur.dmgPct, c), critRate: sm(cur.critRate, c), critDmg: sm(cur.critDmg, c),
    em: sm(cur.em, c), er: sm(cur.er, c), hpPct: sm(cur.hpPct, c), defPct: sm(cur.defPct, c),
    dmgPctByType: byTypeOf(cur.byType, c), critRateByType: byTypeOf(cur.critRateByType, c), critDmgByType: byTypeOf(cur.critDmgByType, c), baseMultByType: byTypeOf(cur.baseMultByType, c),
    physDmgPct: sm(cur.physDmgPct, c), physCritDmg: sm(cur.physCritDmg, c), reactionBonus: reactionsOf(cur.reactionBonus, c),
  };
}

const reactionsOf = (r: StatsCur['reactionBonus'], c: Ctx) => Object.fromEntries(Object.entries(r ?? {}).map(([k, x]) => [k, sm(x, c)]));

/** Golpe extra: cada escala é a soma dos valores (parâmetro, literal ou regex) no refinamento/contexto dado. */
function buildProc(p: ProcCur, c: Ctx): Proc {
  const scale = Object.fromEntries(Object.entries(p.scale).map(([k, x]) => [k, sm(x, c)]).filter(([, v]) => v !== 0));
  if (!Object.keys(scale).length) throw new Error(`${c.where}: golpe extra ${p.id} sem escala`);
  return ProcSchema.parse({
    id: p.id, label: p.label, scale, ...(p.element ? { element: p.element } : {}), ...(p.hitType ? { hitType: p.hitType } : {}),
    ...(p.special ? { special: p.special } : {}), ...(p.note ? { note: p.note } : {}),
  });
}

function buildBuff(b: BuffCur, c: Ctx): CharacterBuff {
  return CharacterBuffSchema.parse({
    id: b.id, label: b.label, minConstellation: 0, scope: b.scope ?? 'self', timed: b.timed ?? false,
    ...(b.forElements ? { forElements: b.forElements } : {}),
    ...(b.stats ? { stats: buffStats(b.stats, c) } : {}),
    ...(b.convert
      ? {
          convert: {
            from: b.convert.from, perPoint: sm(b.convert.perPoint, c), threshold: sm(b.convert.threshold, c),
            ...(b.convert.cap !== undefined ? { cap: sm(b.convert.cap, c) } : {}), to: b.convert.to,
          },
        }
      : {}),
    ...(b.team ? { team: b.team } : {}),
    ...(stackInfo(b) ? { stacks: stackMeta(b, c.params, c.where, undefined, c.text) } : {}),
  });
}

const buildFlat = (f: FlatCur, c: Ctx): WeaponFlat => ({
  name: f.name, sourceStat: f.sourceStat, perPoint: sm(f.perPoint, c),
  ...(f.cap !== undefined ? { capPerHit: sm(f.cap, c) } : {}), hitTypes: f.hitTypes, ...(f.labels ? { labels: f.labels } : {}), ...(f.stacks !== undefined ? { stacks: f.stacks } : {}),
  ...(f.targets ? { targets: f.targets } : {}), ...(f.elements ? { elements: f.elements } : {}),
});

/** Números de um refinamento: os campos simples vão na raiz; o resto vira buffs (crítico por golpe, conversões, regras de time). */
function gearStats(full: GearCur, c: Ctx): WeaponStats {
  const { base: cur, groups } = splitStacks(full);
  const crit = cur.critRateByType || cur.critDmgByType ? [buildBuff({ id: 'crit-golpe', label: 'Crítico por golpe', stats: { critRateByType: cur.critRateByType, critDmgByType: cur.critDmgByType } }, c)] : [];
  // Bônus Físico e de reação do próprio dono viram um buff sempre ativo (a raiz da arma só tem os stats simples).
  if (cur.physDmgPct || cur.physCritDmg || cur.reactionBonus) {
    crit.push(buildBuff({ id: 'dono', label: 'Bônus Físico/de reação', stats: { physDmgPct: cur.physDmgPct, physCritDmg: cur.physCritDmg, reactionBonus: cur.reactionBonus } }, c));
  }
  const t = cur.team;
  return {
    atkPct: sm(cur.atkPct, c), dmgPct: sm(cur.dmgPct, c), critRate: sm(cur.critRate, c), critDmg: sm(cur.critDmg, c),
    em: sm(cur.em, c), er: sm(cur.er, c), hpPct: sm(cur.hpPct, c), defPct: sm(cur.defPct, c),
    dmgPctByType: byTypeOf(cur.byType, c),
    ...(t ? { team: { atkPct: sm(t.atkPct, c), dmgPct: sm(t.dmgPct, c), em: sm(t.em, c) } } : {}),
    buffs: [...crit, ...stackBuffs(groups, c, c.where.replace(/ Rd$/, '')), ...(cur.buffs ?? []).map((b) => buildBuff(b, c))],
    flat: (cur.flat ?? []).map((f) => buildFlat(f, c)),
    procs: (cur.procs ?? []).map((p) => buildProc(p, c)),
  };
}

const sets = buildSets();
write('src/effects/sets.json', sets);
console.log(`sets.json: ${sets.length} sets (${sets.filter((s) => s.fourPiece).length} com 4 peças, ${sets.filter((s) => s.twoPiece).length} com 2 peças)`);

function buildWeapons(): WeaponEffect[] {
  const raw = read<RawWeapon[]>('src/data/generated/weapons.json');
  const existing = handMade(read<WeaponEffect[]>('src/effects/weapons.json'));
  const keep = new Map(existing.map((e) => [e.weapon, e]));
  const out: WeaponEffect[] = [...existing];
  const errors: string[] = [];
  const source = `Lunaris ${meta.gameVersion} (descrição e parâmetros por refinamento)`;
  const all: Record<string, GearCur> = { ...WEAPONS, ...WEAPONS_2, ...PILOTO_ARMAS };

  for (const [name, cur] of Object.entries(all)) {
    if (keep.has(name)) continue; // já veio da planilha de referência: não sobrescrever
    const w = raw.find((x) => x.name === name && x.passive) ?? raw.find((x) => x.name === name);
    if (!w) {
      errors.push(`${name}: arma não existe no Lunaris`);
      continue;
    }
    const flags = { ...(cur.noDamage ? { noDamage: true } : {}), ...(cur.partial ? { partial: true } : {}) };
    const fonte = `${source}; curadoria em scripts/curation/${name in PILOTO_ARMAS ? 'piloto-armas' : name in WEAPONS_2 ? 'weapons2' : 'weapons'}.ts.`;
    if (!w.passive || w.passive.refinements.length !== 5) {
      if (cur.expect) {
        errors.push(`${name}: tem "expect", mas a arma não tem passiva no Lunaris`);
        continue;
      }
      out.push(WeaponEffectSchema.parse({ weapon: name, ...gearStats({ note: '' }, { params: [], text: '', where: name }), note: cur.note, ...flags, fonte_info: fonte }));
      continue;
    }
    if (cur.expect && !w.passive.refinements[0].description.includes(cur.expect)) {
      errors.push(`${name}: a descrição do R1 não contém "${cur.expect}" (o Lunaris mudou?)`);
      continue;
    }
    try {
      const at = (r: number) => gearStats(cur, { params: w.passive!.refinements[r].params, text: w.passive!.refinements[r].description, where: `${name} R${r + 1}` });
      const refinements = [0, 1, 2, 3, 4].map(at);
      out.push(WeaponEffectSchema.parse({ weapon: name, ...refinements[0], refinements, note: cur.note, ...flags, fonte_info: fonte }));
    } catch (e) {
      errors.push(`${name}: ${(e as Error).message}`);
    }
  }
  if (errors.length) throw new Error(['Curadoria de armas com problemas:', ...errors].join('\n  '));
  return out;
}

const weapons = buildWeapons();
write('src/effects/weapons.json', weapons);
console.log(`weapons.json: ${weapons.length} armas (${weapons.filter((w) => w.refinements).length} com tabela por refinamento)`);

// ---------- Personagens (passivas e constelações) ----------

interface RawChar {
  passives?: Record<string, { description: string; params: number[] }>;
  constellations?: Record<string, { description: string; params: number[] }>;
  skills?: Record<string, { description: string; multipliers?: Record<string, string[]> }>;
}

const SKILL_KEY = { normal: 'normalattack', skill: 'elementalskill', burst: 'elementalburst' } as const;
/** "3.84% Max HP" -> 0.0384 */
const percentOf = (text: string): number => {
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*%/.exec(text);
  if (!m) throw new Error(`valor sem porcentagem: "${text}"`);
  return round(Number(m[1]) / 100);
};

function buildCharacters(): CharacterEffect[] {
  const existing = handMade(read<CharacterEffect[]>('src/effects/characters.json'));
  const chars = read<{ id: string; name: string }[]>('src/data/generated/characters.json');
  const out: CharacterEffect[] = [...existing];
  const errors: string[] = [];
  const source = `Lunaris ${meta.gameVersion} (passivas e constelações)`;
  const strip = (t: string) => t.replace(/<[^>]*>/g, '').replace(/\{\/?LINK[^}]*\}/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ');

  const moves = read<{ character: string; talent: string; label: string; variant: number }[]>('src/data/generated/moves.json');
  const names = [...new Set([...Object.keys(POINT_MOVES), ...Object.keys(CHARACTER_BUFFS), ...Object.keys(CHARACTER_NOTES), ...Object.keys(CHARACTER_PROCS), ...Object.keys(LUNAR_PROCS), ...Object.keys(FACTIONS), ...Object.keys(SPECIAL_MOVES)])];
  for (const name of names) {
    const list = CHARACTER_BUFFS[name] ?? [];
    const handMadeEntry = existing.find((e) => e.character === name);
    const c = chars.find((x) => x.name === name);
    if (!c) {
      errors.push(`${name}: não existe nos dados do jogo`);
      continue;
    }
    let raw: RawChar;
    try {
      raw = read<RawChar>(`data/raw/lunaris/${meta.gameVersion}/en/char/${c.id}.json`);
    } catch {
      errors.push(`${name}: sem o JSON bruto em data/raw (rode npm run sync:data)`);
      continue;
    }
    const dup = list.map((b) => b.id).filter((id, i, all) => all.indexOf(id) !== i);
    if (dup.length) errors.push(`${name}: ids de buff repetidos: ${[...new Set(dup)].join(', ')}`);
    const buffs = list.map((b) => {
      const isConst = b.src.startsWith('const');
      const kitNode = b.kit ? raw.skills?.[SKILL_KEY[b.kit.talent]] : undefined;
      if (b.kit && !kitNode) throw new Error(`${name} ${b.id}: o talento ${b.kit.talent} não existe`);
      const node = b.kit ? { description: kitNode!.description, params: [] as number[] } : (isConst ? raw.constellations : raw.passives)?.[b.src];
      if (!node) throw new Error(`${name} ${b.id}: ${b.src} não existe`);
      let levelTable: number[] | undefined;
      if (b.kit?.table) {
        if (b.kit.table.length !== 15) throw new Error(`${name} ${b.id}: a tabela precisa de 15 níveis`);
        levelTable = b.kit.table;
      } else if (b.kit?.key) {
        const row = kitNode!.multipliers?.[b.kit.key];
        if (!row || row.length !== 15) throw new Error(`${name} ${b.id}: a linha "${b.kit.key}" não existe ou não tem 15 níveis`);
        levelTable = row.map(percentOf);
      }
      if (!strip(node.description).includes(b.expect)) {
        errors.push(`${name} ${b.id}: a descrição de ${b.src} não contém "${b.expect}" (o Lunaris mudou?)`);
      }
      const v = (x: Val | undefined) => (x === undefined ? 0 : valueOf(x, node.params, `${name} ${b.id}`));
      const s = b.stats;
      return {
        id: b.id,
        label: b.label,
        minConstellation: b.minConstellation ?? (isConst ? Number(b.src.slice(5)) : 0),
        ...(levelTable ? { level: { talent: b.kit!.talent, table: levelTable } } : {}),
        scope: b.scope,
        timed: b.timed,
        ...(stackInfo(b) ? { stacks: stackMeta(b, node.params, `${name} ${b.id}`, STACK_UNITS[`${name}:${b.id}`], node.description) } : {}),
        ...(b.forElements ? { forElements: b.forElements } : {}),
        ...(b.decay ? { decay: b.decay } : {}),
        ...(b.forFactions ? { forFactions: b.forFactions } : {}),
        ...(b.replaces ? { replaces: b.replaces } : {}),
        ...(s
          ? {
              stats: {
                atkPct: v(s.atkPct), dmgPct: v(s.dmgPct), critRate: v(s.critRate), critDmg: v(s.critDmg), em: v(s.em),
                er: v(s.er), hpPct: v(s.hpPct), defPct: v(s.defPct),
                dmgPctByType: Object.fromEntries(Object.entries(s.byType ?? {}).map(([k, x]) => [k, v(x)])),
                critRateByType: Object.fromEntries(Object.entries(s.critRateByType ?? {}).map(([k, x]) => [k, v(x)])),
                critDmgByType: Object.fromEntries(Object.entries(s.critDmgByType ?? {}).map(([k, x]) => [k, v(x)])),
                baseMultByType: Object.fromEntries(Object.entries(s.baseMultByType ?? {}).map(([k, x]) => [k, v(x)])),
                defIgnore: v(s.defIgnore),
                atkFlat: v(s.atkFlat), atkBaseFlat: v(s.atkBaseFlat), hpFlat: v(s.hpFlat), defFlat: v(s.defFlat),
                physDmgPct: v(s.physDmgPct), physCritDmg: v(s.physCritDmg),
                reactionBonus: Object.fromEntries(Object.entries(s.reactionBonus ?? {}).map(([k, x]) => [k, v(x)])),
              },
            }
          : {}),
        ...(b.flat
          ? {
              flat: b.flat.map((f) => ({
                name: f.name, sourceStat: f.sourceStat, perPoint: v(f.perPoint), ...(f.cap !== undefined ? { capPerHit: v(f.cap) } : {}),
                hitTypes: f.hitTypes, ...(f.labels ? { labels: f.labels } : {}), ...(f.stacks !== undefined ? { stacks: f.stacks } : {}),
                ...(f.targets ? { targets: f.targets } : {}), ...(f.elements ? { elements: f.elements } : {}),
              })),
            }
          : {}),
        ...(b.team
          ? {
              team: {
                ...(b.team.only ? { only: b.team.only } : {}),
                ...(b.team.eachOf ? { eachOf: b.team.eachOf } : {}),
                ...(b.team.scale ? { scale: { of: b.team.scale.of, table: b.team.scale.table.map((x) => v(x)) } } : {}),
                ...(b.team.moonsign ? { moonsign: b.team.moonsign } : {}),
                ...(b.team.moonsignMax ? { moonsignMax: b.team.moonsignMax } : {}),
                ...(b.team.hexerei ? { hexerei: b.team.hexerei } : {}),
              },
            }
          : {}),
        ...(b.convert
          ? {
              convert: {
                from: b.convert.from,
                source: b.convert.source ?? 'self',
                perPoint: v(b.convert.perPoint),
                threshold: v(b.convert.threshold),
                ...(b.convert.cap !== undefined ? { cap: v(b.convert.cap) } : {}),
                ...(b.convert.capBaseAtk !== undefined ? { capBaseAtk: b.convert.capBaseAtk } : {}),
                to: b.convert.to,
              },
            }
          : {}),
        ...(b.resShred ? { resShred: { value: v(b.resShred.value), elements: b.resShred.elements } } : {}),
        ...(b.defShred !== undefined ? { defShred: v(b.defShred) } : {}),
        note: b.note,
      };
    });
    const notes = Object.entries(CHARACTER_NOTES[name] ?? {}).map(([src, n]) => ({ src, kind: n!.kind, note: n!.note }));
    const procs = [...(CHARACTER_PROCS[name] ?? []), ...(LUNAR_PROCS[name] ?? [])].map((p) => {
      const isConst = p.src.startsWith('const');
      const node = (isConst ? raw.constellations : raw.passives)?.[p.src];
      if (!node) throw new Error(`${name} ${p.id}: ${p.src} não existe`);
      if (!strip(node.description).includes(p.expect)) errors.push(`${name} ${p.id}: a descrição de ${p.src} não contém "${p.expect}" (o Lunaris mudou?)`);
      const scale = Object.fromEntries(Object.entries(p.scale).map(([k, x]) => [k, valueOf(x, node.params, `${name} ${p.id}`)]));
      if (Object.values(scale).some((x) => !(x > 0)) || (!p.of && !Object.keys(scale).length)) errors.push(`${name} ${p.id}: escala zerada ou negativa (parâmetro errado?)`);
      let of;
      if (p.of) {
        const orig = moves.find((m) => m.character === name && m.talent === p.of!.talent && m.label === p.of!.label && m.variant === (p.of!.variant ?? 0));
        if (!orig) errors.push(`${name} ${p.id}: o golpe "${p.of.label}" (${p.of.talent}) não existe no Lunaris`);
        of = { talent: p.of.talent, label: p.of.label, variant: p.of.variant ?? 0, fraction: valueOf(p.of.fraction, node.params, `${name} ${p.id}`) };
      }
      return ProcSchema.parse({
        id: p.id, label: p.label, scale, src: p.src, minConstellation: isConst ? Number(p.src.slice(5)) : 0,
        ...(p.element ? { element: p.element } : {}), ...(p.hitType ? { hitType: p.hitType } : {}),
        ...(p.special ? { special: p.special } : {}), ...(of ? { of } : {}), note: p.note,
      });
    });
    const procIds = procs.map((p) => p.id).filter((id, i, all) => all.indexOf(id) !== i);
    if (procIds.length) errors.push(`${name}: ids de golpe extra repetidos: ${procIds.join(', ')}`);
    const factions = FACTIONS[name] ?? [];
    const pointMoves = (POINT_MOVES[name] ?? []).map((p) => {
      const row = raw.skills?.[SKILL_KEY[p.kitTalent]]?.multipliers?.[p.key];
      if (!row || row.length !== 15) throw new Error(`${name}: a linha "${p.key}" não existe ou não tem 15 níveis`);
      for (const l of p.labels) if (!moves.some((m) => m.character === name && m.talent === p.talent && m.label === l)) errors.push(`${name}: golpe "${l}" (${p.talent}) não existe no Lunaris`);
      return { talent: p.talent, labels: p.labels, levelTalent: p.kitTalent, perPoint: row.map((t) => percentOf(String(t))), max: p.max, unit: p.unit, ...(p.cadinho ? { cadinho: p.cadinho } : {}) };
    });
    const specialMoves = SPECIAL_MOVES[name] ?? [];
    for (const s of specialMoves) {
      if (!moves.some((m) => m.character === name && m.talent === s.talent && m.label === s.label && (s.variant === undefined || m.variant === s.variant))) {
        errors.push(`${name}: golpe Lunar/Estelar "${s.label}" (${s.talent}) não existe no Lunaris`);
      }
    }
    if (handMadeEntry) {
      // Personagem que já veio da planilha de referência: os efeitos dela ficam e a curadoria soma os buffs e as notas.
      const at = out.findIndex((e) => e.character === name);
      out[at] = CharacterEffectSchema.parse({ ...handMadeEntry, buffs: [...(handMadeEntry.buffs ?? []).filter((old) => !buffs.some((n) => n.id === old.id)), ...buffs], notes, procs, factions, specialMoves, pointMoves });
      continue;
    }
    out.push(CharacterEffectSchema.parse({
      character: name,
      atkPct: 0, dmgPct: 0, critRate: 0, critDmg: 0, em: 0,
      buffs,
      notes,
      procs,
      factions,
      specialMoves,
      pointMoves,
      fonte_info: `${source}; curadoria em scripts/curation/characters.ts.`,
    }));
  }
  if (errors.length) throw new Error(['Curadoria de personagens com problemas:', ...errors].join('\n  '));
  return out;
}

const characters = buildCharacters();
write('src/effects/characters.json', characters);
console.log(`characters.json: ${characters.length} personagens (${characters.filter((c) => c.buffs?.length).length} com buffs, ${characters.filter((c) => c.notes?.length).length} com notas)`);
