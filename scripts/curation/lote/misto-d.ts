/**
 * Lote misto D: Sandrone, Odette, Alyosha e os Viajantes Cryo e Electro (Aether e Lumine), conferidos contra o Lunaris 7.1.53.
 * Sandrone: toda a curadoria antiga bate com o texto (A4, base Estelar, C1, C4, C6), nada mudou.
 * Odette: RES do C2 estava sempre ligada (agora janela, e as RES de Electro e Anemo do Radiance entram), ATK do C2 agora até 6 stacks
 * (4 do A1 + 2 do C1), e o Snow Swan's Dream dela mesma (Supremo) não existia.
 * Alyosha: faltavam o ATK do Hunter's Precision (habilidade) e os +20% Estelar-Conduct do A4.
 * Viajante Cryo: C2 com 120 de Maestria; Viajante Electro: Detonate (A4), raio do Detonate e RES Electro do C2.
 */
import type { BuffCuration, NoteCuration, ProcCuration, Src } from '../characters';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });

const cryoBuffs: BuffCuration[] = [
  {
    id: 'c2x', label: 'Viajante C2 (Stellar Glimmer)', src: 'const2', scope: 'team', timed: true, stats: { em: { p: 0 } },
    expect: 'the Elemental Mastery boost described above will be increased to 120',
    note: 'Soma ao "Viajante C2": com reação Estelar o texto sobe a Maestria de 60 para 120, então este buff soma mais 60 (60 + 60 = 120). Por 5 s quando o personagem afetado dispara ou causa dano de reação Estelar: ligue as duas janelas.',
  },
];
const cryoNotes: Partial<Record<Src, NoteCuration>> = {
  p4: x('Pendente: o Carregado: Freezing Ice (+140% do ATK, 1 vez a cada 15 s) não entra porque o texto não diz se os 140% valem por acerto (o Carregado tem 2) nem separa do +80% do A1 no mesmo golpe. Pendente também: o bônus por Frostglow do Supremo (texto não diz se soma como DMG% ou ao multiplicador; nos golpes Estelares tem linha própria).'),
  const1: u('Só energia (informativo).'),
  const4: u('Só duração da Frostpierce Star.'),
  const2: x('Entram +60 de Maestria e, com reação Estelar, 120 (janelas).'),
};
const cryoInfos: InfoCuration[] = [
  { src: 'const1', kind: 'energia', label: 'Energia que o Viajante recupera', text: '{0} de Energia ao causar dano Estelar; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'regenerates 5 Elemental Energy' },
];

const electroBuffs: BuffCuration[] = [
  {
    id: 'a3', label: 'Viajante A4 (Detonate)', src: 'p3', scope: 'self', timed: false,
    flat: [{ name: 'Charged Attack: Detonate por ATK', sourceStat: 'ATK', perPoint: { p: 7 }, hitTypes: ['charged'], labels: ['Charged Attack DMG'], stacks: 2 }],
    expect: "Increase in DMG is equal to 100% of Traveler's ATK",
    note: 'Soma 100% do ATK ao dano base de CADA acerto do Carregado: Detonate (texto: "each Charged Attack hit"), 1 vez a cada 15 s e com 3 stacks de Blade of Resounding Thunder (dados por Supremos dos aliados). Entra nos 2 primeiros acertos de Carregado da rotação (1 Detonate). O raio de 200% está em "Viajante A4: raio do Detonate".',
  },
  {
    id: 'c2', label: 'Viajante C2', src: 'const2', scope: 'self', timed: true, resShred: { value: { p: 1, x: -1 }, elements: ['Electro'] },
    expect: 'it will decrease their Electro RES by 15% for 8s',
    note: 'RES Electro do inimigo -15% por 8 s depois que o Falling Thunder acerta: janela de tempo, o usuário liga e decide a duração.',
  },
];
const electroProcs: ProcCuration[] = [
  {
    id: 'a3raio', label: 'Viajante A4: raio do Detonate', src: 'p3', scale: { atk: { p: 10 } }, hitType: 'charged',
    expect: 'dealing Electro DMG equal to 200% of Traveler',
    note: '200% do ATK, Electro, considerado Carregado, 3 s depois do Detonate acertar (1 vez a cada 15 s): adicione uma execução por Detonate.',
  },
];
const electroNotes: Partial<Record<Src, NoteCuration>> = {
  p1: u('Só redução de recarga da Lightning Blade (informativo).'),
  p2: u('Só Recarga de Energia do Abundance Amulet.'),
  p3: x('Entram o +100% do ATK por acerto e o raio de 200% do ATK do Carregado: Detonate. Os buffs "para cada elemento ressonado" não entram: o texto não diz quais ressonâncias contam nem como o time as define.'),
  const1: u('Só quantidade de Abundance Amulets (energia).'),
  const4: u('Só energia.'),
};
const electroInfos: InfoCuration[] = [
  { src: 'p1', kind: 'recarga', label: 'Recarga da Lightning Blade', text: 'cai {0} s quando outro aliado pega um Abundance Amulet', values: [{ lit: 1.5 }], expect: "Lightning Blade's CD is decreased by 1.5s" },
];

const RADIANCE = 'Radiance: Stellar Glimmer com o Solo Dance Double em campo (20 s): janela de tempo.';

export const LOTE: Lote = {
  buffs: {
    Odette: [
      {
        id: 'c2', label: 'Odette C2', src: 'const2', scope: 'self', timed: true, stats: { atkPct: { p: 0, x: 6 } }, stacks: { max: 6, unit: 'stacks de Marvelous Splendor', default: 4 },
        expect: "every stack of Marvelous Splendor active also increases the character's ATK by 7%",
        note: '+7% de ATK por stack de Marvelous Splendor dela: 4 do A1 + 2 do C1 = até 6 (escolha de 0 a 6). Vale para quem tem o efeito; a distribuição para aliados fora de campo não entra (o texto não diz quantos stacks cada um recebe).',
      },
      {
        id: 'c2res', label: 'Odette C2 (RES Cryo)', src: 'const2', scope: 'self', timed: true, resShred: { value: { p: 1 }, elements: ['Cryo'] },
        expect: 'will also have their corresponding Elemental RES lowered by 20%',
        note: `RES Cryo do inimigo -20% (vale nos dois Radiance). ${RADIANCE}`,
      },
      {
        id: 'c2res-electro', label: 'Odette C2 (RES Electro)', src: 'const2', scope: 'self', timed: true, resShred: { value: { p: 1 }, elements: ['Electro'] },
        expect: 'Radiance: Stellar-Conduct: Cryo and Electro',
        note: `RES Electro do inimigo -20% só no Radiance: Stellar-Conduct (ligue só nele). ${RADIANCE}`,
      },
      {
        id: 'c2res-anemo', label: 'Odette C2 (RES Anemo)', src: 'const2', scope: 'self', timed: true, resShred: { value: { p: 1 }, elements: ['Anemo'] },
        expect: 'Radiance: Stellar Swirl: Cryo and Anemo',
        note: `RES Anemo do inimigo -20% só no Radiance: Stellar Swirl (ligue só nele). ${RADIANCE}`,
      },
      {
        id: 'burst', label: "Odette: Snow Swan's Dream", src: 'kit', kit: { talent: 'burst', key: "Snow Swan's Dream Stellar Glimmer Reaction DMG Bonus" }, scope: 'self', timed: true,
        stats: { reactionBonus: { stellarconduct: { lit: 1 }, stellarswirl: { lit: 1 } } },
        expect: 'which increases the Stellar Glimmer reaction DMG Odette deals',
        note: 'Bônus de DMG Estelar da própria Odette pelo nível do Supremo (14% a 70%), por 20 s depois do Supremo: ligue na janela. A parte de 50% dos outros membros (C4) está em "Odette C4 (Snow Swan para a equipe)".',
      },
    ],
    Alyosha: [
      {
        id: 'hp', label: "Alyosha: Hunter's Precision (ATK)", src: 'kit', kit: { talent: 'skill', key: "Hunter's Precision ATK Bonus" }, scope: 'team', timed: true, stats: { atkPct: { lit: 1 } },
        expect: "apply the Hunter's Mark",
        note: "ATK% pelo nível da habilidade (11,66% a 27,56%) para quem está em campo, por 15 s depois de ativar o Hunter's Mark: ligue na janela. Com 1 stack. Pendente: no C6 o efeito acumula até 2 stacks, mas o texto não diz se o ATK dobra.",
      },
      {
        id: 'a3', label: 'Alyosha A4 (Stellar-Conduct)', src: 'p3', scope: 'team', timed: true, stats: { reactionBonus: { stellarconduct: { p: 0 } } },
        expect: 'will also increase Stellar-Conduct reaction DMG dealt by the character when on the field by 20%',
        note: "+20% de DMG Estelar-Conduct de quem está em campo com o Hunter's Precision, só com Alyosha em Radiance: Stellar-Conduct (dentro de um Polestar Field): ligue na janela.",
      },
    ],
    'Aether (Cryo)': cryoBuffs,
    'Lumine (Cryo)': cryoBuffs,
    'Aether (Electro)': electroBuffs,
    'Lumine (Electro)': electroBuffs,
  },
  procs: {
    'Aether (Electro)': electroProcs,
    'Lumine (Electro)': electroProcs,
  },
  notes: {
    Odette: { const2: null },
    Alyosha: {
      p3: null,
      const6: x("Entram +100 de Maestria com 2 stacks (janela). Pendente: o texto não diz se o ATK do Hunter's Precision dobra com 2 stacks."),
    },
    'Aether (Cryo)': cryoNotes,
    'Lumine (Cryo)': cryoNotes,
    'Aether (Electro)': electroNotes,
    'Lumine (Electro)': electroNotes,
  },
  infos: {
    Alyosha: [
      { src: 'p1', kind: 'cura', label: 'Cura do Tugarin', text: 'Cura {0%} do ATK dele aos personagens em campo quando o Tugarin ataca', values: [{ p: 0 }], expect: "at 120% of Alyosha's ATK" },
      { src: 'const1', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia quando aliados causam reação Electro; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'regenerates 15 Elemental Energy' },
      { src: 'const4', kind: 'cura', label: 'Cura ao aliado mais ferido', text: 'Cura {0%} do ATK dele ao aliado com menor HP%', values: [{ p: 0 }], expect: "restore 60% of Alyosha's ATK as HP" },
    ] satisfies InfoCuration[],
    'Aether (Cryo)': cryoInfos,
    'Lumine (Cryo)': cryoInfos,
    'Aether (Electro)': electroInfos,
    'Lumine (Electro)': electroInfos,
  },
};
