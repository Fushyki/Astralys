import * as XLSX from 'xlsx';
import { DamageAnalysisResult, DamageHit, CharacterStatSnapshot } from '../types/damageBreakdown';
import { getCharacterERData } from '../data/characters';

// Categorize hit abbreviations
function categorizeHit(label: string): DamageHit['category'] {
  const upper = label.toUpperCase();
  if (upper.startsWith('Q') || upper.includes('BURST') || upper.includes('BOMBARD')) {
    return 'burst';
  }
  if (upper.startsWith('E') || upper.includes('SKILL') || upper.includes('PEW') || upper.includes('BEAM')) {
    return 'skill';
  }
  if (upper.startsWith('C') || upper.includes('CHARG') || upper.includes('CM')) {
    return 'charged';
  }
  if (upper.startsWith('N') || upper.includes('NORM') || upper.includes('PLUNG')) {
    return 'normal';
  }
  return 'other';
}

// Generate friendly Portuguese label for cryptic abbreviations
function formatHitName(label: string): string {
  const map: Record<string, string> = {
    QM: 'QM (Burst com Fusão / Vaporizar)',
    FM: 'FM (Golpe Finalizador com Fusão)',
    CM: 'CM (Ataque Carregado com Fusão)',
    E: 'E (Habilidade Elemental)',
    C: 'C (Ataque Carregado / Normal)',
    D: 'D (Arrancada / Dash Attack)',
    PewPew: 'PewPew (Disparos Automáticos da Sandrone)',
    'Cryo Beam': 'Cryo Beam (Raio Cryo Contínuo)',
    'Stellar Beam': 'Stellar Beam (Raio Estelar Lunar)',
    ECryo: 'ECryo (Explosão Cryo da Skill)',
    EStellar: 'EStellar (Explosão Estelar da Skill)',
    Qbombard: 'Qbombard (Bombardeio da Ultimate)',
    QCryo: 'QCryo (Impacto Cryo da Ultimate)',
    QStellar: 'QStellar (Impacto Estelar da Ultimate)'
  };
  return map[label] || label;
}

// Helper to normalize known weapon names
export function normalizeWeapon(name: string): string {
  if (!name) return 'Arma Padrão';
  const clean = name.trim();
  const lower = clean.toLowerCase();
  if (lower.includes('blazing sun')) return 'A Thousand Blazing Suns';
  if (lower === 'ttds' || lower.includes('thrilling tale')) return 'Thrilling Tales of Dragon Slayers';
  if (lower.includes('engulfin')) return 'Engulfing Lightning';
  if (lower.includes('falç') || lower.includes('falca') || lower.includes('aquila')) return 'Aquila Favonia';
  if (lower.includes('favonius') || lower.includes('fav')) return 'Favonius Lance';
  return clean;
}

// Helper to normalize known artifact names
export function normalizeArtifact(name: string): string {
  if (!name) return 'Artefato Padrão';
  const clean = name.trim();
  const lower = clean.toLowerCase();
  if (lower.includes('obsidian')) return 'Obsidian Codex';
  if (lower.includes('instrut') || lower.includes('instructor')) return 'Instructor';
  if (lower.includes('cinder city') || lower.includes('cinder')) return 'Scroll of the Hero of Cinder City';
  if (lower.includes('nobless')) return 'Noblesse Oblige';
  if (lower.includes('golden troupe') || lower.includes('troupe')) return 'Golden Troupe';
  if (lower.includes('marechaussee') || lower.includes('hunter')) return 'Marechaussee Hunter';
  if (lower.includes('emblem')) return 'Emblem of Severed Fate';
  if (lower.includes('deepwood')) return 'Deepwood Memories';
  if (lower.includes('viridescent') || lower.includes('vv')) return 'Viridescent Venerer';
  return clean;
}

// Helper to parse numbers in Brazilian or US format
export function parseNum(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).trim().replace(/%/g, '');
  if (str === '#REF!' || str === '#VALUE!' || str === '#N/A' || str === '=') return 0;

  // Brazilian/EU format with both dot (thousands) and comma (decimals): e.g. 4.671.077,79 or 5.288,00
  if (str.includes(',') && str.includes('.')) {
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastComma > lastDot) {
      // 1.234.567,89 -> dots are thousands, comma is decimal
      return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    } else {
      // 1,234,567.89 -> commas are thousands, dot is decimal
      return parseFloat(str.replace(/,/g, '')) || 0;
    }
  }

  // If only comma: e.g. 0,89 or 3204,03 or 17,5
  if (str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }

  // If dot is used as thousands separator in integers (e.g. 266.919 or 4.671.077)
  if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    return parseFloat(str.replace(/\./g, '')) || 0;
  }

  return parseFloat(str.replace(/,/g, '')) || 0;
}

