/**
 * Catálogo dos buffs de teste (editar build): todo tipo de bônus que o Genshin Optimizer deixa pôr à mão, nos nomes de stat
 * que o motor entende (`namedStatDelta`). `pct` = o usuário digita em % (grava a fração); senão é número (ATK, HP, DEF, EM).
 * Cada tipo de DMG tem a própria conta: DMG% comum (todos os golpes), elemental (só o elemento do personagem), por tipo de golpe,
 * de reação (transformativas, Lunar e Estelar: DMG, base, elevação, crítico e dano fixo) e crítico por tipo de golpe.
 */
import type { ExtraBuff } from '../../engine';

export interface CustomStat {
  /** Nome do stat para o motor (`ExtraBuff.stat`). */
  stat: string;
  label: string;
  pct: boolean;
}

export interface CustomGroup {
  title: string;
  stats: CustomStat[];
}

const TYPES: [string, string][] = [['normal', 'Ataque normal'], ['charged', 'Ataque carregado'], ['plunge', 'Ataque imersivo'], ['skill', 'Habilidade'], ['burst', 'Supremo']];
const REACTIONS: [string, string][] = [
  ['overloaded', 'Sobrecarga'], ['shattered', 'Estilhaçar'], ['electrocharged', 'Eletrocarregado'], ['superconduct', 'Supercondutor'], ['swirl', 'Redemoinho'],
  ['burning', 'Queimadura'], ['bloom', 'Florescer'], ['burgeon', 'Brotar'], ['hyperbloom', 'Hiperflorescer'], ['spread', 'Propagar'], ['aggravate', 'Intensificar'],
];
const SPECIAL: [string, string][] = [['lunarcharged', 'Lunar-Carregado'], ['lunarbloom', 'Lunar-Florescer'], ['lunarcrystallize', 'Lunar-Cristalizar'], ['stellarconduct', 'Condução Estelar'], ['stellarswirl', 'Redemoinho Estelar']];
const CRIT_REACTIONS = ['swirl', 'burning', 'bloom', 'burgeon', 'hyperbloom'];

export const CUSTOM_GROUPS: CustomGroup[] = [
  {
    title: 'Atributos básicos',
    stats: [
      { stat: 'HP', label: 'HP fixo', pct: false }, { stat: 'HP%', label: 'HP%', pct: true }, { stat: 'ATK', label: 'ATK fixo', pct: false }, { stat: 'ATK%', label: 'ATK%', pct: true },
      { stat: 'DEF', label: 'DEF fixo', pct: false }, { stat: 'DEF%', label: 'DEF%', pct: true }, { stat: 'EM', label: 'Maestria', pct: false }, { stat: 'ER', label: 'Recarga de Energia', pct: true },
      { stat: 'CR', label: 'Taxa Crítica', pct: true }, { stat: 'CD', label: 'Dano Crítico', pct: true },
    ],
  },
  {
    title: 'Bônus de dano',
    stats: [
      { stat: 'DMG%', label: 'Bônus de dano comum (todos os golpes)', pct: true },
      { stat: 'DMG% Elemental', label: 'Bônus de dano elemental (do elemento dele)', pct: true },
      { stat: 'Physical DMG%', label: 'Bônus de dano Físico', pct: true },
      { stat: 'Physical CD', label: 'Dano Crítico Físico', pct: true },
      { stat: 'DEF ignore', label: 'DEF ignorada', pct: true },
    ],
  },
  {
    title: 'Bônus de dano de talento',
    stats: TYPES.map(([k, label]) => ({ stat: `DMG% ${{ normal: 'Normal', charged: 'Carregado', plunge: 'Imersivo', skill: 'Habilidade', burst: 'Supremo' }[k]}`, label: `Dano de ${label}`, pct: true })),
  },
  {
    title: 'Crítico de talento',
    stats: TYPES.flatMap(([k, label]) => [{ stat: `cr:${k}`, label: `Taxa Crítica de ${label}`, pct: true }, { stat: `cd:${k}`, label: `Dano Crítico de ${label}`, pct: true }]),
  },
  {
    title: 'Bônus de dano de reação',
    stats: [
      { stat: 'Melt DMG%', label: 'Derreter', pct: true }, { stat: 'Vaporize DMG%', label: 'Vaporizar', pct: true },
      ...REACTIONS.map(([k, label]) => ({ stat: `react:${k}`, label, pct: true })),
      ...REACTIONS.filter(([k]) => k !== 'spread' && k !== 'aggravate').map(([k, label]) => ({ stat: `react:${k}Flat`, label: `${label}: dano fixo somado`, pct: false })),
    ],
  },
  {
    title: 'Crítico de reação',
    stats: CRIT_REACTIONS.flatMap((k) => {
      const label = REACTIONS.find(([r]) => r === k)![1];
      return [{ stat: `react:${k}CritRate`, label: `${label}: Taxa Crítica`, pct: true }, { stat: `react:${k}CritDmg`, label: `${label}: Dano Crítico`, pct: true }];
    }),
  },
  {
    title: 'Lunar e Estelar',
    stats: SPECIAL.flatMap(([k, label]) => [
      { stat: `react:${k}`, label: `${label}: bônus de dano`, pct: true },
      { stat: `react:${k}Base`, label: `${label}: multiplicador da base`, pct: true },
      { stat: `react:${k}Special`, label: `${label}: dano elevado`, pct: true },
      { stat: `react:${k}CritRate`, label: `${label}: Taxa Crítica`, pct: true },
      { stat: `react:${k}CritDmg`, label: `${label}: Dano Crítico`, pct: true },
      { stat: `react:${k}Flat`, label: `${label}: dano fixo somado`, pct: false },
      ...(k.startsWith('stellar') ? [{ stat: `react:${k}Mult`, label: `${label}: multiplicador`, pct: true }] : []),
    ]),
  },
];

export const CUSTOM_STATS: CustomStat[] = CUSTOM_GROUPS.flatMap((g) => g.stats);
export const customStat = (stat: string): CustomStat | undefined => CUSTOM_STATS.find((s) => s.stat === stat);

/** Começo da descrição dos buffs de teste (distingue dos extras que vieram da planilha). */
export const TEST_PREFIX = 'Buff de teste';

/** O buff de teste que o editor grava: sempre ligado, para um personagem ou todos. */
export function makeCustomBuff(target: string, stat: string, typed: number): ExtraBuff | null {
  const def = customStat(stat);
  if (!def || !Number.isFinite(typed)) return null;
  return { target, stat, value: def.pct ? typed / 100 : typed, team: false, description: `${TEST_PREFIX}: ${def.label}` };
}

/** Texto do valor de um buff de teste ("+12,5%" ou "+80"). */
export function customValueText(stat: string, value: number): string {
  const def = customStat(stat);
  const n = def?.pct ? value * 100 : value;
  const txt = (Math.round(n * 100) / 100).toString().replace('.', ',');
  return `${n >= 0 ? '+' : ''}${txt}${def?.pct ? '%' : ''}`;
}
