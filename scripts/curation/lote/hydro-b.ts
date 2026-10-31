/**
 * Lote Hydro B: Kamisato Ayato, Nilou, Candace, Neuvillette, Furina, Sigewinne. Conferido contra o Lunaris 7.1.53.
 * Correções: Ayato C1 estava em "skill" mas os Shunsuiken são golpes Normais; Namisen agora tem stacks escolhidos (0 a 4, ou 0 a 5
 * na C2, que SUBSTITUI o buff de 4) e só soma nos Shunsuiken; Nilou C2 e Sigewinne C2 (RES Hydro por 10 s e 8 s) eram "sempre
 * ligados" e viram janelas, e Nilou ganha a RES Dendro do C2; Neuvillette A1 multiplica o dano ORIGINAL (baseMult, não soma
 * de DMG%), A4 passa a ter a escolha do HP (era sempre 30%) e só vale para Hydro, C2 acompanha os stacks do A1; Furina C2
 * usa os pontos de Fanfare acima do limite (era o máximo fixo) e a C1 (limite 400) substitui o buff de Fanfare.
 * Candace e o resto dos números antigos batem com o texto.
 */
import type { BuffCuration, NoteCuration } from '../characters';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });

const SHUN = ['Shunsuiken 1-Hit DMG', 'Shunsuiken 2-Hit DMG', 'Shunsuiken 3-Hit DMG'];

