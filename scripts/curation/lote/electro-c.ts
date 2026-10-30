/**
 * Lote Electro C: Clorinde, Ororon, Varesa, Ineffa, Mitya, Valeriy. Tudo conferido contra o Lunaris 7.1.53.
 * Correções: Clorinde A1/C2 só valem para dano Electro e o C2 agora REFORÇA o A1 (stacks compartilhados, teto 2.700); C4 vira Bond of Life
 * escolhível; Varesa A1 valia 180% sempre (sem Fiery Passion são 50%): agora usa o rótulo do golpe (normal x Fiery Passion), C1 reforça
 * e o C4 ganha o Diligent Refinement; Mitya C2 (RES) era permanente e vira janela. Ororon ganha o Hypersense (golpe extra), Mitya a Maestria
 * por Gradient Beacon e Valeriy os +100% do C6 (golpes extras).
 */
import type { BuffCuration, NoteCuration, ProcCuration } from '../characters';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });

const clorinde: BuffCuration[] = [
  {
    id: 'a1', label: 'Clorinde A1 (Dark-Shattering Flame)', src: 'p1', scope: 'self', timed: false,
    flat: [{ name: 'Dark-Shattering Flame por ATK', sourceStat: 'ATK', perPoint: { p: 2, x: 3 }, cap: { p: 1 }, hitTypes: ['normal', 'burst'], elements: ['Electro'] }],
    stacks: { max: 3, unit: 'stacks de Dark-Shattering Flame' },
    expect: "Electro DMG dealt by Clorinde's Normal Attacks and Last Lightfall will be increased by 20% of Clorinde's ATK",
    note: 'Soma 20% do ATK por stack (3 stacks = 60%, você escolhe 0 a 3) ao dano base dos Normais e do Last Lightfall, com teto de 1.800 por golpe. Só vale em dano Electro (Normal Físico fora do Night Vigil não recebe: marque o golpe como Electro). O Carregado não recebe (o texto fala de Normal). É dano fixo: não tem janela de 15 s, então ligue só quando houver reação Electro.',
  },
  {
    id: 'c2', label: 'Clorinde C2 (Dark-Shattering Flame reforçado)', src: 'const2', scope: 'self', timed: false, replaces: 'a1',
    flat: [{ name: 'Dark-Shattering Flame reforçado por ATK', sourceStat: 'ATK', perPoint: { p: 1, x: 3 }, cap: { p: 0 }, hitTypes: ['normal', 'burst'], elements: ['Electro'] }],
    stacks: { max: 3, of: 'a1', unit: 'stacks de Dark-Shattering Flame' },
    expect: 'Electro DMG dealt by Clorinde\'s Normal Attacks and Last Lightfall will be increased by 30% of Clorinde\'s ATK',
    note: 'REFORÇA o A1 (não soma): 30% do ATK por stack (90% com 3), teto de 2.700 por golpe; usa a mesma escolha de stacks do A1. A resistência a interrupção com 3 stacks não entra.',
  },
  {
    id: 'a4', label: 'Clorinde A4', src: 'p2', scope: 'self', timed: true, stats: { critRate: { p: 2, x: 2 } },
    stacks: { max: 2, unit: 'stacks de Taxa Crítica', default: 2 },
    expect: 'her CRIT Rate will increase by 10%',
    note: '+10% de Taxa Crítica por stack (até 2) por 15 s, com o Bond of Life em 100% ou mais da vida máxima: ligue nas janelas e escolha os stacks. A conversão de 100% da cura em Bond of Life é só informativa.',
  },
  {
    id: 'c4', label: 'Clorinde C4 (Last Lightfall por Bond of Life)', src: 'const4', scope: 'self', timed: true, stats: { byType: { burst: { p: 1 } } },
    stacks: { max: 100, unit: '% de Bond of Life', default: 100 },
    expect: 'Every 1% of her current Bond of Life will increase Last Lightfall DMG by 2%',
    note: '+2% de DMG do Last Lightfall por 1% de Bond of Life, até +200% (100% de Bond of Life). Escolha o % de Bond of Life no momento do Supremo; o padrão é o máximo. Janela do Supremo.',
  },
];

const clorindeProcs: ProcCuration[] = [
  {
    id: 'c6shade', label: 'Clorinde C6: Glimbright Shade', src: 'const6', scale: { atk: { lit: 2 } }, hitType: 'normal',
    expect: "executing an attack that deals 200% of Clorinde's ATK as Electro DMG",
    note: 'Cada ataque do Glimbright Shade vale 200% do ATK (200% é literal do texto) e conta como Normal. No máximo 1 por segundo e 6 por Night Vigil: adicione até 6 execuções.',
  },
];

