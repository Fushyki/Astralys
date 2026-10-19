/**
 * Plano de sincronização entre os projetos deste navegador e os da conta. Vale o mais recente
 * (`meta.updatedAt`); empate não faz nada. Função pura, testada.
 */
import { parseProject, type RotationProject } from '../engine';
import { SAMPLE_ID } from '../features/rotation/persistence';
import type { RemoteProject } from './api';

export interface SyncPlan {
  /** Locais que a conta não tem ou tem mais antigos. */
  push: RotationProject[];
  /** Da conta que não existem aqui ou são mais novos. */
  pull: RotationProject[];
  /** Iguais nos dois lados. */
  same: number;
  /** Projetos da conta que não deu para ler (formato de outra versão). */
  unreadable: number;
}

const stamp = (p: RotationProject) => p.meta.updatedAt;

/** O exemplo embutido tem o mesmo id para todo mundo: nunca vai nem vem da conta. */
export function planSync(allLocal: RotationProject[], allRemote: RemoteProject[]): SyncPlan {
  const local = allLocal.filter((p) => p.id !== SAMPLE_ID);
  const remote = allRemote.filter((r) => r.id !== SAMPLE_ID);
  const remoteById = new Map<string, RotationProject>();
  let unreadable = 0;
  for (const r of remote) {
    try {
      remoteById.set(r.id, parseProject(r.dados));
    } catch {
      unreadable++;
    }
  }
  const plan: SyncPlan = { push: [], pull: [], same: 0, unreadable };
  const seen = new Set<string>();
  for (const p of local) {
    seen.add(p.id);
    const other = remoteById.get(p.id);
    if (!other) plan.push.push(p);
    else if (stamp(p) > stamp(other)) plan.push.push(p);
    else if (stamp(p) < stamp(other)) plan.pull.push(other);
    else plan.same++;
  }
  for (const [id, other] of remoteById) if (!seen.has(id)) plan.pull.push(other);
  return plan;
}
