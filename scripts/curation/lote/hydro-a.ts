/**
 * Lote Hydro A: Barbara, Xingqiu, Tartaglia, Mona, Sangonomiya Kokomi, Yelan. Cada número foi conferido contra o Lunaris 7.1.53.
 * Correções em relação à curadoria antiga: Xingqiu C2 (RES de 4 s era permanente), Mona C4 (Taxa Crítica lida com truque de
 * sinal; agora direto de p1) e C4 Hexerei (+15% de Dano Crítico, faltava), Mona C6 (stacks por segundo explícitos), Mona C1
 * (o 3º bônus lia o parâmetro do Redemoinho; o valor é o mesmo 15%, agora literal do texto), Kokomi A4 (Taxa Crítica -100%
 * faltava), Yelan A4 (valia sempre os 50% do teto; agora o usuário escolhe os segundos, 1% + 3,5% por segundo).
 */
import type { BuffCuration, NoteCuration } from '../characters';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const x = (note: string): NoteCuration => ({ kind: 'partial', note });

// Yelan A4: 1% no início e +3,5% por segundo, teto de 50% (15 valores: 0 a 14 s). O texto dá 1%, 3,5%, o teto de 50% e os 14 s.
const yelanA4Levels = Array.from({ length: 15 }, (_, k) => ({ lit: Math.round((0.01 + 0.035 * k) * 1000) / 1000 }));

const buffs: Record<string, BuffCuration[]> = {
  Xingqiu: [
    {
      id: 'c2', label: 'Xingqiu C2', src: 'const2', scope: 'self', timed: true, resShred: { value: { lit: 0.15 }, elements: ['Hydro'] },
      expect: 'Decreases the Hydro RES of opponents hit by sword rain attacks by 15% for 4s',
      note: 'RES Hydro do inimigo -15% por 4 s depois de ser atingido pela chuva de espadas do Supremo: janela de tempo (antes estava sempre ligado). Os +3 s de duração do Supremo não entram no dano.',
    },
  ],
  Mona: [
    {
      id: 'c1', label: 'Mona C1 (reações)', src: 'const1', scope: 'team', timed: true,
      stats: { reactionBonus: { electrocharged: { p: 0 }, lunarcharged: { p: 1 }, lunarcrystallize: { lit: 0.15 } } },
      expect: 'Electro-Charged DMG increases by 15%, Lunar-Charged DMG increases by 15%',
      note: '+15% de Eletrocarregado, Lunar-Carregado e Lunar-Cristalizar por 8 s depois que um aliado acerta inimigo com Presságio: ligue a janela. Pendente: Vaporizar (o formato não tem bônus de Vaporizar) e Redemoinho Hydro (o bônus de Redemoinho do motor vale para todo elemento) não entram; o reforço para 160% quando quem aciona está fora de campo também não.',
    },
    {
      id: 'c4', label: 'Mona C4', src: 'const4', scope: 'team', timed: true, stats: { critRate: { p: 1 } },
      expect: 'their CRIT Rate is increased by 15%',
      note: '+15% de Taxa Crítica de qualquer personagem do time que ataca um inimigo com Presságio (4 s depois do Supremo): ligue a janela. O +15% de Dano Crítico dos Hexerei está em "Mona C4 (Hexerei)".',
    },
    {
      id: 'c4h', label: 'Mona C4 (Hexerei)', src: 'const4', scope: 'team', timed: true, forFactions: ['hexerei'], stats: { critDmg: { p: 1 } },
      expect: 'their CRIT DMG is increased by 15%',
      note: '+15% de Dano Crítico só dos membros Hexerei (marque-os como Hexerei na página do personagem) que atacam inimigo com Presságio: ligue a janela junto com o C4.',
    },
    {
      id: 'c6', label: 'Mona C6', src: 'const6', scope: 'self', timed: true, stats: { byType: { charged: { p: 1, x: 3 } } },
      stacks: { max: 3, unit: 's de acúmulo', default: 3 },
      expect: 'A maximum DMG Bonus of 180% can be achieved in this manner',
      note: '+60% de DMG do próximo Carregado por segundo, até 180% (3 s, o teto do texto), por no máximo 8 s: ligue a janela e escolha os segundos de 0 a 3. Pendente: o aumento do Carregado para 200% do dano original contra inimigo com Presságio não entra (o texto não diz se multiplica o dano final ou só a base).',
    },
  ],
  'Sangonomiya Kokomi': [
    {
      id: 'p4', label: 'Kokomi A4 (Taxa Crítica)', src: 'p4', scope: 'self', timed: false, stats: { critRate: { lit: -1 } },
      expect: 'a 100% decrease in CRIT Rate',
      note: 'Taxa Crítica -100%: com a Taxa Crítica da build limitada a no mínimo 0, ela não critica. O Bônus de Cura de 25% é só informativo.',
    },
  ],
  Yelan: [
    {
      id: 'a4', label: 'Yelan A4', src: 'p2', scope: 'team', timed: true, stats: { dmgPct: { lit: 0.5 } },
      stacks: { max: 15, unit: 's (1 = início, 1%)', default: 15, levels: yelanA4Levels },
      expect: 'This increases by a further 3.5% DMG every second. The maximum increase to DMG dealt is 50%',
      note: '+1% de DMG do personagem em campo, subindo 3,5% por segundo até 50% (14 s depois): ligue a janela e escolha o ponto de 1 (início, 1%) a 15 (50%). Vale para todo golpe do personagem, de qualquer elemento.',
    },
  ],
};

