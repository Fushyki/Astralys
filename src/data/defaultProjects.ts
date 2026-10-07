import { CalculationProject } from '../types/projectVault';
import { generateTimelineFromDamageResult } from '../engines/timelineEngine';
import { generateScenariosFromCalculation } from '../engines/scenarioEngine';
import { DamageAnalysisResult } from '../types/damageBreakdown';

/**
 * Exact calculation datasets from user's primary calcsheet (Captura de tela 2026-10-04 172534.png)
 */

// 1. Mavuika Iansan
const MAVUIKA_IANSAN_RESULT: DamageAnalysisResult = {
  title: 'Mavuika Iansan',
  characters: [
    {
      name: 'Mavuika',
      element: 'Pyro',
      weapon: 'Blazing Suns',
      artifactSet: 'Obsidian',
      totalDamage: 4157702.28,
      damagePercentage: 94.64,
      totalAtk: 2450,
      critRate: 85.4,
      critDmg: 234.2,
      elementalMastery: 280,
      dmgBonus: 94.6
    },
    {
      name: 'Citlali',
      element: 'Cryo',
      weapon: 'TTDS',
      artifactSet: 'Instrutor',
      totalDamage: 144709.93,
      damagePercentage: 3.29,
      totalAtk: 1350,
      critRate: 64.2,
      critDmg: 138.0,
      elementalMastery: 780
    },
    {
      name: 'Iansan',
      element: 'Electro',
      weapon: 'Engulfin',
      artifactSet: 'Cinder City',
      totalDamage: 64814.53,
      damagePercentage: 1.48,
      totalAtk: 1550,
      critRate: 58.0,
      critDmg: 120.0
    },
    {
      name: 'Bennett',
      element: 'Pyro',
      weapon: 'Falção',
      artifactSet: 'Nobless',
      totalDamage: 25902.67,
      damagePercentage: 0.59,
      totalAtk: 1850,
      critRate: 52.0,
      critDmg: 110.0
    }
  ],
  hits: [
    { id: 'mi-1', label: 'QCccF', displayName: 'Nuke Supremo Mavuika', charName: 'Mavuika', charIndex: 0, damage: 1650000, pctOfTotal: 37.5, category: 'burst' },
    { id: 'mi-2', label: 'cdF', displayName: 'Ataques Carregados Pyro', charName: 'Mavuika', charIndex: 0, damage: 2507702.28, pctOfTotal: 57.1, category: 'charged' },
    { id: 'mi-3', label: 'Citlali E', displayName: 'Disparo Criogênico Citlali', charName: 'Citlali', charIndex: 1, damage: 144709.93, pctOfTotal: 3.3, category: 'skill' },
    { id: 'mi-4', label: 'Iansan E', displayName: 'Campo Eletro Iansan', charName: 'Iansan', charIndex: 2, damage: 64814.53, pctOfTotal: 1.5, category: 'skill' },
    { id: 'mi-5', label: 'Bennett Q', displayName: 'Viagem Fantástica Bennett', charName: 'Bennett', charIndex: 3, damage: 25902.67, pctOfTotal: 0.6, category: 'burst' }
  ],
  totalDpr: 4393129.41,
  dps: 251036,
  rotationDuration: 17.5,
  comboNotation: 'Q CccF cdF cdF cdF Combo'
};

