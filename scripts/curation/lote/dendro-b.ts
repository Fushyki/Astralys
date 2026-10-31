/**
 * Lote Dendro B: Baizhu, Emilie, Kinich, Lauma, Nefer, Aether (Dendro) e Lumine (Dendro). Conferido contra o Lunaris 7.1.53.
 * Correções: Baizhu A1 (depende do HP do personagem em campo) e C6 (só os Spiritveins); Emilie A4 (só contra Queimadura) e
 * C2 (10 s) viram janelas; Emilie C1 ganha o Cleardew Cologne +20%; Kinich C2 (6 s) vira janela e ganha o +100% do 1º canhão,
 * A4 passa a valer só no Scalespiker Cannon, C6 perde o tipo "habilidade" (o texto não o diz); Lauma ganha o Pale Hymn do
 * Supremo e a queda de RES da habilidade; Nefer A1 exige Moonsign Ascendant e C4 (Shadow Dance) vira janela; os Viajantes
 * Dendro ganham o Carregado: Verdessence, os Vinecores e o C6 do elemento transfigurado.
 */
import type { BuffCuration, NoteCuration, ProcCuration, Src } from '../characters';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });

/** Aether e Lumine têm os mesmos textos Dendro (ids Lunaris 10000005_DENDRO e 10000007_DENDRO). */
const travelerBuffs: BuffCuration[] = [
  {
    id: 'a1', label: 'Viajante A1', src: 'p1', scope: 'team', timed: true, stats: { em: { p: 0, x: 10 } },
    expect: 'increasing the Elemental Mastery of active character(s) within its AoE by 6',
    note: '+6 de Maestria por nível de Luz de Lótus (1 nível por segundo, até 10 = +60) para o personagem ativo dentro da área da Lâmpada: ligue nas janelas e escolha os níveis de 0 a 10.',
  },
  {
    id: 'a4s', label: 'Viajante A4 (habilidade)', src: 'p2', scope: 'self', timed: false, convert: { from: 'em', perPoint: { p: 0 }, to: ['skill'] },
    expect: 'increases the DMG dealt by Razorgrass Blade by 0.15%',
    note: '+0,15% de DMG da habilidade (Razorgrass Blade) por ponto de Maestria, sem teto no texto.',
  },
  {
    id: 'a4b', label: 'Viajante A4 (Supremo)', src: 'p2', scope: 'self', timed: false, convert: { from: 'em', perPoint: { p: 1 }, to: ['burst'] },
    expect: 'the DMG dealt by Surgent Manifestation by 0.1%',
    note: '+0,1% de DMG do Supremo (Surgent Manifestation: ataque da Lâmpada e explosão Pyro) por ponto de Maestria, sem teto no texto.',
  },
  {
    id: 'a4verdessence', label: 'Viajante A4 (Carregado: Verdessence)', src: 'p3', scope: 'self', timed: false,
    flat: [{ name: 'Charged Attack: Verdessence por ATK', sourceStat: 'ATK', perPoint: { p: 7 }, hitTypes: ['charged'], labels: ['Charged Attack DMG'], stacks: 2 }],
    expect: "The increase in DMG is equal to 80% of Traveler's ATK",
    note: 'Soma 80% do ATK ao dano base de CADA um dos 2 acertos do Carregado, uma vez a cada 15 s (precisa de 3 stacks de Blade of Verdant Viridis). Entra nos 2 primeiros acertos de Carregado da rotação (1 Verdessence); para mais, aumente os stacks do efeito. Os Vinecores estão no golpe extra "Viajante A4: Vinecore".',
  },
  {
    id: 'c6', label: 'Viajante C6', src: 'const6', scope: 'team', timed: true, forElements: ['Dendro'], stats: { dmgPct: { p: 0 } },
    expect: 'Dendro DMG Bonus of the character under the effect of Overflowing Lotuslight',
    note: '+12% de DMG Dendro do personagem sob a Luz de Lótus da Lâmpada: ligue nas janelas. Só personagens Dendro recebem.',
  },
  {
    id: 'c6h', label: 'Viajante C6 (Lâmpada Hydro)', src: 'const6', scope: 'team', timed: true, forElements: ['Hydro'], stats: { dmgPct: { p: 0 } },
    expect: 'the character will also gain 12% DMG Bonus for the corresponding element',
    note: '+12% de DMG Hydro (além do Dendro) do personagem sob a Luz de Lótus, se a Lâmpada já passou por Lotuslight Transfiguration com Hydro: ligue só se foi Hydro. Só personagens Hydro recebem.',
  },
  {
    id: 'c6e', label: 'Viajante C6 (Lâmpada Electro)', src: 'const6', scope: 'team', timed: true, forElements: ['Electro'], stats: { dmgPct: { p: 0 } },
    expect: 'the character will also gain 12% DMG Bonus for the corresponding element',
    note: '+12% de DMG Electro (além do Dendro) do personagem sob a Luz de Lótus, se a Lâmpada já passou por Lotuslight Transfiguration com Electro: ligue só se foi Electro. Só personagens Electro recebem.',
  },
  {
    id: 'c6p', label: 'Viajante C6 (Lâmpada Pyro)', src: 'const6', scope: 'team', timed: true, forElements: ['Pyro'], stats: { dmgPct: { p: 0 } },
    expect: 'the character will also gain 12% DMG Bonus for the corresponding element',
    note: '+12% de DMG Pyro (além do Dendro) do personagem sob a Luz de Lótus, se a Lâmpada já passou por Lotuslight Transfiguration com Pyro: ligue só se foi Pyro. Só personagens Pyro recebem.',
  },
];

