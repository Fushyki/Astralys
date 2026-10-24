/**
 * Estelar, Hexerei, golpes que são fração de outro golpe e dano fixo que vem de outro personagem. Mesmas regras de
 * `lunar.ts`: números do Lunaris (`p`/`lit`, com `x` quando o texto dá "a cada 100" ou "N stacks"), forma do efeito do
 * Genshin Optimizer (MIT, commit 532274a). "Stellar Glimmer" = Estelar-Conduct e Redemoinho Estelar.
 */
import type { KitSpecialMove } from '../../src/effects/schema';
import type { BuffCuration, ProcCuration } from './characters';

const SC = { reaction: 'stellarconduct' } as const;
const SS = { reaction: 'stellarswirl' } as const;
const per100 = (p: number) => ({ p, x: 0.01 });
const ALL_HITS: ('normal' | 'charged' | 'plunge' | 'skill' | 'burst')[] = ['normal', 'charged', 'plunge', 'skill', 'burst'];
const STELLAR_BASE = 'Base das reações Estelares da equipe pelo ATK, com teto (Genshin Optimizer: `passive3`).';

/** Hexerei: o Genshin Optimizer liga a facção com "Witch's Homework" concluído; aqui assume concluído. */
export const EXTRA_FACTIONS: Record<string, ('moonsign' | 'hexerei')[]> = Object.fromEntries(
  ['Albedo', 'Durin', 'Fischl', 'Klee', 'Lohen', 'Mona', 'Nicole', 'Prune', 'Razor', 'Sucrose', 'Varka', 'Venti'].map((n) => [n, ['hexerei' as const]]),
);

export const EXTRA_SPECIAL: Record<string, KitSpecialMove[]> = {
  Sandrone: [
    { talent: 'normal', label: 'Charged Attack Condensed Beam Stellar-Conduct DMG', ...SC },
    { talent: 'normal', label: 'Charged Attack Condensed Beam Stellar Swirl DMG', ...SS },
    { talent: 'skill', label: 'Prism Shot Stellar-Conduct DMG', ...SC },
    { talent: 'skill', label: 'Prism Shot Stellar Swirl DMG', ...SS },
    { talent: 'burst', label: 'Convective Inhibition Ray Stellar-Conduct DMG', ...SC },
    { talent: 'burst', label: 'Convective Inhibition Ray Stellar Swirl DMG', ...SS },
  ],
  Odette: [
    { talent: 'skill', label: "Coda at Dawn's Tolling Stellar-Conduct/Stellar Swirl DMG", variant: 0, ...SC },
    { talent: 'skill', label: "Coda at Dawn's Tolling Stellar-Conduct/Stellar Swirl DMG", variant: 1, ...SS },
    { talent: 'skill', label: '"Plume" Dance Move Stellar-Conduct/Stellar Swirl DMG', variant: 0, ...SC },
    { talent: 'skill', label: '"Plume" Dance Move Stellar-Conduct/Stellar Swirl DMG', variant: 1, ...SS },
    { talent: 'skill', label: '"Wing" Dance Move Stellar-Conduct/Stellar Swirl DMG', variant: 0, ...SC },
    { talent: 'skill', label: '"Wing" Dance Move Stellar-Conduct/Stellar Swirl DMG', variant: 1, ...SS },
  ],
  Vesna: [
    { talent: 'skill', label: 'Windborne Sword Lv. 2 Spirit Blade Stellar Swirl DMG', ...SS },
    { talent: 'skill', label: 'Windborne Sword Lv. 3 Spirit Blade Stellar Swirl DMG', ...SS },
    { talent: 'skill', label: 'Windborne Sword Lv. 3 Spirit Blade Final Hit Stellar Swirl DMG', ...SS },
    { talent: 'burst', label: 'Spirit Blade Stellar Swirl DMG', ...SS },
  ],
  'Aether (Cryo)': [
    { talent: 'burst', label: 'Stellar-Conduct Ice Javelin Single Strike DMG', ...SC },
    { talent: 'burst', label: 'Stellar Swirl Ice Javelin Single Strike DMG', ...SS },
  ],
  'Lumine (Cryo)': [
    { talent: 'burst', label: 'Stellar-Conduct Ice Javelin Single Strike DMG', ...SC },
    { talent: 'burst', label: 'Stellar Swirl Ice Javelin Single Strike DMG', ...SS },
  ],
  Mitya: [{ talent: 'normal', label: 'Gradient Detonation Stellar-Conduct DMG', ...SC }],
};

const travelerCryo = (who: string): BuffCuration[] => [
  { id: 'a1', label: `${who} A1 (Radiance)`, src: 'p1', scope: 'self', timed: false, flat: [{ name: 'Frostpierce Star', sourceStat: 'ATK', perPoint: { p: 0 }, hitTypes: ['normal', 'charged', 'plunge'] }], expect: "DMG dealt is also increased by 80% of the Traveler's ATK", note: 'Assume Radiance: Stellar-Conduct com Frostpierce Star em campo: soma 80% do ATK a todo Normal, Carregado e Imersivo (a conversão para Cryo já é o padrão).' },
  { id: 'a0', label: `${who}: base Estelar`, src: 'p3', scope: 'team', timed: false, convert: { from: 'atk', perPoint: { p: 0 }, cap: { p: 1 }, to: ['stellarconductBase', 'stellarswirlBase'] }, expect: "increased by 0.35% for every 100 points of the Traveler's ATK", note: STELLAR_BASE },
  { id: 'c6', label: `${who} C6`, src: 'const6', scope: 'others', timed: true, stats: { reactionBonus: { stellarconduct: { p: 0, x: 8 }, stellarswirl: { p: 0, x: 8 } } }, expect: 'A maximum 40% increase can be obtained in this way', note: 'Assume 8 stacks de Frostglow (o máximo de 40%): DMG Estelar dos outros membros por 15 s depois do Supremo: ligue nas janelas.' },
];