const ororonProcs: ProcCuration[] = [
  {
    id: 'a1hyper', label: 'Ororon A1: Hypersense', src: 'p1', scale: { atk: { p: 1 } },
    expect: "Deal Nightsoul-aligned Electro DMG based on 160% of Ororon's ATK",
    note: '160% do ATK como dano Electro (sem tipo de golpe), no máximo uma vez a cada 1,8 s e em até 4 inimigos (o dano é de UM alvo; adicione uma execução por disparo). Os pontos de Nightsoul não entram.',
  },
  {
    id: 'c1hyper', label: 'Ororon C1: Nighttide (+50% do Hypersense)', src: 'const1', scale: { atk: { lit: 0.8 } },
    expect: 'take 50% increased DMG from Hypersense',
    note: 'Soma o +50% ao Hypersense: 50% x 160% do ATK = 80% do ATK (conta feita com os dois números do texto). Ponha junto de cada Hypersense em inimigo com Nighttide (12 s).',
  },
  {
    id: 'c6hyper', label: 'Ororon C6: Hypersense do Supremo', src: 'const6', scale: { atk: { lit: 3.2 } },
    expect: 'dealing 200% of its original DMG',
    note: 'Ao usar o Supremo vem um efeito equivalente ao Hypersense com 200% do dano original: 200% x 160% do ATK = 320% do ATK (conta feita com os dois números do texto). Não soma o +50% do Nighttide (o texto não diz).',
  },
];

const valeriyProcs: ProcCuration[] = [
  {
    id: 'c6mortar', label: 'Valeriy C6: Direct-Fire Mortar (+100%)', src: 'const6', scale: {}, hitType: 'normal',
    of: { talent: 'normal', label: 'Direct-Fire Mortar: Point-Blank Bombardment DMG', variant: 0, fraction: { p: 0 } },
    expect: 'Their DMG is increased by 100%',
    note: 'Soma +100% do dano do Direct-Fire Mortar como golpe extra de 100% desse golpe (ponha junto dele). O crítico do Electro está no buff "Valeriy C6 (Electro)".',
  },
  {
    id: 'c6shell', label: 'Valeriy C6: Thunderburst Shell (+100%)', src: 'const6', scale: {}, hitType: 'burst',
    of: { talent: 'burst', label: 'Thunderburst Shell DMG', variant: 0, fraction: { p: 0 } },
    expect: 'Their DMG is increased by 100%',
    note: 'Soma +100% do dano de cada Thunderburst Shell como golpe extra de 100% desse golpe (ponha junto dele).',
  },
];

