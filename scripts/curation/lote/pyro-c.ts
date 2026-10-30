/**
 * Lote Pyro C: Gaming, Arlecchino, Durin, Nicole, Aether (Pyro) e Lumine (Pyro). Tudo conferido contra o Lunaris 7.1.53.
 * Correções: Gaming A4/C6 estavam em "Imersivo" mas o Charmed Cloudstrider é golpe de habilidade no Lunaris; Durin A1/A4/C6
 * (debuff e janela de 20 s) deixam de ser "sempre ligados"; Nicole ganha o ATK do Grace of Kenosis (kit), o ATK dela mesma
 * (A4), o C2 para a equipe inteira e a RES por elemento; Viajante Pyro ganha o Carregado: Inferno e os +9% do C1.
 */
import type { BuffCuration, NoteCuration, Src } from '../characters';
import type { Element } from '../../../src/data/schema';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });

const ELEMENTS: Element[] = ['Pyro', 'Hydro', 'Electro', 'Cryo', 'Dendro', 'Anemo', 'Geo'];

/** Nicole C2: a RES que cai é a do elemento de quem tem o Guidance of Theosis; uma janela por elemento (o usuário liga a do elemento do time). */
const nicoleC2Res: BuffCuration[] = ELEMENTS.map((el) => ({
  id: `c2res-${el.toLowerCase()}`, label: `Nicole C2: RES ${el} do inimigo`, src: 'const2', scope: 'self', timed: true, resShred: { value: { p: 1 }, elements: [el] },
  expect: "decreases nearby opponents' Elemental RES",
  note: `RES ${el} do inimigo -25% enquanto o personagem ${el} tem o Guidance of Theosis (não soma duas vezes no mesmo elemento). Janela de tempo: ligue só a do elemento de quem está com o Guidance.`,
}));

/** Os dois Viajantes têm os mesmos textos Pyro (ids Lunaris 10000005_PYRO e 10000007_PYRO). */
const travelerBuffs: BuffCuration[] = [
  {
    id: 'c1', label: 'Viajante C1', src: 'const1', scope: 'team', timed: true, stats: { dmgPct: { lit: 0.06 } },
    expect: 'the current active character deals 6% increased DMG',
    note: '+6% de DMG do personagem em campo com o Blazing/Scorching Threshold ativo (6% é literal do texto; o Lunaris traz 0): ligue nas janelas. Os +9% extras em Nightsoul\'s Blessing estão no buff "Viajante C1 (Nightsoul)".',
  },
  {
    id: 'c1ns', label: 'Viajante C1 (Nightsoul)', src: 'const1', scope: 'team', timed: true, stats: { dmgPct: { lit: 0.09 } },
    expect: 'they will deal an additional 9% DMG',
    note: '+9% de DMG a mais, só para quem está em Nightsoul\'s Blessing (9% é literal do texto). Ligue só nas janelas em que o personagem em campo (Mavuika, Citlali...) está nesse estado; a janela vale para todos que a recebem.',
  },
  {
    id: 'a4inferno', label: 'Viajante A4 (Carregado: Inferno)', src: 'p3', scope: 'self', timed: false,
    flat: [{ name: 'Charged Attack: Inferno por ATK (A4)', sourceStat: 'ATK', perPoint: { p: 7 }, hitTypes: ['charged'], labels: ['Charged Attack DMG'], stacks: 2 }],
    expect: "Increase in DMG is equal to 200% of Traveler's ATK",
    note: 'Soma 200% do ATK ao dano base de CADA um dos 2 acertos do Carregado, uma vez a cada 15 s (precisa de 2 stacks de Blade of the Sacred Flame, dados pelos Nightsoul Burst dos aliados). Entra nos 2 primeiros acertos de Carregado da rotação (1 Inferno); para mais Infernos, aumente os stacks do efeito.',
  },
];

