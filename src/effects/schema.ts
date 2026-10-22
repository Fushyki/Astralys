/**
 * Efeitos numéricos de personagens, armas e sets: o que cada passiva FAZ em números.
 * Não vêm do Lunaris (que só traz o texto), então ficam aqui em JSON editável.
 * Todo efeito carrega `fonte_info`: de onde veio o número (regra do projeto: nunca inventar valores).
 *
 * Percentuais em fração (0.3 = 30%). Modelo herdado das abas "(efeitos)" da planilha de referência.
 */
import { z } from 'zod';
import { ElementSchema, HitTypeSchema, WeaponTypeSchema } from '../data/schema';

const frac = z.number().default(0);
/** Reações que causam dano próprio com nível × coeficiente (Lunares e Estelares; Genshin Optimizer `special.ts`). */
export const SPECIAL_REACTIONS = ['lunarcharged', 'lunarbloom', 'lunarcrystallize', 'stellarconduct', 'stellarswirl'] as const;
export type SpecialReactionKey = (typeof SPECIAL_REACTIONS)[number];
/** Transformativas que podem causar crítico (só com bônus próprio da reação, Genshin Optimizer `trans.ts`). */
export const CRIT_TRANSFORMATIVE = ['swirl', 'burning', 'bloom', 'burgeon', 'hyperbloom'] as const;
/**
 * Chaves de bônus de reação. Para cada Lunar/Estelar há as mesmas partes do Genshin Optimizer
 * (`libs/gi/wr/src/reaction/special.ts`): `<r>` = `<r>_dmg_` (soma ao multiplicador de Maestria), `<r>Base` =
 * `<r>_baseDmg_`, `<r>Special` = `<r>_specialDmg_` (multiplicador final), `<r>CritRate`/`<r>CritDmg`, `<r>Flat` =
 * `<r>_dmgInc` (dano fixo somado à base); nas Estelares, `<r>Mult` = `<r>_mult_` (soma ao multiplicador 1 dos golpes).
 * Nas transformativas que podem critar, `<r>CritRate`/`<r>CritDmg` = `<r>_critRate_`/`<r>_critDMG_`; em todas,
 * `<r>Flat` = `<r>_dmgInc` (dano fixo somado à base da reação).
 */
export const REACTION_BONUS_KEYS = [
  'overloaded', 'shattered', 'electrocharged', 'superconduct', 'swirl', 'burning', 'bloom', 'burgeon', 'hyperbloom', 'spread', 'aggravate',
  'swirlCritRate', 'swirlCritDmg', 'burningCritRate', 'burningCritDmg', 'bloomCritRate', 'bloomCritDmg', 'burgeonCritRate', 'burgeonCritDmg', 'hyperbloomCritRate', 'hyperbloomCritDmg',
  'overloadedFlat', 'shatteredFlat', 'electrochargedFlat', 'superconductFlat', 'swirlFlat', 'burningFlat', 'bloomFlat', 'burgeonFlat', 'hyperbloomFlat',
  'lunarcharged', 'lunarchargedBase', 'lunarchargedSpecial', 'lunarchargedCritRate', 'lunarchargedCritDmg', 'lunarchargedFlat',
  'lunarbloom', 'lunarbloomBase', 'lunarbloomSpecial', 'lunarbloomCritRate', 'lunarbloomCritDmg', 'lunarbloomFlat',
  'lunarcrystallize', 'lunarcrystallizeBase', 'lunarcrystallizeSpecial', 'lunarcrystallizeCritRate', 'lunarcrystallizeCritDmg', 'lunarcrystallizeFlat',
  'stellarconduct', 'stellarconductBase', 'stellarconductSpecial', 'stellarconductCritRate', 'stellarconductCritDmg', 'stellarconductFlat', 'stellarconductMult',
  'stellarswirl', 'stellarswirlBase', 'stellarswirlSpecial', 'stellarswirlCritRate', 'stellarswirlCritDmg', 'stellarswirlFlat', 'stellarswirlMult',
] as const;
export type ReactionBonusKey = (typeof REACTION_BONUS_KEYS)[number];
const ReactionBonusKeySchema = z.enum(REACTION_BONUS_KEYS);
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
  /** Taxa e Dano Crítico só para certos tipos de golpe. */
  critRateByType: z.record(HitTypeSchema, z.number()).default({}),
  critDmgByType: z.record(HitTypeSchema, z.number()).default({}),
  /** Fração da DEF do inimigo que os golpes do dono ignoram (soma com a do cenário, no máximo 100%). */
  defIgnore: frac,
  /** ATK, HP e DEF fixos (ex.: Nicole, +300 de ATK; Prune C6, +350). */
  atkFlat: frac,
  hpFlat: frac,
  defFlat: frac,
  /** Bônus de DMG Físico (só golpes Físicos; ex.: Eula C1, Mika A1). */
  physDmgPct: frac,
  /** Dano Crítico só em golpes Físicos (ex.: Mika C6). */
  physCritDmg: frac,
  /** Bônus de dano de reação (ex.: "+40% de Florescer"), por reação. Derreter/Vaporizar ficam nos campos próprios dos sets. */
  reactionBonus: z.record(ReactionBonusKeySchema, z.number()).default({}),
});
export type BuffStats = z.infer<typeof BuffStatsSchema>;

