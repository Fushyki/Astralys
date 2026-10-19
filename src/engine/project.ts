/**
 * Formato de projeto salvo (`RotationProject`, JSON versionado) e a resolução para as entradas do motor.
 * O projeto guarda NOMES (personagem, arma, set, golpe), nunca os dados do jogo: o mesmo arquivo continua válido
 * quando o Lunaris atualiza os números. A resolução junta o projeto com os dados do jogo e os efeitos.
 */
import { z } from 'zod';
import type { ArtifactSet, Character, Move, Talent, Weapon } from '../data/schema';
import { planilhaEffect } from './compat/planilha';
import { activeCharacterBuffs } from './stats';
import { weaponStatsAt, type CharacterBuff, type CharacterEffect, type FlatDamageEffect, type SetEffect, type WeaponEffect, type WeaponFlat } from '../effects/schema';
import { SUBSTATS, type Rolls } from './artifacts';
import { AMP_EM_COEFFICIENT_SHEET } from './constants/reactions';
import type { ExtraScale, ReactionChoice, ResolvedMove, RotationAction } from './rotation';
import type { MemberInput } from './stats';
import type { GlobalConfig, TeamInput } from './team';

export const PROJECT_SCHEMA_VERSION = 1;
export const MAX_TEAM_SIZE = 4;

// ---------- Dados necessários para resolver ----------

export interface GameData {
  characters: Character[];
  moves: Move[];
  weapons: Weapon[];
  artifacts: ArtifactSet[];
}

export interface EffectsData {
  characters: CharacterEffect[];
  weapons: WeaponEffect[];
  sets: SetEffect[];
  flatDamage: FlatDamageEffect[];
}

// ---------- Esquema do projeto ----------

const Rarity = z.union([z.literal(4), z.literal(5)]);
const TalentLevel = z.number().int().min(1).max(15);

export const ArtifactConfigSchema = z.object({
  rarity: z.object({ flower: Rarity, plume: Rarity, sands: Rarity, goblet: Rarity, circlet: Rarity }),
  sands: z.string().min(1),
  goblet: z.string().min(1),
  circlet: z.string().min(1),
});

export const MemberRefSchema = z.object({
  character: z.string().min(1),
  weapon: z.string().min(1),
  /** Refinamento da arma (1 a 5). Ausente = 1. */
  refinement: z.number().int().min(1).max(5).optional(),
  primarySet: z.string().min(1).optional(),
  secondarySet: z.string().min(1).optional(),
  /** false = só 2 peças do set principal (sem o bônus de 4 peças). Padrão: 4 peças quando não há segundo set. */
  fourPiece: z.boolean().optional(),
  artifacts: ArtifactConfigSchema,
  /** Níveis BASE dos talentos (sem o +3 das constelações). */
  talents: z.object({ normal: TalentLevel, skill: TalentLevel, burst: TalentLevel }),
  /** Constelação (0 a 6). Ausente = C0. Sobe em 3 o nível dos talentos da C3 e da C5. */
  constellation: z.number().int().min(0).max(6).optional(),
  minER: z.number().min(0).optional(),
  totalRolls: z.number().int().min(0).optional(),
  forcedCritRolls: z.number().int().min(0).optional(),
  /** Rolls totais por substat definidos à mão (os que faltam valem o mínimo). Ausente = otimizar. */
  manualRolls: z.record(z.enum(SUBSTATS), z.number().min(0).max(60)).optional(),
});
export type MemberRef = z.infer<typeof MemberRefSchema>;

export const ExtraBuffSchema = z.object({
  target: z.string().min(1),
  stat: z.string().min(1),
  value: z.number(),
  team: z.boolean(),
  label: z.string().optional(),
  description: z.string().optional(),
});

