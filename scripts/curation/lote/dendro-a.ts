/**
 * Lote Dendro A: Kirara, Collei, Tighnari, Nahida, Yaoyao, Alhaitham, Kaveh. Cada número foi conferido contra o texto do Lunaris 7.1.53.
 * Correções em relação à curadoria antiga: Nahida C2 (DEF -30% durava 8 s e estava sempre ligada; faltava o crítico das reações),
 * Tighnari A4 (vale também no Fashioner's Tanglevine Shaft, o Supremo) e C4 (+60 extra de Maestria se a reação acontecer),
 * Alhaitham C4 (entra: +30 de Maestria por Espelho consumido nos demais, +10% de DMG Dendro por Espelho gerado nele),
 * Tighnari C6 e Yaoyao C6 (o tipo de golpe Carregado/Supremo vinha só do Genshin Optimizer; o texto não diz, saiu).
 */
import type { Lote } from './index';

const x = (note: string) => ({ kind: 'partial' as const, note });

export const LOTE: Lote = {
  buffs: {
    Tighnari: [
      {
        id: 'a4', label: 'Tighnari A4', src: 'p2', scope: 'self', timed: false,
        convert: { from: 'em', perPoint: { p: 0 }, cap: { p: 1 }, to: ['charged', 'burst'] },
        expect: "his Charged Attack and Fashioner's Tanglevine Shaft DMG are increased by 0.06%",
        note: '+0,06% de DMG por ponto de Maestria, teto de 60%, nos Carregados e no Supremo (Fashioner\'s Tanglevine Shaft e o Secondary Tanglevine Shaft), sempre. Pendente: o Wreath Arrow e o Clusterbloom Arrow estão cadastrados como Normal em moves.json, então não recebem.',
      },
      {
        id: 'c4r', label: 'Tighnari C4 (reação)', src: 'const4', scope: 'team', timed: true, stats: { em: { lit: 60 } },
        expect: 'their Elemental Mastery will be further increased by 60',
        note: 'Soma +60 de Maestria à equipe (além dos +60 do C4) quando o Fashioner\'s Tanglevine Shaft dispara Queimadura, Florescer, Lunar-Florescer, Acelerar ou Propagar: ligue a janela só quando a reação acontecer (renova os 8 s).',
      },
    ],
    Nahida: [
      {
        id: 'a4', label: 'Nahida A4', src: 'p2', scope: 'self', timed: false,
        convert: { from: 'em', perPoint: { p: 2 }, threshold: { p: 0 }, cap: { p: 2, x: 800 }, to: ['skill'] },
        expect: "Each point of Nahida's Elemental Mastery beyond 200 will grant 0.1% Bonus DMG",
        note: '+0,1% de DMG por ponto de Maestria acima de 200, até 80%, sempre. Pendente: vale só na Tri-Karma Purification, mas entra em todo golpe de habilidade dela (o Press e o Hold recebem por engano; o formato só separa por tipo). A Taxa Crítica (0,03% por ponto, até 24%) não entra.',
      },
      {
        id: 'c2', label: 'Nahida C2 (DEF)', src: 'const2', scope: 'self', timed: true, defShred: { p: 1 },
        expect: 'DEF is decreased by 30%',
        note: 'DEF do inimigo -30% por 8 s depois de Acelerar, Intensificar ou Propagar, só em inimigo marcado pelas Sementes de Skandha da própria Nahida: janela de tempo, o usuário liga. Antes estava sempre ligado.',
      },
      {
        id: 'c2c', label: 'Nahida C2 (crítico das reações)', src: 'const2', scope: 'team', timed: true,
        stats: {
          reactionBonus: {
            burningCritRate: { p: 0 }, burningCritDmg: { lit: 1 }, bloomCritRate: { p: 0 }, bloomCritDmg: { lit: 1 },
            hyperbloomCritRate: { p: 0 }, hyperbloomCritDmg: { lit: 1 }, burgeonCritRate: { p: 0 }, burgeonCritDmg: { lit: 1 },
            lunarbloomCritRate: { p: 3 }, lunarbloomCritDmg: { p: 4 },
          },
        },
        expect: 'CRIT Rate and CRIT DMG are fixed at 20% and 100% respectively',
        note: 'Em inimigo marcado pelas Sementes da própria Nahida: Queimadura, Florescer, Hiperflorescer e Brotar podem critar (Taxa 20%, Dano Crítico 100%) e o Lunar-Florescer ganha +10% de Taxa e +20% de Dano Crítico. A duração das Sementes não está no texto: o usuário liga a janela.',
      },
    ],
    Alhaitham: [
      {
        id: 'a4', label: 'Alhaitham A4', src: 'p2', scope: 'self', timed: false,
        convert: { from: 'em', perPoint: { p: 0 }, cap: { p: 1 }, to: ['skill', 'burst'] },
        expect: "Alhaitham's Elemental Mastery will increase the DMG dealt by Projection Attacks",
        note: '+0,1% de DMG por ponto de Maestria, até 100%, na habilidade (Projection Attacks) e no Supremo (Particular Field), sempre. Pendente: o Rush Attack também é habilidade e recebe por engano (o formato só separa por tipo).',
      },
      {
        id: 'c4m', label: 'Alhaitham C4 (Maestria dos aliados)', src: 'const4', scope: 'others', timed: true, stats: { em: { p: 0, x: 3 } },
        stacks: { max: 3, unit: 'Espelhos consumidos', default: 3 },
        expect: 'Each Mirror consumed will increase the Elemental Mastery of all other nearby party members by 30 for 15s',
        note: '+30 de Maestria dos demais por Espelho consumido pelo Supremo, por 15 s. Escolha de 0 a 3 Espelhos (3 é o máximo de Espelhos do kit; o padrão assume os 3 consumidos).',
      },
      {
        id: 'c4d', label: 'Alhaitham C4 (DMG Dendro)', src: 'const4', scope: 'self', timed: true, stats: { dmgPct: { p: 2, x: 3 } },
        stacks: { max: 3, unit: 'Espelhos gerados', default: 3 },
        expect: 'Each Mirror generated will grant Alhaitham a 10% Dendro DMG Bonus for 15s',
        note: '+10% de DMG Dendro por Espelho gerado depois do Supremo (consumidos + gerados = 3), por 15 s. Escolha de 0 a 3 (o padrão assume 3 gerados, como o C6 garante).',
      },
    ],
  },

  procs: {
    Tighnari: [
      {
        id: 'c6', label: 'Tighnari C6: Clusterbloom extra', src: 'const6', scale: { atk: { p: 1 } },
        expect: "This arrow deals 150% of Tighnari's ATK as DMG",
        note: '150% do ATK por Wreath Arrow, como dano Dendro. Pendente: o texto não diz o tipo do golpe, então não recebe bônus de Carregado.',
      },
    ],
    Yaoyao: [
      {
        id: 'c6', label: 'Yaoyao C6: Mega Rabanete', src: 'const6', scale: { atk: { p: 1 } },
        expect: "Deals AoE Dendro DMG based on 75% of Yaoyao's ATK",
        note: '75% do ATK por Mega Radish (até 2 por Yuegui: Throwing Mode). Pendente: o texto não diz o tipo do golpe, então não recebe bônus de Supremo.',
      },
    ],
  },

  notes: {
    Kirara: {
      const1: x('Pendente: cada Cat Grass Cardamom extra (1 a cada 8.000 de HP máximo, até 4) explode no Supremo, mas o texto não diz quantas explosões acertam; some execuções do Cat Grass Cardamom Explosion DMG à mão.'),
    },
    Tighnari: {
      p2: x('Pendente: Wreath Arrow e Clusterbloom Arrow estão cadastrados como Normal e ficam sem o bônus de Carregado.'),
      const1: x('Pendente: a Taxa Crítica só entra no Carregado cadastrado como tal (Aimed Shot); Wreath Arrow e Clusterbloom Arrow estão como Normal.'),
    },
    Nahida: {
      p2: x('Entra o DMG da Tri-Karma Purification (e, por limite do formato, de todo golpe de habilidade). Pendente: a Taxa Crítica (0,03% por ponto, até 24%) não cabe no formato.'),
    },
    Yaoyao: {
      p1: x('Pendente: o dano dos rabanetes lançados correndo (um a cada 0,6 s) não entra, pois o texto não diz quanto tempo ela corre; adicione execuções do White Jade Radish DMG à mão.'),
    },
    Alhaitham: {
      const4: null,
    },
  },

  infos: {
    Kirara: [
      { src: 'p1', kind: 'escudo', label: 'Escudos do Reinforced Packaging', text: 'Cada acúmulo (até {1}) cria um escudo com {0%} da absorção do Shield of Safe Transport', values: [{ p: 0 }, { p: 1 }], expect: 'Max 3 stacks' },
      { src: 'const2', kind: 'escudo', label: 'Critical Transport Shield', text: 'Escudo de {0%} da absorção máxima do Shield of Safe Transport por {1} s (absorve Dendro 250% melhor); uma vez a cada {2} s por personagem', values: [{ p: 0 }, { p: 1 }, { p: 2 }], expect: 'The DMG absorption of Critical Transport Shield is 40%' },
    ],
    Collei: [
      { src: 'const1', kind: 'energia', label: 'Recarga fora de campo', text: '+{0%} de Recarga de Energia enquanto está no time e fora de campo', values: [{ p: 0 }], expect: "Collei's Energy Recharge is increased by 20%" },
    ],
    Yaoyao: [
      { src: 'p2', kind: 'cura', label: 'Cura dos rabanetes', text: 'O personagem ativo recupera {1%} do HP máximo dela a cada {0} s por {2} s', values: [{ p: 0 }, { p: 1 }, { p: 2 }], expect: "based on 0.8% of Yaoyao's Max HP" },
      { src: 'const2', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia por explosão de rabanete; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: '3 Energy will be restored to Yaoyao' },
      { src: 'const6', kind: 'cura', label: 'Cura do Mega Rabanete', text: '{0%} do HP máximo dela para o personagem ativo', values: [{ p: 2 }], expect: "Restores HP for the active character based on 7.5% of Yaoyao's Max HP" },
    ],
    Kaveh: [
      { src: 'p1', kind: 'cura', label: 'Cura com o Dendro Core', text: 'Recupera {0%} da Maestria dele em HP quando o dano de um Dendro Core o atinge; no máximo uma vez a cada {1} s', values: [{ p: 1 }, { p: 0 }], expect: 'Kaveh will regain HP equal to 300% of his Elemental Mastery' },
    ],
  },
};
