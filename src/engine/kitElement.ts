/**
 * Elemento padrão de cada golpe do kit, pelas mesmas regras do Genshin Optimizer (`inferredHitEle` em
 * libs/gi/sheets/src/Characters/dataUtil.tsx, MIT; ver THIRD_PARTY_NOTICES.md):
 *  - Habilidade e Supremo: o elemento do personagem;
 *  - Ataque normal, carregado e de queda: o elemento do personagem para quem usa Catalisador, Físico para espada, montante,
 *    lança e arco (um arco só tem o elemento no tiro carregado completo);
 *  - golpes elementais que ficam dentro do Ataque Normal (flechas especiais, Riptide, Frostflake…): o elemento do personagem;
 *  - infusão (Hu Tao, Xiao, Yoimiya, Keqing, Diluc…): escolhida pelo usuário por personagem (`normalInfusion`) ou por golpe.
 */
import type { Character } from '../data/schema';
import type { ElementOrPhysical } from './constants/reactions';

/** Golpes de Ataque Normal que o jogo marca como elementais mesmo em quem usa arma física (casados pelo rótulo em inglês do Lunaris). */
const ELEMENTAL_NORMALS: Record<string, RegExp> = {
  Tartaglia: /Riptide/i,
  Ganyu: /Frostflake/i,
  Yoimiya: /Kindling/i,
  Yelan: /Breakthrough Barb/i,
  Tighnari: /Clusterbloom|Wreath/i,
  Lyney: /Prop Arrow|Pyrotechnic|Spiritbreath/i,
  Furina: /Spiritbreath|Surging Blade/i,
  Sigewinne: /Bubble/i,
  Sethos: /Shadowpiercing/i,
  Iansan: /Swift Stormflight/i,
  Sandrone: /Charged Attack|Power Overdrive/i,
  Xilonen: /Blade Roller/i,
};

/**
 * Infusões do kit que o jogo liga em certas condições (o usuário escolhe se estão ativas): elemento e quando acontece.
 * Vêm das fichas do Genshin Optimizer (`infusion` em cada personagem).
 */
export const KIT_INFUSIONS: Record<string, { element: ElementOrPhysical; when: string }> = {
  Alhaitham: { element: 'Dendro', when: 'com os Espelhos de Projeção' },
  'Arataki Itto': { element: 'Geo', when: 'durante o Supremo' },
  Arlecchino: { element: 'Pyro', when: 'com o Vínculo da Vida cheio' },
  Chiori: { element: 'Geo', when: 'depois do bônus da passiva A1' },
  Chongyun: { element: 'Cryo', when: 'dentro do campo da habilidade' },
  Cyno: { element: 'Electro', when: 'durante o Supremo' },
  Diluc: { element: 'Pyro', when: 'durante o Supremo' },
  Dori: { element: 'Electro', when: 'na C6, depois da habilidade' },
  Emilie: { element: 'Dendro', when: 'na C6, com a Fragrância' },
  Furina: { element: 'Hydro', when: 'na C6' },
  'Hu Tao': { element: 'Pyro', when: 'no Paramita Papilio' },
  'Kaedehara Kazuha': { element: 'Anemo', when: 'na C6' },
  'Kamisato Ayaka': { element: 'Cryo', when: 'depois da corrida' },
  Kaveh: { element: 'Dendro', when: 'depois do Supremo' },
  Keqing: { element: 'Electro', when: 'depois de reativar a habilidade' },
  Lynette: { element: 'Anemo', when: 'na C6' },
  Navia: { element: 'Geo', when: 'depois da habilidade (passiva A1)' },
  Noelle: { element: 'Geo', when: 'durante o Supremo' },
  'Raiden Shogun': { element: 'Electro', when: 'durante o Supremo' },
  Vesna: { element: 'Anemo', when: 'com a habilidade armada' },
  Xiao: { element: 'Anemo', when: 'durante o Supremo' },
  Yoimiya: { element: 'Pyro', when: 'durante a habilidade' },
  Xilonen: { element: 'Geo', when: 'no Nightsoul' },
};

export interface KitMoveLike {
  talent: string;
  hitType: string;
  label: string;
}

/** Elemento do golpe pelo kit. `infusion` é a infusão de Ataque Normal escolhida para o personagem (ou undefined). */
export function kitElement(character: Pick<Character, 'name' | 'element' | 'weapon'>, move: KitMoveLike, infusion?: ElementOrPhysical): ElementOrPhysical {
  const own = character.element as ElementOrPhysical;
  // Habilidade e Supremo (inclusive os golpes de Ataque Normal que o personagem faz durante a habilidade): o elemento dele.
  if (move.talent !== 'normal') return own;
  if (character.weapon === 'Catalyst') return own;
  if (ELEMENTAL_NORMALS[character.name]?.test(move.label)) return own;
  const basic = move.hitType === 'normal' || move.hitType === 'charged' || move.hitType === 'plunge';
  if (character.weapon === 'Bow') {
    // O tiro carregado completo é elemental; os outros golpes do arco são Físicos.
    if (move.hitType === 'charged' && /fully-charged/i.test(move.label)) return own;
    return 'Physical';
  }
  if (basic && infusion) return infusion;
  return 'Physical';
}
