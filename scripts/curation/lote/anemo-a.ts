/**
 * Lote Anemo A: Jean, Venti, Xiao, Sucrose, Kaedehara Kazuha, Sayu. Cada número foi conferido contra o texto do Lunaris 7.1.53.
 * Correções em relação à curadoria antiga: Jean C4, Venti C2 e Venti C6 (RES do inimigo por tempo limitado eram "sempre ligados"
 * e agora são janelas); Xiao A1 e A4 (assumiam o teto fixo; agora têm stacks escolhidos); Sayu C2 (o +66% é de 20 níveis de 3,3%,
 * agora com stacks); Venti C1 (o golpe extra não era Carregado e agora é). Novos: Sucrose Hexerei (p4) e Sucrose C6 extra
 * dos Hexerei. Não entram: Venti C2 "Wherever a Breeze Blows" (300%), Venti p4 (Hexerei) e o dano do Daruma da Sayu C6.
 */
import type { BuffCuration, NoteCuration, ProcCuration } from '../characters';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const x = (note: string): NoteCuration => ({ kind: 'partial', note });

const buffs: Record<string, BuffCuration[]> = {
  Jean: [
    {
      id: 'c4', label: 'Jean C4', src: 'const4', scope: 'self', timed: true, resShred: { value: { p: 0 }, elements: ['Anemo'] },
      expect: 'all opponents have their Anemo RES decreased by 40%',
      note: 'RES Anemo do inimigo -40% enquanto ele estiver dentro do campo do Supremo (o campo dura 10 s): janela de tempo (antes estava sempre ligado).',
    },
  ],
  Venti: [
    {
      id: 'c2', label: 'Venti C2', src: 'const2', scope: 'self', timed: true, resShred: { value: { lit: 0.24 }, elements: ['Anemo', 'Physical'] },
      expect: "decreases opponents' Anemo RES and Physical RES by 24% for 10s",
      note: 'RES Anemo e Física do inimigo -24% por 10 s depois da habilidade (24% é literal do texto): janela de tempo (antes estava sempre ligado). O "Wherever a Breeze Blows" (300% do dano do Press) não entra.',
    },
    {
      id: 'c6', label: 'Venti C6', src: 'const6', scope: 'self', timed: true, resShred: { value: { lit: 0.2 }, elements: ['Anemo'] },
      expect: 'Anemo RES decreased by 20%',
      note: 'RES Anemo do inimigo -20% (20% é literal do texto) para os alvos que levam dano do Supremo: janela de tempo (antes estava sempre ligado). A RES do elemento absorvido não entra. Os +100% de Dano Crítico estão em "Venti C6 (Dano Crítico)".',
    },
  ],
  Xiao: [
    {
      id: 'a1', label: 'Xiao A1', src: 'p1', scope: 'self', timed: true, stats: { dmgPct: { p: 0, x: 5 } },
      stacks: { max: 5, unit: 'degraus de 5% (o 1º no início, mais um a cada 3 s)', default: 5 },
      expect: 'DMG increases by a further 5% for every 3s the ability persists',
      note: '+5% de DMG ao ativar o Supremo e +5% a cada 3 s, teto de 25% (5 degraus, 12 s): ligue a janela e escolha os degraus de 0 a 5 (o padrão é o teto).',
    },
    {
      id: 'a4', label: 'Xiao A4', src: 'p2', scope: 'self', timed: true, stats: { byType: { skill: { p: 1, x: 3 } } },
      stacks: { max: 3, unit: 'stacks do Lemniscatic Wind Cycling', default: 3 },
      expect: 'increases the DMG of subsequent uses of Lemniscatic Wind Cycling by 15%',
      note: '+15% de DMG da habilidade por stack (cada uso dá um stack ao seguinte), até 3 stacks (+45%), por 7 s: ligue a janela e escolha os stacks de 0 a 3 (o padrão é o teto).',
    },
  ],
  Sucrose: [
    {
      id: 'p4s', label: 'Sucrose Hexerei (espírito pequeno)', src: 'p4', scope: 'team', timed: true, team: { hexerei: 2 },
      stats: { byType: { normal: { p: 1 }, charged: { p: 1 }, plunge: { p: 1 }, skill: { p: 1 }, burst: { p: 1 } } },
      expect: "nearby party members' Normal Attack, Charged Attack, Plunging Attack, Elemental Skill, and Elemental Burst DMG are increased by 5.71428% for 15s",
      note: 'Hexerei: Secret Rite (2 ou mais Hexerei no time, marque a Sucrose como Hexerei): +5,71428% de DMG de Normal, Carregado, Imersivo, habilidade e Supremo da equipe por 15 s depois que ela cria um Small Wind Spirit: ligue a janela.',
    },
    {
      id: 'p4l', label: 'Sucrose Hexerei (espírito grande)', src: 'p4', scope: 'team', timed: true, team: { hexerei: 2 }, forFactions: ['hexerei'],
      stats: { byType: { normal: { p: 3 }, charged: { p: 3 }, plunge: { p: 3 }, skill: { p: 3 }, burst: { p: 3 } } },
      expect: "nearby Hexerei party members' Normal Attack, Charged Attack, Plunging Attack, Elemental Skill, and Elemental Burst DMG are increased by 7.14285% for 20s",
      note: 'Hexerei: Secret Rite (2 ou mais Hexerei no time): +7,14285% de DMG de Normal, Carregado, Imersivo, habilidade e Supremo, só dos membros Hexerei, por 20 s depois que ela cria um Large Wind Spirit: ligue a janela. Se o espírito pequeno também estiver ligado, os dois somam (o texto não os faz substituir um ao outro).',
    },
    {
      id: 'c6hex', label: 'Sucrose C6 (Hexerei)', src: 'const6', scope: 'team', timed: true, forFactions: ['hexerei'], stats: { dmgPct: { p: 1 } },
      expect: 'nearby Hexerei characters in the party gain an additional 8.57142% Elemental DMG Bonus',
      note: '+8,57142% de DMG do elemento absorvido, além dos 20% do C6, só dos membros Hexerei durante o Supremo: ligue junto com o C6 nas janelas em que o elemento bate com o de quem ataca. O texto não pede 2 Hexerei no time para este extra.',
    },
  ],
  Sayu: [
    {
      id: 'c2', label: 'Sayu C2', src: 'const2', scope: 'self', timed: true, stats: { byType: { skill: { p: 0, x: 20 } } },
      stacks: { max: 20, unit: 'degraus de 3,3% (Press = 1; Hold +1 a cada 0,5 s)', default: 20 },
      expect: 'The maximum DMG increase possible through this method is 66%',
      note: '+3,3% de DMG do Fuufuu Whirlwind Kick (Press: 1 degrau; Hold: +1 degrau a cada 0,5 s no Windwheel), teto de 66% (20 degraus). O formato dá o bônus à habilidade inteira: ligue a janela só nas ações do Whirlwind Kick (o Windwheel e os golpes elementais não recebem no jogo).',
    },
  ],
};

