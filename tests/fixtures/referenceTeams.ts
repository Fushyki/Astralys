/**
 * Authoritative ER test fixtures derived directly from Calculadora_Recarga_Genshin.html
 * and documented in spec_miner_survey_er/survey_er_calc.md.
 */

import { ERSlotConfig } from '../../src/types/er';

export interface ExpectedERResult {
  slotId: number;
  characterName: string;
  baseFromSkills: number;
  baseFromFav: number;
  baseFromEnemies: number;
  flatEnergy: number;
  totalBaseEnergy: number;
  neededFromParticles: number;
  calculatedERPercent: string; // e.g. "202.2%"
  safeERPercent: string;       // e.g. "232.6%"
  statusLabel: string;
}

export interface ScenarioFixture {
  id: string;
  name: string;
  rotationTime: number;
  enemyParts: number;
  slots: ERSlotConfig[];
  expected: ExpectedERResult[];
}

/**
 * Scenario 1: Default Reference Team (Mavuika Melt / Overload)
 * Source: survey_er_calc.md § 5.1
 */
export const SCENARIO_1_MAVUIKA: ScenarioFixture = {
  id: 'scenario-1-mavuika',
  name: 'Mavuika Melt / Overload Team',
  rotationTime: 20,
  enemyParts: 6,
  slots: [
    {
      id: 1,
      name: 'Mavuika',
      e_uses: 1,
      funnel: 'Dividir (50% Slot 3 / 50% Slot 4)',
      fav: 0,
      fav_target: 'Ele mesmo (Em campo)',
      flat: 0,
      onfield: 0.50,
      use_burst: false
    },
    {
      id: 2,
      name: 'Citlali',
      e_uses: 1,
      funnel: 'Ele mesmo (Em campo)',
      fav: 0,
      fav_target: 'Ele mesmo (Em campo)',
      flat: 0,
      onfield: 0.15,
      use_burst: true
    },
    {
      id: 3,
      name: 'Iansan',
      e_uses: 1,
      funnel: 'Ele mesmo (Em campo)',
      fav: 0,
      fav_target: 'Ele mesmo (Em campo)',
      flat: 12,
      onfield: 0.15,
      use_burst: true
    },
    {
      id: 4,
      name: 'Bennett',
      e_uses: 1,
      funnel: 'Ele mesmo (Em campo)',
      fav: 0,
      fav_target: 'Ele mesmo (Em campo)',
      flat: 0,
      onfield: 0.20,
      use_burst: true
    }
  ],
  expected: [
    {
      slotId: 1,
      characterName: 'Mavuika',
      baseFromSkills: 18.45,
      baseFromFav: 0.0,
      baseFromEnemies: 9.60,
      flatEnergy: 0.0,
      totalBaseEnergy: 28.05,
      neededFromParticles: 0.0,
      calculatedERPercent: '100.0%',
      safeERPercent: '100.0%',
      statusLabel: '⚪ Não usa Ult (Ignorar ER)'
    },
    {
      slotId: 2,
      characterName: 'Citlali',
      baseFromSkills: 21.75,
      baseFromFav: 0.0,
      baseFromEnemies: 7.92,
      flatEnergy: 0.0,
      totalBaseEnergy: 29.67,
      neededFromParticles: 60.0,
      calculatedERPercent: '202.2%',
      safeERPercent: '232.6%',
      statusLabel: '🟡 Alta (175-215%)'
    },
    {
      slotId: 3,
      characterName: 'Iansan',
      baseFromSkills: 20.35,
      baseFromFav: 0.0,
      baseFromEnemies: 7.92,
      flatEnergy: 12.0,
      totalBaseEnergy: 28.27,
      neededFromParticles: 58.0,
      calculatedERPercent: '205.2%',
      safeERPercent: '235.9%',
      statusLabel: '🟡 Alta (175-215%)'
    },
    {
      slotId: 4,
      characterName: 'Bennett',
      baseFromSkills: 24.15,
      baseFromFav: 0.0,
      baseFromEnemies: 8.16,
      flatEnergy: 0.0,
      totalBaseEnergy: 32.31,
      neededFromParticles: 60.0,
      calculatedERPercent: '185.7%',
      safeERPercent: '213.6%',
      statusLabel: '🟡 Alta (175-215%)'
    }
  ]
};

/**
 * Scenario 2: Raiden National (Rational)
 * Source: survey_er_calc.md § 5.2
 */
