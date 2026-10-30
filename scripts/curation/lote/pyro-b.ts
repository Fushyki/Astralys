/**
 * Lote Pyro B: Yanfei, Yoimiya, Thoma, Dehya, Lyney, Chevreuse. Cada número foi conferido contra o texto do Lunaris 7.1.53.
 * Correções em relação à curadoria antiga: Yanfei C6 (valia +100% por ler o parâmetro errado), Thoma A4 (valia no Skill DMG
 * do Supremo também), Dehya C1 (Molten Inferno incluía o Field DMG) e C6 (Dano Crítico sobe até 60%, não só 15%),
 * Lyney A4 (+20% por outro Pyro) e C4 (debuff de 6 s era permanente), Chevreuse A1 (debuff de 6 s era permanente).
 */
import type { Lote } from './index';

const x = (note: string) => ({ kind: 'partial' as const, note });

export const LOTE: Lote = {
  buffs: {
    Yanfei: [
      {
        // O C6 antigo lia const6 p0 (=1, o nº de Selos) como 100% de DMG. O bônus é 5% por Selo (texto do A1), agora com 4 Selos.
        id: 'c6', label: 'Yanfei C6 (A1 com 4 Selos)', src: 'const6', scope: 'self', timed: true, replaces: 'a1',
        stats: { dmgPct: { lit: 0.2 } },
        stacks: { max: 4, unit: 'selos', default: 4 },
        expect: 'Increases the maximum number of Scarlet Seals by 1',
        note: 'REFORÇA o A1 (não soma): com 4 Selos gastos no Carregado, +5% de DMG Pyro por Selo (5% é literal do A1), 20% no máximo, por 6 s. Assume que o limite base é 3 Selos (o texto só diz "+1"; o 3 vem do jogo, confirmar). Escolha os Selos de 0 a 4.',
      },
    ],
    Thoma: [
      {
        id: 'a4', label: 'Thoma A4 (Fiery Collapse)', src: 'p2', scope: 'self', timed: false,
        flat: [{ name: 'Fiery Collapse por HP', sourceStat: 'HP', perPoint: { p: 0 }, hitTypes: ['burst'], labels: ['Fiery Collapse DMG'] }],
        expect: "increased by 2.2% of Thoma's Max HP",
        note: 'Soma 2,2% do HP máximo ao dano base de cada Fiery Collapse (os golpes que o Supremo dispara nos Normais). O golpe inicial do Supremo (Skill DMG) NÃO recebe.',
      },
    ],
    Dehya: [
      {
        id: 'c1s', label: 'Dehya C1 (Molten Inferno)', src: 'const1', scope: 'self', timed: false,
        flat: [{ name: 'Molten Inferno por HP', sourceStat: 'HP', perPoint: { p: 1 }, hitTypes: ['skill'], labels: ['Indomitable Flame DMG', 'Ranging Flame DMG'] }],
        expect: "Molten Inferno's DMG will be increased by 3.6% of her Max HP",
        note: 'Soma 3,6% do HP máximo ao dano base do Indomitable Flame e do Ranging Flame (as duas formas do Molten Inferno). O Field DMG do Fiery Sanctum NÃO recebe.',
      },
      {
        id: 'c6', label: 'Dehya C6 (Taxa Crítica)', src: 'const6', scope: 'self', timed: false, stats: { critRateByType: { burst: { p: 0 } } },
        expect: 'The CRIT Rate of Leonine Bite is increased by 10%',
        note: '+10% de Taxa Crítica nos golpes do Leonine Bite (Flame-Mane\'s Fist e Incineration Drive), sempre.',
      },
      {
        id: 'c6cd', label: 'Dehya C6 (Dano Crítico)', src: 'const6', scope: 'self', timed: false,
        stats: { critDmgByType: { burst: { p: 1, x: 4 } } },
        stacks: { max: 4, unit: 'acúmulos de Dano Crítico', default: 4 },
        expect: 'it will cause the CRIT DMG of Leonine Bite to increase by 15%',
        note: '+15% de Dano Crítico do Leonine Bite por acúmulo (Flame-Mane\'s Fist com crítico), até 60% (4 acúmulos, o teto do texto). Assume o teto; escolha de 0 a 4. Substitui o +15% único da curadoria antiga.',
      },
    ],
    Lyney: [
      {
        id: 'a4', label: 'Lyney A4', src: 'p2', scope: 'self', timed: false, stats: { dmgPct: { p: 0 } },
        expect: 'Increases the DMG dealt by 60%',
        note: 'Assume o inimigo sob Pyro: +60% de DMG. Os +20% por outro Pyro do time estão em "Lyney A4 (outros Pyro)".',
      },
      {
        id: 'a4t', label: 'Lyney A4 (outros Pyro)', src: 'p2', scope: 'self', timed: false, stats: { dmgPct: { lit: 1 } },
        team: { scale: { of: ['Pyro'], table: [{ lit: 0 }, { p: 1 }, { p: 1, x: 2 }, { p: 1, x: 2 }] } },
        expect: 'will cause the DMG dealt to increase by an additional 20%',
        note: '+20% de DMG por outro membro Pyro do time (o time conta o Lyney: 2 Pyro = +20%, 3 ou 4 = +40%, teto de 100% com os 60% do A4). Assume o inimigo sob Pyro.',
      },
      {
        id: 'c4', label: 'Lyney C4', src: 'const4', scope: 'self', timed: true, resShred: { value: { p: 0 }, elements: ['Pyro'] },
        expect: 'Pyro RES will be decreased by 20%',
        note: 'RES Pyro do inimigo -20% por 6 s depois de um Carregado Pyro dele acertar: janela de tempo, o usuário liga e decide a duração. Antes estava sempre ligado.',
      },
      {
        id: 'a1', label: 'Lyney A1 (chapéu)', src: 'p1', scope: 'self', timed: false,
        flat: [{ name: 'Pyrotechnic Strike do chapéu (A1)', sourceStat: 'ATK', perPoint: { p: 1 }, hitTypes: ['normal'], labels: ['Pyrotechnic Strike DMG'] }],
        expect: 'increase DMG dealt by 80% of his ATK',
        note: 'Soma 80% do ATK ao dano base do Pyrotechnic Strike (o golpe do chapéu), assumindo que o Prop Arrow gastou HP. A explosão do chapéu feita pela habilidade NÃO entra (o texto não diz se recebe).',
      },
    ],
    Chevreuse: [
      {
        id: 'a1', label: 'Chevreuse A1', src: 'p1', scope: 'self', timed: true,
        resShred: { value: { p: 0 }, elements: ['Pyro', 'Electro'] }, team: { only: ['Pyro', 'Electro'], eachOf: ['Pyro', 'Electro'] },
        expect: 'the Pyro and Electro RES of the opponent(s) affected by this Overloaded reaction will be decreased by 40%',
        note: 'Só com time só de Pyro e Electro (ao menos um de cada). RES Pyro e Electro do inimigo -40% por 6 s depois de Sobrecarregar: janela de tempo, o usuário liga e decide a duração. Antes estava sempre ligado.',
      },
    ],
  },

  procs: {
    Dehya: [
      {
        id: 'c2', label: 'Dehya C2: ataque coordenado reforçado', src: 'const2', scale: {}, hitType: 'skill',
        of: { talent: 'skill', label: 'Field DMG', fraction: { p: 1 } },
        expect: 'DMG dealt by its next coordinated attack will be increased by 50%',
        note: '+50% do Field DMG do Fiery Sanctum, somado como golpe extra de 50% desse golpe (só o PRÓXIMO ataque coordenado, depois que um personagem do campo é atacado: adicione uma execução quando acontecer). Conta como habilidade.',
      },
    ],
  },

  notes: {
    Dehya: {
      const2: x('Entra o +50% do próximo ataque coordenado do Fiery Sanctum (golpe extra). A duração do campo (+6 s) não entra.'),
    },
    Lyney: {
      p1: x('Entra o +80% do ATK no Pyrotechnic Strike (assumindo gasto de HP). A explosão do chapéu feita pela habilidade fica de fora e a Energia (3) é só informativa.'),
    },
  },

  infos: {
    Yanfei: [
      { src: 'const4', kind: 'escudo', label: 'Escudo do Done Deal', text: 'Escudo de {0%} do HP máximo por {1} s (absorve Pyro 250% melhor)', values: [{ p: 0 }, { lit: 15 }], expect: "Creates a shield that absorbs up to 45% of Yanfei's Max HP for 15s" },
    ],
    Yoimiya: [
      { src: 'const4', kind: 'recarga', label: 'Recarga do Niwabi Fire-Dance', text: 'cai {0} s quando a explosão da Aurous Blaze dela dispara', values: [{ p: 0 }], expect: 'CD is decreased by 1.2s' },
    ],
    Thoma: [
      { src: 'p1', kind: 'escudo', label: 'Força do escudo', text: '+{0%} de força do escudo por {1} s, até {2} acúmulos, ao obter ou renovar uma Blazing Barrier', values: [{ p: 0 }, { p: 1 }, { p: 2 }], expect: 'Shield Strength will increase by 5% for 6s' },
      { src: 'const1', kind: 'recarga', label: 'Recarga da habilidade e do Supremo', text: 'a habilidade cai {0} s e o Supremo {1} s; no máximo uma vez a cada {2} s', values: [{ p: 0 }, { p: 1 }, { p: 2 }], expect: 'CD is decreased by 3s' },
      { src: 'const4', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia depois de usar o Crimson Ooyoroi', values: [{ p: 0 }], expect: '15 Energy will be restored to Thoma' },
    ],
    Dehya: [
      { src: 'p2', kind: 'cura', label: 'Cura de emergência', text: 'Com HP abaixo de {0%}, recupera {1%} do HP máximo e mais {2%} a cada {3} s por {4} s; uma vez a cada {5} s', values: [{ p: 0 }, { p: 1 }, { p: 2 }, { p: 3 }, { p: 4 }, { p: 5 }], expect: 'Dehya will recover 20% of her Max HP' },
      { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia por acerto do Flame-Mane\'s Fist e da Incineration Drive; no máximo uma vez a cada {2} s', values: [{ p: 0 }, { p: 1 }, { p: 2 }], expect: 'they will restore 1.5 Energy for Dehya and 2.5% of her Max HP' },
      { src: 'const4', kind: 'cura', label: 'Cura do Leonine Bite', text: '{1%} do HP máximo dela por acerto do Flame-Mane\'s Fist e da Incineration Drive; no máximo uma vez a cada {2} s', values: [{ p: 0 }, { p: 1 }, { p: 2 }], expect: 'they will restore 1.5 Energy for Dehya and 2.5% of her Max HP' },
    ],
    Lyney: [
      { src: 'p1', kind: 'energia', label: 'Energia do chapéu', text: '{0} de Energia quando o chapéu (com gasto de HP) acerta um inimigo', values: [{ p: 0 }], expect: 'restore 3 Energy to Lyney' },
    ],
    Chevreuse: [
      { src: 'const1', kind: 'energia', label: 'Energia do aliado', text: '{0} de Energia ao aliado que dispara Sobrecarregar; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'they will recover 6 Energy' },
      { src: 'const4', kind: 'recarga', label: 'Recarga do modo Hold', text: 'o Hold não entra em recarga por até {1} disparos ou {0} s depois do Ring of Bursting Grenades', values: [{ p: 0 }, { p: 1 }], expect: 'will not go on cooldown when Chevreuse uses it' },
      { src: 'const6', kind: 'cura', label: 'Cura em 12 s', text: 'os aliados próximos recuperam {1%} do HP máximo dela, uma vez, {0} s depois da cura da habilidade', values: [{ p: 0 }, { p: 1 }], expect: "recover HP equivalent to 10% of Chevreuse's Max HP" },
    ],
  },
};
