/** Notas, lote 2 (Mona a Yun Jin). Ver `charnotes.ts`. */
import type { CharacterNotes, NoteCuration } from './characters';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });
const FISICO = 'O dano Físico ainda não é modelado (o motor não tem o elemento Físico como padrão dos golpes de arma).';

export const NOTES_2: CharacterNotes = {
  Mona: {
    p1: x('A explosão do Fantasma (50% do dano do Espelho) não entra.'),
    const1: x('Os +15% de dano de Vaporizar, Eletrocarregado e outras reações NÃO entram (o motor ainda não aceita bônus por reação vindo de constelação).'),
  },
  Keqing: { p1: x('A infusão Electro dos Normais e Carregados não entra.'), const1: x('O dano do blink (50% do ATK) não entra.'), const2: u('Só partículas.') },
  Sucrose: { const1: u('Só cargas da habilidade.'), const2: u('Só duração do Supremo.'), const4: u('Só recarga da habilidade.') },
  Xinyan: {
    p1: u('Só requisito do escudo.'), p2: x(`Dano Físico +15% com escudo. ${FISICO}`), const1: u('Só velocidade de ataque.'),
    const2: x(`Taxa Crítica +100% do dano Físico do Supremo. ${FISICO}`), const4: x(`Redução de RES Física. ${FISICO}`),
    const6: x('ATK extra do Carregado (50% da DEF) e estamina: o dano é Físico e não entra.'),
  },
  Rosaria: { const2: u('Só duração da lança de gelo.'), const4: u('Só energia.'), const6: x(`Redução de RES Física. ${FISICO}`) },
  'Hu Tao': { const1: u('Só estamina.'), const2: x('O dano da Blood Blossom (10% do HP máximo) não entra.') },
  'Kaedehara Kazuha': {
    p1: x('O dano extra do Imersivo com o elemento absorvido (200% do ATK) não entra.'), const1: u('Só recarga da habilidade.'), const4: u('Só energia.'),
  },
  Yanfei: { p2: x('O dano extra do Carregado crítico (80% do ATK, conta como Carregado) não entra.'), const1: u('Só estamina e resistência a interrupção.'), const4: u('Só escudo.') },
  Yoimiya: { const4: u('Só recarga da habilidade.'), const6: x('A flecha extra do Normal (60% do dano original, 50% de chance) não entra.') },
  Thoma: { p1: u('Só força do escudo.'), const1: u('Só recarga.'), const2: u('Só duração do Supremo.'), const4: u('Só energia.') },
  Eula: {
    p1: x(`A espada de luz extra do Redemoinho (dano Físico). ${FISICO}`), p2: u('Só recarga e stacks de Grimheart.'), const2: u('Só recarga da habilidade.'),
    const4: x(`+25% de dano das espadas de luz contra inimigo com menos de 50% de HP (Físico). ${FISICO}`),
    const6: x('Mais stacks de energia nas espadas de luz (dano Físico): não entra.'),
  },
  'Raiden Shogun': { p1: u('Só stacks de Resolve.'), const1: u('Só stacks de Resolve.'), const6: u('Só recarga do Supremo dos aliados.') },
  Sayu: {
    p1: u('Só cura.'), p2: u('Só cura e área.'), const1: u('Só comportamento do Daruma.'), const4: u('Só energia.'),
    const6: x('O dano extra do Daruma por Maestria (0,2% do ATK por ponto, até 400%) não entra.'),
  },
  'Sangonomiya Kokomi': {
    p1: u('Só duração da Bake-Kurage.'), p2: x('O bônus de dano de Normal e Carregado por Bônus de Cura não entra: o motor não acompanha cura.'),
    const1: x('O peixe do último Normal (30% do HP máximo) não entra.'), const2: u('Só cura.'), const4: u('Só velocidade de ataque e energia.'),
  },
  Gorou: { const1: u('Só recarga da habilidade.'), const2: u('Só duração do campo.'), const4: u('Só cura.') },
  'Kujou Sara': {
    p1: u('Só tempo de mira.'), p2: u('Só energia.'), const1: u('Só recarga da habilidade.'),
    const2: x('O Corvo extra (30% do dano) não entra.'), const4: x('Os Stormcluster extras do Supremo (de 4 para 6) não entram: ajuste as execuções do Supremo.'),
  },
  'Arataki Itto': { p1: u('Só velocidade de ataque.'), const1: x('Os stacks extras de Superlative Superstrength não entram.'), const2: u('Só recarga e energia.') },
  'Yae Miko': { p1: x('O raio extra (40% do ATK) com 3 Sesshou Sakura não entra.') },
  'Shikanoin Heizou': { p1: u('Só stacks de Declension.'), const1: u('Só velocidade de ataque.'), const2: u('Só puxão e duração.'), const4: u('Só energia.') },
  Yelan: { const1: u('Só cargas da habilidade.'), const2: x('A flecha de água extra (14% do HP máximo) não entra.'), const6: x('O Carregado do estado Mastermind (156% do dano) não entra.') },
  Kirara: { p1: u('Só escudos.'), const1: u('Só Cat Grass Cardamom extra.'), const2: u('Só escudos.'), const4: x('O ataque coordenado com Cat Grass Cardamom (200% do ATK, conta como Supremo) não entra.') },
  Aloy: Object.fromEntries((['const1', 'const2', 'const3', 'const4', 'const5', 'const6'] as const).map((k) => [k, u('Sem efeito no jogo: a constelação da Aloy não existe (texto de placeholder).')])),
  Shenhe: { const1: u('Só cargas da habilidade.'), const4: x('+5% de dano da habilidade por stack (até 50) depende de quantas vezes a equipe ativa o Icy Quill: não entra.'), const6: u('Só cota do Icy Quill.') },
  'Yun Jin': { p1: u('Só tipo de golpe da habilidade.'), p2: x('O bônus de Normal da formação (2,5% a 11,5% da DEF por número de elementos) não entra.'), const1: u('Só recarga.') },
};
