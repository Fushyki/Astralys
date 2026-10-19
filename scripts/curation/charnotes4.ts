/** Notas, lote 4 (Charlotte a Varesa A1). Ver `charnotes.ts`. */
import type { CharacterNotes, NoteCuration } from './characters';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });
const NIGHTSOUL = 'Só pontos de Nightsoul (a mecânica de estado não muda o dano calculado).';

export const NOTES_4: CharacterNotes = {
  Charlotte: {
    p2: x('O bônus de DMG Cryo por aliado que não é de Fontaine (5%, 10%, 15%) não entra: o motor ainda não conhece a nação dos personagens de Fontaine.'),
    const1: u('Só cura.'), const6: x('O ataque coordenado do Monsieur Verite (180% do ATK) não entra.'),
  },
  Furina: {
    p1: u('Só cura.'),
    const1: x('Com a C1 o limite de Fanfare sobe para 400 (+100): o buff da equipe usa 300 e não acompanha.'),
    const4: u('Só energia.'),
    const6: x('O dano extra dos Normais, Carregados e Imersivos (18% do HP máximo) e a conversão para Hydro não entram.'),
  },
  Chevreuse: { const1: u('Só energia.'), const2: x('As 2 explosões em cadeia (120% do ATK cada, contam como habilidade) não entram.'), const4: u('Só recarga.') },
  Navia: { const1: u('Só energia e recarga.'), const2: x('O tiro de canhão do Singing Salute não entra.'), const6: x('O +45% de Dano Crítico por stack de Crystal Shrapnel acima de 3 não entra.') },
  Gaming: { p1: u('Só cura.'), const1: u('Só cura.'), const4: u('Só energia.') },
  Xianyun: { p2: x('O dano extra do Imersivo dos aliados (200% do ATK, até 9.000) não entra: o motor ainda não aceita dano fixo que vem de outro personagem.'), const1: u('Só cargas.'), const4: u('Só cura.') },
  Chiori: {
    p1: x('Os ataques coordenados do Tamoto (100% do Fluttering Hasode, contam como habilidade) e a infusão Geo não entram.'),
    const1: x('O Tamoto extra não entra.'), const2: x('O Kinu (170% do dano do Tamoto) não entra.'), const4: x('O Kinu dos Normais (dano extra) não entra.'),
  },
  Sigewinne: {
    p2: u('Só cura.'), const1: x('O bônus de dano por stack de Convalescence (1.000 de HP máximo por stack) não entra.'), const4: u('Só duração.'),
  },
  Arlecchino: {
    p1: u('Só Bond of Life e cura.'),
    const1: x('O aumento do Masque of the Red Death (+100% do ATK dos Normais) não entra: depende do valor do talento.'),
    const2: x('A explosão Balemoon Bloodfire (900% do ATK) não entra.'), const4: u('Só recarga e energia.'),
  },
  Sethos: { p1: u('Só tempo de carga.'), const6: u('Só energia.') },
  Clorinde: { const1: x('Os 2 ataques coordenados do Nightvigil Shade (30% do ATK, contam como Normal) não entram.') },
  Emilie: { p1: x('A explosão do Cleardew Cologne (600% do ATK) não entra.'), const4: u('Só duração.'), const6: x('O DMG extra dos Normais e Carregados (300% do ATK) e a conversão para Dendro não entram.') },
  Kachina: { const1: u('Só energia.'), const2: u(NIGHTSOUL), const6: x('A explosão ao quebrar o escudo (200% da DEF) não entra.') },
  Kinich: { p1: u(NIGHTSOUL), const6: x('O salto do Scalespiker Cannon (700% do ATK) não entra.') },
  Mualani: { p1: u(NIGHTSOUL), const2: u(NIGHTSOUL), const6: u('Só remove o limite de uso do C1 (aplicado como se fosse sempre) .') },
  Xilonen: { p2: u('Só gera o Nightsoul Burst (energia).'), const1: u('Só consumo de Nightsoul.'), const4: x('O Blooming Blessing dos aliados (65% da DEF dela nos Normais, Carregados e Imersivos deles) não entra: dano fixo que vem de outro personagem.') },
  Chasca: {
    p1: x('Os stacks de Spirit of the Radiant Shadow (+15%/35%/65% nos Shining Shadowhunt Shell) e a conversão de elemento dos tiros não entram.'),
    p2: x('O Burning Shadowhunt Shot (150% do dano do Shadowhunt Shell) não entra.'),
    const1: x('A conversão extra do 2º Shadowhunt Shell não entra.'),
    const2: x('O dano extra dos Shining Shadowhunt Shells não entra.'),
    const4: x('O dano extra dos Radiant Soulseeker Shells (400% do ATK, conta como Carregado) não entra.'),
    const6: x('O +120% de Dano Crítico dos tiros do Multitarget Fire depois da conversão não entra.'),
  },
  Ororon: {
    p1: u(NIGHTSOUL), p2: u('Só energia.'), const1: x('O +50% de dano do Hypersense (reação) não entra.'), const4: u('Só energia e velocidade do Oculus.'),
  },
  Mavuika: {
    const2: x('Os +200 de ATK base em Nightsoul, a redução de 20% de DEF do inimigo (forma Ring) e o dano extra dos Normais, Carregados e Sunfell Slice na forma Flamestrider não entram.'),
    const6: x('O Flamestrider extra (200% do ATK) e o anel do Supremo não entram.'),
  },
  Citlali: {
    p1: u('Já considerado na redução de RES (a energia de Nightsoul não muda o dano).'),
    const1: x('O dano extra dos Stellar Blade (200% da Maestria dela por golpe dos aliados) não entra: dano fixo que vem de outro personagem.'),
    const4: x('O Obsidian Spiritvessel Skull (1.800% da Maestria) não entra.'),
  },
  'Lan Yan': { p1: u('Só escudo.'), const1: u('Só anel extra.'), const2: u('Só escudo.'), const6: u('Só cargas.') },
  'Yumemizuki Mizuki': {
    p1: u('Só duração do Dreamdrifter.'),
    const1: x('O bônus de dano de Espalhar (reação) não entra.'), const4: u('Só cura e energia.'),
    const6: x('O crítico das reações de Espalhar e o bônus por Maestria não entram.'),
  },
  Iansan: { p2: u('Só cura.'), const1: u('Só energia.'), const4: u('Só stacks de Surging Force.') },
};
