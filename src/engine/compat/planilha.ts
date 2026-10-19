/**
 * Importador do formato de planilha "Mavuika Iansan Combo2" (abas Time, Rotação, Perfis de buff, Golpes extras).
 * Converte para o modelo do motor: equipa, ações com etiquetas de buff (os "perfis" viram etiquetas) e dano fixo.
 *
 * Replica os atalhos da planilha para que o resultado bata com ela (modo `compat: "planilha"`):
 *  - o elemento de TODOS os golpes é o do personagem;
 *  - buffs de time só valem para ATK%, ATK, EM e DMG% (geral e por tipo); outros stats geram aviso;
 *  - coeficiente de EM das amplificadoras = 2,78 (use PLANILHA_AMP_COEFFICIENT).
 */
import type { WorkBook, WorkSheet } from 'xlsx';
import type { Talent } from '../../data/schema';
import type { FlatDamageEffect } from '../../effects/schema';
import { AMP_EM_COEFFICIENT_SHEET } from '../constants/reactions';
import type { Rarity, PieceSlot } from '../artifacts';
import type { ExtraScale, ReactionChoice, ResolvedMove, RotationAction } from '../rotation';
import type { MemberInput, SetSelection } from '../stats';
import {
  PROJECT_SCHEMA_VERSION,
  indexMoves,
  resolveMove,
  type EffectsData,
  type GameData,
  type MemberRef,
  type RotationProject,
} from '../project';
import { characterTag, gearTag, labelTag, type ExtraBuff, type GlobalConfig, type TeamInput } from '../team';

export const PLANILHA_AMP_COEFFICIENT = AMP_EM_COEFFICIENT_SHEET;

export interface PlanilhaImport {
  team: TeamInput;
  actions: RotationAction[];
  flatEffects: FlatDamageEffect[];
  /** Nomes dos perfis e as etiquetas que cada um ativa. */
  profiles: Record<string, string[]>;
  warnings: string[];
}

const SLOT_COLUMNS = ['B', 'C', 'D', 'E'] as const;
const TALENT_BY_PT: Record<string, Talent> = { Normal: 'normal', Habilidade: 'skill', Supremo: 'burst' };
const TEAM_BUFF_STATS = new Set(['ATK%', 'ATK', 'EM', 'DMG%', 'DMG% Normal', 'DMG% Carregado', 'DMG% Habilidade', 'DMG% Supremo']);

