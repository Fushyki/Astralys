/**
 * Modelo do card infográfico: reduz um projeto + sua análise aos números e textos que o card mostra
 * (participação de cada personagem no dano, builds, DPS/DPR e a sequência de golpes). Função pura.
 */
import type { Character } from '../../data/schema';
import { effectiveDuration, type AnalysisBundle, type ResolvedProject, type RotationProject } from '../../engine';
import { memberColors } from '../../design/elements';
import { mainReaction } from '../team/teamModel';

export interface CardMember {
  name: string;
  element: Character['element'] | null;
  /** Nome do arquivo da imagem no Lunaris (sem extensão), se houver. */
  icon?: string;
  /** Participação no dano médio da rotação, em fração (0 a 1). */
  share: number;
  avg: number;
  weapon: string;
  sets: string[];
  /** "ATK / DMG / CD": areia, cálice e tiara. */
  mains: string;
  /** Recarga de Energia final do build, em fração (1,11 = 111%). */
  er: number;
  critRate: number;
  critDmg: number;
  /** Cor do membro no card (variação escura para o segundo do mesmo elemento). */
  color: string;
}

/** Um golpe (ou um golpe contínuo inteiro) na rotação do card. */
export interface CardHit {
  /** Posição na rotação, de 0 a 1. */
  at: number;
  /** Fim do golpe contínuo (0 a 1); ausente nos golpes únicos. */
  to?: number;
  /** Instante de cada execução de um golpe contínuo (0 a 1). */
  ticks?: number[];
  member: number;
  /** Tamanho relativo ao maior golpe (0 a 1). */
  weight: number;
  burst: boolean;
  /** Letra do golpe: N, CA, PA, E, Q... */
  letter: string;
  /** Execuções: 1 num golpe único, N num contínuo. */
  count: number;
}

/** A rotação de um personagem: os golpes dele no tempo, na ordem real em que entram. */
export interface CardLane {
  member: number;
  hits: CardHit[];
}

export interface CardModel {
  title: string;
  badge: string;
  tag: string;
  members: CardMember[];
  dps: number;
  dpr: number;
  duration: number;
  /** Sequência compacta na ordem do tempo, ex.: "Citlali E Q · Mavuika E CA×3 Q"; golpe contínuo vira uma entrada só. */
  sequence: string;
  enemyLevel: number;
  nick: string;
  accent: string;
  characterLevel: number;
  /** Reação que mais rende dano (ex.: Derreter) e a fração do dano que ela responde. */
  reaction: { name: string; fraction: number } | null;
  /** Uma faixa por personagem, na ordem do time. */
  lanes: CardLane[];
}

export const DEFAULT_BADGE = 'Theorycraft';
export const DEFAULT_ACCENT = '#e9c46a';
export const ACCENTS = ['#e9c46a', '#f08a5d', '#8fd3e8', '#c49cf2'];

const MAIN_ABBR: Record<string, string> = {
  'ATK%': 'ATK', 'HP%': 'HP', 'DEF%': 'DEF', 'DMG%': 'DMG', Healing: 'HB', EM: 'EM', ER: 'ER', CR: 'CR', CD: 'CD',
};
const abbr = (s: string) => MAIN_ABBR[s] ?? s;

const HIT_LETTER = { normal: 'N', charged: 'CA', plunge: 'PA', skill: 'E', burst: 'Q', other: '+' } as const;

/** Letra do golpe; null nos golpes que não são golpes da rotação (reação lançada à mão). */
function letterOf(a: RotationProject['actions'][number], hitType: keyof typeof HIT_LETTER): string | null {
  if (a.move.talent === 'reaction') return null;
  if (/sprint|dash/i.test(a.move.label)) return 'Inv';
  return HIT_LETTER[hitType];
}

/**
 * Os golpes da rotação na ordem do tempo, como o jogador os fez: golpe contínuo (mesmo `chainId`) vira UMA entrada com o início, o fim
 * e o instante de cada execução, e as reações lançadas à mão não entram (não são golpes).
 */
