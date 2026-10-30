/**
 * Piloto da curadoria por agente (armas): correções e complementos aos lotes `weapons.ts`/`weapons2.ts`.
 * Mesmas regras de `gear.ts`: número vem de parâmetro do Lunaris (`p`) ou literal do texto; `expect` trava se o texto mudar.
 * As entradas daqui SOBREPÕEM as dos lotes antigos (e substituem as vindas da planilha, que foram tiradas do JSON).
 */
import type { GearCur } from './gear';

export const PILOTO_ARMAS: Record<string, GearCur> = {
  // Antes: entrada da planilha (R1 em Nightsoul valendo para todo refino: 49% ATK / 35% CD também no R5).
  'A Thousand Blazing Suns': {
    // x 1,75 = 1 + os 75% do Nightsoul Blessing (parâmetro 2 do Lunaris); o gabarito da planilha (49% / 35% no R1) depende dele.
    atkPct: { p: 1, x: 1.75 },
    critDmg: { p: 0, x: 1.75 },
    expect: 'Scorching Brilliance',
    note: 'Assume Scorching Brilliance sempre ativo (habilidade ou Supremo, 6 s, 1 vez a cada 10 s) E o dono em Nightsoul Blessing (x1,75): +49% ATK e +35% Dano Crítico no R1 (28% e 20% x 1,75), como a planilha, agora por refinamento. Fora da Nightsoul os valores são 1/1,75 disso. A extensão de 2 s por Normal/Carregado e o contador que não corre fora de campo NÃO entram. Não é faixa na linha do tempo: o gabarito da planilha exige o valor fixo.',
  },
  // Antes: 0,0000108 (R1) na equipe, dez vezes menos que 30% de 0,036%/ponto.
  "Xiphos' Moonlight": {
    buffs: [
      { id: 'er', label: 'Recarga por Maestria', convert: { from: 'em', perPoint: { p: 1, x: 0.01 }, to: ['er'] } },
      { id: 'er-time', label: 'Recarga por Maestria (equipe)', scope: 'others', timed: true, convert: { from: 'em', perPoint: { p: 1, x: 0.003 }, to: ['er'] } },
    ],
    expect: 'Energy Recharge for each point of Elemental Mastery',
    note: 'Recarga = 0,036% (R1) por ponto de Maestria do dono, sempre ativa (renova a cada 10 s por 12 s); a equipe recebe 30% disso (0,0108% por ponto no R1) nas janelas de buff. Várias cópias da arma somando não entram.',
  },
  // Antes: dmgPct { p: 2, x: 2 } = parâmetro que fica em 10% em todo refino (R5 saía 20% em vez de 40%); o DMG por stack é o parâmetro 3.
  'Peak Patrol Song': {
    defPct: { p: 0, x: 2 },
    dmgPct: { p: 3, x: 2 },
    buffs: [
      { id: 'def-time', label: 'DMG elemental por DEF (equipe)', scope: 'team', timed: true, convert: { from: 'def', perPoint: { p: 5, x: 0.001 }, cap: { p: 5, x: 3.2 }, to: ['dmgPct'] } },
    ],
    expect: 'Ode to Flowers',
    note: 'Assume os 2 stacks de Ode to Flowers (DEF 8% e DMG elemental 10% por stack no R1; 16% e 20% no R5). O DMG elemental da equipe (8% por 1.000 de DEF do dono, até 25,6% no R1; 16% e 51,2% no R5) vale nas janelas de buff. A DEF do dono já inclui o bônus dos stacks. Gatilho (Normal ou Plunge, 1 vez por 0,1 s, 6 s por stack; 15 s para a equipe) é do usuário.',
  },
};
