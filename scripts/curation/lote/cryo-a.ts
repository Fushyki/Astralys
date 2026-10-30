/**
 * Lote Cryo A: Kamisato Ayaka, Kaeya, Qiqi, Chongyun, Ganyu, Diona. Tudo conferido contra o Lunaris 7.1.53.
 * Correções: Ayaka C4, Chongyun A4 e Ganyu C1 (debuffs de 6 a 8 s) eram sempre ligados e viram janelas; Ganyu A1 dava +20% de Taxa
 * Crítica em TODO golpe (agora só em golpes de Normal, onde ficam as Frostflake Arrows no cadastro); Ganyu C4 vira 5 degraus de 5%.
 * Novos: Chongyun A4 (lâmina de 100% da habilidade), Qiqi A4/C2/C6 (Radiance), Diona A4 (Icy Paws extras) e C6 (HP e Radiance).
 * Conferidos e mantidos sem mudança: Ayaka A1/A4/C2/C6, Kaeya C1, Qiqi C2 (+15%), Chongyun C1/C6, Ganyu A4, Diona C2/C6 (EM).
 */
import type { BuffCuration, NoteCuration, ProcCuration, Src } from '../characters';
import type { InfoCuration } from '../piloto-personagens';
import type { Lote } from './index';

const x = (note: string): NoteCuration => ({ kind: 'partial', note });

const buffs: Record<string, BuffCuration[]> = {
  'Kamisato Ayaka': [
    {
      id: 'c4', label: 'Ayaka C4', src: 'const4', scope: 'self', timed: true, defShred: { p: 0 },
      expect: 'DEF decreased by 30%',
      note: 'DEF do inimigo -30% por 6 s depois de ser atingido pelos Frostflake Seki no To do Supremo: janela de tempo, o usuário liga e decide a duração. Antes estava sempre ligado.',
    },
  ],
  Qiqi: [
    {
      id: 'a4rad', label: 'Qiqi A4 (Radiance)', src: 'p4', scope: 'team', timed: true,
      stats: { reactionBonus: { superconduct: { p: 1 }, stellarconduct: { p: 1 }, stellarswirl: { p: 1 } } },
      expect: 'Superconduct and Stellar-Conduct reaction DMG is increased by 50%',
      note: 'Radiance: Stellar Glimmer, enquanto o Herald of Frost está em campo: +50% de DMG de Supercondutor, Estelar-Conduct e Redemoinho Estelar para a equipe (janela). O +50% do Redemoinho de Cryo comum NÃO entra (o formato não separa o elemento do Redemoinho).',
    },
    {
      id: 'c2atk', label: 'Qiqi C2 (Radiance: ATK)', src: 'const2', scope: 'self', timed: true, stats: { atkPct: { p: 0 } },
      expect: "Qiqi's ATK is increased by 50%",
      note: 'Radiance: Stellar Glimmer: +50% de ATK da Qiqi (janela; o texto não dá duração). O +15% de Normal/Carregado contra Cryo está no "Qiqi C2".',
    },
    {
      id: 'c6', label: 'Qiqi C6 (Glimpse of Mystery)', src: 'const6', scope: 'others', timed: true,
      convert: { from: 'atk', perPoint: { p: 1 }, to: ['stellarconductFlat', 'stellarswirlFlat'] },
      expect: "DMG dealt is increased by 600% of Qiqi's ATK",
      note: 'Dano de Estelar-Conduct / Redemoinho Estelar do personagem em campo (não a Qiqi) +600% do ATK dela por reação, até 4 reações em 12 s depois do Supremo: ligue a janela só sobre as reações que consomem o stack. Assume que o bônus soma à base da reação (como o C1 da Mizuki).',
    },
  ],
  Chongyun: [
    {
      id: 'a4', label: 'Chongyun A4', src: 'p2', scope: 'self', timed: true, resShred: { value: { p: 1, x: -1 }, elements: ['Cryo'] },
      expect: 'Cryo RES decreased by 10%',
      note: 'RES Cryo do inimigo -10% por 8 s depois da lâmina que sai quando o campo desaparece: janela de tempo, o usuário liga e decide a duração. Antes estava sempre ligado.',
    },
  ],
  Ganyu: [
    {
      id: 'a1', label: 'Ganyu A1', src: 'p1', scope: 'self', timed: true, stats: { critRateByType: { normal: { p: 1 } } },
      expect: 'CRIT Rate of subsequent Frostflake Arrows',
      note: '+20% de Taxa Crítica por 5 s nas Frostflake Arrows seguintes e nos florescimentos (no cadastro são golpes de Normal; antes valia em todo golpe). A primeira flecha não recebe. Ligue a janela só sobre elas: os Normais 1 a 6 também receberiam.',
    },
    {
      id: 'c1', label: 'Ganyu C1', src: 'const1', scope: 'self', timed: true, resShred: { value: { p: 0, x: -1 }, elements: ['Cryo'] },
      expect: "decrease opponents' Cryo RES by 15%",
      note: 'RES Cryo do inimigo -15% por 6 s depois de uma Frostflake Arrow de carga nível 2 (ou o florescimento) acertar: janela de tempo, o usuário liga e decide a duração. Antes estava sempre ligado. A energia (2) é informativa.',
    },
    {
      id: 'c4', label: 'Ganyu C4', src: 'const4', scope: 'team', timed: true, stats: { dmgPct: { lit: 0.25 } },
      stacks: { max: 5, unit: 'degraus de 5%', default: 5 },
      expect: 'increases by 5% every 3s, up to a maximum of 25%',
      note: 'O inimigo dentro da Chuva Celestial recebe +5% de dano a cada 3 s, até 25% (5% e 25% são literais do texto): escolha os degraus de 0 a 5 e ligue a janela. Entra como DMG% da equipe (dano recebido pelo inimigo).',
    },
  ],
  Diona: [
    {
      id: 'c6hp', label: 'Diona C6 (HP)', src: 'const6', scope: 'self', timed: false, stats: { hpPct: { p: 2 } },
      expect: "Diona's Max HP is increased by 25%",
      note: '+25% de HP máximo da Diona, sempre. A Maestria da equipe está em "Diona C6"; a cura recebida é informativa.',
    },
    {
      id: 'c6rad', label: 'Diona C6 (Radiance)', src: 'const6', scope: 'team', timed: true,
      stats: { reactionBonus: { superconduct: { p: 3 }, stellarconduct: { p: 3 }, stellarswirl: { p: 3 } } },
      expect: 'Superconduct, Stellar-Conduct reaction DMG increased by 40%',
      note: 'Radiance: Stellar Glimmer, dentro do Signature Mix: +40% de DMG de Supercondutor, Estelar-Conduct e Redemoinho Estelar (janela). O +40% do Redemoinho de Cryo comum NÃO entra (o formato não separa o elemento do Redemoinho).',
    },
  ],
};

