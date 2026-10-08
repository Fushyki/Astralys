/**
 * Astralys - Multi-Database Storage Manager (Inspirado no Genshin Optimizer)
 * Gerencia múltiplos slots de bancos de dados locais (Database 1, 2, 3, 4...)
 * e calcula o consumo de armazenamento no cliente (localStorage).
 */

import { CalculationProject } from '../types/projectVault';
import { CharacterWeaponComparison } from '../types/weaponComparison';
import { DEFAULT_CALCULATION_PROJECTS } from '../data/defaultProjects';

export interface DatabaseSlotStats {
  characters: number;
  artifacts: number;
  weapons: number;
  teams: number;
  loadouts: number;
  rotations: number;
  sizeBytes: number;
}

export interface DatabaseSlot {
  id: string;
  name: string;
  description: string;
  lastModified: string;
  color: string;
  data: {
    projects: CalculationProject[];
    weaponComparisons: Record<string, CharacterWeaponComparison>;
  };
  stats: DatabaseSlotStats;
}

export interface StorageGlobalStats {
  totalUsedBytes: number;
  maxBytes: number; // Padrão 5MB (5 * 1024 * 1024)
  percentUsed: number;
  slotsUsage: Array<{
    id: string;
    name: string;
    sizeBytes: number;
    percent: number;
    color: string;
    isActive: boolean;
  }>;
}

const STORAGE_ACTIVE_SLOT_KEY = 'astralys_active_db_slot_id';
const STORAGE_SLOTS_KEY = 'astralys_database_slots_meta';
const MAX_LOCAL_STORAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const DEFAULT_SLOT_COLORS = [
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#f43f5e', // Rose
];

/**
 * Calcula estatísticas de contagem a partir dos dados do slot
 */
export function computeSlotStats(
  projects: CalculationProject[], 
  weaponComparisons: Record<string, CharacterWeaponComparison>
): DatabaseSlotStats {
  let charactersSet = new Set<string>();
  let artifactsCount = 0;
  let weaponsCount = 0;
  let rotationsCount = 0;

  projects.forEach(p => {
    (p.teamNames || []).forEach(name => charactersSet.add(name));
    if (p.carryName) charactersSet.add(p.carryName);

    // Artefatos dos personagens
    if (p.calculation?.characters) {
      p.calculation.characters.forEach(c => {
        if (c.artifactSet) artifactsCount += 5; // 5 peças por set
        if (c.weapon) weaponsCount += 1;
      });
    }

    if (p.timeline?.actions && p.timeline.actions.length > 0) {
      rotationsCount += 1;
    }
  });

  // Armas comparadas no módulo de armas
  Object.values(weaponComparisons || {}).forEach(wc => {
    if (wc.characterName) charactersSet.add(wc.characterName);
    weaponsCount += (wc.weapons || []).length;
  });

  const payloadString = JSON.stringify({ projects, weaponComparisons });
  const sizeBytes = new Blob([payloadString]).size;

  return {
    characters: charactersSet.size,
    artifacts: artifactsCount,
    weapons: weaponsCount,
    teams: projects.length,
    loadouts: projects.length * 4,
    rotations: rotationsCount,
    sizeBytes
  };
}

/**
 * Cria slots iniciais caso nenhum exista ainda
 */
function createInitialSlots(
  initialProjects: CalculationProject[] = DEFAULT_CALCULATION_PROJECTS,
  initialWeapons: Record<string, CharacterWeaponComparison> = {}
): DatabaseSlot[] {
  const now = new Date().toISOString();

  const slot1Stats = computeSlotStats(initialProjects, initialWeapons);

  return [
    {
      id: 'db_1',
      name: 'Database 1 (Ativa)',
      description: 'Base de dados principal com suas equipes e rotações ativas',
      lastModified: now,
      color: DEFAULT_SLOT_COLORS[0],
      data: {
        projects: initialProjects,
        weaponComparisons: initialWeapons
      },
      stats: slot1Stats
    },
    {
      id: 'db_2',
      name: 'Database 2',
      description: 'Slot secundário para rotações alternativas ou conta alternativa',
      lastModified: now,
      color: DEFAULT_SLOT_COLORS[1],
      data: {
        projects: [],
        weaponComparisons: {}
      },
      stats: computeSlotStats([], {})
    },
    {
      id: 'db_3',
      name: 'Database 3',
      description: 'Slot para testes rápidos e simulações descartáveis',
      lastModified: now,
      color: DEFAULT_SLOT_COLORS[2],
      data: {
        projects: [],
        weaponComparisons: {}
      },
      stats: computeSlotStats([], {})
    },
    {
      id: 'db_4',
      name: 'Database 4',
      description: 'Slot reserva para importação de planilhas Excel externas',
      lastModified: now,
      color: DEFAULT_SLOT_COLORS[3],
      data: {
        projects: [],
        weaponComparisons: {}
      },
      stats: computeSlotStats([], {})
    }
  ];
}

/**
 * Obtém todos os slots de bases de dados do armazenamento local
 */