export const ConfigSchema = z.object({
  characterLevel: z.number().int().min(1).max(100),
  enemyLevel: z.number().int().min(1).max(200),
  enemyBaseRes: z.number().min(-1).max(2),
  enemyDefRed: z.number().min(0).max(0.9),
  enemyDefIgnore: z.number().min(0).max(1).optional(),
  minRollsPerSubstat: z.number().int().min(0).max(6),
  rotationDuration: z.number().positive(),
});

export const MoveRefSchema = z.object({
  character: z.string().min(1),
  talent: z.enum(['normal', 'skill', 'burst']),
  label: z.string().min(1),
  variant: z.number().int().min(0).default(0),
});
export type MoveRef = z.infer<typeof MoveRefSchema>;

export const ExtraScaleSchema = z
  .object({ atk: z.number(), em: z.number(), hp: z.number(), def: z.number(), flat: z.number() })
  .partial();

/** Intervalo em que a fonte de buff `tag` está ativa (início incluído, fim excluído). */
export const BuffWindowSchema = z
  .object({
    id: z.string().min(1),
    tag: z.string().min(1),
    start: z.number().min(0),
    end: z.number().min(0),
  })
  .refine((w) => w.end > w.start, { message: 'O fim da janela deve ser depois do início.', path: ['end'] });
export type BuffWindow = z.infer<typeof BuffWindowSchema>;

export const ReactionChoiceSchema = z.enum(['none', 'melt', 'vaporize', 'spread', 'aggravate']);

export const ActionSchema = z.object({
  id: z.string().min(1),
  /** Índice do membro em `members`. */
  member: z.number().int().min(0),
  move: MoveRefSchema,
  displayName: z.string().optional(),
  extraScale: ExtraScaleSchema.optional(),
  executions: z.number().positive().default(1),
  reaction: ReactionChoiceSchema.default('none'),
  /** Etiquetas de buff de time ativas nesta ação (usadas quando `tagSource` é 'manual'). */
  activeTags: z.array(z.string()).default([]),
  /** 'manual': usa `activeTags` (perfis da planilha). 'windows': as etiquetas vêm das janelas de buff, pelo `time`. */
  tagSource: z.enum(['manual', 'windows']).default('manual'),
  dmgAdjust: z.number().default(0),
  /** Instante da rotação, em segundos. */
  time: z.number().min(0),
  note: z.string().optional(),
});
export type ActionRef = z.infer<typeof ActionSchema>;

