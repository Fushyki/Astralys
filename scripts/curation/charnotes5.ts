/** Notas, lote 5 (Varesa C1 a Valeriy). Ver `charnotes.ts`. */
import type { CharacterNotes, NoteCuration } from './characters';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });
const LUNAR = 'Depende das mecânicas Lunar, Estelar ou Moonsign, que o motor ainda não modela.';

export const NOTES_5: CharacterNotes = {
  Varesa: { const1: u('Já considerado no A1 (a onda de choque usa 180% do ATK).'), const2: u('Só energia e resistência a interrupção.') },
  Escoffier: {
    p1: u('Só cura.'),
    const2: x('O dano extra dos aliados por Cold Dish (240% do ATK da Escoffier por golpe Cryo) não entra: dano fixo que vem de outro personagem.'),
    const4: u('Só cura e energia.'),
  },
  Ifa: { p1: x(LUNAR), const1: u('Só energia.'), const2: x(LUNAR) },
  Skirk: { p1: x('Os Void Rifts e a absorção (dano extra) não entram.'), const6: x('Os ataques coordenados por Havoc: Sever não entram.') },
  Dahlia: { p1: u('Só stacks de Benison.'), p2: u('Só velocidade de ataque.'), const1: u('Só energia.'), const2: u('Só escudo.'), const4: u('Só duração.'), const6: u('Só velocidade de ataque e reviver.') },
  Ineffa: {
    p1: x(LUNAR), const1: x(LUNAR), const2: x(LUNAR), const4: u('Só energia.'), const6: x(LUNAR),
  },
  Lauma: { p1: x(LUNAR), const1: u('Só cura.'), const2: x(LUNAR), const4: u('Só energia.'), const6: x(LUNAR) },
  Flins: { p1: x(LUNAR), const1: u('Só recarga e energia.'), const2: x(LUNAR), const6: x(LUNAR) },
  Aino: { p1: x(LUNAR), const4: u('Só energia.'), const6: x(LUNAR) },
  Nefer: { p2: x(LUNAR), const1: x(LUNAR), const2: x(LUNAR), const6: x(LUNAR) },
  Durin: {
    const1: x('Os stacks de Cycle of Enlightenment dos aliados (dano extra por golpe) não entram: dano fixo que vem de outro personagem.'),
    const6: x('A redução de 30% de DEF do inimigo (6 s) e o dano extra do Principle of Darkness não entram.'),
  },
  Jahoda: { p1: x('O Burst melhorado conforme os elementos do time não entra.'), const1: x('A segunda bola (50% de chance) não entra.'), const2: x(LUNAR), const4: u('Só energia.'), const6: x(LUNAR) },
  Columbina: { p2: x(LUNAR), const1: x(LUNAR), const4: x(LUNAR), const6: x(LUNAR) },
  Zibai: {
    p1: x('O dano extra do 2º golpe do Spirit Steed\'s Stride (60% da DEF) depende do modo Lunar e não entra.'),
    const1: x(LUNAR), const2: x(LUNAR), const4: x(LUNAR), const6: x(LUNAR),
  },
  Illuga: {
    p2: x('O bônus do Nightingale\'s Song por Maestria (e de Lunar-Cristalizar) não entra.'), const1: u('Só energia.'),
    const4: x('+200 de DEF dos aliados: o motor não tem DEF fixa de buff de equipe neste caso (em breve).'),
  },
  Varka: {
    const1: x('O uso extra da habilidade especial e o bônus do Lyrical Libation não entram.'),
  },
  Lohen: {
    p1: x('A mecânica de Will to Win não entra.'), const1: x('A mecânica de Will to Win não entra.'),
    const4: x('O Supremo no máximo de Will to Win e a energia não entram.'), const6: x('O Joy máximo e o dano da habilidade especial não entram.'),
  },
  Linnea: {
    const1: x('O bônus de Lunar-Cristalizar por Field Catalog (75% da DEF) não entra.'),
    const6: x(LUNAR),
  },
  Nicole: {
    p2: u('Só faz o Grace of Kenosis virar Guidance of Theosis (o ATK está no A1).'),
    const1: x('A Arcane Projection (600% do ATK do personagem ativo) não entra.'),
    const4: x('O bônus de dano do Pathfinder\'s Blessing (valor dependente do elemento) não entra.'),
  },
  Prune: {
    const1: u('Só energia.'),
  },
  Sandrone: { p1: x(LUNAR), const1: x(LUNAR), const2: x(LUNAR), const4: x(LUNAR), const6: x('As 4 instâncias de 100% do ATK são golpe extra na paleta. A versão Estelar (Radiance) NÃO entra (mecânica Estelar ainda não modelada).') },
  Mitya: { p1: x('A Maestria por Gradient Beacon (30 cada) depende do número de Beacons e não entra.'), const4: x(LUNAR), const6: x(LUNAR) },
  Valeriy: {
    p1: u('Só acumula Impact Momentum.'),
    p2: x('O bônus do Offensive Directive por Impact Momentum (0,3% do ATK por ponto) não entra.'),
    const1: u('Só energia.'),
  },
};
