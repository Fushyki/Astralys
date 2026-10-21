/**
 * Golpes extras de passivas e constelações (ver `ProcCuration` em `characters.ts`). Cada escala é um parâmetro do
 * Lunaris da passiva/constelação indicada em `src` (ou `lit` quando o parâmetro vem zerado) e `expect` trava se o texto
 * mudar. O elemento é o do personagem, salvo quando o texto (ou o Genshin Optimizer) diz outro.
 */
import type { ProcCuration } from './characters';

export const CHARACTER_PROCS: Record<string, ProcCuration[]> = {};