const KNOWN_CHARS = [
  'Mavuika', 'Citlali', 'Iansan', 'Bennett', 'Sandrone', 'Navia', 'Flins', 'Skirk',
  'Kinich', 'Mualani', 'Columbina', 'Xilonen', 'Chasca', 'Ororon', 'Furina', 'Yelan',
  'Kazuha', 'Zhongli', 'Xiangling', 'Xingqiu', 'Raiden', 'Nahida', 'Alhaitham', 'Arlecchino',
  'Clorinde', 'Neuvillette', 'Wriothesley', 'Lyney', 'Baizhu', 'Scaramouche', 'Wanderer',
  'Tighnari', 'Cyno', 'Nilou', 'Ayaka', 'Ayato', 'Yae', 'Shenhe', 'Itto', 'Kokomi',
  'Yoimiya', 'Eula', 'Hu Tao', 'Xiao', 'Ganyu', 'Klee', 'Venti', 'Diluc', 'Jean',
  'Keqing', 'Mona', 'Qiqi', 'Chevreuse', 'Gaming', 'Sigewinne', 'Emilie',
  'Sethos', 'Freminet', 'Lynette', 'Charlotte', 'Faruzan', 'Layla', 'Dori', 'Collei',
  'Kuki Shinobu', 'Heizou', 'Yunjin', 'Gorou', 'Thoma', 'Sara', 'Sayu', 'Rosaria',
  'Yanfei', 'Xinyan', 'Diona', 'Sucrose', 'Chongyun', 'Noelle', 'Beidou', 'Ningguang',
  'Fischl', 'Razor', 'Barbara', 'Lisa', 'Kaeya', 'Amber'
];

function isKnownChar(name: string): boolean {
  if (!name) return false;
  const clean = name.trim().toLowerCase();
  return KNOWN_CHARS.some(k => k.toLowerCase() === clean);
}

/**
 * Parses raw text copied and pasted from Excel, Google Sheets, or TSV/CSV.
 */