// 2. Mavuika Xilonen
const MAVUIKA_XILONEN_RESULT: DamageAnalysisResult = {
  title: 'Mavuika Xilonen',
  characters: [
    {
      name: 'Mavuika',
      element: 'Pyro',
      weapon: 'Blazing Suns',
      artifactSet: 'Obsidian',
      totalDamage: 3724283.41,
      damagePercentage: 96.29,
      totalAtk: 2380,
      critRate: 85.4,
      critDmg: 234.2,
      elementalMastery: 280,
      dmgBonus: 94.6
    },
    {
      name: 'Citlali',
      element: 'Cryo',
      weapon: 'TTDS',
      artifactSet: 'Instrutor',
      totalDamage: 100292.51,
      damagePercentage: 2.59,
      totalAtk: 1350,
      critRate: 64.2,
      critDmg: 138.0,
      elementalMastery: 780
    },
    {
      name: 'Xilonen',
      element: 'Geo',
      weapon: 'Peak Patroll',
      artifactSet: 'Cinder City',
      totalDamage: 21572.93,
      damagePercentage: 0.56,
      totalAtk: 1400,
      critRate: 58.0,
      critDmg: 120.0
    },
    {
      name: 'Bennett',
      element: 'Pyro',
      weapon: 'Falção',
      artifactSet: 'Nobless',
      totalDamage: 21612.77,
      damagePercentage: 0.56,
      totalAtk: 1850,
      critRate: 52.0,
      critDmg: 110.0
    }
  ],
  hits: [
    { id: 'mx-1', label: 'QCccF', displayName: 'Nuke Supremo Mavuika', charName: 'Mavuika', charIndex: 0, damage: 1520000, pctOfTotal: 39.3, category: 'burst' },
    { id: 'mx-2', label: 'cdF', displayName: 'Ataques Carregados Pyro', charName: 'Mavuika', charIndex: 0, damage: 2204283.41, pctOfTotal: 57.0, category: 'charged' },
    { id: 'mx-3', label: 'Citlali E', displayName: 'Aplicação Criogênica Citlali', charName: 'Citlali', charIndex: 1, damage: 100292.51, pctOfTotal: 2.6, category: 'skill' },
    { id: 'mx-4', label: 'Xilonen E', displayName: 'Redução de RES Xilonen', charName: 'Xilonen', charIndex: 2, damage: 21572.93, pctOfTotal: 0.6, category: 'skill' },
    { id: 'mx-5', label: 'Bennett Q', displayName: 'Viagem Fantástica Bennett', charName: 'Bennett', charIndex: 3, damage: 21612.77, pctOfTotal: 0.6, category: 'burst' }
  ],
  totalDpr: 3867761.61,
  dps: 221015,
  rotationDuration: 17.5,
  comboNotation: 'Q CccF cdF cdF cdF Combo'
};

// 3. Flins Premium (Columbina / Sucrose)
const FLINS_PREMIUM_COLUMBINA_RESULT: DamageAnalysisResult = {
  title: 'Flins Premium (Columbina / Sucrose)',
  characters: [
    {
      name: 'Flins',
      element: 'Electro',
      weapon: 'Bloodsoaked Ruins',
      artifactSet: 'Night of the Sky',
      totalDamage: 1811686.93,
      damagePercentage: 69.75,
      totalAtk: 1850,
      critRate: 82.5,
      critDmg: 215.0,
      elementalMastery: 350
    },
    {
      name: 'Columbina',
      element: 'Hydro',
      weapon: 'Nocturnes CC',
      artifactSet: 'Serenade',
      totalDamage: 378203.28,
      damagePercentage: 11.14,
      totalAtk: 1200,
      critRate: 70.0,
      critDmg: 160.0
    },
    {
      name: 'Ineffa',
      element: 'Electro',
      weapon: 'Fractured Halo',
      artifactSet: 'M Star',
      totalDamage: 644999.64,
      damagePercentage: 19.00,
      totalAtk: 1600,
      critRate: 65.0,
      critDmg: 145.0
    },
    {
      name: 'Sucrose',
      element: 'Anemo',
      weapon: 'TTDS',
      artifactSet: 'VV',
      totalDamage: 3615.73,
      damagePercentage: 0.11,
      totalAtk: 1100,
      critRate: 35.0,
      critDmg: 80.0,
      elementalMastery: 850
    },
    {
      name: 'Lunar',
      element: 'Hydro',
      weapon: '-',
      artifactSet: '-',
      totalDamage: 555896.86,
      damagePercentage: 0.00
    }
  ],
  hits: [
    { id: 'fpc-1', label: 'Flins Q', displayName: 'Descarga Elétrica Flins', charName: 'Flins', charIndex: 0, damage: 850000, pctOfTotal: 25.0, category: 'burst' },
    { id: 'fpc-2', label: 'Flins E', displayName: 'Golpes de Lança Flins', charName: 'Flins', charIndex: 0, damage: 961686.93, pctOfTotal: 28.3, category: 'skill' },
    { id: 'fpc-3', label: 'Ineffa E', displayName: 'Campo Estelar Ineffa', charName: 'Ineffa', charIndex: 2, damage: 644999.64, pctOfTotal: 19.0, category: 'skill' },
    { id: 'fpc-4', label: 'Lunar Reaction', displayName: 'Dano de Reação Lunar', charName: 'Lunar', charIndex: 4, damage: 555896.86, pctOfTotal: 16.4, category: 'other' },
    { id: 'fpc-5', label: 'Columbina Skill', displayName: 'Canção das Ondas Columbina', charName: 'Columbina', charIndex: 1, damage: 378203.28, pctOfTotal: 11.1, category: 'skill' }
  ],
  totalDpr: 3394402.44,
  dps: 218994,
  rotationDuration: 15.5,
  comboNotation: 'Columbina with Serenade/Sucrose with TTDS'
};

