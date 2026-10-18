/**
 * Transforma a análise do motor nos números que a tela mostra. Função pura (sem React), testada contra o gabarito.
 */
import type { AnalysisBundle, ResolvedProject, SourceKey } from '../../engine';
import { ELEMENT_COLOR, formatDecimal } from '../../ui/format';

export interface SourcePart {
  key: SourceKey;
  label: string;
  fraction: number;
  color: string;
}

export interface ReactionRow {
  label: string;
  fraction: number;
}

export interface MemberRow {
  name: string;
  element: string;
  color: string;
  fraction: number;
  avg: number;
}

export interface WhyRow {
  id: string;
  label: string;
  fraction: number;
  flag?: string;
}

export interface Summary {
  dps: number;
  avg: number;
  noCrit: number;
  crit: number;
  duration: number;
  actionCount: number;
  strongest: { name: string; avg: number; fraction: number; time: number | undefined } | null;
  sources: SourcePart[];
  reactionShare: number;
  reactions: ReactionRow[];
  members: MemberRow[];
  why: WhyRow[];
}

const SOURCE_LABEL: Record<SourceKey, string> = {
  normal: 'Ataque normal',
  charged: 'Ataque carregado',
  plunge: 'Ataque imersivo',
  skill: 'Habilidade (E)',
  burst: 'Supremo (Q)',
  amplifying: 'Reações amplificadoras',
  additive: 'Reações aditivas',
  transformative: 'Reações transformativas',
  lunar: 'Reações Lunares',
  stellar: 'Reações Estelares',
};

const SOURCE_COLOR: Record<SourceKey, string> = {
  normal: '#e9e6f5',
  charged: '#ff8a4c',
  plunge: '#5fe0c1',
  skill: '#8fdcff',
  burst: '#c39bff',
  amplifying: '#d8b668',
  additive: '#9bdb5a',
  transformative: '#e58fb8',
  lunar: '#b9c4ff',
  stellar: '#f0d98a',
};

const SOURCE_ORDER: SourceKey[] = ['normal', 'charged', 'plunge', 'skill', 'burst', 'amplifying', 'additive', 'transformative', 'lunar', 'stellar'];

/** Buffs que a planilha original marcou como "origem não identificada" precisam de confirmação do usuário. */
const NEEDS_CONFIRMATION = /origem não identificada|confirme/i;

export const WHY_ROWS = 8;

export function summarize(bundle: AnalysisBundle, resolved: ResolvedProject): Summary {
  const result = bundle.optimization.result;
  const total = result.totals.avg;

  const strongestAction = result.actions.reduce<(typeof result.actions)[number] | null>((best, a) => (!best || a.avg > best.avg ? a : best), null);

  const sources = SOURCE_ORDER.filter((k) => bundle.sources.shares[k] > 1e-9).map((key) => ({
    key,
    label: SOURCE_LABEL[key],
    fraction: bundle.sources.shares[key],
    color: SOURCE_COLOR[key],
  }));

  const s = bundle.sources.shares;
  const reactions: ReactionRow[] = [
    { label: 'Amplificadoras (Derreter, Vaporizar)', fraction: s.amplifying },
    { label: 'Transformativas', fraction: s.transformative },
    { label: 'Lunares', fraction: s.lunar },
  ];
  if (s.additive > 1e-9) reactions.push({ label: 'Aditivas (Espalhar, Intensificar)', fraction: s.additive });
  if (s.stellar > 1e-9) reactions.push({ label: 'Estelares', fraction: s.stellar });

  const members: MemberRow[] = resolved.team.members.map((m, i) => ({
    name: m.character.name,
    element: m.character.element,
    color: ELEMENT_COLOR[m.character.element] ?? '#d8b668',
    fraction: result.members[i].share,
    avg: result.members[i].avg,
  }));

  const memberName = (i: number | undefined) => (i !== undefined ? members[i].name : 'Time');
  const extraText = (id: string): string => {
    const n = /extra-(\d+)$/.exec(id)?.[1];
    const e = n === undefined ? undefined : resolved.team.extras[Number(n)];
    if (!e) return '';
    const pct = e.stat.endsWith('%');
    const v = pct ? `${formatDecimal(e.value * 100, 0)}%` : formatDecimal(e.value, 0);
    return ` (+${v} ${pct ? e.stat.slice(0, -1) : e.stat})`;
  };

  const rowOf = (i: (typeof bundle.attribution.items)[number]): WhyRow => {
    const flagged = NEEDS_CONFIRMATION.test(i.label);
    return {
      id: i.id,
      label: flagged ? `${memberName(i.member)}: buff sem origem conhecida${extraText(i.id)}` : i.label,
      fraction: i.share,
      flag: flagged ? 'a confirmar' : undefined,
    };
  };
  const positive = bundle.attribution.items.filter((i) => i.contribution > 0);
  const top = positive.slice(0, WHY_ROWS);
  // Buffs que o usuário precisa confirmar aparecem sempre, mesmo fora do topo.
  const pending = positive.slice(WHY_ROWS).filter((i) => NEEDS_CONFIRMATION.test(i.label));
  const why: WhyRow[] = [...top, ...pending].map(rowOf);

  return {
    dps: result.totals.dps,
    avg: total,
    noCrit: result.totals.noCrit,
    crit: result.totals.crit,
    duration: resolved.team.config.rotationDuration,
    actionCount: result.actions.length,
    strongest: strongestAction
      ? {
          name: strongestAction.action.move.displayName,
          avg: strongestAction.avg,
          fraction: total > 0 ? strongestAction.avg / total : 0,
          time: strongestAction.action.time,
        }
      : null,
    sources,
    reactionShare: bundle.sources.reactionShare,
    reactions,
    members,
    why,
  };
}
