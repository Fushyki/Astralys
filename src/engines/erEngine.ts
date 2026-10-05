import { ERSlotConfig, ERCalculationResult } from '../types/er';
import { getCharacterERData } from '../data/characters';

export function calculateTeamER(
  slots: ERSlotConfig[],
  rotationTime: number = 20,
  enemyParts: number = 6
): ERCalculationResult[] {
  const raidenInTeam = slots.some(s => s.name.toLowerCase() === "raiden");

  return slots.map((targetSlot, targetIdx) => {
    const targetChar = getCharacterERData(targetSlot.name);
    let baseFromSkills = 0;
    let baseFromFav = 0;

    // 1. Skill Particles with Funneling
    slots.forEach((genSlot, genIdx) => {
      const genChar = getCharacterERData(genSlot.name);
      const partsPerUse = (genSlot.custom_part !== undefined) ? genSlot.custom_part : genChar.particles;
      const totalParticles = (genSlot.e_uses || 0) * partsPerUse;

      let onFieldFraction = 0; // 0 = off-field, 1 = on-field

      if (genSlot.funnel === "Ele mesmo (Em campo)" && genIdx === targetIdx) {
        onFieldFraction = 1;
      } else if (genSlot.funnel === `Passar p/ Slot ${targetIdx + 1}`) {
        onFieldFraction = 1;
      } else if (genSlot.funnel === "Dividir (50% Slot 3 / 50% Slot 4)") {
        if (targetIdx === 2 || targetIdx === 3) {
          onFieldFraction = 0.5;
        }
      } else if (genSlot.funnel === "Dividir (50% Slot 1 / 50% Slot 2)") {
        if (targetIdx === 0 || targetIdx === 1) {
          onFieldFraction = 0.5;
        }
      }

      const sameElem = (genChar.element === targetChar.element);
      const multOn = sameElem ? 3.0 : 1.0;
      const multOff = sameElem ? 1.8 : 0.6;
      const mult = (onFieldFraction * multOn) + ((1 - onFieldFraction) * multOff);

      baseFromSkills += (totalParticles * mult);
    });

    // 2. Favonius Weapon Procs (3 Clear particles per proc)
    slots.forEach((favSlot, genIdx) => {
      const procs = favSlot.fav || 0;
      if (procs > 0) {
        let isOnField = false;
        if (favSlot.fav_target === "Ele mesmo (Em campo)" && genIdx === targetIdx) {
          isOnField = true;
        } else if (favSlot.fav_target === `Passar p/ Slot ${targetIdx + 1}`) {
          isOnField = true;
        }
        const mult = isOnField ? 2.0 : 1.2;
        baseFromFav += (procs * 3 * mult);
      }
    });

    // 3. Enemy HP Particles (Clear particles)
    const onfieldPct = targetSlot.onfield || 0.15;
    const baseFromEnemies = enemyParts * (onfieldPct * 2.0 + (1 - onfieldPct) * 1.2);

    // 4. Flat Energy (Direct Energy Generation)
    let flatEnergy = targetSlot.flat || 0;
    if (raidenInTeam && targetSlot.name.toLowerCase() !== "raiden") {
      flatEnergy += 24;
    }

    const totalBaseEnergy = baseFromSkills + baseFromFav + baseFromEnemies;

    // Burst not used or 0-cost (e.g. Mavuika, Skirk)
    if (targetSlot.use_burst === false || targetChar.burst_cost === 0) {
      return {
        neededER: 1.0,
        safeER: 1.0,
        status: 'ignored',
        statusLabel: '⚪ Não usa Ult (Ignorar ER)',
        baseFromSkills,
        baseFromFav,
        baseFromEnemies,
        flatEnergy,
        totalBaseEnergy
      };
    }

    const neededFromParticles = Math.max(0, targetChar.burst_cost - flatEnergy);
    let neededER = 1.0;
    if (totalBaseEnergy > 0.05 && neededFromParticles > 0) {
      neededER = neededFromParticles / totalBaseEnergy;
    }
    if (neededER < 1.0) neededER = 1.0;

    const safeER = neededER * 1.15; // 15% safety threshold for single-target abyss boss

    let status: ERCalculationResult['status'] = 'comfortable';
    let statusLabel = '🟢 Confortável (<135%)';

    if (neededER >= 2.15) {
      status = 'critical';
      statusLabel = '🔴 Crítica (>215%)';
    } else if (neededER >= 1.75) {
      status = 'high';
      statusLabel = '🟡 Alta (175-215%)';
    } else if (neededER >= 1.35) {
      status = 'balanced';
      statusLabel = '🔵 Equilibrada (135-175%)';
    }

    return {
      neededER,
      safeER,
      status,
      statusLabel,
      baseFromSkills,
      baseFromFav,
      baseFromEnemies,
      flatEnergy,
      totalBaseEnergy
    };
  });
}
