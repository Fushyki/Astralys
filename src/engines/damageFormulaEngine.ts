/**
 * Astralys - Damage Formula & Reaction Breakdown Engine
 * Implements exact damage calculation formulas for:
 * 1. Traditional Direct Damage (Talent × ATK × DMG Bonus × Crit × DEF × RES)
 * 2. Amplifying Reactions (Melt / Vaporize with EM multiplier)
 * 3. Stellar Reactions (1.9x base, EmmS = 1 + 6*EM/(EM+2000), dmgStellar = min((ATK/100)*0.007, 0.14))
 * 4. Lunar Reactions (LunarCharge & Lunar Cristal, Level 90/100 Base 1446.9/2604.3, Lunar Passives, Can Crit!)
 */

import { DamageHit, CharacterStatSnapshot } from '../types/damageBreakdown';

export interface DamageCalculationStep {
  name: string;
  description: string;
  formula: string;
  value: number;
  formattedValue: string;
}

export interface DamageBreakdownDetails {
  hitName: string;
  charName: string;
  category: 'direct' | 'melt_vape' | 'stellar' | 'lunar';
  categoryLabel: string;
  reactionType: string;
  finalDamage: number;
  steps: DamageCalculationStep[];
  formulaString: string;
  explanation: string;
  statsUsed: {
    atk: number;
    cr: number;
    cd: number;
    em: number;
    dmgBonus: number;
    enemyRes: number;
    enemyDef: number;
  };
}

/**
 * Deconstructs any hit into its exact mathematical factors and explanations.
 */
