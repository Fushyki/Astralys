/**
 * Protocolo do Web Worker do motor. As funções são puras e os argumentos são dados simples (clonáveis),
 * então o mesmo código roda no worker, na UI e nos testes.
 */
import { attributeBuffs, type AttributionInput, type AttributionResult } from './attribution';
import { optimizeTeam, type OptimizerContext, type TeamOptimization } from './optimizer';
import { evaluateRotation, type RotationAction, type RotationContext, type RotationResult } from './rotation';

export type EngineRequest =
  | { id: number; type: 'evaluate'; ctx: RotationContext; actions: RotationAction[] }
  | { id: number; type: 'optimize'; ctx: OptimizerContext }
  | { id: number; type: 'attribute'; input: AttributionInput };

export type EngineResult = RotationResult | TeamOptimization | AttributionResult;

export type EngineResponse =
  | { id: number; ok: true; result: EngineResult }
  | { id: number; ok: false; error: string };

export function handleEngineRequest(req: EngineRequest): EngineResponse {
  try {
    switch (req.type) {
      case 'evaluate':
        return { id: req.id, ok: true, result: evaluateRotation(req.ctx, req.actions) };
      case 'optimize':
        return { id: req.id, ok: true, result: optimizeTeam(req.ctx) };
      case 'attribute':
        return { id: req.id, ok: true, result: attributeBuffs(req.input) };
    }
  } catch (err) {
    return { id: req.id, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
