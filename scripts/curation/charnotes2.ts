/** Notas, lote 2 (Mona a Yun Jin). Ver `charnotes.ts`. */
import type { CharacterNotes, NoteCuration } from './characters';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });

export const NOTES_2: CharacterNotes = {
  Mona: {
    p1: x('A explosão do Fantasma (50% do dano do Espelho) não entra.'),
    const1: x('Os +15% de dano de Vaporizar, Eletrocarregado e outras reações NÃO entram (o motor ainda não aceita bônus por reação vindo de constelação).'),
  },
  Keqing: { p1: x('A infusão Electro dos Normais e Carregados não entra.'), const2: u('Só partículas.') },
  Sucrose: { const1: u('Só cargas da habilidade.'), const2: u('Só duração do Supremo.'), const4: u('Só recarga da habilidade.') },
  Xinyan: {
    p1: u('Só requisito do escudo.'), const1: u('Só velocidade de ataque.'),
    const2: x('Taxa Crítica +100% só no dano Físico do Supremo: o motor não tem Taxa Crítica por elemento e tipo de golpe juntos.'),
    const6: x('ATK extra só nos Carregados (50% da DEF): o motor ainda não tem ATK por tipo de golpe. A estamina não muda o dano.'),
  },
  Rosaria: { const2: u('Só duração da lança de gelo.'), const4: u('Só energia.') },
  'Hu Tao': { const1: u('Só estamina.') },
  'Kaedehara Kazuha': {
    const1: u('Só recarga da habilidade.'), const4: u('Só energia.'),
  },
  Yanfei: { const1: u('Só estamina e resistência a interrupção.'), const4: u('Só escudo.') },
  Yoimiya: { const4: u('Só recarga da habilidade.'), const6: x('A flecha extra do Normal (60% do dano original, 50% de chance) não entra.') },
  Thoma: { p1: u('Só força do escudo.'), const1: u('Só recarga.'), const2: u('Só duração do Supremo.'), const4: u('Só energia.') },
  Eula: {
    p1: x(`A espada de luz extra do Redemoinho (dano Físico). O golpe é 50% do dano base de outro golpe (a espada do Supremo), ainda não modelado.`), p2: u('Só recarga e stacks de Grimheart.'), const2: u('Só recarga da habilidade.'),
    const4: x(`+25% de dano das espadas de luz contra inimigo com menos de 50% de HP (Físico). Depende do HP do inimigo e só vale para a espada do Supremo (não para todo dano Físico).`),
    const6: x('Mais stacks de energia nas espadas de luz (dano Físico): não entra.'),
  },
  'Raiden Shogun': { p1: u('Só stacks de Resolve.'), const1: u('Só stacks de Resolve.'), const6: u('Só recarga do Supremo dos aliados.') },
  Sayu: {
    p1: u('Só cura.'), p2: u('Só cura e área.'), const1: u('Só comportamento do Daruma.'), const4: u('Só energia.'),
    const6: x('O dano extra do Daruma por Maestria (0,2% do ATK por ponto, até 400%) não entra.'),
  },
  'Sangonomiya Kokomi': {
    p1: u('Só duração da Bake-Kurage.'), p2: x('O bônus de dano de Normal e Carregado por Bônus de Cura não entra: o motor não acompanha cura.'),
    const2: u('Só cura.'), const4: u('Só velocidade de ataque e energia.'),
  },
  Gorou: { const1: u('Só recarga da habilidade.'), const2: u('Só duração do campo.'), const4: u('Só cura.') },
  'Kujou Sara': {
    p1: u('Só tempo de mira.'), p2: u('Só energia.'), const1: u('Só recarga da habilidade.'),
    const2: x('O Corvo extra (30% do dano) não entra.'), const4: x('Os Stormcluster extras do Supremo (de 4 para 6) não entram: ajuste as execuções do Supremo.'),
  },
  'Arataki Itto': { p1: u('Só velocidade de ataque.'), const1: x('Os stacks extras de Superlative Superstrength não entram.'), const2: u('Só recarga e energia.') },
  'Yae Miko': { p1: x('O raio extra (40% do ATK) é golpe extra na paleta. A versão Estelar-Conduct (Radiance) NÃO entra (mecânica Estelar ainda não modelada).') },
  'Shikanoin Heizou': { p1: u('Só stacks de Declension.'), const1: u('Só velocidade de ataque.'), const2: u('Só puxão e duração.'), const4: u('Só energia.') },
  Yelan: { const1: u('Só cargas da habilidade.'), const6: x('O Carregado do estado Mastermind (156% do dano) não entra.') },
  Kirara: { p1: u('Só escudos.'), const1: u('Só Cat Grass Cardamom extra.'), const2: u('Só escudos.') },
  Aloy: Object.fromEntries((['const1', 'const2', 'const3', 'const4', 'const5', 'const6'] as const).map((k) => [k, u('Sem efeito no jogo: a constelação da Aloy não existe (texto de placeholder).')])),
  Shenhe: { const1: u('Só cargas da habilidade.'), const4: x('+5% de dano da habilidade por stack (até 50) depende de quantas vezes a equipe ativa o Icy Quill: não entra.'), const6: u('Só cota do Icy Quill.') },
  'Yun Jin': { p1: u('Só tipo de golpe da habilidade.'), p2: x('O bônus de Normal da formação (2,5% a 11,5% da DEF por número de elementos) não entra.'), const1: u('Só recarga.') },
};
