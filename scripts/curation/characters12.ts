/**
 * Curadoria de passivas e constelações, lote 12 (Vodyanitsa, Alyosha, Viajante): fecha as lacunas da lista. Mesmas
 * regras de `characters.ts`.
 */
import type { BuffCuration } from './characters';

const traveler = (): BuffCuration[] => [];

export const CHARACTERS_16: Record<string, BuffCuration[]> = {
  Vodyanitsa: [
    { id: 'c1', label: 'Vodyanitsa C1', src: 'const1', scope: 'others', timed: true, convert: { from: 'hp', perPoint: { p: 0 }, to: ['atkFlat'] }, expect: 'increases the ATK of all nearby party members by 0.8% of her Max HP', note: 'ATK fixo dos aliados = 0,8% do HP máximo dela por 5 s a cada cura da Song of Ages Past: ligue na janela. É por isso que a build dela foca em HP.' },
    { id: 'c4', label: 'Vodyanitsa C4', src: 'const4', scope: 'self', timed: true, stats: { hpPct: { p: 2, x: 3 } }, expect: "Vodyanitsa's Max HP is increased by 20% for 6s", note: 'Assume 3 stacks (+60% de HP máximo): ligue na janela. O HP maior eleva todos os buffs dela que escalam com HP.' },
  ],
  Alyosha: [
    { id: 'a4s', label: 'Alyosha A4 (habilidade)', src: 'p2', scope: 'self', timed: false, convert: { from: 'er', perPoint: { p: 0, x: 100 }, cap: { lit: 0.7 }, to: ['skill'] }, expect: 'by 0.35% for every 1% of his Energy Recharge', note: '+0,35% de DMG da habilidade por 1% de Recarga, até 70% (com 200% de Recarga).' },
    { id: 'a4b', label: 'Alyosha A4 (Supremo)', src: 'p2', scope: 'self', timed: false, convert: { from: 'er', perPoint: { p: 0, x: 100 }, cap: { lit: 0.7 }, to: ['burst'] }, expect: 'by 0.35% for every 1% of his Energy Recharge', note: '+0,35% de DMG do Supremo por 1% de Recarga, até 70%.' },
    { id: 'c6', label: 'Alyosha C6', src: 'const6', scope: 'team', timed: true, stats: { em: { p: 0 } }, stacks: { max: 2, unit: "stacks de Hunter's Precision", levels: [{ lit: 0 }, { p: 0 }] }, expect: 'Elemental Mastery increased by 100', note: '+100 de Maestria de quem está no campo com 2 stacks de Hunter\'s Precision: ligue na janela.' },
  ],
  'Aether (Anemo)': traveler(),
};

/** Aether e Lumine compartilham as mesmas passivas e constelações por elemento. */
const BY_ELEMENT: Record<string, BuffCuration[]> = {
  Anemo: [
    { id: 'c2', label: 'Viajante C2', src: 'const2', scope: 'self', timed: false, stats: { er: { lit: 0.16 } }, expect: 'Increases Energy Recharge by 16%', note: '+16% de Recarga de Energia.' },
  ],
  Cryo: [
    { id: 'a4', label: 'Viajante A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'atk', perPoint: { p: 0 }, cap: { p: 1 }, to: ['em'] }, expect: "Elemental Mastery is increased by 8% of their ATK", note: 'Maestria = 8% do ATK, até 160.' },
    { id: 'c2', label: 'Viajante C2', src: 'const2', scope: 'team', timed: true, stats: { em: { p: 0 } }, expect: "active character's Elemental Mastery is increased by 60", note: '+60 de Maestria do personagem ativo por 5 s: ligue na janela.' },
  ],
  Dendro: [
    { id: 'a4s', label: 'Viajante A4 (habilidade)', src: 'p2', scope: 'self', timed: false, convert: { from: 'em', perPoint: { p: 0 }, to: ['skill'] }, expect: 'increases the DMG dealt by Razorgrass Blade by 0.15%', note: '+0,15% de DMG da habilidade (Razorgrass Blade) por ponto de Maestria.' },
    { id: 'a4b', label: 'Viajante A4 (Supremo)', src: 'p2', scope: 'self', timed: false, convert: { from: 'em', perPoint: { p: 1 }, to: ['burst'] }, expect: 'the DMG dealt by Surgent Manifestation by 0.1%', note: '+0,1% de DMG do Supremo (Surgent Manifestation) por ponto de Maestria.' },
  ],
  Pyro: [
    { id: 'c6', label: 'Viajante C6', src: 'const6', scope: 'self', timed: true, stats: { critDmgByType: { normal: { lit: 0.4 }, charged: { lit: 0.4 }, plunge: { lit: 0.4 } } }, expect: 'the CRIT DMG of these attacks is increased by 40%', note: '+40% de Dano Crítico de Normal, Carregado e Imersivo no Nightsoul\'s Blessing: ligue na janela. A conversão para Pyro não entra.' },
  ],
  Electro: [],
  Geo: [],
  Hydro: [],
};
for (const who of ['Aether', 'Lumine']) {
  for (const [element, list] of Object.entries(BY_ELEMENT)) {
    if (list.length) CHARACTERS_16[`${who} (${element})`] = list;
  }
}
delete CHARACTERS_16['Aether (Anemo)'];
CHARACTERS_16['Aether (Anemo)'] = BY_ELEMENT.Anemo;
