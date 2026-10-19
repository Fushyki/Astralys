/**
 * Curadoria de passivas e constelações, lote 7: o que faltava dos personagens antigos (Ayaka a Diona e seguintes), com
 * redução de DEF do inimigo (`defShred`). Mesmas regras de `characters.ts`.
 */
import type { BuffCuration } from './characters';

export const CHARACTERS_11: Record<string, BuffCuration[]> = {
  'Kamisato Ayaka': [
    { id: 'c4', label: 'Ayaka C4', src: 'const4', scope: 'self', timed: false, defShred: { p: 0 }, expect: 'DEF decreased by 30%', note: 'Assume a redução de DEF do inimigo (30%, 6 s depois dos Frostflake do Supremo) sempre ativa.' },
    { id: 'c6', label: 'Ayaka C6', src: 'const6', scope: 'self', timed: true, stats: { byType: { charged: { p: 1 } } }, expect: 'Charged Attack DMG by 298%', note: '+298% de DMG do Carregado a cada 10 s (apagado 0,5 s depois do Carregado acertar): ligue só no Carregado que o recebe.' },
  ],
  Lisa: [
    { id: 'a4', label: 'Lisa A4', src: 'p2', scope: 'self', timed: false, defShred: { p: 0 }, expect: 'DEF decreased by 15%', note: 'Assume a redução de DEF do inimigo (15%, 10 s) sempre ativa.' },
  ],
  Diluc: [
    { id: 'c4', label: 'Diluc C4', src: 'const4', scope: 'self', timed: true, stats: { byType: { skill: { p: 0 } } }, expect: 'deals 40% additional DMG', note: '+40% de DMG da habilidade no segundo Searing Onslaught do combo: ligue só nele.' },
    { id: 'c6', label: 'Diluc C6', src: 'const6', scope: 'self', timed: true, stats: { byType: { normal: { p: 1 } } }, expect: 'Normal Attacks within the next 6s will have their DMG and ATK SPD increased by 30%', note: '+30% de DMG dos 2 Normais seguintes à habilidade: ligue só neles. A velocidade de ataque não entra.' },
  ],
  Razor: [
    { id: 'c4', label: 'Razor C4', src: 'const4', scope: 'self', timed: false, defShred: { lit: 0.15 }, expect: 'opponents hit will have their DEF decreased by 15% for 7s', note: 'Assume a redução de DEF do inimigo (15%, 7 s) sempre ativa.' },
  ],
  Amber: [
    { id: 'a1', label: 'Amber A1', src: 'p1', scope: 'self', timed: false, stats: { critRateByType: { burst: { p: 0 } } }, expect: 'Increases the CRIT Rate of Fiery Rain by 10%', note: '+10% de Taxa Crítica só no Supremo (Fiery Rain).' },
  ],
  Xingqiu: [
    { id: 'c4', label: 'Xingqiu C4', src: 'const4', scope: 'self', timed: true, stats: { byType: { skill: { lit: 0.5 } } }, expect: 'Fatal Rainscreen is increased by 50%', note: '+50% de DMG da habilidade durante o Supremo: ligue na janela do Supremo.' },
  ],
  Klee: [
    { id: 'c2', label: 'Klee C2', src: 'const2', scope: 'self', timed: false, defShred: { lit: 0.23 }, expect: 'DEF will be decreased by 23% for 10s', note: 'Assume a redução de DEF do inimigo (23%, 10 s) sempre ativa.' },
    { id: 'c6s', label: 'Klee C6 (Klee)', src: 'const6', scope: 'self', timed: true, stats: { dmgPct: { lit: 0.5 } }, expect: 'Klee will gain a 50% Pyro DMG Bonus', note: '+50% de DMG Pyro dela por 25 s depois do Supremo: ligue na janela. O bônus de Hexerei não entra.' },
    { id: 'c6o', label: 'Klee C6 (equipe)', src: 'const6', scope: 'others', timed: true, forElements: ['Pyro'], stats: { dmgPct: { lit: 0.1 } }, expect: 'other party members will gain a 10% Pyro DMG Bonus', note: '+10% de DMG Pyro dos outros por 25 s depois do Supremo: ligue na janela. Só personagens Pyro recebem.' },
  ],
  Bennett: [
    { id: 'c1', label: 'Bennett C1', src: 'const1', scope: 'team', timed: true, convert: { from: 'baseAtk', perPoint: { p: 0 }, to: ['atkFlat'] }, expect: "additional 20% of Bennett's Base ATK", note: 'ATK fixo extra de 20% do ATK base dele dentro do Fantastic Voyage: ligue na janela do Supremo (sem a restrição de HP).' },
    { id: 'c6', label: 'Bennett C6', src: 'const6', scope: 'team', timed: true, stats: { dmgPct: { p: 0 } }, expect: 'gain a 15% Pyro DMG Bonus', note: '+15% de DMG Pyro de quem usa espada, montante ou lança dentro do Supremo: ligue só em quem se aplica. A infusão Pyro dos Normais não entra.' },
  ],
  Ganyu: [
    { id: 'c4', label: 'Ganyu C4', src: 'const4', scope: 'team', timed: true, stats: { dmgPct: { lit: 0.25 } }, expect: 'up to a maximum of 25%', note: 'Assume o DMG recebido pelo inimigo no máximo (+25%) dentro da área da Chuva Celestial: ligue na janela. Entra como DMG% da equipe.' },
  ],
  Albedo: [
    { id: 'c1', label: 'Albedo C1', src: 'const1', scope: 'self', timed: true, stats: { defPct: { p: 1 } }, expect: 'increases his DEF by 50% for the next 20s', note: '+50% de DEF por 20 s depois da habilidade (o dano dele escala com DEF): ligue na janela.' },
    { id: 'c4', label: 'Albedo C4', src: 'const4', scope: 'team', timed: true, stats: { byType: { plunge: { p: 0 } } }, expect: 'Plunging Attack DMG increased by 30%', note: '+30% de DMG do Imersivo de quem está no campo do Solar Isotoma: ligue na janela.' },
    { id: 'c6', label: 'Albedo C6', src: 'const6', scope: 'team', timed: true, stats: { dmgPct: { lit: 0.17 } }, expect: 'have their DMG increased by 17%', note: '+17% de DMG de quem está no campo e protegido por escudo de Cristalizar: ligue na janela.' },
  ],
};
