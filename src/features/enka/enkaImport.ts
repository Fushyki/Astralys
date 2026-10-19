/**
 * Importa a vitrine de um jogador (Enka.Network, a mesma fonte do akasha.cv) como um inventário GOOD parcial: só os
 * personagens da vitrine (até 8) com a arma e as 5 peças equipadas. Dali o fluxo do GOOD aplica o build real.
 *
 * Os ids do Enka batem com os dos dados do jogo: avatarId = id do personagem, itemId da arma = id da arma e
 * `setId` do artefato = id do set. O Viajante não é importado (os ids dele variam por elemento).
 */
import type { Good, GoodArtifact } from '../good/goodImport';
import { buildFromGood, norm } from '../good/goodImport';
import type { GameData, MemberRef } from '../../engine';
import skillOrder from './skillOrder.json';

export interface EnkaResponse {
  uid?: string;
  playerInfo?: { nickname?: string; level?: number };
  avatarInfoList?: EnkaAvatar[];
}

interface EnkaEquip {
  itemId: number;
  weapon?: { level?: number; affixMap?: Record<string, number> };
  reliquary?: { level?: number };
  flat?: {
    rankLevel?: number;
    setId?: number;
    equipType?: string;
    reliquarySubstats?: { appendPropId: string; statValue: number }[];
    reliquaryMainstat?: { mainPropId: string; statValue: number };
  };
}

export interface EnkaAvatar {
  avatarId: number;
  talentIdList?: number[];
  skillLevelMap?: Record<string, number>;
  propMap?: Record<string, { val?: string; ival?: string }>;
  equipList?: EnkaEquip[];
}

/** FIGHT_PROP_* do Enka → chave do GOOD. Valores em % já vêm em unidades de percentual (10,5 = 10,5%). */
const PROP_KEY: Record<string, string> = {
  FIGHT_PROP_HP: 'hp',
  FIGHT_PROP_HP_PERCENT: 'hp_',
  FIGHT_PROP_ATTACK: 'atk',
  FIGHT_PROP_ATTACK_PERCENT: 'atk_',
  FIGHT_PROP_DEFENSE: 'def',
  FIGHT_PROP_DEFENSE_PERCENT: 'def_',
  FIGHT_PROP_ELEMENT_MASTERY: 'eleMas',
  FIGHT_PROP_CHARGE_EFFICIENCY: 'enerRech_',
  FIGHT_PROP_CRITICAL: 'critRate_',
  FIGHT_PROP_CRITICAL_HURT: 'critDMG_',
  FIGHT_PROP_HEAL_ADD: 'heal_',
  FIGHT_PROP_FIRE_ADD_HURT: 'pyro_dmg_',
  FIGHT_PROP_WATER_ADD_HURT: 'hydro_dmg_',
  FIGHT_PROP_WIND_ADD_HURT: 'anemo_dmg_',
  FIGHT_PROP_ELEC_ADD_HURT: 'electro_dmg_',
  FIGHT_PROP_ICE_ADD_HURT: 'cryo_dmg_',
  FIGHT_PROP_ROCK_ADD_HURT: 'geo_dmg_',
  FIGHT_PROP_GRASS_ADD_HURT: 'dendro_dmg_',
  FIGHT_PROP_PHYSICAL_ADD_HURT: 'physical_dmg_',
};

const SLOT_OF: Record<string, GoodArtifact['slotKey']> = {
  EQUIP_BRACER: 'flower',
  EQUIP_NECKLACE: 'plume',
  EQUIP_SHOES: 'sands',
  EQUIP_RING: 'goblet',
  EQUIP_DRESS: 'circlet',
};

export interface EnkaImport {
  nickname: string;
  uid: string;
  good: Good;
  /** Nomes dos personagens importados, na ordem da vitrine. */
  characters: string[];
  notes: string[];
}

const ORDER = skillOrder as Record<string, number[]>;

/** [normal, habilidade, supremo]: a ordem oficial do Enka quando conhecida; senão, a ordem crescente dos ids. */
function talentIds(avatarId: number, levels: Record<string, number>): { ids: number[]; known: boolean } {
  const official = ORDER[String(avatarId)];
  if (official) return { ids: official, known: true };
  return { ids: Object.keys(levels).map(Number).sort((a, b) => a - b).slice(0, 3), known: false };
}