export function rotationHits(
  project: RotationProject,
  avgOf: (id: string) => number,
  hitTypeOf: (a: RotationProject['actions'][number]) => keyof typeof HIT_LETTER,
): CardHit[] {
  const duration = Math.max(effectiveDuration(project), 0.1);
  const at = (t: number) => Math.min(1, Math.max(0, t / duration));
  const ordered = [...project.actions].sort((x, y) => x.time - y.time);
  const biggest = Math.max(1, ...ordered.map((a) => avgOf(a.id)));
  const seen = new Set<string>();
  const out: CardHit[] = [];
  for (const a of ordered) {
    const hitType = hitTypeOf(a);
    const letter = letterOf(a, hitType);
    if (!letter) continue;
    if (a.chainId) {
      if (seen.has(a.chainId)) continue;
      seen.add(a.chainId);
      const run = ordered.filter((x) => x.chainId === a.chainId && letterOf(x, hitTypeOf(x)));
      const last = run[run.length - 1];
      out.push({ at: at(a.time), to: at(last.time), ticks: run.map((x) => at(x.time)), member: a.member, weight: Math.max(...run.map((x) => avgOf(x.id))) / biggest, burst: hitType === 'burst', letter, count: run.length });
    } else {
      out.push({ at: at(a.time), member: a.member, weight: avgOf(a.id) / biggest, burst: hitType === 'burst', letter, count: 1 });
    }
  }
  return out;
}

/** "Citlali E Q · Mavuika E×4 Q": golpes seguidos do mesmo personagem num grupo; a mesma letra em seguida vira ×N (contínuo conta as execuções). */
export function sequenceOf(hits: readonly CardHit[], names: readonly string[]): string {
  const groups: { member: number; parts: { letter: string; n: number }[] }[] = [];
  for (const h of hits) {
    let g = groups[groups.length - 1];
    if (!g || g.member !== h.member) groups.push((g = { member: h.member, parts: [] }));
    const p = g.parts[g.parts.length - 1];
    if (p && p.letter === h.letter) p.n += h.count;
    else g.parts.push({ letter: h.letter, n: h.count });
  }
  return groups.map((g) => `${names[g.member] ?? '?'} ${g.parts.map((p) => (p.n > 1 ? `${p.letter}×${p.n}` : p.letter)).join(' ')}`).join(' · ');
}

export function buildCardModel(
  project: RotationProject,
  bundle: AnalysisBundle,
  characters: readonly Character[],
  hitTypeOf: (a: RotationProject['actions'][number]) => keyof typeof HIT_LETTER,
): CardModel {
  const result = bundle.optimization.result;
  const colors = memberColors(project.members.map((m) => characters.find((x) => x.name === m.character)?.element));
  const members: CardMember[] = project.members.map((m, i) => {
    const c = characters.find((x) => x.name === m.character);
    const stats = bundle.memberStats[i];
    const totals = result.members[i];
    return {
      name: m.character,
      element: c?.element ?? null,
      icon: c?.icon,
      share: totals?.share ?? 0,
      avg: totals?.avg ?? 0,
      weapon: m.weapon,
      sets: [m.primarySet, m.secondarySet].filter((s): s is string => !!s),
      mains: [abbr(m.artifacts.sands), abbr(m.artifacts.goblet), abbr(m.artifacts.circlet)].join(' / '),
      er: stats?.er ?? 1,
      critRate: stats?.critRate ?? 0,
      critDmg: stats?.critDmg ?? 0,
      color: colors[i],
    };
  });
  const card = project.meta.card ?? {};
  const avgById = new Map(result.actions.map((a) => [a.action.id, a.avg]));
  const hits = rotationHits(project, (id) => avgById.get(id) ?? 0, hitTypeOf);
  const lanes: CardLane[] = project.members.map((_, i) => ({ member: i, hits: hits.filter((h) => h.member === i) }));
  return {
    title: card.title?.trim() || project.name,
    badge: card.badge?.trim() ?? DEFAULT_BADGE,
    tag: card.tag?.trim() ?? '',
    members,
    dps: result.totals.dps,
    dpr: result.totals.avg,
    duration: effectiveDuration(project),
    sequence: sequenceOf(hits, project.members.map((m) => m.character)),
    enemyLevel: project.config.enemyLevel,
    nick: card.nick?.trim() ?? '',
    accent: card.accent ?? DEFAULT_ACCENT,
    characterLevel: project.config.characterLevel,
    reaction: mainReaction(bundle),
    lanes,
  };
}

/** Tipo de golpe de cada ação do projeto, buscado nas ações já resolvidas (que conhecem o golpe do jogo). */
export function hitTypeLookup(resolved: ResolvedProject): (a: RotationProject['actions'][number]) => keyof typeof HIT_LETTER {
  const byId = new Map(resolved.actions.map((a) => [a.id, a.move.hitType]));
  return (a) => byId.get(a.id) ?? 'normal';
}
