import {
  CharacterConfig,
  WeaponConfig,
  ArtifactTotals,
  TeamBuffs,
  TargetEnemy,
  TalentAction,
  DamageCalculationOutput,
  ReactionType
} from '../types/damage';

// Standard reaction base level multipliers (Genshin Impact 1.0 - 5.x/6.x)
const LEVEL_MULTIPLIERS: Record<number, number> = {
  80: 1077.44,
  85: 1253.84,
  90: 1446.85,
  95: 1650.00,
  100: 1860.00
};

export function getLevelMultiplier(level: number): number {
  if (LEVEL_MULTIPLIERS[level]) return LEVEL_MULTIPLIERS[level];
  if (level >= 90) return 1446.85 + (level - 90) * 41.3;
  return 1077.44 + (level - 80) * 36.9;
}

export function calculateDamage(
  character: CharacterConfig,
  weapon: WeaponConfig,
  artifacts: ArtifactTotals,
  buffs: TeamBuffs,
  enemy: TargetEnemy,
  actions: TalentAction[],
  rotationDuration: number = 20
): DamageCalculationOutput {
  // 1. Total Base Stats
  const baseAtkTotal = character.baseAtk + weapon.baseAtk;
  const baseHpTotal = character.baseHp;
  const baseDefTotal = character.baseDef;

  // Total ATK = BaseATK * (1 + %ATK) + FlatATK
  const atkPctTotal = (artifacts.atkPct + weapon.passiveAtkPct + buffs.atkPct) / 100;
  const totalAtk = baseAtkTotal * (1 + atkPctTotal) + artifacts.atkFlat + buffs.flatAtk;

  // Total HP = BaseHP * (1 + %HP) + FlatHP
  const hpPctTotal = (artifacts.hpPct + buffs.hpPct) / 100;
  const totalHp = baseHpTotal * (1 + hpPctTotal) + artifacts.hpFlat + buffs.flatHp;

  // Total DEF = BaseDEF * (1 + %DEF) + FlatDEF
  const defPctTotal = (artifacts.defPct + buffs.defPct) / 100;
  const totalDef = baseDefTotal * (1 + defPctTotal) + artifacts.defFlat + buffs.flatDef;

  // Total EM
  const totalEm = artifacts.eleMas + buffs.flatEm;

  // Total Crit Rate & Crit DMG
  const weaponCr = weapon.subStatKey === 'critRate_' ? weapon.subStatValue : 0;
  const weaponCd = weapon.subStatKey === 'critDMG_' ? weapon.subStatValue : 0;
  const totalCr = Math.min(100, Math.max(0, character.critRate + weaponCr + artifacts.critRate));
  const totalCd = character.critDmg + weaponCd + artifacts.critDmg;

  // Total Damage Bonus %
  const totalDmgBonusPct = artifacts.elemDmgBonus + weapon.passiveDmgBonusPct + buffs.allDmgBonus;
  const dmgBonusMultiplier = 1 + (totalDmgBonusPct / 100);

  // Total ER
  const weaponEr = weapon.subStatKey === 'enerRech_' ? weapon.subStatValue : 0;
  const effectiveEr = 100 + weaponEr + artifacts.enerRech;

  // 2. Enemy Defense Multiplier
  // Formula: (CharLevel + 100) / ((CharLevel + 100) + (EnemyLevel + 100) * (1 - DefRed) * (1 - DefIgn))
  const charLvlFactor = character.level + 100;
  const defRedFactor = 1 - (enemy.defReduction / 100);
  const defIgnFactor = 1 - (enemy.defIgnore / 100);
  const enemyLvlFactor = (enemy.level + 100) * Math.max(0, defRedFactor) * Math.max(0, defIgnFactor);
  const defMultiplier = charLvlFactor / (charLvlFactor + enemyLvlFactor);

  // 3. Enemy Resistance Multiplier
  // Effective RES = Base RES - Total RES Shred
  const effectiveResPct = (enemy.baseRes - (enemy.resShred + buffs.resShred)) / 100;
  let resMultiplier = 1;
  if (effectiveResPct < 0) {
    resMultiplier = 1 - (effectiveResPct / 2);
  } else if (effectiveResPct <= 0.75) {
    resMultiplier = 1 - effectiveResPct;
  } else {
    resMultiplier = 1 / (4 * effectiveResPct + 1);
  }

  // 4. Elemental Mastery Multipliers
  // Amplifying (Vape / Melt): 1 + (2.78 * EM / (EM + 1400))
  const emAmpMultiplier = 1 + (2.78 * totalEm) / (totalEm + 1400);

  // Catalyze (Aggravate / Spread flat bonus):
  const lvlMult = getLevelMultiplier(character.level);
  const emCatalyzeBonus = 1 + (5 * totalEm) / (totalEm + 1200);

  // Transformative Reaction Base (Hyperbloom / Burgeon 3.0x, Swirl 0.6x, Overload 2.0x, Bloom 2.0x)
  const emTransformativeBonus = 1 + (16 * totalEm) / (totalEm + 2000);
  const transformativeDmgBase = lvlMult * emTransformativeBonus * resMultiplier;

  // 5. Calculate Damage per Talent Action
  let rotationTotalDmg = 0;

  const calculatedActions = actions.map(act => {
    // Determine scaling stat base
    let baseStatValue = totalAtk;
    if (act.scalingStat === 'hp') baseStatValue = totalHp;
    if (act.scalingStat === 'def') baseStatValue = totalDef;
    if (act.scalingStat === 'em') baseStatValue = totalEm;

    let baseScaling = baseStatValue * (act.motionValuePct / 100);

    // Support secondary scaling stat (e.g. Alhaitham / Nahida EM + ATK)
    if (act.secondaryStat && act.secondaryMvPct) {
      let secValue = totalAtk;
      if (act.secondaryStat === 'hp') secValue = totalHp;
      if (act.secondaryStat === 'def') secValue = totalDef;
      if (act.secondaryStat === 'em') secValue = totalEm;
      baseScaling += secValue * (act.secondaryMvPct / 100);
    }

    // Flat Buff additions (e.g. Shenhe, Yun Jin, Fighting Spirit)
    if (act.flatBuffDmg) {
      baseScaling += act.flatBuffDmg;
    }

    // Catalyze flat additions (Aggravate / Spread)
    if (act.reaction === 'aggravate') {
      baseScaling += 1.15 * lvlMult * emCatalyzeBonus;
    } else if (act.reaction === 'spread') {
      baseScaling += 1.25 * lvlMult * emCatalyzeBonus;
    }

    // Base damage before crits and reactions
    let damagePreReaction = baseScaling * dmgBonusMultiplier * defMultiplier * resMultiplier;

    // Amplifying Reaction (Vape / Melt)
    let reactionMult = 1.0;
    if (act.reaction === 'vaporize' || act.reaction === 'melt') {
      const baseRatio = act.amplifyingMultiplierOverride || (act.reaction === 'melt' ? 2.0 : 1.5);
      reactionMult = baseRatio * emAmpMultiplier;
    }

    const hitNonCrit = damagePreReaction * reactionMult;
    const hitCrit = hitNonCrit * (1 + (totalCd / 100));
    const crDecimal = totalCr / 100;
    const hitAvg = hitNonCrit * (1 + (crDecimal * (totalCd / 100)));

    const totalActionAvgDmg = hitAvg * Math.max(1, act.hits);
    rotationTotalDmg += totalActionAvgDmg;

    return {
      actionId: act.id,
      actionName: act.name,
      baseScalingValue: baseScaling,
      nonCritDmg: Math.round(hitNonCrit),
      critDmg: Math.round(hitCrit),
      avgDmg: Math.round(hitAvg),
      totalActionAvgDmg: Math.round(totalActionAvgDmg)
    };
  });

  const rotationDPS = rotationDuration > 0 ? Math.round(rotationTotalDmg / rotationDuration) : Math.round(rotationTotalDmg);

  return {
    totalHp: Math.round(totalHp),
    totalAtk: Math.round(totalAtk),
    totalDef: Math.round(totalDef),
    totalEm: Math.round(totalEm),
    totalCr: parseFloat(totalCr.toFixed(1)),
    totalCd: parseFloat(totalCd.toFixed(1)),
    totalDmgBonus: parseFloat(totalDmgBonusPct.toFixed(1)),
    effectiveEr: parseFloat(effectiveEr.toFixed(1)),
    defMultiplier: parseFloat(defMultiplier.toFixed(4)),
    resMultiplier: parseFloat(resMultiplier.toFixed(4)),
    emAmpMultiplier: parseFloat(emAmpMultiplier.toFixed(4)),
    catalyzeFlatBonus: Math.round(1.15 * lvlMult * emCatalyzeBonus),
    transformativeDmgBase: Math.round(transformativeDmgBase),
    actions: calculatedActions,
    rotationTotalDmg: Math.round(rotationTotalDmg),
    rotationDurationSeconds: rotationDuration,
    rotationDPS
  };
}