export function enkaToGood(enka: EnkaResponse, game: Pick<GameData, 'characters' | 'weapons' | 'artifacts'>): EnkaImport {
  const notes: string[] = [];
  const good: Good = { format: 'GOOD', source: 'Enka.Network', characters: [], weapons: [], artifacts: [] };
  const characters: string[] = [];
  const list = enka.avatarInfoList ?? [];
  if (!list.length) {
    notes.push('A vitrine deste jogador está vazia ou privada. No jogo: Perfil > Editar > Vitrine de personagens, e ative "Mostrar detalhes dos personagens".');
  }

  for (const a of list) {
    const character = game.characters.find((c) => c.id === String(a.avatarId));
    if (!character) {
      notes.push(a.avatarId === 10000005 || a.avatarId === 10000007 ? 'O Viajante não é importado (use o inventário GOOD para ele).' : `Personagem ${a.avatarId} não existe nos dados do jogo; ignorado.`);
      continue;
    }
    const levels = a.skillLevelMap ?? {};
    const { ids, known } = talentIds(a.avatarId, levels);
    if (!known) notes.push(`${character.name}: personagem novo demais para a tabela de talentos; assumi a ordem normal, habilidade e supremo pela numeração.`);
    const lvl = (i: number) => levels[String(ids[i])] ?? 1;
    good.characters.push({
      key: character.name,
      level: Number(a.propMap?.['4001']?.val ?? a.propMap?.['4001']?.ival ?? 0) || undefined,
      constellation: a.talentIdList?.length ?? 0,
      talent: { auto: lvl(0), skill: lvl(1), burst: lvl(2) },
    });
    characters.push(character.name);

    for (const e of a.equipList ?? []) {
      if (e.weapon) {
        const w = game.weapons.find((x) => x.id === e.itemId);
        if (!w) {
          notes.push(`${character.name}: arma ${e.itemId} não existe nos dados do jogo; mantive a arma atual.`);
          continue;
        }
        const affix = Object.values(e.weapon.affixMap ?? {})[0] ?? 0;
        good.weapons.push({ key: w.name, level: e.weapon.level, refinement: Math.min(5, Math.max(1, affix + 1)), location: character.name });
      } else if (e.flat?.equipType && SLOT_OF[e.flat.equipType]) {
        const set = game.artifacts.find((s) => s.id === e.flat?.setId);
        if (!set) {
          notes.push(`${character.name}: set ${e.flat.setId} não existe nos dados do jogo; peça ignorada.`);
          continue;
        }
        const mainKey = PROP_KEY[e.flat.reliquaryMainstat?.mainPropId ?? ''];
        if (!mainKey) {
          notes.push(`${character.name}: main stat ${e.flat.reliquaryMainstat?.mainPropId} não reconhecido; peça ignorada.`);
          continue;
        }
        good.artifacts.push({
          setKey: set.name,
          slotKey: SLOT_OF[e.flat.equipType],
          rarity: e.flat.rankLevel ?? 5,
          mainStatKey: mainKey,
          substats: (e.flat.reliquarySubstats ?? [])
            .map((s) => ({ key: PROP_KEY[s.appendPropId], value: s.statValue }))
            .filter((s): s is { key: string; value: number } => !!s.key),
          location: character.name,
          level: e.reliquary?.level,
        });
      }
    }
  }
  return { nickname: enka.playerInfo?.nickname ?? '', uid: enka.uid ?? '', good, characters, notes };
}

/**
 * Junta a vitrine a um inventário que o usuário já tem: os personagens da vitrine substituem os do inventário
 * (com a arma e as peças equipadas deles); o resto do inventário fica como estava.
 */
export function mergeGood(base: Good | null, incoming: Good): Good {
  if (!base) return incoming;
  const replaced = new Set(incoming.characters.map((c) => norm(c.key)));
  return {
    ...base,
    characters: [...base.characters.filter((c) => !replaced.has(norm(c.key))), ...incoming.characters],
    weapons: [...base.weapons.filter((w) => !replaced.has(norm(w.location))), ...incoming.weapons],
    artifacts: [...base.artifacts.filter((a) => !replaced.has(norm(a.location))), ...incoming.artifacts],
  };
}

/** Aplica ao time os builds reais da vitrine (quem não está nela fica como estava). */
export function applyGoodToMembers(
  members: MemberRef[],
  good: Good,
  game: Pick<GameData, 'characters' | 'weapons' | 'artifacts'>,
): { members: MemberRef[]; applied: string[]; missing: string[] } {
  const applied: string[] = [];
  const missing: string[] = [];
  const next = members.map((m) => {
    if (!good.characters.some((c) => norm(c.key) === norm(m.character))) {
      missing.push(m.character);
      return m;
    }
    const { patch } = buildFromGood(good, m.character, game);
    applied.push(m.character);
    return { ...m, ...patch };
  });
  return { members: next, applied, missing };
}