export const RotationProjectSchema = z
  .object({
    schemaVersion: z.literal(PROJECT_SCHEMA_VERSION),
    id: z.string().min(1),
    name: z.string().min(1).max(120),
    /** Versão do jogo (Lunaris) com que o projeto foi montado. */
    gameVersion: z.string().default(''),
    /** 'planilha' reproduz os atalhos da planilha de referência (coeficiente de EM 2,78, elementos do personagem). */
    compat: z.enum(['none', 'planilha']).default('none'),
    config: ConfigSchema,
    members: z.array(MemberRefSchema).min(1).max(MAX_TEAM_SIZE),
    extras: z.array(ExtraBuffSchema).default([]),
    actions: z.array(ActionSchema).default([]),
    /** Janelas de buff no tempo; dão as etiquetas das ações com `tagSource: 'windows'`. */
    buffWindows: z.array(BuffWindowSchema).default([]),
    /** Ids de buffs/fontes desligados pelo usuário (checkbox em "Buffs recebidos"). */
    disabled: z.array(z.string()).default([]),
    /** Perfis nomeados (conjuntos de etiquetas), úteis para aplicar rápido a várias ações. */
    profiles: z.record(z.array(z.string())).default({}),
    meta: z
      .object({
        author: z.string().optional(),
        patch: z.string().optional(),
        tags: z.array(z.string()).default([]),
        /** Marcado no Vault como favorito ("Salvar no Vault"). */
        favorite: z.boolean().optional(),
        /** Compartilhado por link público na conta online (o servidor guarda `is_public`). */
        shared: z.boolean().optional(),
        /** Textos e cor do card (título, selo, etiqueta de versão, apelido do autor e cor de destaque). */
        card: z.object({ title: z.string().max(60), badge: z.string().max(40), tag: z.string().max(40), nick: z.string().max(30), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/) }).partial().optional(),
        /** Calculadora de recarga: partículas de inimigos e a configuração de cada personagem (pelo nome). */
        energy: z
          .object({
            enemyParticles: z.number().min(0).max(100),
            margin: z.enum(['low', 'medium', 'high']).default('medium'),
            slots: z.record(
              z.object({
                skillUses: z.number().min(0).max(50),
                particles: z.number().min(0).max(20).optional(),
                onField: z.array(z.string()),
                favProcs: z.number().min(0).max(50),
                favTarget: z.string().nullable(),
                flat: z.number().min(0).max(500),
                fieldTime: z.number().min(0).max(1),
                useBurst: z.boolean(),
              }),
            ),
          })
          .optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
      .default({ tags: [], createdAt: '', updatedAt: '' }),
  })
  .superRefine((p, ctx) => {
    p.actions.forEach((a, i) => {
      const member = p.members[a.member];
      if (!member) {
        ctx.addIssue({ code: 'custom', path: ['actions', i, 'member'], message: `Membro ${a.member} não existe na equipe.` });
      } else if (member.character !== a.move.character) {
        ctx.addIssue({
          code: 'custom', path: ['actions', i, 'move', 'character'],
          message: `O golpe é de ${a.move.character}, mas o membro ${a.member} é ${member.character}.`,
        });
      }
    });
    const ids = new Set<string>();
    p.actions.forEach((a, i) => {
      if (ids.has(a.id)) ctx.addIssue({ code: 'custom', path: ['actions', i, 'id'], message: `Id de ação repetido: ${a.id}` });
      ids.add(a.id);
    });
    const wids = new Set<string>();
    p.buffWindows.forEach((w, i) => {
      if (wids.has(w.id)) ctx.addIssue({ code: 'custom', path: ['buffWindows', i, 'id'], message: `Id de janela repetido: ${w.id}` });
      wids.add(w.id);
    });
  });

export type RotationProject = z.infer<typeof RotationProjectSchema>;

/** Valida um projeto vindo de fora (arquivo, backend, localStorage). Lança ZodError com os problemas. */
export const parseProject = (raw: unknown): RotationProject => RotationProjectSchema.parse(raw);

/** Etiquetas ativas no instante `t`: as das janelas que o cobrem. Resultado ordenado e sem repetição. */
export function tagsAt(windows: readonly BuffWindow[], t: number): string[] {
  const tags = new Set<string>();
  for (const w of windows) if (t >= w.start && t < w.end) tags.add(w.tag);
  return [...tags].sort();
}

// ---------- Resolução ----------

export class ProjectResolveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectResolveError';
  }
}

export interface MoveIndex {
  find(ref: MoveRef): Move | undefined;
}

export function indexMoves(moves: Move[]): MoveIndex {
  const map = new Map<string, Move>();
  for (const m of moves) map.set(`${m.character}|${m.talent}|${m.label}|${m.variant}`, m);
  return { find: (r) => map.get(`${r.character}|${r.talent}|${r.label}|${r.variant}`) };
}

/** Junta a referência de um golpe com os dados do Lunaris. */
export function resolveMove(index: MoveIndex, ref: MoveRef, displayName?: string, extra?: ExtraScale): ResolvedMove {
  const move = index.find(ref);
  if (!move) {
    throw new ProjectResolveError(`Golpe não encontrado nos dados do jogo: ${ref.character} / ${ref.talent} / ${ref.label}`);
  }
  return {
    id: move.id,
    character: move.character,
    talent: move.talent as Talent,
    hitType: move.hitType,
    label: move.label,
    displayName: displayName ?? `${move.character}: ${move.label}`,
    hits: move.hits,
    scale: move.scale,
    extra,
  };
}

