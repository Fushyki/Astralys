/**
 * Golpes extras de passivas e constelações (ver `ProcCuration` em `characters.ts`). Cada escala é um parâmetro do
 * Lunaris da passiva/constelação indicada em `src` (ou `lit` quando o parâmetro vem zerado) e `expect` trava se o texto
 * mudar. O elemento é o do personagem, salvo quando o texto (ou o Genshin Optimizer) diz outro. O tipo de golpe
 * (`hitType`) segue o texto ("considered X DMG") e o Genshin Optimizer (`customDmgNode(..., 'normal' | 'skill' ...)`);
 * sem tipo, o golpe não recebe bônus de Normal/Carregado/Imersivo/Habilidade/Supremo.
 */
import type { BuffCuration, ProcCuration } from './characters';

const EL = 'Escolha o elemento absorvido/convertido no campo "Elemento do dano" do golpe (o padrão é Anemo).';

export const CHARACTER_PROCS: Record<string, ProcCuration[]> = {
  Xiangling: [{ id: 'c2', label: 'Xiangling C2: Implode', src: 'const2', scale: { atk: { p: 2 } }, expect: "dealing 75% of Xiangling's ATK as AoE Pyro DMG", note: 'Explosão de 75% do ATK 2 s depois do último Normal.' }],
  Klee: [{ id: 'c4', label: 'Klee C4: explosão', src: 'const4', scale: { atk: { lit: 5.55 } }, expect: 'dealing 555% of ATK as AoE Pyro DMG', note: 'Explosão de 555% do ATK ao sair de campo ou ao fim do Supremo (o dobro com a Klee em campo não entra).' }],
  Fischl: [
    { id: 'a4', label: 'Fischl A4: Thundering Retribution', src: 'p2', hitType: 'skill', scale: { atk: { p: 0 } }, expect: "deals Electro DMG equal to 80% of Fischl's ATK", note: '80% do ATK quando o personagem ativo dispara reação Electro com o Oz em campo (conta como habilidade, Genshin Optimizer).' },
    { id: 'c1', label: 'Fischl C1: ataque do Oz', src: 'const1', hitType: 'normal', element: 'Physical', scale: { atk: { p: 0 } }, expect: "dealing DMG equal to 22% of Fischl's ATK", note: 'Ataque coordenado de 22% do ATK a cada Normal da Fischl sem o Oz (Físico, conta como Normal, Genshin Optimizer).' },
    { id: 'c2', label: 'Fischl C2: Nightrider extra', src: 'const2', hitType: 'skill', scale: { atk: { p: 0 } }, expect: 'it deals an additional 200% ATK as DMG', note: '200% do ATK a mais ao invocar o Oz (conta como habilidade).' },
    { id: 'c4', label: 'Fischl C4: Supremo extra', src: 'const4', hitType: 'burst', scale: { atk: { p: 0 } }, expect: 'it deals 222% of ATK as Electro DMG', note: '222% do ATK ao usar o Supremo (conta como Supremo, Genshin Optimizer). A cura não muda o dano.' },
    { id: 'c6', label: 'Fischl C6: ataque coordenado', src: 'const6', hitType: 'skill', scale: { atk: { p: 0 } }, expect: "dealing 30% of Fischl's ATK as Electro DMG", note: 'Ataque coordenado de 30% do ATK com o personagem ativo (conta como habilidade, Genshin Optimizer).' },
  ],
  Noelle: [{ id: 'c4', label: 'Noelle C4: Couraça', src: 'const4', scale: { atk: { p: 0 } }, expect: "it will deal 400% of Noelle's ATK as Geo DMG", note: 'Explosão de 400% do ATK quando a Couraça acaba ou quebra.' }],
  Chongyun: [{ id: 'c1', label: 'Chongyun C1: lâmina de gelo', src: 'const1', scale: { atk: { p: 0 } }, expect: "Each blade deals 50% of Chongyun's ATK as Cryo DMG", note: 'Cada lâmina vale 50% do ATK; são 3 no último Normal (use 3 execuções).' }],
  Keqing: [{ id: 'c1', label: 'Keqing C1: blink', src: 'const1', scale: { atk: { p: 0 } }, expect: 'deal 50% of her ATK as AoE Electro DMG', note: '50% do ATK no início e no fim do blink (use 2 execuções).' }],
  Yanfei: [{ id: 'a4', label: 'Yanfei A4: explosão do crítico', src: 'p2', hitType: 'charged', scale: { atk: { p: 0 } }, expect: 'This DMG counts as Charged Attack DMG', note: '80% do ATK quando o Carregado causa crítico (conta como Carregado).' }],
  'Sangonomiya Kokomi': [{ id: 'c1', label: 'Kokomi C1: peixe', src: 'const1', scale: { hp: { p: 0 } }, expect: 'This DMG is not considered Normal Attack DMG', note: '30% do HP máximo no último Normal durante o Supremo (não conta como Normal).' }],
  Yelan: [{ id: 'c2', label: 'Yelan C2: flecha extra', src: 'const2', hitType: 'burst', scale: { hp: { p: 0 } }, expect: "deal 14% of Yelan's Max HP as Hydro DMG", note: '14% do HP máximo a cada ataque coordenado do Supremo (até 1 a cada 1,8 s; conta como Supremo, Genshin Optimizer).' }],
  Kirara: [{ id: 'c4', label: 'Kirara C4: Cardamomo', src: 'const4', hitType: 'burst', scale: { atk: { p: 0 } }, expect: 'considered Elemental Burst DMG', note: '200% do ATK a cada 3,8 s com escudo (conta como Supremo).' }],
  'Kuki Shinobu': [{ id: 'c4', label: 'Kuki C4: Thundergrass Mark', src: 'const4', hitType: 'skill', scale: { hp: { p: 0 } }, expect: "based on 9.7% of Shinobu's Max HP", note: '9,7% do HP máximo a cada 5 s (conta como habilidade, Genshin Optimizer).' }],
  'Kamisato Ayato': [{ id: 'c6', label: 'Ayato C6: Shunsuiken extra', src: 'const6', hitType: 'normal', scale: { atk: { p: 0 } }, expect: "each one dealing 450% of Ayato's ATK as DMG", note: 'Cada golpe extra vale 450% do ATK; são 2 depois do Supremo (use 2 execuções; conta como Normal, Genshin Optimizer). Não recebem o Namisen.' }],
  Collei: [
    { id: 'a1', label: 'Collei A1: Sprout', src: 'p1', hitType: 'skill', scale: { atk: { p: 1 } }, expect: "Dendro DMG equivalent to 40% of Collei's ATK", note: 'Dano contínuo de 40% do ATK por 3 s depois de reação Dendro (conta como habilidade). Na C2 ele vem sempre.' },
    { id: 'c6', label: 'Collei C6: mini Cuilein-Anbar', src: 'const6', scale: { atk: { p: 0 } }, expect: "deal 200% of Collei's ATK as Dendro DMG", note: '200% do ATK por habilidade.' },
  ],
  Dori: [{ id: 'c2', label: 'Dori C2: Jinni Toop', src: 'const2', scale: { atk: { p: 0 } }, expect: "deals 50% of Dori's ATK DMG", note: '50% do ATK quando o Jinni cura.' }],
  Tighnari: [{ id: 'c6', label: 'Tighnari C6: Clusterbloom extra', src: 'const6', hitType: 'charged', scale: { atk: { p: 1 } }, expect: "This arrow deals 150% of Tighnari's ATK as DMG", note: '150% do ATK por Wreath Arrow (conta como Carregado, Genshin Optimizer).' }],
  Candace: [{ id: 'c6', label: 'Candace C6: onda', src: 'const6', hitType: 'burst', scale: { hp: { p: 0 } }, expect: 'considered Elemental Burst DMG', note: '15% do HP máximo a cada 2,3 s (conta como Supremo).' }],
  Nahida: [{ id: 'c6', label: 'Nahida C6: Karmic Oblivion', src: 'const6', hitType: 'skill', scale: { atk: { p: 0 }, em: { p: 1 } }, expect: 'considered Elemental Skill DMG', note: '200% do ATK + 400% da Maestria, até 6 vezes em 10 s depois do Supremo (conta como habilidade).' }],
  Yaoyao: [{ id: 'c6', label: 'Yaoyao C6: Mega Rabanete', src: 'const6', hitType: 'burst', scale: { atk: { p: 1 } }, expect: "based on 75% of Yaoyao's ATK", note: '75% do ATK, até 2 por Supremo (conta como Supremo, Genshin Optimizer).' }],
  Kaveh: [{ id: 'c6', label: 'Kaveh C6: Luz de Pairidaeza', src: 'const6', scale: { atk: { p: 0 } }, expect: "dealing 61.8% of Kaveh's ATK as AoE Dendro DMG", note: '61,8% do ATK a cada 3 s durante o Supremo.' }],
  Baizhu: [{ id: 'c2', label: 'Baizhu C2: Gossamer Sprite: Splice', src: 'const2', hitType: 'skill', scale: { atk: { p: 1 } }, expect: 'considered Elemental Skill DMG', note: '250% do ATK a cada 5 s (conta como habilidade). A cura não muda o dano.' }],
  Charlotte: [{ id: 'c6', label: 'Charlotte C6: Monsieur Verite', src: 'const6', hitType: 'burst', scale: { atk: { p: 0 } }, expect: "deals 180% of Charlotte's ATK as AoE Cryo DMG", note: '180% do ATK a cada 6 s (conta como Supremo). A cura não muda o dano.' }],
  Chevreuse: [{ id: 'c2', label: 'Chevreuse C2: explosão em cadeia', src: 'const2', hitType: 'skill', scale: { atk: { p: 0 } }, expect: 'considered Elemental Skill DMG', note: 'Cada explosão vale 120% do ATK; são 2 (use 2 execuções; conta como habilidade).' }],
  Arlecchino: [{ id: 'c2', label: 'Arlecchino C2: Balemoon Bloodfire', src: 'const2', scale: { atk: { p: 0 } }, expect: 'dealing 900% of her ATK as AoE Pyro DMG', note: '900% do ATK a cada 10 s. A RES dela não muda o dano.' }],
  Clorinde: [{ id: 'c1', label: 'Clorinde C1: Nightvigil Shade', src: 'const1', hitType: 'normal', scale: { atk: { p: 1 } }, expect: 'DMG dealt this way is considered Normal Attack DMG', note: 'Cada ataque vale 30% do ATK; são 2 a cada 1,2 s (conta como Normal).' }],
  Emilie: [{ id: 'a1', label: 'Emilie A1: Cleardew Cologne', src: 'p1', scale: { atk: { p: 0 } }, expect: 'This DMG is not considered Elemental Skill DMG', note: '600% do ATK a cada 2 Aromas coletados (não conta como habilidade).' }],
  Kachina: [{ id: 'c6', label: 'Kachina C6: escudo quebrado', src: 'const6', scale: { def: { p: 0 } }, expect: 'Kachina will deal 200% of her DEF as AoE Geo DMG', note: '200% da DEF quando o escudo do personagem ativo é trocado ou quebra (a cada 5 s).' }],
  Kinich: [{ id: 'c6', label: 'Kinich C6: ricochete', src: 'const6', hitType: 'skill', scale: { atk: { p: 0 } }, expect: "dealing 700% of Kinich's ATK as Dendro DMG", note: '700% do ATK por Scalespiker Cannon (conta como habilidade, Genshin Optimizer). Os buffs da A1 e da C2 sobre o canhão não entram neste golpe.' }],
  Citlali: [{ id: 'c4', label: 'Citlali C4: Spiritvessel Skull', src: 'const4', scale: { em: { p: 0 } }, expect: "1800% of Citlali's Elemental Mastery", note: '1.800% da Maestria a cada 8 s (não conta como Supremo).' }],
  Escoffier: [{ id: 'c6', label: 'Escoffier C6: Frosty Parfait extra', src: 'const6', hitType: 'skill', scale: { atk: { p: 0 } }, expect: 'This DMG is considered Elemental Skill DMG', note: '500% do ATK, até 6 vezes por habilidade (conta como habilidade).' }],
  Ifa: [{ id: 'c6', label: 'Ifa C6: Tonicshot extra', src: 'const6', hitType: 'normal', scale: { atk: { p: 0 } }, expect: 'This DMG is considered Normal Attack DMG', note: '120% do ATK com 50% de chance no tiro segurado (conta como Normal).' }],
  Skirk: [{ id: 'c1', label: 'Skirk C1: lâmina de cristal', src: 'const1', hitType: 'charged', scale: { atk: { p: 0 } }, expect: 'This DMG is considered Charged Attack DMG', note: '500% do ATK por Void Rift absorvido (conta como Carregado).' }],
  Aino: [{ id: 'c2', label: 'Aino C2: bola de água', src: 'const2', hitType: 'burst', scale: { atk: { p: 0 }, em: { p: 1 } }, expect: 'This DMG is considered Elemental Burst DMG', note: '25% do ATK + 100% da Maestria a cada 5 s com a Aino fora de campo (conta como Supremo).' }],
  Varka: [{ id: 'c2', label: 'Varka C2: golpe extra', src: 'const2', scale: { atk: { p: 0 } }, expect: "AoE Anemo DMG equal to 800% of Varka's ATK", note: '800% do ATK na habilidade especial ou no Carregado especial.' }],
  Illuga: [{ id: 'c2', label: 'Illuga C2: Aedon', src: 'const2', hitType: 'burst', scale: { em: { p: 0 }, def: { p: 1 } }, expect: 'This DMG is considered Elemental Burst DMG', note: "400% da Maestria + 200% da DEF a cada 7 stacks de Nightingale's Song (conta como Supremo)." }],
  'Aether (Anemo)': [{ id: 'a1', label: 'Viajante A1: lâmina de vento', src: 'p1', scale: { atk: { lit: 0.6 } }, expect: 'dealing 60% of ATK as Anemo DMG', note: '60% do ATK no último Normal.' }],
  'Lumine (Anemo)': [{ id: 'a1', label: 'Viajante A1: lâmina de vento', src: 'p1', scale: { atk: { lit: 0.6 } }, expect: 'dealing 60% of ATK as Anemo DMG', note: '60% do ATK no último Normal.' }],
  'Aether (Geo)': [{ id: 'a4', label: 'Viajante A4: desabamento', src: 'p2', scale: { atk: { lit: 0.6 } }, expect: 'dealing 60% of ATK as AoE Geo DMG', note: '60% do ATK no último Normal.' }],
  'Lumine (Geo)': [{ id: 'a4', label: 'Viajante A4: desabamento', src: 'p2', scale: { atk: { lit: 0.6 } }, expect: 'dealing 60% of ATK as AoE Geo DMG', note: '60% do ATK no último Normal.' }],
  'Kaedehara Kazuha': [{ id: 'a1', label: 'Kazuha A1: Imersivo absorvido', src: 'p1', hitType: 'plunge', scale: { atk: { p: 0 } }, expect: 'This will be considered Plunging Attack DMG', note: `200% do ATK do elemento absorvido no Imersivo da habilidade (conta como Imersivo). ${EL}` }],
  Prune: [
    { id: 'a1', label: 'Prune A1: Banehunter Oathhammer', src: 'p1', hitType: 'burst', scale: { atk: { p: 0 } }, expect: 'This DMG is considered Elemental Burst DMG', note: `150% do ATK quando o sino causa Redemoinho (conta como Supremo). ${EL}` },
    { id: 'c4', label: 'Prune C4: ricochete', src: 'const4', scale: { atk: { p: 0 } }, expect: 'dealing 80% ATK as DMG of the corresponding Elemental Type', note: `80% do ATK no ricochete do martelo. ${EL}` },
  ],
  'Yae Miko': [{ id: 'a1', label: 'Yae A1: raio extra', src: 'p1', scale: { atk: { p: 0 } }, expect: 'deals Electro DMG at 40% of her ATK', note: '40% do ATK ao usar a habilidade com 3 Sesshou Sakura.' }],
  Sandrone: [{ id: 'c6', label: 'Sandrone C6: Condensed Cluster Beam', src: 'const6', scale: { atk: { p: 0 } }, expect: 'up to 4 additional instances of AoE Cryo DMG at 100%', note: 'Cada instância vale 100% do ATK; até 4 (use 4 execuções).' }],
};

