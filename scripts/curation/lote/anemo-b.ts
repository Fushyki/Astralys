/**
 * Lote Anemo B: Shikanoin Heizou, Wanderer, Faruzan, Lynette, Xianyun, Chasca. Conferido contra o Lunaris 7.1.53.
 * Correções: Heizou C6 (o +32% de Dano Crítico valia sempre; agora é janela própria, só com Convicção), Wanderer C2 (stacks
 * começavam no máximo), Faruzan Supremo (RES Anemo estava sempre ligado, agora é janela), Xianyun C6 (o Driftcloud Wave é golpe
 * de HABILIDADE no cadastro, o crítico estava em Imersivo). Novos: Wanderer Descent (A1 de ascensão p2 e C1) como golpes extras,
 * Xianyun C2 (Starwicker 400% / teto 18.000), Chasca A1 (stacks de dano do Shining Shadowhunt Shell) e C6 (+120% de Dano Crítico).
 */
import type { Lote } from './index';

const x = (note: string) => ({ kind: 'partial' as const, note });
const u = (note: string) => ({ kind: 'utility' as const, note });

export const LOTE: Lote = {
  buffs: {
    'Shikanoin Heizou': [
      {
        id: 'c6', label: 'Heizou C6 (Taxa Crítica)', src: 'const6', scope: 'self', timed: true, stats: { critRateByType: { skill: { p: 0, x: 4 } } },
        stacks: { max: 4, unit: 'Declension', default: 4 },
        expect: 'Each Declension stack will increase the CRIT Rate of the Heartstopper Strike unleashed by 4%',
        note: '+4% de Taxa Crítica por Declension (até 4 = 16%) no Heartstopper Strike (o Skill DMG dele): ligue a janela só no golpe e escolha os stacks de 0 a 4. O máximo de 4 stacks vem do multiplicador do texto antigo; confirmar.',
      },
      {
        id: 'c6cd', label: 'Heizou C6 (Convicção)', src: 'const6', scope: 'self', timed: true, stacks: false, stats: { critDmgByType: { skill: { p: 1 } } },
        expect: "this Heartstopper Strike's CRIT DMG is increased by 32%",
        note: '+32% de Dano Crítico no Heartstopper Strike quando ele tem Convicção. O texto não diz como se ganha a Convicção: ligue a janela só quando tiver. Antes estava junto do bônus de Taxa e sempre ligado.',
      },
    ],
    Wanderer: [
      {
        id: 'c2', label: 'Wanderer C2', src: 'const2', scope: 'self', timed: true, stats: { byType: { burst: { p: 1 } } },
        stacks: { max: 50, unit: 'pontos de Kuugoryoku', default: 0 },
        expect: 'will see its DMG increased by 4% per point',
        note: '+4% de DMG do Supremo por ponto de Kuugoryoku que faltava até o máximo, no máximo +200% (50 pontos). Escolha os pontos de 0 a 50 (padrão 0; antes assumia o máximo).',
      },
    ],
    Faruzan: [
      {
        id: 'burst-res', label: 'Faruzan: Pulso (RES)', src: 'kit', kit: { talent: 'burst', key: 'Anemo RES Decrease' }, scope: 'self', timed: true,
        resShred: { value: { lit: 1 }, elements: ['Anemo'] },
        expect: 'decreasing their Anemo RES',
        note: 'RES Anemo do inimigo reduzida pelo nível do Supremo enquanto o Perfidious Wind\'s Bale durar (a duração está no kit): janela de tempo (antes estava sempre ligado).',
      },
    ],
    Xianyun: [
      {
        id: 'c6', label: 'Xianyun C6', src: 'const6', scope: 'self', timed: true,
        stats: { critDmgByType: { skill: { p: 2 } } }, stacks: { max: 3, unit: 'Skyladders', levels: [{ p: 0 }, { p: 1 }, { p: 2 }] },
        expect: 'the CRIT DMG of a Driftcloud Wave created in this instance of Cloud Transmogrification will be increased by 15%/35%/70%',
        note: 'Dano Crítico do Driftcloud Wave: 15%/35%/70% com 1/2/3 Skyladders (escolha de 0 a 3). No cadastro o Driftcloud Wave é golpe de habilidade, então o bônus vale em TODO golpe de habilidade dela dentro da janela: ligue só nos Driftcloud Wave (o Skill DMG da cast inicial também receberia). Antes estava em Imersivo, onde o Wave não cai.',
      },
      {
        id: 'c2f', label: 'Xianyun C2 (Starwicker reforçado)', src: 'const2', scope: 'self', timed: false, replaces: 'a4',
        flat: [{ name: 'Starwicker (C2)', sourceStat: 'ATK', perPoint: { lit: 4 }, cap: { lit: 18000 }, hitTypes: ['plunge'], targets: 'team' }],
        expect: "Plunging Attack shockwave DMG will be increased by 400% of Xianyun's ATK",
        note: 'REFORÇA o A4: 400% do ATK dela (teto 18.000, literais do texto) somados ao dano de cada Imersivo da equipe, no lugar dos 200% / 9.000. Assume Adeptal Assistance ativo; o intervalo de 0,4 s por personagem não é limitado (use os usos do dano fixo na rotação).',
      },
    ],
    Chasca: [
      {
        id: 'a1', label: 'Chasca A1 (Spirit of the Radiant Shadow)', src: 'p1', scope: 'self', timed: true,
        stats: { byType: { skill: { p: 5 } } }, stacks: { max: 3, unit: 'Spirit of the Radiant Shadow', levels: [{ p: 3 }, { p: 4 }, { p: 5 }] },
        expect: 'increasing the DMG of Shining Shadowhunt Shell by 15%/35%/65%',
        note: 'DMG do Shining Shadowhunt Shell: 15%/35%/65% com 1/2/3 stacks (um por elemento diferente elegível no time; na C2 ela já começa com 1). No cadastro o Shining é golpe de habilidade, então o bônus vale em todo golpe de habilidade dela na janela: ligue só nos Shining Shadowhunt Shell. A conversão por chance do 3º projétil não entra.',
      },
      {
        id: 'c6', label: 'Chasca C6 (Fatal Rounds)', src: 'const6', scope: 'self', timed: true, stacks: false, stats: { critDmgByType: { skill: { p: 1 } } },
        expect: 'the CRIT DMG of that instance of Multitarget Fire',
        note: '+120% de Dano Crítico dos Shadowhunt Shells e Shining Shadowhunt Shells de um Multitarget Fire depois de uma Spiritbinding Conversion (estado de 3 s). No cadastro esses golpes são de habilidade: o bônus vale em todo golpe de habilidade dela na janela, ligue só no Multitarget Fire. O carregamento instantâneo não muda o dano.',
      },
    ],
  },

  procs: {
    Wanderer: [
      {
        id: 'p2', label: 'Wanderer: flechas do Descent (A1 de ascensão)', src: 'p2', scale: { atk: { p: 2, x: 4 } },
        expect: 'he will fire off 4 wind arrows that deal 35% of his ATK as Anemo DMG each',
        note: '4 flechas de 35% do ATK (Anemo, sem tipo de golpe) por Descent. O Descent vem de 16% de chance (+12% a cada falha): adicione uma execução quando acontecer.',
      },
      {
        id: 'c1', label: 'Wanderer C1: flechas do Descent (+25% do ATK)', src: 'const1', scale: { atk: { p: 1, x: 4 } },
        expect: 'the wind arrows fired by the Ascension Talent "Gales of Reverie" will deal an additional 25% of his ATK as DMG',
        note: 'Soma 25% do ATK em cada uma das 4 flechas do Descent: adicione junto do golpe "flechas do Descent" (mesma execução). A velocidade de ataque de +10% não entra.',
      },
    ],
  },

  notes: {
    'Shikanoin Heizou': {
      const6: x('Entram +4% de Taxa Crítica por Declension e +32% de Dano Crítico com Convicção (duas janelas) no Heartstopper Strike.'),
    },
    Wanderer: {
      p1: x('Entram Pyro (+30% de ATK) e Cryo (+20% de Taxa Crítica) como janelas; escolha até 2 elementos. Hydro (+20 no teto de Kuugoryoku) não muda o dano; Electro (energia) está só em informativo.'),
      p2: x('Entram as 4 flechas de 35% do ATK como golpe extra (adicione quando o Descent ocorrer). O Descent também poupa Kuugoryoku, o que não muda o dano.'),
      const1: x('Entram os +25% do ATK nas flechas do Descent (golpe extra). A velocidade de ataque não muda o dano.'),
      const4: x('Pendente: o buff do elemento aleatório não tem elemento definido no texto; os buffs de elemento tocado já estão no A1 de ascensão.'),
      const6: x('Pendente: o Fushoudan extra (40% do dano original, conta como Normal) não entra porque o Kuugo: Fushoudan não está no cadastro de golpes (é definido como % de outro ataque). A restauração de 4 pontos de Kuugoryoku não muda o dano.'),
    },
    Faruzan: {
      p2: x('Entra o Hurricane Guard (32% do ATK base dela em golpes Anemo da equipe, dano fixo). No jogo ele dispara uma vez por 0,8 s e se apaga ao disparar: ajuste os usos do dano fixo na rotação, senão vale em todo golpe Anemo.'),
      const6: x('Entra o +40% de Dano Crítico Anemo de quem está sob o Benefício do Vento (janela). A aplicação do Pressurized Collapse a cada 3 s não entra.'),
    },
    Lynette: {
      const6: x('Entram +20% de DMG Anemo por 6 s (janela). A infusão Anemo do Enigma Thrust NÃO muda o elemento sozinha: marque o elemento Anemo nos golpes dela que seriam Físicos.'),
    },
    Xianyun: {
      p1: x('Entra o +4/6/8/10% de Taxa Crítica de Imersivo da equipe (escolha os stacks). Pendente: o Driftcloud Wave conta como Imersivo no jogo, mas no cadastro é golpe de habilidade, então o bônus não chega nele.'),
      p2: x('Entra o dano fixo de 200% do ATK dela (teto 9.000) em todo Imersivo da equipe, assumindo Adeptal Assistance ativo.'),
      const2: x('Entram +20% de ATK por 15 s (janela) e o Starwicker reforçado (400% / 18.000, no lugar do A4).'),
    },
    Chasca: {
      p1: x('Entram os stacks de dano do Shining Shadowhunt Shell (janela). Pendente: a conversão do 3º projétil por chance e o elemento resultante dependem do time e da sorte; o elemento do Shining não é calculado.'),
      p2: x('Pendente: o Burning Shadowhunt Shot (150% do dano do Shadowhunt Shell, conta como Carregado) tem elemento que depende do time (Anemo ou o elemento convertido) e gatilho em Nightsoul Burst de aliado, então não entra.'),
      p4: u('Só Phlogiston ao derrotar inimigo.'),
      const1: x('Só chance de conversão e redução do custo de Nightsoul/Phlogiston fora de combate: não muda o dano.'),
      const2: x('Entra o stack inicial do A1 (escolha 1+ stacks). Pendente: o dano extra de 400% do ATK (conta como Carregado) tem o elemento do Shining Shell, que depende do time e da conversão, então não entra.'),
      const4: x('Pendente: o dano extra de 400% do ATK dos Radiant Soulseeker Shells (conta como Carregado) tem o elemento do Shell, que depende do time e da conversão, então não entra. A energia está em informativo.'),
      const6: x('Entra o +120% de Dano Crítico dos Shells (janela). O carregamento instantâneo e a chance de conversão não mudam o dano.'),
    },
  },

  infos: {
    'Shikanoin Heizou': [
      { src: 'const4', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia na 1ª explosão do Windmuster Iris de cada Windmuster Kick e +{1} em cada explosão seguinte, no máximo {2} por uso', values: [{ p: 0 }, { p: 1 }, { lit: 13.5 }], expect: 'will regenerate 9 Elemental Energy for Shikanoin Heizou' },
    ],
    Wanderer: [
      { src: 'p1', kind: 'energia', label: 'Energia com Electro', text: '{0} de Energia por acerto de Normal ou Carregado no Windfavored com Electro; no máximo uma vez a cada {1} s', values: [{ p: 3 }, { lit: 0.2 }], expect: 'When Normal and Charged Attacks hit an opponent, 0.8 Energy will be restored' },
    ],
    Faruzan: [
      { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia com 1 inimigo no vórtice e +{1} por inimigo a mais, no máximo {2} por vórtice', values: [{ p: 0 }, { p: 1 }, { lit: 4 }], expect: 'it will restore 2 Energy for Faruzan' },
    ],
    Xianyun: [
      { src: 'const4', kind: 'cura', label: 'Cura do Driftcloud Wave', text: 'Com 1/2/3 Skyladders, o Driftcloud Wave cura os aliados próximos em {0%}/{1%}/{2%} do ATK dela; no máximo uma vez a cada {3} s', values: [{ p: 0 }, { p: 1 }, { p: 2 }, { p: 3 }], expect: 'it will heal all nearby party members for 50%/80%/150% of Xianyun' },
    ],
    Chasca: [
      { src: 'p4', kind: 'energia', label: 'Phlogiston ao derrotar inimigo', text: '{0} de Phlogiston quando alguém do time derrota um inimigo; no máximo uma vez a cada {1} s (sem efeito em domínios e Abismo)', values: [{ p: 0 }, { p: 1 }], expect: '25 Phlogiston will be restored' },
      { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia quando os Radiant Soulseeker Shells acertam', values: [{ p: 0 }], expect: 'they will restore 1.5 Elemental Energy to Chasca' },
    ],
  },
};