function byName<T extends { name: string }>(list: T[], name: string, what: string): T {
  const found = list.find((x) => x.name === name);
  if (!found) throw new ProjectResolveError(`${what} "${name}" não existe nos dados do jogo.`);
  return found;
}

/** Níveis efetivos dos talentos: o nível base mais 3 no talento da C3 (se C≥3) e no da C5 (se C≥5), no máximo 15. */
export function effectiveTalents(
  base: { normal: number; skill: number; burst: number },
  constellation: number | undefined,
  character: { constellationBoosts?: { c3: Talent | null; c5: Talent | null } },
): { normal: number; skill: number; burst: number } {
  const out = { ...base };
  const c = constellation ?? 0;
  const b = character.constellationBoosts;
  if (b?.c3 && c >= 3) out[b.c3] = Math.min(15, out[b.c3] + 3);
  if (b?.c5 && c >= 5) out[b.c5] = Math.min(15, out[b.c5] + 3);
  return out;
}

/** Buffs de arma e de set (conversões, crítico por golpe, regras de time) no formato dos buffs de personagem. */
export function gearBuffs(m: Pick<MemberInput, 'weapon' | 'weaponEffect' | 'refinement' | 'primarySet' | 'secondarySet' | 'fourPiece'>): CharacterBuff[] {
  const out: CharacterBuff[] = [];
  const add = (prefix: string, label: string, list: CharacterBuff[]) => {
    for (const b of list) out.push({ ...b, id: `${prefix}:${b.id}`, label: `${label}: ${b.label}` });
  };
  if (m.weaponEffect) add('arma', m.weapon.name, weaponStatsAt(m.weaponEffect, m.refinement).buffs);
  for (const set of [m.primarySet, m.secondarySet]) {
    if (set?.effect?.twoPieceBuffs?.length) add(`set2-${set.name}`, set.name, set.effect.twoPieceBuffs);
  }
  if (m.primarySet && !m.secondarySet && m.fourPiece !== false && m.primarySet.effect?.fourPiece?.buffs?.length) {
    add(`set4-${m.primarySet.name}`, m.primarySet.name, m.primarySet.effect.fourPiece.buffs);
  }
  return out;
}

/** Dano fixo de arma e de set de 4 peças (ex.: "Dano de Habilidade aumentado em 40% da DEF"). */
export function gearFlat(members: MemberInput[]): FlatDamageEffect[] {
  const out: FlatDamageEffect[] = [];
  members.forEach((m) => {
    const lists: [string, WeaponFlat[]][] = [];
    if (m.weaponEffect) lists.push([m.weapon.name, weaponStatsAt(m.weaponEffect, m.refinement).flat]);
    if (m.primarySet && !m.secondarySet && m.fourPiece !== false) lists.push([m.primarySet.name, m.primarySet.effect?.fourPiece?.flat ?? []]);
    for (const b of activeCharacterBuffs(m)) if (b.flat?.length) lists.push([b.label, b.flat]);
    for (const [origin, flat] of lists) {
      for (const f of flat) {
        out.push({
          name: `${origin}: ${f.name}`, source: m.character.name, sourceStat: f.sourceStat, perPoint: f.perPoint, threshold: 0,
          ...(f.capPerHit !== undefined ? { capPerHit: f.capPerHit } : {}), targets: [m.character.name], elements: [], hitTypes: f.hitTypes,
          ...(f.stacks !== undefined ? { stacks: f.stacks } : {}), active: true, fonte_info: `Passiva de ${origin} (curadoria do Lunaris)`,
        });
      }
    }
  });
  return out;
}

