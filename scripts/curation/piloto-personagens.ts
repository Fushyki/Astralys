/**
 * Piloto da curadoria por agente (Mavuika, Citlali, Iansan, Bennett, Flins): o que faltava depois dos lotes antigos.
 * Mesmas regras de `characters.ts`: número vem de parâmetro do Lunaris (`p`) ou literal do texto (`lit`); `expect` trava
 * se o texto mudar. As notas aqui SOBREPÕEM as de `charnotes*.ts` (`null` apaga a nota).
 */
import type { BuffCuration, NoteCuration, ProcCuration, Src } from './characters';

const u = (note: string) => ({ kind: 'utility' as const, note });
const x = (note: string) => ({ kind: 'partial' as const, note });
const NIGHTSOUL_TRANSMISSION = 'Só Transmissão do Espírito da Noite e Flogisto (mobilidade e exploração).';

export const PILOTO_BUFFS: Record<string, BuffCuration[]> = {
  Flins: [
    {
      id: 'c4em', label: 'Flins C4 (A4 reforçado)', src: 'const4', scope: 'self', timed: false, replaces: 'a4',
      convert: { from: 'atk', perPoint: { p: 1 }, cap: { p: 2 }, to: ['em'] },
      expect: 'Elemental Mastery is increased by 10% of his ATK',
      note: 'Maestria = 10% do ATK, até 220. SUBSTITUI o A4 (8%, até 160) a partir da C4: não somam.',
    },
  ],
  Mavuika: [
    {
      id: 'c2sol', label: 'Mavuika C2 (Golpe Solar)', src: 'const2', scope: 'self', timed: false,
      flat: [{ name: 'Sunfell Slice por ATK (C2)', sourceStat: 'ATK', perPoint: { p: 4 }, hitTypes: ['burst'] }],
      expect: 'deal 60%, 90%, and 120% of her ATK as increased DMG respectively',
      note: 'Soma 120% do ATK ao dano base do Sunfell Slice (o único golpe do Supremo; ela o lança na forma Ignimoto).',
    },
    {
      id: 'c2base', label: 'Mavuika C2 (ATK base)', src: 'const2', scope: 'self', timed: false, stats: { atkBaseFlat: { p: 0 } },
      expect: "Mavuika's Base ATK is increased by 200",
      note: 'Soma 200 ao ATK base (personagem + arma), antes dos % de ATK. Assume a Bênção do Espírito da Noite sempre ativa.',
    },
    {
      id: 'c2norm', label: 'Mavuika C2 (Normais da Ignimoto)', src: 'const2', scope: 'self', timed: false,
      flat: [{ name: 'Normais da Ignimoto por ATK (C2)', sourceStat: 'ATK', perPoint: { p: 2 }, hitTypes: ['normal'], labels: [1, 2, 3, 4, 5].map((n) => `Flamestrider Normal Attack ${n}-Hit DMG`) }],
      expect: 'deal 60%, 90%, and 120% of her ATK as increased DMG respectively',
      note: 'Soma 60% do ATK ao dano base de cada Normal da forma Ignimoto (Flamestrider). Os Normais comuns não recebem.',
    },
    {
      id: 'c2carr', label: 'Mavuika C2 (Carregados da Ignimoto)', src: 'const2', scope: 'self', timed: false,
      flat: [{ name: 'Carregados da Ignimoto por ATK (C2)', sourceStat: 'ATK', perPoint: { p: 3 }, hitTypes: ['charged'], labels: ['Flamestrider Charged Attack Cyclic DMG', 'Flamestrider Charged Attack Final DMG'] }],
      expect: 'deal 60%, 90%, and 120% of her ATK as increased DMG respectively',
      note: 'Soma 90% do ATK ao dano base de cada golpe do Carregado da Ignimoto (Cyclic e Final). O Carregado comum não recebe.',
    },
    {
      id: 'c2anel', label: 'Mavuika C2 (Anel: DEF do inimigo)', src: 'const2', scope: 'self', timed: true, defShred: { p: 1 },
      expect: "Nearby opponents' DEF is decreased by 20%",
      note: 'DEF do inimigo -20% enquanto ela está na forma Anel (Ring of Searing Radiance), em Bênção do Espírito da Noite. Janela de tempo: o usuário liga e decide a duração.',
    },
  ],
};

export const PILOTO_PROCS: Record<string, ProcCuration[]> = {
  Mavuika: [
    { id: 'c6a', label: 'Mavuika C6: Ignimoto do Anel', src: 'const6', scale: { atk: { p: 0 } }, expect: 'dealing 200% of ATK as Nightsoul-aligned AoE Pyro DMG', note: '200% do ATK (pyro) quando um ataque do Anel das Chamas Esplendorosas acerta: um por acerto do Anel. Sem tipo de golpe (não recebe bônus de Normal/Habilidade).' },
    { id: 'c6b', label: 'Mavuika C6: Anel de Incêndio', src: 'const6', scale: { atk: { p: 1 } }, expect: 'deal 500% of ATK as Nightsoul-aligned AoE Pyro DMG', note: '500% do ATK (pyro) a cada 3 s com a Mavuika na Ignimoto. Sem tipo de golpe.' },
  ],
  Bennett: [
    {
      id: 'c4', label: 'Bennett C4: ataque extra do Passion Overload', src: 'const4', scale: {},
      // 135% do 2º ataque. O Lunaris dá "84%+92%" (nível 1): o 2º ataque é 92/176 do total em todos os 15 níveis.
      of: { talent: 'skill', label: 'Charge Level 1 DMG', fraction: { lit: (1.35 * 92) / 176 } },
      expect: "This additional attack does 135% of the second attack's DMG",
      note: '135% do 2º ataque da Carga Nível 1 (o 2º vale 92/176 do golpe, igual nos 15 níveis). Conta como habilidade.',
    },
  ],
};

export const PILOTO_NOTES: Record<string, Partial<Record<Src, NoteCuration | null>>> = {
  Mavuika: {
    p3: u(NIGHTSOUL_TRANSMISSION),
    const2: x('Entram o +200 de ATK base (assumindo a Nightsoul sempre ativa), o -20% de DEF do inimigo (janela, forma Anel) e o dano fixo de 60%, 90% e 120% do ATK (Normais, Carregados e Sunfell Slice da Ignimoto).'),
    const6: x('Os dois golpes (200% e 500% do ATK) entram como golpes extras; a redução de 20% de DEF do Anel de Incêndio não entra (debuff com condição de forma). Os 80 pontos de Espírito da Noite não mudam o dano.'),
  },
  Citlali: { p3: u(NIGHTSOUL_TRANSMISSION) },
  Iansan: { p3: u(NIGHTSOUL_TRANSMISSION) },
  Bennett: { p3: u('Só tempo de expedição.'), const4: null },
  Flins: {
    p3: x('A conversão de Eletrocarregado em Lunar-Carregado e o +1 nível de Presságio Lunar da equipe não entram; a base do Lunar-Carregado (0,7% por 100 de ATK) entra.'),
    const4: x('Entra o +20% de ATK e o reforço do A4 (Maestria = 10% do ATK, até 220, no lugar dos 8% e 160).'),
  },
};