const buffs: Record<string, BuffCuration[]> = {
  'Kamisato Ayato': [
    {
      id: 'c1', label: 'Ayato C1', src: 'const1', scope: 'self', timed: true, stats: { byType: { normal: { p: 1 } } },
      expect: 'Shunsuiken DMG is increased by 40%',
      note: '+40% de DMG dos Shunsuiken contra inimigos com 50% de HP ou menos: ligue a janela. Antes estava em "habilidade", mas os Shunsuiken são golpes Normais. O formato não tem bônus por golpe: vale para todo Normal na janela (desligue nos Normais fora do estado da habilidade).',
    },
    {
      id: 'namisen', label: 'Ayato: Namisen', src: 'kit', kit: { talent: 'skill', key: 'Namisen DMG Bonus' }, scope: 'self', timed: false,
      stacks: { max: 4, unit: 'stacks de Namisen' },
      flat: [{ name: 'Namisen por HP', sourceStat: 'HP', perPoint: { lit: 4 }, hitTypes: ['normal'], labels: SHUN }],
      expect: 'The initial maximum number of Namisen stacks is 4',
      note: 'Soma (% do HP máximo por stack do nível da habilidade) x stacks ao dano base de cada Shunsuiken. Stacks de 0 a 4, escolha do usuário (cheios depois que a ilusão explode; o A1 dá 2 ao usar a habilidade). Só os Shunsuiken recebem; o golpe extra do C6 não.',
    },
    {
      id: 'namisen-c2', label: 'Ayato C2: Namisen com 5 stacks', src: 'kit', minConstellation: 2, replaces: 'namisen', kit: { talent: 'skill', key: 'Namisen DMG Bonus' }, scope: 'self', timed: false,
      stacks: { max: 5, unit: 'stacks de Namisen' },
      flat: [{ name: 'Namisen por HP (C2)', sourceStat: 'HP', perPoint: { lit: 5 }, hitTypes: ['normal'], labels: SHUN }],
      expect: 'The initial maximum number of Namisen stacks is 4',
      note: 'Com a C2 o limite sobe para 5 stacks: este buff SUBSTITUI o Namisen de 4. Stacks de 0 a 5, escolha do usuário.',
    },
  ],
  Nilou: [
    {
      id: 'c2', label: 'Nilou C2', src: 'const2', scope: 'self', timed: true, resShred: { value: { p: 0 }, elements: ['Hydro'] },
      expect: "that opponent's Hydro RES will be decreased by 35% for 10s",
      note: "RES Hydro do inimigo -35% por 10 s depois que quem tem o Golden Chalice's Bounty (A1: time só Dendro/Hydro) causa dano Hydro: ligue a janela (antes estava sempre ligado).",
    },
    {
      id: 'c2d', label: 'Nilou C2 (RES Dendro)', src: 'const2', scope: 'self', timed: true, resShred: { value: { p: 1 }, elements: ['Dendro'] },
      expect: 'their Dendro RES will be decreased by 35% for 10s',
      note: 'RES Dendro do inimigo -35% por 10 s depois de dano de Florescer ou Lunar-Florescer (precisa do A1): ligue a janela.',
    },
  ],
  Neuvillette: [
    {
      id: 'a1', label: 'Neuvillette A1', src: 'p1', scope: 'self', timed: true, stats: { baseMultByType: { charged: { p: 2 } } },
      stacks: { max: 3, unit: 'stacks de Past Draconic Glories', levels: [{ p: 0 }, { p: 1 }, { p: 2 }] },
      expect: 'to deal 110%/125%/160% of its original DMG',
      note: 'O Equitable Judgment causa 110%/125%/160% do dano ORIGINAL (multiplica o dano base, não soma no DMG%), por stack escolhido de 0 a 3 (30 s). O formato não separa por golpe: vale para todo Carregado na janela, então desligue nos Carregados que não são o Equitable Judgment.',
    },
    {
      id: 'a4', label: 'Neuvillette A4', src: 'p2', scope: 'self', timed: false, forElements: ['Hydro'], stats: { dmgPct: { p: 0 } },
      stacks: { max: 50, unit: '% de HP atual acima de 30% do máximo', default: 50 },
      expect: 'he will gain 0.6% Hydro DMG Bonus',
      note: '+0,6% de DMG Hydro por 1% do HP atual acima de 30% do HP máximo, teto de +30% (50 pontos, ou seja, HP a 80% ou mais). Escolha de 0 a 50; o padrão é o teto.',
    },
    {
      id: 'c2', label: 'Neuvillette C2', src: 'const2', scope: 'self', timed: true, stats: { critDmgByType: { charged: { p: 0, x: 3 } } },
      stacks: { max: 3, of: 'a1', unit: 'stacks de Past Draconic Glories' },
      expect: 'Each stack of Past Draconic Glories will increase the CRIT DMG of Charged Attack: Equitable Judgment by 14%',
      note: '+14% de Dano Crítico do Equitable Judgment por stack (até 42%); usa os stacks escolhidos no A1. O formato dá o bônus a todo Carregado na janela: desligue nos que não são o Equitable Judgment.',
    },
  ],
  Furina: [
    {
      id: 'a4', label: 'Furina A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'hp', perPoint: { p: 0, x: 0.001 }, cap: { p: 1 }, to: ['skill'] },
      expect: "Will increase Salon Members' DMG dealt by 0.7%",
      note: '+0,7% de DMG dos Salon Members por 1.000 de HP máximo, teto de 28%. Vale para todo dano de habilidade (inclui o Ousia Bubble, que não é Salon Member): desligue o buff nesse golpe. A redução do intervalo da Singer é só cura.',
    },
    {
      id: 'c2', label: 'Furina C2', src: 'const2', scope: 'self', timed: true, stats: { hpPct: { p: 1, x: 400 } },
      stacks: { max: 400, unit: 'pontos de Fanfare acima do limite' },
      expect: "Each point of Fanfare above the limit will increase Furina's Max HP by 0.35%",
      note: '+0,35% de HP máximo por ponto de Fanfare acima do limite (300; 400 na C1), até +140% (400 pontos acima). Escolha de 0 a 400 durante o Supremo. O +250% de ganho de Fanfare só muda quanto a Fanfare acumula.',
    },
    {
      id: 'burst-c1', label: 'Furina C1: Fanfare até 400', src: 'kit', minConstellation: 1, replaces: 'burst', kit: { talent: 'burst', key: 'Fanfare to DMG Increase Conversion Ratio' },
      scope: 'team', timed: true, stats: { dmgPct: { lit: 400 } }, stacks: { max: 400, unit: 'pontos de Fanfare' },
      expect: 'Furina will increase the DMG dealt by and Incoming Healing Bonus of all nearby party members based on the amount of Fanfare',
      note: 'Com a C1 o limite de Fanfare é 400 (+100) e ela começa o Supremo com 150: este buff SUBSTITUI o de 300. DMG da equipe = pontos de Fanfare x a razão do nível do Supremo. Fanfare de 0 a 400 por escolha do usuário; ligue nas janelas.',
    },
  ],
  Sigewinne: [
    {
      id: 'c2', label: 'Sigewinne C2', src: 'const2', scope: 'self', timed: true, resShred: { value: { p: 1 }, elements: ['Hydro'] },
      expect: "that opponent's Hydro RES will be decreased by 35% for 8s",
      note: 'RES Hydro do inimigo -35% por 8 s depois que o Bolstering Bubblebalm ou o Super Saturated Syringing acerta: ligue a janela (antes estava sempre ligado). O escudo é informativo.',
    },
  ],
};

