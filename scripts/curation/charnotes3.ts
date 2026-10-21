/** Notas, lote 3 (Yun Jin a Charlotte). Ver `charnotes.ts`. */
import type { CharacterNotes, NoteCuration } from './characters';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });

export const NOTES_3: CharacterNotes = {
  'Yun Jin': { const6: u('Só velocidade de ataque.') },
  'Kuki Shinobu': {
    p1: u('Só Bônus de Cura.'), const1: u('Só área.'), const2: u('Só duração.'), const4: x('A Marca de Thundergrass (9,7% do HP máximo, a cada 5 s) não entra.'),
  },
  'Kamisato Ayato': { p1: u('Já considerado no Namisen (stacks máximos).'), p2: u('Só energia.'), const4: u('Só velocidade de ataque.'), const6: x('Os 2 Shunsuiken extras (450% do ATK cada) não entram.') },
  Collei: {
    p1: x('O Sprout (40% do ATK por 3 s depois de reação) não entra.'), p2: u('Só duração da Zona.'), const1: u('Só Recarga de Energia fora de campo.'),
    const2: x('O Sprout (40% do ATK) depois de reação não entra.'), const6: x('O miniatura Cuilein-Anbar (200% do ATK) não entra.'),
  },
  Dori: {
    p1: u('Só recarga.'), p2: u('Só energia.'), const1: u('Só número de rodadas.'), const2: x('O tiro do Jinni (50% do ATK) não entra.'),
    const4: u('Só Bônus de Cura e Recarga com pouca energia.'), const6: u('Só infusão Electro e cura.'),
  },
  Tighnari: { const6: x('A flecha Clusterbloom extra (150% do ATK) não entra.') },
  Nilou: {
    p2: x('O bônus de dano dos Bountiful Cores (9% por 1.000 de HP acima de 30.000) não entra (reação de Dendro).'),
    const1: x('Os +65% de dano do Luminous Illusion (um golpe da habilidade) não entram.'),
  },
  Cyno: { const1: u('Só velocidade de ataque.'), const4: u('Só energia.'), const6: x('Os Duststalker Bolt (dano extra por stack) não entram.') },
  Candace: { p1: u('Só tempo de carga.'), const1: u('Só duração.'), const4: u('Só recarga.'), const6: x('A onda extra (15% do HP máximo, conta como Supremo) não entra.') },
  Nahida: {
    const1: u('Só a contagem de elementos do A1.'), const6: x('O Tri-Karma Karmic Oblivion (200% do ATK + 400% da Maestria) não entra.'),
  },
  Layla: {
    p1: u('Só escudo.'), const1: u('Só escudo.'), const2: u('Só energia.'),
    const4: x('O dano extra dos aliados (5% do HP máximo da Layla, só no primeiro golpe) não entra.'),
  },
  Wanderer: {
    p2: x('As flechas de vento extras (Descent) não entram.'), const1: x('Velocidade de ataque e +25% do ATK nas flechas extras: não entram.'),
    const4: x('O buff elemental aleatório do Hanega não entra.'), const6: x('O Fushoudan extra (40% do dano original) não entra.'),
  },
  Faruzan: {
    p1: u('Só tempo de carga.'),
    p2: x('O Hurricane Guard (DMG Anemo +32% do ATK base dela para os aliados, 4 s) não entra: o motor ainda não aceita dano fixo que vem de outro personagem com ATK base.'),
    const1: u('Só flechas.'), const2: u('Só duração.'), const4: u('Só energia.'),
  },
  Yaoyao: { p1: x('O dano dos rabanetes lançados correndo não entra.'), p2: u('Só cura.'), const2: u('Só energia.'), const6: x('O Mega Radish (75% do ATK) não entra.') },
  Alhaitham: {
    p1: u('Só Espelhos.'), const1: u('Só recarga.'),
    const4: x('Os +10% de DMG Dendro por Espelho gerado e +30 de Maestria dos aliados por Espelho consumido dependem do número de Espelhos: não entram.'),
  },
  Dehya: { p1: u('Só redução de dano recebido.'), p2: u('Só cura.'), const2: x('+50% do ataque coordenado do Fiery Sanctum não entra.'), const4: u('Só energia e cura.') },
  Mika: {
    const1: u('Só cura.'), const2: u('Só gera stacks de Detector: os buffs Mika A1/A4 já assumem o máximo de stacks.'),
    const4: u('Só energia.'),
  },
  Kaveh: {
    p1: u('Só cura.'), const1: u('Só RES e Bônus de Cura.'), const2: u('Só velocidade de ataque.'),
    const4: x('+60% de dano dos Dendro Cores de Florescer (reação) não entra.'), const6: x('A Luz de Pairidaeza (61,8% do ATK) não entra.'),
  },
  Baizhu: {
    p2: x('O bônus de dano de reação (Queimadura, Florescer, Hiperflorescer, Brotar, Propagar, Intensificar) não entra.'), const1: u('Só cargas.'),
    const2: x('O Gossamer Sprite: Splice (250% do ATK, conta como habilidade) não entra.'), const6: x('O dano dos Spiritveins (+8% do HP máximo) não entra.'),
  },
  Lynette: { const1: u('Só vórtice.'), const2: x('O Vivid Shot extra não entra.'), const4: u('Só cargas.') },
  Lyney: { p1: x('O dano extra do chapéu Grin-Malkin (80% do ATK) não entra.'), const1: u('Só chapéus e stacks.'), const6: x('O Pyrotechnic Strike: Reprised (80% do dano, conta como Carregado) não entra.') },
  Freminet: { p1: u('Só recarga.'), const2: u('Só energia.') },
  Wriothesley: {
    const1: x('O Gracious Rebuke extra (cria o Carregado Rebuke com mais frequência) não entra.'),
    const2: x('O bônus por stack de Prosecution Edict (+40% do Supremo) e os +25% e +30% dos golpes depois de 5 stacks não entram: dependem da contagem de stacks.'),
    const4: u('Só cura e velocidade de ataque.'),
  },
  Neuvillette: { const1: u('Só resistência a interrupção.'), const4: u('Só gotas de água.'), const6: x('As 2 correntes extras (10% do HP máximo cada) não entram.') },
  Charlotte: { p1: u('Só recarga.') },
};
