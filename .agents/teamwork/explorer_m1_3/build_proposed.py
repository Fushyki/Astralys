with open(r'C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_m1_3\generated_entries.txt', 'r', encoding='utf-8') as f:
    entries = f.read()

template = '''import { CharacterERData, ElementType, WeaponType } from '../types/er';
import { CharacterConfig } from '../types/damage';

/**
 * Astralys - Comprehensive 128-Character Database
 * Ported and verified from Calculadora_Recarga_Genshin.html and version 6.7/7.0 theorycrafting models.
 */

export interface CharacterFallbackBadge {
  initials: string;
  element: ElementType;
  elementColor: string;
  elementGlow: string;
  bgGradient: string;
  borderColor: string;
  isUpcoming: boolean;
}

export const ASTRALYS_ELEMENT_COLORS: Record<ElementType, {
  hex: string;
  tint: string;
  border: string;
  glow: string;
  bgGradient: string;
}> = {
  Cryo: {
    hex: '#77C8D5',
    tint: '#A0E6FF',
    border: '#77C8D5',
    glow: 'rgba(119, 200, 213, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(14, 38, 54, 0.95), rgba(119, 200, 213, 0.25))'
  },
  Electro: {
    hex: '#C280D8',
    tint: '#E0B0FF',
    border: '#C280D8',
    glow: 'rgba(194, 128, 216, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(38, 14, 54, 0.95), rgba(194, 128, 216, 0.25))'
  },
  Pyro: {
    hex: '#FF6B5E',
    tint: '#FFA07A',
    border: '#FF6B5E',
    glow: 'rgba(255, 107, 94, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(54, 18, 14, 0.95), rgba(255, 107, 94, 0.25))'
  },
  Hydro: {
    hex: '#3B82F6',
    tint: '#60A5FA',
    border: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(14, 28, 54, 0.95), rgba(59, 130, 246, 0.25))'
  },
  Anemo: {
    hex: '#52D8A6',
    tint: '#7EF3C9',
    border: '#52D8A6',
    glow: 'rgba(82, 216, 166, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(14, 54, 38, 0.95), rgba(82, 216, 166, 0.25))'
  },
  Geo: {
    hex: '#EAB308',
    tint: '#FDE047',
    border: '#EAB308',
    glow: 'rgba(234, 179, 8, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(54, 46, 14, 0.95), rgba(234, 179, 8, 0.25))'
  },
  Dendro: {
    hex: '#84CC16',
    tint: '#BEF264',
    border: '#84CC16',
    glow: 'rgba(132, 204, 22, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(28, 54, 14, 0.95), rgba(132, 204, 22, 0.25))'
  },
  None: {
    hex: '#94A3B8',
    tint: '#CBD5E1',
    border: '#94A3B8',
    glow: 'rgba(148, 163, 184, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(148, 163, 184, 0.25))'
  }
};

export const CHARACTERS_DATABASE: CharacterERData[] = [
''' + entries + '''
];

/**
 * Normalized aliases lookup table mapping theorycrafting shorthand
 * from spreadsheets and raw calculation tables to canonical names.
 */
const ALIAS_LOOKUP: Record<string, string> = {
  'wrio': 'Wriothesley',
  'duke': 'Wriothesley',
  'yae': 'Yae Miko',
  'guuji yae': 'Yae Miko',
  'childe': 'Tartaglia',
  'ajax': 'Tartaglia',
  'tartaglia': 'Tartaglia',
  'cryo mc': 'Traveler (Cryo)',
  'cryo traveler': 'Traveler (Cryo)',
  'anemo mc': 'Traveler (Anemo)',
  'anemo traveler': 'Traveler (Anemo)',
  'geo mc': 'Traveler (Geo)',
  'geo traveler': 'Traveler (Geo)',
  'electro mc': 'Traveler (Electro)',
  'electro traveler': 'Traveler (Electro)',
  'dendro mc': 'Traveler (Dendro)',
  'dendro traveler': 'Traveler (Dendro)',
  'hydro mc': 'Traveler (Hydro)',
  'hydro traveler': 'Traveler (Hydro)',
  'pyro mc': 'Traveler (Pyro)',
  'pyro traveler': 'Traveler (Pyro)',
  'mizuki': 'Yumemizuki Mizuki',
  'hutao': 'Hu Tao',
  'tao': 'Hu Tao',
  'kuki': 'Kuki Shinobu',
  'shinobu': 'Kuki Shinobu',
  'yunjin': 'Yun Jin',
  'arle': 'Arlecchino',
  'father': 'Arlecchino',
  'benny': 'Bennett',
  'chev': 'Chevreuse',
  'chong': 'Chongyun',
  'haitham': 'Alhaitham',
  'focalors': 'Furina',
  'kusanali': 'Nahida',
  'neuvi': 'Neuvillette',
  'iudex': 'Neuvillette',
  'morax': 'Zhongli',
  'geo daddy': 'Zhongli',
  'raiden shogun': 'Raiden',
  'shogun': 'Raiden',
  'ei': 'Raiden',
  'scaramouche': 'Wanderer',
  'hat guy': 'Wanderer',
  'cloud retainer': 'Xianyun',
  'marionette': 'Sandrone',
  'damselette': 'Columbina',
  'empty': 'Nobody'
};

/**
 * Normalizes user/spreadsheet input name into canonical database character name.
 */
export function normalizeCharacterName(rawName: string): string {
  if (!rawName) return '';
  // Strip constellation like C0, C1, etc.
  let clean = rawName.replace(/\\bC[0-6]\\b/gi, '').trim();
  // Strip parentheses and special tags
  clean = clean.replace(/\\s*\\([^)]*\\)/g, '').trim();
  if (!clean) clean = rawName.trim();

  const lower = clean.toLowerCase();
  if (ALIAS_LOOKUP[lower]) {
    return ALIAS_LOOKUP[lower];
  }

  // Check direct canonical match
  const direct = CHARACTERS_DATABASE.find(c => c.name.toLowerCase() === lower);
  if (direct) return direct.name;

  // Check alias list inside entries
  const withAlias = CHARACTERS_DATABASE.find(c => 
    c.aliases && c.aliases.some(a => a.toLowerCase() === lower)
  );
  if (withAlias) return withAlias.name;

  return clean;
}

/**
 * Returns character ER data by name with alias support and safe fallback.
 */
export function getCharacterERData(name: string): CharacterERData {
  const normalized = normalizeCharacterName(name);
  return CHARACTERS_DATABASE.find(c => c.name.toLowerCase() === normalized.toLowerCase()) || {
    name: name || 'Unknown',
    element: 'Pyro',
    weapon: 'Sword',
    burst_cost: 60,
    burst_cd: 15,
    particles: 3,
    label: 'Press',
    rng: 'Standard fixed particle drop',
    rarity: 4,
    releaseStatus: 'released'
  };
}

/**
 * Returns all 128 characters in the Astralys database.
 */
export function getAllCharacters(): CharacterERData[] {
  return [...CHARACTERS_DATABASE];
}

/**
 * Filters characters by element.
 */
export function getCharactersByElement(element: ElementType): CharacterERData[] {
  return CHARACTERS_DATABASE.filter(c => c.element.toLowerCase() === element.toLowerCase());
}

/**
 * Filters characters by weapon type.
 */
export function getCharactersByWeapon(weapon: WeaponType | string): CharacterERData[] {
  return CHARACTERS_DATABASE.filter(c => c.weapon && c.weapon.toLowerCase() === weapon.toLowerCase());
}

/**
 * Filters characters by rarity (4 or 5 star).
 */
export function getCharactersByRarity(rarity: 4 | 5): CharacterERData[] {
  return CHARACTERS_DATABASE.filter(c => c.rarity === rarity);
}

/**
 * Flexible multi-field search for character pickers and filters.
 */
export function searchCharacters(query: string): CharacterERData[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...CHARACTERS_DATABASE];
  return CHARACTERS_DATABASE.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.element.toLowerCase().includes(q) ||
    (c.weapon && c.weapon.toLowerCase().includes(q)) ||
    (c.aliases && c.aliases.some(a => a.toLowerCase().includes(q)))
  );
}

/**
 * Constructs public avatar image URL for released characters, or empty string for upcoming.
 */
export function getCharacterAvatarUrl(name: string): string {
  const norm = normalizeCharacterName(name);
  const char = CHARACTERS_DATABASE.find(c => c.name.toLowerCase() === norm.toLowerCase());
  if (!char || char.releaseStatus === 'upcoming') {
    return '';
  }
  const cleanKey = char.name.replace(/[^a-zA-Z0-9]/g, '');
  return `https://assets.kastel.dev/characters/${cleanKey}.png`;
}

/**
 * Computes Astralys crystal monogram fallback badge for upcoming units and offline mode.
 */
export function getCharacterFallbackBadge(name: string): CharacterFallbackBadge {
  const norm = normalizeCharacterName(name);
  const char = getCharacterERData(norm);
  const elemColors = ASTRALYS_ELEMENT_COLORS[char.element] || ASTRALYS_ELEMENT_COLORS.None;

  let initials = '??';
  if (char.name.includes('(')) {
    const base = char.name.split('(')[0].trim();
    const sub = char.name.split('(')[1].replace(')', '').trim();
    initials = (base[0] + sub[0]).toUpperCase();
  } else {
    const parts = char.name.split(/\\s+/);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      initials = char.name.slice(0, 2).toUpperCase();
    }
  }

  return {
    initials,
    element: char.element,
    elementColor: elemColors.hex,
    elementGlow: elemColors.glow,
    bgGradient: elemColors.bgGradient,
    borderColor: elemColors.border,
    isUpcoming: char.releaseStatus === 'upcoming'
  };
}

// Default base profiles for damage calculations
export const CHARACTER_BASE_PROFILES: Record<string, Partial<CharacterConfig>> = {
  "Mavuika": {
    element: "Pyro",
    weaponType: "claymore",
    level: 90,
    baseHp: 13200,
    baseAtk: 349,
    baseDef: 790,
    critRate: 19.2,
    critDmg: 50.0
  },
  "Neuvillette": {
    element: "Hydro",
    weaponType: "catalyst",
    level: 90,
    baseHp: 14695,
    baseAtk: 208,
    baseDef: 576,
    critRate: 5.0,
    critDmg: 88.4
  },
  "Arlecchino": {
    element: "Pyro",
    weaponType: "polearm",
    level: 90,
    baseHp: 13103,
    baseAtk: 342,
    baseDef: 765,
    critRate: 5.0,
    critDmg: 88.4
  },
  "Raiden": {
    element: "Electro",
    weaponType: "polearm",
    level: 90,
    baseHp: 12907,
    baseAtk: 337,
    baseDef: 789,
    critRate: 5.0,
    critDmg: 50.0
  },
  "Alhaitham": {
    element: "Dendro",
    weaponType: "sword",
    level: 90,
    baseHp: 13348,
    baseAtk: 313,
    baseDef: 782,
    critRate: 5.0,
    critDmg: 50.0
  },
  "Kinich": {
    element: "Dendro",
    weaponType: "claymore",
    level: 90,
    baseHp: 12850,
    baseAtk: 332,
    baseDef: 800,
    critRate: 5.0,
    critDmg: 88.4
  },
  "Hu Tao": {
    element: "Pyro",
    weaponType: "polearm",
    level: 90,
    baseHp: 15552,
    baseAtk: 106,
    baseDef: 876,
    critRate: 5.0,
    critDmg: 88.4
  },
  "Navia": {
    element: "Geo",
    weaponType: "claymore",
    level: 90,
    baseHp: 12650,
    baseAtk: 352,
    baseDef: 793,
    critRate: 5.0,
    critDmg: 88.4
  }
};
'''

with open(r'C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_m1_3\assemble_proposed.py', 'w', encoding='utf-8') as f:
    f.write(f"with open(r'C:\\Users\\dabiv\\ametist-impact-suite\\.agents\\teamwork\\explorer_m1_3\\proposed_characters.ts', 'w', encoding='utf-8') as out:\n    out.write('''{template}''')\nprint('proposed_characters.ts generated successfully')\n")