// 4. Flins Premium (High Combo)
const FLINS_PREMIUM_HIGH_RESULT: DamageAnalysisResult = {
  title: 'Flins Premium (High Combo)',
  characters: [
    {
      name: 'Flins',
      element: 'Electro',
      weapon: 'Bloodsoaked Ruins',
      artifactSet: 'Night of the Sky',
      totalDamage: 2168432.52,
      damagePercentage: 65.43,
      totalAtk: 1850,
      critRate: 82.5,
      critDmg: 215.0,
      elementalMastery: 350
    },
    {
      name: 'Columbina',
      element: 'Hydro',
      weapon: 'Nocturnes CC',
      artifactSet: 'Serenade',
      totalDamage: 614291.50,
      damagePercentage: 14.39,
      totalAtk: 1200,
      critRate: 70.0,
      critDmg: 160.0
    },
    {
      name: 'Ineffa',
      element: 'Electro',
      weapon: 'Fractured Halo',
      artifactSet: 'M Star',
      totalDamage: 857535.32,
      damagePercentage: 20.09,
      totalAtk: 1600,
      critRate: 65.0,
      critDmg: 145.0
    },
    {
      name: 'Sucrose',
      element: 'Anemo',
      weapon: 'TTDS',
      artifactSet: 'VV',
      totalDamage: 3615.73,
      damagePercentage: 0.08,
      totalAtk: 1100,
      critRate: 35.0,
      critDmg: 80.0,
      elementalMastery: 850
    },
    {
      name: 'Lunar',
      element: 'Hydro',
      weapon: '-',
      artifactSet: '-',
      totalDamage: 624159.27,
      damagePercentage: 0.00
    }
  ],
  hits: [
    { id: 'fph-1', label: 'Flins Q', displayName: 'Descarga Elétrica Flins', charName: 'Flins', charIndex: 0, damage: 1020000, pctOfTotal: 23.9, category: 'burst' },
    { id: 'fph-2', label: 'Flins 5N EQ', displayName: 'Combo 5N EQ Estelar', charName: 'Flins', charIndex: 0, damage: 1148432.52, pctOfTotal: 26.9, category: 'normal' },
    { id: 'fph-3', label: 'Ineffa E', displayName: 'Campo Estelar Ineffa', charName: 'Ineffa', charIndex: 2, damage: 857535.32, pctOfTotal: 20.1, category: 'skill' },
    { id: 'fph-4', label: 'Lunar Reaction', displayName: 'Dano de Reação Lunar', charName: 'Lunar', charIndex: 4, damage: 624159.27, pctOfTotal: 14.6, category: 'other' },
    { id: 'fph-5', label: 'Columbina Skill', displayName: 'Canção das Ondas Columbina', charName: 'Columbina', charIndex: 1, damage: 614291.50, pctOfTotal: 14.4, category: 'skill' }
  ],
  totalDpr: 4268034.34,
  dps: 243888,
  rotationDuration: 17.5,
  comboNotation: 'E (big)Q5N EQ 5N EQ'
};

