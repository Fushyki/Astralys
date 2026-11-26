/**
 * Formato de projeto salvo (`RotationProject`, JSON versionado) e a resolução para as entradas do motor.
 * O projeto guarda NOMES (personagem, arma, set, golpe), nunca os dados do jogo: o mesmo arquivo continua válido
 * quando o Lunaris atualiza os números. A resolução junta o projeto com os dados do jogo e os efeitos.
 */
import { scaleBuffStacks, stacksOf, withStacks } from './stacks';
import { z } from 'zod';
import { ElementSchema, type HitType, type ArtifactSet, type Character, type Move, type Talent, type Weapon } from '../data/schema';
import { characterAtLevel, type LevelsData } from '../data/levels';
import { planilhaEffect, planilhaWeapon } from './compat/planilha';
import { activeCharacterBuffs } from './stats';
import { applyHitLimits } from './hitLimits';
import { assembleTeam } from './team';
import { weaponStatsAt, type CharacterBuff, type CharacterEffect, type FlatDamageEffect, type Proc, type SetEffect, type WeaponEffect, type WeaponFlat } from '../effects/schema';
import { SUBSTATS, zeroRolls, type Rolls } from './artifacts';
import { RealPieceSchema, buildFromPieces } from './pieces';
import { AMP_EM_COEFFICIENT_SHEET } from './constants/reactions';
import { flatId, type ExtraScale, type ReactionChoice, type ReactionHit, type ResolvedMove, type RotationAction } from './rotation';
import type { SpecialReaction } from './reactions';
import type { MemberInput } from './stats';
import type { GlobalConfig, TeamInput } from './team';

export const PROJECT_SCHEMA_VERSION = 1;
export const MAX_TEAM_SIZE = 4;

// ---------- Dados necessários para resolver ----------

export interface GameData {
  /** Curvas de nível dos personagens (sem elas, os stats ficam no nível 90). */
  levels?: LevelsData;
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
  /** Nome da arma, ou `NO_WEAPON` para o personagem sem arma. */
  weapon: z.string().min(1),
  /** true = sem artefatos (nem main stats nem substats) enquanto não houver peças reais. Personagem novo nasce assim. */
  noArtifacts: z.boolean().optional(),
  /** Refinamento da arma (1 a 5). Ausente = 1. */
  refinement: z.number().int().min(1).max(5).optional(),
  primarySet: z.string().min(1).optional(),
  secondarySet: z.string().min(1).optional(),
  /** false = só 2 peças do set principal (sem o bônus de 4 peças). Padrão: 4 peças quando não há segundo set. */
  fourPiece: z.boolean().optional(),
  artifacts: ArtifactConfigSchema,
  /** Níveis BASE dos talentos (até 10, sem o +3 das constelações nem o +1 de passivas do time). */
  talents: z.object({ normal: TalentLevel, skill: TalentLevel, burst: TalentLevel }),
  /** 'generic' = o usuário voltou ao build genérico de propósito: o projeto não abre mais com as peças do inventário. */
  piecesChoice: z.literal('generic').optional(),
  /** Nível do personagem (1 a 90, 95 ou 100). Ausente = o nível padrão do cenário (`config.characterLevel`). */
  level: z.number().int().min(1).max(100).optional(),
  /** Constelação (0 a 6). Ausente = C0. Sobe em 3 o nível dos talentos da C3 e da C5. */
  constellation: z.number().int().min(0).max(6).optional(),
  /**
   * Facções ligadas neste membro (Moonsign, Hexerei). O usuário escolhe: só contam as que o personagem pode ter
   * (`CharacterEffect.factions`). Ausente = nenhuma (projetos antigos abrem sem facção).
   */
  factions: z.array(z.enum(['moonsign', 'hexerei'])).optional(),
  /**
   * Os buffs de arma e de artefatos (passiva da arma, set de 2 e 4 peças) começam DESLIGADOS e o usuário liga os que quiser
   * (`RotationProject.enabled`). Ausente = como antes: ligados (projetos antigos e o gabarito da planilha).
   */
  gearManual: z.boolean().optional(),
  /** Membro novo: os buffs ligados a condições da aba Talentos começam desligados (ligados em `enabled`). Ausente = ligados. */
  condManual: z.boolean().optional(),
  /** Quantos stacks (ou pontos) de cada buff do personagem valem, por id do buff (`CharacterBuff.stacks`). Ausente = o máximo. */
  stacks: z.record(z.string(), z.number().int().min(0)).optional(),
  /** Por id de buff com `pickReceiver`: os nomes de quem recebe. Ausente = o 1º do time que não é o dono. */
  receivers: z.record(z.string(), z.array(z.string())).optional(),
  /** Recurso dos golpes com bônus por ponto (Serpent's Subtlety, Espírito Lutador), escolhido na aba Talentos. Ausente = o máximo. */
  points: z.number().int().min(0).optional(),
  /** Elementos com que o personagem reage em campo (buffs `forReacted`, ex.: Scroll of the Hero of Cinder City). */
  reacted: z.array(ElementSchema).optional(),
  /** Infusão dos ataques normais, carregados e de queda (Hu Tao no Paramita, Xiao no Supremo…). Ausente = sem infusão (Físico em quem usa arma física). */
  normalInfusion: z.enum(['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo']).optional(),
  minER: z.number().min(0).optional(),
  /** Foco do KQM: id do golpe que o otimizador de substats maximiza (ausente = a rotação inteira). */
  kqmFocus: z.string().min(1).optional(),
  /** Foco do KQM em um stat: os procs livres vão para ele (tem prioridade sobre `kqmFocus`). */
  kqmStat: z.enum(['hp', 'atk', 'def', 'em', 'er']).optional(),
  totalRolls: z.number().int().min(0).optional(),
  forcedCritRolls: z.number().int().min(0).optional(),
  /** Rolls totais por substat definidos à mão (os que faltam valem o mínimo). Ausente = otimizar. */
  manualRolls: z.record(z.enum(SUBSTATS), z.number().min(0).max(60)).optional(),
  /**
   * Artefatos reais (do inventário) usados por este personagem. Quando presentes, valem no lugar de main stats e rolls: o
   * motor soma os stats exatos das peças, e o bônus de set vem das peças (as posições sem peça não contam).
   */
  pieces: z.array(RealPieceSchema).max(5).optional(),
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
  /** Só vale `rotationDuration` se o usuário definiu a duração à mão (ou no modo planilha); senão ela segue o último golpe. */
  durationManual: z.boolean().optional(),
});