export const LOTE: Lote = {
  buffs: {
    Clorinde: clorinde,
    Ororon: [
      {
        id: 'c2', label: 'Ororon C2', src: 'const2', scope: 'self', timed: true, forElements: ['Electro'], stats: { dmgPct: { p: 3 } },
        stacks: { max: 4, unit: 'inimigos atingidos', levels: [{ p: 0 }, { p: 1 }, { p: 2 }, { p: 3 }], default: 1 },
        expect: 'Gain 8% Electro DMG Bonus',
        note: '+8% de DMG Electro por 9 s depois do Supremo, +8% por inimigo extra atingido pelo Supremo ou pelo Supersonic Oculus, até 32% (4 inimigos, o teto do texto). Escolha os inimigos atingidos (padrão 1); janela de tempo.',
      },
      {
        id: 'c6', label: 'Ororon C6', src: 'const6', scope: 'team', timed: true, stats: { atkPct: { p: 0, x: 3 } },
        stacks: { max: 3, unit: 'stacks de ATK' },
        expect: "active character's ATK is increased by 10%",
        note: '+10% de ATK por stack (até 3) do personagem em campo por 9 s depois do Hypersense: janela, escolha os stacks. O Hypersense extra do Supremo está no golpe "Ororon C6: Hypersense do Supremo".',
      },
    ],
    Varesa: [
      {
        id: 'a1', label: 'Varesa A1 (Rainbow Crash)', src: 'p1', scope: 'self', timed: false,
        flat: [{ name: 'Rainbow Crash por ATK', sourceStat: 'ATK', perPoint: { p: 0 }, hitTypes: ['plunge'], labels: ['Low/High Plunge DMG'], stacks: 1 }],
        expect: 'the shockwave DMG dealt when she hits the ground is increased by 50% of her ATK',
        note: 'Sem Fiery Passion: soma 50% do ATK à onda de choque do Imersivo ("Low/High Plunge DMG"), 1 vez por uso da habilidade (5 s). O Plunge DMG do caminho não recebe.',
      },
      {
        id: 'a1fp', label: 'Varesa A1 (Rainbow Crash, Fiery Passion)', src: 'p1', scope: 'self', timed: false,
        flat: [{ name: 'Rainbow Crash (Fiery Passion) por ATK', sourceStat: 'ATK', perPoint: { p: 1 }, hitTypes: ['plunge'], labels: ['Fiery Passion Low/High Plunge DMG'], stacks: 1 }],
        expect: 'this ground impact DMG is increased by 180% of her ATK instead',
        note: 'Em Fiery Passion: soma 180% do ATK à onda de choque ("Fiery Passion Low/High Plunge DMG"), 1 vez por uso da habilidade. Nunca soma com os 50%: cada estado tem o próprio golpe.',
      },
      {
        id: 'c1', label: 'Varesa C1 (Rainbow Crash reforçado)', src: 'const1', scope: 'self', timed: false, replaces: 'a1',
        flat: [{ name: 'Rainbow Crash reforçado por ATK', sourceStat: 'ATK', perPoint: { p: 0 }, hitTypes: ['plunge'], labels: ['Low/High Plunge DMG'], stacks: 1 }],
        expect: "Varesa's Plunging Attack ground impact DMG is increased by 180% of her ATK",
        note: 'REFORÇA o A1 (não soma): 180% do ATK também fora de Fiery Passion, no "Low/High Plunge DMG". O Thunderous Tornado Eruption (também recebe) não tem rótulo próprio no cadastro: pendente.',
      },
      {
        id: 'c4dr', label: 'Varesa C4 (Diligent Refinement)', src: 'const4', scope: 'self', timed: false,
        flat: [{ name: 'Diligent Refinement por ATK', sourceStat: 'ATK', perPoint: { p: 0 }, cap: { p: 1 }, hitTypes: ['plunge'], labels: ['Low/High Plunge DMG'], stacks: 1 }],
        expect: 'which will increase her Plunging Attack ground impact DMG by 500% of her ATK',
        note: 'Supremo lançado sem Fiery Passion nem Apex Drive: +500% do ATK (teto 20.000) na próxima onda de choque ("Low/High Plunge DMG"), 15 s, 1 uso. Soma com o Rainbow Crash. Ligue só nessa situação.',
      },
      {
        id: 'c4', label: 'Varesa C4 (Supremo +100%)', src: 'const4', scope: 'self', timed: true, stats: { byType: { burst: { p: 2 } } },
        expect: 'this instance of her Elemental Burst Guardian Vent! deals 100% increased DMG',
        note: '+100% de DMG do Supremo lançado com Fiery Passion ou Apex Drive: janela. Vale para todos os golpes de Supremo dela (Flying Kick e Volcano Kablam).',
      },
    ],
    Mitya: [
      {
        id: 'a1', label: 'Mitya A1 (Maestria por Beacon)', src: 'p1', scope: 'team', timed: true, stats: { em: { p: 0, x: 5 } },
        stacks: { max: 5, unit: 'Gradient Beacons', default: 0 },
        expect: 'gain 30 Elemental Mastery for each',
        note: '+30 de Maestria da equipe por Gradient Beacon que o Mitya tem, com o Detection Core em Steady State (25 s): ligue na janela e escolha os Beacons (até 5, o limite com o C1; o limite sem C1 não está no texto, respeite-o). Padrão 0.',
      },
      {
        id: 'a4', label: 'Mitya A4', src: 'p2', scope: 'self', timed: true, stats: { critRate: { p: 0, x: 4 } },
        stacks: { max: 4, unit: 'stacks de Taxa Crítica', default: 4 },
        expect: "Mitya's CRIT Rate increases by 5% for 15s",
        note: '+5% de Taxa Crítica por stack (até 4) por 15 s depois de criar um Gradient Beacon: ligue nas janelas e escolha os stacks.',
      },
      {
        id: 'c2res', label: 'Mitya C2 (RES do inimigo)', src: 'const2', scope: 'self', timed: true, resShred: { value: { p: 0 }, elements: ['Cryo', 'Electro'] },
        expect: 'have their Cryo RES and Electro RES decreased by 20%',
        note: 'RES Cryo e Electro -20% dos inimigos dentro do Polestar Field enquanto o Detection Core existe (25 s): janela de tempo, o usuário liga. Antes estava sempre ligado.',
      },
      {
        id: 'c2emo', label: 'Mitya C2 (Maestria, Overloaded)', src: 'const2', scope: 'team', timed: true, replaces: 'c2em', stats: { em: { p: 2 } },
        expect: 'Your active character gains 234 Elemental Mastery',
        note: 'Detection Core Overloaded: +234 de Maestria só para o personagem em campo (ligue a janela dele). Substitui o "Mitya C2 (Maestria)" do Steady State (123 para todos).',
      },
    ],
  },
  procs: {
    Clorinde: clorindeProcs,
    Ororon: ororonProcs,
    Valeriy: valeriyProcs,
  },
  notes: {
    Clorinde: {
      p1: x('Entra o dano fixo de 20% do ATK por stack (teto 1.800) nos Normais e no Last Lightfall, só Electro e sem janela de 15 s (escolha os stacks).'),
      p2: x('Entra a Taxa Crítica (janela). A conversão de 100% da cura em Bond of Life é só informativa.'),
      const2: x('Entra o A1 reforçado (30% do ATK por stack, teto 2.700). A resistência a interrupção não entra.'),
      const4: x('Entra o +2% por 1% de Bond of Life (escolha o %), janela do Supremo.'),
      const6: x('Entram +10% de Taxa e +70% de Dano Crítico por 12 s (janela) e o Glimbright Shade (200% do ATK, até 6). A redução de 80% do dano recebido e a resistência a interrupção não entram.'),
    },
    Ororon: {
      p1: x('Entra o Hypersense (160% do ATK, golpe extra, 1 alvo). Os pontos de Nightsoul e o alcance de até 4 inimigos não entram.'),
      p2: u('Só energia (informativo).'),
      p3: u('Só exploração.'),
      p4: u('Só velocidade de planar.'),
      const1: x('Entra o +50% do Hypersense em inimigo com Nighttide (golpe extra de 80% do ATK). Os 2 rebotes extras do Spirit Orb não entram: o texto não diz o dano de cada rebote. Pendente: rebotes extras.'),
      const2: x('Entra o +8% de DMG Electro por 9 s, com +8% por inimigo extra até 32% (janela).'),
      const4: u('Só energia e velocidade do Oculus.'),
      const6: x('Entram +10% de ATK por stack (até 3, janela) e o Hypersense extra do Supremo (320% do ATK). O Hypersense extra não soma o Nighttide.'),
    },
    Varesa: {
      p1: x('Entram os +50% (e os +180% em Fiery Passion) do ATK na onda de choque do Imersivo, pelo rótulo do golpe. O Plunge DMG do caminho não recebe.'),
      p3: u('Só exploração e Nightsoul.'),
      p4: u('Só velocidade de corrida e Phlogiston.'),
      const1: x('Entra o Rainbow Crash de 180% do ATK fora de Fiery Passion. Pendente: o Thunderous Tornado Eruption (Imersivo especial do Volcano Kablam) também recebe, mas não há golpe com esse rótulo no cadastro. A redução de 30% do gasto de Nightsoul é só utilidade.'),
      const2: u('Só energia (informativo), estado Apex Drive e resistência a interrupção.'),
      const4: x('Entram os +500% do ATK (teto 20.000) do Diligent Refinement e os +100% do Supremo (janelas/estado). Escolha o estado.'),
      const6: x('Entram +10% de Taxa e +100% de Dano Crítico no Imersivo e no Supremo. A energia (30) é informativa e a recarga de Nightsoul é utilidade.'),
    },
    Ineffa: {
      p4: u('Só tempero de comida.'),
      const2: x('Entra o Punishment Edict (300% do ATK como Lunar-Carregado). Os escudos (Optical Flow Shield Barrier) não entram.'),
      const4: u('Só energia (informativo).'),
    },
    Mitya: {
      p1: x('Entra a Maestria por Gradient Beacon no Steady State (você escolhe os Beacons). Os Beacons extras do estado Overloaded (1 a cada 1,5 s por 6 s) não entram.'),
      p4: u('Só limpar rochas e custo de energia do Kresnik.'),
      const1: x('Entra o +40% de Dano Crítico do personagem em campo (janela). O limite de 5 Beacons e a energia (informativo) não entram.'),
      const2: x('Entram a RES Cryo/Electro -20% (janela) e a Maestria (123 da equipe no Steady State, 234 do personagem em campo no Overloaded).'),
      const6: x('Entram os +15% do Detection Core em Steady State e o Estelar-Conduct elevado em 20%. A chance de 34% de criar um Gradient Beacon (Overloaded) não entra: chance.'),
    },
    Valeriy: {
      p1: u('Só acumula Impact Momentum.'),
      p2: x('Pendente: o Offensive Directive soma 0,3% do ATK por ponto de Impact Momentum (0,9% em Radiance: Stellar-Conduct), mas o texto do Lunaris não diz quantos pontos o golpe consome nem o dano base do efeito; não entra.'),
      p4: u('Só recompensa de expedição.'),
      const1: u('Só energia (informativo) e Impact Momentum extra.'),
      const2: x('Entram os +100 de Maestria da equipe por 18 s (janela). A absorção extra do escudo é só informativa.'),
      const4: u('Só limite de Impact Momentum.'),
      const6: x('Entram o +100% de dano do Direct-Fire Mortar e dos Thunderburst Shells (golpes extras de 100%), a Taxa Crítica Electro e o Dano Crítico Estelar-Conduct (buff existente, janela de 7 s).'),
    },
  },
  infos: {
    Clorinde: [
      { src: 'p2', kind: 'cura', label: 'Cura convertida em Bond of Life', text: 'No Night Vigil, {0%} da cura recebida vira Bond of Life', values: [{ p: 0 }], expect: 'the percent of healing converted to Bond of Life increases to 100%' },
    ] satisfies InfoCuration[],
    Ororon: [
      { src: 'p2', kind: 'energia', label: 'Energia do Aspect Sigil', text: '{0} de Energia ao personagem em campo (e a ele, se estiver fora) por Normal, Carregado ou Imersivo; no máximo uma vez a cada {1} s e {2} vezes em {3} s', values: [{ p: 1 }, { p: 3 }, { p: 4 }, { p: 0 }], expect: 'that character will restore 3 Energy' },
      { src: 'const4', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia depois do Dark Voices Echo', values: [{ p: 0 }], expect: 'Ororon will restore 8 Energy to himself' },
    ] satisfies InfoCuration[],
    Varesa: [
      { src: 'const2', kind: 'energia', label: 'Energia da onda de choque', text: '{0} de Energia quando a onda de choque do Imersivo acerta um inimigo', values: [{ p: 0 }], expect: 'Varesa will restore 11.5 Energy' },
      { src: 'const6', kind: 'energia', label: 'Energia ao entrar em Apex Drive', text: '{0} de Energia ao entrar em Apex Drive', values: [{ lit: 30 }], expect: 'Varesa restores 30 Energy when she enters Apex Drive' },
    ] satisfies InfoCuration[],
    Ineffa: [
      { src: 'const4', kind: 'energia', label: 'Energia do Lunar-Carregado', text: '{0} de Energia quando um aliado dispara Lunar-Carregado; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'recover 5 Elemental Energy' },
    ] satisfies InfoCuration[],
    Mitya: [
      { src: 'const1', kind: 'energia', label: 'Energia por Gradient Beacon', text: '{0} de Energia quando um Gradient Beacon é criado; no máximo uma vez a cada {1} s', values: [{ p: 1 }, { p: 2 }], expect: 'Mitya regenerates 10 Elemental Energy' },
    ] satisfies InfoCuration[],
    Valeriy: [
      { src: 'const1', kind: 'energia', label: 'Energia do Direct-Fire Mortar', text: '{0} de Energia depois do golpe especial, +{2} a cada 10 de Impact Momentum além de 40, até {1} por uso; uma vez a cada {3} s', values: [{ p: 0 }, { p: 1 }, { p: 2 }, { lit: 15 }], expect: 'Valeriy regenerates 6 Elemental Energy' },
      { src: 'const2', kind: 'escudo', label: 'Absorção extra do escudo', text: '+{0%} do ATK de absorção por ponto de Impact Momentum excedente, até {1} pontos', values: [{ p: 0 }, { p: 2 }], expect: "increases the Supercharged Shield's DMG Absorption by an amount equal to 8% of Valeriy's ATK" },
    ] satisfies InfoCuration[],
  },
};