export const DEFAULT_CALCULATION_PROJECTS: CalculationProject[] = [
  {
    id: 'proj-mavuika-iansan',
    title: 'Mavuika Iansan',
    description: 'Rotação Natlan com Iansan, Citlali e Bennett. DPR 4.39M, DPS 251.036.',
    carryName: 'Mavuika',
    teamNames: ['Mavuika', 'Citlali', 'Iansan', 'Bennett'],
    totalDpr: MAVUIKA_IANSAN_RESULT.totalDpr,
    dps: MAVUIKA_IANSAN_RESULT.dps,
    rotationDuration: 17.5,
    comboNotation: MAVUIKA_IANSAN_RESULT.comboNotation,
    tags: ['Natlan', 'Pyro Carry', 'Iansan', '251k DPS'],
    sheetOrigin: 'Calcsheet Pág 1',
    createdAt: '2026-10-04T12:00:00.000Z',
    updatedAt: '2026-10-04T17:25:00.000Z',
    calculation: MAVUIKA_IANSAN_RESULT,
    timeline: generateTimelineFromDamageResult(MAVUIKA_IANSAN_RESULT),
    scenarios: generateScenariosFromCalculation(MAVUIKA_IANSAN_RESULT)
  },
  {
    id: 'proj-mavuika-xilonen',
    title: 'Mavuika Xilonen',
    description: 'Variante com Xilonen no lugar de Iansan. DPR 3.86M, DPS 221.015.',
    carryName: 'Mavuika',
    teamNames: ['Mavuika', 'Citlali', 'Xilonen', 'Bennett'],
    totalDpr: MAVUIKA_XILONEN_RESULT.totalDpr,
    dps: MAVUIKA_XILONEN_RESULT.dps,
    rotationDuration: 17.5,
    comboNotation: MAVUIKA_XILONEN_RESULT.comboNotation,
    tags: ['Natlan', 'Pyro Carry', 'Xilonen', '221k DPS'],
    sheetOrigin: 'Calcsheet Pág 1',
    createdAt: '2026-10-04T12:30:00.000Z',
    updatedAt: '2026-10-04T17:25:00.000Z',
    calculation: MAVUIKA_XILONEN_RESULT,
    timeline: generateTimelineFromDamageResult(MAVUIKA_XILONEN_RESULT),
    scenarios: generateScenariosFromCalculation(MAVUIKA_XILONEN_RESULT)
  },
  {
    id: 'proj-flins-columbina',
    title: 'Flins Premium',
    description: 'Composição Flins com Columbina, Ineffa e Sucrose TTDS. DPR 3.39M, DPS 218.994.',
    carryName: 'Flins',
    teamNames: ['Flins', 'Columbina', 'Ineffa', 'Sucrose'],
    totalDpr: FLINS_PREMIUM_COLUMBINA_RESULT.totalDpr,
    dps: FLINS_PREMIUM_COLUMBINA_RESULT.dps,
    rotationDuration: 15.5,
    comboNotation: FLINS_PREMIUM_COLUMBINA_RESULT.comboNotation,
    tags: ['Electro', 'Columbina', 'Lunar', '218k DPS'],
    sheetOrigin: 'Calcsheet Pág 1',
    createdAt: '2026-10-04T14:00:00.000Z',
    updatedAt: '2026-10-04T17:25:00.000Z',
    calculation: FLINS_PREMIUM_COLUMBINA_RESULT,
    timeline: generateTimelineFromDamageResult(FLINS_PREMIUM_COLUMBINA_RESULT),
    scenarios: generateScenariosFromCalculation(FLINS_PREMIUM_COLUMBINA_RESULT)
  },
  {
    id: 'proj-flins-high',
    title: 'Flins Premium',
    description: 'Rotação de alto dano E (big)Q5N EQ 5N EQ. DPR 4.26M, DPS 243.888.',
    carryName: 'Flins',
    teamNames: ['Flins', 'Columbina', 'Ineffa', 'Sucrose'],
    totalDpr: FLINS_PREMIUM_HIGH_RESULT.totalDpr,
    dps: FLINS_PREMIUM_HIGH_RESULT.dps,
    rotationDuration: 17.5,
    comboNotation: FLINS_PREMIUM_HIGH_RESULT.comboNotation,
    tags: ['Electro', 'High Combo', 'Lunar', '243k DPS'],
    sheetOrigin: 'Calcsheet Pág 1',
    createdAt: '2026-10-04T15:00:00.000Z',
    updatedAt: '2026-10-04T17:25:00.000Z',
    calculation: FLINS_PREMIUM_HIGH_RESULT,
    timeline: generateTimelineFromDamageResult(FLINS_PREMIUM_HIGH_RESULT),
    scenarios: generateScenariosFromCalculation(FLINS_PREMIUM_HIGH_RESULT)
  }
];