export function resolveMember(ref: MemberRef, data: GameData, effects: EffectsData, minRolls = 0): MemberInput {
  const setOf = (name?: string) => (name ? { name, effect: effects.sets.find((s) => s.set === name) } : undefined);
  const weapon = byName(data.weapons, ref.weapon, 'Arma');
  const character = byName(data.characters, ref.character, 'Personagem');
  const weaponEffect = effects.weapons.find((w) => w.weapon === weapon.name);
  const primarySet = setOf(ref.primarySet);
  const secondarySet = setOf(ref.secondarySet);
  const gear = gearBuffs({ weapon, weaponEffect, refinement: ref.refinement, primarySet, secondarySet, fourPiece: ref.fourPiece });
  const own = effects.characters.find((c) => c.character === ref.character);
  const characterEffect: CharacterEffect | undefined = gear.length
    ? {
        ...(own ?? { character: ref.character, atkPct: 0, dmgPct: 0, critRate: 0, critDmg: 0, em: 0, appliesToSelf: false, notes: [], fonte_info: 'Buffs de arma e set' }),
        buffs: [...(own?.buffs ?? []), ...gear],
      }
    : own;
  return {
    character,
    weapon,
    characterEffect,
    weaponEffect,
    primarySet,
    secondarySet,
    fourPiece: ref.fourPiece,
    refinement: ref.refinement,
    artifacts: ref.artifacts,
    talents: effectiveTalents(ref.talents, ref.constellation, character),
    constellation: ref.constellation,
    minER: ref.minER,
    totalRolls: ref.totalRolls,
    forcedCritRolls: ref.forcedCritRolls,
    manualRolls: ref.manualRolls ? manualToRolls(ref.manualRolls, minRolls) : undefined,
  };
}

/** Completa os rolls manuais: o que não foi informado vale o mínimo configurado. */
export function manualToRolls(partial: Partial<Record<(typeof SUBSTATS)[number], number>>, minRolls: number): Rolls {
  const rolls = {} as Rolls;
  for (const s of SUBSTATS) rolls[s] = partial[s] ?? minRolls;
  return rolls;
}

export interface ResolvedProject {
  team: TeamInput;
  actions: RotationAction[];
  flatEffects: FlatDamageEffect[];
  /** Coeficiente de EM das amplificadoras (undefined = o padrão do motor, 25/9). */
  ampCoefficient: number | undefined;
}

/**
 * Aplica as regras de composição (`CharacterBuff.team`) e o nível do talento (`CharacterBuff.level`): tira os
 * buffs que o time não cumpre e multiplica os que escalam pela quantidade de elementos ou pelo nível. Devolve cópias; os dados de efeitos não são alterados.
 */
export function applyTeamRules(members: MemberInput[]): MemberInput[] {
  const elements = members.map((m) => m.character.element);
  return members.map((m, self) => {
    const buffs = m.characterEffect?.buffs;
    if (!buffs?.some((b) => b.team || b.level)) return m;
    const others = members.filter((_, j) => j !== self);
    const next = buffs.flatMap((b) => {
      const t = b.team;
      if (t?.only && !elements.every((e) => t.only!.includes(e))) return [];
      if (t?.eachOf && !t.eachOf.every((e) => elements.includes(e))) return [];
      if (t?.minDistinct && new Set(elements).size < t.minDistinct) return [];
      if (t?.onlyWeapons && !t.onlyWeapons.includes(m.character.weapon)) return [];
      if (t?.maxBurstEnergy && (m.character.burst.energyCost ?? Infinity) > t.maxBurstEnergy) return [];
      let k = 1;
      if (t?.scale) {
        const of = t.scale.of;
        const sameEl = (x: MemberInput) => x.character.element === m.character.element;
        const n =
          of === 'distinct' ? new Set(elements).size
          : of === 'same' ? others.filter(sameEl).length
          : of === 'different' ? others.filter((x) => !sameEl(x)).length
          : Array.isArray(of) ? elements.filter((e) => of.includes(e)).length
          : others.filter((x) => of.names.includes(x.character.name) || (of.orDifferent === true && !sameEl(x))).length;
        k *= n >= 1 ? t.scale.table[Math.min(n, t.scale.table.length) - 1] : 0;
      }
      if (b.level) k *= b.level.table[Math.min(15, Math.max(1, Math.round(m.talents[b.level.talent]))) - 1] ?? 0;
      if (!k) return [];
      if (k === 1) return [b];
      const stats = b.stats && {
        ...b.stats,
        atkPct: b.stats.atkPct * k, dmgPct: b.stats.dmgPct * k, critRate: b.stats.critRate * k, critDmg: b.stats.critDmg * k,
        em: b.stats.em * k, er: b.stats.er * k, hpPct: b.stats.hpPct * k, defPct: b.stats.defPct * k,
        dmgPctByType: Object.fromEntries(Object.entries(b.stats.dmgPctByType ?? {}).map(([h, x]) => [h, x * k])),
      };
      return [{
        ...b,
        stats,
        ...(b.resShred ? { resShred: { ...b.resShred, value: b.resShred.value * k } } : {}),
        ...(b.convert ? { convert: { ...b.convert, perPoint: b.convert.perPoint * k } } : {}),
        ...(b.flat?.length ? { flat: b.flat.map((f) => ({ ...f, perPoint: f.perPoint * k, ...(f.capPerHit !== undefined ? { capPerHit: f.capPerHit * k } : {}) })) } : {}),
      }];
    });
    return { ...m, characterEffect: { ...m.characterEffect!, buffs: next } };
  });
}

