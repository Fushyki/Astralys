/**
 * Lote Geo A: Ningguang, Zhongli, Noelle, Albedo, Gorou, Arataki Itto. Tudo conferido contra o Lunaris 7.1.53.
 * Sem mudança (conferidos): Ningguang A4/C1/C2/C4/C6, Noelle C2/C4/C6/Varredura, Albedo A2/C1/C2/C4/C6 (parte já modelada),
 * Gorou A1/A4 e Itto C4/Rei Oni.
 * Correções: Zhongli Escudo de Jade (RES -20% valia sempre; agora é janela) e A4 da Stele (1,9% do HP, não existia);
 * Gorou C6 (assumia sempre o teto +40%; agora o bônus depende de quantos Geo há no time: 10/20/40%);
 * Itto A4 e C6 liam o tipo "charged", mas o cadastro (moves.json) tem o Arataki Kesagiri e o Saichimonji Slash como "normal":
 * o A4 nunca somava e o C6 nunca valia. O A4 agora usa os rótulos exatos; o C6 sai (pendente, não cabe no formato);
 * Albedo ganha o A4 Hexerei (Secret Rite: DMG pelo DEF dele).
 */
import type { BuffCuration, NoteCuration } from '../characters';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const x = (note: string): NoteCuration => ({ kind: 'partial', note });

