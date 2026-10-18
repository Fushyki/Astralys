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
  fonte_info: FonteInfo,
});
export type CharacterEffect = z.infer<typeof CharacterEffectSchema>;

const TeamBuffSchema = z.object({ atkPct: frac, dmgPct: frac, em: frac });

export const WeaponEffectSchema = z.object({
  weapon: z.string().min(1),
  atkPct: frac,
  dmgPct: frac,
  critRate: frac,
  critDmg: frac,
  em: frac,
  er: frac,
  /** ATK% = coef × (ER − 100%), até `cap` (ex.: Engulfing Lightning 0.28, teto 0.8). */
  atkPctPerEr: z.object({ coef: z.number(), cap: z.number() }).optional(),
  team: TeamBuffSchema.optional(),
  fonte_info: FonteInfo,
});
export type WeaponEffect = z.infer<typeof WeaponEffectSchema>;

/** Bônus de 2 peças que a planilha modela como "stat + valor". */
export const SetTwoPieceStatSchema = z.enum(['ATK%', 'DMG%', 'DMG% Supremo', 'EM']);

export const SetEffectSchema = z.object({
  set: z.string().min(1),
  twoPiece: z.object({ stat: SetTwoPieceStatSchema, value: z.number() }).optional(),
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
      team: TeamBuffSchema.optional(),
    })
    .optional(),
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