const infos: Record<string, InfoCuration[]> = {
  Nilou: [{ src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia depois do 3º passo da dança', values: [{ p: 0 }], expect: 'Nilou will gain 15 Elemental Energy' }],
  Furina: [
    { src: 'p1', kind: 'cura', label: 'Cura do Endless Waltz', text: 'Cura {0%} do HP máximo dos aliados próximos a cada 2 s por {1} s, quando a cura no personagem em campo transborda', values: [{ p: 2 }, { p: 0 }], expect: '2% of their Max HP' },
    { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia a cada acerto dos Salon Members ou cura da Singer; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'Furina will restore 4 Energy' },
  ],
  Sigewinne: [{ src: 'const2', kind: 'escudo', label: 'Bubbly Shield', text: 'Escudo de {0%} do HP máximo dela, absorve Hydro com 250% de eficiência', values: [{ p: 0 }], expect: 'Bubbly Shield worth 30% of her Max HP' }],
};

export const LOTE: Lote = {
  buffs,
  infos,
  notes: {
    'Kamisato Ayato': {
      p1: u('Dá 2 stacks de Namisen ao usar a habilidade e o máximo quando a ilusão explode: escolha os stacks no buff Ayato: Namisen.'),
      const2: x('Entram o limite de 5 stacks (Namisen da C2) e o +50% de HP com 3 stacks ou mais (janela).'),
    },
    Nilou: {
      const2: x('Entram as RES Hydro e Dendro -35% (janelas). Precisa do A1 (time só Dendro e Hydro).'),
    },
    Neuvillette: {
      const1: u('Dá 1 stack de Past Draconic Glories ao entrar em campo: escolha os stacks no buff Neuvillette A1. O resto é só resistência a interrupção.'),
      p2: x('Entra o DMG Hydro por HP atual (escolha de 0 a 50 pontos acima de 30% do HP).'),
    },
    Furina: {
      const1: x('Entra o limite de Fanfare 400 (buff que substitui o de 300). Os 150 de Fanfare iniciais são escolha do usuário nos stacks.'),
      const2: x('Entra o aumento de HP por Fanfare acima do limite (0 a 400 pontos). O ganho de Fanfare +250% só muda quanto ela acumula.'),
    },
    Sigewinne: {
      const2: x('Entra a RES Hydro -35% por 8 s (janela). O escudo é informativo.'),
      p1: x('Entra o +8% de DMG Hydro (janela). Pendente: o dano fixo de Convalescence (80 por 1.000 de HP acima de 30.000, teto de 2.800, nas habilidades dos aliados fora de campo) precisa de um limiar de 30.000 que o dano fixo do formato não tem.'),
    },
  },
};