const infos: Record<string, InfoCuration[]> = {
  Barbara: [
    { src: 'const1', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia a cada {1} s', values: [{ lit: 1 }, { lit: 10 }], expect: 'Barbara regenerates 1 Energy every 10s' },
    { src: 'const2', kind: 'recarga', label: 'Recarga do Let the Show Begin', text: 'a recarga cai {0%}', values: [{ lit: 0.15 }], expect: 'Decreases the CD of Let the Show Begin♪ by 15%' },
    { src: 'const4', kind: 'energia', label: 'Energia do Carregado', text: '{0} de Energia por inimigo atingido pelo Carregado; no máximo {1} por golpe', values: [{ lit: 1 }, { lit: 5 }], expect: 'regenerates 1 Energy for her' },
  ],
  Xingqiu: [
    { src: 'p1', kind: 'cura', label: 'Cura da espada de chuva', text: 'Recupera {0%} do HP máximo dele ao personagem atual quando a espada de chuva quebra ou acaba', values: [{ lit: 0.06 }], expect: "based on 6% of Xingqiu's Max HP" },
    { src: 'const6', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia quando a terceira chuva de espadas reforçada acerta', values: [{ lit: 3 }], expect: 'regenerates 3 Energy for Xingqiu' },
  ],
  Tartaglia: [
    { src: 'const1', kind: 'recarga', label: 'Recarga do Foul Legacy: Raging Tide', text: 'a recarga cai {0%}', values: [{ lit: 0.2 }], expect: 'Decreases the CD of Foul Legacy: Raging Tide by 20%' },
    { src: 'const2', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia quando derrota um inimigo com Maré', values: [{ p: 0 }], expect: 'Tartaglia regenerates 4 Elemental Energy' },
  ],
  'Sangonomiya Kokomi': [
    { src: 'p4', kind: 'cura', label: 'Bônus de Cura', text: 'Bônus de Cura de {0%}', values: [{ lit: 0.25 }], expect: '25% Healing Bonus' },
    { src: 'const2', kind: 'cura', label: 'Bônus de Cura em quem está com pouco HP', text: 'Para quem está com {0%} de HP ou menos: Bake-Kurage {1%} e Normal/Carregado {2%} do HP máximo dela', values: [{ p: 0 }, { p: 1 }, { p: 2 }], expect: 'Healing Bonuses with regard to characters with 50% or less HP' },
    { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia por Normal que acerta; no máximo uma vez a cada {1} s', values: [{ p: 1 }, { lit: 0.2 }], expect: 'will restore 0.8 Energy for her' },
  ],
};

export const LOTE: Lote = {
  buffs,
  infos,
  notes: {
    Xingqiu: {
      const6: x('Pendente: o texto diz que a terceira chuva de espadas fica "muito mais forte" sem dar o número, então o aumento de dano não entra. A Energia (3) é só informativa.'),
    },
    Tartaglia: {
      p3: x('Pendente: +1 nível de Ataque Normal dos aliados muda o dano deles, mas o formato só soma nível de talento pelas constelações do próprio personagem; não entra.'),
      const4: x('Pendente: o Riptide Slash (estilo Corpo a Corpo, conta como habilidade) e o Riptide Flash (estilo Distância, conta como Normal) a cada 4 s já existem no kit dele; adicione as execuções na rotação conforme a duração. Nada é automático.'),
    },
    Mona: {
      const1: x('Entram Eletrocarregado, Lunar-Carregado e Lunar-Cristalizar +15% (janela). Pendente: Vaporizar, Redemoinho Hydro e o reforço para 160% fora de campo não entram.'),
      const6: x('Entra o +60% por segundo de DMG do Carregado, até 180% (stacks). Pendente: o aumento para 200% do dano original contra Presságio não entra.'),
      p4: x('Pendente: os stacks de Astral Glow of Mercury aumentam em 5% cada o Vaporizar de OUTRO aliado, e o formato não tem bônus de Vaporizar. Só a extensão do Presságio (+2 s) é utilidade.'),
    },
    'Sangonomiya Kokomi': {
      p2: x('Pendente: o dano extra de Normal e Carregado por 15% do Bônus de Cura não entra, porque o motor não tem o stat Bônus de Cura (nem o 25% do A4, nem o do artefato).'),
      p4: x('Entra a Taxa Crítica -100%. O Bônus de Cura de 25% é só informativo.'),
    },
  },
};
