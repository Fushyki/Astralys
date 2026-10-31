/**
 * Lote Anemo C: Lan Yan, Yumemizuki Mizuki, Ifa, Jahoda, Varka, Prune, Vesna. Conferido contra o Lunaris 7.1.53.
 * Correções: Mizuki C2 (a RES era sempre ligada e o bônus de DMG por Maestria faltava), Prune C6 (vale também para ela, não só
 * para os outros) e C2 (agora com os estágios de 10% a 40%), Varka A4/C6 (C6 usa os mesmos stacks do A4).
 * Novos: Lan Yan A1 (anel extra), Mizuki A4 de ascensão (Maestria do time e os dois golpes extras) e o aumento de Redemoinho
 * do kit, Varka A1 (1,4x e 2,2x) e C4 por elemento, Prune A4 de Hexerei, Vesna C1.
 */
import type { Lote } from './index';

const x = (note: string) => ({ kind: 'partial' as const, note });
const u = (note: string) => ({ kind: 'utility' as const, note });
const SS = { reaction: 'stellarswirl' } as const;

const ELEMENTOS = [['pyro', 'Pyro', 'Pyro'], ['hydro', 'Hydro', 'Hydro'], ['cryo', 'Cryo', 'Cryo'], ['electro', 'Electro', 'Electro']] as const;

