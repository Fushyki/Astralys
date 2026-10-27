/**
 * Curadoria de passivas e constelações, lote 2 (personagens antigos). Mesmas regras de `characters.ts`.
 * Quando o Lunaris traz o parâmetro zerado (personagens antigos), o número é um literal (`lit`) copiado da descrição.
 * Fora de escopo por falta de suporte no motor: Físico como elemento, redução de DEF por buff, bônus de crítico por
 * tipo de golpe e conversões de stat (ATK/DMG por HP, DEF, EM ou ER).
 */
import type { BuffCuration } from './characters';

export const CHARACTERS_2: Record<string, BuffCuration[]> = {
  Jean: [
    { id: 'c1', label: 'Jean C1', src: 'const1', scope: 'self', timed: true, stats: { byType: { skill: { p: 0 } } }, expect: 'increases the DMG dealt by 40%', note: '+40% de DMG da habilidade (Gale Blade) depois de segurar por mais de 1 s: ligue nas janelas.' },
    { id: 'c4', label: 'Jean C4', src: 'const4', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Anemo'] }, expect: 'Anemo RES decreased by 40%', note: 'Assume a redução de RES Anemo dentro do campo do Supremo sempre ativa.' },
  ],
  Barbara: [
    { id: 'c2', label: 'Barbara C2', src: 'const2', scope: 'team', timed: true, forElements: ['Hydro'], stats: { dmgPct: { lit: 0.15 } }, expect: 'gains a 15% Hydro DMG Bonus', note: '+15% de DMG Hydro do personagem em campo durante a habilidade: ligue nas janelas. Só personagens Hydro recebem.' },
  ],
  Razor: [
    { id: 'c1', label: 'Razor C1', src: 'const1', scope: 'self', timed: true, stats: { dmgPct: { lit: 0.1 } }, expect: "increases Razor's DMG by 10%", note: '+10% de DMG por 8 s depois de pegar partícula: ligue nas janelas.' },
    { id: 'c2', label: 'Razor C2', src: 'const2', scope: 'self', timed: true, stats: { critRate: { lit: 0.1 } }, expect: 'by 10%', note: '+10% de Taxa Crítica contra inimigos com menos de 30% de HP: ligue nas janelas.' },
    { id: 'c6', label: 'Razor C6', src: 'const6', scope: 'self', timed: true, stats: { critRate: { p: 0 }, critDmg: { p: 1 } }, expect: 'CRIT Rate is increased by 10% and CRIT DMG by 50%', note: '+10% de Taxa e +50% de Dano Crítico por 15 s depois de consumir Sigilos: ligue nas janelas.' },
  ],
  Amber: [
    { id: 'a4', label: 'Amber A4', src: 'p2', scope: 'self', timed: true, stats: { atkPct: { p: 0 } }, expect: 'increase ATK by 15%', note: '+15% de ATK por 10 s depois de acertar ponto fraco com tiro mirado: ligue nas janelas.' },
    { id: 'c6', label: 'Amber C6', src: 'const6', scope: 'team', timed: true, stats: { atkPct: { p: 1 } }, expect: 'ATK by 15% for 10s', note: '+15% de ATK da equipe por 10 s depois da Chuva de Fogo: ligue nas janelas.' },
  ],
  Xinyan: [
    { id: 'a4', label: 'Xinyan A4', src: 'p2', scope: 'team', timed: true, stats: { physDmgPct: { p: 0 } }, expect: 'deal 15% increased Physical DMG', note: '+15% de DMG Físico para quem está protegido pelo escudo da habilidade: ligue nas janelas.' },
    { id: 'c4', label: 'Xinyan C4', src: 'const4', scope: 'self', timed: false, resShred: { value: { p: 0, x: -1 }, elements: ['Physical'] }, expect: "decreases opponent's Physical RES by 15%", note: 'Assume a redução de RES Física (12 s) depois do golpe da habilidade sempre ativa.' },
  ],
  Mika: [
    { id: 'a1', label: 'Mika A1', src: 'p1', scope: 'team', timed: true, stats: { physDmgPct: { p: 0, x: 3 } }, expect: 'increasing their Physical DMG by 10%', note: 'Assume os 3 stacks de Detector (+10% de DMG Físico cada) no personagem em campo durante a Soulwind: ligue nas janelas.' },
    { id: 'a4', label: 'Mika A4', src: 'p2', scope: 'team', timed: true, stats: { physDmgPct: { lit: 0.1 } }, expect: 'maximum number of stacks that can be gained through Soulwind alone is increased by 1', note: '+1 stack de Detector (+10% de DMG Físico, o valor por stack da A1): ligue nas janelas junto com a A1.' },
    { id: 'c6', label: 'Mika C6', src: 'const6', scope: 'team', timed: true, stats: { physDmgPct: { lit: 0.1 }, physCritDmg: { p: 0 } }, expect: 'deal 60% more Physical CRIT DMG', note: '+1 stack de Detector (+10% de DMG Físico) e +60% de Dano Crítico Físico para o personagem em campo durante a Soulwind: ligue nas janelas.' },
  ],
  Venti: [
    { id: 'c2', label: 'Venti C2', src: 'const2', scope: 'self', timed: false, resShred: { value: { lit: 0.24 }, elements: ['Anemo', 'Physical'] }, expect: 'decreases opponents\' Anemo RES and Physical RES by 24%', note: 'Assume a redução de RES Anemo e Física (10 s) sempre ativa.' },
    { id: 'c4', label: 'Venti C4', src: 'const4', scope: 'team', timed: true, forElements: ['Anemo'], stats: { dmgPct: { lit: 0.25 } }, expect: '25% Anemo DMG Bonus', note: '+25% de DMG Anemo por 10 s depois da habilidade ou do Supremo: ligue nas janelas.' },
    { id: 'c6', label: 'Venti C6', src: 'const6', scope: 'self', timed: false, resShred: { value: { lit: 0.2 }, elements: ['Anemo'] }, expect: 'Anemo RES decreased by 20%', note: 'Assume a redução de RES Anemo do Supremo sempre ativa (a do elemento absorvido não entra). Os +100% de Dano Crítico estão no buff Venti C6 (Dano Crítico).' },
    { id: 'c6cd', label: 'Venti C6 (Dano Crítico)', src: 'const6', scope: 'self', timed: true, stats: { critDmg: { p: 0 } }, expect: 'CRIT DMG Bonus of 100%', note: '+100% de Dano Crítico contra alvos atingidos pelo Supremo: ligue nas janelas.' },
  ],
  Beidou: [
    { id: 'a4', label: 'Beidou A4', src: 'p2', scope: 'self', timed: true, stats: { byType: { normal: { p: 0 }, charged: { p: 0 } } }, expect: 'increased by 15%', note: '+15% de DMG de Normal/Carregado por 10 s depois de contra-atacar no tempo certo: ligue nas janelas.' },
    { id: 'c6', label: 'Beidou C6', src: 'const6', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Electro'] }, expect: "Electro RES is reduced by 15%", note: 'Assume a redução de RES Electro durante o Supremo sempre ativa. Os efeitos de Radiância não entram.' },
  ],
  Xiao: [
    { id: 'a1', label: 'Xiao A1', src: 'p1', scope: 'self', timed: true, stats: { dmgPct: { lit: 0.25 } }, expect: 'The maximum DMG Bonus is 25%', note: 'Assume o teto de +25% de DMG (cresce 5% a cada 3 s do Supremo): ligue nas janelas.' },
    { id: 'a4', label: 'Xiao A4', src: 'p2', scope: 'self', timed: true, stats: { byType: { skill: { p: 1, x: 3 } } }, expect: 'increases the DMG of subsequent uses of Lemniscatic Wind Cycling by 15%', note: 'Assume 3 stacks (+45% de DMG da habilidade): ligue nas janelas.' },
  ],
  Ningguang: [
    { id: 'a4', label: 'Ningguang A4', src: 'p2', scope: 'team', timed: true, forElements: ['Geo'], stats: { dmgPct: { p: 0 } }, expect: '12% Geo DMG Bonus', note: '+12% de DMG Geo por 10 s depois de atravessar a Tela de Jade: ligue nas janelas. Só personagens Geo recebem.' },
  ],
  Noelle: [
    { id: 'c2', label: 'Noelle C2', src: 'const2', scope: 'self', timed: false, stats: { byType: { charged: { p: 1 } } }, expect: 'increases her Charged Attack DMG by 15%', note: '+15% de DMG de Ataque Carregado, sempre.' },
  ],
  Qiqi: [
    { id: 'c2', label: 'Qiqi C2', src: 'const2', scope: 'self', timed: false, stats: { byType: { normal: { lit: 0.15 }, charged: { lit: 0.15 } } }, expect: 'Normal and Charged Attack DMG against opponents affected by Cryo is increased by 15%', note: 'Assume o inimigo sempre sob Cryo (+15% de DMG de Normal/Carregado). Vale para a Qiqi, não para a equipe.' },
  ],
  Chongyun: [
    { id: 'a4', label: 'Chongyun A4', src: 'p2', scope: 'self', timed: false, resShred: { value: { p: 1, x: -1 }, elements: ['Cryo'] }, expect: 'Cryo RES decreased by 10%', note: 'Assume a redução de RES Cryo (8 s) sempre ativa.' },
    { id: 'c6', label: 'Chongyun C6', src: 'const6', scope: 'self', timed: true, stats: { byType: { burst: { p: 0 } } }, expect: 'deals 15% more DMG', note: '+15% de DMG do Supremo contra inimigos com menos HP% que ele: ligue nas janelas.' },
  ],
  Diona: [
    { id: 'c2', label: 'Diona C2', src: 'const2', scope: 'self', timed: false, stats: { byType: { skill: { p: 0 } } }, expect: "Increases Icy Paws' DMG by 15%", note: '+15% de DMG da habilidade, sempre.' },
    { id: 'c6', label: 'Diona C6', src: 'const6', scope: 'team', timed: true, stats: { em: { p: 1 } }, expect: 'Elemental Mastery is increased by 200', note: '+200 de Maestria da equipe dentro do campo com HP acima de 50%: ligue nas janelas.' },
  ],
  Mona: [
    { id: 'c2', label: 'Mona C2', src: 'const2', scope: 'team', timed: true, stats: { em: { p: 4 } }, expect: 'Elemental Mastery increased by 80', note: '+80 de Maestria da equipe por 12 s depois do Ataque Carregado da Mona: ligue nas janelas.' },
    { id: 'c4', label: 'Mona C4', src: 'const4', scope: 'team', timed: true, stats: { critRate: { p: 0, x: -1 } }, expect: 'CRIT Rate is increased by 15%', note: '+15% de Taxa Crítica da equipe contra inimigos com Presságio: ligue nas janelas.' },
    { id: 'c6', label: 'Mona C6', src: 'const6', scope: 'self', timed: true, stats: { byType: { charged: { p: 2 } } }, expect: 'A maximum DMG Bonus of 180%', note: 'Assume o teto de +180% de DMG do próximo Ataque Carregado: ligue nas janelas. Os 200% extras contra Presságio não entram.' },
  ],
  Keqing: [
    { id: 'a4', label: 'Keqing A4', src: 'p2', scope: 'self', timed: true, stats: { critRate: { p: 0 } }, expect: 'CRIT Rate is increased by 15%', note: '+15% de Taxa Crítica por 8 s depois da habilidade: ligue nas janelas. Os +15% de Recarga não entram.' },
    { id: 'c4', label: 'Keqing C4', src: 'const4', scope: 'self', timed: true, stats: { atkPct: { p: 1 } }, expect: 'her ATK is increased by 25%', note: '+25% de ATK por 10 s depois de uma reação com Electro: ligue nas janelas.' },
    { id: 'c6', label: 'Keqing C6', src: 'const6', scope: 'self', timed: true, stats: { dmgPct: { p: 0, x: 4 } }, expect: 'gains a 6% Electro DMG Bonus', note: 'Assume 4 efeitos independentes ativos (+24% de DMG Electro): ligue nas janelas.' },
  ],
  Sucrose: [
    { id: 'a1', label: 'Sucrose A1', src: 'p1', scope: 'others', timed: true, stats: { em: { p: 0 } }, expect: 'Elemental Mastery increased by 50', note: '+50 de Maestria dos demais com o elemento absorvido pelo Espalhar: ligue nas janelas em que o elemento bate. A parte de 20% da Maestria da Sucrose (A4) ainda não entra.' },
    { id: 'c6', label: 'Sucrose C6', src: 'const6', scope: 'team', timed: true, stats: { dmgPct: { p: 0 } }, expect: 'all party members gain a 20% Elemental DMG Bonus', note: '+20% de DMG do elemento absorvido durante o Supremo: ligue nas janelas em que o elemento bate com o de quem ataca.' },
  ],
  Rosaria: [
    { id: 'c6', label: 'Rosaria C6', src: 'const6', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Physical'] }, expect: "decreases opponents' Physical RES by 20%", note: 'Assume a redução de RES Física do Supremo (10 s) sempre ativa.' },
    { id: 'a1', label: 'Rosaria A1', src: 'p1', scope: 'self', timed: true, stats: { critRate: { p: 0 } }, expect: "Rosaria's CRIT Rate increases by 12%", note: '+12% de Taxa Crítica por 5 s depois de acertar pelas costas: ligue nas janelas.' },
    { id: 'a4', label: 'Rosaria A4', src: 'p2', scope: 'others', timed: true, stats: { critRate: { p: 2 } }, expect: 'cannot exceed 15%', note: 'Assume o teto de +15% de Taxa Crítica dos demais por 10 s depois do Supremo (o valor real é 15% da Taxa da Rosaria): ligue nas janelas.' },
    { id: 'c1', label: 'Rosaria C1', src: 'const1', scope: 'self', timed: true, stats: { byType: { normal: { p: 1 } } }, expect: 'Normal Attack DMG increases by 10%', note: '+10% de DMG de Normal por 4 s depois de um acerto crítico: ligue nas janelas.' },
  ],
  Yoimiya: [
    { id: 'a1', label: 'Yoimiya A1', src: 'p1', scope: 'self', timed: true, stats: { dmgPct: { p: 0, x: 10 } }, expect: 'Pyro DMG Bonus by 2% on hit', note: 'Assume 10 stacks (+20% de DMG Pyro) durante o Niwabi: ligue nas janelas.' },
    { id: 'a4', label: 'Yoimiya A4', src: 'p2', scope: 'others', timed: true, stats: { atkPct: { p: 0 } }, expect: 'to gain a 10% ATK increase for 15s', note: '+10% de ATK da equipe por 15 s depois do Ryuukin Saxifrage: ligue nas janelas.' },
    { id: 'a4s', label: 'Yoimiya A4 (stacks da A1)', src: 'p2', scope: 'others', timed: true, stats: { atkPct: { p: 1, x: 10 } }, stacks: { max: 10, of: 'a1' }, expect: 'to gain a 10% ATK increase for 15s', note: '+1% de ATK da equipe por stack da A1 que ela tem ao usar o Ryuukin Saxifrage (a mesma quantidade escolhida na A1): ligue junto com o A4.' },
    { id: 'c1', label: 'Yoimiya C1', src: 'const1', scope: 'self', timed: true, stats: { atkPct: { p: 1 } }, expect: "Yoimiya's ATK is increased by 20%", note: '+20% de ATK por 20 s depois de derrotar inimigo sob a Marca Dourada: ligue nas janelas.' },
    { id: 'c2', label: 'Yoimiya C2', src: 'const2', scope: 'self', timed: true, stats: { dmgPct: { p: 0 } }, expect: 'gain a 25% Pyro DMG Bonus', note: '+25% de DMG Pyro por 6 s depois de um acerto crítico Pyro: ligue nas janelas.' },
  ],
  'Sangonomiya Kokomi': [
    { id: 'c6', label: 'Kokomi C6', src: 'const6', scope: 'self', timed: true, stats: { dmgPct: { p: 1 } }, expect: 'gains a 40% Hydro DMG Bonus', note: '+40% de DMG Hydro por 4 s quando Normal/Carregado curam alguém com 80% de HP ou mais: ligue nas janelas.' },
  ],
  'Kujou Sara': [
    { id: 'c6', label: 'Sara C6', src: 'const6', scope: 'team', timed: true, forElements: ['Electro'], stats: { critDmg: { p: 0 } }, expect: 'CRIT DMG increased by 60%', note: '+60% de Dano Crítico Electro de quem recebeu o bônus de ATK do Tengu: ligue nas janelas. O bônus de ATK em si depende do ATK base da Sara e não entra.' },
  ],
  'Arataki Itto': [
    { id: 'c4', label: 'Itto C4', src: 'const4', scope: 'team', timed: true, stats: { atkPct: { p: 1 }, defPct: { p: 0 } }, expect: 'gain 20% DEF and 20% ATK', note: '+20% de ATK e +20% de DEF da equipe por 10 s depois do Supremo: ligue nas janelas.' },
  ],
  'Shikanoin Heizou': [
    { id: 'a4', label: 'Heizou A4', src: 'p2', scope: 'others', timed: true, stats: { em: { p: 1 } }, expect: 'Elemental Mastery by 80', note: '+80 de Maestria dos demais por 10 s depois do Golpe: ligue nas janelas.' },
  ],
  Kirara: [
    { id: 'c6', label: 'Kirara C6', src: 'const6', scope: 'team', timed: true, stats: { dmgPct: { p: 0 } }, expect: '12% All Elemental DMG Bonus', note: '+12% de DMG elemental da equipe por 15 s depois da habilidade ou Supremo: ligue nas janelas.' },
  ],
  Aloy: [
    { id: 'a1', label: 'Aloy A1 (própria)', src: 'p1', scope: 'self', timed: true, stats: { atkPct: { p: 0, x: 2 } }, expect: 'her ATK is increased by 16%', note: '+16% de ATK por 10 s depois do efeito Coil: ligue nas janelas.' },
    { id: 'a1o', label: 'Aloy A1 (equipe)', src: 'p1', scope: 'others', timed: true, stats: { atkPct: { p: 0 } }, expect: "nearby party members' ATK is increased by 8%", note: '+8% de ATK dos demais por 10 s: ligue nas janelas.' },
    { id: 'a4', label: 'Aloy A4', src: 'p2', scope: 'self', timed: true, stats: { dmgPct: { lit: 0.35 } }, expect: 'maximum Cryo DMG Bonus increase of 35%', note: 'Assume o teto de +35% de DMG Cryo (3,5% por segundo no estado Gelo Veloz): ligue nas janelas.' },
  ],
  'Kamisato Ayato': [
    { id: 'c1', label: 'Ayato C1', src: 'const1', scope: 'self', timed: true, stats: { byType: { skill: { p: 1 } } }, expect: 'Shunsuiken DMG is increased by 40%', note: '+40% de DMG da habilidade contra inimigos com 50% de HP ou menos: ligue nas janelas.' },
  ],
};
