/**
 * Modelo da tela Equipe: papel de cada personagem, stats-chave, "buffs que dá ao time" e a reação principal.
 * Tudo sai do motor e das tabelas de efeitos; nada é digitado. Funções puras.
 */
import type { Character } from '../../data/schema';
import { assembleTeam, type AnalysisBundle, type ResolvedProject, type RotationProject, type StatDelta, type TeamBuff } from '../../engine';
import { formatDecimal, formatInt } from '../../ui/format';
import { resonanceOf } from '../rotation/teamInfo';

export type Role = 'DPS principal' | 'Suporte';

/** Quem causa mais da metade do dano da rotação é o DPS principal; os outros são suportes. */
export const roleOf = (share: number): Role => (share > 0.5 ? 'DPS principal' : 'Suporte');

const pct = (v: number, digits = 0) => `${v >= 0 ? '+' : '−'}${formatDecimal(Math.abs(v) * 100, digits)}%`;

/** Chips legíveis para um bônus de stats ("+48% ATK", "+120 EM"...). */
export function deltaChips(d: StatDelta): string[] {
  const out: string[] = [];
  if (d.atkPct) out.push(`${pct(d.atkPct)} ATK`);
  if (d.atkFlat) out.push(`ATK fixo +${formatInt(d.atkFlat)}`);
  if (d.hpPct) out.push(`${pct(d.hpPct)} HP`);
  if (d.defPct) out.push(`${pct(d.defPct)} DEF`);
  if (d.em) out.push(`${d.em > 0 ? '+' : '−'}${formatInt(Math.abs(d.em))} EM`);
  if (d.er) out.push(`${pct(d.er)} Recarga`);
  if (d.critRate) out.push(`${pct(d.critRate)} Taxa crít.`);
  if (d.critDmg) out.push(`${pct(d.critDmg)} Dano crít.`);
  if (d.dmgBonus) out.push(`${pct(d.dmgBonus)} DMG`);
  for (const [type, v] of Object.entries(d.dmgByType ?? {})) if (v) out.push(`${pct(v)} DMG ${TYPE_LABEL[type] ?? type}`);
  if (d.meltBonus) out.push(`${pct(d.meltBonus)} Derreter`);
  if (d.vaporizeBonus) out.push(`${pct(d.vaporizeBonus)} Vaporizar`);
  return out;
}

const TYPE_LABEL: Record<string, string> = { normal: 'Normal', charged: 'Carregado', plunge: 'Imersivo', skill: 'Habilidade', burst: 'Supremo' };

/** Origem (índice do membro) de um buff de equipe, pelo id que o motor lhe dá. */
function ownerOf(b: TeamBuff): number | null {
  const m = /^(?:gear|flat-atk|cbuff)-(\d+)/.exec(b.id);
  return m ? Number(m[1]) : null;
}

/** "Pyro/Cryo"; com 6 ou mais elementos vira "elemental" (ex.: Escudo de Jade do Zhongli). */
const resElements = (els: readonly string[]): string => (els.length >= 6 ? 'elemental' : els.join('/'));

/** O que cada membro dá ao time: buffs de arma/set/personagem em janela e a redução de RES do inimigo. */
export function givenBuffs(resolved: ResolvedProject): string[][] {
  const team = resolved.team;
  const assembly = assembleTeam(team);
  const out: string[][] = team.members.map(() => []);

  for (const b of assembly.buffs) {
    const owner = ownerOf(b);
    if (owner === null || !out[owner]) continue;
    out[owner].push(...deltaChips(b.delta));
  }
  team.members.forEach((m, i) => {
    const shred = m.characterEffect?.resShred;
    if (shred && shred.value > 0) out[i].push(`RES ${resElements(shred.elements)} −${formatDecimal(shred.value * 100, 0)}%`);
    const active = (m.characterEffect?.buffs ?? []).filter((b) => (m.constellation ?? 0) >= (b.minConstellation ?? 0));
    for (const b of active) {
      if (b.resShred && b.resShred.value > 0) out[i].push(`RES ${resElements(b.resShred.elements)} −${formatDecimal(b.resShred.value * 100, 0)}%`);
    }
    const fourPiece = m.primarySet?.effect?.fourPiece;
    if (fourPiece?.resShred && !m.secondarySet && m.fourPiece !== false) {
      out[i].push(`RES ${resElements(fourPiece.resShred.elements)} −${formatDecimal(fourPiece.resShred.value * 100, 0)}%`);
    }
  });
  return out.map((list) => [...new Set(list)]);
}

export interface KeyStat {
  k: string;
  v: string;
}