export function getDatabaseSlots(
  currentProjects?: CalculationProject[],
  currentWeapons?: Record<string, CharacterWeaponComparison>
): DatabaseSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_SLOTS_KEY);
    if (!raw) {
      const initial = createInitialSlots(currentProjects, currentWeapons);
      saveDatabaseSlots(initial);
      return initial;
    }

    const parsed: DatabaseSlot[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = createInitialSlots(currentProjects, currentWeapons);
      saveDatabaseSlots(initial);
      return initial;
    }

    // Se o slot 1 estiver ativo e tivermos projetos atuais atualizados, sincronizamos
    const activeId = getActiveSlotId();
    if (currentProjects && currentProjects.length > 0) {
      const activeSlot = parsed.find(s => s.id === activeId);
      if (activeSlot && activeSlot.data.projects.length === 0) {
        activeSlot.data.projects = currentProjects;
        if (currentWeapons) activeSlot.data.weaponComparisons = currentWeapons;
        activeSlot.stats = computeSlotStats(activeSlot.data.projects, activeSlot.data.weaponComparisons);
        saveDatabaseSlots(parsed);
      }
    }

    return parsed;
  } catch (e) {
    console.warn('Erro ao carregar slots de database:', e);
    return createInitialSlots(currentProjects, currentWeapons);
  }
}

/**
 * Salva a lista de slots no localStorage
 */
export function saveDatabaseSlots(slots: DatabaseSlot[]): void {
  try {
    localStorage.setItem(STORAGE_SLOTS_KEY, JSON.stringify(slots));
  } catch (e) {
    console.error('Falha ao salvar slots de database no localStorage:', e);
  }
}

/**
 * Obtém o ID do slot ativo (padrão: 'db_1')
 */
export function getActiveSlotId(): string {
  try {
    return localStorage.getItem(STORAGE_ACTIVE_SLOT_KEY) || 'db_1';
  } catch {
    return 'db_1';
  }
}

/**
 * Define o slot ativo
 */
export function setActiveSlotId(slotId: string): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_SLOT_KEY, slotId);
  } catch (e) {
    console.warn('Erro ao definir slot ativo:', e);
  }
}

/**
 * Atualiza os dados de um slot específico
 */
export function updateSlotData(
  slotId: string,
  projects: CalculationProject[],
  weaponComparisons: Record<string, CharacterWeaponComparison>
): DatabaseSlot[] {
  const slots = getDatabaseSlots();
  const target = slots.find(s => s.id === slotId);

  if (target) {
    target.data = { projects, weaponComparisons };
    target.lastModified = new Date().toISOString();
    target.stats = computeSlotStats(projects, weaponComparisons);
    saveDatabaseSlots(slots);
  }

  return slots;
}

/**
 * Duplica os dados de um slot para outro slot
 */
export function duplicateSlot(sourceId: string, targetId: string): DatabaseSlot[] {
  const slots = getDatabaseSlots();
  const source = slots.find(s => s.id === sourceId);
  const target = slots.find(s => s.id === targetId);

  if (!source || !target) return slots;

  target.data = JSON.parse(JSON.stringify(source.data));
  target.lastModified = new Date().toISOString();
  target.stats = computeSlotStats(target.data.projects, target.data.weaponComparisons);

  saveDatabaseSlots(slots);
  return slots;
}

/**
 * Limpa completamente os dados de um slot
 */
export function clearSlot(slotId: string): DatabaseSlot[] {
  const slots = getDatabaseSlots();
  const target = slots.find(s => s.id === slotId);

  if (target) {
    target.data = { projects: [], weaponComparisons: {} };
    target.lastModified = new Date().toISOString();
    target.stats = computeSlotStats([], {});
    saveDatabaseSlots(slots);
  }

  return slots;
}

/**
 * Calcula o espaço global ocupado no localStorage e detalha por slot
 */
export function calculateStorageStats(): StorageGlobalStats {
  const slots = getDatabaseSlots();
  const activeId = getActiveSlotId();

  // Medição do localStorage completo
  let totalUsedBytes = 0;
  try {
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalUsedBytes += ((localStorage[key]?.length || 0) + key.length) * 2; // UTF-16
      }
    }
  } catch {
    totalUsedBytes = slots.reduce((acc, s) => acc + s.stats.sizeBytes, 0);
  }

  const percentUsed = Math.min(100, parseFloat(((totalUsedBytes / MAX_LOCAL_STORAGE_BYTES) * 100).toFixed(1)));

  const slotsUsage = slots.map(slot => {
    const slotPercent = totalUsedBytes > 0 
      ? Math.round((slot.stats.sizeBytes / totalUsedBytes) * 100) 
      : 0;

    return {
      id: slot.id,
      name: slot.name,
      sizeBytes: slot.stats.sizeBytes,
      percent: slotPercent,
      color: slot.color,
      isActive: slot.id === activeId
    };
  });

  return {
    totalUsedBytes,
    maxBytes: MAX_LOCAL_STORAGE_BYTES,
    percentUsed,
    slotsUsage
  };
}