function cell(ws: WorkSheet, ref: string): unknown {
  const c = ws[ref];
  return c === undefined ? undefined : c.v;
}
const str = (ws: WorkSheet, ref: string) => {
  const v = cell(ws, ref);
  return v === undefined || v === null ? '' : String(v).trim();
};
const num = (ws: WorkSheet, ref: string, fallback = 0) => {
  const v = cell(ws, ref);
  if (v === undefined || v === '' || v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const yes = (v: unknown) => v === true || (typeof v === 'string' && v.trim().toLowerCase() === 'sim');

function sheet(wb: WorkBook, name: string): WorkSheet {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`A planilha não tem a aba "${name}"`);
  return ws;
}

function findByName<T extends { name: string }>(list: T[], name: string, what: string): T {
  const found = list.find((x) => x.name === name);
  if (!found) throw new Error(`${what} "${name}" não existe nos dados do Lunaris`);
  return found;
}

function rarityOf(v: unknown): Rarity {
  return v === 4 || v === false || String(v) === '4' ? 4 : 5;
}

export function importPlanilha(wb: WorkBook, data: GameData, effects: EffectsData): PlanilhaImport {
  const warnings: string[] = [];
  const time = sheet(wb, 'Time');

  // ---- Configuração geral ----
  const config: GlobalConfig = {
    characterLevel: num(time, 'B23', 90),
    enemyLevel: num(time, 'B24', 100),
    enemyBaseRes: num(time, 'B25', 0.1),
    enemyDefRed: num(time, 'B26', 0),
    minRollsPerSubstat: num(time, 'B27', 2),
    rotationDuration: num(time, 'B28', 20),
  };

  // ---- Membros ----
  const members: MemberInput[] = [];
  for (const col of SLOT_COLUMNS) {
    const name = str(time, `${col}4`);
    if (!name) continue;

    const setOf = (ref: string): SetSelection | undefined => {
      const n = str(time, ref);
      if (!n) return undefined;
      return { name: n, effect: effects.sets.find((s) => s.set === n) };
    };
    const goblet = str(time, `${col}9`);
    const weaponName = str(time, `${col}5`);
    const forced = cell(time, `${col}21`);
    const totalRolls = cell(time, `${col}20`);
    const rarity: Record<PieceSlot, Rarity> = {
      flower: rarityOf(cell(time, `${col}11`)),
      plume: rarityOf(cell(time, `${col}12`)),
      sands: rarityOf(cell(time, `${col}13`)),
      goblet: rarityOf(cell(time, `${col}14`)),
      circlet: rarityOf(cell(time, `${col}15`)),
    };

    members.push({
      character: findByName(data.characters, name, 'Personagem'),
      weapon: findByName(data.weapons, weaponName, 'Arma'),
      characterEffect: effects.characters.find((c) => c.character === name),
      weaponEffect: effects.weapons.find((w) => w.weapon === weaponName),
      primarySet: setOf(`${col}6`),
      secondarySet: setOf(`${col}7`),
      artifacts: {
        rarity,
        sands: str(time, `${col}8`),
        goblet: goblet === 'DMG% elemental' ? 'DMG%' : goblet,
        circlet: str(time, `${col}10`),
      },
      talents: {
        normal: num(time, `${col}16`, 10),
        skill: num(time, `${col}17`, 10),
        burst: num(time, `${col}18`, 10),
      },
      minER: num(time, `${col}19`, 0),
      totalRolls: totalRolls === undefined || totalRolls === '' ? undefined : Number(totalRolls),
      forcedCritRolls: forced === undefined || forced === '' ? undefined : Number(forced),
    });
  }
  const names = members.map((m) => m.character.name);

  // ---- Buffs extras ----
  const extras: ExtraBuff[] = [];
  for (let r = 32; r <= 51; r++) {
    const stat = str(time, `B${r}`);
    const target = str(time, `A${r}`);
    if (!stat || !target) continue;
    const team = yes(cell(time, `D${r}`));
    if (team && !TEAM_BUFF_STATS.has(stat)) {
      warnings.push(`Buff de time com stat "${stat}" (linha ${r}) é ignorado pela planilha: só ATK%, ATK, EM e DMG% valem.`);
      continue;
    }
    extras.push({
      target: target.toLowerCase() === 'todos' ? 'all' : target,
      stat,
      value: num(time, `C${r}`),
      team,
      label: str(time, `F${r}`) || undefined,
      description: str(time, `E${r}`) || undefined,
    });
  }

  // ---- Perfis de buff → etiquetas ----
  const pf = sheet(wb, 'Perfis de buff');
  const columnTags: Record<string, string> = {};
  names.forEach((_, i) => {
    columnTags[['B', 'D', 'F', 'H'][i]] = characterTag(i);
    columnTags[['C', 'E', 'G', 'I'][i]] = gearTag(i);
  });
  columnTags.J = labelTag(undefined);
  for (const col of ['K', 'L', 'M', 'N']) columnTags[col] = labelTag(str(pf, `${col}3`));

  const profiles: Record<string, string[]> = {};
  for (let r = 4; r <= 8; r++) {
    const name = str(pf, `A${r}`);
    if (!name) continue;
    profiles[name] = Object.entries(columnTags)
      .filter(([col]) => yes(cell(pf, `${col}${r}`)))
      .map(([, tag]) => tag);
  }

  // ---- Golpes extras ----
  const ex = sheet(wb, 'Golpes extras');
  const extraMoves = new Map<string, { base: string; scale: ExtraScale }>();
  for (let r = 2; r <= 101; r++) {
    const name = str(ex, `A${r}`);
    if (!name) continue;
    const base = str(ex, `B${r}`);
    if (!base) {
      warnings.push(`Golpe extra "${name}" sem golpe base foi ignorado.`);
      continue;
    }
    extraMoves.set(name, {
      base,
      scale: { atk: num(ex, `E${r}`), em: num(ex, `F${r}`), hp: num(ex, `G${r}`), def: num(ex, `H${r}`) },
    });
  }

  const moveIndex = indexMoves(data.moves);
  const resolve = (displayName: string): ResolvedMove => {
    const extra = extraMoves.get(displayName);
    const baseName = extra ? extra.base : displayName;
    const m = /^(.+?) - (Normal|Habilidade|Supremo): (.+)$/.exec(baseName);
    if (!m) throw new Error(`Não consegui interpretar o golpe "${baseName}" (esperado "Personagem - Talento: Rótulo")`);
    const [, character, talentPt, label] = m;
    return resolveMove(moveIndex, { character, talent: TALENT_BY_PT[talentPt], label, variant: 0 }, displayName, extra?.scale);
  };

  // ---- Rotação ----
  const rot = sheet(wb, 'Rotação');
  const actions: RotationAction[] = [];
  for (let r = 5; r <= 64; r++) {
    const name = str(rot, `A${r}`);
    if (!name) continue;
    const move = resolve(name);
    const member = names.indexOf(move.character);
    if (member < 0) throw new Error(`Linha ${r}: "${move.character}" não está na equipa`);

    const reactionPt = str(rot, `C${r}`);
    const reaction: ReactionChoice = reactionPt === 'Derreter' ? 'melt' : reactionPt === 'Vaporizar' ? 'vaporize' : 'none';

    const rawProfile = cell(rot, `D${r}`);
    const profile = rawProfile === undefined || rawProfile === '' || rawProfile === true || rawProfile === 'Sim'
      ? 'Todos'
      : rawProfile === false || rawProfile === 'Não'
        ? 'Nenhum'
        : String(rawProfile).trim();
    if (!(profile in profiles)) warnings.push(`Linha ${r}: perfil "${profile}" não existe; a planilha o trata como "Todos".`);
    const activeTags = profiles[profile] ?? profiles.Todos ?? [];

    actions.push({
      id: `row-${r}`,
      member,
      // Atalho da planilha: o elemento de todo golpe é o do personagem.
      move: { ...move, element: members[member].character.element },
      executions: num(rot, `B${r}`, 1) || 1,
      reaction,
      activeTags,
      dmgAdjust: num(rot, `E${r}`, 0),
      note: str(rot, `AN${r}`) || undefined,
    });
  }

  return {
    team: { members, extras, config },
    actions,
    flatEffects: effects.flatDamage,
    profiles,
    warnings,
  };
}


export interface ProjectFromPlanilhaOptions {
  id: string;
  name: string;
  gameVersion: string;
  /** Instante (s) de cada ação. Padrão: 1 s entre ações, na ordem da planilha. */
  timeOf?: (action: RotationAction, index: number) => number;
  now?: string;
}

/** Converte o que foi importado da planilha num `RotationProject` salvo (modo compat "planilha"). */
export function projectFromPlanilha(imported: PlanilhaImport, options: ProjectFromPlanilhaOptions): RotationProject {
  const now = options.now ?? new Date().toISOString();
  const { team } = imported;
  const members: MemberRef[] = team.members.map((m) => ({
    character: m.character.name,
    weapon: m.weapon.name,
    primarySet: m.primarySet?.name,
    secondarySet: m.secondarySet?.name,
    artifacts: m.artifacts,
    talents: m.talents,
    minER: m.minER || undefined,
    totalRolls: m.totalRolls,
    forcedCritRolls: m.forcedCritRolls,
  }));

  const hasExtra = (x?: ExtraScale) => !!x && Object.values(x).some((v) => v);
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: options.id,
    name: options.name,
    gameVersion: options.gameVersion,
    compat: 'planilha',
    config: { ...team.config },
    members,
    extras: team.extras.map((e) => ({ ...e })),
    actions: imported.actions.map((a, i) => ({
      id: a.id,
      member: a.member,
      move: { character: a.move.character, talent: a.move.talent, label: a.move.label, variant: 0 },
      displayName: a.move.displayName,
      extraScale: hasExtra(a.move.extra) ? a.move.extra : undefined,
      executions: a.executions,
      reaction: a.reaction,
      activeTags: [...a.activeTags],
      tagSource: 'manual' as const,
      dmgAdjust: a.dmgAdjust,
      time: options.timeOf ? options.timeOf(a, i) : i,
      note: a.note,
    })),
    buffWindows: [],
    disabled: [],
    profiles: imported.profiles,
    meta: { tags: [], createdAt: now, updatedAt: now },
  };
}