/** Elemento de um golpe, incluindo o Físico. */
export const ElementOrPhysicalSchema = z.union([ElementSchema, z.literal('Physical')]);

/** Golpe que causa dano Lunar/Estelar: a reação e, nas Estelares, o elemento cuja RES vale (padrão: o do personagem). */
export const SpecialMoveSchema = z.object({
  reaction: z.enum(SPECIAL_REACTIONS),
  resist: ElementSchema.optional(),
});
export type SpecialMove = z.infer<typeof SpecialMoveSchema>;

/**
 * Golpe extra de proc (arma, set, passiva ou constelação): um dano próprio, com escala no stat do dono, que você coloca
 * na linha do tempo como qualquer golpe. Sem `element`, é do elemento do personagem; sem `hitType`, não conta como
 * Normal/Carregado/Imersivo/Habilidade/Supremo (não recebe bônus de tipo de golpe, como no Genshin Optimizer).
 */
export const ProcSchema = z.object({
  id: z.string().min(1),
  /** Nome curto mostrado na paleta, ex.: "The Flute: onda". */
  label: z.string().min(1),
  /** Escala do golpe (fração do stat final do dono, ex.: 1 = 100% do ATK). */
  scale: z.object({ atk: z.number(), hp: z.number(), def: z.number(), em: z.number() }).partial(),
  element: ElementOrPhysicalSchema.optional(),
  hitType: HitTypeSchema.optional(),
  /** Passiva/constelação: vale a partir desta constelação. */
  minConstellation: z.number().int().min(0).max(6).default(0),
  /** De qual passiva/constelação vem (para a cobertura do kit). */
  src: z.enum(['p1', 'p2', 'p3', 'const1', 'const2', 'const3', 'const4', 'const5', 'const6']).optional(),
  /** Dano Lunar/Estelar (fórmula do Genshin Optimizer `lunarDmgNode`/`stellarDmgNode`, base = stat do dono). */
  special: SpecialMoveSchema.optional(),
  /**
   * Golpe que é uma fração do dano de outro golpe do kit (ex.: Amber C1, segunda flecha = 20% da primeira): a escala é
   * `fraction` × a escala daquele golpe no nível de talento do dono. Sem `hitType`, herda o tipo do golpe original.
   */
  of: z.object({ talent: z.enum(['normal', 'skill', 'burst']), label: z.string().min(1), variant: z.number().int().min(0).default(0), fraction: z.number().positive() }).optional(),
  note: z.string().optional(),
});
export type Proc = z.infer<typeof ProcSchema>;

/** Golpe do kit (Lunaris) que no jogo causa dano Lunar/Estelar (o Genshin Optimizer usa `lunarDmgNode`/`stellarDmgNode`). */
export const KitSpecialMoveSchema = SpecialMoveSchema.extend({
  talent: z.enum(['normal', 'skill', 'burst']),
  label: z.string().min(1),
  /** Variante do golpe ("a%/b%"); ausente = todas. */
  variant: z.number().int().min(0).optional(),
  /** Multiplicador extra do golpe (ex.: Lauma, 3 Verdant Dew consumidos). */
  times: z.number().positive().optional(),
});
export type KitSpecialMove = z.infer<typeof KitSpecialMoveSchema>;