const procs: Record<string, ProcCuration[]> = {
  Chongyun: [
    {
      id: 'a4', label: 'Chongyun A4: lâmina do campo', src: 'p2', scale: {}, of: { talent: 'skill', label: 'Skill DMG', fraction: { p: 0 } },
      expect: "dealing 100% of Chonghua's Layered Frost's Skill DMG",
      note: 'Quando o campo desaparece, uma lâmina causa 100% do Skill DMG da habilidade como Cryo em área (uma execução). O texto não diz que conta como dano de habilidade, então não recebe bônus de habilidade. A RES Cryo -10% está no buff "Chongyun A4".',
    },
  ],
  Diona: [
    {
      id: 'a4', label: 'Diona A4: Icy Paw extra', src: 'p4', scale: {}, of: { talent: 'skill', label: 'Icy Paw DMG', fraction: { lit: 1 } },
      expect: 'Diona will also fire off three Icy Paws',
      note: 'Cada Icy Paw extra vale 100% do Icy Paw DMG (por garra, sem partículas e sem escudo); são 3 por disparo (use 3 execuções), no máximo 1 disparo a cada 3,5 s por 20 s depois da habilidade, quando o time dispara Estelar-Conduct, Supercondutor, Redemoinho Cryo ou Redemoinho Estelar. O texto não diz que conta como habilidade, então não recebe bônus de habilidade (nem o C2).',
    },
  ],
};

const notes: Record<string, Partial<Record<Src, NoteCuration | null>>> = {
  Kaeya: {
    const6: x('Pendente: o texto não diz quantos acertos cada icicle dá; entra o Skill DMG do Supremo por execução e o icicle extra você soma como execução a mais. A energia (15) é só informativa.'),
  },
  Qiqi: {
    p4: x('Entra o +50% de Supercondutor, Estelar-Conduct e Redemoinho Estelar (Radiance, janela). Pendente: o +50% do Redemoinho Cryo comum (o formato não separa o elemento). A recarga do Herald of Frost (15 s) é informativa.'),
    const2: x('Entram +15% de Normal/Carregado contra Cryo (assumido sempre) e, no Radiance, +50% de ATK (janela).'),
    const6: x('Entram os +600% do ATK da Qiqi nas reações Estelares do personagem em campo (janela). Reviver e 50% de HP são informativos; o limite de 4 stacks e os 12 s você controla pela janela.'),
  },
  Chongyun: {
    p2: x('Entram a lâmina de 100% do Skill DMG e a RES Cryo -10% por 8 s (janela).'),
    const6: x('Entram +15% de DMG do Supremo contra inimigo com menos HP% que ele (janela). A espada extra: Pendente, o texto não diz a quantidade base de espadas; some uma execução do Supremo.'),
  },
  Diona: {
    p4: x('Entram os 3 Icy Paws extras (golpe extra). Não entram o estado Radiance de Polestar Field e de 8 s depois de um Redemoinho Estelar: dependem do time.'),
    const2: x('Entra +15% de DMG da habilidade (sempre). A absorção do escudo e o escudo extra são informativos.'),
    const6: x('Entram +200 de Maestria acima de 50% de HP (janela), +25% do HP máximo dela e +40% das reações Estelares (Radiance, janela). A cura recebida +30% é informativa. Pendente: +40% do Redemoinho Cryo comum.'),
  },
};

