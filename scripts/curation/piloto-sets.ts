/**
 * Piloto da curadoria por agente (conjuntos de artefatos). Mesmas regras de `sets.ts`: número vem de parâmetro do Lunaris
 * (`p`) ou literal do texto; `expect` trava se o texto mudar. As entradas daqui substituem as vindas da planilha (tiradas do JSON).
 * `twoPiece` aqui vale quando o parser de 2 peças (`lib/twoPiece.ts`) não reconhece o texto.
 */
import type { SetEffect } from '../../src/effects/schema';
import type { FourCuration } from './sets';

export type PilotoSet = FourCuration & { twoPiece?: NonNullable<SetEffect['twoPiece']>[] };

export const PILOTO_SETS: Record<string, PilotoSet> = {
  // Antes: entrada da planilha, sem nota e sem a duração. O valor (120 de Maestria) já estava certo.
  Instructor: {
    team: { em: { p: 1 } },
    expect: "increases all party members' Elemental Mastery by",
    note: 'Os +120 de Maestria (parâmetro 1) vão para a equipe inteira, dono incluído, nas janelas de buff. O gatilho (qualquer Reação Elemental causada, 8 s, parâmetro 0) é do usuário: a janela é ligada onde a reação acontece. 2 peças: +80 de Maestria, sempre.',
  },
  // Antes: entrada da planilha, sem nota. Valores corretos (15% e 40%); faltava dizer a condição.
  'Obsidian Codex': {
    twoPiece: [{ stat: 'DMG%', value: 0.15 }],
    critRate: { p: 1 },
    expect: 'CRIT Rate increases by 40%',
    note: 'Assume o dono sempre em Bênção do Espírito da Noite e em campo: 2 peças = +15% de DMG (parâmetro 0 do 2 peças, vale para qualquer elemento) e 4 peças = +40% de Taxa CRIT (6 s, gatilho 1 vez por segundo ao gastar 1 ponto de Espírito da Noite; com o gasto contínuo a cobertura é total). Fora da Bênção ou fora de campo os dois bônus não valem: o motor não tem essa condição, o usuário deve tirar o set.',
  },
};
