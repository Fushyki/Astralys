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
  Ineffa: { const4: u('Só energia.') },
  Lauma: { const1: u('Só cura.'), const4: u('Só energia.') },
  Flins: { const1: u('Só recarga e energia.') },
  Aino: { p1: u('Só deixa as bolas do Supremo mais frequentes e maiores: ajuste as execuções do golpe na rotação.'), const4: u('Só energia.') },
  Nefer: {
    p2: u('Só gera mais Verdant Dew (recurso do Phantasm Performance).'),
    const1: x('Os +60% da Maestria na base do Lunar-Florescer do Phantasm Performance (e o reforço do Veil of Falsehood) não entram: o motor não soma escala só a alguns golpes do kit.'),
    const2: x('A Maestria extra (200 no lugar de 100) entra; o Phantasm Performance com até 140% do dano original não entra (depende dos stacks de Veil of Falsehood).'),
  },
  Durin: {
    const1: x('Os stacks de Cycle of Enlightenment dos aliados (dano extra por golpe) não entram: dano fixo que vem de outro personagem.'),
    const6: x('A redução de 30% de DEF do inimigo (6 s) e o dano extra do Principle of Darkness não entram.'),
  },
  Jahoda: { p1: x('O Burst melhorado conforme os elementos do time não entra.'), const1: x('A segunda bola (50% de chance) não entra.'), const2: x('Só amplia o A1 (robôs melhorados pelos elementos do time), que não entra.'), const4: u('Só energia.') },
  Columbina: { p2: x('Os golpes extras por chance (33%) do Lunar-Carregado e do Lunar-Cristalizar e o Moonridge Dew não entram: dependem de chance; ponha os golpes a mais na rotação.') },
  Zibai: {
    p1: x('O dano extra do 2º golpe do Spirit Steed\'s Stride (60% da DEF) não entra: o motor não tem bônus Lunar só de um golpe.'),
    const1: x('Os +220% de DMG Lunar-Cristalizar só no 1º Spirit Steed\'s Stride não entram (bônus de um golpe só).'),
    const2: x('O +30% da equipe entra (faixa); os +550% da DEF no 2º golpe do Spirit Steed\'s Stride não entram (bônus de um golpe só).'),
  },
  Illuga: { const1: u('Só energia.') },
  Varka: {
    const1: x('O uso extra da habilidade especial e o bônus do Lyrical Libation não entram.'),
  },
  Lohen: {
    p1: x('A mecânica de Will to Win não entra.'), const1: x('A mecânica de Will to Win não entra.'),
    const4: x('O Supremo no máximo de Will to Win e a energia não entram.'), const6: x('O Joy máximo e o dano da habilidade especial não entram.'),
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
