/**
 * Astralys - Comprehensive Weapons Database
 * Includes Level 90 stats (Base ATK, Substat Type and Value), Rarities, Passives, and community aliases.
 */

export interface WeaponData {
  name: string;
  type: 'Sword' | 'Claymore' | 'Polearm' | 'Catalyst' | 'Bow';
  rarity: 3 | 4 | 5;
  baseAtk: number;
  subStatType: 'CR' | 'CD' | 'ATK%' | 'EM' | 'ER%' | 'HP%' | 'DEF%' | 'Physical%';
  subStatValue: number;
  passiveName: string;
  passiveEffect: string;
  aliases?: string[];
}

export const WEAPONS_DATABASE: WeaponData[] = [
  // ==========================================
  // SWORDS
  // ==========================================
  {
    name: 'Mistsplitter Reforged',
    type: 'Sword',
    rarity: 5,
    baseAtk: 674,
    subStatType: 'CD',
    subStatValue: 44.1,
    passiveName: "Mistsplitter's Edge",
    passiveEffect: 'Ganha 12% de bônus de dano elemental para todos os elementos e acumula Emblemas Mistsplitter para até 28% de bônus elemental.',
    aliases: ['Mistsplitter', 'Reforged', 'Cortadora da Neblina']
  },
  {
    name: 'Aquila Favonia',
    type: 'Sword',
    rarity: 5,
    baseAtk: 674,
    subStatType: 'Physical%',
    subStatValue: 41.3,
    passiveName: 'Bane of the Falcon',
    passiveEffect: 'Aumenta ATK em 20%. Ao sofrer dano, cura HP baseado em ATK e causa 200% de dano em área.',
    aliases: ['Falção', 'Falcão', 'Aquila', 'Aquila Favônia']
  },
  {
    name: 'Absolution',
    type: 'Sword',
    rarity: 5,
    baseAtk: 674,
    subStatType: 'CD',
    subStatValue: 44.1,
    passiveName: 'Climax of Truth',
    passiveEffect: 'Dano Crítico +20%. Ao aumentar o valor de um Vínculo da Vida, aumenta o Dano em 16% por 6s.',
    aliases: ['Clorinde Sig', 'Absolvição']
  },
  {
    name: 'Light of Foliar Incision',
    type: 'Sword',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'CD',
    subStatValue: 88.2,
    passiveName: 'Whitemoon Brillance',
    passiveEffect: 'Taxa Crítica +4%. Ao causar Dano Elemental com Ataque Normal, o dano de NA e E aumenta em 120% da EM.',
    aliases: ['Foliar', 'Alhaitham Sig', 'Luz das Folhas Cortadas']
  },
  {
    name: 'Haran Geppaku Futsu',
    type: 'Sword',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'CR',
    subStatValue: 33.1,
    passiveName: 'Haidu Style',
    passiveEffect: 'Bônus de dano de todos os elementos +12%. Membros da equipe fornecem stacks que aumentam o dano de NA em 20%/stack.',
    aliases: ['Haran', 'Ayato Sig', 'Míngua do Plenilúnio']
  },
  {
    name: 'Primordial Jade Cutter',
    type: 'Sword',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'CR',
    subStatValue: 44.1,
    passiveName: "Protector's Virtue",
    passiveEffect: 'HP aumenta em 20%. Fornece bônus de ATK correspondente a 1.2% do HP Máximo.',
    aliases: ['PJC', 'Jade Cutter', 'Espada de Jade']
  },
  {
    name: 'Freedom-Sworn',
    type: 'Sword',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'EM',
    subStatValue: 198,
    passiveName: 'Revolutionary Chorale',
    passiveEffect: 'Dano causado +10%. Ao desencadear reações elementais, concede +20% ATK e +16% de dano de NA/CA/Plunge à equipe.',
    aliases: ['Kazuha Sig', 'Juramento pela Liberdade']
  },
  {
    name: 'Peak Patrol Song',
    type: 'Sword',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'DEF%',
    subStatValue: 82.7,
    passiveName: 'Passage Song',
    passiveEffect: 'Ganha bônus de DEF. Ao acertar Ataques Normais ou Mergulhantes, concede bônus de dano de todos os elementos aos membros da equipe.',
    aliases: ['Xilonen Sig', 'Canção da Patrulha do Pico']
  },
  {
    name: 'Uraku Misugiri',
    type: 'Sword',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'CD',
    subStatValue: 88.2,
    passiveName: 'Brocade Bloom',
    passiveEffect: 'Dano de Ataque Normal +16%, Dano de Habilidade Elemental +24%. Dobra o efeito após causar Dano Geo.',
    aliases: ['Chiori Sig']
  },
  {
    name: 'Splendor of Tranquil Waters',
    type: 'Sword',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'CD',
    subStatValue: 88.2,
    passiveName: 'Dawn and Dusk of the Lake',
    passiveEffect: 'Quando o HP do personagem varia, Dano da Habilidade Elemental +8% (até 3 stacks). Se o HP dos colegas variar, HP Máx +14%.',
    aliases: ['Furina Sig', 'Splendor', 'Esplendor das Águas Silenciosas']
  },
  {
    name: 'Key of Khaj-Nisut',
    type: 'Sword',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'HP%',
    subStatValue: 66.2,
    passiveName: 'Sunken Song of the Sands',
    passiveEffect: 'HP +20%. Acertos da Habilidade Elemental concedem EM proporcional ao HP Máximo para o usuário e para a equipe.',
    aliases: ['Key', 'Nilou Sig', 'Chave de Khaj-Nisut']
  },
  {
    name: 'Skyward Blade',
    type: 'Sword',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'ER%',
    subStatValue: 55.1,
    passiveName: 'Sky-Piercing Fang',
    passiveEffect: 'Taxa Crítica +4%. Ao usar o Supremo, ganha velocidade de movimento e ATK adicional em ataques normais e carregados.',
    aliases: ['Skyward Sword', 'Espada Celestial']
  },
  {
    name: 'Summit Shaper',
    type: 'Sword',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'ATK%',
    subStatValue: 49.6,
    passiveName: 'Golden Majesty',
    passiveEffect: 'Força de escudo +20%. Acertos aumentam ATK em 4% (acumula 5 vezes). Efeito dobrado sob proteção de escudo.',
    aliases: ['Espada Cortadora de Vértices']
  },
  {
    name: 'Favonius Sword',
    type: 'Sword',
    rarity: 4,
    baseAtk: 454,
    subStatType: 'ER%',
    subStatValue: 61.3,
    passiveName: 'Windfall',
    passiveEffect: 'Acertos críticos têm 100% de chance de gerar 3 partículas elementais brancas (6 de energia neutra).',
    aliases: ['Fav Sword', 'Espada de Favonius', 'Favonius']
  },
  {
    name: 'Sacrificial Sword',
    type: 'Sword',
    rarity: 4,
    baseAtk: 454,
    subStatType: 'ER%',
    subStatValue: 61.3,
    passiveName: 'Composed',
    passiveEffect: 'Ao causar dano com Habilidade Elemental, tem 80% de chance de redefinir imediatamente o tempo de recarga.',
    aliases: ['Sac Sword', 'Espada do Sacrifício', 'Sacrificial']
  },
  {
    name: 'The Black Sword',
    type: 'Sword',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'CR',
    subStatValue: 27.6,
    passiveName: 'Justice',
    passiveEffect: 'Aumenta o dano causado por Ataques Normais e Carregados em 20%. Regenera HP proporcional a 60% do ATK em Críticos.',
    aliases: ['Black Sword', 'Espada Negra']
  },
  {
    name: 'Wolf-Fang',
    type: 'Sword',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'CR',
    subStatValue: 27.6,
    passiveName: 'Northwind Wolf',
    passiveEffect: 'Dano de Habilidade Elemental e Supremo +16%. Ao acertar, ganha +2% de Taxa Crítica por acerto (acumula até 4 vezes).',
    aliases: ['Wolf Fang', 'Canino Lupino']
  },
  {
    name: 'Amenoma Kageuchi',
    type: 'Sword',
    rarity: 4,
    baseAtk: 454,
    subStatType: 'ATK%',
    subStatValue: 55.1,
    passiveName: 'Iwakura Succession',
    passiveEffect: 'Gera Sementes de Sucessão ao usar a Habilidade Elemental. Ao usar o Supremo, recupera até 12 de energia por semente.',
    aliases: ['Amenoma']
  },
  {
    name: 'Iron Sting',
    type: 'Sword',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'EM',
    subStatValue: 165,
    passiveName: 'Infusion Stinger',
    passiveEffect: 'Causar Dano Elemental aumenta todo o dano em 6% por 6s (acumula 2 vezes).',
    aliases: ['Espinho de Ferro']
  },
  {
    name: 'Toukabou Shigure',
    type: 'Sword',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'EM',
    subStatValue: 165,
    passiveName: 'Kaidan: Rain-Tied Umbrella',
    passiveEffect: 'Ao atingir o inimigo com um ataque, aplica estado Guarda-Chuva Maldito aumentando o dano contra ele em 32%.',
    aliases: ['Shigure', 'Umbrella', 'Guarda-chuva']
  },
  {
    name: 'Fleuve Cendre Ferryman',
    type: 'Sword',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'ER%',
    subStatValue: 45.9,
    passiveName: 'Ironbone',
    passiveEffect: 'Taxa Crítica da Habilidade Elemental +16%. Além disso, após usar a Habilidade, aumenta a Recarga de Energia em 32% por 5s.',
    aliases: ['Pipe', 'Cano de Fontaine', 'Fleuve Cendre']
  },
  {
    name: 'Finale of the Deep',
    type: 'Sword',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'ATK%',
    subStatValue: 27.6,
    passiveName: 'An End Sublime',
    passiveEffect: 'Ao usar Habilidade Elemental, ATK +12% e concede Vínculo da Vida de 25% do HP Máx. Ao limpá-lo, concede até 300 de ATK.',
    aliases: ['Final do Profundo']
  },
  {
    name: "Xiphos' Moonlight",
    type: 'Sword',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'EM',
    subStatValue: 165,
    passiveName: "Jinni's Whisper",
    passiveEffect: 'Converte EM em Recarga de Energia para o portador (0.072% por ponto de EM) e concede 30% desse bônus para a equipe.',
    aliases: ['Xiphos', 'Luar de Xiphos']
  },
  {
    name: "Lion's Roar",
    type: 'Sword',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'ATK%',
    subStatValue: 41.3,
    passiveName: 'Bane of Fire and Thunder',
    passiveEffect: 'Aumenta o dano contra inimigos afetados por Pyro ou Electro em 36%.',
    aliases: ['Lions Roar', 'Rugido do Leão']
  },
  {
    name: 'The Flute',
    type: 'Sword',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'ATK%',
    subStatValue: 41.3,
    passiveName: 'Chord',
    passiveEffect: 'Acertos concedem harmônicos; com 5 harmônicos, causa 200% de ATK em dano em área.',
    aliases: ['Flauta']
  },
  {
    name: 'The Alley Flash',
    type: 'Sword',
    rarity: 4,
    baseAtk: 620,
    subStatType: 'EM',
    subStatValue: 55,
    passiveName: 'Itinerant Hero',
    passiveEffect: 'Aumenta todo o dano causado pelo personagem em 24%. Desativa por 5s ao sofrer dano.',
    aliases: ['Alley Flash', 'Brilho do Beco']
  },
  {
    name: 'Flute of Ezpitzal',
    type: 'Sword',
    rarity: 4,
    baseAtk: 454,
    subStatType: 'DEF%',
    subStatValue: 69.0,
    passiveName: 'Smoke-Mirror Mystery',
    passiveEffect: 'Ao usar Habilidade Elemental, aumenta a DEF em até 32% por 15s.',
    aliases: ['Ezpitzal', 'Flauta de Ezpitzal']
  },
  {
    name: 'Harbinger of Dawn',
    type: 'Sword',
    rarity: 3,
    baseAtk: 401,
    subStatType: 'CD',
    subStatValue: 46.9,
    passiveName: 'Vigorous',
    passiveEffect: 'Quando o HP estiver acima de 90%, a Taxa Crítica aumenta em 28%.',
    aliases: ['HoD', 'Prenúncio da Alvorada']
  },

  // ==========================================
  // CLAYMORES
  // ==========================================
  {
    name: 'A Thousand Blazing Suns',
    type: 'Claymore',
    rarity: 5,
    baseAtk: 674,
    subStatType: 'CR',
    subStatValue: 22.1,
    passiveName: 'Dawn of the Unconquered Sun',
    passiveEffect: 'Aumenta ATK e Dano Elemental em 24% após Nightsoul Burst; concede acúmulos adicionais ao ativar reações Pyro.',
    aliases: ['Blazing Suns', 'Suns', 'Mavuika Sig', 'Mil Sóis Flamejantes']
  },
  {
    name: 'Verdict',
    type: 'Claymore',
    rarity: 5,
    baseAtk: 674,
    subStatType: 'CR',
    subStatValue: 22.1,
    passiveName: 'Many Oaths Dawned',
    passiveEffect: 'ATK +20%. Coletar fragmentos de Cristalização concede Selos que aumentam o dano da Habilidade Elemental em 18% cada.',
    aliases: ['Navia Sig', 'Veredito']
  },
  {
    name: 'Beacon of the Reed Sea',
    type: 'Claymore',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'CR',
    subStatValue: 33.1,
    passiveName: 'Desert Watch',
    passiveEffect: 'Ao acertar a Habilidade Elemental, ATK +20%. Ao sofrer dano, ATK +20%. Sem escudo, HP Máx +32%.',
    aliases: ['Beacon', 'Dehya Sig', 'Sinal dos Mares de Juncos']
  },
  {
    name: 'Redhorn Stonethresher',
    type: 'Claymore',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'CD',
    subStatValue: 88.2,
    passiveName: 'Gokadaiou Otogibanashi',
    passiveEffect: 'DEF +28%. Dano de Ataque Normal e Ataque Carregado é aumentado em 40% da DEF.',
    aliases: ['Redhorn', 'Itto Sig', 'Chifre Vermelho']
  },
  {
    name: "Wolf's Gravestone",
    type: 'Claymore',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'ATK%',
    subStatValue: 49.6,
    passiveName: 'Wolfish Tracker',
    passiveEffect: 'ATK +20%. Ao atacar inimigos com menos de 30% de HP, aumenta o ATK de todos os membros da equipe em 40% por 12s.',
    aliases: ['WGS', 'Wolf Gravestone', 'Túmulo do Lobo']
  },
  {
    name: 'Song of Broken Pines',
    type: 'Claymore',
    rarity: 5,
    baseAtk: 741,
    subStatType: 'Physical%',
    subStatValue: 20.7,
    passiveName: "Rebel's Banner-Hymn",
    passiveEffect: 'ATK +16%. Acertos concedem Sigilos que, ao atingir 4, concedem 12% de ATK Speed e 20% de ATK para a equipe.',
    aliases: ['SoBP', 'Broken Pines', 'Canção dos Pinhos', 'Eula Sig']
  },
  {
    name: 'Skyward Pride',
    type: 'Claymore',
    rarity: 5,
    baseAtk: 674,
    subStatType: 'ER%',
    subStatValue: 36.8,
    passiveName: 'Sky-ripping Dragon Spine',
    passiveEffect: 'Aumenta todo o dano em 8%. Após o Supremo, golpes normais disparam lâminas de vácuo causando 80% de ATK em área.',
    aliases: ['Orgulho Celestial']
  },
  {
    name: 'The Unforged',
    type: 'Claymore',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'ATK%',
    subStatValue: 49.6,
    passiveName: 'Golden Majesty',
    passiveEffect: 'Força de escudo +20%. Acertos aumentam ATK em 4% (acumula 5 vezes). Efeito dobrado com escudo ativo.',
    aliases: ['Unforged', 'Espada Áspera']
  },
  {
    name: 'Serpent Spine',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'CR',
    subStatValue: 27.6,
    passiveName: 'Wavesplitter',
    passiveEffect: 'A cada 4s em campo, o personagem causa 6% (até 30% em R1 / 50% em R5) a mais de dano, mas recebe mais dano. Perde acúmulo ao ser atingido.',
    aliases: ['Spine', 'SS', 'Espinha da Serpente']
  },
  {
    name: 'Tidal Shadow',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'ATK%',
    subStatValue: 41.3,
    passiveName: 'White Wave Fold',
    passiveEffect: 'Após receber cura, o ATK aumenta em 24% (até 48% em R5) por 8s. Funciona mesmo fora de campo.',
    aliases: ['Tidal', 'Sombra da Maré']
  },
  {
    name: 'Earth Shaker',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'ATK%',
    subStatValue: 27.6,
    passiveName: 'Oath of the Earth',
    passiveEffect: 'Após desencadear uma Reação Pyro, o Dano da Habilidade Elemental aumenta em 16% (até 32% em R5) por 8s.',
    aliases: ['Abalador da Terra', 'Earthshaker']
  },
  {
    name: 'Talking Stick',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'CR',
    subStatValue: 18.4,
    passiveName: 'The Five Dignities',
    passiveEffect: 'Ganha ATK ao ser afetado por Pyro; ganha Bônus Elemental ao ser afetado por Hydro, Cryo, Electro ou Dendro.',
    aliases: ['Bastão Falante']
  },
  {
    name: 'Mailed Flower',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'EM',
    subStatValue: 110,
    passiveName: 'Whispers of Wind and Flower',
    passiveEffect: 'Acertar a Habilidade Elemental ou desencadear reações concede +24% de ATK e +96 de EM por 8s.',
    aliases: ['Flor de Ferro', 'Mailed Flower']
  },
  {
    name: 'Favonius Greatsword',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 454,
    subStatType: 'ER%',
    subStatValue: 61.3,
    passiveName: 'Windfall',
    passiveEffect: 'Acertos críticos geram 3 partículas elementais incolores (6 de energia) a cada 6s.',
    aliases: ['Fav Greatsword', 'Espadão de Favonius']
  },
  {
    name: 'Sacrificial Greatsword',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'ER%',
    subStatValue: 30.6,
    passiveName: 'Composed',
    passiveEffect: 'Tem 80% de chance de redefinir o tempo de recarga da Habilidade Elemental ao acertar um oponente.',
    aliases: ['Sac Greatsword', 'Espadão do Sacrifício']
  },
  {
    name: 'Akuoumaru',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'ATK%',
    subStatValue: 41.3,
    passiveName: 'Watatsumi Wavewalker',
    passiveEffect: 'Aumenta o dano do Supremo baseado no limite de Energia de todos os membros da equipe (até 80%).',
    aliases: ['Akuou']
  },
  {
    name: 'Luxurious Sea-Lord',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 454,
    subStatType: 'ATK%',
    subStatValue: 55.1,
    passiveName: 'Oceanic Victory',
    passiveEffect: 'Dano do Supremo +24%. Ao acertar, invoca um cardume de atuns que causa 200% de ATK em área.',
    aliases: ['Fish Claymore', 'Lord do Mar', 'Peixe']
  },
  {
    name: 'Katsuragikiri Nagamasa',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'ER%',
    subStatValue: 45.9,
    passiveName: 'Samurai Conduct',
    passiveEffect: 'Aumenta o dano da Habilidade Elemental em 12%. Recupera 15 de energia ao longo de 6s.',
    aliases: ['Katsuragi', 'Nagamasa']
  },
  {
    name: 'Blackcliff Slasher',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'CD',
    subStatValue: 55.1,
    passiveName: 'Press the Advantage',
    passiveEffect: 'Derrotar um inimigo aumenta o ATK em 12% por 30s (acumula até 3 vezes).',
    aliases: ['Blackcliff']
  },
  {
    name: 'Whiteblind',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'DEF%',
    subStatValue: 51.7,
    passiveName: 'Infusion Blade',
    passiveEffect: 'Ao acertar Ataques Normais ou Carregados, ATK e DEF aumentam em 6% por 6s (acumula 4 vezes).',
    aliases: ['Sombra Branca']
  },
  {
    name: 'Rainslasher',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'EM',
    subStatValue: 165,
    passiveName: 'Bane of Storm and Tide',
    passiveEffect: 'Aumenta o dano contra inimigos afetados por Hydro ou Electro em 36%.',
    aliases: ['Segadeira da Chuva']
  },
  {
    name: 'Snow-Tombed Starsilver',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'Physical%',
    subStatValue: 34.5,
    passiveName: 'Frostburial',
    passiveEffect: 'Acertos têm chance de soltar um cristal de gelo causando dano físico.',
    aliases: ['Estrela de Prata']
  },
  {
    name: 'Prototype Archaic',
    type: 'Claymore',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'ATK%',
    subStatValue: 27.6,
    passiveName: 'Crush',
    passiveEffect: 'Ataques têm 50% de chance de causar 480% de ATK de dano adicional em área pequena.',
    aliases: ['Protótipo Arcaico', 'Archaic']
  },

  // ==========================================
  // POLEARMS
  // ==========================================
  {
    name: 'Engulfing Lightning',
    type: 'Polearm',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'ER%',
    subStatValue: 55.1,
    passiveName: 'Timeless Dream: Eternal Stove',
    passiveEffect: 'O ATK aumenta em 28% do valor de Recarga de Energia acima de 100%. Concede +30% de Recarga após usar o Supremo.',
    aliases: ['Engulfin', 'Raiden Sig', 'Luz do Cortador de Grama', 'Engulfing']
  },
  {
    name: 'Staff of Homa',
    type: 'Polearm',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'CD',
    subStatValue: 66.2,
    passiveName: 'Reckless Cinnabar',
    passiveEffect: 'HP aumenta em 20%. Fornece bônus de ATK baseado em 0.8% do HP Máx (aumenta para 1.8% quando HP < 50%).',
    aliases: ['Homa', 'Hu Tao Sig', 'Báculo de Homa']
  },
  {
    name: 'Primordial Jade Winged-Spear',
    type: 'Polearm',
    rarity: 5,
    baseAtk: 674,
    subStatType: 'CR',
    subStatValue: 22.1,
    passiveName: 'Eagle Spear of Justice',
    passiveEffect: 'Ao acertar, aumenta o ATK em 3.2% por 6s (máximo 7 acúmulos). No máximo de acúmulos, o dano aumenta em 12%.',
    aliases: ['PJWS', 'Jade Spear', 'Lança de Jade', 'Xiao Sig']
  },
  {
    name: 'Staff of the Scarlet Sands',
    type: 'Polearm',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'CR',
    subStatValue: 44.1,
    passiveName: "Heat Haze at Horizon's End",
    passiveEffect: 'Fornece bônus de ATK de 52% da Proficiência Elemental. Ao atingir com Habilidade Elemental, acumula bônus extra de EM em ATK.',
    aliases: ['Scarlet Sands', 'Cyno Sig', 'Báculo das Areias Escarlates']
  },
  {
    name: 'Calamity Queller',
    type: 'Polearm',
    rarity: 5,
    baseAtk: 741,
    subStatType: 'ATK%',
    subStatValue: 16.5,
    passiveName: 'Extinguishing Precept',
    passiveEffect: 'Ganha 12% de bônus elemental. Acumula bônus de ATK a cada segundo, efeito dobrado quando o portador está fora de campo.',
    aliases: ['Shenhe Sig', 'Subjugadora de Calamidades']
  },
  {
    name: "Crimson Moon's Semblance",
    type: 'Polearm',
    rarity: 5,
    baseAtk: 674,
    subStatType: 'CR',
    subStatValue: 22.1,
    passiveName: "Ashen Sun's Shadow",
    passiveEffect: 'Concede Vínculo da Vida ao acertar Ataque Carregado. Enquanto tiver Vínculo, todo dano aumenta em até 36%.',
    aliases: ['Arlecchino Sig', 'Semblance', 'Semblante da Lua Carmesim']
  },
  {
    name: 'Lumidouce Elegy',
    type: 'Polearm',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'CR',
    subStatValue: 33.1,
    passiveName: 'Bright Dawn Overture',
    passiveEffect: 'ATK +15%. Ao causar Queimadura em inimigos, aumenta o dano causado em 18% e recupera energia elemental.',
    aliases: ['Emilie Sig', 'Elegia de Lumidouce']
  },
  {
    name: 'Vortex Vanquisher',
    type: 'Polearm',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'ATK%',
    subStatValue: 49.6,
    passiveName: 'Golden Majesty',
    passiveEffect: 'Força do escudo +20%. Golpes aumentam ATK em 4% (5 stacks). Efeito dobrado sob proteção de escudo.',
    aliases: ['Perfuradora de Nuvem', 'Zhongli Sig']
  },
  {
    name: 'Skyward Spine',
    type: 'Polearm',
    rarity: 5,
    baseAtk: 674,
    subStatType: 'ER%',
    subStatValue: 36.8,
    passiveName: 'Black Wing',
    passiveEffect: 'Taxa Crítica +8% e Velocidade de Ataque Normal +12%. Ataques criam lâminas de vácuo.',
    aliases: ['Espinha Celestial']
  },
  {
    name: 'The Catch',
    type: 'Polearm',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'ER%',
    subStatValue: 45.9,
    passiveName: 'Shanty',
    passiveEffect: 'Aumenta o Dano do Supremo em 32% e a Taxa Crítica do Supremo em 12% (em R5).',
    aliases: ['Catch', 'Fisgada', 'A Fisgada']
  },
  {
    name: 'Favonius Lance',
    type: 'Polearm',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'ER%',
    subStatValue: 30.6,
    passiveName: 'Windfall',
    passiveEffect: 'Acertos críticos têm chance de gerar 3 partículas incolores (6 de energia para a equipe).',
    aliases: ['Fav Lance', 'Lança de Favonius']
  },
  {
    name: "Dragon's Bane",
    type: 'Polearm',
    rarity: 4,
    baseAtk: 454,
    subStatType: 'EM',
    subStatValue: 221,
    passiveName: 'Bane of Flame and Water',
    passiveEffect: 'Aumenta o dano contra inimigos afetados por Hydro ou Pyro em até 36%.',
    aliases: ['Dragons Bane', 'Perdição do Dragão']
  },
  {
    name: 'Ballad of the Fjords',
    type: 'Polearm',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'CR',
    subStatValue: 27.6,
    passiveName: 'Tales of the Tundra',
    passiveEffect: 'Quando a equipe possui pelo menos 3 tipos elementais diferentes, aumenta a Proficiência Elemental em 240 (em R5).',
    aliases: ['Fjords', 'Balada dos Fiordes']
  },
  {
    name: 'Deathmatch',
    type: 'Polearm',
    rarity: 4,
    baseAtk: 454,
    subStatType: 'CR',
    subStatValue: 36.8,
    passiveName: 'Gladiator',
    passiveEffect: 'Se houver pelo menos 2 inimigos por perto, ATK e DEF aumentam em 24%. Se houver menos de 2, ATK aumenta em 32%.',
    aliases: ['Duelo de Lanças']
  },
  {
    name: 'Rightful Reward',
    type: 'Polearm',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'HP%',
    subStatValue: 27.6,
    passiveName: 'Tip of the Spear',
    passiveEffect: 'Ao receber cura, recupera 16 de energia elemental a cada 10s.',
    aliases: ['Recompensa Justa']
  },
  {
    name: "Wavebreaker's Fin",
    type: 'Polearm',
    rarity: 4,
    baseAtk: 620,
    subStatType: 'ATK%',
    subStatValue: 13.8,
    passiveName: 'Watatsumi Wavewalker',
    passiveEffect: 'Aumenta o dano do Supremo com base na capacidade máxima de energia da equipe toda.',
    aliases: ['Barbatana do Quebra-Ondas']
  },
  {
    name: 'Prospector\'s Drill',
    type: 'Polearm',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'ATK%',
    subStatValue: 27.6,
    passiveName: 'Masons\' Ditty',
    passiveEffect: 'Receber cura concede símbolos de solidariedade aumentando ATK e Dano Elemental.',
    aliases: ['Broca de Prospecção']
  },
  {
    name: 'Mountain-Bracing Bolt',
    type: 'Polearm',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'ER%',
    subStatValue: 30.6,
    passiveName: 'Sundered Spine',
    passiveEffect: 'Aumenta o dano de Habilidade Elemental ao usar Nightsoul.',
    aliases: ['Parafuso das Montanhas']
  },
  {
    name: 'Kitain Cross Spear',
    type: 'Polearm',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'EM',
    subStatValue: 110,
    passiveName: 'Samurai Conduct',
    passiveEffect: 'Dano de Habilidade Elemental +12%. Recupera energia para o portador mesmo fora de campo.',
    aliases: ['Kitain', 'Lança Cruzada de Kitain']
  },
  {
    name: 'Black Tassel',
    type: 'Polearm',
    rarity: 3,
    baseAtk: 354,
    subStatType: 'HP%',
    subStatValue: 46.9,
    passiveName: 'Bane of the Soft',
    passiveEffect: 'Aumenta o dano contra slimes em 80%. Melhor opção F2P para puro escudo/HP.',
    aliases: ['Borla Preta', 'Black Tassel']
  },
  {
    name: 'White Tassel',
    type: 'Polearm',
    rarity: 3,
    baseAtk: 401,
    subStatType: 'CR',
    subStatValue: 23.4,
    passiveName: 'Sharp',
    passiveEffect: 'Aumenta o dano do Ataque Normal em até 48% (em R5).',
    aliases: ['Borla Branca']
  },

  // ==========================================
  // CATALYSTS
  // ==========================================
  {
    name: 'A Thousand Floating Dreams',
    type: 'Catalyst',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'EM',
    subStatValue: 265,
    passiveName: 'A Thousand Night Dawns',
    passiveEffect: 'Concede EM ou Dano Elemental com base nos elementos da equipe e concede +40 de EM para os demais aliados.',
    aliases: ['Floating Dreams', 'Nahida Sig', 'Sonhos Flutuantes', 'Mil Sonhos Flutuantes']
  },
  {
    name: 'Tome of the Eternal Flow',
    type: 'Catalyst',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'CD',
    subStatValue: 88.2,
    passiveName: 'Aeon Wave',
    passiveEffect: 'HP +16%. Quando o HP atual sobe ou desce, o dano do Ataque Carregado aumenta em 14% (até 3 acúmulos) e regenera energia.',
    aliases: ['Neuvillette Sig', 'Tomo do Fluxo Eterno', 'Tome']
  },
  {
    name: 'Cashflow Supervision',
    type: 'Catalyst',
    rarity: 5,
    baseAtk: 674,
    subStatType: 'CR',
    subStatValue: 22.1,
    passiveName: 'Bloodthirsty Strike',
    passiveEffect: 'ATK +16%. Quando o HP varia, ganha velocidade e dano de NA e CA.',
    aliases: ['Wriothesley Sig', 'Supervisão de Fluxo']
  },
  {
    name: "Kagura's Verity",
    type: 'Catalyst',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'CD',
    subStatValue: 66.2,
    passiveName: 'Kagura Dance',
    passiveEffect: 'Usar Habilidade Elemental concede 12% de dano à Habilidade (até 3 stacks). No máximo, ganha 12% de dano para todos os elementos.',
    aliases: ['Kagura', 'Yae Sig', 'Prova de Kagura']
  },
  {
    name: 'Lost Prayer to the Sacred Winds',
    type: 'Catalyst',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'CR',
    subStatValue: 33.1,
    passiveName: 'Boundless Blessing',
    passiveEffect: 'Velocidade de Movimento +10%. A cada 4s em combate, ganha 8% de bônus de Dano Elemental (acumula até 4 vezes).',
    aliases: ['Lost Prayer', 'Oração Perdida']
  },
  {
    name: 'Memory of Dust',
    type: 'Catalyst',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'ATK%',
    subStatValue: 49.6,
    passiveName: 'Golden Majesty',
    passiveEffect: 'Força de escudo +20%. Acertos aumentam ATK em 4% (5 stacks). Efeito dobrado com escudo ativo.',
    aliases: ['Memória da Poeira']
  },
  {
    name: 'Skyward Atlas',
    type: 'Catalyst',
    rarity: 5,
    baseAtk: 674,
    subStatType: 'ATK%',
    subStatValue: 33.1,
    passiveName: 'Wandering Clouds',
    passiveEffect: 'Aumenta o Dano Elemental em 12%. Ataques normais têm chance de buscar oponentes e causar 160% de ATK.',
    aliases: ['Atlas Celestial']
  },
  {
    name: "Jadefall's Splendor",
    type: 'Catalyst',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'HP%',
    subStatValue: 49.6,
    passiveName: 'Primordial Jade Regalia',
    passiveEffect: 'Após usar o Supremo ou criar escudo, restaura energia e ganha bônus de dano elemental baseado no HP Máx.',
    aliases: ['Baizhu Sig', 'Esplendor de Jade']
  },
  {
    name: "Starcaller's Watch",
    type: 'Catalyst',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'CD',
    subStatValue: 88.2,
    passiveName: "Astronomer's Gaze",
    passiveEffect: 'Ao gerar escudo ou usar Habilidade Nightsoul, concede bônus massivo de dano e suporte elemental.',
    aliases: ['Citlali Sig', 'Relógio do Chamador de Estrelas']
  },
  {
    name: "Surf's Up",
    type: 'Catalyst',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'CD',
    subStatValue: 88.2,
    passiveName: 'Aqua Crest',
    passiveEffect: 'HP Máx +20%. Usar Habilidade Elemental concede bônus de Dano de Ataque Normal de até 48%.',
    aliases: ['Mualani Sig', 'Surfs Up', 'Prancha']
  },
  {
    name: 'The Widsith',
    type: 'Catalyst',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'CD',
    subStatValue: 55.1,
    passiveName: 'Debut',
    passiveEffect: 'Ao entrar em combate, ganha tema musical aleatório por 10s: +120% ATK, +96% Dano Elemental ou +480 EM (em R5).',
    aliases: ['Widsith', 'Sinfonia dos Indolentes', 'Sinfonia']
  },
  {
    name: 'Sacrificial Fragments',
    type: 'Catalyst',
    rarity: 4,
    baseAtk: 454,
    subStatType: 'EM',
    subStatValue: 221,
    passiveName: 'Composed',
    passiveEffect: 'Tem 80% de chance de redefinir o recarga da Habilidade Elemental ao causar dano.',
    aliases: ['Sac Fragments', 'Memórias do Sacrifício']
  },
  {
    name: 'Favonius Codex',
    type: 'Catalyst',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'ER%',
    subStatValue: 45.9,
    passiveName: 'Windfall',
    passiveEffect: 'Críticos geram 3 partículas incolores (6 de energia neutra para o grupo).',
    aliases: ['Fav Codex', 'Codex de Favonius']
  },
  {
    name: 'Solar Pearl',
    type: 'Catalyst',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'CR',
    subStatValue: 27.6,
    passiveName: 'Solar Shine',
    passiveEffect: 'Acertos de Ataque Normal aumentam o dano da Habilidade Elemental e do Supremo em 40%.',
    aliases: ['Pérola Solar']
  },
  {
    name: 'Sacrificial Jade',
    type: 'Catalyst',
    rarity: 4,
    baseAtk: 454,
    subStatType: 'CR',
    subStatValue: 36.8,
    passiveName: 'Jade Precept',
    passiveEffect: 'Fora de campo por 5s, ganha +64% de HP Máx e +80 de Proficiência Elemental ao retornar ao campo.',
    aliases: ['Jade do Sacrifício']
  },
  {
    name: 'Flowing Purity',
    type: 'Catalyst',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'ATK%',
    subStatValue: 27.6,
    passiveName: 'Unfinished Masterpiece',
    passiveEffect: 'Ao usar Habilidade Elemental, aumenta o bônus de dano elemental e concede Vínculo da Vida.',
    aliases: ['Pureza Fluida']
  },
  {
    name: 'Mappa Mare',
    type: 'Catalyst',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'EM',
    subStatValue: 110,
    passiveName: 'Infusion Scroll',
    passiveEffect: 'Desencadear uma reação elemental concede 16% de bônus de Dano Elemental por 10s (acumula 2 vezes).',
    aliases: ['Mappa']
  },
  {
    name: 'Hakushin Ring',
    type: 'Catalyst',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'ER%',
    subStatValue: 30.6,
    passiveName: 'Sakura Saiguu',
    passiveEffect: 'Ao desencadear reação envolvendo Electro, concede 20% de Dano Elemental aos elementos envolvidos.',
    aliases: ['Anel de Hakushin']
  },
  {
    name: 'Ring of Yaxche',
    type: 'Catalyst',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'HP%',
    subStatValue: 41.3,
    passiveName: 'Echoing Song',
    passiveEffect: 'Ao usar a Habilidade Elemental, concede até 32% de bônus de Dano de Ataque Normal baseado no HP Máx.',
    aliases: ['Yaxche', 'Anel de Yaxche']
  },
  {
    name: 'Ash-Graven Drinking Horn',
    type: 'Catalyst',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'HP%',
    subStatValue: 41.3,
    passiveName: 'Tracks of the Horn',
    passiveEffect: 'Ao atingir oponentes, causa Dano Físico ou Elemental em área baseado no HP Máx.',
    aliases: ['Chifre de Bebida']
  },
  {
    name: 'Thrilling Tales of Dragon Slayers',
    type: 'Catalyst',
    rarity: 3,
    baseAtk: 401,
    subStatType: 'HP%',
    subStatValue: 35.2,
    passiveName: 'Heritage',
    passiveEffect: 'Ao trocar de personagem, o próximo aliado que entrar em campo ganha +48% de ATK por 10s.',
    aliases: ['TTDS', 'Histórias Extraordinárias', 'Contos de Dragões', 'Historinhas']
  },
  {
    name: 'Magic Guide',
    type: 'Catalyst',
    rarity: 3,
    baseAtk: 354,
    subStatType: 'EM',
    subStatValue: 187,
    passiveName: 'Bane of Storm and Tide',
    passiveEffect: 'Aumenta o dano contra inimigos afetados por Hydro ou Electro em 24%.',
    aliases: ['Guia de Magia']
  },

  // ==========================================
  // BOWS
  // ==========================================
  {
    name: 'Aqua Simulacra',
    type: 'Bow',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'CD',
    subStatValue: 88.2,
    passiveName: 'The Cleansing Form',
    passiveEffect: 'HP +16%. Quando houver oponentes por perto, o dano causado pelo personagem é aumentado em 20% (mesmo fora de campo).',
    aliases: ['Aqua', 'Yelan Sig', 'Aqua Simulacro']
  },
  {
    name: 'The First Great Magic',
    type: 'Bow',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'CD',
    subStatValue: 66.2,
    passiveName: "Parsifal's Great Magic",
    passiveEffect: 'Dano de Ataque Carregado +16%. Concede acúmulos que aumentam ATK com base em membros do mesmo elemento.',
    aliases: ['TFGM', 'Lyney Sig', 'O Primeiro Grande Truque']
  },
  {
    name: 'Thundering Pulse',
    type: 'Bow',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'CD',
    subStatValue: 66.2,
    passiveName: 'Rule By Thunder',
    passiveEffect: 'ATK +20%. Concede Emblemas do Trovão que aumentam o dano dos Ataques Normais em até 40%.',
    aliases: ['TP', 'Yoimiya Sig', 'Pulso do Trovão']
  },
  {
    name: 'Polar Star',
    type: 'Bow',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'CR',
    subStatValue: 33.1,
    passiveName: "Daylight's Augury",
    passiveEffect: 'Dano de Habilidade Elemental e Supremo +12%. Acertos de NA, CA, E e Q acumulam até 48% de ATK (Polar Star Field).',
    aliases: ['Childe Sig', 'Estrela Invernal', 'Polar']
  },
  {
    name: "Hunter's Path",
    type: 'Bow',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'CR',
    subStatValue: 44.1,
    passiveName: 'At the End of the Beast-Paths',
    passiveEffect: 'Ganha 12% de bônus de dano de todos os elementos. Aumenta o dano do Ataque Carregado em 160% da Proficiência Elemental.',
    aliases: ['Tighnari Sig', 'Caminho do Caçador', 'Hunters Path']
  },
  {
    name: 'Silvershower Heartstrings',
    type: 'Bow',
    rarity: 5,
    baseAtk: 542,
    subStatType: 'HP%',
    subStatValue: 66.2,
    passiveName: 'Drydock',
    passiveEffect: 'Recebe acúmulos que aumentam o HP Máximo e concedem Taxa Crítica para o Supremo.',
    aliases: ['Sigewinne Sig', 'Chuva Prateada']
  },
  {
    name: "Astral Vulture's Crimson Plumage",
    type: 'Bow',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'CD',
    subStatValue: 66.2,
    passiveName: 'Hovering Plumage',
    passiveEffect: 'Aumenta o dano de Ataques Carregados e concede bônus de ATK ao disparar em modo Nightsoul.',
    aliases: ['Chasca Sig', 'Plumagem Carmesim']
  },
  {
    name: 'Elegy for the End',
    type: 'Bow',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'ER%',
    subStatValue: 55.1,
    passiveName: 'The Millennial Movement: Farewell Song',
    passiveEffect: 'EM +60. Acertos de E/Q geram Selos; com 4, concede +100 de EM e +20% de ATK para toda a equipe por 12s.',
    aliases: ['Elegy', 'Venti Sig', 'Elegia do Suspiro Final']
  },
  {
    name: 'Skyward Harp',
    type: 'Bow',
    rarity: 5,
    baseAtk: 674,
    subStatType: 'CR',
    subStatValue: 22.1,
    passiveName: 'Echoing Ballad',
    passiveEffect: 'Dano Crítico +20%. Acertos têm 60% de chance de causar pequeno ataque físico em área.',
    aliases: ['Harp', 'Harpa Celestial']
  },
  {
    name: "Amos' Bow",
    type: 'Bow',
    rarity: 5,
    baseAtk: 608,
    subStatType: 'ATK%',
    subStatValue: 49.6,
    passiveName: 'Strong-Willed',
    passiveEffect: 'Aumenta o dano do Ataque Normal e Carregado em 12%. O dano aumenta em 8% a cada 0.1s de voo da flecha (até 5 vezes).',
    aliases: ['Amos', 'Arco de Amos', 'Ganyu Sig']
  },
  {
    name: 'Favonius Warbow',
    type: 'Bow',
    rarity: 4,
    baseAtk: 454,
    subStatType: 'ER%',
    subStatValue: 61.3,
    passiveName: 'Windfall',
    passiveEffect: 'Acertos críticos geram 3 partículas incolores que restauram 6 de energia neutra para a equipe.',
    aliases: ['Fav Warbow', 'Fav Bow', 'Arco de Favonius']
  },
  {
    name: 'Sacrificial Bow',
    type: 'Bow',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'ER%',
    subStatValue: 30.6,
    passiveName: 'Composed',
    passiveEffect: 'Tem 80% de chance de redefinir o recarga da Habilidade Elemental ao atingir um alvo.',
    aliases: ['Sac Bow', 'Arco do Sacrifício']
  },
  {
    name: 'The Stringless',
    type: 'Bow',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'EM',
    subStatValue: 165,
    passiveName: 'Song of Flagrance',
    passiveEffect: 'Aumenta o dano da Habilidade Elemental e do Supremo em 48% (em R5).',
    aliases: ['Stringless', 'Último Acorde', 'Ultimo Acorde']
  },
  {
    name: 'Scion of the Blazing Sun',
    type: 'Bow',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'CR',
    subStatValue: 18.4,
    passiveName: 'Warmth of the Solstice',
    passiveEffect: 'Acertos de Ataque Carregado disparam flecha de fogo solar causando dano em área e enfraquecendo alvos contra CA.',
    aliases: ['Herdeiro do Sol']
  },
  {
    name: 'Song of Stillness',
    type: 'Bow',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'ATK%',
    subStatValue: 41.3,
    passiveName: 'Basking in the Tranquil',
    passiveEffect: 'Após receber cura, todo o dano causado aumenta em 32% (em R5) por 8s.',
    aliases: ['Canção da Tranquilidade']
  },
  {
    name: 'Fading Twilight',
    type: 'Bow',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'ER%',
    subStatValue: 30.6,
    passiveName: 'Radiance of the Deeps',
    passiveEffect: 'Garante 3 estados de bônus de dano: 12%, 20% ou 28%, alternando a cada 7s ao acertar oponentes.',
    aliases: ['Crepúsculo Desvanecido']
  },
  {
    name: "Mouun's Moon",
    type: 'Bow',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'ATK%',
    subStatValue: 27.6,
    passiveName: 'Watatsumi Wavewalker',
    passiveEffect: 'Aumenta o dano do Supremo com base na capacidade de energia máxima da equipe (até 80%).',
    aliases: ['Lua de Mouun']
  },
  {
    name: 'Hamayumi',
    type: 'Bow',
    rarity: 4,
    baseAtk: 454,
    subStatType: 'ATK%',
    subStatValue: 55.1,
    passiveName: 'Full Draw',
    passiveEffect: 'Aumenta o dano do Ataque Normal em 32% e do Carregado em 24%. Efeito dobrado quando a energia está em 100%.',
    aliases: ['Hamayumi Arco']
  },
  {
    name: 'Prototype Crescent',
    type: 'Bow',
    rarity: 4,
    baseAtk: 510,
    subStatType: 'ATK%',
    subStatValue: 41.3,
    passiveName: 'Unreturning',
    passiveEffect: 'Acertos em pontos fracos concedem 10% de velocidade de movimento e 72% de ATK por 10s (em R5).',
    aliases: ['Protótipo da Meia-Lua', 'Crescent']
  },
  {
    name: 'Chain Breaker',
    type: 'Bow',
    rarity: 4,
    baseAtk: 565,
    subStatType: 'ATK%',
    subStatValue: 27.6,
    passiveName: 'Flower-Feather Oath',
    passiveEffect: 'Ganha bônus de ATK e Proficiência Elemental de acordo com os membros da equipe.',
    aliases: ['Quebrador de Correntes']
  },
  {
    name: 'Slingshot',
    type: 'Bow',
    rarity: 3,
    baseAtk: 354,
    subStatType: 'CR',
    subStatValue: 31.2,
    passiveName: 'Slingshot',
    passiveEffect: 'Se o disparo acertar o alvo em até 0.3s após sair do arco, o dano aumenta em 60% (em R5).',
    aliases: ['Estilingue', 'Slingshot']
  },
  {
    name: "Sharpshooter's Oath",
    type: 'Bow',
    rarity: 3,
    baseAtk: 401,
    subStatType: 'CD',
    subStatValue: 46.9,
    passiveName: 'Precise',
    passiveEffect: 'Aumenta o dano contra pontos fracos em 48%.',
    aliases: ['Juramento de Pontaria']
  },
  {
    name: 'Recurve Bow',
    type: 'Bow',
    rarity: 3,
    baseAtk: 354,
    subStatType: 'HP%',
    subStatValue: 46.9,
    passiveName: 'Cull the Weak',
    passiveEffect: 'Derrotar um oponente restaura 16% do HP.',
    aliases: ['Arco Recurvado']
  }
];