export function parseDamageText(rawText: string): DamageAnalysisResult | null {
  if (!rawText || rawText.trim().length === 0) return null;

  // Split lines preserving empty initial cells for column alignments
  const rawLines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
  const lines = rawLines.map(line => {
    if (line.includes('\t')) return line.split('\t').map(c => c.trim());
    if (line.includes(';') && !line.includes('\t')) return line.split(';').map(c => c.trim());
    return line.split(/\s{2,}/).map(c => c.trim());
  });

  if (lines.length === 0) return null;

  // 1. Check for Summary Table (Character | Damage | Percentage | Weapon | Artefact Set)
  interface SummaryCharEntry {
    name: string;
    damage: number;
    percentage: number;
    weapon: string;
    artifact: string;
  }
  const summaryChars: SummaryCharEntry[] = [];

  for (let r = 0; r < lines.length; r++) {
    const row = lines[r];
    const joined = row.join(' ').toLowerCase();
    if ((joined.includes('character') || joined.includes('personagem')) && 
        (joined.includes('weapon') || joined.includes('artefact') || joined.includes('arma') || joined.includes('artefato') || joined.includes('damage') || joined.includes('percentage'))) {
      for (let subR = r + 1; subR < Math.min(lines.length, r + 7); subR++) {
        const subRow = lines[subR].filter(c => c.length > 0);
        if (subRow.length >= 2) {
          const cName = subRow[0];
          if (isKnownChar(cName)) {
            summaryChars.push({
              name: cName,
              damage: parseNum(subRow[1]),
              percentage: parseNum(subRow[2]),
              weapon: normalizeWeapon(subRow[3] || ''),
              artifact: normalizeArtifact(subRow[4] || '')
            });
          }
        }
      }
      if (summaryChars.length >= 2) break;
    }
  }

  // 2. Identify Character Names from Horizontal Header
  let charRowIdx = -1;
  let charColOffset = 0;
  let detectedChars: string[] = [];

  for (let r = 0; r < Math.min(15, lines.length); r++) {
    const row = lines[r];
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (isKnownChar(cell)) {
        const slice: string[] = [];
        let currCol = c;
        while (currCol < row.length && slice.length < 4) {
          if (row[currCol]) {
            slice.push(row[currCol]);
          }
          currCol++;
        }
        // At least 2 must be known characters in the same row
        const knownCount = slice.filter(name => isKnownChar(name)).length;
        if (knownCount >= 2) {
          detectedChars = slice;
          charRowIdx = r;
          charColOffset = c;
          break;
        }
      }
    }
    if (detectedChars.length >= 2) break;
  }

  // Fallback to summary table if no horizontal header was found
  if (detectedChars.length === 0 && summaryChars.length > 0) {
    detectedChars = summaryChars.map(s => s.name);
  }

  // Fallback to first row
  if (detectedChars.length === 0) {
    detectedChars = lines[0].filter(c => c.length > 0).slice(0, 4);
    charRowIdx = 0;
    charColOffset = 0;
  }

  const numChars = Math.min(4, detectedChars.length);
  const characterNames = detectedChars.slice(0, numChars);

  // 3. Identify Weapons & Artifacts
  let weapons: string[] = [];
  let artifacts: string[] = [];

  if (charRowIdx >= 0 && lines[charRowIdx + 1]) {
    weapons = lines[charRowIdx + 1].slice(charColOffset, charColOffset + numChars).map(normalizeWeapon);
  }
  if (charRowIdx >= 0 && lines[charRowIdx + 2]) {
    artifacts = lines[charRowIdx + 2].slice(charColOffset, charColOffset + numChars).map(normalizeArtifact);
  }

  // Fill or override from summary table
  summaryChars.forEach((sc) => {
    const cIdx = characterNames.findIndex(n => n.toLowerCase() === sc.name.toLowerCase());
    if (cIdx >= 0) {
      if (sc.weapon && sc.weapon !== 'Arma Padrão') weapons[cIdx] = sc.weapon;
      if (sc.artifact && sc.artifact !== 'Artefato Padrão') artifacts[cIdx] = sc.artifact;
    }
  });

  while (weapons.length < numChars) weapons.push('Arma Padrão');
  while (artifacts.length < numChars) artifacts.push('Artefato Padrão');

  // 4. Scan for Substat Rolls Block
  const rollsByChar: Record<string, CharacterStatSnapshot['rolls']> = {};
  for (let r = 0; r < lines.length; r++) {
    const row = lines[r];
    const joined = row.join(' ').toLowerCase();
    if (joined.includes('taxa crítica') || joined.includes('dano crítico') || joined.includes('recarga (er)')) {
      const charName = row.find(c => isKnownChar(c));
      const nextRow = lines[r + 1]?.filter(c => c.length > 0) || [];
      if (charName && nextRow.length >= 7) {
        rollsByChar[charName.toLowerCase()] = {
          cr: parseNum(nextRow[0]),
          cd: parseNum(nextRow[1]),
          em: parseNum(nextRow[2]),
          atkPct: parseNum(nextRow[3]),
          hpPct: parseNum(nextRow[4]),
          defPct: parseNum(nextRow[5]),
          er: parseNum(nextRow[6]),
          totalRolls: parseNum(nextRow[nextRow.length - 1])
        };
      }
    }
  }

  // 5. Scan all rows for Stats, Hits, DPR, DPS, Combo
  const statsMap: Record<string, number[]> = {};
  const hits: DamageHit[] = [];
  let explicitDamage: number[] = [];

  if (summaryChars.length > 0) {
    summaryChars.forEach(sc => {
      const cIdx = characterNames.findIndex(n => n.toLowerCase() === sc.name.toLowerCase());
      if (cIdx >= 0 && sc.damage > 0) {
        explicitDamage[cIdx] = sc.damage;
      }
    });
  }

  let dpr = 0;
  let dps = 0;
  let rotationDuration = 0;
  let comboNotation = '';

  for (let r = 0; r < lines.length; r++) {
    const row = lines[r];
    if (row.length === 0) continue;

    const nonEmpties = row.filter(c => c.length > 0);
    if (nonEmpties.length === 0) continue;

    const rowText = row.join('\t');
    const firstCell = nonEmpties[0] || '';
    const secondCell = nonEmpties[1] || '';
    const lowerFirst = firstCell.toLowerCase();

    // Check for Combo notation
    if (firstCell.includes('Combo') || secondCell.includes('Combo') || (lowerFirst.startsWith('q ') && lowerFirst.includes('c'))) {
      if (!comboNotation || firstCell.length > comboNotation.length) {
        comboNotation = firstCell.includes('Combo') ? firstCell : row.join(' ').trim();
      }
      continue;
    }

    // Check for DPS(seconds) format e.g. DPS(17,5) -> 266.919
    const dpsSecMatch = rowText.match(/dps\s*\(([0-9]+[.,]?[0-9]*)\s*s?\)/i);
    if (dpsSecMatch) {
      rotationDuration = parseNum(dpsSecMatch[1]);
      const matchIdx = nonEmpties.findIndex(c => /dps\s*\(/i.test(c));
      if (matchIdx >= 0 && nonEmpties[matchIdx + 1]) {
        const val = parseNum(nonEmpties[matchIdx + 1]);
        if (val > 0) dps = val;
      }
      continue;
    }

    // Check for DPR / DMGTotal / Total Damage
    if (lowerFirst === 'dpr' || lowerFirst === 'dmgtotal' || lowerFirst.includes('total damage')) {
      const val = parseNum(secondCell);
      if (val > 0) dpr = val;
      continue;
    }

    // Check for simple DPS
    if (lowerFirst === 'dps') {
      const val = parseNum(secondCell);
      if (val > 0) dps = val;
      continue;
    }

    // If we have horizontal columns, check stats and hits
    if (charRowIdx >= 0) {
      // Check for stats rows: Hp, HpT, Atk, AtkT, Em, Emm, Cr, Cd, Cm, Bdmg, Def, DefT
      // Distinguish Cm (crit multiplier stat < 100) vs CM (Charged Attack Melt hit > 1000)
      const isCmStat = lowerFirst === 'cm' && (parseNum(row[charColOffset]) < 100);
      if (['atkt', 'atk', 'cr', 'cd', 'em', 'emm', 'bdmg', 'hpt', 'hp', 'deft', 'def'].includes(lowerFirst) || isCmStat) {
        const vals: number[] = [];
        for (let i = 0; i < numChars; i++) {
          let candidate = parseNum(row[charColOffset + i]);
          if (candidate === 0 && row[charColOffset + i] !== '0') {
            candidate = parseNum(row[charColOffset + i + 1]);
          }
          vals.push(candidate);
        }
        statsMap[lowerFirst] = vals;
        continue;
      }

      // Check for explicit character damage row (DMG)
      if (lowerFirst === 'dmg' || lowerFirst === 'damage') {
        const vals: number[] = [];
        for (let i = 0; i < numChars; i++) {
          const candidate = parseNum(row[charColOffset + i]) || parseNum(row[charColOffset + i + 1]);
          vals.push(candidate);
        }
        if (vals.some(v => v > 0) && explicitDamage.length === 0) {
          explicitDamage = vals;
        }
        continue;
      }

      // Check for Hit Actions (e.g. E, CM, QM, D, C, FM, etc.)
      const possibleLabel = row[charColOffset - 1] || row[0] || '';
      const validLabels = ['e', 'qm', 'fm', 'cm', 'd', 'c', 'n1', 'n2', 'n3', 'n4', 'n5', 'pewpew', 'cryo beam', 'stellar beam', 'ecryo', 'estellar', 'qbombard', 'qcryo', 'qstellar'];
      if (validLabels.includes(possibleLabel.toLowerCase())) {
        for (let i = 0; i < numChars; i++) {
          const dmg = parseNum(row[charColOffset + i]);
          if (dmg > 500) {
            hits.push({
              id: `hit-${r}-${i}-${Math.random().toString(36).substring(2, 6)}`,
              label: possibleLabel,
              displayName: formatHitName(possibleLabel),
              charName: characterNames[i] || `Personagem ${i + 1}`,
              charIndex: i,
              damage: Math.round(dmg),
              pctOfTotal: 0,
              category: categorizeHit(possibleLabel)
            });
          }
        }
      }
    }
  }

  // 6. Calculate or reconstruct DPR and DPS
  let finalDpr = dpr;
  if (!finalDpr || finalDpr <= 0) {
    if (explicitDamage.length > 0 && explicitDamage.some(d => d > 0)) {
      finalDpr = explicitDamage.reduce((a, b) => a + b, 0);
    } else if (hits.length > 0) {
      finalDpr = hits.reduce((a, h) => a + h.damage, 0);
    }
  }

  if (dps <= 0 && rotationDuration > 0 && finalDpr > 0) {
    dps = Math.round(finalDpr / rotationDuration);
  } else if (dps > 0 && rotationDuration <= 0 && finalDpr > 0) {
    rotationDuration = parseFloat((finalDpr / dps).toFixed(1));
  } else if (rotationDuration <= 0) {
    rotationDuration = 20;
    if (dps <= 0 && finalDpr > 0) dps = Math.round(finalDpr / 20);
  }

  // 7. Calculate damage shares per character
  const charDamages: number[] = [];
  for (let i = 0; i < numChars; i++) {
    if (explicitDamage[i] && explicitDamage[i] > 0) {
      charDamages.push(explicitDamage[i]);
    } else {
      const sumHits = hits.filter(h => h.charIndex === i).reduce((a, h) => a + h.damage, 0);
      charDamages.push(sumHits);
    }
  }

  // 8. Update percentage on hits
  hits.forEach(h => {
    h.pctOfTotal = finalDpr > 0 ? parseFloat(((h.damage / finalDpr) * 100).toFixed(2)) : 0;
  });

  // Sort hits by highest damage first
  hits.sort((a, b) => b.damage - a.damage);

  // 9. Build Character Snapshots
  const characters: CharacterStatSnapshot[] = characterNames.map((name, idx) => {
    const charData = getCharacterERData(name);
    const dmg = charDamages[idx] || 0;
    const pct = finalDpr > 0 ? parseFloat(((dmg / finalDpr) * 100).toFixed(2)) : 0;

    const atkVal = statsMap['atkt']?.[idx] || statsMap['atk']?.[idx];
    const crVal = statsMap['cr']?.[idx];
    const cdVal = statsMap['cd']?.[idx];
    const emVal = statsMap['em']?.[idx];
    const bdmgVal = statsMap['bdmg']?.[idx];

    return {
      name,
      element: charData.element,
      weapon: weapons[idx] || 'Arma Padrão',
      artifactSet: artifacts[idx] || 'Artefato Padrão',
      totalDamage: Math.round(dmg),
      damagePercentage: pct,
      totalAtk: atkVal ? Math.round(atkVal) : undefined,
      critRate: crVal ? parseFloat((crVal <= 1.0 ? crVal * 100 : crVal).toFixed(1)) : undefined,
      critDmg: cdVal ? parseFloat((cdVal <= 4.0 ? cdVal * 100 : cdVal).toFixed(1)) : undefined,
      elementalMastery: emVal ? Math.round(emVal) : undefined,
      dmgBonus: bdmgVal ? parseFloat(((bdmgVal > 1.0 ? bdmgVal - 1 : bdmgVal) * 100).toFixed(1)) : undefined,
      rolls: rollsByChar[name.toLowerCase()]
    };
  });

  return {
    title: `${characterNames[0] || 'Carry'} - Análise de Dano`,
    characters,
    hits,
    totalDpr: Math.round(finalDpr),
    dps: Math.round(dps),
    rotationDuration: rotationDuration || 20,
    comboNotation: comboNotation || 'Rotação Padrão'
  };
}

