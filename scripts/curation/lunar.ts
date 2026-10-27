/**
 * Mecânicas Lunar, Estelar, Moonsign e Hexerei. Cada número vem de um parâmetro do Lunaris (`p`, com `x` para
 * "a cada 100 de ATK" etc.) e a forma de cada efeito segue o Genshin Optimizer (MIT, commit 532274a,
 * `libs/gi/sheets/src/Characters/<Nome>/index.tsx` e `libs/gi/wr/src/reaction/{lunar,stellar,special}.ts`):
 *  - "DMG increased" = `<reação>_dmg_` (chave `<r>`), "Base DMG increased" = `_baseDmg_` (`<r>Base`),
 *    "DMG elevated" = `_specialDmg_` (`<r>Special`), "DMG increased by X% of stat" = `_dmgInc` (`<r>Flat`);
 *  - "Moonsign: Ascendant Gleam" = 2 ou mais membros Moonsign (`team.moonsign: 2`); "Nascent Gleam" = só 1;
 *  - facções (`FACTIONS`) = `flags.isMoonsign` do Genshin Optimizer (Hexerei: ver `HEXEREI`).
 * Golpes do kit que causam dano Lunar/Estelar ficam em `SPECIAL_MOVES` (os que o Genshin Optimizer calcula com
 * `lunarDmgNode`/`stellarDmgNode`).
 */
import type { KitSpecialMove } from '../../src/effects/schema';
import type { BuffCuration, ProcCuration } from './characters';

const LC = { reaction: 'lunarcharged' } as const;
const LB = { reaction: 'lunarbloom' } as const;
const LCR = { reaction: 'lunarcrystallize' } as const;
const ALL_LUNAR = ['lunarcharged', 'lunarbloom', 'lunarcrystallize'] as const;

export const FACTIONS: Record<string, ('moonsign' | 'hexerei')[]> = {
  Aino: ['moonsign'], Columbina: ['moonsign'], Flins: ['moonsign'], Illuga: ['moonsign'], Ineffa: ['moonsign'],
  Jahoda: ['moonsign'], Lauma: ['moonsign'], Linnea: ['moonsign'], Nefer: ['moonsign'], Zibai: ['moonsign'],
};

export const SPECIAL_MOVES: Record<string, KitSpecialMove[]> = {
  Flins: [
    { talent: 'burst', label: 'Middle Phase Lunar-Charged DMG', ...LC },
    { talent: 'burst', label: 'Final Phase Lunar-Charged DMG', ...LC },
    { talent: 'burst', label: 'Thunderous Symphony DMG', ...LC },
    { talent: 'burst', label: 'Thunderous Symphony Additional DMG', ...LC },
  ],
  Lauma: [{ talent: 'skill', label: '2-Hit Hold DMG', ...LB }],
  Columbina: [
    { talent: 'normal', label: 'Moondew Cleanse DMG', ...LB },
    { talent: 'skill', label: 'Gravity Interference: Lunar-Charged DMG', ...LC },
    { talent: 'skill', label: 'Gravity Interference: Lunar-Bloom DMG', ...LB },
    { talent: 'skill', label: 'Gravity Interference: Lunar-Crystallize DMG', ...LCR },
  ],
  Linnea: [
    { talent: 'skill', label: 'Lumi Heavy Overdrive Hammer DMG', ...LCR },
    { talent: 'skill', label: 'Lumi Million Ton Crush DMG', ...LCR },
  ],
  Nefer: [
    { talent: 'skill', label: 'Phantasm Performance 1-Hit DMG (Shades)', ...LB },
    { talent: 'skill', label: 'Phantasm Performance 2-Hit DMG (Shades)', ...LB },
    { talent: 'skill', label: 'Phantasm Performance 3-Hit DMG (Shades)', ...LB },
  ],
  Zibai: [
    { talent: 'skill', label: "Spirit Steed's Stride 2-Hit DMG", ...LCR },
    { talent: 'skill', label: 'Lunar Phase Shift 4-Hit Additional DMG', ...LCR },
    { talent: 'burst', label: 'Skill 2-Hit DMG', ...LCR },
  ],
};