const procs: Record<string, ProcCuration[]> = {
  Venti: [
    {
      id: 'c1', label: 'Venti C1: flecha extra', src: 'const1', scale: {}, hitType: 'charged',
      of: { talent: 'normal', label: 'Fully-Charged Aimed Shot', fraction: { lit: 0.33 } },
      expect: "each dealing 33% of the original arrow's DMG",
      note: '33% do Tiro Mirado Carregado por flecha extra (33% é literal do texto); são 2 por tiro (use 2 execuções). Conta como Carregado. As flechas extras do Tiro Mirado sem carga e as do Windsunder Arrow (20%) não entram.',
    },
  ],
};

const infos: Record<string, InfoCuration[]> = {
  Jean: [
    { src: 'p1', kind: 'cura', label: 'Cura dos Normais', text: '{0%} de chance de curar {1%} do ATK dela em todo o grupo a cada Normal que acerta', values: [{ p: 0 }, { p: 1 }], expect: "have a 50% chance to regenerate HP equal to 15% of Jean's ATK" },
    { src: 'p2', kind: 'energia', label: 'Energia do Dandelion Breeze', text: '{0} de Energia (20% do custo) ao usar o Dandelion Breeze', values: [{ p: 0 }], expect: 'will regenerate 20% of its Energy' },
  ],
  Venti: [
    { src: 'p2', kind: 'energia', label: 'Energia depois do Supremo', text: '{0} de Energia para ele quando o Wind\'s Grand Ode termina; com absorção, {1} para os personagens do elemento absorvido', values: [{ p: 0 }, { p: 1 }], expect: 'Regenerates 15 Energy for Venti' },
  ],
  Sucrose: [
    { src: 'const4', kind: 'recarga', label: 'Recarga da habilidade', text: 'a recarga da habilidade cai de 1 a 7 s a cada {0} acertos de Normal ou Carregado', values: [{ lit: 7 }], expect: 'reduce the CD of' },
  ],
  'Kaedehara Kazuha': [
    { src: 'const4', kind: 'energia', label: 'Energia que ele recupera', text: 'Com menos de 45 de Energia: {0} (Press) ou {1} (Hold) de Energia pela habilidade e {2} por segundo planando', values: [{ p: 0 }, { p: 1 }, { p: 2 }], expect: 'regenerates 3 or 4 Energy' },
  ],
  Sayu: [
    { src: 'p1', kind: 'cura', label: 'Cura do Espalhar', text: 'Ao causar Espalhar em campo, cura {0} PV de todos mais {1} PV por ponto de Maestria dela; no máximo uma vez a cada {2} s', values: [{ p: 0 }, { p: 1 }, { p: 2 }], expect: 'she heals all your characters and nearby allies for 300 HP' },
    { src: 'p2', kind: 'cura', label: 'Cura em área do Daruma', text: 'O Daruma cura também os personagens ao redor com {0%} da cura', values: [{ p: 0 }], expect: 'for 20% the amount of HP' },
    { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia ao causar Espalhar em campo; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'Sayu recovers 1.2 Energy' },
    { src: 'const6', kind: 'cura', label: 'Cura extra do Daruma', text: 'O Daruma cura +{0} PV por ponto de Maestria dela, até {1} PV a mais', values: [{ p: 2 }, { p: 3 }], expect: 'Increases the HP restored by the Muji-Muji Daruma by 3' },
  ],
};

