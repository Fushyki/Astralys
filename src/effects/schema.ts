/**
 * Efeitos numéricos de personagens, armas e sets: o que cada passiva FAZ em números.
 * Não vêm do Lunaris (que só traz o texto), então ficam aqui em JSON editável.
 * Todo efeito carrega `fonte_info`: de onde veio o número (regra do projeto: nunca inventar valores).
 *
 * Percentuais em fração (0.3 = 30%). Modelo herdado das abas "(efeitos)" da planilha de referência.
 */
import { z } from 'zod';
import { ElementSchema, HitTypeSchema } from '../data/schema';

const frac = z.number().default(0);
const FonteInfo = z.string().min(1, 'fonte_info é obrigatório: de onde veio este número?');

/** Buff que aumenta o ATK fixo de quem o recebe, calculado a partir do ATK do doador. */
const TeamFlatAtkSchema = z.object({
  /** Coeficiente × ATK BASE do doador (ex.: Bennett 1.39). */
  perBaseAtk: frac,
  /** Coeficiente × ATK TOTAL do doador (ex.: Iansan 0.37). */
  perTotalAtk: frac,
  /** Teto do bônus em ATK fixo (0 = sem teto). */
  cap: frac,
});

/** Bônus que um talento (passiva ou constelação) dá, em frações (EM em pontos). */
const BuffStatsSchema = z.object({
  atkPct: frac,
  dmgPct: frac,
  critRate: frac,
  critDmg: frac,
  em: frac,
  er: frac,
  hpPct: frac,
  defPct: frac,
  dmgPctByType: z.record(HitTypeSchema, z.number()).default({}),
});
export type BuffStats = z.infer<typeof BuffStatsSchema>;

/** Stats que uma conversão pode alimentar (fixos ou em fração). */
export const ConvertTargetSchema = z.enum(['atkFlat', 'hpFlat', 'defFlat', 'atkPct', 'hpPct', 'defPct', 'em', 'dmgPct', 'critRate', 'critDmg', 'normal', 'charged', 'plunge', 'skill', 'burst']);
export type ConvertTarget = z.infer<typeof ConvertTargetSchema>;

/**
 * Conversão de stat: o buff vale `perPoint × (stat da fonte − threshold)`, limitado por `cap`, e vai para todos os
 * alvos de `to` (ex.: Kazuha A4, 0,04% de DMG elemental por ponto de Maestria). A fonte é o dono do buff ou, com
 * `source: 'highestEm'`, o membro com mais Maestria. Recarga entra como multiplicador (1,5 = 150%).
 */
export const BuffConvertSchema = z.object({
  from: z.enum(['atk', 'hp', 'def', 'em', 'er']),
  source: z.enum(['self', 'highestEm']).default('self'),
  perPoint: z.number(),
  threshold: z.number().default(0),
  /** Teto do valor convertido (sem teto = omitido). */
  cap: z.number().optional(),
  to: z.array(ConvertTargetSchema).min(1),
});
export type BuffConvert = z.infer<typeof BuffConvertSchema>;

/**
 * Um buff de passiva ou constelação. Vale a partir de `minConstellation`. `timed` buffs viram uma faixa na linha do
 * tempo (só valem nas janelas em que você os liga); sem `timed`, só o próprio personagem (`self`) ganha, o tempo todo.
 */
export const CharacterBuffSchema = z.object({
  id: z.string().min(1),
  /** Nome curto da faixa na linha do tempo, ex.: "Hu Tao: A1". */
  label: z.string().min(1),
  minConstellation: z.number().int().min(0).max(6).default(0),
  scope: z.enum(['self', 'others', 'team']),
  timed: z.boolean(),
  /** Só personagens destes elementos recebem (ex.: "+15% de DMG Pyro" para a equipe). */
  forElements: z.array(ElementSchema).optional(),
  stats: BuffStatsSchema.optional(),
  /** Bônus que depende de um stat da fonte (no lugar de `stats`). Os `timed: false` valem o tempo todo. */
  convert: BuffConvertSchema.optional(),
  /** Redução de RES do inimigo (vale o tempo todo). */
  resShred: z.object({ value: z.number(), elements: z.array(ElementSchema).min(1) }).optional(),
  /** O que foi assumido e o que não entra. */
  note: z.string().optional(),
});
export type CharacterBuff = z.infer<typeof CharacterBuffSchema>;

export const CharacterEffectSchema = z.object({
  character: z.string().min(1),
  atkPct: frac,
  dmgPct: frac,
  critRate: frac,
  critDmg: frac,
  em: frac,
  teamFlatAtk: TeamFlatAtkSchema.optional(),
  /** O buff de ATK fixo vale também para o próprio doador? */
  appliesToSelf: z.boolean().default(false),
  /** Redução de RES no inimigo, só nos elementos listados. */
  resShred: z.object({ value: z.number(), elements: z.array(ElementSchema).min(1) }).optional(),
  /** Passivas e constelações com número (a partir de `minConstellation`). */
  buffs: z.array(CharacterBuffSchema).default([]),
  fonte_info: FonteInfo,
});
export type CharacterEffect = z.infer<typeof CharacterEffectSchema>;

const TeamBuffSchema = z.object({ atkPct: frac, dmgPct: frac, em: frac });

