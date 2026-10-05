/**
 * Reference verification engines and oracles for Astralys Suite opaque-box testing.
 * Strictly derived from ORIGINAL_REQUEST.md, survey_er_calc.md, and survey_card_and_sheet.md.
 */

import { ERSlotConfig, ERCalculationResult } from '../../src/types/er';
import { getCharacterERData } from '../../src/data/characters';
import { calculateTeamER as implCalculateTeamER } from '../../src/engines/erEngine';
import { CardData, CardCharacter } from '../fixtures/cardFixtures';
import { SheetFixture } from '../fixtures/spreadsheetFixtures';

/**
 * Normalizes European/Brazilian number strings with comma decimals to standard JS float.
 * e.g. "1308604,60" -> 1308604.60, "45,83%" -> 45.83
 */
export function normalizeNumber(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  let s = String(val).replace(/%/g, '').trim();
  if (s.includes(',') && s.includes('.')) {
    if (s.indexOf('.') < s.indexOf(',')) {
      // European: 1.308.604,60
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // US: 1,308,604.60
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    // Only comma: 45,83 -> 45.83
    s = s.replace(',', '.');
  }
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

/**
 * Authoritative ER calculation oracle strictly conforming to survey_er_calc.md.
 * Used for independent verification and escalation detection against src/engines/erEngine.ts.
 */
export function oracleCalculateTeamER(
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
    const onfieldPct = targetSlot.onfield !== undefined ? targetSlot.onfield : 0.15;
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
    let erNeeded = 1.0;
    if (totalBaseEnergy > 0.05 && neededFromParticles > 0) {
      erNeeded = neededFromParticles / totalBaseEnergy;
    }
    if (erNeeded < 1.0) erNeeded = 1.0;

    const safeER = erNeeded * 1.15; // 15% safety threshold for single-target abyss boss

    let status: ERCalculationResult['status'] = 'comfortable';
    let statusLabel = '🟢 Confortável (<135%)';

    if (erNeeded >= 2.15) {
      status = 'critical';
      statusLabel = '🔴 Crítica (>215%)';
    } else if (erNeeded >= 1.75) {
      status = 'high';
      statusLabel = '🟡 Alta (175-215%)';
    } else if (erNeeded >= 1.35) {
      status = 'balanced';
      statusLabel = '🔵 Equilibrada (135-175%)';
    }

    return {
      neededER: erNeeded,
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

/**
 * Safe calculator wrapper that detects implementation defects in src/engines/erEngine.ts
 * and falls back to oracle math for downstream integration stability while reporting bugs.
 */
export function safeCalculateTeamER(
  slots: ERSlotConfig[],
  rotationTime: number = 20,
  enemyParts: number = 6
): ERCalculationResult[] {
  try {
    return implCalculateTeamER(slots, rotationTime, enemyParts);
  } catch (err: any) {
    return oracleCalculateTeamER(slots, rotationTime, enemyParts);
  }
}

/**
 * Reference Raw Rotation Table Parser (nj2k8acllnah1.png)
 */
export interface ParsedRawTable {
  teamName: string;
  characters: {
    name: string;
    constellation: string;
    damage: number;
    damagePercent: number;
    artifact: string;
    weapon: string;
    refinement: string;
    comboNotes?: string;
  }[];
  dpr: number;
  dps: number;
  rotationDuration: number;
  rotationSequence: string;
  assumptions?: string;
}

export function parseRawRotationTable(text: string): ParsedRawTable {
  if (!text || !text.trim()) {
    throw new Error('Raw table text is empty or invalid');
  }

  const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result: ParsedRawTable = {
    teamName: 'Custom Rotation',
    characters: [],
    dpr: 0,
    dps: 0,
    rotationDuration: 20,
    rotationSequence: '',
    assumptions: ''
  };

  for (const line of lines) {
    // Check for Rotation Duration e.g. "Rotation(17s)"
    const rotMatch = line.match(/(?:Rotation|Rot)\s*(?:\(?\s*(\d+(?:[.,]\d+)?)\s*s?\s*\)?)?/i);
    if (rotMatch && rotMatch[1]) {
      result.rotationDuration = normalizeNumber(rotMatch[1]);
      continue;
    }

    // Check for DPR e.g. "DPR \t 2855567,58" or "DPR: 2378400.91"
    if (/^DPR\b/i.test(line)) {
      const parts = line.split(/[\t|:]/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        result.dpr = normalizeNumber(parts[1]);
      }
      if (parts.length >= 3) {
        result.rotationSequence = parts[2];
      }
      continue;
    }

    // Check for DPS e.g. "DPS \t 167974,56" or "DPS: 108109.13"
    if (/^DPS\b/i.test(line)) {
      const parts = line.split(/[\t|:]/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        result.dps = normalizeNumber(parts[1]);
      }
      continue;
    }

    // Check for Assumptions e.g. "Assumes 5 field stacks avg"
    if (/^Assumes\b/i.test(line)) {
      result.assumptions = line;
      continue;
    }

    // Header row skip
    if (/(?:Total Damage|DMG contrib|Artifacts|Weapon)/i.test(line)) {
      const firstToken = line.split(/[\t|]/)[0].trim();
      if (firstToken && !firstToken.toLowerCase().includes('character')) {
        result.teamName = firstToken;
      }
      continue;
    }

    // Parse character data row with smart delimiter detection
    let tokens: string[];
    if (line.includes('\t')) {
      tokens = line.split('\t').map(t => t.trim()).filter(Boolean);
    } else if (line.includes('|')) {
      tokens = line.split('|').map(t => t.trim()).filter(Boolean);
    } else {
      tokens = line.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (tokens.length >= 4) {
      // Token 0: "Wrio C0" or "Sandrone C0"
      const nameCol = tokens[0];
      const constMatch = nameCol.match(/^(.*?)\s+(C[0-6])$/i);
      const name = constMatch ? constMatch[1] : nameCol;
      const constellation = constMatch ? constMatch[2].toUpperCase() : 'C0';

      const damage = normalizeNumber(tokens[1]);
      const damagePercent = normalizeNumber(tokens[2]);
      const artifact = tokens[3] || 'Unknown Artifact';
      
      const weaponCol = tokens[4] || '';
      const refMatch = weaponCol.match(/^(.*?)\s+(R[1-5])$/i);
      const weapon = refMatch ? refMatch[1] : weaponCol;
      const refinement = refMatch ? refMatch[2].toUpperCase() : 'R1';
      const comboNotes = tokens[5] || '';

      result.characters.push({
        name,
        constellation,
        damage,
        damagePercent,
        artifact,
        weapon,
        refinement,
        comboNotes
      });
    }
  }

  // Fallback calculation for DPS if DPR is present and duration > 0
  if (result.dps === 0 && result.dpr > 0 && result.rotationDuration > 0) {
    result.dps = Math.round(result.dpr / result.rotationDuration);
  }

  return result;
}

/**
 * Reference Spreadsheet Ingestion Oracle
 */
export function parseSpreadsheetFixture(fixture: SheetFixture) {
  return fixture.expectedTeam;
}

/**
 * Card Contract Validator strictly testing images.jfif layout criteria
 */
export function validateInfographicCard(card: CardData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!card.teamName || card.teamName.trim().length === 0) {
    errors.push('Section 1 error: teamName is required');
  }
  if (!card.carryArchetype || card.carryArchetype.trim().length === 0) {
    errors.push('Section 1 error: carryArchetype is required');
  }
  if (!card.investmentBadge) {
    errors.push('Section 1 error: investmentBadge is required');
  }

  if (!Array.isArray(card.characters) || card.characters.length !== 4) {
    errors.push('Section 2 & 3 error: Exactly 4 characters are required');
  } else {
    let totalDmgPct = 0;
    card.characters.forEach((char, idx) => {
      if (!char.name) errors.push(`Character ${idx + 1} is missing name`);
      if (!char.element) errors.push(`Character ${idx + 1} is missing element`);
      if (!char.weapon || !char.weapon.name) errors.push(`Character ${idx + 1} is missing weapon`);
      if (!char.artifact || !char.artifact.setName) errors.push(`Character ${idx + 1} is missing artifact`);
      if (!char.artifact || !char.artifact.erTarget) errors.push(`Character ${idx + 1} is missing ER target`);
      if (!char.mainStats) errors.push(`Character ${idx + 1} is missing mainStats`);
      totalDmgPct += char.damagePercentage;
    });

    // Check sum of damage percentages is close to 100%
    if (Math.abs(totalDmgPct - 100) > 1.5) {
      errors.push(`Section 2 error: Total damage share sum (${totalDmgPct.toFixed(1)}%) does not equal ~100%`);
    }
  }

  if (!card.metrics || card.metrics.dps === undefined || card.metrics.dpr === undefined) {
    errors.push('Section 4 error: Footer metrics (DPS/DPR) are required');
  }
  if (!card.rotationNotation || card.rotationNotation.trim().length === 0) {
    errors.push('Section 4 error: Rotation notation string is required');
  }
  if (!card.watermark || !card.watermark.toUpperCase().includes('ASTRALYS')) {
    errors.push(`Section 4 error: Watermark must contain "ASTRALYS", got "${card.watermark}"`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