/**
 * Parses all sheets and comparison columns from an uploaded Excel workbook.
 */
export function parseDamageWorkbook(workbook: XLSX.WorkBook): Record<string, DamageAnalysisResult[]> {
  const result: Record<string, DamageAnalysisResult[]> = {};

  workbook.SheetNames.forEach(sheetName => {
    if (['Inicio', 'Plan Base', 'Planilha1'].includes(sheetName)) return;

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (!rows || rows.length < 5) return;

    // Scan row 0 to find all starting columns for team comparisons
    const variants: DamageAnalysisResult[] = [];
    const firstRow = rows[0] || [];

    for (let c = 0; c < firstRow.length; c++) {
      const cell = String(firstRow[c] || '').trim();
      if (isKnownChar(cell)) {
        const groupLines: string[] = [];
        for (let r = 0; r < Math.min(120, rows.length); r++) {
          const row = rows[r];
          if (!row) continue;
          const label = String(row[c > 0 ? c - 1 : 0] || row[0] || '').trim();
          const colVals = [row[c], row[c + 1], row[c + 2], row[c + 3]]
            .map(v => (v !== undefined && v !== null ? String(v) : ''))
            .join('\t');
          groupLines.push(`${label}\t${colVals}`);
        }

        const parsed = parseDamageText(groupLines.join('\n'));
        if (parsed && parsed.characters.length >= 3 && parsed.totalDpr > 10000) {
          parsed.sheetName = sheetName;
          parsed.variantLabel = `${parsed.characters[0]?.name} • ${parsed.characters[0]?.weapon}`;
          variants.push(parsed);
          c += 3; // Skip past this 4-character group
        }
      }
    }

    if (variants.length > 0) {
      result[sheetName] = variants;
    }
  });

  return result;
}