const travelerNotes: Partial<Record<Src, NoteCuration>> = {
  p3: x('Entra o Carregado: Inferno (+200% do ATK por acerto, 1 vez a cada 15 s). Os buffs "para cada elemento ressonado" (Pyro +20% de ATK, Cryo +20% de Dano Crítico etc.) não entram: o texto não diz quais ressonâncias contam nem como o time as define.'),
  const1: x('Entram +6% e +9% (Nightsoul\'s Blessing) de DMG do personagem em campo, como janelas.'),
  const4: x('+20% de DMG Pyro por 9 s depois do Supremo, como janela.'),
  const6: x('+40% de Dano Crítico de Normal, Carregado e Imersivo em Nightsoul\'s Blessing, como janela. A conversão para Pyro já é o padrão do cálculo.'),
};

export const LOTE: Lote = {
  buffs: {
    Gaming: [
      {
        id: 'a4', label: 'Gaming A4', src: 'p2', scope: 'self', timed: true, stats: { byType: { skill: { p: 2 } } },
        expect: 'Plunging Attack: Charmed Cloudstrider will deal 20% more DMG',
        note: '+20% de DMG do Charmed Cloudstrider com HP de 50% ou mais: ligue nas janelas. No Lunaris esse golpe é de habilidade (o único golpe de habilidade dele), então o bônus vai em "habilidade" e não em Imersivo; o Imersivo comum não recebe.',
      },
      {
        id: 'c6', label: 'Gaming C6', src: 'const6', scope: 'self', timed: false, stats: { critRateByType: { skill: { p: 0 } }, critDmgByType: { skill: { p: 1 } } },
        expect: 'CRIT Rate increased by 20% and CRIT DMG increased by 40%',
        note: '+20% de Taxa e +40% de Dano Crítico do Charmed Cloudstrider, sempre (é o único golpe de habilidade dele no Lunaris). O Imersivo comum não recebe. O raio maior não muda o dano.',
      },
    ],
    Durin: [
      {
        id: 'a1', label: 'Durin A1', src: 'p1', scope: 'self', timed: true, resShred: { value: { p: 0 }, elements: ['Pyro'] },
        expect: 'Pyro RES, and the RES for the corresponding Element involved in the reaction, are decreased by 20%',
        note: 'RES Pyro do inimigo -20% por 6 s depois de uma reação Pyro ou de dano Pyro/Dendro em inimigo com Burning (forma Dragão da Chama Branca, 20 s): janela de tempo, o usuário liga e decide a duração. A RES do elemento da reação (Dendro, Electro...) não entra. Com 2 Hexerei, veja "Durin A1 (Hexerei)".',
      },
      {
        id: 'a1hex', label: 'Durin A1 (Hexerei)', src: 'p4', scope: 'self', timed: true, replaces: 'a1', team: { hexerei: 2 }, resShred: { value: { lit: 0.35 }, elements: ['Pyro'] },
        expect: 'except for Duration) by 75%',
        note: 'Hexerei: Secret Rite (2 ou mais Hexerei no time, marque o Durin como Hexerei) aumenta o A1 em 75%: 20% x 1,75 = 35% (conta feita com os dois números do texto). Substitui o "Durin A1" comum. Janela de tempo, igual ao A1. O +75% do Vaporizar/Derreter da forma Dark Decay não cabe no formato.',
      },
      {
        id: 'a4', label: 'Durin A4', src: 'p2', scope: 'self', timed: true, convert: { from: 'atk', perPoint: { p: 0, x: 0.01 }, cap: { p: 1 }, to: ['burst'] },
        expect: 'increase the DMG dealt by 3% of the original DMG for every 100 ATK',
        note: 'Aproximação: +3% de DMG do Supremo por 100 de ATK, até 75% (assume os 10 stacks), durante os 20 s depois do Supremo: ligue a janela. No jogo vale só para os ataques periódicos do dragão, 1 stack por ataque (10 no total), e é "% do dano original"; aqui entra como DMG% do Supremo inteiro, então ligue só sobre os golpes do dragão.',
      },
      {
        id: 'c6def', label: 'Durin C6 (DEF do inimigo)', src: 'const6', scope: 'self', timed: true, defShred: { p: 1 },
        expect: "that opponent's DEF is decreased by 30% for 6s",
        note: 'DEF do inimigo -30% por 6 s depois que o Principle of Purity e o Dragon of White Flame acertam: janela de tempo, o usuário liga e decide a duração.',
      },
    ],
    Nicole: [
      {
        id: 'graca', label: 'Nicole: Grace of Kenosis (ATK)', src: 'kit', scope: 'team', timed: true,
        kit: { talent: 'skill', key: 'Grace of Kenosis ATK Bonus Ratio', capKey: 'Grace of Kenosis Max ATK Bonus' },
        convert: { from: 'atk', perPoint: { lit: 1 }, to: ['atkFlat'] },
        expect: 'This increases their ATK and deals AoE Pyro DMG',
        note: 'ATK fixo = % do ATK da Nicole por nível da habilidade (8,25% no nível 1 a 19,5% no 15), com teto por nível (330 a 780), por 20 s depois da habilidade. Vale para o time inteiro, inclusive ela (o A4 dela fala do Grace dela mesma). Os +300 do Guidance (A1) e do C2 ficam fora do teto e são buffs à parte.',
      },
      {
        id: 'a1', label: 'Nicole A1', src: 'p1', scope: 'others', timed: true, stats: { atkFlat: { p: 2 } },
        expect: 'increasing their ATK by an additional 300',
        note: '+300 de ATK dos aliados observados, depois de 3 s em campo (Guidance of Theosis), por 20 s depois da habilidade: ligue na janela. Aliado Hexerei recebe na hora.',
      },
      {
        id: 'c2', label: 'Nicole C2', src: 'const2', scope: 'team', timed: true, stats: { atkFlat: { p: 0 } },
        expect: 'increases ATK by an additional 300',
        note: '+300 de ATK extra do Grace of Kenosis (fora do limite do bônus) para o time inteiro, inclusive a Nicole: ligue na janela. A RES do inimigo está nos buffs "Nicole C2: RES <elemento>"; o escudo não entra.',
      },
      ...nicoleC2Res,
    ],
    'Aether (Pyro)': travelerBuffs,
    'Lumine (Pyro)': travelerBuffs,
  },
  notes: {
    Gaming: {
      p1: u('Só cura (informativo).'),
      p2: x('Entra o +20% de DMG do Charmed Cloudstrider com HP de 50% ou mais; a cura recebida +20% abaixo de 50% de HP é só informativa.'),
      p3: u('Só velocidade de movimento de dia.'),
      const1: u('Só cura (informativo).'),
      const4: u('Só energia (informativo).'),
    },
    Arlecchino: {
      p1: u('Só Bond of Life e cura.'),
      p2: u('Só RES própria (defesa), sem efeito no dano.'),
      const1: x('O aumento do Masque of the Red Death (+100% do ATK dos Normais) não entra: o dano extra dos Normais depende da % de Bond of Life no momento.'),
      const2: x('Entra o golpe de 900% do ATK (a cada 10 s). A RES +20% por 15 s não muda o dano.'),
      const4: u('Só recarga e energia (informativo).'),
      const6: x('Entram +10% de Taxa e +70% de Dano Crítico de Normal e Supremo por 20 s (janela). O dano extra do Balemoon Rising (ATK x 700% da % de Bond of Life) não entra: depende da % de Bond of Life no momento.'),
    },
    Durin: {
      p1: x('Entra a RES Pyro -20% (janela, 35% com Hexerei). Não entram a RES do elemento da reação nem o +40% (70% com Hexerei) de Vaporizar/Derreter da forma Dark Decay: o formato dos buffs não tem bônus de Vaporizar/Derreter.'),
      p2: x('Entra como DMG% do Supremo (aproximação, janela de 20 s): no jogo só os ataques periódicos do dragão recebem, 1 stack cada, e o bônus é "% do dano original".'),
      p3: u('Só recompensa de expedição.'),
      p4: x('Entra o +75% do A1 (RES Pyro 35%) com 2 Hexerei. O +75% do Vaporizar/Derreter não entra.'),
      const1: x('Entram os stacks de Cycle of Enlightenment (60% do ATK dele nos 20 primeiros golpes dos aliados; 150% nos 10 primeiros Supremos dele). O limite de 20 s e os stacks individuais por aliado são simplificados.'),
      const2: x('Entra +50% de DMG Pyro da equipe Pyro por 6 s (janela). O bônus do elemento da reação (Hydro, Dendro...) não entra.'),
      const4: x('Entra o +40% de DMG do Supremo. A chance de 30% de não gastar stacks do C1 não entra.'),
      const6: x('Entram: ignora 30% da DEF no Supremo (janela), -30% de DEF do inimigo por 6 s (janela) e +40% de DEF ignorada no Principle of Darkness e no Dragon of Dark Decay (janela).'),
    },
    Nicole: {
      p1: x('Entram +300 de ATK dos aliados observados (janela). O tempo de observação (3 s) e o Hexerei imediato dependem de você ligar a janela no instante certo.'),
      p2: x('Pendente: o A4 faz o Grace dela virar Guidance of Theosis por 8 s, mas o texto não diz o ATK que ela mesma ganha; não entra.'),
      p3: u('Só exploração (Treasure Compass).'),
      p4: x('Hexerei: Secret Rite (+300% do ATK da Nicole nas Arcane Projections dos Hexerei) não entra: a Arcane Projection é golpe de outro personagem com o ATK dele.'),
      const1: x('A Arcane Projection: Unity (600% do ATK do personagem ativo, a cada 6 s) não entra: o golpe usa o ATK de outro personagem, não o da Nicole.'),
      const2: x('Entram +300 de ATK do Grace (time) e a RES do inimigo -25% por elemento (janelas). O escudo de Blazing Light não entra.'),
      const4: x('Entra o dano fixo de 70% do ATK da Nicole nos 8 primeiros golpes da equipe. O consumo por inimigo atingido e as cargas separadas por personagem são simplificados.'),
      const6: x('Entra ignorar 40% da DEF de quem tem o Guidance (janela). A troca permanente de Grace por Guidance é você ligar os +300 do A1 para todos.'),
    },
    'Aether (Pyro)': travelerNotes,
    'Lumine (Pyro)': travelerNotes,
  },
  infos: {
    Gaming: [
      { src: 'p1', kind: 'cura', label: 'Cura do Dance of Amity', text: 'Recupera {0%} do HP máximo a cada 0,2 s por 0,8 s depois que o Charmed Cloudstrider acerta', values: [{ p: 1 }], expect: 'will regain 1.5% of his Max HP' },
      { src: 'p2', kind: 'cura', label: 'Cura recebida com HP baixo', text: '+{0%} de cura recebida com menos de 50% de HP', values: [{ p: 1 }], expect: 'he will receive a 20% Incoming Healing Bonus' },
      { src: 'const1', kind: 'cura', label: 'Cura do Suanni Man Chai', text: 'Cura {0%} do HP quando o Man Chai volta a ele', values: [{ p: 0 }], expect: 'it will heal 15% of Gaming' },
      { src: 'const4', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia quando o Charmed Cloudstrider acerta; no máximo uma vez a cada 0,2 s', values: [{ p: 0 }], expect: 'it will restore 2 Energy to Gaming' },
    ] satisfies InfoCuration[],
    Arlecchino: [
      { src: 'const4', kind: 'recarga', label: 'Recarga do Balemoon Rising', text: 'cai {0} s ao absorver uma Directive; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 2 }], expect: "CD will decrease by 2s" },
      { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia ao absorver uma Directive; no máximo uma vez a cada {1} s', values: [{ p: 1 }, { p: 2 }], expect: '15 Elemental Energy will be restored' },
    ] satisfies InfoCuration[],
  },
};
