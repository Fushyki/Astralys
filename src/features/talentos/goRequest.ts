/** Monta o pedido das fichas do Genshin Optimizer a partir do time aberto. Puro e testado. */
import { ascensionAt } from '../../data/levels';
import type { ResolvedProject, RotationProject } from '../../engine';
import type { Rolls } from '../../engine/artifacts';
import { finalStats, foldSources, staticSources, zeroBlock } from '../../engine/stats';
import type { GoMember, GoRequest } from '../../vendor/go/talentos';

/** Personagens com ficha empacotada (ver scripts/go-talentos/build.mjs; um teste confere que a lista bate). */
export const GO_TALENT_CHARACTERS = ['Illuga', 'Zibai'];
export const goKey = (name: string) => name.replace(/[^A-Za-z]/g, '');
export type GoConditionals = Record<string, Record<string, string>>;

/**
 * Só o que vem do build: arma e artefatos (com as passivas de arma e conjunto que o Astralys já aplica sempre). Ascensão, passivas,
 * constelações e condições são calculadas pela ficha do GO.
 */
export function gearStats(resolved: ResolvedProject, rolls: Rolls[], i: number): Record<string, number> {
  const m = resolved.team.members[i];
  const own = staticSources(m, i).filter((s) => s.kind !== 'ascension' && (s.kind !== 'character' || /cbuff-(arma|set)/.test(s.id)));
  const f = finalStats(m, foldSources(own), rolls[i], zeroBlock());
  return {
    weaponAtk: m.weapon.baseAtk,
    atk: f.atk - m.character.baseAtk - m.weapon.baseAtk,
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

export function goRequest(project: RotationProject, resolved: ResolvedProject, rolls: Rolls[], index: number, hitMode: GoRequest['hitMode'], conditionals: GoConditionals): GoRequest {
  const { config } = resolved.team;
  const team: GoMember[] = resolved.team.members.map((m, i) => {
    const ref = project.members[i];
    const level = ref.level ?? config.characterLevel;
    const key = goKey(m.character.name);
    return {
      key,
      element: m.character.element.toLowerCase(),
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
