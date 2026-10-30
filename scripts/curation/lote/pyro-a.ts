/**
 * Lote Pyro A: Diluc, Amber, Xiangling, Klee, Xinyan, Hu Tao. Tudo conferido contra o Lunaris 7.1.53.
 * Correções: debuffs com duração (RES/DEF por N s) deixam de ser "sempre ligados" e viram janela; Hu Tao C2 passa a
 * valer só no Blood Blossom; Klee C1 ganha o golpe das faíscas.
 */
import type { NoteCuration, Src } from '../characters';
import type { Lote } from './index';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });

const notes: Record<string, Partial<Record<Src, NoteCuration | null>>> = {
  Diluc: { p3: u('Só reembolso de minério na forja.') },
  Amber: { p3: u('Só estamina de planar.') },
  Xiangling: { p3: u('Só culinária (chance de produto em dobro).') },
  Klee: {
    p2: u('Só energia (2 para o time, informativo).'),
    p3: u('Só exploração (recursos de Mondstadt no mapa).'),
    p4: x('Hexerei não está modelado: o Boom Badge (Boom-Boom Strike a 115%, 130% ou 150% do dano) e o Carregado especial não entram.'),
    const1: x('Entra o +60% de ATK por 12 s (janela) e o golpe das faíscas (120% do dano do Supremo). A chance de as faíscas ocorrerem não tem número no texto: o usuário decide quando lançá-las.'),
    const4: x('Entra a explosão de 555% do ATK. O dobro (+100%) com a Klee em campo não entra.'),
    const6: x('Entram os +50% de DMG Pyro dela e +10% dos outros Pyro, por 25 s (janela). A energia (3 a cada 3 s) é só informativa. Os efeitos Hexerei (50% de não gastar a Faísca, 40% de ataque extra) não entram.'),
  },
  Xinyan: {
    p3: u('Só culinária (chance de produto em dobro).'),
    const2: x('Taxa Crítica +100% só no dano Físico do Supremo (Skill DMG): o motor só aplica Taxa Crítica por tipo de golpe, e o Supremo inteiro inclui o Pyro DoT, que não recebe o bônus. Não entra.'),
    const6: x('ATK = 50% da DEF só nos Carregados: o motor não tem ATK por tipo de golpe (não cabe em dano fixo, que não é multiplicado pelo talento). Não entra; a estamina não muda o dano.'),
  },
  'Hu Tao': {
    p3: u('Só culinária (chance de prato extra).'),
    const6: x('Entra +100% de Taxa Crítica por 10 s (janela). A RES +200%, a imunidade a morte e a resistência a interrupção não mudam o dano.'),
  },
};

export const LOTE: Lote = {
  buffs: {
    Xiangling: [
      {
        id: 'c1', label: 'Xiangling C1', src: 'const1', scope: 'self', timed: true, resShred: { value: { p: 0 }, elements: ['Pyro'] },
        expect: 'Pyro RES reduced by 15%',
        note: 'RES Pyro do inimigo -15% por 6 s depois de ser atingido pelo Guoba: janela de tempo, o usuário liga e decide a duração.',
      },
    ],
    Klee: [
      {
        id: 'c2', label: 'Klee C2', src: 'const2', scope: 'self', timed: true, defShred: { lit: 0.23 },
        expect: 'DEF will be decreased by 23% for 10s',
        note: 'DEF do inimigo -23% por 10 s depois do golpe da habilidade (23% é literal do texto; o Lunaris traz 0): janela de tempo, o usuário liga e decide a duração.',
      },
    ],
    Xinyan: [
      {
        id: 'c4', label: 'Xinyan C4', src: 'const4', scope: 'self', timed: true, resShred: { value: { p: 0, x: -1 }, elements: ['Physical'] },
        expect: "decreases opponent's Physical RES by 15%",
        note: 'RES Física do inimigo -15% por 12 s depois do golpe da habilidade (Swing): janela de tempo, o usuário liga e decide a duração.',
      },
    ],
    'Hu Tao': [
      {
        id: 'c2', label: 'Hu Tao C2', src: 'const2', scope: 'self', timed: false,
        flat: [{ name: 'Blood Blossom por HP', sourceStat: 'HP', perPoint: { p: 0 }, hitTypes: ['skill'], labels: ['Blood Blossom DMG'] }],
        expect: "Increases the Blood Blossom DMG by an amount equal to 10% of Hu Tao's Max HP",
        note: 'Soma 10% do HP máximo a cada Blood Blossom (só esse golpe). Usa o HP final do build, não o do momento da aplicação. O Spirit Soother aplicar Blood Blossom não muda o número: adicione o Blood Blossom na rotação.',
      },
    ],
  },
  procs: {
    Klee: [
      {
        id: 'c1', label: 'Klee C1: faíscas', src: 'const1', scale: {},
        of: { talent: 'burst', label: "Sparks 'n' Splash DMG", fraction: { lit: 1.2 } },
        expect: "dealing DMG equal to 120% of Sparks 'n' Splash's DMG",
        note: "120% do dano de um golpe do Sparks 'n' Splash (conta como Supremo, nível do Supremo). A chance de ocorrer não tem número no texto: o usuário insere o golpe quando quiser.",
      },
    ],
  },
  notes,
  infos: {
    Klee: [
      { src: 'p2', kind: 'energia', label: 'Energia para o time', text: '{0} de Energia para todos quando o Carregado dá crítico', values: [{ lit: 2 }], expect: 'all party members gain 2 Elemental Energy' },
      { src: 'const6', kind: 'energia', label: 'Energia para os outros', text: '{0} de Energia para os outros a cada {1} s com o Supremo ativo', values: [{ lit: 3 }, { lit: 3 }], expect: 'regenerate 3 Energy for all members of the party' },
    ],
  },
};