const infos: Record<string, InfoCuration[]> = {
  'Kamisato Ayaka': [
    { src: 'const1', kind: 'recarga', label: 'Recarga do Hyouka', text: 'cai {0} s com {1%} de chance quando Normal ou Carregado causa Cryo; no máximo uma vez a cada {2} s', values: [{ p: 1 }, { p: 0 }, { p: 2 }], expect: 'it has a 50% chance of decreasing the CD of Kamisato Art: Hyouka by 0.3s' },
  ],
  Kaeya: [
    { src: 'p1', kind: 'cura', label: 'Cura do Frostgnaw', text: 'Recupera {0%} do ATK dele em HP a cada acerto do Frostgnaw', values: [{ lit: 0.15 }], expect: 'regenerates HP for Kaeya equal to 15% of his ATK' },
    { src: 'const4', kind: 'escudo', label: 'Escudo do Frozen Kiss', text: 'Com HP abaixo de {0%}, escudo de {1%} do HP máximo por {2} s (absorve Cryo {3%} melhor); uma vez a cada {4} s', values: [{ lit: 0.2 }, { lit: 0.3 }, { lit: 20 }, { lit: 2.5 }, { lit: 60 }], expect: "absorbs damage equal to 30% of Kaeya's Max HP" },
    { src: 'const6', kind: 'energia', label: 'Energia ao usar o Supremo', text: '{0} de Energia ao usar o Glacial Waltz', values: [{ lit: 15 }], expect: 'regenerate 15 Energy when cast' },
  ],
  Qiqi: [
    { src: 'p1', kind: 'cura', label: 'Cura recebida do Herald of Frost', text: '+{0%} de cura recebida por {1} s ao disparar uma reação sob o Herald of Frost', values: [{ lit: 0.2 }, { lit: 8 }], expect: 'Incoming Healing Bonus is increased by 20% for 8s' },
    { src: 'p4', kind: 'recarga', label: 'Recarga do Herald of Frost', text: 'cai para {0} s', values: [{ p: 0 }], expect: 'is reduced to 15s' },
    { src: 'const1', kind: 'energia', label: 'Energia do Talismã', text: '{0} de Energia quando o Herald of Frost acerta um inimigo marcado', values: [{ lit: 2 }], expect: 'regenerates 2 Energy' },
    { src: 'const1', kind: 'energia', label: 'Energia no Radiance', text: '{0} de Energia nos ataques do Herald of Frost; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'also regenerates 6 Elemental Energy' },
    { src: 'const4', kind: 'cura', label: 'Cura extra do Talismã', text: 'O aliado com menos HP% recebe {0%} do ATK dela quando o Talismã cura', values: [{ p: 0 }], expect: "180% of Qiqi's ATK" },
    { src: 'const6', kind: 'cura', label: 'Cura ao reviver', text: 'Revive os aliados caídos com {0%} do HP; uma vez a cada 15 min', values: [{ lit: 0.5 }], expect: 'regenerates 50% of their HP' },
  ],
  Chongyun: [
    { src: 'const2', kind: 'recarga', label: 'Recarga dentro do campo', text: 'Habilidade e Supremo lançados no campo têm a recarga reduzida em {0%}', values: [{ p: 0 }], expect: 'have their CD time decreased by 15%' },
    { src: 'const4', kind: 'energia', label: 'Energia que ele recupera', text: '{0} de Energia ao acertar um inimigo com Cryo; no máximo uma vez a cada {1} s', values: [{ p: 0 }, { p: 1 }], expect: 'regenerates 1 Energy every time he hits an opponent affected by Cryo' },
  ],
  Ganyu: [
    { src: 'const1', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia por Frostflake Arrow de carga nível 2 que acerta', values: [{ p: 2 }], expect: 'regenerates 2 Energy for Ganyu' },
  ],
  Diona: [
    { src: 'const1', kind: 'energia', label: 'Energia que ela recupera', text: '{0} de Energia quando o Signature Mix termina', values: [{ p: 0 }], expect: 'Regenerates 15 Energy for Diona' },
    { src: 'const2', kind: 'escudo', label: 'Escudo do Icy Paws', text: 'Absorção do escudo +{0%}; os aliados próximos recebem um escudo de {1%} da absorção por {2} s', values: [{ p: 1 }, { p: 2 }, { p: 3 }], expect: "increases its shield's DMG Absorption by 15%" },
    { src: 'const6', kind: 'cura', label: 'Cura recebida com HP baixo', text: '+{0%} de cura recebida com HP de 50% ou menos no Signature Mix', values: [{ p: 0 }], expect: 'Incoming Healing Bonus is increased by 30%' },
  ],
};

export const LOTE: Lote = { buffs, procs, notes, infos };
