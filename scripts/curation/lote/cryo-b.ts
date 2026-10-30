/**
 * Lote Cryo B: Rosaria, Eula, Aloy, Shenhe, Layla, Mika. Tudo conferido contra o Lunaris 7.1.53.
 * Correções: Rosaria C6 e os RES de Eula (Lacerar) e Shenhe (Campo) eram "sempre ligados" e agora são janelas; Rosaria A4
 * saía do teto de 15% (o valor real é 15% da Taxa Crítica dela, sem conversão no formato): removido e pendente; Layla A4
 * somava também no Skill DMG da cortina (só o Shooting Star recebe); Aloy A1 usava x:2 e A4 assumia 35% fixo (agora 10
 * stacks de 1 s, escolha do usuário); Shenhe ganha o A4 "segurar" e o C4 (stacks escolhidos, padrão 0); Layla ganha o C4
 * (Dawn Star, 1 golpe); Mika A1 passa a ter stacks de Detector; Eula ganha o C6 (5 stacks iniciais); Aloy ganha o bônus
 * de Normal do Rushing Ice por nível.
 */
import type { BuffCuration, NoteCuration, ProcCuration } from '../characters';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });

const eulaProcs: ProcCuration[] = [
  {
    id: 'c6', label: 'Eula C6: 5 stacks iniciais da Lightfall Sword', src: 'const6', scale: {}, element: 'Physical', hitType: 'burst',
    of: { talent: 'burst', label: 'DMG Per Stack', fraction: { p: 0 } },
    expect: 'start with 5 stacks of energy',
    note: 'Soma 5 stacks ao dano da Lightfall Sword: 5 x o "DMG Per Stack" (Físico, Supremo), somado ao Base DMG. A chance de 50% de um stack a mais não entra.',
  },
];