/** Bônus que uma arma dá num refinamento (todos em fração, exceto EM). */
const WeaponStatsSchema = z.object({
  atkPct: frac,
  dmgPct: frac,
  critRate: frac,
  critDmg: frac,
  em: frac,
  er: frac,
  hpPct: frac,
  defPct: frac,
  /** DMG% por tipo de golpe (normal, carregado, imersivo, habilidade, supremo). */
  dmgPctByType: z.record(HitTypeSchema, z.number()).default({}),
  /** ATK% = coef × (ER − 100%), até `cap` (ex.: Engulfing Lightning 0.28, teto 0.8). */
  atkPctPerEr: z.object({ coef: z.number(), cap: z.number() }).optional(),
  team: TeamBuffSchema.optional(),
});
export type WeaponStats = z.infer<typeof WeaponStatsSchema>;

export const WeaponEffectSchema = WeaponStatsSchema.extend({
  weapon: z.string().min(1),
  /** Números de cada refinamento (R1 a R5). Ausente = só os campos acima, que valem para o R1 (planilha). */
  refinements: z.array(WeaponStatsSchema).length(5).optional(),
  /** O que foi assumido (stacks, tempo ativo) e o que NÃO entra no cálculo. */
  note: z.string().optional(),
  fonte_info: FonteInfo,
});
export type WeaponEffect = z.infer<typeof WeaponEffectSchema>;

/** Números da arma no refinamento pedido (1 a 5). Sem tabela por refinamento, vale o que está na raiz. */
export function weaponStatsAt(effect: WeaponEffect, refinement = 1): WeaponStats {
  const r = effect.refinements?.[Math.min(5, Math.max(1, Math.round(refinement))) - 1] ?? effect;
  // Os JSON de efeitos são lidos sem passar pelo Zod, então os campos novos podem faltar nos efeitos antigos.
  return { ...r, hpPct: r.hpPct ?? 0, defPct: r.defPct ?? 0, dmgPctByType: r.dmgPctByType ?? {} };
}

/** Bônus de 2 peças que a planilha modela como "stat + valor". */
export const SetTwoPieceStatSchema = z.enum(['ATK%', 'HP%', 'DEF%', 'EM', 'ER', 'CR', 'DMG%', 'DMG% Normal', 'DMG% Charged', 'DMG% Plunge', 'DMG% Skill', 'DMG% Supremo']);
const TwoPieceEntrySchema = z.object({
  stat: SetTwoPieceStatSchema,
  value: z.number(),
  /** Bônus elemental: só vale para personagens deste elemento (ex.: Cryo DMG +15% do Blizzard Strayer). */
  element: ElementSchema.optional(),
});

export const SetEffectSchema = z.object({
  set: z.string().min(1),
  twoPiece: TwoPieceEntrySchema.optional(),
  /** Outros bônus de 2 peças além do primeiro (ex.: "Normal e Carregado +20%" são dois). */
  twoPieceMore: z.array(TwoPieceEntrySchema).default([]),
  fourPiece: z
    .object({
      atkPct: frac,
      dmgPct: frac,
      critRate: frac,
      critDmg: frac,
      em: frac,
      dmgPctByType: z.record(HitTypeSchema, z.number()).default({}),
      /** Bônus de reação amplificadora (Derreter / Vaporizar). */
      meltBonus: frac,
      vaporizeBonus: frac,
      er: frac,
      hpPct: frac,
      defPct: frac,
      /** Redução de RES do inimigo nos elementos listados (ex.: Deepwood Memories, Dendro -30%). */
      resShred: z.object({ value: z.number(), elements: z.array(ElementSchema).min(1) }).optional(),
      team: TeamBuffSchema.optional(),
    })
    .optional(),
  /** O que foi assumido e o que NÃO entra no cálculo. */
  note: z.string().optional(),
  fonte_info: FonteInfo,
});
export type SetEffect = z.infer<typeof SetEffectSchema>;

export const FlatDamageStatSchema = z.enum(['ATK', 'HP', 'DEF', 'EM']);

/** Dano plano somado por hit (ex.: Lead Vocal da Vodyanitsa, quills da Shenhe). */
export const FlatDamageEffectSchema = z.object({
  name: z.string().min(1),
  /** Quem dá o buff. */
  source: z.string().min(1),
  sourceStat: FlatDamageStatSchema,
  perPoint: z.number(),
  /** O stat da fonte só conta acima deste valor. */
  threshold: frac,
  /** Máximo por hit (undefined = sem teto). */
  capPerHit: z.number().optional(),
  /** Personagens que recebem; "all" = qualquer um. */
  targets: z.union([z.literal('all'), z.array(z.string().min(1)).min(1)]),
  /** Vazio = qualquer elemento / qualquer tipo de golpe. */
  elements: z.array(ElementSchema),
  hitTypes: z.array(HitTypeSchema),
  /** Quantos hits consomem o buff (undefined = ilimitado). Consumidos pelos primeiros hits elegíveis. */
  stacks: z.number().int().positive().optional(),
  active: z.boolean(),
  fonte_info: FonteInfo,
});
export type FlatDamageEffect = z.infer<typeof FlatDamageEffectSchema>;

/** Partículas elementais que a habilidade de cada personagem solta por uso (média, quando varia). */
export const SkillParticlesSchema = z.object({
  character: z.string().min(1),
  particles: z.number().min(0),
  note: z.string().default(''),
  fonte_info: FonteInfo,
});
export type SkillParticles = z.infer<typeof SkillParticlesSchema>;