/** Stats que uma conversão pode alimentar (fixos ou em fração). */
export const ConvertTargetSchema = z.enum(['atkFlat', 'hpFlat', 'defFlat', 'atkPct', 'hpPct', 'defPct', 'em', 'dmgPct', 'critRate', 'critDmg', 'er', 'normal', 'charged', 'plunge', 'skill', 'burst', ...REACTION_BONUS_KEYS]);
export type ConvertTarget = z.infer<typeof ConvertTargetSchema>;

/**
 * Conversão de stat: o buff vale `perPoint × (stat da fonte − threshold)`, limitado por `cap`, e vai para todos os
 * alvos de `to` (ex.: Kazuha A4, 0,04% de DMG elemental por ponto de Maestria). A fonte é o dono do buff ou, com
 * `source: 'highestEm'`, o membro com mais Maestria. Recarga entra como multiplicador (1,5 = 150%).
 */
export const BuffConvertSchema = z.object({
  /** 'baseAtk' = ATK base do personagem + arma (ex.: ATK que a Kujou Sara dá). */
  /** 'partyEnergy' = soma da energia do Supremo de todos os membros (ex.: Mouun's Moon). */
  from: z.enum(['atk', 'baseAtk', 'hp', 'def', 'em', 'er', 'partyEnergy']),
  source: z.enum(['self', 'highestEm']).default('self'),
  perPoint: z.number(),
  threshold: z.number().default(0),
  /** Teto do valor convertido (sem teto = omitido). */
  cap: z.number().optional(),
  /** Teto em múltiplos do ATK base da fonte (ex.: Hu Tao, 4 = 400%). */
  capBaseAtk: z.number().optional(),
  to: z.array(ConvertTargetSchema).min(1),
});
export type BuffConvert = z.infer<typeof BuffConvertSchema>;

/**
 * Regras de composição do time (resolvidas ao montar o projeto): `only` = todos os membros precisam ser destes
 * elementos; `eachOf` = ao menos um de cada; `scale` multiplica os valores do buff por `table[n - 1]`, onde n é
 * quantos elementos diferentes há no time (`of: 'distinct'`) ou quantos membros são dos elementos listados.
 */
export const BuffTeamRulesSchema = z.object({
  only: z.array(ElementSchema).optional(),
  eachOf: z.array(ElementSchema).optional(),
  /** O time precisa ter ao menos tantos elementos diferentes (ex.: Ballad of the Fjords, 3). */
  minDistinct: z.number().int().positive().optional(),
  /** Só vale para personagens com um destes tipos de arma (ex.: Wanderer's Troupe, Catalisador ou Arco). */
  onlyWeapons: z.array(WeaponTypeSchema).optional(),
  /** Só vale se o Supremo do dono custa até tanta energia (ex.: Moonweaver's Dawn, 60 e 40). */
  maxBurstEnergy: z.number().positive().optional(),
  /** Só vale com ao menos tantos membros Moonsign no time (2 = "Moonsign: Ascendant Gleam"; Genshin Optimizer `tally.moonsign`). */
  moonsign: z.number().int().positive().optional(),
  /** Só vale com ao menos tantos membros Hexerei no time (Genshin Optimizer `tally.hexerei`). */
  hexerei: z.number().int().positive().optional(),
  /**
   * `of`: 'distinct' = elementos diferentes no time; lista de elementos ou `{ names }` (nomes de personagem) = quantos
   * membros são desses; 'same' / 'different' = quantos OUTROS membros têm o mesmo elemento / outro elemento que o dono.
   * `names` + `orDifferent` conta também quem tem outro elemento (ex.: Chain Breaker, "de Natlan ou de outro elemento").
   */
  scale: z
    .object({
      of: z.union([z.literal('distinct'), z.literal('same'), z.literal('different'), z.array(ElementSchema).min(1), z.object({ names: z.array(z.string().min(1)).min(1), orDifferent: z.boolean().optional() })]),
      table: z.array(z.number()).min(1),
    })
    .optional(),
});
export type BuffTeamRules = z.infer<typeof BuffTeamRulesSchema>;