const PLACEHOLDER_RESULT: DamageAnalysisResult = {
  title: 'Sua Equipe',
  characters: [
    {
      name: 'Personagem 1',
      element: 'Pyro',
      weapon: 'Arma (R1)',
      artifactSet: 'Conjunto 4p',
      totalDamage: 650000,
      damagePercentage: 65.0,
      totalAtk: 2200,
      critRate: 75.0,
      critDmg: 200.0,
      elementalMastery: 150,
      dmgBonus: 75.0,
      rolls: { er: 3, cr: 6, cd: 6, atkPct: 4 }
    },
    {
      name: 'Personagem 2',
      element: 'Hydro',
      weapon: 'Arma Favonius (R5)',
      artifactSet: 'Conjunto de Recarga 4p',
      totalDamage: 200000,
      damagePercentage: 20.0,
      totalAtk: 1600,
      critRate: 65.0,
      critDmg: 130.0,
      elementalMastery: 100,
      rolls: { er: 6, cr: 5, cd: 5, atkPct: 2 }
    },
    {
      name: 'Personagem 3',
      element: 'Anemo',
      weapon: 'Arma de Suporte (R5)',
      artifactSet: 'Conjunto de Suporte 4p',
      totalDamage: 100000,
      damagePercentage: 10.0,
      totalAtk: 1200,
      critRate: 50.0,
      critDmg: 100.0,
      elementalMastery: 750,
      rolls: { er: 5, cr: 4, cd: 4, em: 5 }
    },
    {
      name: 'Personagem 4',
      element: 'Geo',
      weapon: 'Arma de Cura/Buffer',
      artifactSet: 'Conjunto de Buffer 4p',
      totalDamage: 50000,
      damagePercentage: 5.0,
      totalAtk: 1100,
      critRate: 40.0,
      critDmg: 90.0,
      rolls: { er: 4, hpPct: 8 }
    }
  ],
  hits: [
    {
      id: 'hit-p1',
      label: 'Q',
      displayName: 'Dano Supremo (Exemplo)',
      charName: 'Personagem 1',
      charIndex: 0,
      damage: 400000,
      pctOfTotal: 40.0,
      category: 'burst'
    },
    {
      id: 'hit-p2',
      label: 'E',
      displayName: 'Habilidade Elemental (Exemplo)',
      charName: 'Personagem 1',
      charIndex: 0,
      damage: 250000,
      pctOfTotal: 25.0,
      category: 'skill'
    }
  ],
  totalDpr: 1000000,
  dps: 50000,
  rotationDuration: 20,
  comboNotation: 'E -> Q -> Combo de Golpes (Exemplo de Rotação)'
};

export const PLACEHOLDER_PROJECT: CalculationProject = {
  id: 'proj-placeholder',
  title: 'Sua Equipe',
  description: 'Estrutura de demonstração limpa para orientar a visualização dos dashboards, gráficos de dano e timelines.',
  carryName: 'Personagem 1',
  teamNames: ['Personagem 1', 'Personagem 2', 'Personagem 3', 'Personagem 4'],
  totalDpr: PLACEHOLDER_RESULT.totalDpr,
  dps: PLACEHOLDER_RESULT.dps,
  rotationDuration: 20,
  comboNotation: PLACEHOLDER_RESULT.comboNotation,
  tags: ['Demo', '20s'],
  sheetOrigin: 'Astralys Template',
  createdAt: '2026-10-05T00:00:00.000Z',
  updatedAt: '2026-10-05T00:00:00.000Z',
  calculation: PLACEHOLDER_RESULT,
  timeline: generateTimelineFromDamageResult(PLACEHOLDER_RESULT),
  scenarios: generateScenariosFromCalculation(PLACEHOLDER_RESULT)
};

