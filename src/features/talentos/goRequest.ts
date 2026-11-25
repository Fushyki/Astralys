/** Monta o pedido das fichas do Genshin Optimizer a partir do time aberto. Puro e testado. */
import { ascensionAt } from '../../data/levels';
import type { CharacterBuff, CharacterEffect } from '../../effects/schema';
import { characterTag, labelTag, type ResolvedProject, type RotationProject } from '../../engine';
import type { Rolls } from '../../engine/artifacts';
import { finalStats, foldSources, staticSources, zeroBlock } from '../../engine/stats';
import type { GoMember, GoRequest } from '../../vendor/go/talentos';

/** Personagens com ficha empacotada (ver scripts/go-talentos/build.mjs; um teste confere que a lista bate). */
export const GO_TALENT_CHARACTERS = ['Illuga', 'Zibai'];
export const goKey = (name: string) => name.replace(/[^A-Za-z]/g, '');
export type GoConditionals = Record<string, Record<string, string>>;

/**
 * Só o que vem do build: arma e artefatos (com as passivas de arma e conjunto que estão ligadas no time). Ascensão, passivas,
 * constelações e condições são calculadas pela ficha do GO.
 */
export function gearStats(resolved: ResolvedProject, rolls: Rolls[], i: number): Record<string, number> {
  const m = resolved.team.members[i];
  const off = new Set(resolved.team.disabled);
  const own = staticSources(m, i).filter((s) => !off.has(s.id) && s.kind !== 'ascension' && (s.kind !== 'character' || /cbuff-(arma|set)/.test(s.id)));
  const block = foldSources(own);
  const f = finalStats(m, block, rolls[i], zeroBlock());
  // O ATK% vai separado do fixo: a ficha o aplica também sobre ATK base ganho depois (Mavuika C2, Bennett).
  const base = m.character.baseAtk + m.weapon.baseAtk;
  const atkPct = (finalStats(m, block, rolls[i], { ...zeroBlock(), atkBaseFlat: 1000 }).atk - f.atk) / 1000 - 1;
  return {
    weaponAtk: m.weapon.baseAtk,
    atk: f.atk - base * (1 + atkPct),
    atk_: atkPct,
    hp: f.hp - m.character.baseHp,
    def: f.def - m.character.baseDef,
    eleMas: f.em,
    enerRech_: f.er - 1,
    critRate_: f.critRate - 0.05,
    critDMG_: f.critDmg - 0.5,
    [`${m.character.element.toLowerCase()}_dmg_`]: f.eleDmg,
    all_dmg_: f.dmgBonus - f.eleDmg,
    physical_dmg_: f.physDmg,
    normal_dmg_: f.dmgByType.normal,
    charged_dmg_: f.dmgByType.charged,
    plunging_dmg_: f.dmgByType.plunge,
    skill_dmg_: f.dmgByType.skill,
    burst_dmg_: f.dmgByType.burst,
  };
}

export interface RotationCondition {
  /** Índice do membro dono da condição. */
  member: number;
  /** Buffs da rotação que a condição liga (ids do motor). Vazio nunca: sem buff, a condição vale só na aba. */
  ids: string[];
  /** Estado atual no formato da ficha do GO: '' = desligada, 'on' ou a quantidade. */
  value: string;
  /** Chave dos stacks no membro, quando a condição é uma quantidade. */
  stackKey?: string;
  /** Nenhum buff com duração desta condição tem janela na rotação: ligada, essa parte ainda não vale. */
  needsWindow: boolean;
}

/** Condições da aba que a rotação conhece, por personagem (chave do GO) e id da condição: o projeto é a única fonte do estado. */
export function rotationConditions(project: RotationProject, resolved: ResolvedProject, effects: CharacterEffect[]): Record<string, Record<string, RotationCondition>> {
  const out: Record<string, Record<string, RotationCondition>> = {};
  project.members.forEach((ref, member) => {
    const byCondition = new Map<string, CharacterBuff[]>();
    for (const b of effects.find((e) => e.character === ref.character)?.buffs ?? []) {
      if (b.condition) byCondition.set(b.condition, [...(byCondition.get(b.condition) ?? []), b]);
    }
    for (const [condition, buffs] of byCondition) {
      const ids = buffs.map((b) => `cbuff-${member}-${b.id}`);
      const on = ids.every((id) => !project.disabled.includes(id) && (!resolved.gearIds.includes(id) || project.enabled.includes(id)));
      const stacked = buffs.find((b) => b.stacks);
      const stackKey = stacked ? stacked.stacks!.of ?? stacked.id : undefined;
      // Só os buffs que valem neste time e nesta constelação pedem janela.
      const active = resolved.team.members[member].characterEffect?.buffs ?? [];
      const timed = active.filter((b) => b.condition === condition && b.timed && b.minConstellation <= (ref.constellation ?? 0));
      const needsWindow = timed.length > 0 && !timed.some((b) => project.buffWindows.some((w) => w.tag === (b.onCharTag ? characterTag(member) : labelTag(b.label))));
      (out[goKey(ref.character)] ??= {})[condition] = {
        member, ids, stackKey, needsWindow,
        value: !on ? '' : stacked ? String(ref.stacks?.[stackKey!] ?? stacked.stacks!.max) : 'on',
      };
    }
  });
  return out;
}

export function goRequest(project: RotationProject, resolved: ResolvedProject, rolls: Rolls[], index: number, hitMode: GoRequest['hitMode'], conditionals: GoConditionals): GoRequest {
  const { config } = resolved.team;
  const team: GoMember[] = resolved.team.members.map((m, i) => {
    const ref = project.members[i];
    const level = ref.level ?? config.characterLevel;
    const key = goKey(m.character.name);
    return {
      key,
      element: m.character.element.toLowerCase(),
      moonsign: m.factions?.includes('moonsign') ?? false,
      level,
      constellation: ref.constellation ?? 0,
      ascension: ascensionAt(level),
      talents: ref.talents,
      stats: gearStats(resolved, rolls, i),
      conditionals: conditionals[key] ?? {},
    };
  });
  const res = Object.fromEntries(['anemo', 'geo', 'electro', 'hydro', 'pyro', 'cryo', 'dendro', 'physical'].map((e) => [e, config.enemyBaseRes]));
  return { active: team[index].key, hitMode, enemy: { level: config.enemyLevel, res }, team };
}
