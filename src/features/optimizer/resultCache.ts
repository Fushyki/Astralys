/**
 * Último resultado da otimização de cada personagem de cada projeto (só na memória da sessão): trocar de aba não obriga a
 * otimizar de novo, e o Avançado compara a build atual com a melhor achada. `caption` = o que foi otimizado.
 */
import type { OptimizerResult } from './run';

export interface CachedResult { result: OptimizerResult; caption: string }

/** Mesma chave da configuração salva do otimizador (`astralys.otimizador:<projeto>:<personagem>`). */
export const resultKey = (projectId: string, character: string) => `astralys.otimizador:${projectId}:${character}`;

export const RESULT_CACHE = new Map<string, CachedResult>();