/** Aplica o nível do talento da fonte ao coeficiente dos efeitos de dano fixo do kit (`FlatDamageEffect.level`). */
export function applyFlatLevels(flat: FlatDamageEffect[], members: MemberInput[]): FlatDamageEffect[] {
  return flat.map((e) => {
    if (!e.level) return e;
    const source = members.find((m) => m.character.name === e.source);
    if (!source) return e;
    const k = e.level.table[Math.min(15, Math.max(1, Math.round(source.talents[e.level.talent]))) - 1] ?? 0;
    return { ...e, perPoint: e.perPoint * k, ...(e.capPerHit !== undefined ? { capPerHit: e.capPerHit * k } : {}) };
  });
}

/** Transforma o projeto salvo nas entradas do motor. Lança ProjectResolveError se algo não existir nos dados. */
export function resolveProject(project: RotationProject, data: GameData, effects: EffectsData): ResolvedProject {
  const planilha = project.compat === 'planilha';
  const members = applyTeamRules(project.members.map((m) => resolveMember(m, data, effects, project.config.minRollsPerSubstat))).map((m) =>
    // No modo planilha, os personagens que vêm da planilha ficam só com os efeitos dela: sem as passivas e constelações curadas depois.
    planilha && m.characterEffect && !m.characterEffect.fonte_info.includes('scripts/curation/') ? { ...m, characterEffect: planilhaEffect(m.characterEffect) } : m,
  );
  const moves = indexMoves(data.moves);
  const config: GlobalConfig = { ...project.config };

  // Cronológico: os stacks de dano fixo são consumidos pelos primeiros hits elegíveis NO TEMPO (ordem estável nos empates).
  const chronological = [...project.actions].sort((a, b) => a.time - b.time);
  const actions: RotationAction[] = chronological.map((a) => {
    const move = resolveMove(moves, a.move, a.displayName, a.extraScale);
    return {
      id: a.id,
      member: a.member,
      // No modo planilha, o elemento de todo golpe é o do personagem (o motor já usa isso por padrão).
      move,
      executions: a.executions,
      reaction: a.reaction as ReactionChoice,
      activeTags: a.tagSource === 'windows' ? tagsAt(project.buffWindows, a.time) : a.activeTags,
      dmgAdjust: a.dmgAdjust,
      time: a.time,
      note: a.note,
    };
  });

  return {
    team: { members, extras: project.extras, config, disabled: project.disabled },
    actions,
    flatEffects: [...applyFlatLevels(effects.flatDamage, members), ...gearFlat(members)],
    ampCoefficient: project.compat === 'planilha' ? AMP_EM_COEFFICIENT_SHEET : undefined,
  };
}