const buffs: Record<string, BuffCuration[]> = {
  Rosaria: [
    {
      id: 'a1', label: 'Rosaria A1', src: 'p1', scope: 'self', timed: true, stats: { critRate: { p: 0 } },
      expect: "Rosaria's CRIT Rate increases by 12% for 5s",
      note: '+12% de Taxa Crítica dela por 5 s depois de acertar pelas costas com a habilidade: ligue a janela.',
    },
    {
      id: 'c1', label: 'Rosaria C1', src: 'const1', scope: 'self', timed: true, stats: { byType: { normal: { p: 1 } } },
      expect: 'her Normal Attack DMG increases by 10% for 4s',
      note: '+10% de DMG de Normal por 4 s depois de um acerto crítico: ligue a janela. O +10% de velocidade de ataque não muda o dano por golpe e não entra.',
    },
    {
      id: 'c6', label: 'Rosaria C6', src: 'const6', scope: 'self', timed: true, resShred: { value: { p: 0 }, elements: ['Physical'] },
      expect: "decreases opponents' Physical RES by 20% for 10s",
      note: 'RES Física do inimigo -20% por 10 s depois do golpe do Supremo: janela de tempo (antes estava sempre ligado).',
    },
  ],
  Eula: [
    {
      id: 'skill', label: 'Eula: Lacerar (RES)', src: 'kit', kit: { talent: 'skill', key: 'Cryo RES Decrease' }, scope: 'self', timed: true,
      resShred: { value: { lit: 1 }, elements: ['Cryo'] },
      expect: 'Physical RES and Cryo RES decreased',
      note: 'RES Cryo do inimigo -16% a -25% por nível por 7 s, só no Hold com stacks de Grimheart gastos: janela de tempo (antes estava sempre ligado).',
    },
    {
      id: 'skill-fis', label: 'Eula: Lacerar (RES Física)', src: 'kit', kit: { talent: 'skill', key: 'Physical RES Decrease' }, scope: 'self', timed: true,
      resShred: { value: { lit: 1 }, elements: ['Physical'] },
      expect: 'Physical RES and Cryo RES decreased',
      note: 'RES Física do inimigo -16% a -25% por nível por 7 s, só no Hold com stacks de Grimheart gastos: janela de tempo (antes estava sempre ligado).',
    },
  ],
  Aloy: [
    {
      id: 'a1', label: 'Aloy A1 (própria)', src: 'p1', scope: 'self', timed: true, stacks: false, stats: { atkPct: { lit: 0.16 } },
      expect: 'her ATK is increased by 16%',
      note: '+16% do ATK dela por 10 s depois do Coil do Frozen Wilds (16% é literal do texto): ligue a janela.',
    },
    {
      id: 'a1o', label: 'Aloy A1 (equipe)', src: 'p1', scope: 'others', timed: true, stats: { atkPct: { p: 0 } },
      expect: "nearby party members' ATK is increased by 8%",
      note: '+8% de ATK dos demais por 10 s: ligue a janela.',
    },
    {
      id: 'a4', label: 'Aloy A4', src: 'p2', scope: 'self', timed: true, forElements: ['Cryo'], stats: { dmgPct: { lit: 0.35 } },
      stacks: { max: 10, unit: 's no Rushing Ice' },
      expect: 'her Cryo DMG Bonus increases by 3.5% every 1s',
      note: '+3,5% de DMG Cryo por segundo no Rushing Ice, teto de 35% (10 s, literal do texto; o Rushing Ice dura 10 s). Escolha os segundos de 0 a 10; só golpes Cryo recebem.',
    },
    {
      id: 'rushing', label: 'Aloy: Rushing Ice (Normal)', src: 'kit', kit: { talent: 'skill', key: 'Rushing Ice Normal Attack DMG Bonus' }, scope: 'self', timed: true,
      stats: { byType: { normal: { lit: 1 } } },
      expect: 'further increases the DMG dealt by her Normal Attacks',
      note: '+29,23% a +56,7% (nível 1 ao 14) de DMG de Normal por nível da habilidade, por 10 s no Rushing Ice: ligue a janela. O bônus por stack de Coil (5,84%/11,69%/17,53%) não entra: Pendente: a linha traz 3 valores por stack e o formato lê um só.',
    },
  ],
  Shenhe: [
    {
      id: 'a4', label: 'Shenhe A4', src: 'p2', scope: 'team', timed: true, stats: { byType: { skill: { p: 0 }, burst: { p: 0 } } },
      expect: 'Press: Elemental Skill and Elemental Burst DMG increased by 15% for 10s',
      note: '+15% de DMG de habilidade e Supremo por 10 s (versão apertada): ligue a janela. A versão segurada está em "Shenhe A4 (segurar)".',
    },
    {
      id: 'a4h', label: 'Shenhe A4 (segurar)', src: 'p2', scope: 'team', timed: true, stats: { byType: { normal: { p: 2 }, charged: { p: 2 }, plunge: { p: 2 } } },
      expect: 'Normal, Charged, and Plunging Attack DMG increased by 15% for 15s',
      note: '+15% de DMG de Normal, Carregado e Imersivo por 15 s (versão segurada da habilidade): ligue a janela, no lugar do A4 apertado.',
    },
    {
      id: 'c4', label: 'Shenhe C4', src: 'const4', scope: 'self', timed: true, stats: { byType: { skill: { p: 0, x: 50 } } },
      stacks: { max: 50, unit: 'Skyfrost Mantra', default: 0 },
      expect: 'increasing the DMG of that Spring Spirit Summoning by 5% for each stack consumed',
      note: '+5% de DMG do Spring Spirit Summoning (Press e Hold, os únicos golpes de habilidade dela) por stack gasto, até 50. Os stacks dependem de quantas vezes a equipe aciona o Icy Quill: o padrão é 0, escolha de 0 a 50.',
    },
    {
      id: 'burst', label: 'Shenhe: Campo (RES)', src: 'kit', kit: { talent: 'burst', key: 'RES Decrease' }, scope: 'self', timed: true,
      resShred: { value: { lit: 1 }, elements: ['Cryo', 'Physical'] },
      expect: 'decreases the Cryo RES and Physical RES of opponents within it',
      note: 'RES Cryo e Física do inimigo -6% a -15% por nível enquanto o campo do Supremo durar (12 s): janela de tempo (antes estava sempre ligado).',
    },
  ],
  Layla: [
    {
      id: 'a4', label: 'Layla A4', src: 'p2', scope: 'self', timed: false,
      flat: [{ name: 'Shooting Stars por HP', sourceStat: 'HP', perPoint: { p: 0 }, hitTypes: ['skill'], labels: ['Shooting Star DMG'] }],
      expect: "increased by 1.5% of Layla's Max HP",
      note: 'Soma 1,5% do HP máximo ao dano base de cada Shooting Star. O Skill DMG da cortina NÃO recebe (a curadoria antiga somava nos dois).',
    },
    {
      id: 'c4', label: 'Layla C4 (Dawn Star)', src: 'const4', scope: 'self', timed: false,
      flat: [{ name: 'Dawn Star por HP da Layla', sourceStat: 'HP', perPoint: { p: 0 }, hitTypes: ['normal', 'charged'], stacks: 1, targets: 'team' }],
      expect: "increase based on 5% of Layla's Max HP",
      note: 'Soma 5% do HP máximo da Layla ao PRIMEIRO Normal ou Carregado da equipe depois que os Shooting Stars começam (o efeito some 0,05 s depois do primeiro golpe, 3 s no máximo). No jogo cada membro tem o seu; aqui entra um golpe só por rotação.',
    },
    {
      id: 'c6', label: 'Layla C6', src: 'const6', scope: 'self', timed: false, stats: { byType: { skill: { p: 1 }, burst: { p: 1 } } },
      expect: 'deal 40% increased DMG',
      note: '+40% de DMG da habilidade e do Supremo (Starlight Slug). Aproximação: o bônus de habilidade também vale para o Skill DMG da cortina, porque o formato não tem bônus por golpe específico.',
    },
  ],
  Mika: [
    {
      id: 'a1', label: 'Mika A1', src: 'p1', scope: 'team', timed: true, stats: { physDmgPct: { p: 0, x: 3 } }, stacks: { max: 3, unit: 'Detector' },
      expect: 'increasing their Physical DMG by 10% when they are on the field',
      note: '+10% de DMG Físico por stack de Detector (até 3) no personagem em campo durante a Soulwind: ligue a janela e escolha os stacks de 0 a 3.',
    },
    {
      id: 'a4', label: 'Mika A4', src: 'p2', scope: 'team', timed: true, stacks: false, stats: { physDmgPct: { lit: 0.1 } },
      expect: 'maximum number of stacks that can be gained through Soulwind alone is increased by 1',
      note: '+1 stack de Detector no limite (+10% de DMG Físico, o valor por stack do A1): ligue junto com o A1. O stack extra por acerto crítico (1 por Soulwind) não entra. Pendente: o texto não diz se ele passa do limite.',
    },
    {
      id: 'c6', label: 'Mika C6', src: 'const6', scope: 'team', timed: true, stacks: false, stats: { physDmgPct: { lit: 0.1 }, physCritDmg: { p: 0 } },
      expect: 'deal 60% more Physical CRIT DMG',
      note: '+1 stack de Detector no limite (+10% de DMG Físico) e +60% de Dano Crítico Físico do personagem em campo durante a Soulwind: ligue a janela.',
    },
  ],
};