/** "a cada 100 de ATK/DEF" → por ponto. */
const per100 = (p: number) => ({ p, x: 0.01 });

const BASE_NOTE = 'Moonsign Benediction: base das reações Lunares da equipe pelo stat, com teto (Genshin Optimizer soma as de vários membros).';

export const LUNAR_BUFFS: Record<string, BuffCuration[]> = {
  Ineffa: [
    { id: 'a0', label: 'Ineffa: base do Lunar-Carregado', src: 'p3', scope: 'team', timed: false, convert: { from: 'atk', perPoint: per100(0), cap: { p: 1 }, to: ['lunarchargedBase'] }, expect: "every 100 ATK that Ineffa has increasing Lunar-Charged's Base DMG by 0.7%", note: BASE_NOTE },
    { id: 'c1', label: 'Ineffa C1', src: 'const1', scope: 'team', timed: true, convert: { from: 'atk', perPoint: per100(0), cap: { p: 1 }, to: ['lunarcharged'] }, expect: 'Increases Lunar-Charged DMG by 2.5% for every 100 ATK', note: '+2,5% de DMG Lunar-Carregado da equipe por 100 de ATK (até 50%) por 20 s depois do escudo: ligue nas janelas.' },
  ],
  Flins: [
    { id: 'a1', label: 'Flins A1', src: 'p1', scope: 'self', timed: false, team: { moonsign: 2 }, stats: { reactionBonus: { lunarcharged: { p: 0 } } }, expect: 'Lunar-Charged reactions triggered by Flins will deal an additional 20% DMG', note: 'Com Moonsign: Ascendant Gleam, +20% de DMG Lunar-Carregado do Flins (Genshin Optimizer aplica a todo dano Lunar-Carregado dele).' },
    { id: 'a0', label: 'Flins: base do Lunar-Carregado', src: 'p3', scope: 'team', timed: false, convert: { from: 'atk', perPoint: per100(0), cap: { p: 1 }, to: ['lunarchargedBase'] }, expect: "every 100 ATK that Flins has increasing Lunar-Charged's Base DMG by 0.7%", note: BASE_NOTE },
    { id: 'c2res', label: 'Flins C2 (RES Electro)', src: 'const2', scope: 'self', timed: false, team: { moonsign: 2 }, resShred: { value: { p: 2 }, elements: ['Electro'] }, expect: "that opponent's Electro RES will be decreased by 25%", note: 'Com Moonsign: Ascendant Gleam, -25% de RES Electro (assumida sempre ativa).' },
    { id: 'c6', label: 'Flins C6', src: 'const6', scope: 'self', timed: false, stats: { reactionBonus: { lunarchargedSpecial: { p: 0 } } }, expect: "The DMG dealt to opponents by Flins's Lunar-Charged reactions is elevated by 35%", note: 'Dano Lunar-Carregado do Flins elevado em 35%.' },
    { id: 'c6t', label: 'Flins C6 (equipe)', src: 'const6', scope: 'team', timed: false, team: { moonsign: 2 }, stats: { reactionBonus: { lunarchargedSpecial: { p: 1 } } }, expect: "All nearby party members' Lunar-Charged DMG is elevated by 10%", note: 'Com Moonsign: Ascendant Gleam, dano Lunar-Carregado da equipe elevado em 10%.' },
  ],
  Aino: [
    { id: 'c6', label: 'Aino C6', src: 'const6', scope: 'team', timed: true, stats: { reactionBonus: { electrocharged: { p: 0 }, bloom: { p: 0 }, lunarcharged: { p: 0 }, lunarbloom: { p: 0 }, lunarcrystallize: { p: 0 } } }, expect: 'Lunar-Charged, Lunar-Bloom, and Lunar-Crystallize reactions is increased by 15%', note: '+15% de dano de Eletrocarregado, Florescer e das reações Lunares por 15 s depois do Supremo: ligue nas janelas.' },
    { id: 'c6g', label: 'Aino C6 (Ascendant)', src: 'const6', scope: 'team', timed: true, team: { moonsign: 2 }, stats: { reactionBonus: { electrocharged: { p: 1 }, bloom: { p: 1 }, lunarcharged: { p: 1 }, lunarbloom: { p: 1 }, lunarcrystallize: { p: 1 } } }, expect: 'DMG from the aforementioned reactions will be further increased by 20%', note: 'Com Moonsign: Ascendant Gleam, mais 20% nas mesmas reações (mesma janela).' },
  ],
  Nefer: [
    { id: 'a0', label: 'Nefer: base do Lunar-Florescer', src: 'p3', scope: 'team', timed: false, convert: { from: 'em', perPoint: { p: 0 }, cap: { p: 1 }, to: ['lunarbloomBase'] }, expect: "every point of Elemental Mastery that Nefer has increasing Lunar-Bloom's Base DMG by 0.0175%", note: BASE_NOTE },
    { id: 'c2', label: 'Nefer C2', src: 'const2', scope: 'self', timed: true, team: { moonsign: 2 }, stats: { em: { lit: 100 } }, stacks: { max: 5, of: 'a1', levels: [{ lit: 0 }, { lit: 0 }, { lit: 0 }, { lit: 0 }, { lit: 100 }] }, expect: "Nefer's Elemental Mastery will be increased by 200 for 8s instead", note: 'Com 5 stacks de Veil of Falsehood, a Maestria do A1 vira 200: soma os 100 que faltam (200 − 100 do A1) na mesma janela. Os 140% do Phantasm Performance NÃO entram.' },
    { id: 'c6', label: 'Nefer C6', src: 'const6', scope: 'self', timed: false, team: { moonsign: 2 }, stats: { reactionBonus: { lunarbloomSpecial: { p: 2 } } }, expect: "Nefer's Lunar-Bloom DMG is elevated by 15%", note: 'Com Moonsign: Ascendant Gleam, dano Lunar-Florescer da Nefer elevado em 15%.' },
  ],
  Jahoda: [
    { id: 'c6', label: 'Jahoda C6', src: 'const6', scope: 'team', timed: true, team: { moonsign: 2 }, forFactions: ['moonsign'], stats: { critRate: { p: 0 }, critDmg: { p: 1 } }, expect: 'nearby Moonsign characters in your party have their CRIT Rate increased by 5% and CRIT DMG increased by 40%', note: 'Com Moonsign: Ascendant Gleam, +5% de Taxa e +40% de Dano Crítico dos membros Moonsign por 20 s: ligue nas janelas.' },
  ],
  Columbina: [
    { id: 'a0', label: 'Columbina: base das reações Lunares', src: 'p3', scope: 'team', timed: false, convert: { from: 'hp', perPoint: { p: 0, x: 0.001 }, cap: { p: 1 }, to: ['lunarchargedBase', 'lunarbloomBase', 'lunarcrystallizeBase'] }, expect: 'For every 1,000 points of Max HP, the Base DMG of Lunar reactions is increased by 0.2%', note: BASE_NOTE },
    { id: 'domain', label: 'Columbina: Domínio Lunar', src: 'kit', kit: { talent: 'burst', table: [0.13, 0.16, 0.19, 0.22, 0.25, 0.28, 0.31, 0.34, 0.37, 0.4, 0.43, 0.46, 0.49, 0.52, 0.55] }, scope: 'team', timed: true, stats: { reactionBonus: { lunarcharged: { lit: 1 }, lunarbloom: { lit: 1 }, lunarcrystallize: { lit: 1 } } }, expect: 'Lunar Domain', note: 'DMG das reações Lunares da equipe pelo nível do Supremo (13% no nível 1 a 55% no 15; tabela do Genshin Optimizer, o Lunaris não traz o número) enquanto durar o Domínio Lunar (20 s): ligue nas janelas.' },
    { id: 'c1', label: 'Columbina C1', src: 'const1', scope: 'team', timed: false, stats: { reactionBonus: { lunarchargedSpecial: { p: 6 }, lunarbloomSpecial: { p: 6 }, lunarcrystallizeSpecial: { p: 6 } } }, expect: "All nearby party members' Lunar Reaction DMG is elevated by 1.5%", note: 'Dano das reações Lunares da equipe elevado em 1,5%. O resto só dá energia, resistência a interrupção ou escudo.' },
    { id: 'c2lc', label: 'Columbina C2 (Lunar-Carregado)', src: 'const2', scope: 'team', timed: true, team: { moonsign: 2 }, convert: { from: 'hp', perPoint: { p: 3 }, to: ['atkFlat'] }, expect: 'Increase in ATK is equal to 1% of Columbina', note: 'Com Moonsign: Ascendant Gleam e Lunar Brilliance, o personagem ativo ganha ATK = 1% do HP máximo dela, se o Lunar-Carregado acumulou mais Gravity: ligue só a faixa da reação certa.' },
    { id: 'c2lb', label: 'Columbina C2 (Lunar-Florescer)', src: 'const2', scope: 'team', timed: true, team: { moonsign: 2 }, convert: { from: 'hp', perPoint: { p: 4 }, to: ['em'] }, expect: 'Increase in Elemental Mastery is equal to 0.35% of Columbina', note: 'Idem, Maestria = 0,35% do HP máximo dela (Lunar-Florescer).' },
    { id: 'c2lcr', label: 'Columbina C2 (Lunar-Cristalizar)', src: 'const2', scope: 'team', timed: true, team: { moonsign: 2 }, convert: { from: 'hp', perPoint: { p: 5 }, to: ['defFlat'] }, expect: 'Increase in DEF is equal to 1% of Columbina', note: 'Idem, DEF = 1% do HP máximo dela (Lunar-Cristalizar).' },
    { id: 'c2s', label: 'Columbina C2 (reações Lunares)', src: 'const2', scope: 'team', timed: false, stats: { reactionBonus: { lunarchargedSpecial: { p: 6 }, lunarbloomSpecial: { p: 6 }, lunarcrystallizeSpecial: { p: 6 } } }, expect: "All nearby party members' Lunar Reaction DMG is elevated by 7%", note: 'Dano das reações Lunares da equipe elevado em 7% (Genshin Optimizer: sempre).' },
    { id: 'c3', label: 'Columbina C3', src: 'const3', scope: 'team', timed: false, stats: { reactionBonus: { lunarchargedSpecial: { p: 0 }, lunarbloomSpecial: { p: 0 }, lunarcrystallizeSpecial: { p: 0 } } }, expect: "All nearby party members' Lunar Reaction DMG is elevated by 1.5%", note: 'Dano das reações Lunares da equipe elevado em 1,5% (além do +3 de talento).' },
    { id: 'c4lc', label: 'Columbina C4 (Lunar-Carregado)', src: 'const4', scope: 'self', timed: true, convert: { from: 'hp', perPoint: { p: 1 }, to: ['lunarchargedFlat'] }, expect: 'is increased by 12.5%/2.5%/12.5% of Columbina', note: 'Gravity Interference de Lunar-Carregado com +12,5% do HP máximo dela (1 vez a cada 15 s): ligue na janela do golpe. Vale para todo dano Lunar-Carregado dela na janela.' },
    { id: 'c4lb', label: 'Columbina C4 (Lunar-Florescer)', src: 'const4', scope: 'self', timed: true, convert: { from: 'hp', perPoint: { p: 2 }, to: ['lunarbloomFlat'] }, expect: 'is increased by 12.5%/2.5%/12.5% of Columbina', note: 'Idem, +2,5% do HP no Lunar-Florescer (vale também no Moondew Cleanse dentro da janela).' },
    { id: 'c4lcr', label: 'Columbina C4 (Lunar-Cristalizar)', src: 'const4', scope: 'self', timed: true, convert: { from: 'hp', perPoint: { p: 3 }, to: ['lunarcrystallizeFlat'] }, expect: 'is increased by 12.5%/2.5%/12.5% of Columbina', note: 'Idem, +12,5% do HP no Lunar-Cristalizar.' },
    { id: 'c4s', label: 'Columbina C4 (reações Lunares)', src: 'const4', scope: 'team', timed: false, stats: { reactionBonus: { lunarchargedSpecial: { p: 5 }, lunarbloomSpecial: { p: 5 }, lunarcrystallizeSpecial: { p: 5 } } }, expect: "All nearby party members' Lunar Reaction DMG is elevated by 1.5%", note: 'Dano das reações Lunares da equipe elevado em 1,5%.' },
    { id: 'c5', label: 'Columbina C5', src: 'const5', scope: 'team', timed: false, stats: { reactionBonus: { lunarchargedSpecial: { p: 0 }, lunarbloomSpecial: { p: 0 }, lunarcrystallizeSpecial: { p: 0 } } }, expect: "All nearby party members' Lunar Reaction DMG is elevated by 1.5%", note: 'Dano das reações Lunares da equipe elevado em 1,5% (além do +3 de talento).' },
    { id: 'c6lc', label: 'Columbina C6 (Lunar-Carregado)', src: 'const6', scope: 'team', timed: true, forElements: ['Hydro', 'Electro'], stats: { critDmg: { lit: 0.8 } }, expect: 'the CRIT DMG of the corresponding Elemental DMG done by all party members is increased by 80%', note: '+80% de Dano Crítico do dano Hydro e Electro por 8 s depois de um Lunar-Carregado no Lunar Domain: ligue nas janelas. O motor dá o bônus aos membros desses elementos (o número 80% está só no texto).' },
    { id: 'c6lb', label: 'Columbina C6 (Lunar-Florescer)', src: 'const6', scope: 'team', timed: true, forElements: ['Hydro', 'Dendro'], stats: { critDmg: { lit: 0.8 } }, expect: 'the CRIT DMG of the corresponding Elemental DMG done by all party members is increased by 80%', note: 'Idem para Hydro e Dendro (Lunar-Florescer). Não ligue duas faixas no mesmo elemento: no jogo não se somam.' },
    { id: 'c6lcr', label: 'Columbina C6 (Lunar-Cristalizar)', src: 'const6', scope: 'team', timed: true, forElements: ['Hydro', 'Geo'], stats: { critDmg: { lit: 0.8 } }, expect: 'the CRIT DMG of the corresponding Elemental DMG done by all party members is increased by 80%', note: 'Idem para Hydro e Geo (Lunar-Cristalizar).' },
    { id: 'c6s', label: 'Columbina C6 (reações Lunares)', src: 'const6', scope: 'team', timed: false, stats: { reactionBonus: { lunarchargedSpecial: { p: 2 }, lunarbloomSpecial: { p: 2 }, lunarcrystallizeSpecial: { p: 2 } } }, expect: "All nearby party members' Lunar Reaction DMG is elevated by 7%", note: 'Dano das reações Lunares da equipe elevado em 7%.' },
  ],
  Illuga: [
    { id: 'a4geo', label: "Illuga A4 (Nightingale's Song)", src: 'p2', scope: 'self', timed: false, team: { scale: { of: ['Hydro', 'Geo'], table: [{ p: 0 }, { p: 1 }, { p: 2 }] } }, flat: [{ name: "Nightingale's Song por Maestria", sourceStat: 'EM', perPoint: { lit: 1 }, hitTypes: ['normal', 'charged', 'plunge', 'skill', 'burst'], stacks: 21, targets: 'team', elements: ['Geo'] }], expect: 'Increase in DMG is equal to 7%/14%/24% of Illuga', note: "Dano Geo da equipe +7%/14%/24% da Maestria dele com 1/2/3 membros Hydro ou Geo, nos 21 golpes Geo da rotação (21 stacks do Supremo; os 15 extras por construto Geo NÃO entram)." },
    { id: 'a4lcr', label: 'Illuga A4 (Lunar-Cristalizar)', src: 'p2', scope: 'team', timed: true, team: { scale: { of: ['Hydro', 'Geo'], table: [{ p: 3 }, { p: 4 }, { p: 5 }] } }, convert: { from: 'em', perPoint: { lit: 1 }, to: ['lunarcrystallizeFlat'] }, expect: 'If this aforementioned DMG is inflicted by a Lunar-Crystallize reaction, increase in DMG is equal to 48%/96%/160%', note: "Dano Lunar-Cristalizar +48%/96%/160% da Maestria dele por golpe durante o Supremo: ligue nas janelas (o motor não conta os 21 stacks nesta parte)." },
    { id: 'c4', label: 'Illuga C4', src: 'const4', scope: 'team', timed: true, stats: { defFlat: { p: 0 } }, expect: 'nearby active party members will have their DEF increased by 200', note: '+200 de DEF do personagem ativo durante o Supremo: ligue nas janelas.' },
  ],
  Linnea: [
    { id: 'a0', label: 'Linnea: base do Lunar-Cristalizar', src: 'p3', scope: 'team', timed: false, convert: { from: 'def', perPoint: per100(0), cap: { p: 1 }, to: ['lunarcrystallizeBase'] }, expect: "every 100 DEF that Linnea has increasing Lunar-Crystallize's Base DMG by 0.7%", note: BASE_NOTE },
    { id: 'c1', label: 'Linnea C1 (Field Catalog)', src: 'const1', scope: 'team', timed: true, convert: { from: 'def', perPoint: { p: 3 }, to: ['lunarcrystallizeFlat'] }, expect: 'The increase in DMG is equal to 75% of Linnea', note: 'Cada golpe Lunar-Cristalizar da equipe gasta 1 stack e ganha 75% da DEF dela: ligue nas janelas com stacks (6 por habilidade). O consumo maior do Million Ton Crush NÃO entra.' },
    { id: 'c6', label: 'Linnea C6 (Field Catalog)', src: 'const6', scope: 'team', timed: true, convert: { from: 'def', perPoint: { p: 2, x: 0.5 }, to: ['lunarcrystallizeFlat'] }, expect: 'the increase in DMG will be boosted to 150% of the original value', note: 'O C6 leva o bônus do C1 a 150%: soma 50% de 75% da DEF na mesma janela do C1.' },
    { id: 'c6s', label: 'Linnea C6 (Ascendant)', src: 'const6', scope: 'team', timed: false, team: { moonsign: 2 }, stats: { reactionBonus: { lunarcrystallizeSpecial: { p: 0 } } }, expect: 'Lunar-Crystallize Reaction DMG dealt by nearby party members is elevated by 25%', note: 'Com Moonsign: Ascendant Gleam, dano Lunar-Cristalizar da equipe elevado em 25%.' },
  ],
  Lauma: [
    { id: 'a1n', label: 'Lauma A1 (Nascent Gleam)', src: 'p1', scope: 'team', timed: true, team: { moonsignMax: 1 }, stats: { reactionBonus: { bloomCritRate: { p: 0 }, bloomCritDmg: { p: 1 }, hyperbloomCritRate: { p: 0 }, hyperbloomCritDmg: { p: 1 }, burgeonCritRate: { p: 0 }, burgeonCritDmg: { p: 1 } } }, expect: 'Bloom, Hyperbloom, and Burgeon DMG dealt by all nearby party members can score CRIT Hits', note: 'Só com 1 membro Moonsign: Florescer, Hiperflorescer e Brotar critam (15% / 100%) por 20 s depois da habilidade: ligue nas janelas.' },
    { id: 'a1a', label: 'Lauma A1 (Ascendant Gleam)', src: 'p1', scope: 'team', timed: true, team: { moonsign: 2 }, stats: { reactionBonus: { lunarbloomCritRate: { p: 2 }, lunarbloomCritDmg: { p: 3 } } }, expect: "All nearby party members' Lunar-Bloom DMG CRIT Rate +10%, CRIT DMG +20%", note: 'Com 2+ Moonsign: +10% de Taxa e +20% de Dano Crítico no Lunar-Florescer da equipe por 20 s: ligue nas janelas.' },
    { id: 'a0', label: 'Lauma: base do Lunar-Florescer', src: 'p3', scope: 'team', timed: false, convert: { from: 'em', perPoint: { p: 0 }, cap: { p: 1 }, to: ['lunarbloomBase'] }, expect: "every point of Elemental Mastery that Lauma has increasing Lunar-Bloom's Base DMG by 0.0175%", note: BASE_NOTE },
    { id: 'c2', label: 'Lauma C2 (Pale Hymn)', src: 'const2', scope: 'team', timed: true, convert: { from: 'em', perPoint: { p: 0 }, to: ['bloomFlat', 'hyperbloomFlat', 'burgeonFlat'] }, expect: "Bloom, Hyperbloom, and Burgeon DMG is further increased by 500% of Lauma's Elemental Mastery", note: 'Pale Hymn: +500% da Maestria dela no dano de Florescer, Hiperflorescer e Brotar: ligue nas janelas do Supremo (o motor não conta os stacks).' },
    { id: 'c2lb', label: 'Lauma C2 (Pale Hymn, Lunar-Florescer)', src: 'const2', scope: 'team', timed: true, convert: { from: 'em', perPoint: { p: 1 }, to: ['lunarbloomFlat'] }, expect: "their Lunar-Bloom DMG is further increased by 400% of Lauma's Elemental Mastery", note: 'Pale Hymn: +400% da Maestria dela no dano Lunar-Florescer: ligue nas janelas do Supremo.' },
    { id: 'c2a', label: 'Lauma C2 (Ascendant)', src: 'const2', scope: 'team', timed: false, team: { moonsign: 2 }, stats: { reactionBonus: { lunarbloom: { p: 2 } } }, expect: "All nearby party members' Lunar-Bloom DMG is increased by 40%", note: 'Com Moonsign: Ascendant Gleam, +40% de DMG Lunar-Florescer da equipe.' },
    { id: 'c6', label: 'Lauma C6 (Ascendant)', src: 'const6', scope: 'team', timed: false, team: { moonsign: 2 }, stats: { reactionBonus: { lunarbloomSpecial: { p: 5 } } }, expect: "All nearby party members' Lunar-Bloom DMG is elevated by 25%", note: 'Com Moonsign: Ascendant Gleam, dano Lunar-Florescer da equipe elevado em 25%.' },
  ],
  Zibai: [
    { id: 'a0', label: 'Zibai: base do Lunar-Cristalizar', src: 'p3', scope: 'team', timed: false, convert: { from: 'def', perPoint: per100(0), cap: { p: 1 }, to: ['lunarcrystallizeBase'] }, expect: "every 100 DEF that Zibai has increasing Lunar-Crystallize's Base DMG by 0.7%", note: BASE_NOTE },
    { id: 'c2', label: 'Zibai C2', src: 'const2', scope: 'team', timed: true, stats: { reactionBonus: { lunarcrystallize: { p: 0 } } }, expect: "all nearby party members' Lunar-Crystallize Reaction DMG is increased by 30%", note: '+30% de DMG Lunar-Cristalizar da equipe no modo Lunar Phase Shift: ligue nas janelas.' },
    { id: 'c6', label: 'Zibai C6', src: 'const6', scope: 'self', timed: true, stats: { reactionBonus: { lunarcrystallizeSpecial: { p: 0, x: 30 } } }, stacks: { max: 30, unit: 'pontos acima de 70' }, expect: 'by 1.6% for every point consumed above 70', note: 'Assume 100 pontos de Phase Shift Radiance (30 acima de 70): dano Lunar-Cristalizar dela elevado em 48% por 3 s: ligue na janela.' },
  ],
};

