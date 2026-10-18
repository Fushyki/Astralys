/**
 * Modelo do card infográfico: reduz um projeto + sua análise aos números e textos que o card mostra
 * (participação de cada personagem no dano, builds, DPS/DPR e a sequência de golpes). Função pura.
 */
import type { Character } from '../../data/schema';
import type { AnalysisBundle, ResolvedProject, RotationProject } from '../../engine';

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
}

export interface CardModel {
  title: string;
  badge: string;
  tag: string;
  members: CardMember[];
  dps: number;
  dpr: number;
  duration: number;
  /** Sequência compacta, ex.: "Citlali E Q · Mavuika E CA×3 Q". */
  sequence: string;
  enemyLevel: number;
}

export const DEFAULT_BADGE = 'Theorycraft';

const MAIN_ABBR: Record<string, string> = {
  'ATK%': 'ATK', 'HP%': 'HP', 'DEF%': 'DEF', 'DMG%': 'DMG', Healing: 'HB', EM: 'EM', ER: 'ER', CR: 'CR', CD: 'CD',
};
const abbr = (s: string) => MAIN_ABBR[s] ?? s;

const HIT_LETTER = { normal: 'N', charged: 'CA', plunge: 'PA', skill: 'E', burst: 'Q' } as const;

/**
 * Letras dos golpes agrupadas por personagem na ordem do tempo: "Citlali E Q · Mavuika E CA CA Q".
 * Repetições seguidas do mesmo golpe viram "CA×3".
 */
export function sequenceText(project: RotationProject, hitTypeOf: (a: RotationProject['actions'][number]) => keyof typeof HIT_LETTER): string {
  const ordered = [...project.actions].sort((a, b) => a.time - b.time);
  const groups: { member: number; letters: string[] }[] = [];
  for (const a of ordered) {
    const letter = HIT_LETTER[hitTypeOf(a)];
    const last = groups[groups.length - 1];
    if (last && last.member === a.member) last.letters.push(letter);
    else groups.push({ member: a.member, letters: [letter] });
  }
  return groups
    .map((g) => {
      const parts: string[] = [];
      for (const l of g.letters) {
        const prev = parts[parts.length - 1];
        const m = prev?.match(/^(\S+)×(\d+)$/);
        if (m && m[1] === l) parts[parts.length - 1] = `${l}×${Number(m[2]) + 1}`;
        else if (prev === l) parts[parts.length - 1] = `${l}×2`;
        else parts.push(l);
      }
      return `${project.members[g.member]?.character ?? '?'} ${parts.join(' ')}`;
    })
    .join(' · ');
}

export function buildCardModel(
  project: RotationProject,
  bundle: AnalysisBundle,
  characters: readonly Character[],
  hitTypeOf: (a: RotationProject['actions'][number]) => keyof typeof HIT_LETTER,
): CardModel {
  const result = bundle.optimization.result;
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
    };
  });
  const card = project.meta.card ?? {};
  return {
    title: card.title?.trim() || project.name,
    badge: card.badge?.trim() ?? DEFAULT_BADGE,
    tag: card.tag?.trim() ?? '',
    members,
    dps: result.totals.dps,
    dpr: result.totals.avg,
    duration: project.config.rotationDuration,
    sequence: sequenceText(project, hitTypeOf),
    enemyLevel: project.config.enemyLevel,
  };
}

/** Tipo de golpe de cada ação do projeto, buscado nas ações já resolvidas (que conhecem o golpe do jogo). */
export function hitTypeLookup(resolved: ResolvedProject): (a: RotationProject['actions'][number]) => keyof typeof HIT_LETTER {
  const byId = new Map(resolved.actions.map((a) => [a.id, a.move.hitType]));
  return (a) => byId.get(a.id) ?? 'normal';
}
