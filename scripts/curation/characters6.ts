/**
 * Curadoria de passivas e constelações, lote 6: conversões de stat (`convert`). O valor é `coeficiente × stat da fonte`
 * calculado pelo motor com os rolls otimizados (ver `BuffConvertSchema`). Mesmas regras de `characters2.ts`.
 */
import type { BuffCuration } from './characters';

export const CHARACTERS_6: Record<string, BuffCuration[]> = {
  'Kaedehara Kazuha': [
    { id: 'a4', label: 'Kazuha A4', src: 'p2', scope: 'team', timed: true, convert: { from: 'em', perPoint: { p: 0 }, to: ['dmgPct'] }, expect: 'Elemental DMG Bonus to the element absorbed by Swirl for every point of Elemental Mastery', note: '+0,04% de DMG do elemento absorvido por ponto de Maestria dele, por 8 s depois do Espalhar: ligue nas janelas em que o elemento bate com o de quem ataca.' },
    { id: 'c6', label: 'Kazuha C6', src: 'const6', scope: 'self', timed: true, convert: { from: 'em', perPoint: { p: 0 }, to: ['normal', 'charged', 'plunge'] }, expect: 'each point of Elemental Mastery will increase the DMG dealt by Kaedehara Kazuha', note: '+0,2% de DMG de Normal/Carregado/Plunging por ponto de Maestria, por 5 s depois da habilidade ou Supremo: ligue nas janelas.' },
  ],
  Sucrose: [
    { id: 'a4', label: 'Sucrose A4', src: 'p2', scope: 'others', timed: true, convert: { from: 'em', perPoint: { p: 0 }, to: ['em'] }, expect: "equal to 20% of Sucrose's Elemental Mastery", note: '+20% da Maestria da Sucrose para os demais por 8 s depois da habilidade ou Supremo: ligue nas janelas.' },
  ],
  'Raiden Shogun': [
    { id: 'a4', label: 'Raiden A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'er', perPoint: { p: 2, x: 100 }, threshold: 1, to: ['dmgPct'] }, expect: 'grants her', note: '+0,4% de DMG Electro por 1% de Recarga acima de 100%, sempre. A energia extra do Musou Isshin não entra.' },
  ],
  Mona: [
    { id: 'a4', label: 'Mona A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'er', perPoint: { p: 1 }, to: ['dmgPct'] }, expect: 'equivalent to 20% of her Energy Recharge rate', note: 'DMG Hydro = 20% da Recarga total (ex.: 200% de Recarga dá +40%), sempre.' },
  ],
  Tighnari: [
    { id: 'a4', label: 'Tighnari A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'em', perPoint: { p: 0 }, cap: { p: 1 }, to: ['charged'] }, expect: 'his Charged Attack and Fashioner\'s Tanglevine Shaft DMG are increased by 0.06%', note: '+0,06% de DMG de Ataque Carregado por ponto de Maestria, teto de 60%, sempre. O Tanglevine Shaft (Supremo) não entra.' },
  ],
  'Yae Miko': [
    { id: 'a4', label: 'Yae A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'em', perPoint: { p: 0 }, to: ['skill'] }, expect: 'will increase Sesshou Sakura DMG by 0.15%', note: '+0,15% de DMG da habilidade (Sesshou Sakura) por ponto de Maestria, sempre.' },
  ],
  Noelle: [
    { id: 'c6', label: 'Noelle C6', src: 'const6', scope: 'self', timed: true, convert: { from: 'def', perPoint: { p: 0 }, to: ['atkFlat'] }, expect: "increases Noelle's ATK by an additional 50% of her DEF", note: '+50% da DEF dela como ATK fixo durante o Supremo: ligue nas janelas.' },
  ],
  Nilou: [
    { id: 'c6cr', label: 'Nilou C6 (Taxa Crítica)', src: 'const6', scope: 'self', timed: false, convert: { from: 'hp', perPoint: { p: 0, x: 0.001 }, cap: { p: 2 }, to: ['critRate'] }, expect: 'For every 1,000 points of Max HP', note: '+0,6% de Taxa Crítica a cada 1.000 de HP máximo, teto de 30%, sempre.' },
    { id: 'c6cd', label: 'Nilou C6 (Dano Crítico)', src: 'const6', scope: 'self', timed: false, convert: { from: 'hp', perPoint: { p: 1, x: 0.001 }, cap: { p: 3 }, to: ['critDmg'] }, expect: 'CRIT Rate and CRIT DMG will increase by 0.6% and 1.2%', note: '+1,2% de Dano Crítico a cada 1.000 de HP máximo, teto de 60%, sempre.' },
  ],
  Nahida: [
    { id: 'a1', label: 'Nahida A1', src: 'p1', scope: 'others', timed: true, convert: { from: 'em', source: 'highestEm', perPoint: { p: 0 }, cap: { p: 1 }, to: ['em'] }, expect: 'increased by 25% of the Elemental Mastery of the party member with the highest Elemental Mastery', note: '+25% da maior Maestria do time (teto de 250) para os demais dentro do campo do Supremo: ligue nas janelas.' },
  ],
  Chevreuse: [
    { id: 'a4', label: 'Chevreuse A4', src: 'p2', scope: 'others', timed: true, forElements: ['Pyro', 'Electro'], convert: { from: 'hp', perPoint: { p: 0, x: 0.001 }, cap: { p: 2 }, to: ['atkPct'] }, expect: 'gain 1% increased ATK for every 1,000 Max HP', note: '+1% de ATK por 1.000 de HP máximo dela (teto de 40%) para os Pyro e Electro por 30 s: ligue nas janelas.' },
  ],
};

/** Buffs que dependem da composição do time (`team`). */
export const CHARACTERS_7: Record<string, BuffCuration[]> = {
  Lynette: [
    { id: 'a1', label: 'Lynette A1', src: 'p1', scope: 'team', timed: true, stats: { atkPct: { lit: 1 } }, team: { scale: { of: 'distinct', table: [{ p: 1 }, { p: 2 }, { p: 3 }, { p: 4 }] } }, expect: "when there are 1/2/3/4 Elemental Types in the party, all party members' ATK will be increased by 8%/12%/16%/20%", note: '+8/12/16/20% de ATK da equipe conforme o nº de elementos diferentes no time, por 10 s depois da habilidade: ligue nas janelas.' },
  ],
  Escoffier: [
    { id: 'a4', label: 'Escoffier A4', src: 'p2', scope: 'self', timed: false, resShred: { value: { lit: 1 }, elements: ['Hydro', 'Cryo'] }, team: { scale: { of: ['Hydro', 'Cryo'], table: [{ p: 0 }, { p: 1 }, { p: 2 }, { p: 3 }] } }, expect: 'decrease the Hydro RES and Cryo RES of any opponents hit by her Elemental Skill', note: 'Redução de RES Hydro e Cryo de 5/10/15/55% conforme o nº de Hydro e Cryo no time (a Escoffier conta), sempre ativa.' },
  ],
  Chevreuse: [
    { id: 'a1', label: 'Chevreuse A1', src: 'p1', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Pyro', 'Electro'] }, team: { only: ['Pyro', 'Electro'], eachOf: ['Pyro', 'Electro'] }, expect: 'the Pyro and Electro RES of the opponent(s) affected by this Overloaded reaction will be decreased by 40%', note: 'Só com time de Pyro e Electro (ao menos um de cada). Assume a redução de RES Pyro e Electro (6 s, depois de Sobrecarregar) sempre ativa.' },
  ],
};

/** Efeitos do kit (habilidade e supremo) que crescem com o nível do talento (`kit`). */
export const CHARACTERS_8: Record<string, BuffCuration[]> = {
  'Hu Tao': [
    { id: 'paramita', label: 'Hu Tao: Paramita', src: 'kit', kit: { talent: 'skill', key: 'ATK Increase' }, scope: 'self', timed: true, convert: { from: 'hp', perPoint: { lit: 1 }, capBaseAtk: 4, to: ['atkFlat'] }, expect: 'ATK Bonus gained this way cannot exceed 400%', note: 'ATK fixo = % do HP máximo (pelo nível da habilidade), limitado a 400% do ATK base, por 9 s: ligue nas janelas. O HP é o total do build, sem a perda de HP da ativação.' },
  ],
  Xiao: [
    { id: 'burst', label: 'Xiao: Máscara Yaksha', src: 'kit', kit: { talent: 'burst', key: 'Normal/Charged/Plunging Attack DMG Bonus' }, scope: 'self', timed: true, stats: { byType: { normal: { lit: 1 }, charged: { lit: 1 }, plunge: { lit: 1 } } }, expect: 'Increases his attack AoE and attack DMG', note: 'DMG de Normal/Carregado/Plunging pelo nível do Supremo, durante a máscara: ligue nas janelas.' },
  ],
  Mona: [
    { id: 'burst', label: 'Mona: Presságio', src: 'kit', kit: { talent: 'burst', key: 'DMG Bonus' }, scope: 'team', timed: true, stats: { dmgPct: { lit: 1 } }, expect: 'increases DMG taken by opponents', note: 'DMG da equipe contra inimigos com Presságio, pelo nível do Supremo (o aumento do golpe que o aplica não entra): ligue nas janelas.' },
  ],
  Yanfei: [
    { id: 'burst', label: 'Yanfei: Brilho', src: 'kit', kit: { talent: 'burst', key: 'Charged Attack DMG Bonus' }, scope: 'self', timed: true, stats: { byType: { charged: { lit: 1 } } }, expect: 'Increases the DMG dealt by her Charged Attacks', note: 'DMG de Ataque Carregado pelo nível do Supremo, enquanto o Brilho durar: ligue nas janelas.' },
  ],
  Noelle: [
    { id: 'burst', label: 'Noelle: Varredura', src: 'kit', kit: { talent: 'burst', key: 'ATK Bonus' }, scope: 'self', timed: true, convert: { from: 'def', perPoint: { lit: 1 }, to: ['atkFlat'] }, expect: 'Increased ATK that scales based on her DEF', note: 'ATK fixo = % da DEF pelo nível do Supremo: ligue nas janelas.' },
  ],
  'Arataki Itto': [
    { id: 'burst', label: 'Itto: Rei Oni', src: 'kit', kit: { talent: 'burst', key: 'ATK Bonus' }, scope: 'self', timed: true, convert: { from: 'def', perPoint: { lit: 1 }, to: ['atkFlat'] }, expect: 'increases his ATK based on his DEF', note: 'ATK fixo = % da DEF pelo nível do Supremo, durante o Rei Oni: ligue nas janelas. A queda de 20% de RES dele não entra.' },
  ],
  'Kujou Sara': [
    { id: 'skill', label: 'Sara: Tengu Juurai', src: 'kit', kit: { talent: 'skill', key: 'ATK Bonus Ratio' }, scope: 'team', timed: true, convert: { from: 'baseAtk', perPoint: { lit: 1 }, to: ['atkFlat'] }, expect: "an ATK Bonus based on Kujou Sara's Base ATK", note: 'ATK fixo = % do ATK base dela (pelo nível da habilidade) para o personagem em campo: ligue nas janelas.' },
  ],
  Eula: [
    { id: 'skill', label: 'Eula: Lacerar (RES)', src: 'kit', kit: { talent: 'skill', key: 'Cryo RES Decrease' }, scope: 'self', timed: false, resShred: { value: { lit: 1 }, elements: ['Cryo'] }, expect: 'Physical RES and Cryo RES decreased', note: 'Assume a redução de RES Cryo da versão segurada da habilidade sempre ativa (a Física não entra).' },
  ],
  Shenhe: [
    { id: 'burst', label: 'Shenhe: Campo (RES)', src: 'kit', kit: { talent: 'burst', key: 'RES Decrease' }, scope: 'self', timed: false, resShred: { value: { lit: 1 }, elements: ['Cryo'] }, expect: 'decreases the Cryo RES and Physical RES of opponents within it', note: 'Assume a redução de RES Cryo do campo do Supremo sempre ativa (a Física não entra).' },
  ],
  Faruzan: [
    { id: 'burst', label: 'Faruzan: Benefício do Vento', src: 'kit', kit: { talent: 'burst', key: 'Anemo DMG Bonus' }, scope: 'team', timed: true, forElements: ['Anemo'], stats: { dmgPct: { lit: 1 } }, expect: "granting them an Anemo DMG Bonus", note: 'DMG Anemo da equipe pelo nível do Supremo: ligue nas janelas. Só personagens Anemo recebem.' },
    { id: 'burst-res', label: 'Faruzan: Pulso (RES)', src: 'kit', kit: { talent: 'burst', key: 'Anemo RES Decrease' }, scope: 'self', timed: false, resShred: { value: { lit: 1 }, elements: ['Anemo'] }, expect: 'decreasing their Anemo RES', note: 'Assume a redução de RES Anemo do Supremo sempre ativa.' },
  ],
  Vodyanitsa: [
    { id: 'skill', label: 'Vodyanitsa: Canção (RES)', src: 'kit', kit: { talent: 'skill', key: 'Hydro/Cryo RES Reduction' }, scope: 'self', timed: false, resShred: { value: { lit: 1 }, elements: ['Hydro', 'Cryo'] }, expect: 'decrease the Hydro RES and Cryo RES of opponents hit', note: 'Assume a redução de RES Hydro e Cryo sempre ativa.' },
  ],
  'Kamisato Ayato': [
    { id: 'burst', label: 'Ayato: Jardim de Pureza', src: 'kit', kit: { talent: 'burst', key: 'Normal Attack DMG Bonus' }, scope: 'team', timed: true, stats: { byType: { normal: { lit: 1 } } }, expect: 'increasing the Normal Attack DMG of characters within', note: 'DMG de Ataque Normal de quem está no jardim, pelo nível do Supremo: ligue nas janelas.' },
  ],
  Candace: [
    { id: 'burst', label: 'Candace: Prece da Coroa', src: 'kit', kit: { talent: 'burst', key: 'DMG Bonus' }, scope: 'team', timed: true, stats: { byType: { normal: { lit: 1 } } }, expect: 'Characters deal increased Elemental DMG with their Normal Attacks', note: 'DMG de Ataque Normal elemental pelo nível do Supremo: ligue nas janelas (vale para quem tem a infusão Hydro).' },
  ],
  Gorou: [
    { id: 'skill', label: 'Gorou: Estandarte (Geo)', src: 'kit', kit: { talent: 'skill', key: 'Geo DMG Bonus' }, scope: 'team', timed: true, forElements: ['Geo'], stats: { dmgPct: { lit: 1 } }, team: { scale: { of: ['Geo'], table: [{ lit: 0 }, { lit: 0 }, { lit: 1 }] } }, expect: 'Adds "Crunch" - Geo DMG Bonus', note: '+15% de DMG Geo com 3 personagens Geo no time (o Gorou conta): ligue nas janelas. Os bônus de DEF e de resistência a interrupção não entram.' },
  ],
};

/** Kit sem tabela de nível (valor fixo no texto) e kit com Fanfare. */
export const CHARACTERS_9: Record<string, BuffCuration[]> = {
  Zhongli: [
    { id: 'shield', label: 'Zhongli: Escudo de Jade', src: 'kit', kit: { talent: 'skill' }, scope: 'self', timed: false, resShred: { value: { lit: 0.2 }, elements: ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'] }, expect: 'will decrease the Elemental RES and Physical RES of opponents in a small AoE by 20%', note: 'Assume a redução de 20% de RES elemental (com o Escudo de Jade ativo) sempre ativa. A de RES Física não entra.' },
  ],
  Furina: [
    { id: 'burst', label: 'Furina: Fanfarra', src: 'kit', kit: { talent: 'burst', key: 'Fanfare to DMG Increase Conversion Ratio' }, scope: 'team', timed: true, stats: { dmgPct: { lit: 300 } }, expect: 'Furina will increase the DMG dealt by and Incoming Healing Bonus of all nearby party members based on the amount of Fanfare', note: 'Assume o máximo de 300 pontos de Fanfarra (DMG da equipe = 300 × a razão do nível do Supremo): ligue nas janelas. A Fanfarra real depende das variações de HP do time.' },
  ],
};

/** Taxa e Dano Crítico só para certos tipos de golpe (`critRateByType`, `critDmgByType`). */
export const CHARACTERS_10: Record<string, BuffCuration[]> = {
  Kaeya: [
    { id: 'c1', label: 'Kaeya C1', src: 'const1', scope: 'self', timed: false, stats: { critRateByType: { normal: { lit: 0.15 }, charged: { lit: 0.15 } } }, expect: 'CRIT Rate of Kaeya\'s Normal and Charge Attacks against opponents affected by Cryo is increased by 15%', note: '+15% de Taxa Crítica de Normal/Carregado contra inimigos sob Cryo (assumido sempre).' },
  ],
  Yanfei: [
    { id: 'c2', label: 'Yanfei C2', src: 'const2', scope: 'self', timed: true, stats: { critRateByType: { charged: { p: 1 } } }, expect: "Increases Yanfei's Charged Attack CRIT Rate by 20% against enemies below 50% HP", note: '+20% de Taxa Crítica de Carregado contra inimigos com menos de 50% de HP: ligue nas janelas.' },
  ],
  'Arataki Itto': [
    { id: 'c6', label: 'Itto C6', src: 'const6', scope: 'self', timed: false, stats: { critDmgByType: { charged: { p: 0 } } }, expect: "Charged Attacks deal +70% CRIT DMG", note: '+70% de Dano Crítico de Ataque Carregado, sempre.' },
  ],
  Gaming: [
    { id: 'c6', label: 'Gaming C6', src: 'const6', scope: 'self', timed: false, stats: { critRateByType: { plunge: { p: 0 } }, critDmgByType: { plunge: { p: 1 } } }, expect: 'CRIT Rate increased by 20% and CRIT DMG increased by 40%', note: '+20% de Taxa e +40% de Dano Crítico do Plunging da habilidade, sempre.' },
  ],
  Varesa: [
    { id: 'c6', label: 'Varesa C6', src: 'const6', scope: 'self', timed: false, stats: { critRateByType: { plunge: { p: 0 }, burst: { p: 0 } }, critDmgByType: { plunge: { p: 1 }, burst: { p: 1 } } }, expect: 'Her Plunging Attacks and Elemental Burst Guardian Vent! gain 10% CRIT Rate and 100% CRIT DMG', note: '+10% de Taxa e +100% de Dano Crítico de Plunging e Supremo, sempre.' },
  ],
  Arlecchino: [
    { id: 'c6', label: 'Arlecchino C6', src: 'const6', scope: 'self', timed: true, stats: { critRateByType: { normal: { p: 0 }, burst: { p: 0 } }, critDmgByType: { normal: { p: 1 }, burst: { p: 1 } } }, expect: 'both her Normal Attacks and Elemental Burst gain 10% increased CRIT Rate and 70% increased CRIT DMG', note: '+10% de Taxa e +70% de Dano Crítico de Normal e Supremo por 20 s depois do All Is Ash: ligue nas janelas.' },
  ],
  Tighnari: [
    { id: 'c1', label: 'Tighnari C1', src: 'const1', scope: 'self', timed: false, stats: { critRateByType: { charged: { p: 0 } } }, expect: "Tighnari's Charged Attack CRIT Rate is increased by 15%", note: '+15% de Taxa Crítica de Ataque Carregado, sempre.' },
  ],
  Freminet: [
    { id: 'c1', label: 'Freminet C1', src: 'const1', scope: 'self', timed: false, stats: { critRateByType: { skill: { p: 0 } } }, expect: 'The CRIT Rate of Pressurized Floe: Shattering Pressure will be increased by 15%', note: '+15% de Taxa Crítica do Shattering Pressure (habilidade), sempre.' },
  ],
  Xianyun: [
    { id: 'a1', label: 'Xianyun A1', src: 'p1', scope: 'team', timed: true, stats: { critRateByType: { plunge: { p: 3 } } }, expect: 'cause the characters\' Plunging Attack CRIT Rate to increase by 4%/6%/8%/10%', note: 'Assume 4 stacks (+10% de Taxa Crítica de Plunging da equipe) por 20 s: ligue nas janelas.' },
  ],
};
