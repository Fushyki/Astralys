import { InfographicCardData, InfographicCharacter } from '../types/infographic';
import { getCharacterERData, CHARACTERS_DATABASE } from '../data/characters';
import { ElementType } from '../types/er';

/**
 * Robust number parser handling Brazilian (1.234.567,89 / 94,64) and US (1,234,567.89 / 94.64%) formats.
 */
export function parseFlexibleNumber(raw: string | undefined): number {
  if (!raw) return 0;
  let clean = raw.trim().replace(/[%$R]/g, '').trim();
  if (!clean) return 0;

  const lastDot = clean.lastIndexOf('.');
  const lastComma = clean.lastIndexOf(',');

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      // Brazilian format: 4.157.702,28 -> 4157702.28
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 4,157,702.28 -> 4157702.28
      clean = clean.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    // Only comma: e.g. "94,64" or "4393129,41" or "17,5"
    clean = clean.replace(',', '.');
  } else if (lastDot !== -1) {
    // Only dot: e.g. "251.036" (could be 251036 in BR or 251.036 in US)
    // If followed by exactly 3 digits at the end and no other decimal, typically thousand in BR
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parseFloat(parts[0]) > 0 && parseFloat(parts[0]) < 1000) {
      clean = parts[0] + parts[1];
    }
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Normalizes common community / PT-BR shorthand names for weapons and artifact sets.
 */
function normalizeWeaponName(raw: string): { name: string; refinement: string } {
  const refineMatch = raw.match(/\b(R[1-5])\b/i);
  const refinement = refineMatch ? refineMatch[1].toUpperCase() : 'R1';
  let clean = raw.replace(/\bR[1-5]\b/i, '').trim();

  const lower = clean.toLowerCase();
  if (lower === 'ttds' || lower.includes('thrilling tales')) {
    return { name: 'TTDS', refinement: refineMatch ? refinement : 'R5' };
  }
  if (lower.includes('engulfin')) {
    return { name: 'Engulfing Lightning', refinement };
  }
  if (lower.includes('falção') || lower.includes('falcao') || lower.includes('aquila')) {
    return { name: 'Aquila Favonia', refinement };
  }
  if (lower.includes('blazing sun')) {
    return { name: 'Blazing Sun', refinement };
  }
  if (lower.includes('widsith')) {
    return { name: 'The Widsith', refinement: refineMatch ? refinement : 'R5' };
  }
  if (lower.includes('favonius') || lower.includes('fav')) {
    return { name: 'Favonius', refinement: refineMatch ? refinement : 'R5' };
  }

  return { name: clean || 'Weapon', refinement };
}

function normalizeArtifactName(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower.includes('obsidian')) return 'Obsidian Codex';
  if (lower.includes('cinder') || lower.includes('scroll')) return 'Hero of Cinder City';
  if (lower.includes('instrut') || lower.includes('instructor')) return 'Instructor';
  if (lower.includes('nobles') || lower.includes('nobless')) return 'Noblesse Oblige';
  if (lower.includes('shadow') || lower.includes('marechaussee')) return 'Marechaussee Hunter';
  if (lower.includes('disenchant')) return 'Disenchant';
  if (lower.includes('tenacity') || lower.includes('tom')) return 'Tenacity of the Millelith';
  if (lower.includes('viridescent') || lower.includes('vv')) return 'Viridescent Venerer';
  return raw.trim() || 'Artifact Set';
}

/**
 * Determines element for any character using full 128-character database.
 */
function resolveElement(name: string): ElementType {
  const norm = name.toLowerCase().replace(/[^a-z]/g, '');
  const found = CHARACTERS_DATABASE.find(c => {
    const cNorm = c.name.toLowerCase().replace(/[^a-z]/g, '');
    return cNorm === norm || (c.aliases && c.aliases.some(a => a.toLowerCase().replace(/[^a-z]/g, '') === norm));
  });
  if (found) return found.element;
  const erData = getCharacterERData(name);
  return erData.element !== 'None' ? erData.element : 'Cryo';
}

/**
 * Intelligent parser for copy-pasted calculation tables, spreadsheets, or raw print text.
 */
