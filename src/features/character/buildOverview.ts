/** Panorama da build: os stats do personagem fora de campo (a ficha, sem buffs) e em campo (com todos os buffs ativos). */
import { finalStats, foldSources, zeroBlock, type FinalStats, type MemberInput, type Rolls, type StatSourceKind, type TeamAssembly } from '../../engine';
import { formatDecimal, formatInt, formatPercent } from '../../ui/format';

/** Fontes que contam no personagem "sem buff" (a ficha do jogo): o resto (passivas, arma, set de 4 peças, ressonância, extras) é buff. */
export const BARE_KINDS: ReadonlySet<StatSourceKind> = new Set<StatSourceKind>(['ascension', 'weapon-substat', 'set-2p', 'main-stat']);

export const sheetStats = (member: MemberInput, assembly: TeamAssembly, index: number, rolls: Rolls): FinalStats =>
  finalStats(member, foldSources(assembly.sources[index].filter((x) => BARE_KINDS.has(x.kind))), rolls, zeroBlock(), 0);

export interface OverviewRow { key: string; label: string; out: string; in: string; changed: boolean }

export function overviewRows(sheet: FinalStats, field: FinalStats, element: string): OverviewRow[] {
  const cv = (s: FinalStats) => formatDecimal(2 * s.critRate * 100 + s.critDmg * 100, 1);
  const pct = (f: number) => formatPercent(f, 1);
  const rows: [string, string, (s: FinalStats) => string][] = [
    ['hp', 'HP', (s) => formatInt(s.hp)],
    ['atk', 'ATK', (s) => formatInt(s.atk)],
    ['def', 'DEF', (s) => formatInt(s.def)],
    ['em', 'Proficiência Elemental', (s) => formatInt(s.em)],
    ['er', 'Recarga de Energia', (s) => pct(s.er)],
    ['cr', 'Taxa crítica', (s) => pct(s.critRate)],
    ['cd', 'Dano crítico', (s) => pct(s.critDmg)],
    ['cv', 'Crit Value', cv],
    ['ele', `Bônus de dano ${element}`, (s) => pct(s.dmgBonus)],
  ];
  return rows.map(([key, label, show]) => ({ key, label, out: show(sheet), in: show(field), changed: show(sheet) !== show(field) }));
}
