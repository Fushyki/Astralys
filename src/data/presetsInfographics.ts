import { InfographicCardData } from '../types/infographic';

export const PRESET_INFOGRAPHICS: InfographicCardData[] = [
  {
    teamName: "SANDRONE V1",
    carryArchetype: "SANDRONE",
    investmentBadge: "KQM Investment",
    statusTag: "STC (V1 OF BETA)",
    assumptions: "Assumes 5 field stacks avg",
    watermark: "ASTRALYS",
    characters: [
      {
        name: "Sandrone",
        constellation: "C0",
        element: "Cryo",
        damagePercentage: 52,
        damageRaw: 1670225.64,
        weapon: { name: "Tidal Shadow", refinement: "R5" },
        artifact: { setName: "Disenchant", erTarget: "102 ER" },
        mainStats: "ATK / ATK / CD",
        comboNotes: "CA E CA EQ CA E"
      },
      {
        name: "Qiqi",
        constellation: "C0",
        element: "Cryo",
        damagePercentage: 1,
        damageRaw: 6298.87,
        weapon: { name: "Favonius", refinement: "R5" },
        artifact: { setName: "Tenacity", erTarget: "100 ER" },
        mainStats: "ATK / CR"
      },
      {
        name: "Yae",
        constellation: "C1",
        element: "Electro",
        damagePercentage: 31,
        damageRaw: 701876.41,
        weapon: { name: "7.0 Craftable", refinement: "R5" },
        artifact: { setName: "Disenchant", erTarget: "100 ER" },
        mainStats: "ATK / ATK / CD"
      },
      {
        name: "Odette",
        constellation: "C0",
        element: "Cryo",
        damagePercentage: 16,
        damageRaw: 487931.25,
        weapon: { name: "Traveler Sig", refinement: "R1" },
        artifact: { setName: "Stella Supp", erTarget: "100 ER" },
        mainStats: "ATK / ATK / CR"
      }
    ],
    metrics: {
      dps: "189.1k",
      dpr: "3.88M",
      rotationDurationSeconds: 20.5
    },
    rotationNotation: "(20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E"
  },
  {
    teamName: "Stellar Fortress",
    carryArchetype: "WRIOTHESLEY",
    investmentBadge: "KQM Investment",
    statusTag: "STC (V1 OF BETA)",
    assumptions: "Assumes 5 field stacks avg",
    watermark: "ASTRALYS",
    characters: [
      {
        name: "Wriothesley",
        constellation: "C1",
        element: "Cryo",
        damagePercentage: 53,
        damageRaw: 1308604.60,
        weapon: { name: "The Widsith", refinement: "R5" },
        artifact: { setName: "Disenchant", erTarget: "100 ER" },
        mainStats: "ATK / ATK / CD",
        comboNotes: "1st rot: N1E 3N5C, All rots onwards: 3N5C N2"
      },
      {
        name: "Nicole",
        constellation: "C0",
        element: "Pyro",
        damagePercentage: 1,
        damageRaw: 10239.79,
        weapon: { name: "Flowing Purity", refinement: "R5" },
        artifact: { setName: "2p2p ATK", erTarget: "100 ER" },
        mainStats: "ATK"
      },
      {
        name: "Yae",
        constellation: "C1",
        element: "Electro",
        damagePercentage: 30,
        damageRaw: 1048791.93,
        weapon: { name: "7.0 Craftable", refinement: "R5" },
        artifact: { setName: "Disenchant", erTarget: "100 ER" },
        mainStats: "EM / ATK / CR"
      },
      {
        name: "Odette",
        constellation: "C0",
        element: "Cryo",
        damagePercentage: 16,
        damageRaw: 487931.25,
        weapon: { name: "Traveler Sig", refinement: "R1" },
        artifact: { setName: "Stella Supp", erTarget: "100 ER" },
        mainStats: "ATK / ATK / CR"
      }
    ],
    metrics: {
      dps: "181.8k",
      dpr: "3.73M",
      rotationDurationSeconds: 20.5
    },
    rotationNotation: "(20.5s) Odette EE Nicole E Yae EEE Wriothesley E N5C N5C N5 N2/N3C N5C"
  },
  {
    teamName: "Natlan Incarnate",
    carryArchetype: "MAVUIKA",
    investmentBadge: "KQM Investment",
    statusTag: "THEORY V1",
    watermark: "ASTRALYS",
    characters: [
      {
        name: "Mavuika",
        constellation: "C0",
        element: "Pyro",
        damagePercentage: 62,
        damageRaw: 2420000,
        weapon: { name: "Blazing Suns", refinement: "R1" },
        artifact: { setName: "Obsidian", erTarget: "100 ER" },
        mainStats: "ATK / Pyro / CD"
      },
      {
        name: "Citlali",
        constellation: "C0",
        element: "Cryo",
        damagePercentage: 12,
        damageRaw: 468000,
        weapon: { name: "TTDS", refinement: "R5" },
        artifact: { setName: "Instructor", erTarget: "165 ER" },
        mainStats: "EM / EM / EM"
      },
      {
        name: "Iansan",
        constellation: "C6",
        element: "Electro",
        damagePercentage: 18,
        damageRaw: 702000,
        weapon: { name: "Engulfing", refinement: "R1" },
        artifact: { setName: "Cinder City", erTarget: "180 ER" },
        mainStats: "ER / Electro / CR"
      },
      {
        name: "Bennett",
        constellation: "C6",
        element: "Pyro",
        damagePercentage: 8,
        damageRaw: 312000,
        weapon: { name: "Aquila Favonia", refinement: "R1" },
        artifact: { setName: "Noblesse", erTarget: "210 ER" },
        mainStats: "ER / HP / Healing"
      }
    ],
    metrics: {
      dps: "195.4k",
      dpr: "3.91M",
      rotationDurationSeconds: 20.0
    },
    rotationNotation: "(20.0s) Bennett QE > Iansan QE > Citlali E > Mavuika Q CA NA combo"
  },
  {
    teamName: "Lunar Quicken",
    carryArchetype: "FLINS",
    investmentBadge: "KQM Investment",
    statusTag: "THEORY V1",
    watermark: "ASTRALYS",
    characters: [
      {
        name: "Flins",
        constellation: "C0",
        element: "Electro",
        damagePercentage: 58,
        damageRaw: 1800000,
        weapon: { name: "Night of the Sky", refinement: "R1" },
        artifact: { setName: "Bloodsoaked", erTarget: "130 ER" },
        mainStats: "ATK / Electro / CD"
      },
      {
        name: "Columbina",
        constellation: "C0",
        element: "Hydro",
        damagePercentage: 22,
        damageRaw: 682000,
        weapon: { name: "Serenade", refinement: "R1" },
        artifact: { setName: "Nocturnes CC", erTarget: "160 ER" },
        mainStats: "EM / Hydro / CR"
      },
      {
        name: "Ineffa",
        constellation: "C0",
        element: "Electro",
        damagePercentage: 15,
        damageRaw: 465000,
        weapon: { name: "M Star", refinement: "R1" },
        artifact: { setName: "Fractured Halo", erTarget: "140 ER" },
        mainStats: "ATK / Electro / CR"
      },
      {
        name: "Sucrose",
        constellation: "C6",
        element: "Anemo",
        damagePercentage: 5,
        damageRaw: 155000,
        weapon: { name: "TTDS", refinement: "R5" },
        artifact: { setName: "Viridescent", erTarget: "175 ER" },
        mainStats: "EM / EM / EM"
      }
    ],
    metrics: {
      dps: "172.5k",
      dpr: "3.10M",
      rotationDurationSeconds: 18.0
    },
    rotationNotation: "(18.0s) Columbina EQ > Ineffa E > Sucrose EE Q > Flins E Q N3C*4"
  }
];
