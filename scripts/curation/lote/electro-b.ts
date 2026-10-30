/**
 * Lote Electro B: Kujou Sara, Yae Miko, Kuki Shinobu, Dori, Cyno e Sethos. Conferido contra o Lunaris 7.1.53.
 * Correções: Sethos A4/C1 estavam em "Carregado", mas o Shadowpiercing Shot é golpe Normal no cadastro (A4 agora só nele,
 * pelo rótulo; C1 virou janela); Yae C2 passa a escolher o nível da Sesshou Sakura (60/90/120/200) e ganha o C4 do Supremo
 * (+100%); Cyno ganha os Duststalker Bolts (A4: ATK + Maestria) e a Maestria do Supremo.
 */
import type { NoteCuration, ProcCuration } from '../characters';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });

const cynoProcs: ProcCuration[] = [
  {
    id: 'a1', label: 'Cyno A4: Duststalker Bolt', src: 'p2', hitType: 'skill', scale: { atk: { lit: 1 }, em: { p: 1 } },
    expect: 'increased by 250% of his Elemental Mastery',
    note: 'Cada Bolt do Judication (3 por Judication; mais 1 por Normal com os stacks do C6) vale 100% do ATK (literal do A1) + 250% da Maestria (A4). Conta como habilidade, como diz o A1. Adicione as execuções.',
  },
  {
    id: 'a1s', label: 'Cyno A4: Duststalker Bolt - Starsame', src: 'p2', special: { reaction: 'stellarconduct' }, scale: { atk: { lit: 2 }, em: { p: 2 } },
    expect: '600% of Elemental Mastery',
    note: 'Com Radiance: Stellar-Conduct, cada Bolt vira Starsame: 200% do ATK (literal do A1) + 600% da Maestria, como dano Estelar-Conduct. Use no lugar do Bolt comum (3 por Judication).',
  },
];