export const LOTE: Lote = {
  buffs: {
    'Yumemizuki Mizuki': [
      {
        id: 'c2', label: 'Mizuki C2 (RES)', src: 'const2', scope: 'self', timed: true,
        resShred: { value: { p: 1 }, elements: ['Pyro', 'Hydro', 'Cryo', 'Electro', 'Anemo'] },
        expect: 'of nearby opponents are lowered by 20%',
        note: 'RES Pyro, Hydro, Cryo, Electro e Anemo do inimigo -20% enquanto ela está no Dreamdrifter (5 s no nível base, +2,5 s por Redemoinho do A1): janela de tempo (antes estava sempre ligado).',
      },
      {
        id: 'c2d', label: 'Mizuki C2 (DMG por Maestria)', src: 'const2', scope: 'team', timed: true, forElements: ['Pyro', 'Hydro', 'Cryo', 'Electro'],
        convert: { from: 'em', perPoint: { p: 0 }, to: ['dmgPct'] },
        expect: "increase all nearby party members' Pyro, Hydro, Cryo, and Electro DMG Bonuses by 0.04%",
        note: '+0,04% de DMG Pyro, Hydro, Cryo e Electro por ponto de Maestria dela, para a equipe, enquanto durar o Dreamdrifter: ligue a janela. Só personagens desses quatro elementos recebem.',
      },
      {
        id: 'skill-swirl', label: 'Mizuki: Dreamdrifter (Redemoinho)', src: 'kit', kit: { talent: 'skill', key: 'Elemental Mastery-Based Swirl DMG Increase' },
        scope: 'team', timed: true, convert: { from: 'em', perPoint: { lit: 0.01 }, to: ['swirl'] },
        expect: "Increases the Swirl DMG and Stellar Swirl reaction DMG that nearby party members deal based on Yumemizuki Mizuki's Elemental Mastery",
        note: '+18% (nível 1) a +60% (nível 15) de DMG de Redemoinho por 100 de Maestria dela, para a equipe, durante o Dreamdrifter: ligue a janela.',
      },
      {
        id: 'skill-stellar', label: 'Mizuki: Dreamdrifter (Redemoinho Estelar)', src: 'kit', kit: { talent: 'skill', key: 'Elemental Mastery-Based Stellar Swirl DMG Increase' },
        scope: 'team', timed: true, convert: { from: 'em', perPoint: { lit: 0.01 }, to: ['stellarswirl'] },
        expect: "Increases the Swirl DMG and Stellar Swirl reaction DMG that nearby party members deal based on Yumemizuki Mizuki's Elemental Mastery",
        note: '+1,8% (nível 1) a +6% (nível 15) de DMG de Redemoinho Estelar por 100 de Maestria dela, para a equipe, durante o Dreamdrifter: ligue a janela.',
      },
      {
        id: 'p4em', label: 'Mizuki A4 (Maestria do time)', src: 'p4', scope: 'others', timed: true, convert: { from: 'em', perPoint: { p: 2 }, to: ['em'] },
        expect: 'the Elemental Mastery of nearby party characters is also increased by 10% of her Elemental Mastery',
        note: '+10% da Maestria dela para os demais enquanto durar o Dreamdrifter: ligue a janela. Hipótese: os demais, sem ela (o texto diz "personagens próximos do grupo" sem dizer se ela entra).',
      },
    ],
    Varka: [
      {
        id: 'a1m', label: 'Varka A1 (1,4x)', src: 'p1', scope: 'self', timed: true, stacks: false, stats: { baseMultByType: { normal: { lit: 0.4 }, charged: { lit: 0.4 } } },
        expect: 'will deal 140% of their original DMG',
        note: 'Sturm und Drang com 2+ Anemo OU 2+ do mesmo elemento entre Pyro/Hydro/Electro/Cryo: Normal e Carregado causam 140% do dano original (+40% no dano base). Ligue a janela do modo; com as duas condições use "Varka A1 (2,2x)" no lugar. Pendente: Azure Devour e Four Winds\' Ascension são golpes de habilidade e o formato multiplica por tipo, não por rótulo.',
      },
      {
        id: 'a1m2', label: 'Varka A1 (2,2x)', src: 'p1', scope: 'self', timed: true, stacks: false, stats: { baseMultByType: { normal: { lit: 0.8 }, charged: { lit: 0.8 } } },
        expect: 'the aforementioned effect will be increased to 220%',
        note: 'Com 2+ Anemo E 2+ de outro elemento igual: Normal e Carregado causam 220% do dano original (+120% no dano base): soma +80% ao "Varka A1 (1,4x)" (40% + 80% = 120%), então ligue as duas janelas. Mesma pendência dos golpes de habilidade.',
      },
      {
        id: 'a4', label: 'Varka A4', src: 'p2', scope: 'self', timed: true, stats: { byType: { normal: { p: 1, x: 4 }, charged: { p: 1, x: 4 } } },
        expect: 'by 7.5% for 8s',
        note: '+7,5% de DMG de Normal e Carregado por stack de Azure Fang\'s Oath (até 4, 8 s): ligue a janela e escolha os stacks. Pendente: o bônus vale também para Azure Devour e Four Winds\' Ascension (habilidade), que o formato não separa do Skill DMG.',
      },
      {
        id: 'c6', label: 'Varka C6', src: 'const6', scope: 'self', timed: true, stats: { critDmg: { p: 1, x: 4 } }, stacks: { max: 4, of: 'a4', unit: "Azure Fang's Oath" },
        expect: "increase Varka's CRIT DMG by 20%",
        note: '+20% de Dano Crítico por stack de Azure Fang\'s Oath (até 4 = 80%): usa os mesmos stacks escolhidos no A4. O golpe extra do Azure Devour adicional não entra.',
      },
      ...ELEMENTOS.map(([id, nome, el]) => ({
        id: `c4-${id}`, label: `Varka C4 (${nome})`, src: 'const4' as const, scope: 'team' as const, timed: true, forElements: [el], stats: { dmgPct: { p: 0 } },
        expect: 'gain a 20% Anemo DMG Bonus and the corresponding Elemental DMG Bonus for 10s',
        note: `+20% de DMG ${nome} por 10 s depois de um Redemoinho do elemento ${nome}: ligue a janela só se o Redemoinho foi desse elemento. O bônus de Anemo está em "Varka C4".`,
      })),
    ],
    Prune: [
      {
        id: 'c2', label: 'Prune C2', src: 'const2', scope: 'self', timed: true,
        stats: { atkPct: { p: 2 } }, stacks: { max: 7, unit: 'estágio (1 = 10%; +5% por acerto, teto 40%)', default: 7, levels: [{ p: 0 }, { lit: 0.15 }, { lit: 0.2 }, { lit: 0.25 }, { lit: 0.3 }, { lit: 0.35 }, { p: 2 }] },
        expect: "Prune's ATK increases by 10%",
        note: 'ATK +10% no Hunter-Seeker e +5% por acerto do sino/martelo convertido, teto 40% (estágios 1 a 7, escolha o que vale no momento; padrão 7 = 40%): ligue a janela do Supremo. Os valores intermediários (15% a 35%) somam 5% do texto.',
      },
      {
        id: 'c6', label: 'Prune C6', src: 'const6', scope: 'team', timed: true, stats: { atkFlat: { p: 1 } },
        expect: 'gain 350 ATK for 5s',
        note: '+350 de ATK por 5 s para ela e para os outros personagens com Tolling Rally depois de uma reação: ligue na janela (antes valia só para os outros).',
      },
      {
        id: 'hex-self', label: 'Prune: Secret Rite (ela)', src: 'p4', scope: 'self', timed: true, team: { hexerei: 2 }, stats: { atkPct: { p: 0 } },
        expect: "Prune's ATK is increased by 60% for 5s",
        note: 'Hexerei (2+ membros Hexerei): +60% de ATK dela por 5 s depois que um Hexerei com Tolling Rally causa uma reação: ligue a janela.',
      },
      {
        id: 'hex-trig', label: 'Prune: Secret Rite (Redemoinho)', src: 'p4', scope: 'team', timed: true, team: { hexerei: 2 }, forFactions: ['hexerei'], stats: { atkPct: { p: 2 } },
        expect: "the triggering character's ATK will additionally be increased by 30% for 5s",
        note: 'Hexerei: +30% de ATK de quem causou o Redemoinho ou Redemoinho Estelar, por 5 s: ligue a janela só no personagem que o causou.',
      },
    ],
    Vesna: [
      {
        id: 'c1', label: 'Vesna C1', src: 'const1', scope: 'self', timed: true, stats: { reactionBonus: { stellarswirl: { p: 1 } } },
        expect: 'Vesna deals 20% increased Stellar Swirl reaction DMG when in the Armed for Action mode',
        note: '+20% de DMG de Redemoinho Estelar dela no modo Armed for Action: ligue a janela do modo.',
      },
    ],
  },
  procs: {
    'Lan Yan': [
      {
        id: 'a1', label: 'Lan Yan A1: anel elemental extra', src: 'p1', scale: {}, hitType: 'skill',
        of: { talent: 'skill', label: 'Feathermoon Ring DMG', fraction: { p: 0 } },
        expect: 'additionally deal Elemental DMG equal to 50% of the original',
        note: '50% do dano do Feathermoon Ring no elemento absorvido (conta como Skill). Escolha o elemento absorvido no campo "Elemento do dano" do golpe (o padrão é Anemo).',
      },
    ],
    'Yumemizuki Mizuki': [
      {
        id: 'p4a', label: 'Mizuki A4: dano periódico reforçado', src: 'p4', scale: { em: { p: 0 } }, hitType: 'skill',
        expect: 'will be increased by 1,000% of her Elemental Mastery',
        note: '1.000% da Maestria somados ao próximo dano periódico Anemo do Dreamdrifter, uma vez por Redemoinho (a cada 2,5 s): coloque um por gatilho. Entra como golpe à parte (mesmo resultado que somar à base).',
      },
      {
        id: 'p4s', label: 'Mizuki A4: Redemoinho Estelar extra', src: 'p4', special: SS, scale: { em: { p: 3 } },
        expect: 'she will also deal an additional instance of Anemo DMG at 1,000% of her Elemental Mastery',
        note: 'Com Radiance: Stellar Swirl, mais uma instância de 1.000% da Maestria como Redemoinho Estelar junto do golpe acima.',
      },
    ],
  },
  notes: {
    'Lan Yan': {
      p1: x('Entra o anel extra de 50% (golpe extra "Lan Yan A1"). O escudo que absorve 250% não entra no dano.'),
      const1: x('Pendente: o texto diz só "mais um Feathermoon Ring" sem dizer se o dano é igual ao primeiro; insira outro Feathermoon Ring na rotação se quiser.'),
    },
    'Yumemizuki Mizuki': {
      p4: x('Entram a Maestria do time, o dano periódico reforçado e o Redemoinho Estelar extra (golpes extras). Pendente: quantas vezes o reforço dispara depende dos Redemoinhos (1 por 2,5 s), por isso você coloca um golpe por gatilho.'),
    },
    Jahoda: {
      p1: x('Pendente: o Supremo reforçado depende de qual elemento domina o time (Pyro 130% do dano; Hydro cura; Electro mais um robô; Cryo menos intervalo), com regra de desempate que o formato não expressa.'),
      const1: x('Pendente: 50% de chance de ricochete, sem valor de dano no texto além do próprio Meowball.'),
    },
    Varka: {
      p1: x('Entram o DMG por ATK e os multiplicadores 1,4x e 2,2x (Normal e Carregado). Pendente: o elemento extra do time e os golpes de habilidade (Azure Devour, Four Winds\' Ascension).'),
      p2: x('Entra o bônus de Normal e Carregado. Pendente: Azure Devour e Four Winds\' Ascension (habilidade).'),
      const1: x('Pendente: o uso extra da habilidade especial e o Lyrical Libation (200% do dano original) dependem de multiplicar o dano de um golpe só.'),
    },
    Prune: {
      p1: x('Entra o martelo (golpe extra "Prune A1"). O elemento é o da conversão: escolha no golpe.'),
    },
    Vesna: {
      p1: x('Pendente: os Spirit Blades causam 100% + 10% por stack do dano original (até 6 stacks); o formato não multiplica o dano de golpes específicos.'),
      const1: x('Entra o +20% de DMG de Redemoinho Estelar. O uso extra do Windborne Sword não muda o dano por golpe.'),
    },
  },
  infos: {
    'Yumemizuki Mizuki': [
      { src: 'const4', kind: 'cura', label: 'Cura do Yumemi Style Special Snack', text: 'Cura um aliado com menos HP em {0%} da Maestria dela', values: [{ p: 1 }], expect: 'heal a nearby party member with lower HP for 266% of Yumemizuki Mizuki' },
      { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia, até 4 vezes por uso do Supremo', values: [{ p: 0 }], expect: 'regenerate 5 Energy for Yumemizuki Mizuki' },
    ],
    Ifa: [
      { src: 'const1', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia quando o Supporting Fire acerta; uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'it will restore 6 Energy for Ifa' },
      { src: 'p4', kind: 'cura', label: 'Cura de emergência', text: 'Restaura {0%} do HP de quem está abaixo de 40% de HP, gastando Phlogiston', values: [{ p: 0 }], expect: 'restore 40% of their HP' },
    ],
    Jahoda: [
      { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia quando um robô faz a conversão elemental', values: [{ p: 0 }], expect: 'Jahoda will recover 4 Elemental Energy' },
    ],
    Prune: [
      { src: 'const1', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia quando o martelo convertido acerta; uma vez a cada 1,8 s', values: [{ p: 0 }], expect: 'Prune will regain 2 Energy' },
    ],
  },
};