const buffs: Record<string, BuffCuration[]> = {
  Zhongli: [
    {
      id: 'shield', label: 'Zhongli: Escudo de Jade', src: 'kit', kit: { talent: 'skill' }, scope: 'self', timed: true,
      resShred: { value: { lit: 0.2 }, elements: ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo', 'Physical'] },
      expect: 'will decrease the Elemental RES and Physical RES of opponents in a small AoE by 20%',
      note: 'RES elemental e Física do inimigo -20% (20 é literal do texto) enquanto o Escudo de Jade protege alguém (dura 20 s, ver "Shield Duration"): janela de tempo, o usuário liga e decide o tempo (antes estava sempre ligado). Não acumula.',
    },
    {
      id: 'a4s', label: 'Zhongli A4 (Stone Stele)', src: 'p2', scope: 'self', timed: false,
      flat: [{ name: 'Stone Stele, ressonância e Hold por HP', sourceStat: 'HP', perPoint: { p: 1 }, hitTypes: ['skill'] }],
      expect: "Dominus Lapidis' Stone Stele, resonance, and hold DMG is increased by 1.9% of Max HP",
      note: 'Soma 1,9% do HP máximo ao dano base do Stone Stele, da ressonância e do Hold (os golpes de habilidade dele). Os +1,39% de Normal/Carregado/Imersivo e +33% do Planet Befall já estão em flatDamage.json.',
    },
  ],
  Gorou: [
    {
      id: 'c6', label: 'Gorou C6', src: 'const6', scope: 'team', timed: true, forElements: ['Geo'], stats: { critDmg: { lit: 1 } },
      team: { scale: { of: ['Geo'], table: [{ p: 0 }, { p: 1 }, { p: 2 }] } },
      expect: "CRIT DMG of all nearby party members' Geo DMG",
      note: '+10% (1 Geo no time), +20% (2) ou +40% (3 ou mais) de Dano Crítico do dano Geo por 12 s depois da habilidade ou do Supremo: o nível do campo vem de quantos Geo há no time (o Gorou conta). Ligue a janela. Só personagens Geo recebem; não acumula. Antes assumia sempre o +40%.',
    },
  ],
  'Arataki Itto': [
    {
      id: 'a4', label: 'Itto A4', src: 'p2', scope: 'self', timed: false,
      flat: [{ name: 'Arataki Kesagiri por DEF', sourceStat: 'DEF', perPoint: { p: 0 }, hitTypes: ['normal'], labels: ['Arataki Kesagiri Combo Slash DMG', 'Arataki Kesagiri Final Slash DMG'] }],
      expect: "Arataki Kesagiri DMG is increased by 35% of Arataki Itto's DEF",
      note: 'Soma 35% da DEF ao dano base de cada Arataki Kesagiri (Combo Slash e Final Slash). O Saichimonji Slash (sem stacks) NÃO recebe: o texto fala só do Kesagiri. A curadoria antiga filtrava por "charged" e nunca somava, porque no cadastro esses golpes são "normal".',
    },
  ],
  Albedo: [
    {
      id: 'a4hs', label: 'Albedo A4 Hexerei (Solar Isotoma)', src: 'p4', scope: 'team', timed: true, team: { hexerei: 2 },
      convert: { from: 'def', perPoint: { lit: 0.00004 }, cap: { p: 1 }, to: ['dmgPct'] },
      expect: 'are increased by 4% for every 1,000 DEF Albedo has for 20s',
      note: 'Hexerei: Secret Rite (2+ membros Hexerei, Albedo Hexerei): depois de criar um Solar Isotoma, o DMG de Normal, Carregado, Imersivo, habilidade e Supremo de quem está perto sobe 4% por 1.000 de DEF dele, no máximo 12%, por 20 s: ligue a janela. 0,00004 por ponto de DEF é o 4%/1.000 do texto.',
    },
    {
      id: 'a4hx', label: 'Albedo A4 Hexerei (Silver Isotoma)', src: 'p4', scope: 'team', timed: true, forFactions: ['hexerei'], team: { hexerei: 2 },
      convert: { from: 'def', perPoint: { lit: 0.0001 }, cap: { p: 3 }, to: ['dmgPct'] },
      expect: 'are increased by 10% for every 1,000 DEF Albedo has for 20s',
      note: 'Hexerei: depois de gerar um Silver Isotoma, o DMG de Normal, Carregado, Imersivo, habilidade e Supremo dos membros HEXEREI sobe 10% por 1.000 de DEF dele, no máximo 30%, por 20 s: ligue a janela. Soma com o bônus do Solar Isotoma. 0,0001 por ponto de DEF é o 10%/1.000 do texto.',
    },
  ],
};

const infos: Record<string, InfoCuration[]> = {
  Zhongli: [
    { src: 'p1', kind: 'escudo', label: 'Força do escudo', text: '+{0%} de força do escudo por acúmulo, até {1} acúmulos, enquanto o Jade Shield durar', values: [{ p: 0 }, { lit: 5 }], expect: 'Fortified characters have 5% increased Shield Strength' },
    { src: 'const6', kind: 'cura', label: 'Cura do Jade Shield', text: '{0%} do dano que o Jade Shield recebe vira HP do personagem atual; no máximo {1%} do HP máximo dele por vez', values: [{ p: 0 }, { p: 1 }], expect: '40% of that incoming DMG is converted to HP for the current character' },
  ],
  Noelle: [
    { src: 'p1', kind: 'escudo', label: 'Escudo de emergência', text: 'Com o HP do personagem em campo abaixo de {0%}, cria um escudo que absorve {1%} da DEF dela (150% de absorção) por {2} s; uma vez a cada {3} s', values: [{ p: 0 }, { p: 1 }, { p: 2 }, { p: 3 }], expect: "absorbs DMG equal to 400% of Noelle's DEF" },
    { src: 'p2', kind: 'recarga', label: 'Recarga da Breastplate', text: 'cai {0} s a cada 4 acertos de Normal ou Carregado (um acerto a cada 0,1 s)', values: [{ lit: 1 }], expect: 'Noelle will decrease the CD of Breastplate by 1s for every 4 Normal or Charged Attack hits' },
    { src: 'const1', kind: 'cura', label: 'Chance de cura da Breastplate', text: 'com o Sweeping Time e a Breastplate ativos, a chance de cura sobe para {0%}', values: [{ p: 0 }], expect: "the chance of Breastplate's healing effects activating is increased to 100%" },
  ],
  Albedo: [
    { src: 'const1', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia por Transient Blossom gerada', values: [{ p: 0 }], expect: 'regenerate 1.2 Energy for Albedo' },
  ],
  Gorou: [
    { src: 'const1', kind: 'recarga', label: 'Recarga do Inuzaka All-Round Defense', text: 'cai {0} s quando um aliado causa dano Geo dentro do estandarte ou do General\'s Glory; no máximo uma vez a cada {1} s', values: [{ lit: 2 }, { p: 1 }], expect: "the CD of Gorou's Inuzaka All-Round Defense is decreased by 2s" },
    { src: 'const4', kind: 'cura', label: 'Cura do General\'s Glory', text: 'Em "Impregnable" ou "Crunch", cura os personagens em campo em {0%} da DEF dele a cada 1,5 s', values: [{ p: 0 }], expect: "heal active characters within its AoE by 50% of Gorou's own DEF every 1.5s" },
  ],
  'Arataki Itto': [
    { src: 'const2', kind: 'recarga', label: 'Recarga e energia do Supremo', text: 'cada membro Geo reduz a recarga do Supremo em {0} s (até 4,5 s) e dá {1} de Energia ao Itto (até 18)', values: [{ p: 0 }, { p: 1 }], expect: "will decrease that skill's CD by 1.5s and restore 6 Energy to Arataki Itto" },
  ],
};

export const LOTE: Lote = {
  buffs,
  remove: { 'Arataki Itto': ['c6'] },
  notes: {
    'Arataki Itto': {
      const6: x('Pendente: o +70% de Dano Crítico dos Carregados não entra. No cadastro (moves.json) os golpes de Carregado dele (Arataki Kesagiri e Saichimonji Slash) são "normal", e o formato só filtra o crítico por tipo: valer para "normal" subiria também os 4 golpes do Normal. A curadoria antiga usava "charged", que não casa com nenhum golpe dele. A chance de 50% de não gastar stacks também não entra.'),
    },
    Albedo: {
      p1: x('Pendente: os +25% de DMG das Transient Blossoms (inimigo com menos de 50% de HP) não entram, porque o formato não limita um bônus em % a um golpe só (valeria para o Skill DMG também). Os +240% da DEF só valem com um Silver Isotoma dele em campo (Hexerei) e dano fixo não tem liga/desliga.'),
      p4: x('Entram os dois bônus de DMG por DEF do Secret Rite (Solar Isotoma, 12%; Silver Isotoma para Hexerei, 30%). A geração do Silver Isotoma e das Transient Blossoms extras não entra.'),
      const4: x('Entra o +30% de Imersivo dentro do Solar Isotoma. Pendente: o +30% do impacto no solo depois de pular num Silver Isotoma (3 s) é de um golpe só e não entra.'),
      const6: x('Entra o +17% de DMG (janela). Pendente: o +250% da DEF no Fatal Blossom por 20 s depende de destruir Silver Isotomas (Hexerei) e dano fixo não tem liga/desliga.'),
    },
    Gorou: {
      const1: { kind: 'utility', note: 'Só recarga da habilidade (informativo).' },
    },
  },
  infos,
};
