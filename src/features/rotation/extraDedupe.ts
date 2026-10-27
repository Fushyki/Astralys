/**
 * Um buff "Extra" que repete um buff já modelado (mesmo dono, mesmo stat, mesmo valor) não entra duas vezes. Vale para projetos sem o
 * modo planilha: na planilha as passivas curadas ficam de fora de propósito e os extras são a única fonte desses números.
 */
import { assembleTeam, resolveProject, type EffectsData, type ExtraBuff, type GameData, type RotationProject } from '../../engine';

const DELTA_KEY: Record<string, string> = {
  'ATK%': 'atkPct', 'DMG%': 'dmgBonus', CR: 'critRate', CD: 'critDmg', EM: 'em', 'HP%': 'hpPct', 'DEF%': 'defPct', ER: 'er', ATK: 'atkFlat', HP: 'hpFlat', DEF: 'defFlat',
};

export interface DuplicateExtra { index: number; extra: ExtraBuff; origin: string }

export function findDuplicateExtras(project: RotationProject, game: GameData, effects: EffectsData): DuplicateExtra[] {
  if (project.compat === 'planilha' || project.extras.length === 0) return [];
  const resolved = resolveProject({ ...project, extras: [] }, game, effects);
  const assembly = assembleTeam({ ...resolved.team, disabled: [] });
  const names = resolved.team.members.map((m) => m.character.name);
  const out: DuplicateExtra[] = [];
  project.extras.forEach((e, index) => {
    const key = DELTA_KEY[e.stat];
    if (!key || !Number.isFinite(e.value)) return;
    const receivers = e.target === 'all' ? names : [e.target];
    const same = (d: unknown) => Math.abs(((d as Record<string, number>)[key] ?? 0) - e.value) < 1e-6;
    for (const who of receivers) {
      const at = names.indexOf(who);
      if (at < 0) continue;
      const fromBuff = assembly.buffs.find((b) => (b.targets === 'all' || b.targets.includes(who)) && same(b.delta));
      const fromSource = assembly.sources[at].find((s) => s.kind !== 'extra' && s.kind !== 'resonance' && same(s.delta));
      const origin = fromBuff?.description ?? fromSource?.label;
      if (origin) {
        out.push({ index, extra: e, origin });
        break;
      }
    }
  });
  return out;
}

/** Tira os extras duplicados e devolve os avisos ("Buff ignorado: já calculado por <origem>"). */
export function dropDuplicateExtras(project: RotationProject, game: GameData, effects: EffectsData): { project: RotationProject; warnings: string[] } {
  const dups = findDuplicateExtras(project, game, effects);
  if (dups.length === 0) return { project, warnings: [] };
  const drop = new Set(dups.map((d) => d.index));
  return {
    project: { ...project, extras: project.extras.filter((_, i) => !drop.has(i)) },
    warnings: dups.map((d) => `Buff ignorado: já calculado por ${d.origin}`),
  };
}
