/**
 * Esquemas (Zod) dos dados de jogo gerados por `npm run sync:data` a partir do Lunaris.
 * Os JSON em `src/data/generated/` NÃO devem ser editados à mão: rode o sync.
 * Efeitos numéricos (o que passivas fazem) ficam em `src/effects/`, editáveis e com fonte anotada.
 */
import { z } from 'zod';

export const ElementSchema = z.enum(['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo']);
export type Element = z.infer<typeof ElementSchema>;

export const WeaponTypeSchema = z.enum(['Sword', 'Claymore', 'Polearm', 'Catalyst', 'Bow']);
export type WeaponType = z.infer<typeof WeaponTypeSchema>;

/** Stat secundário/de ascensão normalizado. Percentuais em fração (0.384 = 38,4%); EM em pontos. */
export const StatKeySchema = z.enum([
  'HP%', 'ATK%', 'DEF%', 'EM', 'ER', 'CR', 'CD', 'Healing',
  'Physical%', 'Pyro%', 'Hydro%', 'Anemo%', 'Electro%', 'Dendro%', 'Cryo%', 'Geo%',
]);
export type StatKey = z.infer<typeof StatKeySchema>;

export const StatValueSchema = z.object({ stat: StatKeySchema, value: z.number() });
export type StatValue = z.infer<typeof StatValueSchema>;

// ---------- Personagens ----------

export const ParticleSourceSchema = z.object({
  source: z.string(),
  /** Texto original do Lunaris (ex.: "5", "1-2"). Interpretado pelo motor de ER. */
  particles: z.string(),
  chance: z.string(),
  cooldown: z.string(),
});

export const CharacterSchema = z.object({
  /** Chave do Lunaris, ex.: "10000106" ou "10000005_ANEMO" (Viajante, um por elemento). */
  id: z.string().min(1),
  name: z.string().min(1),
  namePt: z.string().min(1),
  element: ElementSchema,
  weapon: WeaponTypeSchema,
  rarity: z.union([z.literal(4), z.literal(5)]),
  /** Nomes dos arquivos de imagem no Lunaris (sem extensão): ícone (UI_Gacha_AvatarIcon_X) e arte grande. */
  icon: z.string().optional(),
  splash: z.string().optional(),
  /** Stats base no nível 90 (o `charlist` do Lunaris só traz o nível máximo). */
  baseHp: z.number().positive(),
  baseAtk: z.number().positive(),
  baseDef: z.number().positive(),
  ascension: StatValueSchema.nullable(),
  burst: z.object({
    energyCost: z.number().nullable(),
    cooldown: z.number().nullable(),
  }),
  particles: z.array(ParticleSourceSchema),
  /** Talento cujo nível sobe 3 pontos na C3 e na C5 (null = o texto não casa com nenhum talento). */
  constellationBoosts: z.object({ c3: z.enum(['normal', 'skill', 'burst']).nullable(), c5: z.enum(['normal', 'skill', 'burst']).nullable() }).optional(),
});
export type Character = z.infer<typeof CharacterSchema>;

// ---------- Golpes (multiplicadores de talento) ----------

export const TalentSchema = z.enum(['normal', 'skill', 'burst']);
export type Talent = z.infer<typeof TalentSchema>;

/** Tipo de golpe para efeitos de "DMG% de Normal/Carregado/Imersivo/Habilidade/Supremo". */
export const HitTypeSchema = z.enum(['normal', 'charged', 'plunge', 'skill', 'burst']);
export type HitType = z.infer<typeof HitTypeSchema>;

export const TALENT_LEVELS = 15;
const LevelsSchema = z.array(z.number()).length(TALENT_LEVELS);

/**
 * Escala do golpe nos níveis 1–15, já somada sobre os hits (como a coluna da planilha):
 * dano base = ATK·atk + HP·hp + DEF·def + EM·em + flat. Só entram os atributos usados.
 */
export const ScaleSchema = z.object({
  atk: LevelsSchema.optional(),
  hp: LevelsSchema.optional(),
  def: LevelsSchema.optional(),
  em: LevelsSchema.optional(),
  flat: LevelsSchema.optional(),
});
export type Scale = z.infer<typeof ScaleSchema>;

export const MoveSchema = z.object({
  /** `${characterId}:${talent}:${label}` e `#${variant}` quando há variantes. Estável entre patches. */
  id: z.string(),
  characterId: z.string().min(1),
  character: z.string(),
  talent: TalentSchema,
  hitType: HitTypeSchema,
  /** Rótulo original do Lunaris em inglês, ex.: "Flamestrider Charged Attack Cyclic DMG". */
  label: z.string(),
  /** Rótulo em português do Lunaris (mesma posição do original); ausente se as listas não casam. */
  labelPt: z.string().optional(),
  /** Índice da variante quando o valor traz "a/b" (ex.: queda baixa/alta). 0 se não houver. */
  variant: z.number().int().min(0),
  variants: z.number().int().min(1),
  /** Número de acertos que a escala acima já soma (importa para stacks de dano fixo). */
  hits: z.number().int().min(1),
  /** Texto como "each" / "per Paw" quando o valor é por unidade. */
  qualifier: z.string().optional(),
  scale: ScaleSchema,
});
export type Move = z.infer<typeof MoveSchema>;

// ---------- Armas ----------

export const WeaponRefinementSchema = z.object({
  description: z.string(),
  params: z.array(z.number()),
});

export const WeaponSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  namePt: z.string().min(1),
  type: WeaponTypeSchema,
  rarity: z.number().int().min(1).max(5),
  /** ATK base no nível máximo informado pelo `weaponlist` do Lunaris. */
  baseAtk: z.number().positive(),
  substat: StatValueSchema.nullable(),
  passive: z
    .object({
      name: z.string(),
      /** Índices 0..4 = R1..R5. */
      refinements: z.array(WeaponRefinementSchema).length(5),
    })
    .nullable(),
});
export type Weapon = z.infer<typeof WeaponSchema>;

// ---------- Sets de artefatos ----------

export const SetBonusSchema = z.object({
  description: z.string(),
  params: z.array(z.number()),
});

export const ArtifactSetSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  namePt: z.string().min(1),
  /** Raridade máxima das peças do set. */
  rarity: z.number().int().min(1).max(5),
  bonuses: z.object({
    onePiece: SetBonusSchema.optional(),
    twoPiece: SetBonusSchema.optional(),
    fourPiece: SetBonusSchema.optional(),
  }),
});
export type ArtifactSet = z.infer<typeof ArtifactSetSchema>;

// ---------- Metadados do sync ----------

export const SyncMetaSchema = z.object({
  source: z.literal('lunaris'),
  gameVersion: z.string(),
  fetchedAt: z.string(),
  counts: z.object({
    characters: z.number().int(),
    moves: z.number().int(),
    weapons: z.number().int(),
    artifactSets: z.number().int(),
  }),
});
export type SyncMeta = z.infer<typeof SyncMetaSchema>;
