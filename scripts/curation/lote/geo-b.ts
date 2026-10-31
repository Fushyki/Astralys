/**
 * Lote Geo B: Yun Jin, Navia, Chiori, Kachina, Xilonen, Zibai. Tudo conferido contra o Lunaris 7.1.53.
 * Sem mudança (conferidos): Yun Jin A4/C2/C4, Navia A1/A2/C2/C6 e o Cannon Fire Support do C2, Chiori A1/A2/C2/C4/C6,
 * Kachina A1/C6, Xilonen A1/A4/C2/C4, Zibai A4/C2/C4 e a base Lunar-Cristalizar do P3.
 * Correções: Navia C4 (RES Geo -20% por 8 s estava sempre ligada; agora janela), Kachina C4 (a DEF vai para o personagem ativo
 * dentro do campo, não só para ela: escopo equipe), Kachina A4 (rótulos exatos), Xilonen C6 (300% é o parâmetro p1, não literal),
 * Zibai C6 (o teto de 100 pontos não está no texto: marcado como hipótese).
 */
import type { BuffCuration, NoteCuration } from '../characters';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const x = (note: string): NoteCuration => ({ kind: 'partial', note });

const buffs: Record<string, BuffCuration[]> = {
  Navia: [
    {
      id: 'c4', label: 'Navia C4', src: 'const4', scope: 'self', timed: true, resShred: { value: { p: 0 }, elements: ['Geo'] },
      expect: 'that opponent\'s Geo RES will be decreased by 20% for 8s',
      note: 'RES Geo do inimigo -20% por 8 s depois do Singing Salute acertar: janela de tempo, o usuário liga e decide a duração (antes estava sempre ligado).',
    },
  ],
  Kachina: [
    {
      id: 'c4', label: 'Kachina C4', src: 'const4', scope: 'team', timed: true, stats: { defPct: { p: 0 } },
      stacks: { max: 4, unit: 'inimigos no campo', default: 1, levels: [{ p: 0 }, { p: 1 }, { p: 2 }, { p: 3 }] },
      expect: 'gains 8%/12%/16%/20% increased DEF',
      note: 'DEF do personagem ATIVO dentro do Turbo Drill Field: 8/12/16/20% com 1/2/3/4+ inimigos (escolha os inimigos; padrão 1). Vale para quem estiver em campo na janela, não só para a Kachina. Ligue na janela do Supremo.',
    },
    {
      id: 'a4', label: 'Kachina A4', src: 'p2', scope: 'self', timed: false,
      flat: [{ name: 'Turbo Twirly por DEF', sourceStat: 'DEF', perPoint: { p: 0 }, hitTypes: ['skill'], labels: ['Turbo Twirly Mounted DMG', 'Turbo Twirly Independent DMG'] }],
      expect: "Turbo Twirly's DMG is increased by 20% of Kachina's DEF",
      note: 'Soma 20% da DEF ao dano base do Turbo Twirly (montado e independente). O Supremo e os Normais não recebem.',
    },
  ],
  Xilonen: [
    {
      id: 'c6', label: 'Xilonen C6', src: 'const6', scope: 'self', timed: false,
      flat: [{ name: 'Normal e Imersivo por DEF', sourceStat: 'DEF', perPoint: { p: 1 }, hitTypes: ['normal', 'plunge'] }],
      expect: 'Xilonen deals 300% of her DEF as increased Normal and Plunging Attack DMG',
      note: 'Soma 300% da DEF ao dano base dos Normais e Imersivos dela (assume o Nightsoul\'s Blessing ativo; o dano fixo não tem liga/desliga). O bônus de DMG do Imperishable Night (5 s) não tem número no texto e não entra.',
    },
  ],
  Zibai: [
    {
      id: 'c6', label: 'Zibai C6', src: 'const6', scope: 'self', timed: true, stats: { reactionBonus: { lunarcrystallizeSpecial: { p: 0, x: 30 } } },
      stacks: { max: 30, unit: 'pontos acima de 70' },
      expect: 'by 1.6% for every point consumed above 70',
      note: '+1,6% por ponto consumido acima de 70, por 3 s, no Spirit Steed\'s Stride e no Lunar-Cristalizar dela (não acumula): ligue na janela. HIPÓTESE: o teto de 100 pontos (30 acima de 70, 48%) não está no texto do C6; escolha de 0 a 30 pontos.',
    },
  ],
};

const infos: Record<string, InfoCuration[]> = {
  'Yun Jin': [
    { src: 'const1', kind: 'recarga', label: 'Recarga do Opening Flourish', text: 'a recarga cai {0%}', values: [{ lit: 0.18 }], expect: "CD is decreased by 18%" },
  ],
  Navia: [
    { src: 'const1', kind: 'energia', label: 'Energia por Crystal Shrapnel', text: 'cada acúmulo gasto devolve {0} de Energia (até {1}) e reduz a recarga do Singing Salute em {2} s (até {3} s)', values: [{ p: 0 }, { lit: 9 }, { p: 1 }, { lit: 3 }], expect: 'Up to 9 Energy can be gained this way' },
  ],
  Chiori: [
    { src: 'const6', kind: 'recarga', label: 'Recarga do Fluttering Hasode', text: 'cai {0} s depois de um efeito do Tailor-Made', values: [{ p: 0 }], expect: 'CD is decreased by 12s' },
  ],
  Kachina: [
    { src: 'const1', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia quando um aliado pega um Estilhaço ou causa Lunar-Cristalizar; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: '3 Energy will be restored to Kachina' },
  ],
  Xilonen: [
    { src: 'const2', kind: 'energia', label: 'Energia e recarga (aliados Electro)', text: 'aliados Electro recuperam {0} de Energia e o Supremo deles cai {1} s', values: [{ p: 4 }, { p: 5 }], expect: 'Electro: Restore 25 Energy, decrease Elemental Burst CD by 6s' },
    { src: 'const6', kind: 'cura', label: 'Cura do Imperishable Night', text: 'cura os aliados próximos em {0%} da DEF dela a cada 1,5 s', values: [{ p: 3 }], expect: 'She heals nearby party members for 120% of her DEF every 1.5s' },
  ],
};

export const LOTE: Lote = {
  buffs,
  notes: {
    Navia: {
      p1: x('Entra o +40% de DMG de Normal, Carregado e Imersivo (janela de 4 s). A conversão para Geo (infusão) não entra: escolha o elemento do golpe à mão.'),
    },
    Chiori: {
      p1: x('Entra o ataque coordenado do Tamoto (100% do golpe para cima, conta como habilidade). A infusão Geo do efeito Tailoring (5 s) não entra: escolha o elemento do golpe à mão.'),
    },
    Zibai: {
      p1: x('Pendente: o +60% da DEF no 2º golpe do Spirit Steed\'s Stride não entra. É dano fixo de um golpe Lunar e o dano fixo só vale para golpes diretos.'),
      const1: x('Pendente: o +220% de DMG Lunar-Cristalizar só no 1º Spirit Steed\'s Stride de cada modo não entra (bônus de um golpe só). O uso extra e os 100 pontos de Radiance são mecânica.'),
      const2: x('Entra o +30% de DMG Lunar-Cristalizar da equipe (janela). Pendente: os +550% da DEF no 2º golpe do Spirit Steed\'s Stride (Moonsign: Ascendant Gleam) não entram, pelo mesmo motivo do A1.'),
    },
  },
  infos,
};