export const LOTE: Lote = {
  buffs: {
    'Kujou Sara': [
      {
        id: 'c6', label: 'Sara C6', src: 'const6', scope: 'team', timed: true, forElements: ['Electro'], stats: { critDmg: { p: 0 } },
        expect: 'CRIT DMG increased by 60%',
        note: '+60% de Dano Crítico de quem está com o bônus de ATK do Tengu Juurai (veja "Sara: Tengu Juurai"): ligue na mesma janela. Só personagens Electro recebem; o bônus vale para todos os golpes deles na janela (o texto é do dano Electro).',
      },
    ],
    'Yae Miko': [
      {
        id: 'c2', label: 'Yae C2', src: 'const2', scope: 'team', timed: true,
        stats: { em: { p: 6 } }, stacks: { max: 4, unit: 'nível da Sesshou Sakura', default: 4, levels: [{ p: 3 }, { p: 4 }, { p: 5 }, { p: 6 }] },
        expect: 'Elemental Mastery will also be increased by 60/90/120/200 points',
        note: '+60/90/120/200 de Maestria dela e de quem está no campo, conforme o nível da Sesshou Sakura (escolha de 1 a 4; padrão 4): ligue na janela em que há Sesshou Sakura. O nível inicial 2 e o alcance maior não mudam o dano.',
      },
      {
        id: 'c4b', label: 'Yae C4 (Supremo)', src: 'const4', scope: 'self', timed: false, stats: { byType: { burst: { p: 4 } } },
        expect: "Elemental Burst DMG is increased by 100%",
        note: '+100% de DMG do Supremo dela, sempre (a constelação não pede condição). O +20% de DMG Electro da equipe está em "Yae C4".',
      },
    ],
    'Kuki Shinobu': [
      {
        id: 'a4', label: 'Shinobu A4', src: 'p2', scope: 'self', timed: false,
        flat: [{ name: 'Sanctifying Ring por Maestria', sourceStat: 'EM', perPoint: { p: 1 }, hitTypes: ['skill'], labels: ['Skill DMG', 'Grass Ring of Sanctification DMG'] }],
        expect: 'DMG dealt is increased by 25% of Elemental Mastery',
        note: 'Soma 25% da Maestria ao dano base do Skill DMG e do Grass Ring of Sanctification DMG (os dois golpes do Sanctifying Ring). O Supremo e a cura (+75% da Maestria, informativo) não entram.',
      },
    ],
    Cyno: [
      {
        id: 'a1', label: 'Cyno A1', src: 'p1', scope: 'self', timed: true, stats: { byType: { skill: { p: 0 } } },
        expect: 'increasing the DMG of this Secret Rite: Chasmic Soulfarer by 35%',
        note: '+35% de DMG da habilidade (Mortuary Rite) com o Judication ativo: ligue só nessa janela. O bônus é por tipo, então também vale para os Duststalker Bolts (golpe de habilidade) dentro da janela; o texto diz só "this Secret Rite".',
      },
      {
        id: 'burst', label: 'Cyno: Pactsworn Pathclearer (Maestria)', src: 'kit', kit: { talent: 'burst' }, scope: 'self', timed: true, stats: { em: { lit: 100 } },
        expect: 'Elemental Mastery and resistance to interruption will increase',
        note: '+100 de Maestria dele durante o Pactsworn Pathclearer (linha "Elemental Mastery Bonus" do Supremo: 100 nos 15 níveis): ligue na janela do Supremo.',
      },
    ],
    Sethos: [
      {
        id: 'a4', label: 'Sethos A4', src: 'p2', scope: 'self', timed: false,
        flat: [{ name: 'Shadowpiercing Shot por Maestria', sourceStat: 'EM', perPoint: { p: 1 }, hitTypes: ['normal'], labels: ['Shadowpiercing Shot DMG'], stacks: 4 }],
        expect: "increasing the DMG dealt by Shadowpiercing Shots by 700% of Sethos's Elemental Mastery",
        note: 'Soma 700% da Maestria ao dano base dos 4 primeiros Shadowpiercing Shots (no cadastro é golpe Normal, não Carregado). Antes caía no Aimed Shot por engano. A regra de 5 s e a volta do efeito em 15 s ficam por sua conta (use os stacks).',
      },
      {
        id: 'c1', label: 'Sethos C1', src: 'const1', scope: 'self', timed: true, stats: { critRateByType: { normal: { p: 0 } } },
        expect: 'The CRIT Rate of Shadowpiercing Shot is increased by 15%',
        note: '+15% de Taxa Crítica nos Shadowpiercing Shots. Como o golpe é Normal no cadastro e o bônus é por tipo, ligue a janela SÓ nos Shadowpiercing Shots (nos Normais comuns ele também valeria).',
      },
    ],
  },

  procs: { Cyno: cynoProcs },

  notes: {
    'Kujou Sara': {
      p1: u('Só tempo de mira.'),
      p2: u('Só energia (informativo).'),
      p3: u('Só expedição.'),
      const1: u('Só recarga da habilidade (informativo).'),
      const2: null,
      const4: x('Pendente: as 2 Stormclusters extras (de 4 para 6) não têm golpe novo; ajuste as execuções do Tengu Juurai: Stormcluster no Supremo.'),
      const6: x('Entra +60% de Dano Crítico Electro de quem tem o bônus de ATK (janela). Simplificação: vale para todos os golpes do personagem Electro na janela.'),
    },
    'Yae Miko': {
      p1: null,
      p3: u('Só chance de material ao fabricar.'),
      p4: x('Pendente: o texto diz "DMG dealt is increased at 80% of Yae Miko\'s ATK" sem dizer se soma ao raio ou é um golpe novo, e depende de Supercondutor/Estelar-Condução (1 vez a cada 2,5 s). A duração +10 s e o golpe de 200% do ATK do Radiance também não entram.'),
      const1: x('Entra +50% de DMG Electro da equipe por 10 s (janela). O bônus de dano Estelar-Condução e a energia (informativa) não entram.'),
      const2: x('Entra a Maestria por nível da Sesshou Sakura (janela). Nível inicial e alcance não mudam o dano.'),
      const4: x('Entram +20% de DMG Electro da equipe por 5 s (janela) e +100% do Supremo (sempre). A energia é só informativa.'),
      const6: x('Entra ignorar 60% da DEF (janela, vale para todos os golpes dela na janela). O +200% de Dano Crítico do dano Estelar-Condução não entra: o formato não tem bônus de crítico por reação.'),
    },
    'Kuki Shinobu': {
      p1: u('Só Bônus de Cura (informativo).'),
      p2: x('Entra +25% da Maestria no dano do Sanctifying Ring. A cura (+75% da Maestria) é informativa.'),
      p3: u('Só expedição.'),
      const1: u('Só área.'),
      const2: u('Só duração.'),
      const6: x('Entram +150 de Maestria por 15 s com HP abaixo de 25% (janela). A proteção contra dano letal não entra.'),
    },
    Dori: {
      p1: u('Só recarga da habilidade (informativo).'),
      p2: u('Só energia (informativo).'),
      p3: u('Só chance de recuperar materiais.'),
      const1: u('Só número de rodadas.'),
      const4: u('Só cura recebida e Recarga de Energia (informativo).'),
      const6: x('A infusão Electro por 3 s não muda o cálculo no modo "personagem" (todo golpe já é do elemento dele); no modo "kit" o Normal fica Físico e você escolhe o elemento do golpe. A cura é informativa.'),
    },
    Cyno: {
      p1: x('Entram +35% de DMG da habilidade (janela) e os 3 Duststalker Bolts como golpe extra. O Starsame do Radiance é outro golpe extra (veja A4).'),
      p2: x('Entram os +250% (Bolt) e +600% (Starsame) da Maestria no golpe extra. Pendente: os +150% da Maestria nos Normais do Pactsworn Pathclearer não entram: o dano fixo de personagem vale o tempo todo (sem janela) e somaria também nos Normais fora do Supremo.'),
      p3: u('Só expedição.'),
      p4: u('Só entrada no estado Pactsworn Pathclearer por 6 s (use os golpes do Supremo para os Normais dele).'),
      const1: x('Pendente: a Maestria +200 (Together We Rise, Radiance) vale só para ele e para quem entra em campo, e depende da Polestar Field; não cabe numa janela do time. A velocidade de ataque é só utilidade.'),
      const2: x('Entram +10% de DMG Electro por stack (até 5, 4 s, janela). O +16% de Estelar-Condução por stack (Together We Rise) não entra.'),
      const4: u('Só energia (informativo).'),
      const6: x('Os Duststalker Bolts extras (4 por Supremo/Judication, 1 por Normal) usam o golpe extra do A4: adicione as execuções.'),
    },
    Sethos: {
      p1: u('Só tempo de carga.'),
      p2: x('Entram os 700% da Maestria nos 4 primeiros Shadowpiercing Shots. Pendente: os Dusk Bolts do Supremo (aumento por Maestria) não existem no cadastro de golpes e não entram.'),
      const1: x('Entra +15% de Taxa Crítica como janela (ligue só nos Shadowpiercing Shots, que são golpe Normal no cadastro).'),
      const2: x('Entram +15% de DMG Electro por stack (até 2, 10 s, janela).'),
      const4: x('Entram +80 de Maestria da equipe por 10 s (janela), quando o golpe acerta 2 ou mais inimigos.'),
      const6: u('Só energia devolvida.'),
    },
  },

  infos: {
    'Kujou Sara': [
      { src: 'p2', kind: 'energia', label: 'Energia dos aliados', text: '{0} de Energia a todos os aliados por 100% de Recarga quando o Tengu Juurai: Ambush acerta; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'restore 1.2 Energy to all party members' },
      { src: 'const1', kind: 'recarga', label: 'Recarga do Tengu Stormcall', text: 'cai {0} s quando o Tengu Juurai dá o bônus ou acerta; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'is decreased by 1s' },
    ] satisfies InfoCuration[],
    'Yae Miko': [
      { src: 'const1', kind: 'energia', label: 'Energia dela', text: '{0} de Energia a cada Tenko Thunderbolt', values: [{ p: 0 }], expect: 'restores 8 Elemental Energy to herself' },
      { src: 'const4', kind: 'energia', label: 'Energia do raio da Sakura', text: '{2} de Energia quando o raio da Sesshou Sakura acerta; no máximo uma vez a cada {3} s', values: [{ p: 0 }, { p: 1 }, { p: 2 }, { p: 3 }], expect: 'regenerates 8 Elemental Energy' },
    ] satisfies InfoCuration[],
    'Kuki Shinobu': [
      { src: 'p1', kind: 'cura', label: 'Bônus de Cura com HP baixo', text: '+{1%} de Bônus de Cura com HP até {0%}', values: [{ p: 0 }, { p: 1 }], expect: 'her Healing Bonus is increased by 15%' },
      { src: 'p2', kind: 'cura', label: 'Cura extra do Sanctifying Ring', text: '+{0%} da Maestria na cura do Grass Ring of Sanctification', values: [{ p: 0 }], expect: 'Healing amount will be increased by 75% of Elemental Mastery' },
    ] satisfies InfoCuration[],
    Dori: [
      { src: 'p1', kind: 'recarga', label: 'Recarga do Troubleshooter Cannon', text: 'cai {0} s depois de uma reação Electro de quem está ligado ao Jinni; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'is decreased by 1s' },
      { src: 'p2', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia por 100% de Recarga quando os tiros acertam; no máximo {1} por habilidade', values: [{ p: 0 }, { p: 1 }], expect: 'restore 5 Elemental Energy for every 100% Energy Recharge' },
      { src: 'const4', kind: 'cura', label: 'Cura recebida de quem tem o Jinni', text: 'com HP abaixo de {0%}, +{0%} de cura recebida', values: [{ p: 0 }], expect: 'they gain 50% Incoming Healing Bonus' },
      { src: 'const4', kind: 'energia', label: 'Recarga de quem tem o Jinni', text: 'com Energia abaixo de {0%}, +{1%} de Recarga de Energia', values: [{ p: 0 }, { p: 1 }], expect: 'they gain 30% Energy Recharge' },
      { src: 'const6', kind: 'cura', label: 'Cura dos Normais', text: '{1%} do HP máximo dela à equipe a cada acerto de Normal por {0} s; no máximo uma vez a cada 0,1 s', values: [{ p: 0 }, { p: 1 }], expect: 'heal HP equivalent to 4% of Dori' },
    ] satisfies InfoCuration[],
    Cyno: [
      { src: 'const4', kind: 'energia', label: 'Energia dos aliados', text: '{0} de Energia a todos os aliados por reação, até {1} vezes por Supremo', values: [{ p: 0 }, { p: 1 }], expect: 'he will restore 3 Elemental Energy to all nearby party members' },
      { src: 'const4', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia quando outro com Together We Rise reage; no máximo uma vez a cada {1} s', values: [{ p: 2 }, { p: 3 }], expect: 'they will also regenerate 20 Elemental Energy for Cyno' },
    ] satisfies InfoCuration[],
  },
};