export const SCENARIO_2_RAIDEN_NATIONAL: ScenarioFixture = {
  id: 'scenario-2-rational',
  name: 'Raiden National (Rational)',
  rotationTime: 20,
  enemyParts: 6,
  slots: [
    {
      id: 1,
      name: 'Raiden',
      e_uses: 1,
      funnel: 'Ele mesmo (Em campo)',
      fav: 0,
      fav_target: 'Ele mesmo (Em campo)',
      flat: 0,
      onfield: 0.50,
      use_burst: true
    },
    {
      id: 2,
      name: 'Xiangling',
      e_uses: 1,
      funnel: 'Ele mesmo (Em campo)',
      fav: 0,
      fav_target: 'Ele mesmo (Em campo)',
      flat: 0,
      onfield: 0.10,
      use_burst: true
    },
    {
      id: 3,
      name: 'Xingqiu',
      e_uses: 2,
      funnel: 'Ele mesmo (Em campo)',
      fav: 1,
      fav_target: 'Ele mesmo (Em campo)',
      flat: 0,
      onfield: 0.15,
      use_burst: true
    },
    {
      id: 4,
      name: 'Bennett',
      e_uses: 2,
      funnel: 'Passar p/ Slot 2',
      fav: 1,
      fav_target: 'Passar p/ Slot 2',
      flat: 0,
      onfield: 0.25,
      use_burst: true
    }
  ],
  expected: [
    {
      slotId: 1,
      characterName: 'Raiden',
      baseFromSkills: 30.60,
      baseFromFav: 7.20,
      baseFromEnemies: 9.60,
      flatEnergy: 0.0,
      totalBaseEnergy: 47.40,
      neededFromParticles: 90.0,
      calculatedERPercent: '189.9%',
      safeERPercent: '218.4%',
      statusLabel: '🟡 Alta (175-215%)'
    },
    {
      slotId: 2,
      characterName: 'Xiangling',
      baseFromSkills: 35.40,
      baseFromFav: 9.60,
      baseFromEnemies: 7.68,
      flatEnergy: 24.0,
      totalBaseEnergy: 52.68,
      neededFromParticles: 56.0,
      calculatedERPercent: '106.3%',
      safeERPercent: '122.2%',
      statusLabel: '🟢 Confortável (<135%)'
    },
    {
      slotId: 3,
      characterName: 'Xingqiu',
      baseFromSkills: 39.00,
      baseFromFav: 9.60,
      baseFromEnemies: 7.92,
      flatEnergy: 24.0,
      totalBaseEnergy: 56.52,
      neededFromParticles: 56.0,
      calculatedERPercent: '100.0%',
      safeERPercent: '115.0%',
      statusLabel: '🟢 Confortável (<135%)'
    },
    {
      slotId: 4,
      characterName: 'Bennett',
      baseFromSkills: 25.20,
      baseFromFav: 7.20,
      baseFromEnemies: 8.40,
      flatEnergy: 24.0,
      totalBaseEnergy: 40.80,
      neededFromParticles: 36.0,
      calculatedERPercent: '100.0%',
      safeERPercent: '115.0%',
      statusLabel: '🟢 Confortável (<135%)'
    }
  ]
};

/**
 * Scenario 3: Ayaka Freeze
 * Source: survey_er_calc.md § 5.3
 */
export const SCENARIO_3_AYAKA_FREEZE: ScenarioFixture = {
  id: 'scenario-3-ayaka',
  name: 'Ayaka Freeze',
  rotationTime: 20,
  enemyParts: 6,
  slots: [
    {
      id: 1,
      name: 'Ayaka',
      e_uses: 1,
      funnel: 'Ele mesmo (Em campo)',
      fav: 0,
      fav_target: 'Ele mesmo (Em campo)',
      flat: 0,
      onfield: 0.45,
      use_burst: true
    },
    {
      id: 2,
      name: 'Shenhe',
      e_uses: 1,
      funnel: 'Passar p/ Slot 1',
      fav: 1,
      fav_target: 'Passar p/ Slot 1',
      flat: 0,
      onfield: 0.15,
      use_burst: true
    },
    {
      id: 3,
      name: 'Kazuha',
      e_uses: 1,
      funnel: 'Ele mesmo (Em campo)',
      fav: 1,
      fav_target: 'Ele mesmo (Em campo)',
      flat: 0,
      onfield: 0.20,
      use_burst: true
    },
    {
      id: 4,
      name: 'Kokomi',
      e_uses: 1,
      funnel: 'Ele mesmo (Em campo)',
      fav: 0,
      fav_target: 'Ele mesmo (Em campo)',
      flat: 0,
      onfield: 0.20,
      use_burst: true
    }
  ],
  expected: [
    {
      slotId: 1,
      characterName: 'Ayaka',
      baseFromSkills: 26.10,
      baseFromFav: 9.60,
      baseFromEnemies: 9.36,
      flatEnergy: 0.0,
      totalBaseEnergy: 45.06,
      neededFromParticles: 80.0,
      calculatedERPercent: '177.5%',
      safeERPercent: '204.2%',
      statusLabel: '🟡 Alta (175-215%)'
    },
    {
      slotId: 2,
      characterName: 'Shenhe',
      baseFromSkills: 17.10,
      baseFromFav: 7.20,
      baseFromEnemies: 7.92,
      flatEnergy: 0.0,
      totalBaseEnergy: 32.22,
      neededFromParticles: 80.0,
      calculatedERPercent: '248.3%',
      safeERPercent: '285.5%',
      statusLabel: '🔴 Crítica (>215%)'
    },
    {
      slotId: 3,
      characterName: 'Kazuha',
      baseFromSkills: 15.30,
      baseFromFav: 9.60,
      baseFromEnemies: 8.16,
      flatEnergy: 0.0,
      totalBaseEnergy: 33.06,
      neededFromParticles: 60.0,
      calculatedERPercent: '181.5%',
      safeERPercent: '208.7%',
      statusLabel: '🟡 Alta (175-215%)'
    },
    {
      slotId: 4,
      characterName: 'Kokomi',
      baseFromSkills: 15.30,
      baseFromFav: 7.20,
      baseFromEnemies: 8.16,
      flatEnergy: 0.0,
      totalBaseEnergy: 30.66,
      neededFromParticles: 70.0,
      calculatedERPercent: '228.3%',
      safeERPercent: '262.6%',
      statusLabel: '🔴 Crítica (>215%)'
    }
  ]
};