const travelerProcs: ProcCuration[] = [
  {
    id: 'a4vine', label: 'Viajante A4: Vinecore', src: 'p3', scale: { atk: { p: 10 } }, hitType: 'charged',
    expect: "inflicting Dendro DMG equal to 120% of Traveler's ATK",
    note: '120% do ATK por Vinecore, dano Dendro que conta como Carregado. Cada Charged Attack: Verdessence cria 2 Vinecores (explodem em 4 e 8 s): adicione 2 execuções por Verdessence.',
  },
];

const travelerNotes: Partial<Record<Src, NoteCuration>> = {
  p3: x('Entram o Carregado: Verdessence (+80% do ATK por acerto, 1 vez a cada 15 s) e os Vinecores (golpe extra). Pendente: os buffs "para cada elemento ressonado" não entram: o texto só os cita por link, sem números nem quais ressonâncias contam.'),
  const1: u('Só energia.'),
  const2: u('Só duração.'),
  const4: u('Só stacks de Overflowing Lotuslight.'),
  const6: x('Entram +12% de DMG Dendro e, se a Lâmpada foi transfigurada, +12% do elemento correspondente (janelas separadas por elemento).'),
};

const travelerInfos: InfoCuration[] = [
  { src: 'const1', kind: 'energia', label: 'Energia da Razorgrass Blade', text: '{0} de Energia quando a Razorgrass Blade acerta um inimigo', values: [{ p: 0 }], expect: 'regenerate 3.5 Energy for the Traveler' },
];

