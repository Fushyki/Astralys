/** Notas, lote 6 (Valeriy C4 ao Viajante). Ver `charnotes.ts`. */
import type { CharacterNotes, NoteCuration } from './characters';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });
const LUNAR = 'Depende das mecânicas Lunar, Estelar ou Moonsign, que o motor ainda não modela.';

const TRAVELER: Record<string, CharacterNotes[string]> = {
  Anemo: {
    p1: x('A lâmina de vento do último Normal (60% do ATK) não entra.'), p2: u('Só cura.'), const1: u('Só puxa inimigos.'), const4: u('Só redução de dano recebido.'),
  },
  Geo: {
    p1: u('Só recarga da habilidade.'), p2: x('O desabamento do último Normal (60% do ATK) não entra.'),
    const2: x('A explosão do meteorito (dano igual ao da Starfell Sword) não entra.'), const4: u('Só energia.'), const6: u('Só duração.'),
  },
  Electro: {
    p1: u('Só recarga da habilidade.'), p2: u('Só Recarga de Energia dos Abundance Amulets.'), const1: u('Só número de amuletos.'),
    const4: u('Só energia.'), const6: x('O Falling Thunder reforçado (200% do dano) não entra.'),
  },
  Hydro: {
    p1: u('Só cura.'), p2: x('O dano extra do Torrent Surge por HP consumido (45%, até 5.000) não entra.'),
    const1: u('Só energia.'), const2: u('Só bolha.'), const4: u('Só escudo.'), const6: u('Só cura.'),
  },
  Pyro: {
    p1: u('Só área das barreiras.'), p2: u('Só energia.'), const2: u('Só pontos de Nightsoul.'),
  },
  Cryo: {
    p1: x(`O dano extra dos Normais (80% do ATK) e a conversão para Cryo dependem do Radiance: Stellar-Conduct. ${LUNAR}`),
    const1: u('Só energia.'), const4: u('Só duração.'), const6: x(LUNAR),
  },
  Dendro: { const1: u('Só energia.'), const2: u('Só duração.'), const4: u('Só stacks de Overflowing Lotuslight.') },
};

const out: CharacterNotes = {
  Valeriy: { const4: u('Só limite de Impact Momentum.'), const6: x('Os +100% de dano do Carregado especial e dos Thunderburst Shells e o crítico do Electro não entram.') },
  Vodyanitsa: {
    p2: u('Os 25 stacks de Lead Vocal e 10 de Chorus já estão no dano fixo cadastrado dela.'),
  },
  Vesna: {
    p1: x('O dano extra dos Spirit Blades por stack não entra.'), p2: x(LUNAR), const1: u('Só uso extra da habilidade (e dano Estelar, que não entra).'),
    const4: x(LUNAR), const6: x('O Windborne Sword: Transpose (150% do ATK + 200% dos Spirit Blades) não entra.'),
  },
  Alyosha: { p1: u('Só cura.'), const1: u('Só energia.'), const2: u('Só duração e marca.'), const4: u('Só cura.') },
  Odette: {
    p1: x(LUNAR), p2: x(LUNAR), const1: x(LUNAR), const2: x(LUNAR), const4: x(LUNAR), const6: x(LUNAR),
  },
};
for (const who of ['Aether', 'Lumine']) {
  for (const [element, list] of Object.entries(TRAVELER)) out[`${who} (${element})`] = list;
}

export const NOTES_6: CharacterNotes = out;