export function parseRawTableText(text: string): InfographicCardData {
  const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const characters: InfographicCharacter[] = [];
  let dpr = "4.39M";
  let dps = "251.0k";
  let duration = 17.5;
  let rotationText = "";
  let teamTitle = "";
  let carryArchetype = "";
  let assumptions = "Assumes standard 5-star investment";

  // Column index map (dynamically detected if header row exists)
  let nameColIdx = 0;
  let damageColIdx = 1;
  let pctColIdx = 2;
  let weaponColIdx = 3;
  let artifactColIdx = 4;
  let hasDetectedHeaders = false;

  for (let lineIdx = 0; lineIdx < rawLines.length; lineIdx++) {
    const line = rawLines[lineIdx];
    const lower = line.toLowerCase();

    // 1. Check for DPR Line (e.g. "DPR    4.393.129,41" or "DPR: 4,393,129.41")
    if (lower.startsWith('dpr') || lower.includes('damage per rotation')) {
      const match = line.match(/(?:dpr|damage\s*per\s*rotation)[\s:=|\t]+([0-9.,]+)/i);
      if (match) {
        const num = parseFlexibleNumber(match[1]);
        if (num > 0) {
          dpr = num >= 1000000 ? `${(num / 1000000).toFixed(2)}M` : `${Math.round(num / 1000)}k`;
        }
      }
      continue;
    }

    // 2. Check for DPS Line (e.g. "DPS(17,5)     251.036" or "DPS: 251.036")
    if (lower.startsWith('dps') || lower.includes('damage per second')) {
      // Check for duration inside parentheses: DPS(17,5) or DPS(17.5s)
      const durMatch = line.match(/dps\s*\(\s*([0-9.,]+)s?\s*\)/i);
      if (durMatch) {
        const dNum = parseFlexibleNumber(durMatch[1]);
        if (dNum > 0 && dNum <= 60) duration = dNum;
      }

      // Check for DPS value
      const valMatch = line.match(/(?:dps(?:\([^)]*\))?)[\s:=|\t]+([0-9.,]+)/i);
      if (valMatch) {
        const num = parseFlexibleNumber(valMatch[1]);
        if (num > 0) {
          dps = num >= 1000 ? `${(num / 1000).toFixed(1)}k` : `${Math.round(num)}`;
        }
      }
      continue;
    }

    // 3. Check for Rotation / Combo Line (e.g. "Q CccF cdF cdF cdF Combo" or "Rotation(17s): Nicole E > ...")
    if (lower.startsWith('rotation') || lower.endsWith('combo') || lower.includes('>') || lower.startsWith('q ') || lower.startsWith('e ')) {
      // Extract duration if present: Rotation(17s)
      const rotDurMatch = line.match(/rotation\s*\(\s*([0-9.,]+)s?\s*\)/i);
      if (rotDurMatch) {
        const dNum = parseFlexibleNumber(rotDurMatch[1]);
        if (dNum > 0 && dNum <= 60) duration = dNum;
      }

      const cleanRot = line.replace(/rotation\s*(?:\([^)]*\))?[\s:=|\t]*/i, '').trim();
      if (cleanRot.length > 3) {
        rotationText = cleanRot;
        continue;
      }
    }

    // 4. Check for Assumes Line
    if (lower.startsWith('assumes') || lower.startsWith('premissa')) {
      assumptions = line;
      continue;
    }

    // Split line into columns using tabs, pipes, semicolons, or 2+ consecutive spaces
    const cols = line.split(/\t+|[|;]|\s{2,}/).map(c => c.trim()).filter(Boolean);

    // 5. Check for Table Header Row (e.g. "Character Damage Percentage Weapon Artefact Set")
    const isHeaderRow = cols.some(c => {
      const cl = c.toLowerCase();
      return cl === 'character' || cl === 'personagem' || cl === 'damage' || cl === 'dano' || cl === 'percentage' || cl === 'weapon' || cl === 'artefact set' || cl === 'artifact';
    });

    if (isHeaderRow) {
      hasDetectedHeaders = true;
      cols.forEach((col, idx) => {
        const cl = col.toLowerCase();
        if (cl.includes('char') || cl.includes('nome') || cl.includes('herói')) nameColIdx = idx;
        else if (cl.includes('dam') || cl.includes('dano') || cl.includes('raw')) damageColIdx = idx;
        else if (cl.includes('percent') || cl.includes('%') || cl.includes('contrib') || cl.includes('share')) pctColIdx = idx;
        else if (cl.includes('weap') || cl.includes('arma')) weaponColIdx = idx;
        else if (cl.includes('arte') || cl.includes('artif') || cl.includes('set')) artifactColIdx = idx;
      });
      continue;
    }

    // 6. Check for Team Title before table (e.g. "Mavuika Iansan")
    if (cols.length === 1 && lineIdx < 3 && !rotationText && characters.length === 0) {
      teamTitle = line;
      continue;
    }

    // 7. Check for Character Row
    // A character row typically has at least 2 or 3 columns and first column is not DPR/DPS
    if (cols.length >= 2 && !lower.startsWith('dpr') && !lower.startsWith('dps')) {
      let rawName = cols[nameColIdx] || cols[0];
      let damageRawStr = cols[damageColIdx];
      let pctStr = cols[pctColIdx];
      let weaponRawStr = cols[weaponColIdx];
      let artifactRawStr = cols[artifactColIdx];

      // If columns were not matched by header, auto-detect by column contents
      if (!hasDetectedHeaders) {
        // Find column with largest number as damage
        let foundDmgIdx = -1;
        let foundPctIdx = -1;
        cols.forEach((c, idx) => {
          if (idx === 0) return;
          const num = parseFlexibleNumber(c);
          if (c.includes('%') || (num > 0 && num <= 100 && foundPctIdx === -1)) {
            foundPctIdx = idx;
          } else if (num > 1000) {
            foundDmgIdx = idx;
          }
        });

        if (foundDmgIdx !== -1) damageRawStr = cols[foundDmgIdx];
        if (foundPctIdx !== -1) pctStr = cols[foundPctIdx];
        
        // Weapon and artifact from remaining columns
        const remaining = cols.filter((_, idx) => idx !== 0 && idx !== foundDmgIdx && idx !== foundPctIdx);
        if (remaining.length >= 1) weaponRawStr = remaining[0];
        if (remaining.length >= 2) artifactRawStr = remaining[1];
      }

      // Constellation extraction (e.g. "Mavuika C0" -> name: "Mavuika", const: "C0")
      const constMatch = rawName.match(/\b(C[0-6])\b/i);
      const constellation = constMatch ? constMatch[1].toUpperCase() : 'C0';
      const cleanName = rawName.replace(/\bC[0-6]\b/i, '').trim();

      if (cleanName.length > 0) {
        const damageRaw = parseFlexibleNumber(damageRawStr);
        const pctRaw = parseFlexibleNumber(pctStr);

        const { name: weaponName, refinement } = normalizeWeaponName(weaponRawStr || 'Weapon R1');
        const artifactSetName = normalizeArtifactName(artifactRawStr || 'Artifact Set');
        const element = resolveElement(cleanName);

        characters.push({
          name: cleanName,
          constellation,
          element,
          damagePercentage: pctRaw,
          damageRaw: damageRaw > 0 ? damageRaw : undefined,
          weapon: {
            name: weaponName,
            refinement
          },
          artifact: {
            setName: artifactSetName,
            erTarget: '100 ER'
          },
          mainStats: characters.length === 0 ? 'ATK / Pyro / CD' : 'ER / HP / CR'
        });
      }
    }
  }

  // Normalize percentages (detect if values were 0.0-1.0 or 0-100)
  const anyGreaterThanOne = characters.some(c => c.damagePercentage > 1);
  characters.forEach(c => {
    let p = c.damagePercentage;
    if (!anyGreaterThanOne && p > 0 && p <= 1) {
      p = p * 100;
    }
    // Round to 1 decimal place if has decimals, else integer
    c.damagePercentage = Math.round(p * 10) / 10;
  });

  // Determine Carry Archetype & Team Name
  if (characters.length > 0) {
    // Top damager is carry archetype
    const topDamager = [...characters].sort((a, b) => b.damagePercentage - a.damagePercentage)[0];
    carryArchetype = topDamager.name.toUpperCase();
    if (!teamTitle) {
      teamTitle = `${topDamager.name.toUpperCase()} TEAM`;
    }
  } else {
    carryArchetype = "MAVUIKA";
    teamTitle = "MAVUIKA TEAM";
  }

  // Default rotation notation if not specified
  if (!rotationText) {
    if (characters.length >= 2) {
      rotationText = `(${duration}s) ${characters.map(c => `${c.name} Combo`).join(' > ')}`;
    } else {
      rotationText = `(${duration}s) Standard Rotation Combo`;
    }
  } else if (!rotationText.includes('(')) {
    rotationText = `(${duration}s) ${rotationText}`;
  }

  // Ensure 4 character slots
  while (characters.length < 4) {
    const idx = characters.length;
    characters.push({
      name: `Suporte ${idx + 1}`,
      constellation: 'C0',
      element: idx === 0 ? 'Pyro' : idx === 1 ? 'Cryo' : idx === 2 ? 'Electro' : 'Hydro',
      damagePercentage: idx === 0 ? 50 : 15,
      weapon: { name: 'Favonius', refinement: 'R5' },
      artifact: { setName: 'Noblesse Oblige', erTarget: '100 ER' },
      mainStats: 'ATK / ATK / CR'
    });
  }

  return {
    teamName: teamTitle,
    carryArchetype,
    investmentBadge: "KQM Investment",
    statusTag: "STC (V1 OF BETA)",
    assumptions,
    watermark: "ASTRALYS",
    characters: characters.slice(0, 4),
    metrics: {
      dps,
      dpr,
      rotationDurationSeconds: duration
    },
    rotationNotation: rotationText
  };
}