const infos: Record<string, InfoCuration[]> = {
  Rosaria: [{ src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia quando o Carregado do Ravaging Confession acerta crítico; uma vez por uso', values: [{ p: 0 }], expect: 'regenerate 5 Energy for Rosaria' }],
  Layla: [
    { src: 'p1', kind: 'escudo', label: 'Força do escudo', text: '+{0%} de força do escudo por Night Star, até 4 acúmulos', values: [{ p: 0 }], expect: 'increases by 6%' },
    { src: 'const1', kind: 'escudo', label: 'Escudo da cortina e dos aliados', text: 'Absorção da cortina +{0%}; aliados sem cortina ganham escudo de {1%} dessa absorção por {2} s', values: [{ p: 0 }, { p: 1 }, { p: 2 }], expect: 'is increased by 20%' },
    { src: 'const2', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia por Shooting Star que acerta (uma vez cada)', values: [{ p: 0 }], expect: 'restore 1 Energy to Layla' },
  ],
  Mika: [{ src: 'const4', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia quando o Eagleplume dele cura; até {1} vezes por uso do Supremo', values: [{ p: 0 }, { p: 1 }], expect: 'restore 3 Energy to Mika' }],
};

export const LOTE: Lote = {
  buffs,
  procs: { Eula: eulaProcs },
  remove: { Rosaria: ['a4'] },
  notes: {
    Rosaria: {
      p2: x('Pendente: os demais ganham 15% da Taxa Crítica DELA (teto 15%); o formato não converte Taxa Crítica e o valor depende da build, então não entra (a curadoria antiga assumia o teto).'),
      p3: u('Só velocidade de movimento à noite.'),
      const1: x('Entra o +10% de DMG de Normal (janela). O +10% de velocidade de ataque não muda o dano por golpe.'),
      const6: x('Entra a RES Física -20% por 10 s (janela).'),
    },
    Eula: {
      const6: x('Entram os 5 stacks iniciais (golpe extra "Eula C6"). A chance de 50% de um stack a mais não entra.'),
    },
    Shenhe: {
      p2: x('Entram as duas versões: apertar (habilidade e Supremo, 10 s) e segurar (Normal, Carregado e Imersivo, 15 s), como janelas.'),
      const4: x('Entra o +5% por stack gasto (até 50), com stacks escolhidos pelo usuário (padrão 0): no jogo depende de quantas vezes a equipe aciona o Icy Quill.'),
    },
    Layla: {
      const4: null,
      const6: x('Entram +40% de DMG de habilidade e Supremo (aproximação: vale também para o Skill DMG da cortina). A redução de 20% no intervalo dos Night Stars não muda o dano por golpe.'),
    },
    Mika: {
      const2: u('Só gera stacks de Detector: escolha os stacks no buff Mika A1.'),
    },
  },
  infos,
};
