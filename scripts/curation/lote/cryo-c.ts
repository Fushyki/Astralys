/**
 * Lote Cryo C: Freminet, Wriothesley, Charlotte, Escoffier, Skirk e Lohen. Tudo conferido contra o Lunaris 7.1.53.
 * Correções: Charlotte C2 tinha a tabela de stacks no valor errado (o máximo era 10%, não 30%) e o C4 dela é do Supremo, não da
 * habilidade; Escoffier A4 vira janela de 12 s; Freminet C1 vale só no Shattering Pressure (janela). Novos: Wriothesley C1 (200% do
 * Rebuke), C2 (Supremo e Normal/Carregado), C6 (gelo extra); Skirk C6 (ataques coordenados); Lohen A4 Hexerei, C2 (golpe extra) e C6.
 */
import type { BuffCuration, NoteCuration, ProcCuration } from '../characters';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const u = (note: string): NoteCuration => ({ kind: 'utility', note });
const x = (note: string): NoteCuration => ({ kind: 'partial', note });

export const LOTE: Lote = {
  buffs: {
    Freminet: [
      {
        id: 'a4', label: 'Freminet A4', src: 'p2', scope: 'self', timed: true, stats: { byType: { skill: { p: 0 } } },
        expect: 'the DMG dealt by Pressurized Floe: Shattering Pressure will be increased by 40% for 5s',
        note: '+40% de DMG por 5 s depois de Estilhaçar (Shatter): janela. O bônus é só do Shattering Pressure, mas o formato dá o bônus a todo golpe de habilidade: ligue só nos golpes Shattering Pressure.',
      },
      {
        id: 'c1', label: 'Freminet C1', src: 'const1', scope: 'self', timed: true, stats: { critRateByType: { skill: { p: 0 } } },
        expect: 'The CRIT Rate of Pressurized Floe: Shattering Pressure will be increased by 15%',
        note: '+15% de Taxa Crítica só do Shattering Pressure. O formato dá a todo golpe de habilidade, então virou janela: ligue só nos golpes Shattering Pressure (antes valia sempre, também no Upward Thrust).',
      },
      {
        id: 'c4', label: 'Freminet C4', src: 'const4', scope: 'self', timed: true, stats: { atkPct: { p: 0, x: 2 } },
        stacks: { max: 2, unit: 'stacks', default: 2 },
        expect: 'his ATK will be increased by 9%',
        note: '+9% de ATK por stack, até 2 stacks (18%), por 6 s depois de Congelar, Estilhaçar, Supercondutor ou Stellar-Conduct: janela. Assume o teto; escolha de 0 a 2.',
      },
      {
        id: 'c6', label: 'Freminet C6', src: 'const6', scope: 'self', timed: true, stats: { critDmg: { p: 0, x: 3 } },
        stacks: { max: 3, unit: 'stacks', default: 3 },
        expect: 'his CRIT DMG will be increased by 12%',
        note: '+12% de Dano Crítico por stack, até 3 stacks (36%), por 6 s: janela. Assume o teto; escolha de 0 a 3.',
      },
    ],
    Wriothesley: [
      {
        id: 'a4', label: 'Wriothesley A4', src: 'p2', scope: 'self', timed: true, stats: { atkPct: { p: 0, x: 5 } },
        stacks: { max: 5, unit: 'Prosecution Edict', default: 5 },
        expect: "Each stack will increase Wriothesley's ATK by 6%",
        note: '+6% de ATK por stack de Prosecution Edict, até 5 (30%), durante o Chilling Penalty (10 s): janela. Assume o teto; escolha de 0 a 5. A versão Radiance: Stellar-Conduct (p4) não entra.',
      },
      {
        id: 'c1r', label: 'Wriothesley C1 (Rebuke)', src: 'const1', scope: 'self', timed: true, replaces: 'a1', stats: { byType: { charged: { lit: 2 } } },
        expect: 'The DMG Bonus gained will be further increased to 200%',
        note: 'REFORÇA o A1 (não soma): o Carregado Rebuke: Vaulting Fist passa de +50% para +200% de DMG (200% é literal do texto; o Lunaris tem 1,5 de aumento, 0,5 + 1,5 = 2). Ligue só no Carregado Rebuke. A extensão de 4 s do Chilling Penalty e o Radiance não entram.',
      },
      {
        id: 'c2b', label: 'Wriothesley C2 (Supremo)', src: 'const2', scope: 'self', timed: true, stats: { byType: { burst: { p: 0, x: 5 } } },
        stacks: { max: 5, of: 'a4', unit: 'Prosecution Edict' },
        expect: 'will increase the DMG dealt by 40%',
        note: '+40% de DMG do Supremo por stack de Prosecution Edict ao soltar o Darkgold Wolfbite, até 5 (200%). Usa a mesma escolha de stacks do A4: janela no instante do Supremo.',
      },
      {
        id: 'c2n', label: 'Wriothesley C2 (5 stacks)', src: 'const2', scope: 'self', timed: true, stats: { baseMultByType: { normal: { p: 1 }, charged: { p: 2 } } },
        expect: 'Normal Attacks and Charged Attacks will deal 125% or 130% of their original DMG respectively',
        note: 'Com 5 stacks de Prosecution Edict e FORA do Radiance: Normal causa 125% e Carregado 130% do dano original (multiplica o dano base). Ligue só enquanto tiver os 5 stacks. A versão Radiance (Stellar-Conduct) não entra.',
      },
      {
        id: 'c6', label: 'Wriothesley C6', src: 'const6', scope: 'self', timed: true, stats: { critRateByType: { charged: { p: 0 } }, critDmgByType: { charged: { p: 1 } } },
        expect: 'The CRIT Rate of Rebuke: Vaulting Fist will be increased by 10%, and its CRIT DMG by 80%',
        note: '+10% de Taxa Crítica e +80% de Dano Crítico no Carregado Rebuke: ligue só nele. O gelo extra está no golpe "Wriothesley C6: gelo extra"; a versão Radiance não entra.',
      },
    ],
    Charlotte: [
      {
        id: 'c2', label: 'Charlotte C2', src: 'const2', scope: 'self', timed: true, stats: { atkPct: { p: 2 } },
        stacks: { max: 3, unit: 'inimigos atingidos', default: 1, levels: [{ p: 0 }, { p: 1 }, { p: 2 }] },
        expect: "Charlotte's own ATK will be increased by 10%/20%/30%",
        note: '+10%/20%/30% de ATK dela por 12 s, conforme 1/2/3 inimigos atingidos pelo Monsieur Verite: janela. Começa com 1 inimigo (10%); escolha de 1 a 3. Corrige a tabela antiga, que valia 10% no máximo.',
      },
      {
        id: 'c4', label: 'Charlotte C4', src: 'const4', scope: 'self', timed: true, stats: { byType: { burst: { p: 0 } } },
        expect: 'it will deal 10% more DMG',
        note: '+10% de DMG do Supremo (Still Photo: Comprehensive Confirmation) contra inimigo marcado (Snappy Silhouette ou Focused Impression): janela. Antes estava em "habilidade", mas o texto fala do Supremo. A energia é informativa.',
      },
    ],
    Escoffier: [
      {
        id: 'a4', label: 'Escoffier A4', src: 'p2', scope: 'self', timed: true, resShred: { value: { lit: 1 }, elements: ['Hydro', 'Cryo'] },
        team: { scale: { of: ['Hydro', 'Cryo'], table: [{ p: 0 }, { p: 1 }, { p: 2 }, { p: 3 }] } },
        expect: 'decrease the Hydro RES and Cryo RES of any opponents hit by her Elemental Skill',
        note: 'RES Hydro e Cryo do inimigo -5%/10%/15%/55% com 1/2/3/4 personagens Hydro ou Cryo no time (ela conta), por 12 s depois da habilidade ou do Supremo dela: janela de tempo (antes era sempre ligado).',
      },
    ],
    Lohen: [
      {
        id: 'a4hex', label: 'Lohen A4 (Hexerei)', src: 'p4', scope: 'self', timed: true, team: { hexerei: 2 },
        stats: { byType: { normal: { p: 1 }, charged: { p: 1 } } },
        expect: 'his Normal Attack and Charged Attack DMG will be increased by 40% for 6s',
        note: 'Hexerei: Secret Rite (2 ou mais Hexerei no time, marque o Lohen como Hexerei): +40% de DMG de Normal e Carregado por 6 s depois da habilidade especial ou do Supremo, com Will to Win em 50% ou mais do limite (ligue a janela quando for o caso).',
      },
      {
        id: 'c6cd', label: 'Lohen C6 (Dano Crítico)', src: 'const6', scope: 'self', timed: true,
        stats: { critDmgByType: { skill: { p: 1 }, burst: { p: 1 } } },
        expect: 'the CRIT DMG of all the DMG described above is increased by 175%',
        note: '+175% de Dano Crítico do Etched Into Bone and Soul (o único golpe de habilidade dele) e do Supremo em Masterstroke: janela. Ligue só no Supremo dado em Masterstroke; o Supremo fora do modo não recebe.',
      },
    ],
  },
  procs: {
    Wriothesley: [
      {
        id: 'c6i', label: 'Wriothesley C6: gelo extra', src: 'const6', hitType: 'charged', scale: {},
        of: { talent: 'normal', label: 'Charged Attack DMG', fraction: { p: 2 } },
        expect: "it will also create an additional icicle that deals 100% of Rebuke: Vaulting Fist",
        note: '100% do dano base do Carregado (Rebuke: Vaulting Fist), em Cryo, conta como Carregado. Insira junto com o Rebuke. A versão Radiance (20%, Stellar-Conduct) não entra.',
      },
    ],
    Skirk: [
      {
        id: 'c6b', label: 'Skirk C6: Havoc: Sever (Supremo)', src: 'const6', hitType: 'burst', scale: { atk: { p: 1 } },
        expect: 'each Havoc: Sever stack will deal 750% of Skirk',
        note: '750% do ATK POR stack de Havoc: Sever consumido pelo Havoc: Ruin (conta como Supremo). Use uma execução por stack (até 3).',
      },
      {
        id: 'c6n', label: 'Skirk C6: Havoc: Sever (Normal)', src: 'const6', hitType: 'normal', scale: { atk: { p: 2, x: 3 } },
        expect: 'launch 3 coordinated attacks. Each coordinated attack deals 180% of Skirk',
        note: '3 ataques de 180% do ATK (540%) por stack consumido no 3º ou 5º golpe do Normal no Seven-Phase Flash (conta como Normal). 1 stack por vez.',
      },
      {
        id: 'c6c', label: 'Skirk C6: Havoc: Sever (ao ser atingida)', src: 'const6', hitType: 'charged', scale: { atk: { p: 4, x: 3 } },
        expect: 'with each attack dealing 180% of Skirk',
        note: '3 ataques de 180% do ATK (540%) por stack consumido quando ela leva dano no Seven-Phase Flash (conta como Carregado). A redução de 80% do dano recebido não muda o dano causado.',
      },
    ],
    Lohen: [
      {
        id: 'c2e', label: 'Lohen C2: Evilsbane Blade', src: 'const2', scale: { atk: { p: 0 } },
        expect: 'deals AoE Cryo DMG equal to 500% of his ATK',
        note: '500% do ATK em Cryo (o texto não diz o tipo de golpe, então não recebe bônus de Normal/Habilidade), a cada 4 s depois do Etched Into Bone and Soul ou do Supremo, em Masterstroke. Os +200 de Maestria dos outros estão no buff "Lohen C2".',
      },
    ],
  },
  notes: {
    Freminet: {
      p1: u('Só redução de recarga (informativo).'),
      p3: u('Só estamina aquática.'),
      const2: u('Só energia (informativo).'),
    },
    Wriothesley: {
      p1: x('Entra o +50% de DMG do Carregado Rebuke (janela). A cura de 30% do HP máximo é informativa.'),
      p3: u('Só materiais de cozinha/forja.'),
      p4: x('Pendente: Radiance: Stellar-Conduct troca o A1 e faz golpes serem Stellar-Conduct (60%/80%/100% do dano original, +30% de dano Stellar-Conduct); o formato não tem o estado nem esse tipo de dano nos golpes de arma/Normal.'),
      const1: x('Entra o Rebuke com +200% de DMG (reforça o A1). Não entram o Gracious Rebuke extra, a extensão do Chilling Penalty e todo o Radiance: Stellar-Conduct (Pendente: estado e dano Stellar-Conduct).'),
      const2: x('Entram +40% do Supremo por stack de Prosecution Edict e os 125%/130% de Normal/Carregado com 5 stacks. Pendente: a versão Radiance (90%/120%/150% do dano original como Stellar-Conduct).'),
      const4: u('Só cura e velocidade de ataque (informativo).'),
      const6: x('Entram +10% de Taxa e +80% de Dano Crítico do Rebuke e o gelo extra de 100% (golpe extra). Pendente: a versão Radiance (gelo de 20% como Stellar-Conduct).'),
    },
    Charlotte: {
      p1: u('Só redução de recarga (informativo).'),
      p2: x('Pendente: o bônus de DMG Cryo por aliado que não é de Fontaine (5%/10%/15%) não entra porque o Lunaris não traz a nação dos personagens. O bônus de cura é só informativo.'),
      p3: u('Só o modo de foto especial (sem dano calculado).'),
      const1: u('Só cura (informativo).'),
      const4: x('Entra +10% de DMG do Supremo; a energia é informativa.'),
      const6: x('Entra o golpe de 180% do ATK (a cada 6 s). A cura de 42% do ATK é informativa.'),
    },
    Escoffier: {
      p1: u('Só cura (informativo).'),
      p3: u('Só modo de cozinha (sem dano).'),
      const4: u('Só cura e energia (informativo).'),
    },
    Skirk: {
      p1: x('Pendente: os Void Rifts dão 8 pontos de Serpent\'s Subtlety cada, e o Supremo ganha dano por ponto acima de 50 (19,32% do ATK por ponto no nível 1, até 12 pontos), mas o texto não diz se o bônus vale em cada Slash ou uma vez por instância. O bônus por Rift do Havoc: Extinction (3,5%/6,6%/8,8%/11%) também não diz sobre qual dano atua.'),
      p3: x('Pendente: +1 nível de habilidade dos aliados com time só Hydro/Cryo; o formato não muda o nível de talento dos outros.'),
      const2: x('Entra o ATK +70% por 12,5 s depois do Havoc: Extinction (janela). Pendente: os +10 pontos de Serpent\'s Subtlety no dano do Supremo (mesma dúvida do A1).'),
      const6: x('Entram os 3 golpes extras do Havoc: Sever (750% do ATK por stack no Supremo, 3 x 180% no Normal e ao ser atingida). Quantos stacks há (de 0 a 3, 15 s cada) é você quem decide em execuções.'),
    },
    Lohen: {
      p1: x('Pendente: Will to Win aumenta o dano da habilidade especial e do Supremo (0,4% por ponto), mas o texto não traz o limite de pontos; não entra.'),
      p3: x('Pendente: +1 nível da habilidade por 9 s (15 s) é nível de talento temporário; o formato não tem.'),
      p4: x('Hexerei: entra +40% de DMG de Normal e Carregado por 6 s (janela, 2 ou mais Hexerei). A condição de Will to Win em 50% do limite é você ligar a janela.'),
      const1: x('Pendente: limite de Will to Win x3 e ganho x5 dos aliados (sem o limite base no texto, não dá para calcular).'),
      const2: x('Entram o golpe de 500% do ATK (a cada 4 s) e +200 de Maestria dos outros por 8 s (janela).'),
      const4: x('Energia é informativa. Pendente: Supremo com Will to Win no máximo (sem o limite no texto).'),
      const6: x('Entram +175% de Dano Crítico da habilidade especial e do Supremo (janela de Masterstroke). Pendente: o Joy máximo, a Will to Win não consumida e a extensão de 1,25 s não têm número de dano.'),
    },
  },
  infos: {
    Freminet: [
      { src: 'p1', kind: 'recarga', label: 'Recarga do Pressurized Floe', text: 'cai {0} s ao soltar o Shattering Pressure antes do nível 4', values: [{ p: 0 }], expect: 'the CD of Pressurized Floe will be decreased by 1s' },
      { src: 'const2', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia ao soltar o Shattering Pressure; {1} no nível 4', values: [{ p: 0 }, { p: 1 }], expect: 'will restore 2 Energy to Freminet' },
    ] satisfies InfoCuration[],
    Wriothesley: [
      { src: 'p1', kind: 'cura', label: 'Cura do Rebuke', text: 'Recupera {0%} do HP máximo quando o Rebuke acerta; no máximo uma vez a cada {1} s', values: [{ p: 2 }, { p: 3 }], expect: 'restore HP for Wriothesley equal to 30% of his Max HP' },
      { src: 'const4', kind: 'cura', label: 'Cura do Rebuke (C4)', text: 'Recupera {0%} do HP máximo quando o Rebuke acerta', values: [{ lit: 0.5 }], expect: 'will be increased to 50% of his Max HP' },
    ] satisfies InfoCuration[],
    Charlotte: [
      { src: 'p1', kind: 'recarga', label: 'Recarga da habilidade', text: 'cai {0} s quando um inimigo com Focused Impression é derrotado; até {2} vezes a cada {1} s', values: [{ p: 0 }, { p: 1 }, { p: 2 }], expect: 'CD will be decreased by 2s' },
      { src: 'const1', kind: 'cura', label: 'Cura do Verification', text: 'Cura {0%} do ATK da Charlotte a cada {1} s por {2} s', values: [{ p: 1 }, { p: 0 }, { p: 2 }], expect: "for 80% of Charlotte's ATK" },
      { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia; até {2} vezes a cada {1} s', values: [{ p: 1 }, { p: 2 }, { p: 3 }], expect: 'restore 2 Energy to Charlotte' },
      { src: 'const6', kind: 'cura', label: 'Cura do Monsieur Verite', text: 'Cura {0%} do ATK da Charlotte no ataque coordenado; no máximo uma vez a cada {1} s', values: [{ p: 1 }, { p: 2 }], expect: 'heals active character(s) within the AoE for 42% of Charlotte' },
    ] satisfies InfoCuration[],
    Escoffier: [
      { src: 'p1', kind: 'cura', label: 'Cura do Rehab Diet', text: 'Recupera {0%} do ATK da Escoffier a cada 1 s por {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'based on 138.24% of Escoffier' },
      { src: 'const4', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia (chance = Taxa Crítica dela); até {1} vezes por Rehab Diet', values: [{ p: 1 }, { p: 2 }], expect: 'restoring 2 Energy to Escoffier' },
    ] satisfies InfoCuration[],
    Lohen: [
      { src: 'const4', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia ao entrar em Masterstroke com a Energia incompleta', values: [{ p: 0 }], expect: 'Lohen recovers 15 Elemental Energy' },
    ] satisfies InfoCuration[],
  },
};