/** Buff de habilidade (e não de passiva): os valores são multiplicados por `table[nível do talento - 1]`. */
export const BuffLevelSchema = z.object({ talent: z.enum(['normal', 'skill', 'burst']), table: z.array(z.number()).length(15) });
export type BuffLevel = z.infer<typeof BuffLevelSchema>;

/** Dano plano de arma/set: `perPoint` × stat do dono por golpe elegível, até `capPerHit` e `stacks` golpes. */
export const WeaponFlatSchema = z.object({
  name: z.string().min(1),
  /** 'BaseATK' = ATK base do dono (personagem + arma; ex.: Faruzan A4). */
  sourceStat: z.enum(['ATK', 'HP', 'DEF', 'EM', 'BaseATK']),
  perPoint: z.number(),
  capPerHit: z.number().optional(),
  hitTypes: z.array(HitTypeSchema).default([]),
  stacks: z.number().int().positive().optional(),
  /** Quem recebe: o dono (padrão), a equipe inteira ou só os outros (ex.: Xilonen C4, nos Normais dos aliados). */
  targets: z.enum(['self', 'team', 'others']).optional(),
  /** Só golpes destes elementos (ex.: Faruzan A4, dano Anemo). */
  elements: z.array(ElementSchema).optional(),
});
export type WeaponFlat = z.infer<typeof WeaponFlatSchema>;

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
  /** Só vale (ou vale mais) conforme a composição do time. */
  team: BuffTeamRulesSchema.optional(),
  /** Efeito do kit que cresce com o nível do talento. */
  level: BuffLevelSchema.optional(),
  /** Redução de RES do inimigo (vale o tempo todo). */
  resShred: z.object({ value: z.number(), elements: z.array(ElementOrPhysicalSchema).min(1) }).optional(),
  /** Redução de DEF do inimigo, em fração (vale o tempo todo; soma com a do cenário, no máximo 90%). */
  defShred: z.number().positive().optional(),
  /** Dano fixo por golpe elegível (ex.: Gorou A4, "Dano de Habilidade aumentado em 156% da DEF"). */
  flat: z.array(WeaponFlatSchema).default([]),
  /** O que foi assumido e o que não entra. */
  note: z.string().optional(),
});
export type CharacterBuff = z.infer<typeof CharacterBuffSchema>;

/** O que o cálculo faz com uma passiva ou constelação que NÃO virou buff: só utilidade (energia, cura, CD) ou só em parte. */
export const CharacterNoteSchema = z.object({
  src: z.enum(['p1', 'p2', 'p3', 'const1', 'const2', 'const3', 'const4', 'const5', 'const6']),
  kind: z.enum(['utility', 'partial']),
  note: z.string().min(1),
});
export type CharacterNote = z.infer<typeof CharacterNoteSchema>;

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
  resShred: z.object({ value: z.number(), elements: z.array(ElementOrPhysicalSchema).min(1) }).optional(),
  /** Passivas e constelações com número (a partir de `minConstellation`). */
  buffs: z.array(CharacterBuffSchema).default([]),
  /** Passivas e constelações sem buff: "utility" (nada a calcular em dano) ou "partial" (parte do dano fora do cálculo). */
  notes: z.array(CharacterNoteSchema).default([]),
  /** Golpes extras de passiva/constelação (a partir de `minConstellation`), para pôr na linha do tempo. */
  procs: z.array(ProcSchema).default([]),
  /** Facções que contam para regras de time (Genshin Optimizer `flags.isMoonsign` / `flags.isHexerei`). */
  factions: z.array(z.enum(['moonsign', 'hexerei'])).default([]),
  /** Golpes do kit que causam dano Lunar/Estelar no lugar do dano direto. */
  specialMoves: z.array(KitSpecialMoveSchema).default([]),
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
  /** Efeitos com conversão, crítico por golpe, buff de outros ou regra de time (mesmo formato dos buffs de personagem). */
  buffs: z.array(CharacterBuffSchema).default([]),
  /** Dano extra somado ao golpe (ex.: "Dano de Habilidade aumentado em 40% da DEF"). */
  flat: z.array(WeaponFlatSchema).default([]),
  /** Golpes extras da arma (ex.: The Flute, 100% do ATK Físico), com os números deste refinamento. */
  procs: z.array(ProcSchema).default([]),
});
export type WeaponStats = z.infer<typeof WeaponStatsSchema>;

