/**
 * Infographic Card fixtures strictly conforming to images.jfif and PROJECT.md contract.
 * Uses official Astralys Suite branding ("ASTRALYS SUITE").
 */

export interface CardCharacter {
  name: string;
  constellation: string; // "C0", "C1", "C6"
  element: 'Pyro' | 'Hydro' | 'Cryo' | 'Electro' | 'Anemo' | 'Geo' | 'Dendro';
  damagePercentage: number;
  damageRaw?: number;
  weapon: {
    name: string;
    refinement: string; // "R1" - "R5"
  };
  artifact: {
    setName: string;
    erTarget: string; // e.g. "102 ER"
  };
  mainStats: string; // e.g. "ATK / ATK / CD"
}

export interface CardData {
  teamName: string;
  carryArchetype: string;
  investmentBadge: string;
  characters: CardCharacter[];
  metrics: {
    dps: number | string;
    dpr: number | string;
    rotationDurationSeconds?: number;
  };
  rotationNotation: string;
  watermark: string;
}

export const FIXTURE_CARD_SANDRONE: CardData = {
  teamName: 'SANDRONE V1',
  carryArchetype: 'SANDRONE',
  investmentBadge: 'KQM Investment',
  characters: [
    {
      name: 'Sandrone',
      constellation: 'C0',
      element: 'Cryo',
      damagePercentage: 52.0,
      damageRaw: 1670225,
      weapon: { name: 'Tidal', refinement: 'R5' },
      artifact: { setName: 'Disenchant', erTarget: '102 ER' },
      mainStats: 'ATK / ATK / CD'
    },
    {
      name: 'Qiqi',
      constellation: 'C0',
      element: 'Cryo',
      damagePercentage: 1.0,
      damageRaw: 6298,
      weapon: { name: 'Favonius', refinement: 'R5' },
      artifact: { setName: 'Tenacity', erTarget: '100 ER' },
      mainStats: 'ATK / CR'
    },
    {
      name: 'Yae',
      constellation: 'C1',
      element: 'Electro',
      damagePercentage: 31.0,
      damageRaw: 701876,
      weapon: { name: 'Widsith', refinement: 'R5' },
      artifact: { setName: 'Disenchant', erTarget: '100 ER' },
      mainStats: 'EM / ATK / CR'
    },
    {
      name: 'Odette',
      constellation: 'C0',
      element: 'Cryo',
      damagePercentage: 16.0,
      damageRaw: 487931,
      weapon: { name: 'Craftable', refinement: 'R5' },
      artifact: { setName: 'Stella Supp', erTarget: '100 ER' },
      mainStats: 'ATK / ATK / CR'
    }
  ],
  metrics: {
    dps: '189.1k',
    dpr: '3.88M',
    rotationDurationSeconds: 20.5
  },
  rotationNotation: '(20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E',
  watermark: 'ASTRALYS'
};

export const FIXTURE_CARD_WRIOTHESLEY: CardData = {
  teamName: 'STELLAR FORTRESS',
  carryArchetype: 'WRIOTHESLEY',
  investmentBadge: 'KQM Investment',
  characters: [
    {
      name: 'Wrio',
      constellation: 'C0',
      element: 'Cryo',
      damagePercentage: 45.83,
      damageRaw: 1308604,
      weapon: { name: 'Widsith', refinement: 'R5' },
      artifact: { setName: '4p Shadow', erTarget: '110 ER' },
      mainStats: 'ATK / Cryo / CD'
    },
    {
      name: 'Yae',
      constellation: 'C1',
      element: 'Electro',
      damagePercentage: 36.73,
      damageRaw: 1048791,
      weapon: { name: 'Craftable', refinement: 'R5' },
      artifact: { setName: '4p Shadow', erTarget: '120 ER' },
      mainStats: 'ATK / Electro / CR'
    },
    {
      name: 'Odette',
      constellation: 'C0',
      element: 'Cryo',
      damagePercentage: 17.09,
      damageRaw: 487931,
      weapon: { name: 'HoD', refinement: 'R5' },
      artifact: { setName: '4p 7.0 Supp', erTarget: '130 ER' },
      mainStats: 'HP / Hydro / CR'
    },
    {
      name: 'Nicole',
      constellation: 'C0',
      element: 'Pyro',
      damagePercentage: 0.36,
      damageRaw: 10239,
      weapon: { name: 'Flowing Purity', refinement: 'R5' },
      artifact: { setName: '2p2p Atk', erTarget: '160 ER' },
      mainStats: 'ER / ATK / CR'
    }
  ],
  metrics: {
    dps: '168.0k',
    dpr: '2.86M',
    rotationDurationSeconds: 17.0
  },
  rotationNotation: 'Nicole E > Yae EEE > Odette Q/E E > > Wrio Combo',
  watermark: 'ASTRALYS'
};