export const EXTRA_BUFFS: Record<string, BuffCuration[]> = {
  // ---------- Estelar ----------
  Sandrone: [
    { id: 'a0', label: 'Sandrone: base Estelar', src: 'p3', scope: 'team', timed: false, convert: { from: 'atk', perPoint: per100(0), cap: { p: 1 }, to: ['stellarconductBase', 'stellarswirlBase'] }, expect: "increased by 0.7% for every 100 points of Sandrone's ATK", note: STELLAR_BASE },
    { id: 'c1', label: 'Sandrone C1', src: 'const1', scope: 'team', timed: true, stats: { reactionBonus: { stellarconduct: { p: 0 }, stellarswirl: { p: 0 } } }, expect: 'all party members deal 30% increased Stellar Glimmer reaction DMG', note: '+30% de DMG Estelar da equipe no modo Decoding: ligue nas janelas.' },
    { id: 'c6', label: 'Sandrone C6', src: 'const6', scope: 'self', timed: false, stats: { reactionBonus: { stellarconductSpecial: { p: 2 }, stellarswirlSpecial: { p: 2 } } }, expect: 'all Stellar Glimmer reaction DMG dealt by Sandrone is elevated by 20%', note: 'Dano Estelar da Sandrone elevado em 20%.' },
  ],
  Odette: [
    { id: 'a1', label: 'Odette A1 (Marvelous Splendor)', src: 'p1', scope: 'team', timed: true, stats: { reactionBonus: { stellarconduct: { p: 1, x: 4 }, stellarswirl: { p: 1, x: 4 } } }, expect: 'she also obtains 4 stacks of Marvelous Splendor', note: 'Assume 4 stacks de Marvelous Splendor (15% cada, parâmetro do Lunaris e Genshin Optimizer): +60% de DMG Estelar: ligue nas janelas.' },
    { id: 'a4', label: 'Odette A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'atk', perPoint: per100(1), threshold: { p: 0 }, cap: { p: 2 }, to: ['stellarconductMult', 'stellarswirlMult'] }, expect: 'For every 100 ATK Odette has over 1,000', note: 'Golpes Estelares dela com +1,5% do dano original por 100 de ATK acima de 1.000, até 30% (Genshin Optimizer: `stellar_mult_`).' },
    { id: 'a0', label: 'Odette: base Estelar', src: 'p3', scope: 'team', timed: false, convert: { from: 'atk', perPoint: per100(0), cap: { p: 1 }, to: ['stellarconductBase', 'stellarswirlBase'] }, expect: "increased by 0.7% for every 100 points of Odette's ATK", note: STELLAR_BASE },
    { id: 'c1', label: 'Odette C1 (stacks extras)', src: 'const1', scope: 'team', timed: true, stats: { reactionBonus: { stellarconduct: { p: 0, x: 0.15 }, stellarswirl: { p: 0, x: 0.15 } } }, expect: 'Odette also gains 2 stacks of Marvelous Splendor', note: 'Os 2 stacks a mais de Marvelous Splendor (15% cada, como no A1) na mesma janela do A1.' },
    { id: 'c2', label: 'Odette C2', src: 'const2', scope: 'team', timed: true, stats: { atkPct: { p: 0, x: 4 } }, expect: 'every stack of Marvelous Splendor active also increases the character\'s ATK by 7%', note: 'Assume 4 stacks: +28% de ATK: ligue nas janelas do A1.' },
    { id: 'c2res', label: 'Odette C2 (RES Cryo)', src: 'const2', scope: 'self', timed: false, resShred: { value: { p: 1 }, elements: ['Cryo'] }, expect: 'corresponding Elemental RES lowered by 20%', note: 'Assume Radiance com o Dance Double em campo: -20% de RES Cryo. A de Electro ou Anemo (depende do Radiance) NÃO entra.' },
    { id: 'c4', label: 'Odette C4 (Snow Swan para a equipe)', src: 'kit', kit: { talent: 'burst', key: "Snow Swan's Dream Stellar Glimmer Reaction DMG Bonus" }, minConstellation: 4, scope: 'others', timed: true, stats: { reactionBonus: { stellarconduct: { lit: 0.5 }, stellarswirl: { lit: 0.5 } } }, expect: "She also gains Snow Swan's Dream", note: 'C4: os outros membros ganham 50% do bônus Estelar do Snow Swan\'s Dream (nível do Supremo): ligue nas janelas.' },
    { id: 'c6', label: 'Odette C6 (equipe)', src: 'const6', scope: 'team', timed: true, stats: { reactionBonus: { stellarconductSpecial: { p: 0 }, stellarswirlSpecial: { p: 0 } } }, expect: 'have their Stellar Glimmer reaction DMG dealt to opponents elevated by 25%', note: 'Dano Estelar elevado em 25% com Marvelous Splendor: ligue nas janelas.' },
    { id: 'c6s', label: 'Odette C6', src: 'const6', scope: 'self', timed: false, stats: { reactionBonus: { stellarconductSpecial: { p: 1 }, stellarswirlSpecial: { p: 1 } } }, expect: 'Stellar Glimmer reaction DMG dealt by Odette is elevated by an additional 20%', note: 'Dano Estelar da Odette elevado em mais 20%.' },
  ],
  Vesna: [
    { id: 'a4atk', label: 'Vesna A4 (ATK)', src: 'p2', scope: 'self', timed: true, team: { scale: { of: ['Cryo', 'Anemo'], table: [{ lit: 1 }, { lit: 2 }, { lit: 3 }, { lit: 4 }] } }, stats: { atkPct: { p: 0 } }, expect: "Vesna's ATK increases by 6%", note: 'Radiance: Stellar Swirl: +6% de ATK por membro Cryo ou Anemo (ela conta): ligue nas janelas.' },
    { id: 'a4em', label: 'Vesna A4 (Maestria)', src: 'p2', scope: 'self', timed: true, team: { scale: { of: ['Pyro', 'Hydro', 'Electro', 'Dendro', 'Geo'], table: [{ lit: 1 }, { lit: 2 }, { lit: 3 }] } }, stats: { em: { p: 1 } }, expect: "Vesna's Elemental Mastery increases by 25 instead", note: 'Radiance: Stellar Swirl: +25 de Maestria por membro de outro elemento: ligue nas janelas.' },
    { id: 'a0', label: 'Vesna: base do Redemoinho Estelar', src: 'p3', scope: 'team', timed: false, convert: { from: 'atk', perPoint: per100(0), cap: { p: 1 }, to: ['stellarswirlBase'] }, expect: 'Every 100 ATK she has increases the Base Stellar Swirl DMG by 0.7%', note: STELLAR_BASE },
    { id: 'c4atk', label: 'Vesna C4 (ATK)', src: 'const4', scope: 'self', timed: true, team: { scale: { of: ['Cryo', 'Anemo'], table: [{ p: 0 }, { p: 0, x: 2 }, { p: 0, x: 3 }, { p: 0, x: 4 }] } }, stats: { atkPct: { lit: 0.06 } }, expect: 'Its ATK and Elemental Mastery bonuses increase to 3 times their original values', note: 'O A4 vale 3 vezes: soma 2 × 6% por membro Cryo/Anemo (6% do texto do A4) na mesma janela.' },
    { id: 'c4em', label: 'Vesna C4 (Maestria)', src: 'const4', scope: 'self', timed: true, team: { scale: { of: ['Pyro', 'Hydro', 'Electro', 'Dendro', 'Geo'], table: [{ p: 0 }, { p: 0, x: 2 }, { p: 0, x: 3 }] } }, stats: { em: { lit: 25 } }, expect: 'Its ATK and Elemental Mastery bonuses increase to 3 times their original values', note: 'O A4 vale 3 vezes: soma 2 × 25 de Maestria por membro de outro elemento (25 do texto do A4) na mesma janela.' },
    { id: 'c6', label: 'Vesna C6', src: 'const6', scope: 'self', timed: false, stats: { reactionBonus: { stellarswirlSpecial: { p: 3 } } }, expect: "Vesna's Stellar Swirl reaction DMG dealt is elevated by 20%", note: 'Dano de Redemoinho Estelar da Vesna elevado em 20%.' },
  ],
  'Aether (Cryo)': travelerCryo('Viajante'),
  'Lumine (Cryo)': travelerCryo('Viajante'),
  Mitya: [
    { id: 'a0', label: 'Mitya: base do Estelar-Conduct', src: 'p3', scope: 'team', timed: false, convert: { from: 'em', perPoint: { p: 0 }, cap: { p: 1 }, to: ['stellarconductBase'] }, expect: 'Every point of Elemental Mastery he has increases Base Stellar-Conduct DMG by 0.028%', note: STELLAR_BASE.replace('pelo ATK', 'pela Maestria') },
    { id: 'c6', label: 'Mitya C6', src: 'const6', scope: 'team', timed: false, stats: { reactionBonus: { stellarconductSpecial: { p: 1 } } }, expect: 'Stellar-Conduct reaction DMG dealt by all nearby party members is Elevated by 20%', note: 'Dano Estelar-Conduct da equipe elevado em 20% (o Mitya não tem ficha no Genshin Optimizer; vale a fórmula Estelar dele).' },
  ],
  Valeriy: [
    { id: 'c6', label: 'Valeriy C6 (Electro)', src: 'const6', scope: 'team', timed: true, forElements: ['Electro'], stats: { critRate: { p: 2 }, reactionBonus: { stellarconductCritDmg: { p: 3 } } }, expect: 'opponents they hit have the CRIT Rate of Electro DMG they take increased by 10%', note: '+10% de Taxa Crítica no dano Electro (dado aos membros Electro) e +40% de Dano Crítico no Estelar-Conduct por 7 s: ligue nas janelas. O +100% do Carregado especial e dos Thunderburst Shells NÃO entra.' },
  ],
  'Yumemizuki Mizuki': [
    { id: 'c1', label: 'Mizuki C1 (Redemoinho)', src: 'const1', scope: 'team', timed: true, convert: { from: 'em', perPoint: { p: 0 }, to: ['swirlFlat'] }, expect: 'this Swirl or Stellar Swirl instance has its DMG against this opponent increased by 1,100% and 550%', note: 'Redemoinho com +1.100% da Maestria dela (1 por ativação): ligue na janela do Redemoinho.' },
    { id: 'c1s', label: 'Mizuki C1 (Redemoinho Estelar)', src: 'const1', scope: 'team', timed: true, convert: { from: 'em', perPoint: { p: 5 }, to: ['stellarswirlFlat'] }, expect: 'this Swirl or Stellar Swirl instance has its DMG against this opponent increased by 1,100% and 550%', note: 'Redemoinho Estelar com +550% da Maestria dela: ligue na janela.' },
    { id: 'c6', label: 'Mizuki C6 (crítico do Redemoinho)', src: 'const6', scope: 'team', timed: true, stats: { reactionBonus: { swirlCritRate: { p: 0 }, swirlCritDmg: { lit: 1 }, stellarswirlCritRate: { p: 6 }, stellarswirlCritDmg: { p: 7 } } }, expect: 'Swirl DMG dealt by nearby party members can score CRIT Hits, with CRIT Rate fixed at 30%, and CRIT DMG fixed at 100%', note: 'No Dreamdrifter: Redemoinho crita (30% / 100%) e o Redemoinho Estelar ganha +10% / +20%: ligue nas janelas.' },
    { id: 'c6cr', label: 'Mizuki C6 (Taxa Crítica)', src: 'const6', scope: 'self', timed: false, convert: { from: 'em', perPoint: { p: 2 }, threshold: { p: 1 }, cap: { p: 4 }, to: ['critRate'] }, expect: 'Every point of Elemental Mastery Yumemizuki Mizuki has in excess of 500 increases her CRIT Rate by 0.04%', note: '+0,04% de Taxa Crítica por ponto de Maestria acima de 500, até 20%.' },
    { id: 'c6cd', label: 'Mizuki C6 (Dano Crítico)', src: 'const6', scope: 'self', timed: false, convert: { from: 'em', perPoint: { p: 3 }, threshold: { p: 1 }, cap: { p: 5 }, to: ['critDmg'] }, expect: 'and her CRIT DMG by 0.16%', note: '+0,16% de Dano Crítico por ponto de Maestria acima de 500, até 80%.' },
  ],
  Ifa: [
    { id: 'a1', label: 'Ifa A1 (Rescue Essentials)', src: 'p1', scope: 'team', timed: true, stats: { reactionBonus: { swirl: { p: 3, x: 150 }, electrocharged: { p: 3, x: 150 }, stellarswirl: { p: 4, x: 150 } } }, expect: 'Rescue Essentials will increase the Swirl, Stellar Swirl, Electro-Charged, and Lunar-Charged reaction DMG', note: 'Assume 150 pontos de Rescue Essentials (o máximo): +1,5% por ponto no Redemoinho e Eletrocarregado e +0,24% no Redemoinho Estelar (parâmetros do Lunaris): ligue nas janelas. O de Lunar-Carregado NÃO entra (o Genshin Optimizer usa 0,2% por ponto, número que não aparece no Lunaris).' },
    { id: 'c2', label: 'Ifa C2 (limite +50)', src: 'const2', scope: 'team', timed: true, stats: { reactionBonus: { swirl: { p: 2, x: 0.015 }, electrocharged: { p: 2, x: 0.015 } } }, expect: "Ifa's Rescue Essentials limit is increased by 50", note: 'Os 50 pontos a mais de Rescue Essentials (1,5% cada, do A1) no Redemoinho e Eletrocarregado, na mesma janela do A1. O Redemoinho Estelar e o Lunar-Carregado destes pontos NÃO entram.' },
  ],
  Baizhu: [
    { id: 'a4', label: 'Baizhu A4 (reações)', src: 'p2', scope: 'team', timed: true, convert: { from: 'hp', perPoint: { p: 1, x: 0.001 }, cap: { p: 3, x: 0.00002 }, to: ['burning', 'bloom', 'hyperbloom', 'burgeon'] }, expect: 'will increase the Burning, Bloom, Hyperbloom, and Burgeon reaction DMG dealt by these characters by 2%', note: '+2% de Queimadura, Florescer, Hiperflorescer e Brotar por 1.000 de HP dele (até 50.000) por 6 s depois do escudo curar: ligue nas janelas.' },
    { id: 'a4lb', label: 'Baizhu A4 (Lunar-Florescer)', src: 'p2', scope: 'team', timed: true, convert: { from: 'hp', perPoint: { p: 4, x: 0.001 }, cap: { p: 3, x: 0.000007 }, to: ['lunarbloom'] }, expect: 'their Lunar-Bloom DMG by 0.7%', note: 'Idem, +0,7% de Lunar-Florescer por 1.000 de HP.' },
    { id: 'a4cat', label: 'Baizhu A4 (Propagar/Intensificar)', src: 'p2', scope: 'team', timed: true, convert: { from: 'hp', perPoint: { p: 2, x: 0.001 }, cap: { p: 3, x: 0.000008 }, to: ['spread', 'aggravate'] }, expect: 'the DMG Bonus provided by Aggravate and Spread by 0.8%', note: 'Idem, +0,8% no bônus de Propagar e Intensificar por 1.000 de HP.' },
  ],
  Mona: [
    { id: 'c1', label: 'Mona C1 (reações)', src: 'const1', scope: 'team', timed: true, stats: { reactionBonus: { electrocharged: { p: 0 }, lunarcharged: { p: 1 }, lunarcrystallize: { p: 3 } } }, expect: 'Electro-Charged DMG increases by 15%, Lunar-Charged DMG increases by 15%', note: '+15% de Eletrocarregado, Lunar-Carregado e Lunar-Cristalizar por 8 s depois de acertar inimigo com Presságio: ligue nas janelas. Vaporizar e Redemoinho Hydro NÃO entram (o bônus de Redemoinho do motor vale para todo elemento).' },
  ],
  // ---------- Hexerei ----------
  Fischl: [
    { id: 'hex-atk', label: 'Fischl: Secret Rite (Sobrecarga)', src: 'p4', scope: 'team', timed: true, team: { hexerei: 2 }, stats: { atkPct: { p: 1 } }, expect: 'have their ATK increased by 22.5% for 10s', note: 'Hexerei (2+ membros Hexerei, Witch\'s Homework concluída): +22,5% de ATK por 10 s depois de uma Sobrecarga com o Oz: ligue nas janelas.' },
    { id: 'hex-em', label: 'Fischl: Secret Rite (Eletrocarregado)', src: 'p4', scope: 'team', timed: true, team: { hexerei: 2 }, stats: { em: { p: 3 } }, expect: 'have their Elemental Mastery increased by 90 for 10s', note: 'Hexerei: +90 de Maestria por 10 s depois de Eletrocarregado ou Lunar-Carregado com o Oz: ligue nas janelas.' },
    { id: 'c6atk', label: 'Fischl C6 (Secret Rite, Sobrecarga)', src: 'const6', scope: 'team', timed: true, team: { hexerei: 2 }, stats: { atkPct: { lit: 0.225 } }, expect: 'are further increased by 100% for 10s', note: 'Depois de um ataque coordenado do Oz, o ATK do Secret Rite dobra: soma mais 22,5% (valor do texto do Secret Rite) na mesma janela.' },
    { id: 'c6em', label: 'Fischl C6 (Secret Rite, Eletrocarregado)', src: 'const6', scope: 'team', timed: true, team: { hexerei: 2 }, stats: { em: { lit: 90 } }, expect: 'are further increased by 100% for 10s', note: 'Idem para a Maestria: mais 90 na mesma janela.' },
  ],
  // ---------- Dano fixo que vem de outro personagem ----------
  Citlali: [
    { id: 'c1', label: 'Citlali C1 (Stellar Blade)', src: 'const1', scope: 'self', timed: false, flat: [{ name: 'Stellar Blade', sourceStat: 'EM', perPoint: { p: 0 }, hitTypes: ALL_HITS, stacks: 10, targets: 'others' }], expect: "1 stack of Stellar Blade will be consumed to increase the DMG dealt by 200% of Citlali's Elemental Mastery", note: '200% da Maestria dela somados aos 10 primeiros golpes dos aliados na rotação (10 stacks; os 3 extras por Derreter/Congelar NÃO entram).' },
  ],
  Xilonen: [
    { id: 'c4', label: 'Xilonen C4 (Blooming Blessing)', src: 'const4', scope: 'self', timed: false, flat: [{ name: 'Blooming Blessing', sourceStat: 'DEF', perPoint: { p: 0 }, hitTypes: ['normal', 'charged', 'plunge'], stacks: 6, targets: 'team' }], expect: "deal 65% of Xilonen's DEF as increased Normal, Charged, and Plunging Attack DMG", note: '65% da DEF dela somados aos 6 primeiros Normais, Carregados e Imersivos da equipe na rotação (no jogo cada membro tem 6 cargas).' },
  ],
  Xianyun: [
    { id: 'a4', label: 'Xianyun A4 (Imersivo dos aliados)', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Starwicker', sourceStat: 'ATK', perPoint: { p: 0 }, cap: { p: 1, x: 2 }, hitTypes: ['plunge'], targets: 'team' }], expect: "Plunging Attack shockwave DMG will be increased by 200% of Xianyun's ATK", note: 'Soma 200% do ATK dela a todo Imersivo da equipe (Starwicker com stacks), até 9.000 (teto do Genshin Optimizer: 200% × 4.500 de ATK).' },
  ],
  Faruzan: [
    { id: 'a4', label: 'Faruzan A4 (Hurricane Guard)', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Hurricane Guard', sourceStat: 'BaseATK', perPoint: { p: 0 }, hitTypes: ALL_HITS, targets: 'team', elements: ['Anemo'] }], expect: "This DMG will be increased based on 32% of Faruzan's Base ATK", note: 'Soma 32% do ATK base dela a todo golpe Anemo da equipe (assume todos dentro do Prayerful Wind\'s Benefit e respeitando o intervalo de 0,8 s).' },
  ],
  Escoffier: [
    { id: 'c2', label: 'Escoffier C2 (Cold Dish)', src: 'const2', scope: 'self', timed: false, flat: [{ name: 'Cold Dish', sourceStat: 'ATK', perPoint: { p: 1 }, hitTypes: ALL_HITS, stacks: 5, targets: 'others', elements: ['Cryo'] }], expect: "they will expend 1 Cold Dish stack to increase their DMG dealt by 240% of Escoffier's ATK", note: '240% do ATK dela somados aos 5 primeiros golpes Cryo dos aliados na rotação (5 stacks por Cold Storage).' },
  ],
  Nicole: [
    { id: 'c4', label: "Nicole C4 (Pathfinder's Blessing)", src: 'const4', scope: 'self', timed: false, flat: [{ name: "Pathfinder's Blessing", sourceStat: 'ATK', perPoint: { p: 2 }, hitTypes: ALL_HITS, stacks: 8, targets: 'team' }], expect: "is increased by 70% of Nicole's ATK", note: '70% do ATK dela somados aos 8 primeiros golpes da equipe na rotação (no jogo cada membro tem as próprias 8 cargas).' },
  ],
  Durin: [
    { id: 'c1p', label: 'Durin C1 (Purity)', src: 'const1', scope: 'self', timed: false, flat: [{ name: 'Cycle of Enlightenment (aliados)', sourceStat: 'ATK', perPoint: { p: 4 }, hitTypes: ALL_HITS, stacks: 20, targets: 'others' }], expect: "1 stack of Cycle of Enlightenment will be consumed to increase the DMG dealt by 60% of Durin's ATK", note: 'Principle of Purity: 60% do ATK dele nos 20 primeiros golpes dos aliados na rotação (no jogo cada um tem 20 stacks).' },
    { id: 'c1d', label: 'Durin C1 (Darkness)', src: 'const1', scope: 'self', timed: false, flat: [{ name: 'Cycle of Enlightenment (Supremo)', sourceStat: 'ATK', perPoint: { p: 6 }, hitTypes: ['burst'], stacks: 10 }], expect: "2 stacks of Cycle of Enlightenment will be consumed to increase the DMG dealt by 150% of Durin's ATK", note: 'Principle of Darkness: 150% do ATK nos 10 primeiros golpes de Supremo dele (20 stacks, 2 por golpe). As duas formas valem juntas na rotação.' },
    { id: 'c6def', label: 'Durin C6 (DEF do inimigo)', src: 'const6', scope: 'self', timed: false, defShred: { p: 1 }, expect: "that opponent's DEF is decreased by 30% for 6s", note: 'Assume a redução de 30% de DEF (6 s depois do Principle of Purity) sempre ativa.' },
    { id: 'c6dark', label: 'Durin C6 (Darkness)', src: 'const6', scope: 'self', timed: true, stats: { defIgnore: { p: 3 } }, expect: 'will ignore an additional 40% of opponents', note: 'Principle of Darkness e Dragon of Dark Decay ignoram mais 40% da DEF: ligue na janela desses golpes.' },
  ],
  'Yun Jin': [
    { id: 'a4', label: 'Yun Jin A4 (formação)', src: 'p2', scope: 'self', timed: false, team: { scale: { of: 'distinct', table: [{ p: 0 }, { p: 1 }, { p: 2 }, { p: 3 }] } }, flat: [{ name: 'Flying Cloud Flag Formation (elementos)', sourceStat: 'DEF', perPoint: { lit: 1 }, hitTypes: ['normal'], stacks: 30, targets: 'team' }], expect: 'is further increased by 2.5%/5%/7.5%/11.5% of Yun Jin\'s DEF', note: 'Soma 2,5% a 11,5% da DEF dela (por nº de elementos do time) aos mesmos 30 Normais do Supremo.' },
  ],
  Albedo: [
    { id: 'c2', label: 'Albedo C2 (Fatal Reckoning)', src: 'const2', scope: 'self', timed: false, flat: [{ name: 'Fatal Reckoning', sourceStat: 'DEF', perPoint: { p: 0, x: 4 }, hitTypes: ['burst'] }], expect: "increases the DMG dealt by Fatal Blossoms and Rite of Progeniture: Tectonic Tide's burst DMG by 30% of Albedo's DEF", note: 'Assume 4 stacks: soma 120% da DEF a todo golpe do Supremo dele.' },
  ],
  Navia: [
    { id: 'c6', label: 'Navia C6', src: 'const6', scope: 'self', timed: true, stats: { critDmgByType: { skill: { p: 0, x: 3 } } }, expect: 'each stack consumed beyond the first 3 increases the CRIT DMG of that Ceremonial Crystalshot by 45%', note: 'Assume 6 stacks de Crystal Shrapnel (3 acima de 3): +135% de Dano Crítico no Ceremonial Crystalshot: ligue na janela do golpe.' },
  ],
};

const ofProc = (id: string, label: string, src: ProcCuration['src'], talent: 'normal' | 'skill' | 'burst', move: string, fraction: ProcCuration['scale']['atk'], expect: string, note: string, extra: Partial<ProcCuration> = {}): ProcCuration =>
  ({ id, label, src, scale: {}, of: { talent, label: move, fraction: fraction! }, expect, note, ...extra });

export const EXTRA_PROCS: Record<string, ProcCuration[]> = {
  Sandrone: [
    { id: 'c4sc', label: 'Sandrone C4: canhão (Estelar-Conduct)', src: 'const4', special: SC, scale: { atk: { p: 0 } }, expect: 'deals Cryo DMG at 125% or 187.5% of her ATK', note: '125% do ATK como Estelar-Conduct a cada 4 s.' },
    { id: 'c4ss', label: 'Sandrone C4: canhão (Redemoinho Estelar)', src: 'const4', special: SS, scale: { atk: { p: 2 } }, expect: 'deals Cryo DMG at 125% or 187.5% of her ATK', note: '187,5% do ATK como Redemoinho Estelar a cada 4 s.' },
    { id: 'c6sc', label: 'Sandrone C6: feixe (Estelar-Conduct)', src: 'const6', special: SC, scale: { atk: { p: 1 } }, expect: "Radiance: Stellar-Conduct: 80% of Sandrone's ATK", note: 'Cada instância vale 80% do ATK como Estelar-Conduct; são 4 (use 4 execuções).' },
    { id: 'c6ss', label: 'Sandrone C6: feixe (Redemoinho Estelar)', src: 'const6', special: SS, scale: { atk: { p: 3 } }, expect: "Radiance: Stellar Swirl: 120% of Sandrone's ATK", note: 'Cada instância vale 120% do ATK como Redemoinho Estelar; são 4.' },
  ],
  Odette: [
    { id: 'c1sc', label: 'Odette C1 (Estelar-Conduct)', src: 'const1', special: SC, scale: { atk: { p: 3 } }, expect: "Stellar-Conduct reaction DMG at 300% of Odette's ATK", note: '300% do ATK como Estelar-Conduct no fim do dueto.' },
    { id: 'c1ss', label: 'Odette C1 (Redemoinho Estelar)', src: 'const1', special: SS, scale: { atk: { p: 4 } }, expect: "Stellar Swirl reaction DMG at 450% of Odette's ATK", note: '450% do ATK como Redemoinho Estelar no fim do dueto.' },
    { id: 'c4sc', label: 'Odette C4 (Estelar-Conduct)', src: 'const4', special: SC, scale: { atk: { p: 0 } }, expect: "Stellar-Conduct reaction DMG at 66% of Odette's ATK", note: '66% do ATK como Estelar-Conduct a cada 3,5 s.' },
    { id: 'c4ss', label: 'Odette C4 (Redemoinho Estelar)', src: 'const4', special: SS, scale: { atk: { p: 1 } }, expect: "Stellar Swirl reaction DMG at 99% of Odette's ATK", note: '99% do ATK como Redemoinho Estelar a cada 3,5 s.' },
  ],
  Vesna: [
    { id: 'c6t', label: 'Vesna C6: Transpose', src: 'const6', scale: { atk: { p: 1 } }, expect: "dealing Anemo DMG at 150% of Vesna's ATK", note: '150% do ATK no Windborne Sword: Transpose.' },
    { id: 'c6b', label: 'Vesna C6: Spirit Blades', src: 'const6', scale: { atk: { p: 2 } }, expect: "additional instance of Anemo DMG at 200% of Vesna's ATK", note: '200% do ATK das Spirit Blades do Transpose.' },
    { id: 'c6bs', label: 'Vesna C6: Spirit Blades (Redemoinho Estelar)', src: 'const6', special: SS, scale: { atk: { p: 2 } }, expect: "additional instance of Anemo DMG at 200% of Vesna's ATK", note: 'Com Radiance: Stellar Swirl, as Spirit Blades do Transpose como Redemoinho Estelar (Genshin Optimizer); use no lugar do golpe acima.' },
  ],
  'Yae Miko': [
    { id: 'a1s', label: 'Yae A1: raio extra (Estelar-Conduct)', src: 'p1', special: SC, scale: { atk: { p: 1 } }, expect: "Electro DMG at 50% of Yae Miko's ATK instead", note: 'Com Radiance: Stellar-Conduct, o raio extra vira 50% do ATK como Estelar-Conduct (use no lugar do raio de 40%).' },
  ],
  Mitya: [
    { id: 'c4', label: 'Mitya C4: Detection Core', src: 'const4', special: SC, scale: { em: { p: 0 } }, expect: "AoE Electro DMG equal to 300% of Mitya's Elemental Mastery", note: '300% da Maestria como Estelar-Conduct a cada 5 Gradient Beacons consumidos.' },
    ofProc('c6', 'Mitya C6: Steady State (+15%)', 'const6', 'skill', 'Steady State Core DMG', { p: 2 }, 'Detection Core deals 115% of its original DMG', 'No Steady State o núcleo causa 115% do dano: este golpe soma os 15% a mais (ponha junto do golpe do kit).'),
  ],
  'Yumemizuki Mizuki': [
    { id: 'c1', label: 'Mizuki C1: ataque extra', src: 'const1', scale: { em: { p: 3 } }, expect: 'dealing Anemo DMG at 1,000% of Yumemizuki Mizuki', note: '1.000% da Maestria (Anemo) ao consumir o Twenty-Three Nights\' Awaiting.' },
    { id: 'c1s', label: 'Mizuki C1: ataque extra (Redemoinho Estelar)', src: 'const1', special: SS, scale: { em: { p: 4 } }, expect: 'is changed to Anemo DMG at 400% of Yumemizuki Mizuki', note: 'Com Radiance: Stellar Swirl, vira 400% da Maestria como Redemoinho Estelar (use no lugar do golpe acima).' },
  ],
  // ---------- Golpes que são fração de outro golpe ----------
  'Kamisato Ayaka': [
    ofProc('c2c', 'Ayaka C2: Frostflake (corte)', 'const2', 'burst', 'Cutting DMG', { p: 0 }, "each dealing 20% of the original storm's DMG", 'Cada tempestade menor vale 20% do corte da original; são 2 (use 2 × as execuções do corte).'),
    ofProc('c2b', 'Ayaka C2: Frostflake (florescer)', 'const2', 'burst', 'Bloom DMG', { p: 0 }, "each dealing 20% of the original storm's DMG", '20% da explosão final da tempestade; são 2.'),
  ],
  Amber: [ofProc('c1', 'Amber C1: segunda flecha', 'const1', 'normal', 'Fully-Charged Aimed Shot', { p: 0 }, "The second arrow deals 20% of the first arrow's DMG", '20% do Tiro Mirado Carregado (conta como Carregado).')],
  Venti: [ofProc('c1', 'Venti C1: flecha extra', 'const1', 'normal', 'Fully-Charged Aimed Shot', { lit: 0.33 }, "each dealing 33% of the original arrow's DMG", '33% do Tiro Mirado Carregado por flecha; são 2 (conta como Carregado). As do Windsunder Arrow NÃO entram.')],
  Yelan: [ofProc('c6', 'Yelan C6: Breakthrough Barb (Mastermind)', 'const6', 'normal', 'Breakthrough Barb DMG', { p: 2 }, "dealing 156% of a normal Breakthrough Barb's DMG", '156% do Breakthrough Barb, conta como Carregado; são até 5 (use no lugar dos Normais no Mastermind).', { hitType: 'charged' })],
  Eula: [ofProc('a1', 'Eula A1: Shattered Lightfall Sword', 'p1', 'burst', 'Lightfall Sword Base DMG', { p: 0 }, 'dealing 50% of the basic Physical DMG', '50% do dano base da Lightfall Sword (Físico, conta como Supremo; os stacks de energia não entram).', { element: 'Physical' })],
  Lyney: [ofProc('c6', 'Lyney C6: Pyrotechnic Strike: Reprised', 'const6', 'normal', 'Pyrotechnic Strike DMG', { p: 0 }, "deal 80% of a Pyrotechnic Strike's DMG", "80% do Pyrotechnic Strike a cada Prop Arrow (conta como Carregado).", { hitType: 'charged' })],
  Mona: [ofProc('a1', 'Mona A1: explosão do Fantasma', 'p1', 'skill', 'Explosion DMG', { p: 2 }, 'its explosion DMG is equal to 50% of Mirror Reflection of Doom', '50% da explosão do Mirror Reflection of Doom (conta como habilidade).')],
  'Kujou Sara': [ofProc('c2', 'Sara C2: Crowfeather extra', 'const2', 'skill', 'Tengu Juurai: Ambush DMG', { p: 0 }, 'will deal 30% of its original DMG', '30% do Tengu Juurai: Ambush (conta como habilidade).')],
  Fischl: [ofProc('a1o', 'Fischl A1: Thundering Retribution (flecha)', 'p1', 'normal', 'Fully-Charged Aimed Shot', { p: 0 }, "equal to 152.7% of the arrow's DMG", '152,7% do Tiro Mirado Carregado que acerta o Oz, Electro (conta como Carregado, Genshin Optimizer).', { element: 'Electro' })],
  Navia: [ofProc('c2', 'Navia C2: Cannon Fire Support', 'const2', 'burst', 'Cannon Fire Support DMG', { lit: 1 }, 'one Cannon Fire Support shot from As the Sunlit Sky', 'Um tiro de Cannon Fire Support (100% do golpe do Supremo, conta como Supremo) por Ceremonial Crystalshot.')],
  Chiori: [
    ofProc('a1', 'Chiori A1: Tamoto (Seize the Moment)', 'p1', 'skill', 'Upward Sweep Attack DMG', { p: 0 }, "dealing 100% of Fluttering Hasode's upward sweep DMG", '100% do golpe para cima do Fluttering Hasode (conta como habilidade); até 2 por Seize the Moment.'),
    ofProc('c2', 'Chiori C2: Kinu', 'const2', 'skill', 'Tamoto DMG', { p: 2 }, "dealing AoE Geo DMG equivalent to 170% of Tamoto's DMG", '170% do Tamoto (conta como habilidade), a cada 3 s por 10 s depois do Supremo.'),
    ofProc('c4', 'Chiori C4: Kinu dos Normais', 'const4', 'skill', 'Tamoto DMG', { lit: 1.7 }, 'a simplified automaton doll, "Kinu," will be summoned', 'Até 3 Kinu (170% do Tamoto, como no C2) por Tailor-Made.'),
  ],
  'Aether (Geo)': [ofProc('c2', 'Viajante C2: explosão do meteorito', 'const2', 'skill', 'Skill DMG', { lit: 1 }, 'dealing additional AoE Geo DMG equal to the amount of damage dealt by Starfell Sword', 'Explosão igual ao dano da Starfell Sword (conta como habilidade).')],
  'Lumine (Geo)': [ofProc('c2', 'Viajante C2: explosão do meteorito', 'const2', 'skill', 'Skill DMG', { lit: 1 }, 'dealing additional AoE Geo DMG equal to the amount of damage dealt by Starfell Sword', 'Explosão igual ao dano da Starfell Sword (conta como habilidade).')],
  'Aether (Electro)': [ofProc('c6', 'Viajante C6: Falling Thunder reforçado', 'const6', 'burst', 'Falling Thunder DMG', { p: 0 }, 'which will deal 200% of its original DMG', 'A cada 2 Falling Thunder, o próximo causa 200%: use no lugar de 1 em cada 3.')],
  'Lumine (Electro)': [ofProc('c6', 'Viajante C6: Falling Thunder reforçado', 'const6', 'burst', 'Falling Thunder DMG', { p: 0 }, 'which will deal 200% of its original DMG', 'A cada 2 Falling Thunder, o próximo causa 200%: use no lugar de 1 em cada 3.')],
  Neuvillette: [{ id: 'c6', label: 'Neuvillette C6: correntes', src: 'const6', hitType: 'charged', scale: { hp: { p: 0 } }, expect: "each of which will deal 10% of Neuvillette's Max HP as Hydro DMG", note: '10% do HP máximo por corrente, 2 a cada 2 s do Equitable Judgment (conta como Carregado). O multiplicador do A1 não entra.' }],
  Albedo: [{ id: 'c2', label: 'Albedo C2: Fatal Blossoms', src: 'const2', hitType: 'burst', scale: { def: { p: 1 } }, expect: "deal AoE Geo DMG equal to 300% of Albedo's DEF", note: '300% da DEF por Fatal Blossom (3 quando ele está fora de campo com 4 stacks; conta como Supremo).' }],
};

const partial = (note: string) => ({ kind: 'partial' as const, note });
/**
 * Notas de passivas/constelações cobertas por `lunar.ts` e por este arquivo: `null` = já entra inteira (a nota sai);
 * texto = o que ainda fica de fora.
 */
export const NOTE_UPDATES: Record<string, Partial<Record<'p1' | 'p2' | 'p3' | 'const1' | 'const2' | 'const3' | 'const4' | 'const5' | 'const6', { kind: 'partial'; note: string } | null>>> = {
  Citlali: { const1: null },
  Yelan: { const6: null },
  'Kamisato Ayaka': { const2: null },
  Albedo: { const2: null },
  'Yae Miko': { p1: null },
  Eula: { p1: null },
  Neuvillette: { const6: null },
  Lyney: { const6: null },
  Navia: { const2: null, const6: null },
  Chiori: { p1: null, const2: null, const4: null },
  Amber: { const1: null },
  Venti: { const1: partial('As 2 flechas extras do Windsunder Arrow (20% da original) não entram; as do Tiro Mirado entram como golpe extra.') },
  Mona: { p1: null, const1: partial('Eletrocarregado, Lunar-Carregado e Lunar-Cristalizar entram (faixa); os +15% de Vaporizar e de Redemoinho Hydro e o reforço para 160% fora de campo não entram.') },
  'Kujou Sara': { const2: null },
  Kaveh: { const4: partial('Os +60% de Florescer entram; o de Lunar-Florescer não entra: o Genshin Optimizer não modela e o núcleo de Lunar-Florescer não tem fórmula verificável.') },
  Xilonen: { const4: null },
  'Yumemizuki Mizuki': { const1: null, const6: null },
  Ifa: {
    p1: partial('Redemoinho, Eletrocarregado e Redemoinho Estelar entram (faixa); o de Lunar-Carregado não: o Genshin Optimizer usa 0,2% por ponto, número que não está no Lunaris.'),
    const2: null,
  },
  Durin: { const1: null, const6: null },
  'Aether (Geo)': { const2: null },
  'Lumine (Geo)': { const2: null },
  'Aether (Electro)': { const6: null },
  'Lumine (Electro)': { const6: null },
  Mitya: { const4: null, const6: null },
  Valeriy: { const6: partial('O crítico entra (faixa); os +100% de dano do Carregado especial e dos Thunderburst Shells não entram (bônus de um golpe só).') },
  Vesna: { p2: null, const4: null, const6: null },
  Escoffier: { const2: null },
  Nicole: { const4: null },
  Sandrone: {
    p1: partial('O Prism Shot com 400% e o Convective Inhibition Ray com +10% por stack (Decoding Power e Refined Tactics) não entram: dependem do estado do Fagio.'),
    const1: null,
    const2: partial('O Dano Crítico só dos feixes do Carregado (+40% e +20% por stack) não entra: o motor não tem crítico só de um golpe Estelar.'),
    const4: null, const6: null,
  },
  'Aether (Cryo)': { p1: null, const6: null },
  'Lumine (Cryo)': { p1: null, const6: null },
  Odette: {
    p1: null, p2: null, const1: null, const4: null, const6: null,
    const2: partial('O ATK por stack e a RES Cryo entram; a redução de RES Electro ou Anemo (depende do Radiance) não entra.'),
  },
  Fischl: { p1: null, const6: null },
  Faruzan: { p2: null },
  Xianyun: { p2: null },
  'Yun Jin': { p2: null },
  Baizhu: { p2: null },
};