export const WeaponEffectSchema = WeaponStatsSchema.extend({
  weapon: z.string().min(1),
  /** Números de cada refinamento (R1 a R5). Ausente = só os campos acima, que valem para o R1 (planilha). */
  refinements: z.array(WeaponStatsSchema).length(5).optional(),
  /** O que foi assumido (stacks, tempo ativo) e o que NÃO entra no cálculo. */
  note: z.string().optional(),
  /** O efeito da passiva não toca em dano (energia, cura, estamina, reinício de recarga): nada a calcular. */
  noDamage: z.boolean().optional(),
  /** Parte da passiva que mexe em dano (golpe extra, reação, mecânica nova) ainda NÃO entra no cálculo. */
  partial: z.boolean().optional(),
  fonte_info: FonteInfo,
});
export type WeaponEffect = z.infer<typeof WeaponEffectSchema>;

/** Números da arma no refinamento pedido (1 a 5). Sem tabela por refinamento, vale o que está na raiz. */
export function weaponStatsAt(effect: WeaponEffect, refinement = 1): WeaponStats {
  const r = effect.refinements?.[Math.min(5, Math.max(1, Math.round(refinement))) - 1] ?? effect;
  // Os JSON de efeitos são lidos sem passar pelo Zod, então os campos novos podem faltar nos efeitos antigos.
  return { ...r, hpPct: r.hpPct ?? 0, defPct: r.defPct ?? 0, dmgPctByType: r.dmgPctByType ?? {}, buffs: r.buffs ?? [], flat: r.flat ?? [], procs: r.procs ?? [] };
}

/** Bônus de 2 peças que a planilha modela como "stat + valor". */
export const SetTwoPieceStatSchema = z.enum(['ATK%', 'HP%', 'DEF%', 'EM', 'ER', 'CR', 'DMG%', 'Physical DMG%', 'DMG% Normal', 'DMG% Charged', 'DMG% Plunge', 'DMG% Skill', 'DMG% Supremo']);
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
      resShred: z.object({ value: z.number(), elements: z.array(ElementOrPhysicalSchema).min(1) }).optional(),
      team: TeamBuffSchema.optional(),
      buffs: z.array(CharacterBuffSchema).default([]),
      flat: z.array(WeaponFlatSchema).default([]),
      /** Bônus de dano de reação do dono (ex.: Thundering Fury, +40% de Sobrecarga). */
      reactionBonus: z.record(ReactionBonusKeySchema, z.number()).default({}),
      /** Golpes extras do set. */
      procs: z.array(ProcSchema).default([]),
    })
    .optional(),
  /** Buffs dos 2 peças além do stat simples (conversões, regras de time). */
  twoPieceBuffs: z.array(CharacterBuffSchema).default([]),
  /** O que foi assumido e o que NÃO entra no cálculo. */
  note: z.string().optional(),
  /** O efeito do set não toca em dano (ex.: Prayers): nada a calcular. */
  noDamage: z.boolean().optional(),
  /** Parte do efeito que mexe em dano ainda NÃO entra no cálculo. */
  partial: z.boolean().optional(),
  fonte_info: FonteInfo,
});
export type SetEffect = z.infer<typeof SetEffectSchema>;

export const FlatDamageStatSchema = z.enum(['ATK', 'HP', 'DEF', 'EM', 'BaseATK']);

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
  /** Efeito do kit: `perPoint` é multiplicado por `table[nível do talento da fonte - 1]` ao montar o projeto. */
  level: BuffLevelSchema.optional(),
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
