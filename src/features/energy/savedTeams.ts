/**
 * Times salvos da calculadora de recarga avulsa (`/recarga`): guardados no navegador, com backup em arquivo.
 * Lê também o backup da calculadora HTML antiga do Davi (`meus_times_genshin_er.json`: lista de times com 4 slots).
 */
import type { RotationProject } from '../../engine';
import { DEFAULT_ENEMY_PARTICLES, defaultSlot, type StoredSlot } from './energyModel';

export type EnergyConfig = NonNullable<RotationProject['meta']['energy']>;

export interface SavedEnergyTeam {
  id: string;
  name: string;
  savedAt: string;
  /** Nomes dos personagens, na ordem dos slots. */
  members: string[];
  energy: EnergyConfig;
}

export const SAVED_TEAMS_KEY = 'astralys.recarga-times';
const BACKUP_APP = 'astralys-recarga';

/** Nomes da calculadora antiga que diferem dos nomes do Lunaris. */
const LEGACY_NAMES: Record<string, string> = {
  Ayaka: 'Kamisato Ayaka',
  Ayato: 'Kamisato Ayato',
  Heizou: 'Shikanoin Heizou',
  Itto: 'Arataki Itto',
  Kazuha: 'Kaedehara Kazuha',
  Kokomi: 'Sangonomiya Kokomi',
  Raiden: 'Raiden Shogun',
  Sara: 'Kujou Sara',
  Childe: 'Tartaglia',
};

export function resolveLegacyName(name: string, known: ReadonlySet<string>): string | null {
  if (known.has(name)) return name;
  const mapped = LEGACY_NAMES[name];
  if (mapped && known.has(mapped)) return mapped;
  const traveler = /^Traveler \((\w+)\)$/.exec(name);
  if (traveler && known.has(`Aether (${traveler[1]})`)) return `Aether (${traveler[1]})`;
  return null;
}

interface LegacySlot {
  id?: number;
  name: string;
  e_uses?: number;
  funnel?: string;
  fav?: number;
  fav_target?: string;
  flat?: number;
  onfield?: number;
  use_burst?: boolean;
  custom_part?: number;
}
interface LegacyTeam {
  id?: number;
  name?: string;
  rotationTime?: number;
  enemyParts?: number;
  slots: LegacySlot[];
}

const SELF = 'Ele mesmo (Em campo)';

/** Quem fica em campo, segundo o texto do menu da calculadora antiga ("Passar p/ Slot 2", "Dividir (50% Slot 3 / 50% Slot 4)"…). */
function legacyReceivers(text: string | undefined, selfName: string, slotNames: (string | null)[]): string[] {
  if (!text || text === SELF) return [selfName];
  const slots = [...text.matchAll(/Slot (\d)/g)].map((m) => slotNames[Number(m[1]) - 1]).filter((n): n is string => !!n);
  return text.startsWith('Passar') || text.startsWith('Dividir') ? slots : [];
}

function legacyToTeam(old: LegacyTeam, known: ReadonlySet<string>, index: number): SavedEnergyTeam | null {
  const slotNames = old.slots.map((s) => resolveLegacyName(s.name, known));
  const slots: Record<string, StoredSlot> = {};
  const members: string[] = [];
  old.slots.forEach((s, i) => {
    const name = slotNames[i];
    if (!name || members.includes(name)) return;
    members.push(name);
    const fav = s.fav_target === SELF || !s.fav_target ? name : (legacyReceivers(s.fav_target, name, slotNames)[0] ?? null);
    slots[name] = {
      ...defaultSlot(name),
      skillUses: Math.max(0, s.e_uses ?? 1),
      particles: s.custom_part,
      onField: legacyReceivers(s.funnel, name, slotNames),
      favProcs: Math.max(0, s.fav ?? 0),
      favTarget: fav,
      flat: Math.max(0, s.flat ?? 0),
      fieldTime: Math.min(1, Math.max(0, s.onfield ?? 0.15)),
      useBurst: s.use_burst !== false,
    };
  });
  if (members.length === 0) return null;
  return {
    id: `legado-${old.id ?? index}`,
    name: old.name?.trim() || members.join(' + '),
    savedAt: old.id ? new Date(old.id).toISOString() : new Date().toISOString(),
    members,
    energy: { enemyParticles: old.enemyParts ?? DEFAULT_ENEMY_PARTICLES, margin: 'medium', slots },
  };
}

export function serializeBackup(teams: SavedEnergyTeam[]): string {
  return JSON.stringify({ app: BACKUP_APP, version: 1, teams }, null, 2);
}

/** Lê um arquivo de backup (formato do Astralys ou da calculadora antiga). `skipped` lista o que não deu para aproveitar. */
export function parseBackup(text: string, known: ReadonlySet<string>): { teams: SavedEnergyTeam[]; skipped: string[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('O arquivo não é um backup válido (não é JSON).');
  }
  const skipped: string[] = [];
  if (Array.isArray(raw)) {
    const teams: SavedEnergyTeam[] = [];
    raw.forEach((t: LegacyTeam, i) => {
      const team = Array.isArray(t?.slots) ? legacyToTeam(t, known, i) : null;
      if (team) {
        const dropped = t.slots.filter((s) => !resolveLegacyName(s.name, known)).map((s) => s.name);
        if (dropped.length) skipped.push(`${team.name}: ${dropped.join(', ')} não existe(m) nos dados`);
        teams.push(team);
      } else skipped.push(t?.name ?? `time ${i + 1}`);
    });
    return { teams, skipped };
  }
  const obj = raw as { app?: string; teams?: SavedEnergyTeam[] };
  if (obj?.app !== BACKUP_APP || !Array.isArray(obj.teams)) throw new Error('O arquivo não é um backup da calculadora de recarga.');
  const teams = obj.teams.filter((t) => {
    const ok = typeof t?.id === 'string' && Array.isArray(t.members) && t.members.every((m) => known.has(m)) && !!t.energy;
    if (!ok) skipped.push(t?.name ?? '?');
    return ok;
  });
  return { teams, skipped };
}

/** Junta os importados aos atuais (o mais novo de cada id vence). */
export function mergeTeams(current: SavedEnergyTeam[], imported: SavedEnergyTeam[]): SavedEnergyTeam[] {
  const byId = new Map(current.map((t) => [t.id, t]));
  for (const t of imported) {
    const cur = byId.get(t.id);
    if (!cur || cur.savedAt <= t.savedAt) byId.set(t.id, t);
  }
  return [...byId.values()].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function readSavedTeams(): SavedEnergyTeam[] {
  try {
    const raw = localStorage.getItem(SAVED_TEAMS_KEY);
    const list = raw ? (JSON.parse(raw) as SavedEnergyTeam[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function writeSavedTeams(teams: SavedEnergyTeam[]): void {
  try {
    localStorage.setItem(SAVED_TEAMS_KEY, JSON.stringify(teams));
  } catch {
    /* sem armazenamento: a lista some ao recarregar */
  }
}

/** Foto do time atual da calculadora avulsa. */
export function snapshotTeam(project: RotationProject, name: string): SavedEnergyTeam {
  const members = project.members.map((m) => m.character);
  const label = name.trim() || members.join(' + ');
  return {
    id: `t-${Date.now()}`,
    name: label.slice(0, 60),
    savedAt: new Date().toISOString(),
    members,
    energy: project.meta.energy ?? { enemyParticles: DEFAULT_ENEMY_PARTICLES, margin: 'medium', slots: {} },
  };
}
