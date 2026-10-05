import { SavedTeam } from '../types/er';

export const ER_POPULAR_PRESETS: SavedTeam[] = [
  {
    id: 101,
    name: "Mavuika Natlan Burn/Melt (From Calc Sheet)",
    rotationTime: 20,
    enemyParts: 6,
    slots: [
      { id: 1, name: "Mavuika", e_uses: 1, funnel: "Dividir (50% Slot 3 / 50% Slot 4)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.50, use_burst: false },
      { id: 2, name: "Citlali", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.15, use_burst: true },
      { id: 3, name: "Iansan", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 12, onfield: 0.15, use_burst: true },
      { id: 4, name: "Bennett", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.20, use_burst: true }
    ]
  },
  {
    id: 102,
    name: "Flins Lunar Quicken (From Calc Sheet)",
    rotationTime: 18,
    enemyParts: 6,
    slots: [
      { id: 1, name: "Flins", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.55, use_burst: true },
      { id: 2, name: "Columbina", e_uses: 1, funnel: "Passar p/ Slot 1", fav: 1, fav_target: "Passar p/ Slot 1", flat: 0, onfield: 0.15, use_burst: true },
      { id: 3, name: "Ineffa", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.15, use_burst: true },
      { id: 4, name: "Sucrose", e_uses: 2, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.15, use_burst: true }
    ]
  },
  {
    id: 103,
    name: "Raiden National (Classic Dual-Carry)",
    rotationTime: 21,
    enemyParts: 6,
    slots: [
      { id: 1, name: "Raiden", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.45, use_burst: true },
      { id: 2, name: "Xiangling", e_uses: 1, funnel: "Fora de campo (Dividido)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.15, use_burst: true },
      { id: 3, name: "Xingqiu", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.15, use_burst: true },
      { id: 4, name: "Bennett", e_uses: 2, funnel: "Passar p/ Slot 2", fav: 1, fav_target: "Passar p/ Slot 2", flat: 0, onfield: 0.25, use_burst: true }
    ]
  },
  {
    id: 104,
    name: "Neuvillette Hypercarry",
    rotationTime: 20,
    enemyParts: 6,
    slots: [
      { id: 1, name: "Neuvillette", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.60, use_burst: true },
      { id: 2, name: "Furina", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 1, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.15, use_burst: true },
      { id: 3, name: "Kazuha", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 1, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.15, use_burst: true },
      { id: 4, name: "Zhongli", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 1, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.10, use_burst: false }
    ]
  },
  {
    id: 105,
    name: "Kinich Emilie Burning",
    rotationTime: 18,
    enemyParts: 6,
    slots: [
      { id: 1, name: "Kinich", e_uses: 2, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.55, use_burst: true },
      { id: 2, name: "Emilie", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.15, use_burst: true },
      { id: 3, name: "Bennett", e_uses: 1, funnel: "Passar p/ Slot 4", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.15, use_burst: true },
      { id: 4, name: "Xiangling", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 1, fav_target: "Passar p/ Slot 4", flat: 0, onfield: 0.15, use_burst: true }
    ]
  }
];