export const LOTE: Lote = {
  buffs,
  procs,
  infos,
  notes: {
    Venti: {
      const1: x('Entram as 2 flechas extras do Tiro Mirado Carregado (golpe extra). Pendente: as do Tiro Mirado sem carga (Físico, o texto não diz o elemento) e as do Windsunder Arrow (20%, golpe não cadastrado) não entram.'),
      const2: x('Entra a RES Anemo e Física -24% por 10 s (janela). Pendente: o "Wherever a Breeze Blows" diz "300% of the original amount of DMG" no Press e não deixa claro se é 3x o total ou +300%.'),
      p4: x('Pendente: Hexerei (+50% de DMG por 4 s depois de Espalhar e Stormeye a 135%). O texto não diz se quem ganha os 50% precisa ser Hexerei, e o "135% do dano original" do Stormeye não tem um parâmetro de bônus.'),
    },
    Sayu: {
      const2: x('Entra o +3,3% por degrau (até 66%) em janela. O formato aplica à habilidade inteira, e no jogo só o Whirlwind Kick recebe: ligue só nas ações dele.'),
      const6: x('Pendente: o dano extra do Daruma (0,2% do ATK por ponto de Maestria, até 400% do ATK) não entra: o formato não multiplica o ATK pela Maestria. A cura extra é só informativa.'),
    },
  },
};