/**
 * Efeitos de golpe extra que no jogo SOMAM dano a um golpe que já existe (não são um golpe à parte): viram dano fixo por
 * stat do dono nos golpes do tipo indicado (mesmo modelo do Gorou A4).
 */
export const CHARACTERS_PROC_BUFFS: Record<string, BuffCuration[]> = {
  'Hu Tao': [{ id: 'c2', label: 'Hu Tao C2', src: 'const2', scope: 'self', timed: false, flat: [{ name: 'Blood Blossom por HP', sourceStat: 'HP', perPoint: { p: 0 }, hitTypes: ['skill'] }], expect: "Increases the Blood Blossom DMG by an amount equal to 10% of Hu Tao's Max HP", note: 'Soma 10% do HP máximo a cada Blood Blossom (o único dano da habilidade dela). Usa o HP final, não o do momento da aplicação.' }],
  Baizhu: [{ id: 'c6', label: 'Baizhu C6', src: 'const6', scope: 'self', timed: false, flat: [{ name: 'Spiritveins por HP', sourceStat: 'HP', perPoint: { p: 1 }, hitTypes: ['burst'] }], expect: "Spiritveins by 8% of Baizhu's Max HP", note: "Soma 8% do HP máximo a cada Spiritvein (o dano do Supremo dele). Os escudos extras não mudam o dano." }],
  Furina: [{ id: 'c6', label: 'Furina C6', src: 'const6', scope: 'self', timed: false, flat: [{ name: 'Center of Attention por HP', sourceStat: 'HP', perPoint: { p: 1 }, hitTypes: ['normal', 'charged', 'plunge'], stacks: 7 }], expect: 'can be triggered up to 6 times', note: 'Soma 18% do HP máximo aos 7 primeiros Normais, Carregados e Imersivos dela na rotação (uma ativação do Center of Attention; 7 golpes confirmados pelo Davi: o texto do Lunaris limita a 6 os efeitos de Arkhe, e o golpe que dispara o 6º ainda recebe o bônus). A conversão para Hydro já é o padrão; o extra de 25% do HP em Pneuma, a cura e a perda de HP não entram.' }],
  Emilie: [{ id: 'c6', label: 'Emilie C6', src: 'const6', scope: 'self', timed: false, flat: [{ name: 'Abiding Fragrance', sourceStat: 'ATK', perPoint: { p: 2 }, hitTypes: ['normal', 'charged'], stacks: 4 }], expect: "the DMG dealt will be increased by 300% of Emilie's ATK", note: 'Soma 300% do ATK aos 4 primeiros Normais/Carregados da rotação (o efeito acaba depois de 4 Aromas). A conversão para Dendro já é o padrão.' }],
  Kaveh: [{ id: 'c4', label: 'Kaveh C4', src: 'const4', scope: 'self', timed: false, stats: { reactionBonus: { bloom: { p: 0 } } }, expect: 'will deal 60% more DMG when they burst', note: '+60% de dano de Florescer dos Núcleos Dendro que ele cria (tabela de reações).' }],
};