const buffs: Record<string, BuffCuration[]> = {
  Baizhu: [
    {
      id: 'a1', label: 'Baizhu A1', src: 'p1', scope: 'self', timed: true, stats: { dmgPct: { p: 2 } },
      expect: 'Baizhu gains 25% Dendro DMG Bonus',
      note: '+25% de DMG Dendro com o personagem em campo com 50% de HP ou mais: ligue a janela (antes estava sempre ligado). Abaixo de 50% o efeito é +20% de Bônus de Cura (informativo).',
    },
    {
      id: 'c6', label: 'Baizhu C6', src: 'const6', scope: 'self', timed: false,
      flat: [{ name: 'Spiritveins por HP', sourceStat: 'HP', perPoint: { p: 1 }, hitTypes: ['burst'], labels: ['Spiritvein DMG'] }],
      expect: "Spiritveins by 8% of Baizhu's Max HP",
      note: "Soma 8% do HP máximo ao dano base de cada Spiritvein (o dano do Supremo dele). Os escudos extras não mudam o dano.",
    },
  ],
  Emilie: [
    {
      id: 'a4', label: 'Emilie A4', src: 'p2', scope: 'self', timed: true,
      convert: { from: 'atk', perPoint: { p: 0, x: 0.001 }, cap: { p: 1 }, to: ['dmgPct'] },
      expect: 'with every 1,000 ATK increasing DMG dealt by 15%',
      note: '+15% de DMG por 1.000 de ATK, até 36%, só contra inimigo em Queimadura: ligue a janela (antes estava sempre ligado).',
    },
    {
      id: 'c2', label: 'Emilie C2', src: 'const2', scope: 'self', timed: true, resShred: { value: { p: 0 }, elements: ['Dendro'] },
      expect: 'Dendro RES is decreased by 30%',
      note: 'RES Dendro do inimigo -30% por 10 s depois que a habilidade, o Supremo ou o Cleardew Cologne acertam: janela de tempo (antes estava sempre ligado).',
    },
  ],
  Kinich: [
    {
      id: 'a4', label: 'Kinich A4', src: 'p2', scope: 'self', timed: false,
      flat: [{ name: 'Scalespiker Cannon por ATK', sourceStat: 'ATK', perPoint: { p: 1, x: 2 }, hitTypes: ['skill'], labels: ['Scalespiker Cannon DMG'], stacks: 1 }],
      stacks: { max: 2, unit: "stacks de Hunter's Experience" },
      expect: 'each stack consumed increasing the DMG dealt by this Cannon shot by 320%',
      note: 'Soma 320% do ATK por stack de Hunter\'s Experience consumido (até 2 = 640%) ao dano base do primeiro Scalespiker Cannon da rotação (o Loop Shot não recebe). Escolha os stacks de 0 a 2.',
    },
    {
      id: 'c2', label: 'Kinich C2', src: 'const2', scope: 'self', timed: true, resShred: { value: { p: 0 }, elements: ['Dendro'] },
      expect: 'decrease their Dendro RES by 30%',
      note: 'RES Dendro do inimigo -30% por 6 s depois que a habilidade acerta: janela de tempo (antes estava sempre ligado). O +100% do primeiro canhão está no golpe extra "Kinich C2: 1º canhão".',
    },
  ],
  Lauma: [
    {
      id: 'pale', label: 'Lauma: Pale Hymn (Florescer, Hiperflorescer, Brotar)', src: 'kit', kit: { talent: 'burst', key: 'Bloom, Hyperbloom, and Burgeon DMG Increase' },
      scope: 'team', timed: true, convert: { from: 'em', perPoint: { lit: 1 }, to: ['bloomFlat', 'hyperbloomFlat', 'burgeonFlat'] },
      expect: "the DMG dealt will be increased based on Lauma's Elemental Mastery",
      note: 'Pale Hymn: o dano de Florescer, Hiperflorescer e Brotar da equipe sobe uma % (pelo nível do Supremo) da Maestria dela, por 15 s. Ligue nas janelas do Supremo; o motor não conta os stacks (18 do Supremo, 1 gasto por golpe). O reforço do C2 está em "Lauma C2" (soma a este).',
    },
    {
      id: 'palelb', label: 'Lauma: Pale Hymn (Lunar-Florescer)', src: 'kit', kit: { talent: 'burst', key: 'Lunar-Bloom DMG Increase' },
      scope: 'team', timed: true, convert: { from: 'em', perPoint: { lit: 1 }, to: ['lunarbloomFlat'] },
      expect: "the DMG dealt will be increased based on Lauma's Elemental Mastery",
      note: 'Pale Hymn: o dano de Lunar-Florescer da equipe sobe uma % (pelo nível do Supremo) da Maestria dela, por 15 s. Ligue nas janelas do Supremo; o motor não conta os stacks.',
    },
    {
      id: 'skill-res', label: 'Lauma: Runo (RES Dendro e Hydro)', src: 'kit', kit: { talent: 'skill', key: 'Elemental RES Decrease' }, scope: 'self', timed: true,
      resShred: { value: { lit: 1 }, elements: ['Dendro', 'Hydro'] },
      expect: "that opponent's Dendro RES and Hydro RES will be decreased for 10s",
      note: 'RES Dendro e Hydro do inimigo -25% a -40% (pelo nível da habilidade) por 10 s depois que a habilidade ou o Frostgrove Sanctuary acertam: janela de tempo.',
    },
  ],
  Nefer: [
    {
      id: 'a1', label: 'Nefer A1', src: 'p1', scope: 'self', timed: true, team: { moonsign: 2 }, stats: { em: { p: 2 } },
      stacks: { max: 5, unit: 'stacks de Véu da Falsidade', levels: [{ lit: 0 }, { lit: 0 }, { p: 2 }, { p: 2 }, { p: 2 }] },
      expect: "Nefer's Elemental Mastery will be increased by 100 for 8s",
      note: '+100 de Maestria por 8 s com 3 stacks de Véu da Falsidade, só com Moonsign: Ascendant Gleam: ligue nas janelas e escolha os stacks (3 a 5 valem 100; abaixo de 3 não dá nada). Com a C2 e 5 stacks a Maestria vira 200: veja "Nefer C2".',
    },
    {
      id: 'c4', label: 'Nefer C4', src: 'const4', scope: 'self', timed: true, resShred: { value: { p: 2 }, elements: ['Dendro'] },
      expect: 'Dendro RES decreased by 20%',
      note: 'RES Dendro do inimigo -20% enquanto ela está no Shadow Dance (9 s) e mais 4,5 s depois: janela de tempo (antes estava sempre ligado).',
    },
  ],
  'Aether (Dendro)': travelerBuffs,
  'Lumine (Dendro)': travelerBuffs,
};

