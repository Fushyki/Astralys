/**
 * Último resultado da otimização de cada personagem de cada projeto (só na memória da sessão): trocar de aba não obriga a
 * otimizar de novo, e o Avançado compara a build atual com a melhor achada. `caption` = o que foi otimizado.
 */
import { databaseOfProject } from '../good/goodStore';
import type { OptimizerResult } from './run';

export interface CachedResult { result: OptimizerResult; caption: string }

/** Mesma chave da configuração salva do otimizador. Inclui a base: cada base tem os seus sets, mains e bloqueios. */
export const resultKey = (projectId: string, character: string) => `astralys.otimizador:${databaseOfProject(projectId) ?? 'sem-base'}:${projectId}:${character}`;

export const RESULT_CACHE = new Map<string, CachedResult>();