export function explainDamageHit(
  hit: DamageHit,
  char?: CharacterStatSnapshot,
  enemyLevel = 100,
  charLevel = 90
): DamageBreakdownDetails {
  const labelUpper = hit.label.toUpperCase();
  const hitDamage = hit.damage;

  // Base stats with sensible defaults from char snapshot
  const atk = char?.totalAtk || 3500;
  const cr = char?.critRate ? char.critRate / 100 : 0.85;
  const cd = char?.critDmg ? char.critDmg / 100 : 2.0;
  const em = char?.elementalMastery || 250;
  const dmgBonus = char?.dmgBonus ? char.dmgBonus / 100 : 0.466;

  // Standard Enemy Factors (Level 90 char vs Level 100 Boss)
  const enemyDefMult = (charLevel + 100) / ((charLevel + 100) + (enemyLevel + 100)); // ~0.487 (48.7%)
  const enemyResMult = 0.90; // Standard 10% enemy resistance: 1 - 0.10 = 0.90
  const critMult = 1 + cd; // Assuming critical hit (or 1 + cr * cd for average)

  // 1. Detect Stellar Reactions (Stellar Beam, EStellar, QStellar, etc.)
  if (labelUpper.includes('STELLAR')) {
    const emmS = 1 + (6 * em) / (em + 2000); // Stellar EM Multiplier
    const dmgStellar = Math.min((atk / 100) * 0.007, 0.14); // Stellar ATK Scaling passive (up to 14%)
    const stellarBonusDmg = 1 + dmgBonus + 0.50; // Stellar DMG bonus (~1.9x)
    const stellarBaseMult = labelUpper.includes('Q') ? 1.5 * 1.9 : 1.9;

    // Approximate talent scaling from final damage
    const estimatedTalent = hitDamage / (atk * stellarBaseMult * (1 + dmgStellar) * (emmS + stellarBonusDmg) * enemyResMult * critMult);

    return {
      hitName: hit.displayName || hit.label,
      charName: hit.charName,
      category: 'stellar',
      categoryLabel: 'Reação Estelar (Stellar)',
      reactionType: 'Radiance: Stellar-Conduct • Polarstar Field',
      finalDamage: hitDamage,
      formulaString: 'Dano = Talento% × ATK × MultEstelar(1.9) × (1 + dmgStellar) × (EmmS + BdmgS) × RES × Crítico',
      explanation: 'Golpe sob o estado "Radiance: Stellar-Conduct" dentro do Polestar Field (Campo Estelar). O campo opera em janelas de 4 segundos gravando cada aplicação Cryo e Electro nos inimigos (sujeito a ICD) para acumular até 12 Stacks. Cada stack amplifica o multiplicador estelar e o dano Cryo/Electro. O dano ignora a armadura tradicional de 49% do inimigo e escala pesadamente com ATK.',
      statsUsed: {
        atk,
        cr: Math.round(cr * 100),
        cd: Math.round(cd * 100),
        em,
        dmgBonus: Math.round(dmgBonus * 100),
        enemyRes: 0.90,
        enemyDef: 1.0 // Bypassed in stellar calculations
      },
      steps: [
        {
          name: 'ATK de Combate (Buffado)',
          description: 'Ataque total com bônus de armas, artefatos e ressonância.',
          formula: 'ATK Total',
          value: atk,
          formattedValue: `${atk.toLocaleString('pt-BR')}`
        },
        {
          name: 'Multiplicador Base Estelar (Stellar-Conduct)',
          description: 'Multiplicador base da reação que substitui o Supercondutor tradicional.',
          formula: 'Base Estelar',
          value: stellarBaseMult,
          formattedValue: `${stellarBaseMult.toFixed(2)}×`
        },
        {
          name: 'Polestar Field Stacks (Campo Estelar)',
          description: 'Gravação de aplicações Cryo/Electro na janela de 4s (média 5 stacks, limite de 12 stacks).',
          formula: 'Assumes ~5 Stacks de Campo',
          value: 1.15,
          formattedValue: '+15.0% (~5 Stacks)'
        },
        {
          name: 'Bônus Passivo Estelar (dmg Stellar)',
          description: 'Escalonamento derivado do ATK: min((ATK / 100) × 0.007, 0.14) (até +14%).',
          formula: `min((${atk} / 100) * 0.007, 0.14)`,
          value: dmgStellar,
          formattedValue: `+${(dmgStellar * 100).toFixed(2)}%`
        },
        {
          name: 'Multiplicador de EM Estelar (EmmS)',
          description: 'Bônus de Proficiência Elemental Estelar: 1 + (6 × EM) / (EM + 2000).',
          formula: `1 + (6 * ${em}) / (${em} + 2000)`,
          value: emmS,
          formattedValue: `${emmS.toFixed(3)}×`
        },
        {
          name: 'Bônus de Dano Estelar (BdmgS)',
          description: 'Soma de bônus de dano estelar e elemental no estado Radiance.',
          formula: '1 + Bônus Dano Estelar',
          value: stellarBonusDmg,
          formattedValue: `${stellarBonusDmg.toFixed(2)}×`
        },
        {
          name: 'Multiplicador de Dano Crítico',
          description: 'Multiplicador aplicado no acerto crítico do ataque estelar.',
          formula: `1 + ${(cd * 100).toFixed(0)}% CD`,
          value: critMult,
          formattedValue: `${critMult.toFixed(2)}×`
        },
        {
          name: 'Resistência do Inimigo (RES)',
          description: 'Resistência elemental do chefe no Abismo (10% padrão).',
          formula: '1 - 0.10',
          value: enemyResMult,
          formattedValue: '0.90× (10% RES)'
        }
      ]
    };
  }

  // 2. Detect Lunar Reactions (LunarCharge, Lunar Cristal, etc.)
  if (labelUpper.includes('LUNAR') || labelUpper.includes('LCRISTAL') || labelUpper.includes('CHARGE')) {
    const isCharge = labelUpper.includes('CHARGE');
    const baseMult = isCharge ? 2604.34 : 1446.90; // Base transformative reaction coefficient at Level 90
    const passivaL = Math.min((atk / 100) * 0.007, 0.14); // +14% ATK passive
    const emm = 1 + (6 * em) / (em + 2000); // Lunar EM formula
    const resMultLunar = 1 - (-0.30 / 2); // 1.15x (with 30% Lunar RES shred)

    return {
      hitName: hit.displayName || hit.label,
      charName: hit.charName,
      category: 'lunar',
      categoryLabel: 'Reação Lunar (Lunar Reaction)',
      reactionType: isCharge ? 'LunarCharge (Eletrocutar Lunar)' : 'Lunar Cristal (Cristalização Lunar)',
      finalDamage: hitDamage,
      formulaString: 'Dano = Base(1446.9 / 2604.3) × (1 + Passivas_L) × (1 + Emm_L) × Crítico × RES_Lunar',
      explanation: 'Reação Lunar Transformadora de alta potência. Ao contrário das reações transformadoras clássicas (como Redemoinho), as Reações Lunares PODEM CRITAR, multiplicam-se pelas passivas de equipe da fase lunar (Passivas_L) e escalonam com o coeficiente de nível e proficiência.',
      statsUsed: {
        atk,
        cr: Math.round(cr * 100),
        cd: Math.round(cd * 100),
        em,
        dmgBonus: Math.round(passivaL * 100),
        enemyRes: 1.15,
        enemyDef: 1.0 // Transformative ignores DEF
      },
      steps: [
        {
          name: 'Coeficiente Base de Nível (Nv 90)',
          description: isCharge ? 'Constante base de 1.8× da reação LunarCharge.' : 'Constante base Nv 90 de reações elementais.',
          formula: isCharge ? '1.8 × 1446.9' : '1446.9 (Nv 90 Base)',
          value: baseMult,
          formattedValue: `${baseMult.toFixed(1)}`
        },
        {
          name: 'Bônus de Passivas Lunares (Passivas L)',
          description: 'Soma dos buffs passivos lunares gerados pela equipe.',
          formula: '1 + Passiva ATK / HP / DEF',
          value: 1 + passivaL,
          formattedValue: `${(1 + passivaL).toFixed(3)}× (+${(passivaL * 100).toFixed(1)}%)`
        },
        {
          name: 'Bônus de Proficiência Lunar (Emm L)',
          description: 'Multiplicador de EM exclusivo para reações lunares.',
          formula: `1 + (6 * ${em}) / (${em} + 2000)`,
          value: emm,
          formattedValue: `${emm.toFixed(3)}×`
        },
        {
          name: 'Multiplicador de Dano Crítico (Capacidade Única)',
          description: 'Reações Lunares beneficiam-se diretamente de Taxa e Dano Crítico.',
          formula: `1 + ${(cd * 100).toFixed(0)}% CD`,
          value: critMult,
          formattedValue: `${critMult.toFixed(2)}×`
        },
        {
          name: 'Redução de Resistência Lunar (RES)',
          description: 'Efeito de redução de resistência de 30% em alvos sob efeito lunar.',
          formula: '1 - (-0.30 / 2)',
          value: resMultLunar,
          formattedValue: `${resMultLunar.toFixed(2)}× (+15% Dano)`
        }
      ]
    };
  }

  // 3. Detect Amplifying Reactions (Melt / Vaporize: QM, FM, CM)
  const isMelt = labelUpper === 'QM' || labelUpper === 'FM' || labelUpper === 'CM' || labelUpper.includes('MELT');
  if (isMelt) {
    const reactionBaseMult = 2.0; // Pyro on Cryo Melt
    const emMeltBonus = (2.78 * em) / (em + 1400); // 1.67x multiplier in sheet
    const totalReactionMult = reactionBaseMult * (1 + emMeltBonus);
    const totalDmgBonus = 1 + dmgBonus + (labelUpper === 'QM' ? 0.40 : 0.20); // Extra burst/attack bonus

    return {
      hitName: hit.displayName || hit.label,
      charName: hit.charName,
      category: 'melt_vape',
      categoryLabel: 'Fusão Amplificada (Melt 2.0×)',
      reactionType: 'Fusão Reversa/Direta (Pyro sobre Cryo)',
      finalDamage: hitDamage,
      formulaString: 'Dano = Talento% × ATK × MultFusão(2.0) × (1 + BônusEM) × (1 + BônusDano) × Crítico × DEF × RES',
      explanation: 'Ataque amplificado com a reação de Fusão (Melt). Multiplica o dano base por 2.0×, acrescido do bônus de Proficiência Elemental (EM) e amplificado exponencialmente pelos bônus de dano e acerto crítico.',
      statsUsed: {
        atk,
        cr: Math.round(cr * 100),
        cd: Math.round(cd * 100),
        em,
        dmgBonus: Math.round((totalDmgBonus - 1) * 100),
        enemyRes: 0.90,
        enemyDef: 0.487
      },
      steps: [
        {
          name: 'ATK de Combate Buffado',
          description: 'Ataque total sob efeito de buffs de equipe (Bennett, Cinder City, etc.).',
          formula: 'ATK Final',
          value: atk,
          formattedValue: `${atk.toLocaleString('pt-BR')}`
        },
        {
          name: 'Multiplicador da Reação de Fusão',
          description: 'Multiplicador base de reação Pyro disparando sobre aura Cryo.',
          formula: 'Base Melt',
          value: reactionBaseMult,
          formattedValue: '2.00×'
        },
        {
          name: 'Bônus de Proficiência Elemental (Emm)',
          description: 'Multiplicador obtido a partir de Proficiência Elemental.',
          formula: `1 + (2.78 * ${em}) / (${em} + 1400)`,
          value: 1 + emMeltBonus,
          formattedValue: `${(1 + emMeltBonus).toFixed(3)}× (+${(emMeltBonus * 100).toFixed(1)}%)`
        },
        {
          name: 'Bônus de Dano Total (Elemental + Habilidade)',
          description: 'Soma de Cálice Elemental, Bônus de Conjunto e buffs de equipe.',
          formula: `1 + ${(dmgBonus * 100).toFixed(1)}% + Buffs`,
          value: totalDmgBonus,
          formattedValue: `${totalDmgBonus.toFixed(2)}×`
        },
        {
          name: 'Multiplicador Crítico (Dano Crítico)',
          description: 'Multiplicador de dano aplicado no golpe crítico.',
          formula: `1 + ${(cd * 100).toFixed(0)}% CD`,
          value: critMult,
          formattedValue: `${critMult.toFixed(2)}×`
        },
        {
          name: 'Defesa do Inimigo (DEF Nv 100)',
          description: 'Fator de redução de armadura para monstro nível 100 no Abismo.',
          formula: '(90 + 100) / ((90 + 100) + (100 + 100))',
          value: enemyDefMult,
          formattedValue: '0.487× (~49%)'
        },
        {
          name: 'Resistência Elemental do Inimigo (RES)',
          description: 'Resistência elemental do monstro após reduções.',
          formula: '1 - 0.10',
          value: enemyResMult,
          formattedValue: '0.90× (10% RES)'
        }
      ]
    };
  }

  // 4. Default: Traditional Direct Damage (E, D, C, PewPew, Cryo Beam)
  const totalDmgBonus = 1 + dmgBonus;
  return {
    hitName: hit.displayName || hit.label,
    charName: hit.charName,
    category: 'direct',
    categoryLabel: 'Dano Direto Tradicional',
    reactionType: 'Dano Elemental Puro (Sem Reação)',
    finalDamage: hitDamage,
    formulaString: 'Dano = Talento% × ATK × (1 + BônusDano) × Crítico × DEF × RES',
    explanation: 'Dano elemental direto tradicional. Escalonado diretamente pelo ATK e multiplicador de talento, amplificado pelo cálice e bônus de conjunto, com mitigação pelas fórmulas de armadura (DEF) e resistência (RES) do monstro.',
    statsUsed: {
      atk,
      cr: Math.round(cr * 100),
      cd: Math.round(cd * 100),
      em,
      dmgBonus: Math.round(dmgBonus * 100),
      enemyRes: 0.90,
      enemyDef: 0.487
    },
    steps: [
      {
        name: 'ATK de Combate Buffado',
        description: 'Ataque do personagem em combate.',
        formula: 'ATK Final',
        value: atk,
        formattedValue: `${atk.toLocaleString('pt-BR')}`
      },
      {
        name: 'Bônus de Dano Elemental (Bdmg)',
        description: 'Bônus do cálice elemental, conjunto de artefatos e armas.',
        formula: `1 + ${(dmgBonus * 100).toFixed(1)}%`,
        value: totalDmgBonus,
        formattedValue: `${totalDmgBonus.toFixed(2)}×`
      },
      {
        name: 'Multiplicador Crítico (Crítico Médio / Máximo)',
        description: 'Multiplicador de dano crítico do personagem.',
        formula: `1 + ${(cd * 100).toFixed(0)}% CD`,
        value: critMult,
        formattedValue: `${critMult.toFixed(2)}×`
      },
      {
        name: 'Redução de Defesa do Inimigo (DEF Nv 100)',
        description: 'Mitigação da armadura de chefe de nível 100 no Abismo.',
        formula: '190 / 390',
        value: enemyDefMult,
        formattedValue: '0.487×'
      },
      {
        name: 'Resistência Elemental do Inimigo (RES)',
        description: 'Resistência elemental padrão.',
        formula: '1 - 0.10',
        value: enemyResMult,
        formattedValue: '0.90× (10% RES)'
      }
    ]
  };
}