export const MoveRefSchema = z.object({
  character: z.string().min(1),
  /**
   * 'proc' = golpe extra de arma, set, passiva ou constelação; `label` é a chave dele (ver `memberProcs`).
   * 'reaction' = dano da própria reação disparada pelo membro; `label` é a chave dela (ver `REACTION_ACTIONS`).
   */
  talent: z.enum(['normal', 'skill', 'burst', 'proc', 'reaction']),
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
    /** 'Rotação inteira': vale em qualquer instante, até onde a rotação for estendida. */
    whole: z.boolean().optional(),
    /** 'Por golpe': a janela começa `delay` s depois do golpe `actionId` e o acompanha se ele mudar de lugar. */
    anchor: z.object({ actionId: z.string().min(1), delay: z.number() }).optional(),
    /** Vale só para os N primeiros golpes que o buff afeta dentro da janela (ex.: Rift da Skirk: 10 Normais); ausente = todos. */
    maxHits: z.number().int().positive().optional(),
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
  /** Pontos do recurso do golpe (Espírito Lutador da Mavuika): soma "% do ATK por ponto" ao dano. Ausente = sem o bônus (projetos antigos). */
  points: z.number().min(0).optional(),
  executions: z.number().positive().default(1),
  reaction: ReactionChoiceSchema.default('none'),
  /** Elemento do dano, se diferente do padrão (ex.: 'Physical' num Normal sem infusão). Ausente = o do golpe/personagem. */
  element: z.enum(['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo', 'Physical']).optional(),
  /** Etiquetas de buff de time ativas nesta ação (usadas quando `tagSource` é 'manual'). */
  activeTags: z.array(z.string()).default([]),
  /** 'manual': usa `activeTags` (perfis da planilha). 'windows': as etiquetas vêm das janelas de buff, pelo `time`. */
  tagSource: z.enum(['manual', 'windows']).default('manual'),
  dmgAdjust: z.number().default(0),
  /** Golpe contínuo: as execuções com o mesmo `chainId` são irmãs (cada uma é uma ação com instante e reação próprios). */
  chainId: z.string().optional(),
  /** Reações Lunar-Charged, Lunar-Crystallize e Stellar-Swirl: membros que aplicaram os elementos (pesos 1, 1/2, 1/12, 1/12). Sem lista, só o dono. */
  contributors: z.array(z.number().int().min(0)).max(4).optional(),
  /** Buffs de dano fixo que ESTE golpe não consome (ids `fonte|nome`). Por padrão o golpe consome todos os que servem a ele. */
  flatOff: z.array(z.string()).optional(),
  /** Buffs de dano fixo que o usuário força NESTE golpe (ids `fonte|nome`), além do automático. */
  flatOn: z.array(z.string()).optional(),
  /** Recurso que o dano fixo gasta por acerto (Vínculo da Arlecchino, em %): neste golpe a contagem recomeça daqui. Ausente = continua do golpe anterior. */
  vinculo: z.number().min(0).max(400).optional(),
  /** Etiquetas de buff (faixas) que ESTE golpe ignora, mesmo dentro da janela delas (desligar um buff só para um golpe). */
  tagsOff: z.array(z.string()).optional(),
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
    /**
     * Elemento padrão dos golpes sem elemento escolhido: 'kit' pelas regras do jogo (ataque normal de arma física é Físico, habilidade
     * e supremo têm o elemento do personagem) ou 'personagem' (sempre o do personagem, como os projetos antigos e a planilha).
     */
    elementMode: z.enum(['kit', 'personagem']).default('kit'),
    config: ConfigSchema,
    members: z.array(MemberRefSchema).min(1).max(MAX_TEAM_SIZE),
    extras: z.array(ExtraBuffSchema).default([]),
    /** Quantos golpes cada buff de dano fixo atinge (id `fonte|nome`): um número ou "all" (todos os golpes). Ausente = o do cadastro. */
    flatStacks: z.record(z.union([z.literal('all'), z.number().int().min(1)])).default({}),
    actions: z.array(ActionSchema).default([]),
    /** Janelas de buff no tempo; dão as etiquetas das ações com `tagSource: 'windows'`. */
    buffWindows: z.array(BuffWindowSchema).default([]),
    /** Golpes contínuos: intervalo e fim com que cada grupo (`ActionRef.chainId`) foi criado. */
    chains: z.record(z.object({ every: z.number().positive(), until: z.number().min(0) })).default({}),
    /** Ids de buffs/fontes desligados pelo usuário (checkbox em "Buffs recebidos"). */
    disabled: z.array(z.string()).default([]),
    /** Buffs de arma/set que o usuário ligou em membros com `gearManual` (os demais começam desligados). */
    enabled: z.array(z.string()).default([]),
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
/** Segundos desde o início da janela de cada etiqueta ativa em `t` (a janela mais recente, se houver mais de uma). */
export function tagAgesAt(windows: readonly BuffWindow[], t: number): Record<string, number> {
  const ages: Record<string, number> = {};
  for (const w of windows) {
    if (w.whole || !(t >= w.start && t < w.end)) continue;
    const age = t - w.start;
    if (ages[w.tag] === undefined || age < ages[w.tag]) ages[w.tag] = age;
  }
  return ages;
}

export function tagsAt(windows: readonly BuffWindow[], t: number): string[] {
  const tags = new Set<string>();
  for (const w of windows) if (w.whole || (t >= w.start && t < w.end)) tags.add(w.tag);
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
  if (ref.talent === 'proc' || ref.talent === 'reaction') throw new ProjectResolveError(`Golpe extra/reação precisa do membro para ser resolvido: ${ref.label}`);
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

/** Valor de `MemberRef.weapon` para o personagem sem arma (ATK base 0, sem passiva). */
export const NO_WEAPON = 'Sem arma';

function byName<T extends { name: string }>(list: T[], name: string, what: string): T {
  const found = list.find((x) => x.name === name);
  if (!found) throw new ProjectResolveError(`${what} "${name}" não existe nos dados do jogo.`);
  return found;
}

/** Nível máximo de um talento sem bônus (coroado). Um valor digitado acima disso já inclui os bônus do jogo. */
export const MAX_BASE_TALENT = 10;

type Boosts = { c3: Talent | null; c5: Talent | null } | undefined;
/** Quanto a C3/C5 soma a um talento nesta constelação. */
const constellationBonus = (c: number, b: Boosts, t: Talent): number => (b?.c3 === t && c >= 3 ? 3 : 0) + (b?.c5 === t && c >= 5 ? 3 : 0);

/**
 * Nível do talento com o +3 da C3/C5. O bônus entra sobre o nível base (até 10) e nunca é somado a um valor digitado que já
 * o inclui (ex.: 13 com C3 continua 13).
 */
export function effectiveTalents(
  base: { normal: number; skill: number; burst: number },
  constellation: number | undefined,
  character: { constellationBoosts?: { c3: Talent | null; c5: Talent | null } },
): { normal: number; skill: number; burst: number } {
  const at = (t: Talent) => Math.min(15, Math.max(base[t], Math.min(base[t], MAX_BASE_TALENT) + constellationBonus(constellation ?? 0, character.constellationBoosts, t)));
  return { normal: at('normal'), skill: at('skill'), burst: at('burst') };
}

/** +1 de passiva do time (Tartaglia, Skirk). Um nível acima do que a constelação explica já foi digitado com ele. */
const withPartyLevel = (m: MemberInput, t: Talent): number =>
  m.talents[t] > MAX_BASE_TALENT + constellationBonus(m.constellation ?? 0, m.character.constellationBoosts, t) ? m.talents[t] : Math.min(15, m.talents[t] + 1);

/** Buffs de arma e de set (conversões, crítico por golpe, regras de time) no formato dos buffs de personagem. */
export function gearBuffs(m: Pick<MemberInput, 'weapon' | 'weaponEffect' | 'refinement' | 'primarySet' | 'secondarySet' | 'fourPiece'>): CharacterBuff[] {
  const out: CharacterBuff[] = [];
  const add = (prefix: string, label: string, list: CharacterBuff[]) => {
    for (const b of list) out.push({ ...b, id: `${prefix}:${b.id}`, label: `${label}: ${b.label}`, ...(b.stacks?.of ? { stacks: { ...b.stacks, of: `${prefix}:${b.stacks.of}` } } : {}) });
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

/** Um golpe extra disponível para um membro: a chave (`MoveRef.label` com `talent: 'proc'`) e o golpe pronto. */
export interface MemberProc {
  key: string;
  origin: string;
  proc: Proc;
  move: ResolvedMove;
}

const fifteen = (v: number | undefined) => (v ? Array.from({ length: 15 }, () => v) : undefined);

/**
 * Golpes extras do membro: da arma (no refinamento dele), do set de 4 peças e das passivas/constelações ativas.
 * Chaves: `arma:<id>`, `set:<id>` e `char:<id>`. `moves` (golpes do jogo) resolve os golpes que são uma fração de
 * outro golpe do kit (`Proc.of`), no nível de talento do membro; sem eles, esses golpes ficam com escala 0.
 */
export function memberProcs(
  m: Pick<MemberInput, 'character' | 'weapon' | 'weaponEffect' | 'refinement' | 'primarySet' | 'secondarySet' | 'fourPiece' | 'characterEffect' | 'constellation' | 'talents'>,
  moves?: readonly Move[],
): MemberProc[] {
  const out: MemberProc[] = [];
  const add = (prefix: string, origin: string, list: readonly Proc[] | undefined) => {
    for (const p of list ?? []) {
      if ((m.constellation ?? 0) < (p.minConstellation ?? 0)) continue;
      const key = `${prefix}:${p.id}`;
      let scale: Move['scale'] = { atk: fifteen(p.scale.atk), hp: fifteen(p.scale.hp), def: fifteen(p.scale.def), em: fifteen(p.scale.em) };
      let hitType: ResolvedMove['hitType'] = p.hitType ?? 'other';
      let hits = 1;
      if (p.of) {
        const of = p.of;
        const orig = moves?.find((x) => x.character === m.character.name && x.talent === of.talent && x.label === of.label && x.variant === of.variant);
        const i = Math.min(15, Math.max(1, Math.round(m.talents?.[of.talent] ?? 1))) - 1;
        const at = (arr?: number[]) => fifteen(arr?.[i] ? arr[i] * of.fraction : undefined);
        scale = orig ? { atk: at(orig.scale.atk), hp: at(orig.scale.hp), def: at(orig.scale.def), em: at(orig.scale.em), flat: at(orig.scale.flat) } : {};
        if (orig && !p.hitType) hitType = orig.hitType;
        if (orig) hits = orig.hits;
      }
      out.push({
        key, origin, proc: p,
        move: {
          id: `${m.character.name}:proc:${key}`, character: m.character.name, talent: 'proc', hitType,
          label: key, displayName: `${m.character.name}: ${p.label}`, hits, scale,
          ...(p.element ? { element: p.element } : {}),
          ...(p.special ? { special: p.special } : {}),
        },
      });
    }
  };
  if (m.weaponEffect) add('arma', m.weapon.name, weaponStatsAt(m.weaponEffect, m.refinement).procs);
  if (m.primarySet && !m.secondarySet && m.fourPiece !== false) add('set', m.primarySet.name, m.primarySet.effect?.fourPiece?.procs);
  add('char', m.character.name, m.characterEffect?.procs);
  return out;
}

/**
 * Golpes extras Lunar/Estelar do kit (passivas e constelações, ex.: Ineffa A1/C2/C6) como golpes escolhíveis: entram na
 * tabela de dano e no alvo "Um golpe" do otimizador. `move` é o golpe no formato dos dados do jogo (rótulo = chave do golpe
 * extra, `labelPt` = nome), `resolved` já traz a reação Lunar/Estelar.
 */
export function kitProcMoves(m: Parameters<typeof memberProcs>[0], moves?: readonly Move[]): { move: Move; resolved: ResolvedMove }[] {
  return memberProcs(m, moves)
    .filter((p) => p.key.startsWith('char:') && p.proc.special)
    .map((p) => ({
      resolved: p.move,
      move: {
        id: p.move.id, characterId: m.character.name, character: m.character.name, talent: 'skill' as const, hitType: 'skill' as const,
        label: p.key, labelPt: p.proc.label, variant: 0, variants: 1, hits: p.move.hits, scale: p.move.scale as Move['scale'],
      },
    }));
}

/** Reações que podem ser postas na rotação como ação (`talent: 'reaction'`, `label` = chave). */
export const REACTION_ACTIONS: readonly { key: string; label: string; hit: ReactionHit }[] = [
  { key: 'overloaded', label: 'Sobrecarga', hit: { kind: 'transformative', reaction: 'overloaded' } },
  { key: 'electrocharged', label: 'Eletrocarregado', hit: { kind: 'transformative', reaction: 'electrocharged' } },
  { key: 'superconduct', label: 'Supercondutor', hit: { kind: 'transformative', reaction: 'superconduct' } },
  { key: 'shattered', label: 'Estilhaçar', hit: { kind: 'transformative', reaction: 'shattered' } },
  ...(['Pyro', 'Hydro', 'Electro', 'Cryo'] as const).map((element) => ({ key: `swirl:${element}`, label: `Redemoinho ${element}`, hit: { kind: 'transformative' as const, reaction: 'swirl' as const, element } })),
  { key: 'burning', label: 'Queimadura', hit: { kind: 'transformative', reaction: 'burning' } },
  { key: 'bloom', label: 'Florescer', hit: { kind: 'transformative', reaction: 'bloom' } },
  { key: 'burgeon', label: 'Brotar', hit: { kind: 'transformative', reaction: 'burgeon' } },
  { key: 'hyperbloom', label: 'Hiperflorescer', hit: { kind: 'transformative', reaction: 'hyperbloom' } },
  { key: 'lunarcharged', label: 'Lunar-Carregado', hit: { kind: 'lunar', reaction: 'lunarcharged' } },
  { key: 'lunarcrystallize', label: 'Lunar-Cristalizar', hit: { kind: 'lunar', reaction: 'lunarcrystallize' } },
  { key: 'stellarswirl', label: 'Redemoinho Estelar', hit: { kind: 'stellarswirl' } },
  { key: 'stellarswirl:vortex1', label: 'Redemoinho Estelar (vórtice 1)', hit: { kind: 'stellarswirl', vortex: 'vortex1' } },
  { key: 'stellarswirl:vortex2', label: 'Redemoinho Estelar (vórtice 2)', hit: { kind: 'stellarswirl', vortex: 'vortex2' } },
];

/** Ação de reação do membro. Chave desconhecida vira um golpe de dano 0 que avisa no nome. */
export function reactionMove(ref: MoveRef, displayName?: string): ResolvedMove {
  const found = REACTION_ACTIONS.find((r) => r.key === ref.label);
  const base = { id: `${ref.character}:reaction:${ref.label}`, character: ref.character, talent: 'reaction' as const, hitType: 'other' as const, label: ref.label, hits: 1, scale: {} };
  if (!found) return { ...base, displayName: `${ref.character}: reação desconhecida (${ref.label})` };
  return { ...base, displayName: displayName ?? `${ref.character}: ${found.label}`, reactionHit: found.hit };
}

/** Reação Lunar/Estelar de um golpe do kit (a mesma busca de `withSpecial`), ou undefined se o dano é elemental comum. */
export function specialOfMove(move: { talent: string; label: string }, variant: number, effect: (Pick<CharacterEffect, 'specialMoves'> & Partial<Pick<CharacterEffect, 'procs'>>) | undefined): SpecialReaction | undefined {
  const proc = effect?.procs?.find((p) => p.special && `char:${p.id}` === move.label);
  if (proc) return proc.special!.reaction;
  return effect?.specialMoves?.find((x) => x.talent === move.talent && x.label === move.label && (x.variant === undefined || x.variant === variant))?.reaction;
}

/**
 * Bônus por ponto de recurso de um golpe (ex.: Mavuika, Espírito Lutador: 2,88% do ATK por ponto no Supremo nível 10): fração do ATK
 * somada à escala do golpe. `points` ausente = o máximo do recurso. Devolve undefined se o golpe não tem esse bônus.
 */
export function pointExtra(move: { talent: string; label: string }, effect: Pick<CharacterEffect, 'pointMoves'> | undefined, talents: { normal: number; skill: number; burst: number }, points?: number): ExtraScale | undefined {
  const pm = effect?.pointMoves?.find((p) => p.talent === move.talent && p.labels.includes(move.label));
  if (!pm) return undefined;
  const n = Math.min(pm.max, Math.max(0, points ?? pm.max));
  const level = Math.min(15, Math.max(1, Math.round(talents[pm.levelTalent])));
  const atk = pm.perPoint[level - 1] * n + (n === pm.max ? pm.full?.[level - 1] ?? 0 : 0);
  return atk > 0 ? { atk } : undefined;
}

/** Pontos do recurso que o golpe aceita (máximo e nome), se tiver. */
export function pointMoveOf(move: { talent: string; label: string }, effect: Pick<CharacterEffect, 'pointMoves'> | undefined): { max: number; unit: string; cadinho?: number } | undefined {
  const pm = effect?.pointMoves?.find((p) => p.talent === move.talent && p.labels.includes(move.label));
  return pm ? { max: pm.max, unit: pm.unit, ...(pm.cadinho ? { cadinho: pm.cadinho } : {}) } : undefined;
}

/** Golpe do kit com dano Lunar/Estelar (curadoria `CharacterEffect.specialMoves`): marca a reação e aplica o multiplicador extra. */
export function withSpecial(move: ResolvedMove, variant: number, effect: CharacterEffect | undefined): ResolvedMove {
  const s = effect?.specialMoves?.find((x) => x.talent === move.talent && x.label === move.label && (x.variant === undefined || x.variant === variant));
  if (!s) return move;
  const k = s.times ?? 1;
  const mul = (arr?: number[]) => (arr && k !== 1 ? arr.map((v) => v * k) : arr);
  const scale = k === 1 ? move.scale : { atk: mul(move.scale.atk), hp: mul(move.scale.hp), def: mul(move.scale.def), em: mul(move.scale.em), flat: mul(move.scale.flat) };
  return { ...move, scale, special: { reaction: s.reaction, ...(s.resist ? { resist: s.resist } : {}) } };
}

/** Golpe extra de uma ação. Se o membro não o tem mais (trocou de arma ou de set), vale 0 e o nome avisa. */
export function procMove(procs: readonly MemberProc[], ref: MoveRef, displayName?: string): ResolvedMove {
  const found = procs.find((p) => p.key === ref.label);
  if (found) return displayName ? { ...found.move, displayName } : found.move;
  return {
    id: `${ref.character}:proc:${ref.label}`, character: ref.character, talent: 'proc', hitType: 'other', label: ref.label,
    displayName: `${ref.character}: golpe extra indisponível (${ref.label})`, hits: 1, scale: {},
  };
}

/** Dano fixo de arma e de set de 4 peças (ex.: "Dano de Habilidade aumentado em 40% da DEF"). */
export function gearFlat(members: MemberInput[], off: ReadonlySet<string> = new Set()): FlatDamageEffect[] {
  const out: FlatDamageEffect[] = [];
  members.forEach((m, i) => {
    const lists: [string, WeaponFlat[]][] = [];
    if (m.weaponEffect) lists.push([m.weapon.name, weaponStatsAt(m.weaponEffect, m.refinement).flat]);
    if (m.primarySet && !m.secondarySet && m.fourPiece !== false) lists.push([m.primarySet.name, m.primarySet.effect?.fourPiece?.flat ?? []]);
    for (const b of activeCharacterBuffs(m)) if (b.flat?.length && !off.has(`cbuff-${i}-${b.id}`) && !off.has(`m${i}:cbuff-${b.id}`)) lists.push([b.label, b.flat]);
    for (const [origin, flat] of lists) {
      for (const f of flat) {
        const others = members.map((x) => x.character.name).filter((n) => n !== m.character.name);
        const targets = f.targets === 'team' ? 'all' as const : f.targets === 'others' ? others : [m.character.name];
        if (Array.isArray(targets) && targets.length === 0) continue;
        out.push({
          name: `${origin}: ${f.name}`, source: m.character.name, sourceStat: f.sourceStat, perPoint: f.perPoint, threshold: 0,
          ...(f.capPerHit !== undefined ? { capPerHit: f.capPerHit } : {}), targets, elements: f.elements ?? [], hitTypes: f.hitTypes, ...(f.labels?.length ? { labels: f.labels } : {}),
          ...(f.stacks !== undefined ? { stacks: f.stacks } : {}), ...(f.decay ? { decay: f.decay } : {}), active: true, fonte_info: `Passiva de ${origin} (curadoria do Lunaris)`,
        });
      }
    }
  });
  return out;
}

/**
 * Facções ligadas do membro. Sem escolha salva, os personagens Moonsign já nascem Moonsign (no Genshin Optimizer é fixo no kit);
 * Hexerei continua uma escolha do usuário. Escolha salva (mesmo vazia) vale como está.
 */
export function factionsOf(chosen: readonly ('moonsign' | 'hexerei')[] | undefined, eligible: readonly ('moonsign' | 'hexerei')[] | undefined): ('moonsign' | 'hexerei')[] {
  const list = eligible ?? [];
  return chosen === undefined ? list.filter((f) => f === 'moonsign') : list.filter((f) => chosen.includes(f));
}

/** `planilha`: o projeto está no modo planilha (a arma leva o extra de Nightsoul fixo; ver `planilhaWeapon`). */
export function resolveMember(ref: MemberRef, data: GameData, effects: EffectsData, minRolls = 0, defaultLevel = 90, planilha = false): MemberInput {
  const setOf = (name?: string) => (name ? { name, effect: effects.sets.find((s) => s.set === name) } : undefined);
  const level = ref.level ?? defaultLevel;
  const character = characterAtLevel(byName(data.characters, ref.character, 'Personagem'), level, data.levels);
  const weapon: Weapon = ref.weapon === NO_WEAPON
    ? { id: 0, name: NO_WEAPON, namePt: NO_WEAPON, type: character.weapon, rarity: 1, baseAtk: 0, substat: null, passive: null }
    : byName(data.weapons, ref.weapon, 'Arma');
  const weaponEffect = effects.weapons.find((w) => w.weapon === weapon.name);
  const real = ref.pieces?.length
    ? buildFromPieces(ref.pieces, character.element, data.artifacts.map((a) => a.name))
    : ref.noArtifacts ? { stats: {}, primarySet: undefined, secondarySet: undefined, fourPiece: false } : undefined;
  const primarySet = setOf(real ? real.primarySet : ref.primarySet);
  const secondarySet = setOf(real ? real.secondarySet : ref.secondarySet);
  const fourPiece = real ? real.fourPiece : ref.fourPiece;
  const gear = gearBuffs({ weapon, weaponEffect, refinement: ref.refinement, primarySet, secondarySet, fourPiece });
  const own = effects.characters.find((c) => c.character === ref.character);
  // Os stacks escolhidos valem para os buffs do personagem e também para os de arma e set (ids `arma:...`, `set4-...`).
  const merged: CharacterEffect | undefined = gear.length
    ? {
        ...(own ?? { character: ref.character, atkPct: 0, dmgPct: 0, critRate: 0, critDmg: 0, em: 0, appliesToSelf: false, notes: [], procs: [], factions: [], specialMoves: [], fonte_info: 'Buffs de arma e set' }),
        buffs: [...(own?.buffs ?? []), ...gear],
      }
    : own;
  const characterEffect = withStacks(merged, ref.stacks);
  return {
    character,
    level,
    weapon,
    characterEffect,
    reacted: ref.reacted,
    points: ref.points,
    receivers: ref.receivers,
    weaponEffect: planilha ? planilhaWeapon(weaponEffect) : weaponEffect,
    primarySet,
    secondarySet,
    fourPiece,
    refinement: ref.refinement,
    artifacts: ref.artifacts,
    talents: effectiveTalents(ref.talents, ref.constellation, character),
    constellation: ref.constellation,
    factions: factionsOf(ref.factions, own?.factions),
    minER: ref.minER,
    kqmFocus: ref.kqmFocus,
    kqmStat: ref.kqmStat,
    normalInfusion: ref.normalInfusion,
    totalRolls: ref.totalRolls,
    forcedCritRolls: ref.forcedCritRolls,
    // Com peças reais os rolls não existem (a soma exata está em externalStats) e o otimizador de substats não mexe no membro.
    manualRolls: real ? zeroRolls() : ref.manualRolls ? manualToRolls(ref.manualRolls, minRolls) : undefined,
    ...(real ? { externalStats: real.stats } : {}),
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
  /** Ids que começam desligados (arma e set com `gearManual`, mais `condIds`); os ligados estão em `project.enabled`. */
  gearIds: string[];
  actions: RotationAction[];
  /** Parte de `gearIds` que vem de condições da aba Talentos (o otimizador não as liga sozinho). */
  condIds: string[];
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
  const faction = (f: 'moonsign' | 'hexerei') => members.filter((m) => m.factions?.includes(f)).length;
  const moonsign = faction('moonsign');
  const hexerei = faction('hexerei');
  return withMoonsignGleam(members, moonsign).map((m, self) => {
    const buffs = m.characterEffect?.buffs;
    if (!buffs?.some((b) => b.team || b.level || b.convert?.capByLevel)) return m;
    const others = members.filter((_, j) => j !== self);
    const next = buffs.flatMap((b0) => {
      const cl = b0.convert?.capByLevel;
      const b = cl ? { ...b0, convert: { ...b0.convert!, cap: cl.table[Math.min(15, Math.max(1, Math.round(m.talents[cl.talent]))) - 1] } } : b0;
      const t = b.team;
      if (t?.moonsign && moonsign < t.moonsign) return [];
      if (t?.moonsignMax && moonsign > t.moonsignMax) return [];
      if (t?.fewerThan && elements.filter((e) => t.fewerThan!.of.includes(e)).length >= t.fewerThan.count) return [];
      if (t?.hexerei && hexerei < t.hexerei) return [];
      if (t?.only && !elements.every((e) => t.only!.includes(e))) return [];
      if (t?.eachOf && !t.eachOf.every((e) => elements.includes(e))) return [];
      if (t?.minDistinct && new Set(elements).size < t.minDistinct) return [];
      if (t?.onlyWeapons && !t.onlyWeapons.includes(m.character.weapon)) return [];
      if (t?.maxBurstEnergy && (m.character.burst.energyCost ?? Infinity) > t.maxBurstEnergy) return [];
      if (t?.stackPerMate && b.stacks) {
        const cap = Math.min(b.stacks.max, others.filter((x) => t.stackPerMate!.includes(x.character.element)).length);
        const n = Math.min(stacksOf(b, undefined), cap);
        return n ? [{ ...scaleBuffStacks(b, n), stacks: { ...b.stacks, max: cap, default: n } }] : [];
      }
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
        atkFlat: (b.stats.atkFlat ?? 0) * k, hpFlat: (b.stats.hpFlat ?? 0) * k, defFlat: (b.stats.defFlat ?? 0) * k,
        dmgPctByType: Object.fromEntries(Object.entries(b.stats.dmgPctByType ?? {}).map(([h, x]) => [h, x * k])),
        reactionBonus: Object.fromEntries(Object.entries(b.stats.reactionBonus ?? {}).map(([h, x]) => [h, x * k])),
      };
      return [{
        ...b,
        stats,
        ...(b.moveMult && b.level ? { moveMult: { ...b.moveMult, extra: b.moveMult.extra * k } } : {}),
        ...(b.resShred ? { resShred: { ...b.resShred, value: b.resShred.value * k } } : {}),
        ...(b.convert ? { convert: { ...b.convert, perPoint: b.convert.perPoint * k } } : {}),
        ...(b.flat?.length ? { flat: b.flat.map((f) => ({ ...f, perPoint: f.perPoint * k, ...(f.capPerHit !== undefined ? { capPerHit: f.capPerHit * k } : {}) })) } : {}),
      }];
    });
    // Conversão do ATK da própria fonte com teto (Iansan): o ATK que enche o teto vira o mínimo do otimizador.
    const need = next.reduce((best, b) => {
      const c = b.convert;
      return c && c.ownOnly && c.from === 'atk' && c.source === 'self' && c.cap && c.perPoint > 0 ? Math.max(best, c.cap / c.perPoint + (c.threshold ?? 0)) : best;
    }, 0);
    return { ...m, ...(need > 0 && m.minOwnAtk === undefined ? { minOwnAtk: need } : {}), characterEffect: { ...m.characterEffect!, buffs: next } };
  });
}

/**
 * "Moonsign: Ascendant Gleam" (2 ou mais membros Moonsign): cada membro que NÃO é Moonsign dá à equipe, depois de usar
 * a habilidade ou o supremo, DMG das reações Lunares conforme um stat do elemento dele, até 36%. Números e regra do
 * Genshin Optimizer (`libs/gi/sheets/src/Characters/dataUtil.tsx`, `moonsignBuff`, MIT): Pyro/Electro/Cryo 0,9% por
 * 100 de ATK, Hydro 0,6% por 1.000 de HP, Geo 1% por 100 de DEF, Anemo/Dendro 2,25% por 100 de Maestria.
 * No jogo o bônus não se soma entre membros (vale um só): cada membro ganha a própria faixa; ligue uma por vez.
 */
export const MOONSIGN_GLEAM: Record<string, { from: 'atk' | 'hp' | 'def' | 'em'; perPoint: number }> = {
  Pyro: { from: 'atk', perPoint: 0.009 / 100 },
  Electro: { from: 'atk', perPoint: 0.009 / 100 },
  Cryo: { from: 'atk', perPoint: 0.009 / 100 },
  Hydro: { from: 'hp', perPoint: 0.006 / 1000 },
  Geo: { from: 'def', perPoint: 0.01 / 100 },
  Anemo: { from: 'em', perPoint: 0.0225 / 100 },
  Dendro: { from: 'em', perPoint: 0.0225 / 100 },
};

function withMoonsignGleam(members: MemberInput[], moonsign: number): MemberInput[] {
  if (moonsign < 2) return members;
  return members.map((m) => {
    if (m.factions?.includes('moonsign')) return m;
    const g = MOONSIGN_GLEAM[m.character.element];
    if (!g) return m;
    const buff: CharacterBuff = {
      id: 'moonsign-gleam', label: `Moonsign: Ascendant Gleam (${m.character.name})`, minConstellation: 0, scope: 'team', timed: true, flat: [],
      convert: { from: g.from, source: 'self', perPoint: g.perPoint, threshold: 0, cap: 0.36, to: ['lunarcharged', 'lunarbloom', 'lunarcrystallize'] },
      note: 'Com 2+ membros Moonsign, depois da habilidade ou do supremo deste membro: DMG das reações Lunares da equipe por stat, até 36% (Genshin Optimizer). Não se soma ao de outro membro.',
    };
    const base: CharacterEffect = m.characterEffect ?? { character: m.character.name, atkPct: 0, dmgPct: 0, critRate: 0, critDmg: 0, em: 0, appliesToSelf: false, buffs: [], notes: [], procs: [], factions: [], specialMoves: [], fonte_info: 'Moonsign (Genshin Optimizer)' };
    return { ...m, characterEffect: { ...base, buffs: [...base.buffs, buff] } };
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

/**
 * Fora do modo planilha, as passivas e constelações vêm da curadoria. Os números que a planilha semeou no topo do efeito
 * (ATK% e DMG% da Mavuika, RES da Citlali, o C1 dentro do ATK fixo do Bennett) já existem como buffs curados: sem tirá-los
 * cada um contaria duas vezes (Mavuika com +20% de DMG e +30% de ATK a mais, Citlali com -40% de RES em vez de -20%).
 */
function withoutPlanilhaSeed(m: MemberInput): MemberInput {
  const e = m.characterEffect;
  if (!e || !e.fonte_info.startsWith('planilha') || e.buffs.length === 0) return m;
  const c1 = e.buffs.find((b) => b.id === 'c1' && b.convert?.from === 'baseAtk')?.convert?.perPoint ?? 0;
  const { resShred: _drop, ...rest } = e;
  void _drop;
  // Um buff curado que substitui o ATK fixo semeado (Iansan, Bennett por nível) tira o semeado: senão contaria duas vezes.
  const curatedFlat = e.buffs.some((b) => b.replaces === 'teamFlatAtk');
  return {
    ...m,
    characterEffect: {
      // O prefixo evita tratar de novo (o otimizador finaliza membros que já vieram finalizados).
      ...rest, ...(curatedFlat ? { teamFlatAtk: undefined } : {}), fonte_info: `sem a semente da planilha; ${e.fonte_info}`, atkPct: 0, dmgPct: 0, critRate: 0, critDmg: 0, em: 0,
      ...(e.teamFlatAtk && !curatedFlat ? { teamFlatAtk: { ...e.teamFlatAtk, perBaseAtk: Math.max(0, e.teamFlatAtk.perBaseAtk - c1) } } : {}),
    },
  };
}

/**
 * Aplica as regras de composição do time aos membros já resolvidos. No modo planilha, os personagens que vêm da planilha
 * ficam só com os efeitos dela: sem as passivas e constelações curadas depois; fora dele, sem os números semeados que a curadoria repete.
 */
/** KQMS: 40 procs = 20 fixos (2 de cada substat) + 20 livres. */
const KQM_LIQUID_ROLLS = 20;

export function finalizeMembers(members: MemberInput[], planilha: boolean): MemberInput[] {
  // Passiva "Mestre do Armamento" do Tartaglia: +1 nível de Ataque Normal para o time inteiro, ele incluído.
  const master = !planilha && members.some((m) => m.character.name === 'Tartaglia');
  // "Mentoria Mútua das Armas" da Skirk: com o time só de Hydro e Cryo (ao menos um de cada), +1 na Habilidade de todos.
  const elements = new Set(members.map((m) => m.character.element));
  const mentor = !planilha && members.some((m) => m.character.name === 'Skirk') && elements.size === 2 && elements.has('Hydro') && elements.has('Cryo');
  const leveled = master || mentor ? members.map((m) => ({ ...m, talents: { ...m.talents, ...(master ? { normal: withPartyLevel(m, 'normal') } : {}), ...(mentor ? { skill: withPartyLevel(m, 'skill') } : {}) } })) : members;
  // Teto de pontos que sobe com a constelação.
  const raised = leveled.map((m) => (m.characterEffect?.pointMoves?.some((p) => p.maxBy) ? { ...m, characterEffect: { ...m.characterEffect, pointMoves: m.characterEffect.pointMoves.map((p) => (p.maxBy && (m.constellation ?? 0) >= p.maxBy.constellation ? { ...p, max: p.maxBy.max } : p)) } } : m));
  return applyTeamRules(raised).map((m) =>
    planilha
      ? { ...(m.characterEffect && !m.characterEffect.fonte_info.includes('scripts/curation/') ? { ...m, characterEffect: planilhaEffect(m.characterEffect) } : m), weaponEffect: planilhaWeapon(m.weaponEffect), minOwnAtk: undefined, liquidRolls: undefined } // a planilha não tem o ATK próprio mínimo nem o padrão KQMS (o gabarito não muda)
      : { ...withoutPlanilhaSeed(m), liquidRolls: m.liquidRolls ?? KQM_LIQUID_ROLLS - 2 * Object.values(m.artifacts.rarity).filter((r) => r === 4).length },
  );
}

/** Time com o membro `index` trocado por `next` (recém-resolvido), já com as regras do time. Os outros vêm finalizados: não passam de novo. */
export function swapMember(members: MemberInput[], index: number, next: MemberInput, planilha: boolean): MemberInput[] {
  const done = finalizeMembers(members.map((m, i) => (i === index ? next : m)), planilha)[index];
  return members.map((m, i) => (i === index ? done : m));
}

/**
 * Ids (do motor) dos buffs que vêm da arma e do set de um membro: as fontes estáticas, o buff de time `gear-<i>`
 * e os buffs de passiva gerados por `gearBuffs` (com as reduções de RES e DEF deles).
 */
export function gearSourceIds(m: MemberInput, i: number): string[] {
  const ids = [`m${i}:weapon`, `m${i}:set2p-primary`, `m${i}:set2p-secondary`, `m${i}:set4p`, `gear-${i}`, `set-res-shred-${i}`];
  for (const b of gearBuffs(m)) ids.push(`m${i}:cbuff-${b.id}`, `cbuff-${i}-${b.id}`, `cbuff-res-${i}-${b.id}`, `cbuff-def-${i}-${b.id}`);
  return ids;
}

/** Menor duração automática (s): evita dividir por zero quando só há um golpe em 0 s. */
export const MIN_AUTO_DURATION = 0.5;

/** Duração da rotação: a manual (Configurações, ou modo planilha) ou o fim do último golpe (ou do golpe contínuo, o que for maior). */
export function effectiveDuration(project: Pick<RotationProject, 'config' | 'actions' | 'compat'> & Partial<Pick<RotationProject, 'chains'>>): number {
  const manual = project.config.durationManual === true || project.compat === 'planilha';
  let last = manual ? project.config.rotationDuration : project.actions.reduce((m, a) => Math.max(m, a.time), 0);
  // A linha cresce com a duração escolhida para o golpe contínuo (início + duração), mesmo que a última execução caia antes
  // e também com a duração manual.
  const live = new Set(project.actions.map((a) => a.chainId).filter(Boolean));
  for (const [id, c] of Object.entries(project.chains ?? {})) if (live.has(id)) last = Math.max(last, c.until);
  if (manual) return last;
  return Math.max(MIN_AUTO_DURATION, Math.round(last * 100) / 100);
}

/**
 * Pontos de recurso de cada ação (mesma ordem de `chronological`). Golpe com `cadinho` (Ignimoto da Mavuika) usa os pontos do último
 * Supremo do mesmo membro lançado até `cadinho` s antes; fora dessa janela, 0. A janela também acaba quando outro membro age
 * (Normal, habilidade ou Supremo lançado; golpe contínuo, como a Tempestade Gélida da Citlali, não conta) depois do Supremo: a Mavuika saiu de campo.
 * shortcut: "outro membro agiu" no lugar de um "em campo" real, a rotação não guarda quem está em campo; trocar se ela passar a guardar.
 */
export function effectivePoints(chronological: Pick<ActionRef, 'member' | 'move' | 'points' | 'time' | 'chainId'>[], members: Pick<MemberInput, 'characterEffect'>[]): (number | undefined)[] {
  const pmOf = (a: Pick<ActionRef, 'member' | 'move'>) => members[a.member]?.characterEffect?.pointMoves?.find((p) => p.talent === a.move.talent && p.labels.includes(a.move.label));
  return chronological.map((a, i) => {
    const pm = pmOf(a);
    if (!pm?.cadinho) return a.points;
    for (let j = i - 1; j >= 0; j--) {
      const b = chronological[j];
      if (a.time - b.time > pm.cadinho) break;
      if (b.member === a.member) {
        const bp = pmOf(b);
        if (bp && !bp.cadinho) return b.points ?? 0;
      } else if (!b.chainId && ['normal', 'skill', 'burst'].includes(b.move.talent)) break; // contínuo de outro membro (zona, invocação) não o tira de campo
    }
    return 0;
  });
}

/** Escala extra da ação: a manual (planilha) mais o bônus por pontos de recurso, se a ação tem pontos. */
function withPoints(a: Pick<ActionRef, 'move' | 'extraScale'>, points: number | undefined, member: MemberInput | undefined): ExtraScale | undefined {
  if (points === undefined || !member) return a.extraScale;
  const p = pointExtra(a.move, member.characterEffect, member.talents, points);
  if (!p) return a.extraScale;
  return { ...a.extraScale, atk: (a.extraScale?.atk ?? 0) + (p.atk ?? 0) };
}

/** Transforma o projeto salvo nas entradas do motor. Lança ProjectResolveError se algo não existir nos dados. */
export function resolveProject(project: RotationProject, data: GameData, effects: EffectsData): ResolvedProject {
  const planilha = project.compat === 'planilha';
  const members = finalizeMembers(project.members.map((m) => resolveMember(m, data, effects, project.config.minRollsPerSubstat, project.config.characterLevel)), planilha).map((m, i) => {
    // Multiplicador de golpes (Furina): o motor de dano o lê direto do kit, então o interruptor do buff o tira daqui.
    const off = (m.characterEffect?.buffs ?? []).filter((b) => b.moveMult && project.disabled.includes(`cbuff-${i}-${b.id}`));
    return off.length ? { ...m, characterEffect: { ...m.characterEffect!, buffs: m.characterEffect!.buffs.filter((b) => !off.includes(b)) } } : m;
  });
  const moves = indexMoves(data.moves);
  const config: GlobalConfig = { ...project.config, rotationDuration: effectiveDuration(project), elementMode: planilha || project.elementMode === 'personagem' ? 'character' : 'kit' };

  // Cronológico: os stacks de dano fixo são consumidos pelos primeiros hits elegíveis NO TEMPO (ordem estável nos empates).
  const chronological = [...project.actions].sort((a, b) => a.time - b.time);
  const procs = members.map((m) => memberProcs(m, data.moves));
  const points = effectivePoints(chronological, members);
  // Último instante de dano de cada membro por tipo de golpe, em ordem de tempo.
  // shortcut: só a primeira volta (o fim da rotação não conta para o começo); trocar se o site passar a simular o ciclo.
  const lastHit: Partial<Record<HitType, number>>[] = members.map(() => ({}));
  const actions: RotationAction[] = chronological.map((a, i) => {
    const base =
      a.move.talent === 'proc' ? procMove(procs[a.member] ?? [], a.move, a.displayName)
      : a.move.talent === 'reaction' ? reactionMove(a.move, a.displayName)
      : withSpecial(resolveMove(moves, a.move, a.displayName, withPoints(a, points[i], members[a.member])), a.move.variant, members[a.member]?.characterEffect);
    // Sem `element` na ação, o golpe é do elemento do personagem (no modo planilha, sempre).
    const move = a.element ? { ...base, element: a.element } : base;
    const mine = lastHit[a.member] ?? {};
    const sinceType = Object.fromEntries(Object.entries(mine).map(([t, at]) => [t, Math.round((a.time - at) * 1000) / 1000]));
    if (move.hitType !== 'other') mine[move.hitType] = a.time;
    return {
      ...(Object.keys(sinceType).length ? { sinceType } : {}),
      id: a.id,
      member: a.member,
      move,
      executions: a.executions,
      reaction: a.reaction as ReactionChoice,
      activeTags: (a.tagSource === 'windows' ? tagsAt(project.buffWindows, a.time) : a.activeTags).filter((t) => !a.tagsOff?.includes(t)),
      ...(a.tagSource === 'windows' ? { tagAges: tagAgesAt(project.buffWindows, a.time) } : {}),
      dmgAdjust: a.dmgAdjust,
      ...(a.contributors?.length ? { contributors: a.contributors } : {}),
      ...(a.flatOff?.length ? { flatOff: a.flatOff } : {}),
      ...(a.flatOn?.length ? { flatOn: a.flatOn } : {}),
      ...(a.vinculo !== undefined ? { vinculo: a.vinculo } : {}),
      time: a.time,
      note: a.note,
    };
  });

  const gearIds = members.flatMap((m, i) => (project.members[i]?.gearManual ? gearSourceIds(m, i) : []));
  const condIds = members.flatMap((m, i) => (project.members[i]?.condManual ? (m.characterEffect?.buffs ?? []).filter((b) => b.condition).map((b) => `cbuff-${i}-${b.id}`) : []));
  gearIds.push(...condIds.filter((id) => !gearIds.includes(id)));
  const gearOff = gearIds.filter((id) => !project.enabled.includes(id));
  const disabled = [...project.disabled, ...gearOff];
  // Bônus de um golpe só (`onMove`) é lido do kit pelo motor de dano: o desligado sai dali.
  const playing = members.map((m, i) => {
    const off = (m.characterEffect?.buffs ?? []).filter((b) => b.onMove && disabled.includes(`cbuff-${i}-${b.id}`));
    return off.length ? { ...m, characterEffect: { ...m.characterEffect!, buffs: m.characterEffect!.buffs.filter((b) => !off.includes(b)) } } : m;
  });
  const team: TeamInput = { members: playing, extras: project.extras, config, disabled };
  if (project.buffWindows.some((w) => w.maxHits)) applyHitLimits(project.buffWindows, actions, assembleTeam(team, {}), members.map((m) => m.character.name));
  return {
    team,
    gearIds,
    condIds,
    actions,
    flatEffects: [...applyFlatLevels(effects.flatDamage, members).map((e) => ({ ...e, ...(project.compat !== 'planilha' && e.stacks !== undefined ? { window: true as const } : {}) })), ...gearFlat(members, new Set(team.disabled))].map((e) => {
      const o = project.flatStacks?.[flatId(e)];
      return o === undefined ? e : { ...e, stacks: o === 'all' ? undefined : o };
    }),
    ampCoefficient: project.compat === 'planilha' ? AMP_EM_COEFFICIENT_SHEET : undefined,
  };
}
