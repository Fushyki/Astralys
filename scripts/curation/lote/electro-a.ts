/**
 * Lote Electro A: Lisa, Razor, Beidou, Fischl, Keqing, Raiden Shogun. Cada número foi conferido contra o texto do Lunaris 7.1.53.
 * Correções em relação à curadoria antiga: Lisa A4 (-15% DEF por 10 s era permanente), Razor C4 (-15% DEF por 7 s era permanente),
 * Beidou C6 (-15% RES Electro durante o Stormbreaker era permanente), Keqing A4 (faltava +15% de Recarga) e C6 (stacks explícitos).
 * Novos: Razor C6 (relâmpago de 100% do ATK) e Razor A4 (raio Hexerei de 150% do ATK). Fischl e Raiden conferem e não mudam.
 */
import type { Lote } from './index';

const x = (note: string) => ({ kind: 'partial' as const, note });
const u = (note: string) => ({ kind: 'utility' as const, note });

export const LOTE: Lote = {
  buffs: {
    Lisa: [
      {
        id: 'a4', label: 'Lisa A4', src: 'p2', scope: 'self', timed: true, defShred: { p: 0 },
        expect: 'DEF decreased by 15%',
        note: 'DEF do inimigo -15% por 10 s depois de acertar o Lightning Rose: janela de tempo, o usuário liga e decide a duração. Antes estava sempre ligado.',
      },
    ],
    Razor: [
      {
        id: 'c4', label: 'Razor C4', src: 'const4', scope: 'self', timed: true, defShred: { lit: 0.15 },
        expect: 'opponents hit will have their DEF decreased by 15% for 7s',
        note: 'DEF do inimigo -15% por 7 s depois do Claw and Thunder (Press): janela de tempo, o usuário liga e decide a duração (15% é literal do texto). Antes estava sempre ligado.',
      },
    ],
    Beidou: [
      {
        id: 'c6', label: 'Beidou C6', src: 'const6', scope: 'self', timed: true, resShred: { value: { p: 0 }, elements: ['Electro'] },
        expect: 'Electro RES is reduced by 15%',
        note: 'RES Electro do inimigo -15% enquanto o Stormbreaker está ativo: janela de tempo, ligue na janela do Supremo. A parte da Radiância (RES Cryo e +200 de Maestria) NÃO entra. Antes estava sempre ligado.',
      },
    ],
    Keqing: [
      {
        id: 'a4', label: 'Keqing A4', src: 'p2', scope: 'self', timed: true, stats: { critRate: { p: 0 }, er: { p: 1 } },
        expect: 'CRIT Rate is increased by 15%, and her Energy Recharge is increased by 15%',
        note: '+15% de Taxa Crítica e +15% de Recarga de Energia por 8 s depois da habilidade: ligue nas janelas.',
      },
      {
        id: 'c6', label: 'Keqing C6', src: 'const6', scope: 'self', timed: true, stats: { dmgPct: { p: 0, x: 4 } },
        stacks: { max: 4, unit: 'efeitos independentes', default: 4 },
        expect: 'gains a 6% Electro DMG Bonus',
        note: '+6% de DMG Electro por efeito independente (Normal, Carregado, habilidade e Supremo, 4 no máximo), 8 s cada. Assume o teto de 4; escolha de 0 a 4.',
      },
    ],
  },

  procs: {
    Razor: [
      {
        id: 'c6l', label: 'Razor C6: relâmpago do Normal', src: 'const6', scale: { atk: { lit: 1 } },
        expect: "the next Normal Attack to release lightning that deals 100% of Razor's ATK as Electro DMG",
        note: '100% do ATK (literal do texto) como DMG Electro, a cada 10 s (o próximo Normal): adicione uma execução quando acontecer. O texto não diz se conta como Normal, então não recebe bônus de tipo de golpe.',
      },
      {
        id: 'a4h', label: 'Razor A4: raio Hexerei', src: 'p4', scale: { atk: { p: 1 } },
        expect: "dealing AoE Electro DMG equal to 150% of Razor's ATK",
        note: '150% do ATK em área, com o Wolf Within ativo, quando os Sigilos Electro transbordam (uma vez a cada 1 s). Só com a facção Hexerei ligada e 2 ou mais Hexerei no time: adicione uma execução quando acontecer.',
      },
    ],
  },

  notes: {
    Lisa: {
      const4: x('Pendente: o Lightning Rose dispara de 1 a 3 raios e o texto não diz quantos; o Discharge usa o dano do kit.'),
      const6: u('Só aplica 3 acúmulos do status Condutivo.'),
    },
    Razor: {
      p4: x('Entra o raio de 150% do ATK (golpe extra). Pendente: o +70% do ATK no dano do Wolf Within, que não é um golpe do cadastro (vale % do Normal). A Energia (7) é só informativa.'),
      const6: x('Entram o +10% de Taxa e +50% de Dano Crítico e o relâmpago de 100% do ATK. Os 3 Sigilos extras não entram (só Recarga).'),
    },
    Beidou: {
      p4: x('Pendente: o texto não dá o número do dano extra do Tidecaller com os acúmulos de poder. A recarga e a Energia são só informativas; a Radiância não entra.'),
      const4: x('Pendente: "20% Electro DMG" extra nos Normais depois de levar dano, o texto não diz 20% de quê (ATK ou dano do Normal).'),
      const6: x('Entra a RES Electro. Pendente: a Radiância (RES Cryo -15% e +200 de Maestria do personagem ativo) só vale dentro de um Polestar Field, condição que o texto não define.'),
    },
    Keqing: {
      p1: x('A infusão Electro dos Normais e Carregados (5 s) não entra: o elemento é o do personagem.'),
    },
  },

  infos: {
    Razor: [
      { src: 'p1', kind: 'recarga', label: 'Recarga do Claw and Thunder', text: 'cai {0%} e o Lightning Fang zera a recarga', values: [{ lit: 0.18 }], expect: "Decreases Claw and Thunder's CD by 18%" },
      { src: 'p2', kind: 'energia', label: 'Recarga de Energia com pouca Energia', text: '+{0%} de Recarga de Energia com a Energia abaixo de 50%', values: [{ lit: 0.3 }], expect: 'increases Energy Recharge by 30%' },
      { src: 'p4', kind: 'energia', label: 'Energia do raio Hexerei', text: '{0} de Energia a cada raio do Wolf Within', values: [{ p: 2 }], expect: 'restoring 7 Energy to Razor' },
    ],
    Beidou: [
      { src: 'p4', kind: 'recarga', label: 'Recarga e Energia do Tidecaller', text: 'a habilidade cai {0} s e ela recupera {1} de Energia por acúmulo ao soltar o Tidecaller acertando; no máximo uma vez a cada {2} s', values: [{ p: 0 }, { p: 1 }, { p: 2 }], expect: "decreases Beidou's Elemental Skill CD by 4s" },
      { src: 'const1', kind: 'escudo', label: 'Escudo do Stormbreaker', text: 'Escudo de {0%} do HP máximo por {1} s (absorve Electro 250% melhor)', values: [{ p: 0 }, { lit: 15 }], expect: "absorbs up to 16% of Beidou's Max HP for 15s" },
    ],
    Fischl: [
      { src: 'const4', kind: 'cura', label: 'Cura ao fim do Midnight Phantasmagoria', text: 'recupera {0%} do HP ao fim da habilidade', values: [{ p: 1 }], expect: 'regenerates 20% of her HP' },
    ],
    'Raiden Shogun': [
      { src: 'p2', kind: 'energia', label: 'Energia do Musou Isshin', text: '+{0%} de Energia restaurada pelo Musou Isshin para cada 1% de Recarga acima de 100%', values: [{ p: 1 }], expect: 'greater Energy restoration from Musou Isshin' },
      { src: 'const6', kind: 'recarga', label: 'Recarga do Supremo dos aliados', text: 'cai {0} s por acerto do Supremo dela no Musou Isshin; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'Elemental Burst CD by 1s' },
    ],
  },
};