/**
 * Normalizes text for lenient fuzzy/alias matching (ignoring accents, punctuation, spaces, and case)
 */
function normalizeQuery(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics / accents
    .replace(/[^a-z0-9]/g, '');      // keep alphanumeric only
}

/**
 * Automatically retrieves official weapon stats from database by name or alias.
 * Handles fuzzy name variations, common community abbreviations, and Portuguese translations.
 */
export function getWeaponData(query: string): WeaponData | null {
  if (!query || typeof query !== 'string') return null;

  // Clean query, strip refinement tags like R1..R5
  const clean = query.replace(/\b(R[1-5])\b/gi, '').trim();
  const normTarget = normalizeQuery(clean);
  if (!normTarget) return null;

  // 1. Exact normalized name match
  for (const w of WEAPONS_DATABASE) {
    if (normalizeQuery(w.name) === normTarget) {
      return w;
    }
  }

  // 2. Exact alias match
  for (const w of WEAPONS_DATABASE) {
    if (w.aliases) {
      for (const a of w.aliases) {
        if (normalizeQuery(a) === normTarget) {
          return w;
        }
      }
    }
  }

  // 3. Substring match (either weapon name contains target or target contains weapon name)
  for (const w of WEAPONS_DATABASE) {
    const normW = normalizeQuery(w.name);
    if (normW.includes(normTarget) || normTarget.includes(normW)) {
      return w;
    }
  }

  // 4. Substring alias match
  for (const w of WEAPONS_DATABASE) {
    if (w.aliases) {
      for (const a of w.aliases) {
        const normA = normalizeQuery(a);
        if (normA.includes(normTarget) || normTarget.includes(normA)) {
          return w;
        }
      }
    }
  }

  return null;
}
