/**
 * Lote Hydro C: Mualani, Dahlia, Aino, Columbina, Vodyanitsa, Aether (Hydro) e Lumine (Hydro). Conferido contra o Lunaris 7.1.53.
 * Mualani, Dahlia e Aino: todos os números antigos batem com o texto (nada a corrigir; só entram os informativos).
 * Correções: Vodyanitsa A1 e RES do Song (6 s) eram "sempre ligados" e viram janelas, o C1 vale também para ela (scope team),
 * o bônus de DMG do Supremo na Song of Ages Past (kit) e os efeitos de Redemoinho Estelar do C2/C6 entram; Columbina:
 * Domínio Lunar lido da linha do Lunaris, e o C4 de Lunar-Florescer sai (texto ambíguo: por acerto ou por golpe);
 * Viajante Hydro ganha o Carregado: Tidebound (A4/p3).
 */
import type { BuffCuration, NoteCuration } from '../characters';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });

/** Os dois Viajantes têm os mesmos textos Hydro (ids Lunaris 10000005_HYDRO e 10000007_HYDRO). */
const travelerBuffs: BuffCuration[] = [
  {
    id: 'p3tide', label: 'Viajante A4 (Carregado: Tidebound)', src: 'p3', scope: 'self', timed: false,
    flat: [{ name: 'Carregado: Tidebound por ATK', sourceStat: 'ATK', perPoint: { p: 7 }, hitTypes: ['charged'], labels: ['Charged Attack DMG'], stacks: 2 }],
    expect: "Increase in DMG is equal to 150% of Traveler's ATK",
    note: 'Soma 150% do ATK ao dano base de CADA um dos 2 acertos do Carregado, uma vez a cada 15 s (precisa de 3 stacks de Blade of Many Waters, dados pelas variações de 5% de HP dos aliados). Entra nos 2 primeiros acertos de Carregado da rotação (1 Tidebound).',
  },
  {
    id: 'p3hp', label: 'Viajante A4 (Tidebound com HP >= 50%)', src: 'p3', scope: 'self', timed: false,
    flat: [{ name: 'Tidebound com HP >= 50% por ATK', sourceStat: 'ATK', perPoint: { p: 13 }, hitTypes: ['charged'], labels: ['Charged Attack DMG'], stacks: 2 }],
    expect: "to increase DMG inflicted by each Charged Attack hit by 100% of Traveler's ATK",
    note: 'Soma mais 100% do ATK em cada acerto do Tidebound, só com HP de 50% ou mais (gasta 10% do HP máximo; o gasto não entra). Assume HP >= 50%: com HP abaixo, desligue este efeito no golpe (flatOff).',
  },
];

const travelerNotes = {
  p1: u('Só cura (informativa).'),
  p2: x('Pendente: o bônus do Torrent Surge é 45% do HP gasto na Suffusion (teto 5.000), mas o HP gasto depende de quantos segundos de Hold e o texto não diz se o 4% do Lunaris é por segundo; não entra. O bônus de DMG da Suffusion no Dewdrop também não entra.'),
  p3: x('Entra o Carregado: Tidebound (+150% do ATK por acerto, mais +100% com HP >= 50%, 1 vez a cada 15 s). Os buffs "para cada elemento ressonado" não entram: o texto não diz quais ressonâncias contam nem o valor de cada uma. A cura de 25% do HP com HP < 50% é só informativa.'),
  const1: u('Só energia (informativa).'),
  const2: u('Só bolha.'),
  const4: u('Só escudo (informativo).'),
  const6: u('Só cura (informativa).'),
} as const;