const procs: Record<string, ProcCuration[]> = {
  Emilie: [
    {
      id: 'c1', label: 'Emilie C1: Cleardew Cologne +20%', src: 'const1', scale: { atk: { p: 1, x: 6 } },
      expect: 'Cleardew Cologne "Lingering Fragrance" by 20%',
      note: 'O C1 soma 20% ao dano do Cleardew Cologne (600% do ATK no A1): golpe extra de 20% x 600% = 120% do ATK, Dendro, que não conta como habilidade. Adicione junto de cada "Emilie A1: Cleardew Cologne". O +20% da Fragrance Extraction está no buff "Emilie C1".',
    },
  ],
  Kinich: [
    {
      id: 'c2p', label: 'Kinich C2: 1º canhão', src: 'const2', scale: {}, hitType: 'skill',
      of: { talent: 'skill', label: 'Scalespiker Cannon DMG', fraction: { p: 2 } },
      expect: 'its DMG increases by 100%',
      note: '+100% do dano do primeiro Scalespiker Cannon depois de entrar em Nightsoul\'s Blessing, somado como golpe extra de 100% desse golpe (conta como habilidade, igual ao canhão). O AoE maior não muda o dano.',
    },
    {
      id: 'c6', label: 'Kinich C6: ricochete', src: 'const6', scale: { atk: { p: 0 } },
      expect: "dealing 700% of Kinich's ATK as Dendro DMG",
      note: '700% do ATK por Scalespiker Cannon, dano Dendro. Pendente: o texto não diz o tipo do golpe, então não recebe bônus de habilidade. Os buffs do A4 e do C2 sobre o canhão (o ricochete os herda) não entram aqui.',
    },
  ],
  'Aether (Dendro)': travelerProcs,
  'Lumine (Dendro)': travelerProcs,
};

const infos: Record<string, InfoCuration[]> = {
  Baizhu: [
    { src: 'p1', kind: 'cura', label: 'Bônus de cura', text: '+{0%} de Bônus de Cura dele com o personagem em campo abaixo de {1%} de HP', values: [{ p: 1 }, { p: 0 }], expect: 'Baizhu gains 20% Healing Bonus' },
    { src: 'const2', kind: 'cura', label: 'Cura do Gossamer Sprite: Splice', text: 'Cura {0%} da cura normal do Gossamer Sprite; no máximo uma vez a cada {1} s', values: [{ p: 2 }, { p: 3 }], expect: 'healing for 20% of' },
  ],
  Kinich: [
    { src: 'const4', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia depois do Loop Shot ou do Scalespiker Cannon; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'Kinich will restore 5 Energy' },
  ],
  Lauma: [
    { src: 'const1', kind: 'cura', label: 'Threads of Life', text: 'Os ativos próximos recuperam HP igual a {0%} da Maestria dela a cada Lunar-Florescer; no máximo uma vez a cada {1} s', values: [{ p: 4 }, { p: 2 }], expect: "recover HP equal to 500% of Lauma's Elemental Mastery" },
    { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia quando o Frostgrove Sanctuary acerta; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'Lauma will regain 4 Elemental Energy' },
  ],
  'Aether (Dendro)': travelerInfos,
  'Lumine (Dendro)': travelerInfos,
};

export const LOTE: Lote = {
  buffs,
  procs,
  notes: {
    Baizhu: {
      p1: x('Entra o +25% de DMG Dendro (janela, com o personagem em campo a 50% de HP ou mais). Os +20% de Bônus de Cura abaixo de 50% são só informativos.'),
      p3: u('Só cura na exploração.'),
    },
    Emilie: {
      p3: u('Só RES Pyro contra o dano de Queimadura (defesa).'),
      const1: x('Entram o +20% da Fragrance Extraction (buff) e do Cleardew Cologne (golpe extra). O Scent extra a cada 2,9 s só gera pontos do Lumidouce Case.'),
    },
    Kinich: {
      const1: x('Entra o +100% de Dano Crítico do Scalespiker Cannon (aproximação: vale para os golpes de habilidade dele, porque o formato só separa por tipo). A Velocidade de Movimento não muda o dano.'),
      const2: x('Entram a RES Dendro -30% por 6 s (janela) e o +100% do primeiro canhão (golpe extra).'),
    },
    Lauma: {
      p2: x('Entra o +0,04% de DMG da habilidade por ponto de Maestria (teto 32%); o 1-Hit/2-Hit Hold estão cadastrados como Normal em moves.json e não recebem. A redução da recarga do Spirit Envoy Metamorphosis não muda o dano.'),
      p4: u('Só mini-mapa.'),
    },
    Nefer: {
      p1: x('Entra a Maestria +100 com 3 stacks de Véu da Falsidade (Moonsign: Ascendant Gleam). Pendente: o +40% de DMG do Supremo por stack (linha "DMG Bonus" do Supremo) não entra: os dois golpes do Supremo estão cadastrados como Normal em moves.json e o bônus não distingue golpe específico.'),
    },
    'Aether (Dendro)': travelerNotes,
    'Lumine (Dendro)': travelerNotes,
  },
  infos,
};
