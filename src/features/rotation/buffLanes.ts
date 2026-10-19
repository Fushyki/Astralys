/**
 * Faixas de buff da linha do tempo: uma por fonte de buff de time (etiqueta) que a equipe realmente tem.
 * O nome é curto para caber na coluna lateral; o detalhe completo vai no tooltip.
 */
import { assembleTeam, type TeamInput } from '../../engine';

export interface BuffLane {
  tag: string;
  /** Nome curto (cabe na coluna lateral). */
  label: string;
  /** Descrição completa dos buffs desta fonte. */
  detail: string;
}

const KIND_ORDER: Record<string, number> = { gear: 0, char: 1, label: 2 };

export function buffLanes(team: TeamInput): BuffLane[] {
  const names = team.members.map((m) => m.character.name);
  const { buffs } = assembleTeam(team);

  const byTag = new Map<string, { descriptions: string[] }>();
  for (const b of buffs) {
    if (b.always) continue;
    const entry = byTag.get(b.tag) ?? { descriptions: [] };
    if (b.description) entry.descriptions.push(b.description);
    byTag.set(b.tag, entry);
  }

  const lanes: BuffLane[] = [...byTag.entries()].map(([tag, { descriptions }]) => {
    const [kind, rest] = [tag.slice(0, tag.indexOf(':')), tag.slice(tag.indexOf(':') + 1)];
    let label: string;
    if (kind === 'gear') label = `Set de ${names[Number(rest)] ?? rest}`;
    else if (kind === 'char') label = `ATK fixo ${names[Number(rest)] ?? rest}`;
    else label = rest === '_geral' ? 'Buffs gerais' : rest;
    return { tag, label, detail: descriptions.join('\n') || label };
  });

  const index = (t: string) => Number(t.slice(t.indexOf(':') + 1)) || 0;
  return lanes.sort((a, b) => {
    const ka = KIND_ORDER[a.tag.split(':')[0]] ?? 9;
    const kb = KIND_ORDER[b.tag.split(':')[0]] ?? 9;
    return ka - kb || index(a.tag) - index(b.tag) || a.label.localeCompare(b.label);
  });
}