/** 4 stats-chave: o stat principal (ATK/HP/DEF), Maestria e, para DPS, os críticos; para suporte, Recarga e Taxa crítica. */
export function keyStats(bundle: AnalysisBundle, index: number, role: Role): KeyStat[] {
  const s = bundle.memberStats[index];
  const scale = bundle.optimization.members[index]?.mainScale ?? 'atk';
  const main: KeyStat = scale === 'hp' ? { k: 'HP', v: formatInt(s.hp) } : scale === 'def' ? { k: 'DEF', v: formatInt(s.def) } : { k: 'ATK', v: formatInt(s.atk) };
  const em: KeyStat = { k: 'EM', v: formatInt(s.em) };
  const pctText = (f: number) => `${formatDecimal(f * 100, 1)}%`;
  return role === 'DPS principal'
    ? [main, em, { k: 'Taxa crít.', v: pctText(s.critRate) }, { k: 'Dano crít.', v: pctText(s.critDmg) }]
    : [main, em, { k: 'Recarga', v: pctText(s.er) }, { k: 'Taxa crít.', v: pctText(s.critRate) }];
}

const REACTION_NAME: Record<string, string> = { melt: 'Derreter', vaporize: 'Vaporizar', spread: 'Intensificar', aggravate: 'Propagar' };

/** Reação que mais rende: o ganho da amplificação (dano − dano sem a reação) somado por tipo de reação. */
export function mainReaction(bundle: AnalysisBundle): { name: string; fraction: number } | null {
  const result = bundle.optimization.result;
  const gain = new Map<string, number>();
  for (const a of result.actions) {
    const kind = a.action.reaction;
    if (kind === 'none' || !a.breakdown.reactionApplied) continue;
    const factor = a.breakdown.amp > 1 ? a.breakdown.amp : 1 + a.breakdown.additive / Math.max(a.breakdown.base, 1);
    gain.set(kind, (gain.get(kind) ?? 0) + a.avg * (1 - 1 / factor));
  }
  const best = [...gain.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!best || result.totals.avg <= 0) return null;
  return { name: REACTION_NAME[best[0]] ?? best[0], fraction: best[1] / result.totals.avg };
}

export interface ConfigChip {
  text: string;
  accent?: boolean;
}

/** Chips de configuração do cabeçalho: inimigo, RES, DEF, duração e ressonância. */
export function configChips(project: RotationProject, elements: (Character['element'] | undefined)[]): ConfigChip[] {
  const c = project.config;
  const chips: ConfigChip[] = [
    { text: `Inimigo nível ${c.enemyLevel}` },
    { text: `RES base ${formatDecimal(c.enemyBaseRes * 100, 0)}%` },
    { text: `Redução de DEF ${formatDecimal(c.enemyDefRed * 100, 0)}%` },
    { text: `Rotação de ${formatDecimal(c.rotationDuration, 1)} s` },
  ];
  for (const r of resonanceOf(elements.filter((e): e is Character['element'] => !!e)).filter((x) => x.applied)) {
    chips.push({ text: `Ressonância ${r.element} · ${r.text.replace(', já aplicado', '')}`, accent: true });
  }
  return chips;
}

/** Quantos buffs de equipe (em janela) atingem cada membro. */
export function receivedBuffCount(resolved: ResolvedProject): number[] {
  const team = resolved.team;
  const names = team.members.map((m) => m.character.name);
  const buffs = assembleTeam(team).buffs;
  return names.map((n) => buffs.filter((b) => b.targets === 'all' || b.targets.includes(n)).length);
}

const MAIN_LABEL: Record<string, string> = { 'ATK%': 'ATK%', 'HP%': 'HP%', 'DEF%': 'DEF%', EM: 'EM', ER: 'Recarga', CR: 'Taxa crít.', CD: 'Dano crít.', Healing: 'Cura' };

/** "EM · Pyro% · Dano crít." (areia, cálice e tiara). */
export function mainsText(ref: RotationProject['members'][number], element: string | undefined): string {
  const label = (stat: string) => (stat === 'DMG%' ? `${element ?? 'Elemental'}%` : MAIN_LABEL[stat] ?? stat);
  return [ref.artifacts.sands, ref.artifacts.goblet, ref.artifacts.circlet].map(label).join(' · ');
}

/** "4 pç", "2+2 pç" ou "2 pç" conforme o set escolhido. */
export function setPiecesText(ref: RotationProject['members'][number]): { name: string; pieces: string } {
  if (ref.primarySet && ref.secondarySet) return { name: `${ref.primarySet} + ${ref.secondarySet}`, pieces: '2+2 pç' };
  if (ref.primarySet) return { name: ref.primarySet, pieces: ref.fourPiece === false ? '2 pç' : '4 pç' };
  return { name: 'Sem set', pieces: '' };
}