const travelerInfos: InfoCuration[] = [
  { src: 'p1', kind: 'cura', label: 'Cura da Sourcewater Droplet', text: 'Recupera {0%} do HP ao pegar a gota (no máximo {1} gotas por uso, 1 por segundo)', values: [{ p: 2 }, { p: 1 }], expect: 'they will restore 7% HP' },
  { src: 'const1', kind: 'energia', label: 'Energia da gota', text: '{0} de Energia ao pegar uma Sourcewater Droplet', values: [{ p: 0 }], expect: 'restore 2 Energy to the Traveler' },
  { src: 'const4', kind: 'escudo', label: 'Aquacrest Aegis', text: 'Escudo de {0%} do HP máximo (absorve Hydro 250% melhor), renovado a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: "absorb 10% of the Traveler's Max HP" },
  { src: 'const6', kind: 'cura', label: 'Cura do aliado de menor HP', text: 'Recupera {0%} do HP máximo do aliado com menor % de HP ao pegar a gota', values: [{ p: 0 }], expect: "based on 6% of said member's Max HP" },
];

export const LOTE: Lote = {
  buffs: {
    Vodyanitsa: [
      {
        id: 'a1', label: 'Vodyanitsa A1', src: 'p1', scope: 'self', timed: true, resShred: { value: { p: 0 }, elements: ['Anemo'] },
        expect: "opponents' Anemo RES by 35%",
        note: 'RES Anemo do inimigo -35% por 6 s depois que um Wandering Vortex é gerado ou detona: janela de tempo, o usuário liga e decide a duração (antes estava sempre ligado). Os Vortex em si e os +4 s de Radiance: Stellar Swirl não entram.',
      },
      {
        id: 'skill', label: 'Vodyanitsa: Canção (RES)', src: 'kit', kit: { talent: 'skill', key: 'Hydro/Cryo RES Reduction' }, scope: 'self', timed: true,
        resShred: { value: { lit: 1 }, elements: ['Hydro', 'Cryo'] },
        expect: 'decrease the Hydro RES and Cryo RES of opponents hit',
        note: 'RES Hydro e Cryo do inimigo -16,5% a -39% por nível por 6 s depois de cada golpe do Skill ou do Horn of Spring\'s Call: janela de tempo (antes estava sempre ligado).',
      },
      {
        id: 'burst', label: 'Vodyanitsa: Koda na Canção (DMG do Supremo)', src: 'kit', kit: { talent: 'burst', key: 'Song of Ages Past DMG Bonus' }, scope: 'self', timed: true,
        stats: { byType: { burst: { lit: 1 } } },
        expect: 'DMG dealt is further increased',
        note: '+48% a +114% por nível de DMG do Supremo (linha "Song of Ages Past DMG Bonus" do Lunaris) enquanto a Song of Ages Past estiver ativa (16 s depois da habilidade): ligue a janela no Supremo.',
      },
      {
        id: 'c1', label: 'Vodyanitsa C1', src: 'const1', scope: 'team', timed: true, convert: { from: 'hp', perPoint: { p: 0 }, to: ['atkFlat'] },
        expect: 'increases the ATK of all nearby party members by 0.8% of her Max HP',
        note: 'ATK fixo de todos os membros, ela inclusive (antes o formato excluía ela), = 0,8% do HP máximo dela por 5 s a cada cura da Song of Ages Past: ligue na janela. É por isso que a build dela foca em HP.',
      },
      {
        id: 'c2s', label: 'Vodyanitsa C2 (Redemoinho Estelar)', src: 'const2', scope: 'team', timed: true, stats: { reactionBonus: { stellarswirlCritDmg: { p: 1 } } },
        expect: 'increases the CRIT DMG from Stellar Swirl reaction DMG caused by your own currently active party member by 60% for 5s',
        note: '+60% de Dano Crítico do dano de Redemoinho Estelar do personagem em campo por 5 s, quando há um Wandering Vortex em campo (ou até 5 s depois de explodir): janela de tempo. No lugar do +50% de Hydro/Cryo (não ligue os dois). Até a C5 vale só para o ativo; a C6 estende a todos.',
      },
      {
        id: 'c6s', label: 'Vodyanitsa C6 (Redemoinho Estelar)', src: 'const6', scope: 'team', timed: true, stats: { reactionBonus: { stellarswirlSpecial: { p: 0 } } },
        expect: 'elevated by 25%',
        note: 'Dano de Redemoinho Estelar dos membros próximos elevado em 25% enquanto a Song of Ages Past estiver ativa: ligue na janela. O +60% de DMG Hydro/Cryo está em "Vodyanitsa C6".',
      },
    ],
    Columbina: [
      {
        id: 'domain', label: 'Columbina: Domínio Lunar', src: 'kit', kit: { talent: 'burst', key: 'Lunar Reaction DMG Bonus' }, scope: 'team', timed: true,
        stats: { reactionBonus: { lunarcharged: { lit: 1 }, lunarbloom: { lit: 1 }, lunarcrystallize: { lit: 1 } } },
        expect: 'Lunar Domain',
        note: 'DMG das reações Lunares da equipe pelo nível do Supremo (13% no nível 1 a 55% no 15, linha "Lunar Reaction DMG Bonus" do Lunaris) enquanto durar o Domínio Lunar (20 s): ligue nas janelas.',
      },
      {
        id: 'c4lc', label: 'Columbina C4 (Lunar-Carregado)', src: 'const4', scope: 'self', timed: true, convert: { from: 'hp', perPoint: { p: 1 }, to: ['lunarchargedFlat'] },
        expect: 'is increased by 12.5%/2.5%/12.5% of Columbina',
        note: '+12,5% do HP máximo dela no dano Lunar-Carregado do Gravity Interference (1 vez a cada 15 s, só o Lunar-Carregado ter acumulado mais Gravity): ligue a janela SÓ na ação "Gravity Interference: Lunar-Charged DMG", porque o formato não separa o golpe e o bônus vale para todo dano Lunar-Carregado dela na janela.',
      },
      {
        id: 'c4lcr', label: 'Columbina C4 (Lunar-Cristalizar)', src: 'const4', scope: 'self', timed: true, convert: { from: 'hp', perPoint: { p: 3 }, to: ['lunarcrystallizeFlat'] },
        expect: 'is increased by 12.5%/2.5%/12.5% of Columbina',
        note: '+12,5% do HP máximo dela no dano Lunar-Cristalizar do Gravity Interference (1 vez a cada 15 s): ligue a janela SÓ na ação "Gravity Interference: Lunar-Crystallize DMG" (o formato não separa o golpe).',
      },
    ],
    'Aether (Hydro)': travelerBuffs,
    'Lumine (Hydro)': travelerBuffs,
  },

  // Texto ambíguo: "increased by 2.5% of her Max HP" no Lunar-Florescer, que acerta 5 vezes (por acerto ou no total?).
  remove: { Columbina: ['c4lb'] },

  notes: {
    Vodyanitsa: {
      p1: x('Entra a RES Anemo -35% por 6 s (janela). Os Wandering Vortex e os +4 s de Radiance: Stellar Swirl não entram.'),
      p2: x('Pendente: o texto só dá o número de stacks (25 de Lead Vocal, 10 de Chorus); como esses efeitos agem não está na descrição (só os params 40000, 260/140, 6500/3500), então não entram. Os dados de dano fixo antigos em flatDamage.json são da planilha e valem só para os alvos dela (Skirk, Furina, Escoffier).'),
      const2: x('Entram os +50% de Dano Crítico Hydro/Cryo e os +60% do Redemoinho Estelar (janelas). Os +9 s da Song of Ages Past são só duração.'),
      const4: x('Entra o +20% de HP máximo (até 3 stacks de 6 s; precisa de aliado com 40% de HP ou mais). A cura +50% abaixo de 40% é só informativa.'),
      const6: x('Entram +60% de DMG Hydro/Cryo e +25% de Redemoinho Estelar enquanto a Song of Ages Past estiver ativa (janelas).'),
    },
    Columbina: {
      const1: x('Entra o +1,5% de dano das reações Lunares. A energia (6), a resistência a interrupção e o escudo são informativos ou não afetam o dano.'),
      const4: x('Entram o +12,5% do HP no Lunar-Carregado e no Lunar-Cristalizar do Gravity Interference (janelas) e o +1,5% de dano Lunar. Pendente: o +2,5% do HP no Lunar-Florescer (5 acertos) não entra, o texto não diz se é por acerto ou no total.'),
    },
    'Aether (Hydro)': travelerNotes,
    'Lumine (Hydro)': travelerNotes,
  },

  infos: {
    Dahlia: [
      { src: 'const1', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia a cada stack de Benison que ele ganha', values: [{ p: 0 }], expect: 'he will regain 2.5 Elemental Energy' },
      { src: 'const2', kind: 'escudo', label: 'Força do escudo', text: '+{0%} de força do escudo por {1} s no personagem protegido pelo Shield of Sacred Favor', values: [{ p: 0 }, { p: 1 }], expect: 'gain 25% increased Shield Strength for 12s' },
    ],
    Aino: [
      { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia quando o Musecatcher acerta; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'restore 10 Elemental Energy for Aino' },
    ],
    Columbina: [
      { src: 'const1', kind: 'energia', label: 'Energia do personagem ativo (Lunar-Carregado)', text: 'Com Moonsign: Ascendant Gleam, o personagem ativo recupera {0} de Energia no Gravity Interference (uma vez a cada {1} s)', values: [{ p: 0 }, { p: 5 }], expect: 'Your current active character will recover 6 Energy' },
      { src: 'const1', kind: 'escudo', label: 'Rainsea Shield (Lunar-Cristalizar)', text: 'Com Moonsign: Ascendant Gleam, escudo de {0%} do HP máximo dela por {1} s (absorve Hydro 250% melhor)', values: [{ p: 3 }, { p: 4 }], expect: "DMG absorption is based on 12% of Columbina's Max HP" },
      { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia a cada Gravity Interference', values: [{ p: 0 }], expect: '4 Elemental Energy will be restored to Columbina' },
    ],
    Vodyanitsa: [
      { src: 'const4', kind: 'cura', label: 'Cura reforçada da Song of Ages Past', text: 'Com o alvo abaixo de {0%} de HP, a cura aumenta {1%}', values: [{ p: 0 }, { p: 1 }], expect: 'The healing is increased by 50%' },
    ],
    'Aether (Hydro)': travelerInfos,
    'Lumine (Hydro)': travelerInfos,
  },
};
