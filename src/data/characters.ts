import { CharacterERData, ElementType, WeaponType } from '../types/er';
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
  { name: "Aino", element: "Hydro", weapon: "Catalyst", burst_cost: 50, burst_cd: 13.5, particles: 3, label: "Constellation 0", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "upcoming" },
  { name: "Albedo", element: "Geo", weapon: "Sword", burst_cost: 40, burst_cd: 12, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Alhaitham", element: "Dendro", weapon: "Sword", burst_cost: 70, burst_cd: 18, particles: 1, label: "Projection Attack", rng: "Projection Attack hit on-field generates 1 particle (1.6s CD)", rarity: 5, releaseStatus: "released", aliases: ["Haitham"] },
  { name: "Alyosha", element: "Electro", weapon: "Sword", burst_cost: 70, burst_cd: 18, particles: 5, label: "Constellation 0", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming" },
  { name: "Amber", element: "Pyro", weapon: "Bow", burst_cost: 40, burst_cd: 12, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Arlecchino", element: "Pyro", weapon: "Polearm", burst_cost: 60, burst_cd: 15, particles: 5, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Arle", "Father"] },
  { name: "Ayaka", element: "Cryo", weapon: "Sword", burst_cost: 80, burst_cd: 20, particles: 4.5, label: "Press", rng: "Skill / stance generates 4 or 5 particles (avg 4.5)", rarity: 5, releaseStatus: "released", aliases: ["Kamisato Ayaka"] },
  { name: "Ayato", element: "Hydro", weapon: "Sword", burst_cost: 80, burst_cd: 20, particles: 4.5, label: "On field", rng: "Skill / stance generates 4 or 5 particles (avg 4.5)", rarity: 5, releaseStatus: "released", aliases: ["Kamisato Ayato"] },
  { name: "Baizhu", element: "Dendro", weapon: "Catalyst", burst_cost: 80, burst_cd: 20, particles: 3.5, label: "Press", rng: "Skill generates 3 or 4 particles (avg 3.5)", rarity: 5, releaseStatus: "released" },
  { name: "Barbara", element: "Hydro", weapon: "Catalyst", burst_cost: 80, burst_cd: 20, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Beidou", element: "Electro", weapon: "Claymore", burst_cost: 80, burst_cd: 20, particles: 2, label: "0 stacks", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Bennett", element: "Pyro", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 2.25, label: "Press", rng: "Press: 75% chance 2 particles, 25% chance 3 particles (avg 2.25)", rarity: 4, releaseStatus: "released", aliases: ["Benny"] },
  { name: "Candace", element: "Hydro", weapon: "Polearm", burst_cost: 60, burst_cd: 15, particles: 2, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Charlotte", element: "Cryo", weapon: "Catalyst", burst_cost: 80, burst_cd: 20, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Chasca", element: "Anemo", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 5, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Chevreuse", element: "Pyro", weapon: "Polearm", burst_cost: 60, burst_cd: 15, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released", aliases: ["Chev"] },
  { name: "Childe", element: "Hydro", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 3, label: "7-9s melee", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Tartaglia", "Ajax"] },
  { name: "Chiori", element: "Geo", weapon: "Sword", burst_cost: 50, burst_cd: 13.5, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Chongyun", element: "Cryo", weapon: "Claymore", burst_cost: 40, burst_cd: 12, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released", aliases: ["Chong"] },
  { name: "Citlali", element: "Cryo", weapon: "Catalyst", burst_cost: 60, burst_cd: 15, particles: 5, label: "Constellation 0", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming" },
  { name: "Clorinde", element: "Electro", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Collei", element: "Dendro", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Columbina", element: "Hydro", weapon: "Catalyst", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming", aliases: ["Damselette"] },
  { name: "Cyno", element: "Electro", weapon: "Polearm", burst_cost: 80, burst_cd: 20, particles: 3, label: "Press (no burst)", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Dahlia", element: "Hydro", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "upcoming" },
  { name: "Dehya", element: "Pyro", weapon: "Claymore", burst_cost: 70, burst_cd: 18, particles: 3, label: "Constellation 0", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Diluc", element: "Pyro", weapon: "Claymore", burst_cost: 40, burst_cd: 12, particles: 3.75, label: "3-skill combo", rng: "3-Skill Searing Onset combo (avg 1.25 particles per cast = 3.75 total)", rarity: 5, releaseStatus: "released" },
  { name: "Diona", element: "Cryo", weapon: "Bow", burst_cost: 80, burst_cd: 20, particles: 1.6, label: "Press", rng: "Press fires 2 paws (0.8/paw = 1.6 avg); Hold fires 5 paws (4.0)", rarity: 4, releaseStatus: "released" },
  { name: "Dori", element: "Electro", weapon: "Claymore", burst_cost: 80, burst_cd: 20, particles: 2, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Durin", element: "Pyro", weapon: "Sword", burst_cost: 70, burst_cd: 18, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming" },
  { name: "Emilie", element: "Dendro", weapon: "Polearm", burst_cost: 50, burst_cd: 13.5, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Escoffier", element: "Cryo", weapon: "Polearm", burst_cost: 60, burst_cd: 15, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming" },
  { name: "Eula", element: "Cryo", weapon: "Claymore", burst_cost: 80, burst_cd: 20, particles: 1.5, label: "Press", rng: "Tap: 1-2 particles (avg 1.5); Hold generates 2-3 (avg 2.5)", rarity: 5, releaseStatus: "released" },
  { name: "Faruzan", element: "Anemo", weapon: "Bow", burst_cost: 80, burst_cd: 20, particles: 2, label: "Aimed Shot", rng: "Skill creates buffed Aimed Shot / Crowfeather that procs particles", rarity: 4, releaseStatus: "released", aliases: ["Madam Faruzan"] },
  { name: "Fischl", element: "Electro", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 6.7, label: "Constellation 0", rng: "Oz attacks over 10s duration (~67% chance per hit, avg 6.7)", rarity: 4, releaseStatus: "released", aliases: ["Amy", "Oz"] },
  { name: "Flins", element: "Electro", weapon: "Polearm", burst_cost: 60, burst_cd: 16, particles: 4, label: "Constellation 0", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming" },
  { name: "Freminet", element: "Cryo", weapon: "Claymore", burst_cost: 60, burst_cd: 15, particles: 2, label: "Level 0 (no burst)", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Furina", element: "Hydro", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 6.5, label: "Salon Members", rng: "Salon Members periodic attacks over 20s (avg 6.5 particles)", rarity: 5, releaseStatus: "released", aliases: ["Focalors"] },
  { name: "Gaming", element: "Pyro", weapon: "Claymore", burst_cost: 60, burst_cd: 15, particles: 2, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released", aliases: ["Ga-ming"] },
  { name: "Ganyu", element: "Cryo", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Gorou", element: "Geo", weapon: "Bow", burst_cost: 80, burst_cd: 20, particles: 2, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Heizou", element: "Anemo", weapon: "Catalyst", burst_cost: 40, burst_cd: 12, particles: 2, label: "0-1 stacks", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released", aliases: ["Shikanoin Heizou"] },
  { name: "Hu Tao", element: "Pyro", weapon: "Polearm", burst_cost: 60, burst_cd: 15, particles: 4.8, label: "Press", rng: "Blood Blossom procs over 9s duration (avg 4.8 particles)", rarity: 5, releaseStatus: "released", aliases: ["Hutao", "Tao"] },
  { name: "Iansan", element: "Electro", weapon: "Polearm", burst_cost: 70, burst_cd: 18, particles: 4, label: "Constellation 0", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming" },
  { name: "Ifa", element: "Anemo", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 4.3, label: "Press", rng: "Skill generates 4.3 Anemo particles on average", rarity: 4, releaseStatus: "upcoming" },
  { name: "Illuga", element: "Geo", weapon: "Polearm", burst_cost: 60, burst_cd: 15, particles: 4.5, label: "Constellation 0", rng: "Skill / stance generates 4 or 5 particles (avg 4.5)", rarity: 4, releaseStatus: "upcoming" },
  { name: "Ineffa", element: "Electro", weapon: "Polearm", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "upcoming" },
  { name: "Itto", element: "Geo", weapon: "Claymore", burst_cost: 70, burst_cd: 18, particles: 3.5, label: "Press", rng: "Skill generates 3 or 4 particles (avg 3.5)", rarity: 5, releaseStatus: "released", aliases: ["Arataki Itto"] },
  { name: "Jahoda", element: "Anemo", weapon: "Bow", burst_cost: 70, burst_cd: 18, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "upcoming" },
  { name: "Jean", element: "Anemo", weapon: "Sword", burst_cost: 80, burst_cd: 20, particles: 2.67, label: "Press", rng: "Press: 33% chance 2 particles, 67% chance 3 particles (avg 2.67)", rarity: 5, releaseStatus: "released", aliases: ["Jean Gunnhildr"] },
  { name: "Kachina", element: "Geo", weapon: "Polearm", burst_cost: 70, burst_cd: 18, particles: 3, label: "Independent", rng: "Turbo Twirler independent ground strikes generate ~3 particles total", rarity: 4, releaseStatus: "released" },
  { name: "Kaeya", element: "Cryo", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 2.67, label: "0 freezes", rng: "Press: 2 or 3 Cryo particles (avg 2.67 without freeze passive)", rarity: 4, releaseStatus: "released", aliases: ["Kaeya Alberich"] },
  { name: "Kaveh", element: "Dendro", weapon: "Claymore", burst_cost: 80, burst_cd: 20, particles: 2, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Kazuha", element: "Anemo", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Kaedehara Kazuha", "Kaz"] },
  { name: "Keqing", element: "Electro", weapon: "Sword", burst_cost: 40, burst_cd: 12, particles: 2.5, label: "Press", rng: "Stellar Restoration generates 2 or 3 Electro particles (avg 2.5)", rarity: 5, releaseStatus: "released", aliases: ["Keq"] },
  { name: "Kinich", element: "Dendro", weapon: "Claymore", burst_cost: 70, burst_cd: 18, particles: 5, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Kirara", element: "Dendro", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 3, label: "Final Kick", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Klee", element: "Pyro", weapon: "Catalyst", burst_cost: 60, burst_cd: 15, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Kokomi", element: "Hydro", weapon: "Catalyst", burst_cost: 70, burst_cd: 18, particles: 3, label: "Refresh", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Sangonomiya Kokomi", "Koko"] },
  { name: "Kuki Shinobu", element: "Electro", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 3, label: "Constellation 0", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released", aliases: ["Shinobu", "Kuki"] },
  { name: "Lan Yan", element: "Anemo", weapon: "Catalyst", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "upcoming" },
  { name: "Lauma", element: "Dendro", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming" },
  { name: "Layla", element: "Cryo", weapon: "Sword", burst_cost: 40, burst_cd: 12, particles: 3, label: "1 volley", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Linnea", element: "Geo", weapon: "Polearm", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "upcoming" },
  { name: "Lisa", element: "Electro", weapon: "Catalyst", burst_cost: 80, burst_cd: 20, particles: 0, label: "Press", rng: "Generates 0 particles on tap/press", rarity: 4, releaseStatus: "released" },
  { name: "Lohen", element: "Cryo", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 5, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming" },
  { name: "Lynette", element: "Anemo", weapon: "Sword", burst_cost: 70, burst_cd: 18, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Lyney", element: "Pyro", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 5, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Mavuika", element: "Pyro", weapon: "Claymore", burst_cost: 0, burst_cd: 18, particles: 5, label: "Press", rng: "Alternate energy mechanic (Nightsoul / Stance), cost 0", rarity: 5, releaseStatus: "upcoming", aliases: ["Pyro Archon"] },
  { name: "Mika", element: "Cryo", weapon: "Polearm", burst_cost: 70, burst_cd: 18, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Mona", element: "Hydro", weapon: "Catalyst", burst_cost: 60, burst_cd: 15, particles: 3.33, label: "Press", rng: "Phantom explosion: 3 or 4 particles (avg 3.33)", rarity: 5, releaseStatus: "released", aliases: ["Mona Megistus"] },
  { name: "Mualani", element: "Hydro", weapon: "Catalyst", burst_cost: 60, burst_cd: 15, particles: 4.5, label: "Press", rng: "Skill / stance generates 4 or 5 particles (avg 4.5)", rarity: 5, releaseStatus: "released", aliases: ["Shark Girl"] },
  { name: "Nahida", element: "Dendro", weapon: "Catalyst", burst_cost: 50, burst_cd: 13.5, particles: 6, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Kusanali", "Lesser Lord"] },
  { name: "Navia", element: "Geo", weapon: "Claymore", burst_cost: 60, burst_cd: 15, particles: 3.5, label: "Press", rng: "Skill generates 3 or 4 particles (avg 3.5)", rarity: 5, releaseStatus: "released", aliases: ["Spina President"] },
  { name: "Nefer", element: "Dendro", weapon: "Catalyst", burst_cost: 60, burst_cd: 15, particles: 2.67, label: "Press", rng: "Skill generates 2 or 3 Dendro particles (avg 2.67)", rarity: 5, releaseStatus: "upcoming" },
  { name: "Neuvillette", element: "Hydro", weapon: "Catalyst", burst_cost: 70, burst_cd: 18, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Neuvi", "Iudex"] },
  { name: "Nicole", element: "Pyro", weapon: "Catalyst", burst_cost: 60, burst_cd: 15, particles: 5, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming", aliases: ["Nicole Reihn", "Hexenzirkel N"] },
  { name: "Nilou", element: "Hydro", weapon: "Sword", burst_cost: 70, burst_cd: 18, particles: 4.5, label: "Press", rng: "Skill / stance generates 4 or 5 particles (avg 4.5)", rarity: 5, releaseStatus: "released" },
  { name: "Ningguang", element: "Geo", weapon: "Catalyst", burst_cost: 40, burst_cd: 12, particles: 3.4, label: "Press", rng: "Jade Screen: 3 or 4 Geo particles (avg 3.4, 6s internal CD)", rarity: 4, releaseStatus: "released", aliases: ["Ning"] },
  { name: "Nobody", element: "None", weapon: "None", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming", aliases: ["Empty", "None"] },
  { name: "Noelle", element: "Geo", weapon: "Claymore", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Odette", element: "Cryo", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 5, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "upcoming" },
  { name: "Ororon", element: "Electro", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Prune", element: "Anemo", weapon: "Catalyst", burst_cost: 70, burst_cd: 18, particles: 5, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "upcoming" },
  { name: "Qiqi", element: "Cryo", weapon: "Sword", burst_cost: 80, burst_cd: 20, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Raiden", element: "Electro", weapon: "Polearm", burst_cost: 90, burst_cd: 18, particles: 6.5, label: "Press", rng: "Eye of Stormy Judgment periodic hits (50% chance, 0.9s CD, avg 6.5)", rarity: 5, releaseStatus: "released", aliases: ["Raiden Shogun", "Ei"] },
  { name: "Razor", element: "Electro", weapon: "Claymore", burst_cost: 80, burst_cd: 20, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Rosaria", element: "Cryo", weapon: "Polearm", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released", aliases: ["Rosa"] },
  { name: "Sandrone", element: "Cryo", weapon: "Claymore", burst_cost: 60, burst_cd: 15, particles: 1, label: "Hit On-Field", rng: "Hit on-field with mechanical automata generates 1 particle", rarity: 5, releaseStatus: "upcoming", aliases: ["Marionette"] },
  { name: "Sara", element: "Electro", weapon: "Bow", burst_cost: 80, burst_cd: 20, particles: 3, label: "Aimed Shot", rng: "Skill creates buffed Aimed Shot / Crowfeather that procs particles", rarity: 4, releaseStatus: "released", aliases: ["Kujou Sara"] },
  { name: "Sayu", element: "Anemo", weapon: "Claymore", burst_cost: 80, burst_cd: 20, particles: 2, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Sethos", element: "Electro", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 2, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Shenhe", element: "Cryo", weapon: "Polearm", burst_cost: 80, burst_cd: 20, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Sigewinne", element: "Hydro", weapon: "Bow", burst_cost: 70, burst_cd: 18, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Sige"] },
  { name: "Skirk", element: "Cryo", weapon: "Sword", burst_cost: 0, burst_cd: 15, particles: 4, label: "Attack", rng: "Alternate energy mechanic (Nightsoul / Stance), cost 0", rarity: 5, releaseStatus: "upcoming", aliases: ["Master Skirk"] },
  { name: "Sucrose", element: "Anemo", weapon: "Catalyst", burst_cost: 80, burst_cd: 20, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Tartaglia", element: "Hydro", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 3, label: "7-9s melee", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Childe", "Ajax"] },
  { name: "Thoma", element: "Pyro", weapon: "Polearm", burst_cost: 80, burst_cd: 20, particles: 3.4, label: "Press", rng: "Blazing Blessing: 3 or 4 Pyro particles (avg 3.4)", rarity: 4, releaseStatus: "released" },
  { name: "Tighnari", element: "Dendro", weapon: "Bow", burst_cost: 40, burst_cd: 12, particles: 3.5, label: "Press", rng: "Skill generates 3 or 4 particles (avg 3.5)", rarity: 5, releaseStatus: "released", aliases: ["Nari"] },
  { name: "Traveler (Anemo)", element: "Anemo", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 2, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Anemo MC", "Anemo Traveler"] },
  { name: "Traveler (Cryo)", element: "Cryo", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming", aliases: ["Cryo MC", "Cryo Traveler"] },
  { name: "Traveler (Dendro)", element: "Dendro", weapon: "Sword", burst_cost: 80, burst_cd: 20, particles: 2.5, label: "Press", rng: "Razorgrass Blade: 2 or 3 Dendro particles (avg 2.5)", rarity: 5, releaseStatus: "released", aliases: ["Dendro MC", "Dendro Traveler"] },
  { name: "Traveler (Electro)", element: "Electro", weapon: "Sword", burst_cost: 80, burst_cd: 20, particles: 1, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Electro MC", "Electro Traveler"] },
  { name: "Traveler (Geo)", element: "Geo", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 3.33, label: "Press", rng: "Starfell Sword: 3 or 4 Geo particles (avg 3.33)", rarity: 5, releaseStatus: "released", aliases: ["Geo MC", "Geo Traveler"] },
  { name: "Traveler (Hydro)", element: "Hydro", weapon: "Sword", burst_cost: 80, burst_cd: 20, particles: 3.33, label: "Press", rng: "Aquacrest Saber: 3 or 4 Hydro particles (avg 3.33)", rarity: 5, releaseStatus: "released", aliases: ["Hydro MC", "Hydro Traveler"] },
  { name: "Traveler (Pyro)", element: "Pyro", weapon: "Sword", burst_cost: 70, burst_cd: 18, particles: 1, label: "Blazing Threshold", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Pyro MC", "Pyro Traveler"] },
  { name: "Varesa", element: "Electro", weapon: "Catalyst", burst_cost: 70, burst_cd: 18, particles: 2.5, label: "Press", rng: "Skill generates 2 or 3 Electro particles (avg 2.5)", rarity: 5, releaseStatus: "upcoming" },
  { name: "Varka", element: "Anemo", weapon: "Claymore", burst_cost: 60, burst_cd: 15, particles: 6, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming", aliases: ["Grand Master Varka"] },
  { name: "Venti", element: "Anemo", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming", aliases: ["Barbatos"] },
  { name: "Vesna", element: "Anemo", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 5, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "upcoming" },
  { name: "Vodyanitsa", element: "Hydro", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 5, label: "Press", rng: "Press skill generates 5.0 Hydro particles", rarity: 4, releaseStatus: "upcoming" },
  { name: "Wanderer", element: "Anemo", weapon: "Catalyst", burst_cost: 60, burst_cd: 15, particles: 4, label: "8-10s uptime", rng: "Windfavored state normal/charged hits generate ~4 particles over 8-10s", rarity: 5, releaseStatus: "released", aliases: ["Scaramouche", "Hat Guy"] },
  { name: "Wriothesley", element: "Cryo", weapon: "Catalyst", burst_cost: 60, burst_cd: 15, particles: 1, label: "NA during skill", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Wrio", "Duke"] },
  { name: "Xiangling", element: "Pyro", weapon: "Polearm", burst_cost: 80, burst_cd: 20, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released", aliases: ["XL", "Guoba"] },
  { name: "Xianyun", element: "Anemo", weapon: "Catalyst", burst_cost: 70, burst_cd: 18, particles: 5, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Cloud Retainer"] },
  { name: "Xiao", element: "Anemo", weapon: "Polearm", burst_cost: 70, burst_cd: 18, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Vigilant Yaksha"] },
  { name: "Xilonen", element: "Geo", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Leopard DJ"] },
  { name: "Xingqiu", element: "Hydro", weapon: "Sword", burst_cost: 80, burst_cd: 20, particles: 5, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released", aliases: ["XQ"] },
  { name: "Xinyan", element: "Pyro", weapon: "Claymore", burst_cost: 60, burst_cd: 15, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Yae Miko", element: "Electro", weapon: "Catalyst", burst_cost: 90, burst_cd: 22, particles: 3, label: "3 totems", rng: "Sesshou Sakura totem strikes generate ~3 particles across rotation", rarity: 5, releaseStatus: "released", aliases: ["Yae", "Guuji Yae"] },
  { name: "Yanfei", element: "Pyro", weapon: "Catalyst", burst_cost: 80, burst_cd: 20, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Yaoyao", element: "Dendro", weapon: "Polearm", burst_cost: 80, burst_cd: 20, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released" },
  { name: "Yelan", element: "Hydro", weapon: "Bow", burst_cost: 70, burst_cd: 18, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released" },
  { name: "Yoimiya", element: "Pyro", weapon: "Bow", burst_cost: 60, burst_cd: 15, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Yoi"] },
  { name: "Yumemizuki Mizuki", element: "Anemo", weapon: "Catalyst", burst_cost: 60, burst_cd: 15, particles: 4, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "upcoming", aliases: ["Mizuki"] },
  { name: "Yun Jin", element: "Geo", weapon: "Polearm", burst_cost: 60, burst_cd: 15, particles: 2, label: "Press", rng: "Standard fixed particle drop", rarity: 4, releaseStatus: "released", aliases: ["Yunjin"] },
  { name: "Zhongli", element: "Geo", weapon: "Polearm", burst_cost: 40, burst_cd: 12, particles: 3, label: "Press", rng: "Standard fixed particle drop", rarity: 5, releaseStatus: "released", aliases: ["Morax", "Geo Daddy"] },
  { name: "Zibai", element: "Geo", weapon: "Sword", burst_cost: 60, burst_cd: 15, particles: 4.7, label: "Press", rng: "Skill / Lunar Phase Shift generates 4 or 5 Geo particles (avg 4.7)", rarity: 5, releaseStatus: "upcoming" },
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
  let clean = rawName.replace(/C[0-6]/gi, '').trim();
  // Strip parentheses and special tags
  clean = clean.replace(/\s*\([^)]*\)/g, '').trim();
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
 * Verified Enka Network HoYoverse internal asset mappings for character portraits.
 */
const ENKA_SPECIAL_ICONS: Record<string, string> = {
  sandrone: 'UI_AvatarIcon_MarionetteNew.png',
  marionette: 'UI_AvatarIcon_MarionetteNew.png',
  columbina: 'UI_AvatarIcon_Columbina.png',
  flins: 'UI_AvatarIcon_Flins.png',
  iansan: 'UI_AvatarIcon_Iansan.png',
  mavuika: 'UI_AvatarIcon_Mavuika.png',
  citlali: 'UI_AvatarIcon_Citlali.png',
  xilonen: 'UI_AvatarIcon_Xilonen.png',
  chasca: 'UI_AvatarIcon_Chasca.png',
  kinich: 'UI_AvatarIcon_Kinich.png',
  mualani: 'UI_AvatarIcon_Mualani.png',
  kachina: 'UI_AvatarIcon_Kachina.png',
  emilie: 'UI_AvatarIcon_Emilie.png',
  clorinde: 'UI_AvatarIcon_Clorinde.png',
  arlecchino: 'UI_AvatarIcon_Arlecchino.png',
  sigewinne: 'UI_AvatarIcon_Sigewinne.png',
  sethos: 'UI_AvatarIcon_Sethos.png',
  chiori: 'UI_AvatarIcon_Chiori.png',
  xianyun: 'UI_AvatarIcon_Liuyun.png',
  cloudretainer: 'UI_AvatarIcon_Liuyun.png',
  liuyun: 'UI_AvatarIcon_Liuyun.png',
  gaming: 'UI_AvatarIcon_Gaming.png',
  navia: 'UI_AvatarIcon_Navia.png',
  chevreuse: 'UI_AvatarIcon_Chevreuse.png',
  furina: 'UI_AvatarIcon_Furina.png',
  charlotte: 'UI_AvatarIcon_Charlotte.png',
  wriothesley: 'UI_AvatarIcon_Wriothesley.png',
  neuvillette: 'UI_AvatarIcon_Neuvillette.png',
  lyney: 'UI_AvatarIcon_Liney.png',
  liney: 'UI_AvatarIcon_Liney.png',
  lynette: 'UI_AvatarIcon_Linette.png',
  linette: 'UI_AvatarIcon_Linette.png',
  freminet: 'UI_AvatarIcon_Freminet.png',
  baizhu: 'UI_AvatarIcon_Baizhuer.png',
  baizhuer: 'UI_AvatarIcon_Baizhuer.png',
  kaveh: 'UI_AvatarIcon_Kaveh.png',
  dehya: 'UI_AvatarIcon_Dehya.png',
  mika: 'UI_AvatarIcon_Mika.png',
  alhaitham: 'UI_AvatarIcon_Alhatham.png',
  alhatham: 'UI_AvatarIcon_Alhatham.png',
  yaoyao: 'UI_AvatarIcon_Yaoyao.png',
  wanderer: 'UI_AvatarIcon_Wanderer.png',
  scaramouche: 'UI_AvatarIcon_Wanderer.png',
  faruzan: 'UI_AvatarIcon_Faruzan.png',
  layla: 'UI_AvatarIcon_Layla.png',
  nahida: 'UI_AvatarIcon_Nahida.png',
  nilou: 'UI_AvatarIcon_Nilou.png',
  cyno: 'UI_AvatarIcon_Cyno.png',
  candace: 'UI_AvatarIcon_Candace.png',
  dori: 'UI_AvatarIcon_Dori.png',
  tighnari: 'UI_AvatarIcon_Tighnari.png',
  collei: 'UI_AvatarIcon_Collei.png',
  heizou: 'UI_AvatarIcon_Heizo.png',
  shikanoinheizou: 'UI_AvatarIcon_Heizo.png',
  heizo: 'UI_AvatarIcon_Heizo.png',
  kukishinobu: 'UI_AvatarIcon_Shinobu.png',
  shinobu: 'UI_AvatarIcon_Shinobu.png',
  yelan: 'UI_AvatarIcon_Yelan.png',
  kamisatoayato: 'UI_AvatarIcon_Ayato.png',
  ayato: 'UI_AvatarIcon_Ayato.png',
  kamisatoayaka: 'UI_AvatarIcon_Ayaka.png',
  ayaka: 'UI_AvatarIcon_Ayaka.png',
  shenhe: 'UI_AvatarIcon_Shenhe.png',
  yunjin: 'UI_AvatarIcon_Yunjin.png',
  aratakiitto: 'UI_AvatarIcon_Itto.png',
  itto: 'UI_AvatarIcon_Itto.png',
  gorou: 'UI_AvatarIcon_Gorou.png',
  thoma: 'UI_AvatarIcon_Tohma.png',
  tohma: 'UI_AvatarIcon_Tohma.png',
  kokomi: 'UI_AvatarIcon_Kokomi.png',
  sangonomiyakokomi: 'UI_AvatarIcon_Kokomi.png',
  raiden: 'UI_AvatarIcon_Shougun.png',
  raidenshogun: 'UI_AvatarIcon_Shougun.png',
  shougun: 'UI_AvatarIcon_Shougun.png',
  kujousara: 'UI_AvatarIcon_Sara.png',
  sara: 'UI_AvatarIcon_Sara.png',
  aloy: 'UI_AvatarIcon_Aloy.png',
  yoimiya: 'UI_AvatarIcon_Yoimiya.png',
  sayu: 'UI_AvatarIcon_Sayu.png',
  kaedeharakazuha: 'UI_AvatarIcon_Kazuha.png',
  kazuha: 'UI_AvatarIcon_Kazuha.png',
  yanfei: 'UI_AvatarIcon_Feiyan.png',
  feiyan: 'UI_AvatarIcon_Feiyan.png',
  eula: 'UI_AvatarIcon_Eula.png',
  rosaria: 'UI_AvatarIcon_Rosaria.png',
  hutao: 'UI_AvatarIcon_Hutao.png',
  xiao: 'UI_AvatarIcon_Xiao.png',
  ganyu: 'UI_AvatarIcon_Ganyu.png',
  albedo: 'UI_AvatarIcon_Albedo.png',
  zhongli: 'UI_AvatarIcon_Zhongli.png',
  xinyan: 'UI_AvatarIcon_Xinyan.png',
  tartaglia: 'UI_AvatarIcon_Tartaglia.png',
  childe: 'UI_AvatarIcon_Tartaglia.png',
  diona: 'UI_AvatarIcon_Diona.png',
  klee: 'UI_AvatarIcon_Klee.png',
  venti: 'UI_AvatarIcon_Venti.png',
  keqing: 'UI_AvatarIcon_Keqing.png',
  mona: 'UI_AvatarIcon_Mona.png',
  qiqi: 'UI_AvatarIcon_Qiqi.png',
  diluc: 'UI_AvatarIcon_Diluc.png',
  jean: 'UI_AvatarIcon_Qin.png',
  qin: 'UI_AvatarIcon_Qin.png',
  sucrose: 'UI_AvatarIcon_Sucrose.png',
  chongyun: 'UI_AvatarIcon_Chongyun.png',
  noelle: 'UI_AvatarIcon_Noel.png',
  noel: 'UI_AvatarIcon_Noel.png',
  bennett: 'UI_AvatarIcon_Bennett.png',
  fischl: 'UI_AvatarIcon_Fischl.png',
  ningguang: 'UI_AvatarIcon_Ningguang.png',
  xingqiu: 'UI_AvatarIcon_Xingqiu.png',
  beidou: 'UI_AvatarIcon_Beidou.png',
  xiangling: 'UI_AvatarIcon_Xiangling.png',
  razor: 'UI_AvatarIcon_Razor.png',
  barbara: 'UI_AvatarIcon_Barbara.png',
  lisa: 'UI_AvatarIcon_Lisa.png',
  kaeya: 'UI_AvatarIcon_Kaeya.png',
  amber: 'UI_AvatarIcon_Ambor.png',
  ambor: 'UI_AvatarIcon_Ambor.png',
  yae: 'UI_AvatarIcon_Yae.png',
  yaemiko: 'UI_AvatarIcon_Yae.png',
  kirara: 'UI_AvatarIcon_Momoka.png',
  momoka: 'UI_AvatarIcon_Momoka.png',
  traveler: 'UI_AvatarIcon_PlayerBoy.png',
  traveleranemo: 'UI_AvatarIcon_PlayerBoy.png',
  travelergeo: 'UI_AvatarIcon_PlayerBoy.png',
  travelerelectro: 'UI_AvatarIcon_PlayerBoy.png',
  travelerdendro: 'UI_AvatarIcon_PlayerBoy.png',
  travelerhydro: 'UI_AvatarIcon_PlayerBoy.png',
  travelerpyro: 'UI_AvatarIcon_PlayerBoy.png',
  aether: 'UI_AvatarIcon_PlayerBoy.png',
  lumine: 'UI_AvatarIcon_PlayerGirl.png'
};

/**
 * Constructs verified public avatar image URL from Enka Network CDN.
 */
export function getCharacterAvatarUrl(name: string): string {
  if (!name) return '';
  const norm = normalizeCharacterName(name);
  const cleanKey = norm.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (ENKA_SPECIAL_ICONS[cleanKey]) {
    return `https://enka.network/ui/${ENKA_SPECIAL_ICONS[cleanKey]}`;
  }

  // Capitalize first letter for standard Enka naming
  const capitalized = norm.charAt(0).toUpperCase() + norm.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  return `https://enka.network/ui/UI_AvatarIcon_${capitalized}.png`;
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
    const parts = char.name.split(/\s+/);
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
