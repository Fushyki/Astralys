/** Nomes em português dos stats do GOOD e formatação de valores (main stats e substats dos artefatos). */
import { formatDecimal, formatInt } from '../../ui/format';

export const MAIN_LABEL: Record<string, string> = {
  hp: 'HP', atk: 'ATK', hp_: 'HP%', atk_: 'ATK%', def_: 'DEF%', eleMas: 'Maestria', enerRech_: 'Recarga', critRate_: 'Taxa Crítica',
  critDMG_: 'Dano Crítico', heal_: 'Cura', pyro_dmg_: 'DMG Pyro', hydro_dmg_: 'DMG Hydro', cryo_dmg_: 'DMG Cryo', electro_dmg_: 'DMG Electro',
  anemo_dmg_: 'DMG Anemo', geo_dmg_: 'DMG Geo', dendro_dmg_: 'DMG Dendro', physical_dmg_: 'DMG Físico',
};

export const SUB_LABEL: Record<string, string> = { hp: 'HP', hp_: 'HP%', atk: 'ATK', atk_: 'ATK%', def: 'DEF', def_: 'DEF%', eleMas: 'EM', enerRech_: 'ER', critRate_: 'CR', critDMG_: 'CD' };

const PERCENT = new Set(['hp_', 'atk_', 'def_', 'enerRech_', 'critRate_', 'critDMG_', 'heal_', 'pyro_dmg_', 'hydro_dmg_', 'cryo_dmg_', 'electro_dmg_', 'anemo_dmg_', 'geo_dmg_', 'dendro_dmg_', 'physical_dmg_']);

/** Substats em % chegam em unidades de percentual (10,5 = 10,5%); main stats em fração (0,466 = 46,6%). */
export function formatSub(key: string, value: number): string {
  return PERCENT.has(key) ? `${formatDecimal(value, 1)}%` : formatInt(value);
}

export function formatMain(key: string, fraction: number): string {
  return PERCENT.has(key) ? `${formatDecimal(fraction * 100, 1)}%` : formatInt(fraction);
}

const normKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Nome de exibição de um personagem que vem do GOOD (`KaedeharaKazuha` → "Kaedehara Kazuha", `YumemizukiMizuki` → "Yumemizuki Mizuki").
 * Com a lista de personagens do jogo, vale o nome oficial; sem ela (ou sem achar), separa as palavras da chave. O Viajante do GOOD é "Viajante".
 */
export function characterDisplayName(key: string, characters?: readonly { name: string }[]): string {
  const hit = characters?.find((c) => normKey(c.name) === normKey(key));
  if (hit) return hit.name;
  if (/^traveler/i.test(key)) return 'Viajante';
  return key.replace(/([a-z])([A-Z])/g, '$1 $2');
}

/** Chaves de dono do GOOD que não casam com nenhum personagem dos dados (para listar nomes sem mapeamento). */
export function unmappedOwnerKeys(owners: readonly string[], characters: readonly { name: string }[]): string[] {
  return [...new Set(owners.filter((o) => o && !characters.some((c) => normKey(c.name) === normKey(o))))].sort();
}
