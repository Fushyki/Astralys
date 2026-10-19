/** Notas, lote 1 (Ayaka a Diona). Ver `charnotes.ts`. */
import type { CharacterNotes, NoteCuration } from './characters';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });

export const NOTES_1: CharacterNotes = {
  'Kamisato Ayaka': { const1: u('Só reduz a recarga da habilidade.'), const2: x('Os 2 Frostflake extras (20% do dano da tempestade cada) não entram.') },
  Jean: { p1: u('Só cura.'), p2: u('Só energia.'), const2: u('Só velocidade de movimento e de ataque.'), const6: u('Só redução de dano recebido.') },
  Lisa: {
    p1: u('Só aplica o status Condutivo (o dano do Arco Violeta já vem do kit).'),
    const1: u('Só energia.'), const2: u('Só DEF e resistência a interrupção.'),
    const4: x('Os raios extras da Rosa Relâmpago não entram.'), const6: u('Só aplica o status Condutivo.'),
  },
  Barbara: { p1: u('Só estamina.'), p2: u('Só duração da melodia.'), const1: u('Só energia.'), const4: u('Só energia.'), const6: u('Só reviver.') },
  Kaeya: { p1: u('Só cura.'), p2: u('Só partículas.'), const2: u('Só duração do Supremo.'), const4: u('Só escudo.'), const6: x('O Icicle extra do Supremo não entra (a energia também não).') },
  Diluc: { p1: u('Só estamina e duração.') },
  Razor: { p1: u('Só recarga da habilidade.'), p2: u('Só Recarga de Energia quando a energia está abaixo de 50%: depende do momento, não entra.') },
  Amber: { const1: x('A segunda flecha (20% da primeira) não entra.'), const2: x('A explosão manual do Baron Bunny (+200%) não entra.'), const4: u('Só recarga e cargas da habilidade.') },
  Venti: { p1: u('Só mobilidade.'), p2: u('Só energia.'), const1: x('As flechas extras (33% e 20% da original) não entram.') },
  Xiangling: { p1: u('Só alcance do Guoba.'), const2: x('A explosão de 75% do ATK depois do último Normal não entra.'), const4: u('Só duração do Supremo (mais golpes: ajuste as execuções do Supremo na rotação).') },
  Beidou: {
    p1: u('O bônus do contra-ataque já está no kit (Contra-ataque com dano máximo).'), const1: u('Só escudo.'),
    const2: x('Os saltos extras do raio não entram.'), const4: x('O dano extra de 20% Electro dos Normais depois de levar dano não entra.'),
  },
  Xingqiu: { p1: u('Só cura.'), const1: u('Só aumenta o número de espadas de chuva.'), const6: u('Só energia (e a terceira espada de chuva já tem dano no kit).') },
  Xiao: { const1: u('Só cargas da habilidade.'), const2: u('Só Recarga de Energia fora de campo.'), const4: u('Só DEF com pouco HP.'), const6: u('Só cargas da habilidade.') },
  Ningguang: { p1: u('Só estamina.'), const1: x('O dano em área do Normal não entra.'), const2: u('Só recarga da habilidade.'), const4: u('Só resistência elemental da equipe.'), const6: u('Só Jades Estelares (o Carregado já usa o kit).') },
  Klee: {
    p1: x('O Carregado especial (Boom-Boom Strike) com Faísca Explosiva não entra.'), p2: u('Só energia.'),
    const4: x('A explosão ao fim do Supremo (555% do ATK) não entra.'),
  },
  Zhongli: { p1: u('Só força do escudo.'), const1: u('Só número de estelas.'), const2: u('Só escudo.'), const4: u('Só área e petrificação.'), const6: u('Só cura.') },
  Fischl: {
    p1: x('O dano do raio do Oz (152,7% da flecha) não entra.'), p2: x('O dano do Oz depois de reação (80% do ATK) não entra.'),
    const1: x('O ataque coordenado do Oz (22% do ATK) não entra.'), const2: x('O dano extra do Supremo (200% do ATK) não entra.'),
    const4: x('O dano do Supremo (222% do ATK) não entra.'), const6: x('O ataque coordenado do Oz (30% do ATK) e o ATK extra não entram.'),
  },
  Bennett: { p1: u('Só recarga da habilidade.'), p2: u('Só recarga e deslocamento da habilidade.'), const2: u('Só Recarga de Energia com pouco HP.'), const4: x('O ataque extra do Passion Overload (135%) não entra.') },
  Tartaglia: {
    p1: u('Só duração do Maré.'), p2: u('Só aplica Maré.'), const1: u('Só recarga do Supremo.'), const2: u('Só energia.'),
    const4: x('Os golpes de Maré automáticos (Slash e Flash) não entram.'), const6: u('Só recarga.'),
  },
  Noelle: { p1: u('Só escudo.'), p2: u('Só recarga da habilidade.'), const1: u('Só cura.'), const4: x('A explosão da Couraça (400% do ATK) não entra.') },
  Qiqi: { p1: u('Só cura.'), p2: u('Só marca do Talismã.'), const1: u('Só energia.'), const4: u('Só reduz o ATK do inimigo e cura.'), const6: u('Só reviver.') },
  Chongyun: { p1: u('Só velocidade de ataque.'), const1: x('As 3 lâminas de gelo (50% do ATK cada) não entram.'), const2: u('Só recarga.'), const4: u('Só energia.') },
  Ganyu: { const2: u('Só cargas da habilidade.'), const6: u('Só dispensa a carga da flecha.') },
  Albedo: {
    p1: x('Os +25% de dano das Flores Transitórias (inimigo com menos de 50% de HP) e os +240% da DEF não entram.'),
    const2: x('O dano extra por DEF (30% da DEF por stack, até 4) do Supremo e das Flores Fatais não entra.'),
  },
  Diona: { p1: u('Só mobilidade e estamina.'), p2: u('Só reduz o ATK do inimigo.'), const1: u('Só energia.'), const4: u('Só tempo de mira.') },
};