export const LUNAR_PROCS: Record<string, ProcCuration[]> = {
  Ineffa: [
    { id: 'a1', label: 'Ineffa A1: ataque extra da Birgitta', src: 'p1', special: LC, scale: { atk: { p: 0 } }, expect: 'This DMG is considered Lunar-Charged DMG', note: '65% do ATK como dano Lunar-Carregado a cada descarga da Birgitta com nuvem de Lunar-Carregado.' },
    { id: 'c2', label: 'Ineffa C2: Punishment Edict', src: 'const2', special: LC, scale: { atk: { p: 0 } }, expect: "AoE Electro DMG equal to 300% of Ineffa's ATK", note: '300% do ATK como dano Lunar-Carregado depois do Supremo.' },
    { id: 'c6', label: 'Ineffa C6: descarga', src: 'const6', special: LC, scale: { atk: { p: 0 } }, expect: 'AoE Electro DMG equal to 135% of her ATK', note: '135% do ATK como dano Lunar-Carregado a cada 3,5 s com o Carrier Flow Composite.' },
  ],
  Flins: [
    { id: 'c2', label: 'Flins C2: Normal depois do Spearstorm', src: 'const2', special: LC, scale: { atk: { p: 0 } }, expect: "it will deal an additional 50% of Flins's ATK as AoE Electro DMG", note: '50% do ATK como dano Lunar-Carregado no próximo Normal depois do Northland Spearstorm.' },
  ],
  Nefer: [
    { id: 'c6a', label: 'Nefer C6: 2º golpe convertido', src: 'const6', special: LB, scale: { em: { p: 0 } }, expect: 'converted to deal AoE Dendro DMG equal to 85% of her Elemental Mastery', note: 'Na C6 o 2º golpe dela no Phantasm Performance vira 85% da Maestria como Lunar-Florescer: use no lugar do golpe original. Os bônus do C1 e de Veil of Falsehood não entram.' },
    { id: 'c6b', label: 'Nefer C6: golpe final', src: 'const6', special: LB, scale: { em: { p: 1 } }, expect: "an extra instance of AoE Dendro DMG equal to 120% of Nefer's Elemental Mastery", note: '120% da Maestria como Lunar-Florescer no fim do Phantasm Performance.' },
  ],
  Lauma: [
    { id: 'c6a', label: 'Lauma C6: Frostgrove extra', src: 'const6', special: LB, scale: { em: { p: 0 } }, expect: "AoE Dendro DMG equal to 185% of Lauma's Elemental Mastery", note: '185% da Maestria como Lunar-Florescer a cada ataque do Frostgrove Sanctuary (até 8).' },
    { id: 'c6b', label: 'Lauma C6: Normal com Pale Hymn', src: 'const6', special: LB, scale: { em: { p: 4 } }, expect: 'Dendro DMG equal to 150% of her Elemental Mastery', note: 'Normal convertido em 150% da Maestria como Lunar-Florescer (gasta 1 stack de Pale Hymn): use no lugar do Normal.' },
  ],
  Zibai: [
    { id: 'c4', label: 'Zibai C4: Scattermoon Splendor', src: 'const4', special: LCR, scale: {}, of: { talent: 'skill', label: 'Lunar Phase Shift 4-Hit Additional DMG', fraction: { p: 0 } }, expect: 'will deal 250% of the original damage as Lunar-Crystallize Reaction DMG', note: 'O ataque extra do 4º Normal com 250% do dano original (use no lugar do golpe do kit depois de um Spirit Steed\'s Stride).' },
  ],
};

export { ALL_LUNAR };
