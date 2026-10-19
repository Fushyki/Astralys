/** Sincroniza agora: o que é mais novo aqui sobe, o que é mais novo na conta desce. */
import { listStoredProjects, saveProject } from '../features/rotation/persistence';
import { listRemote, syncRemote } from './api';
import { planSync } from './sync';

export interface SyncSummary {
  pushed: number;
  pulled: number;
  same: number;
  unreadable: number;
}

/** O servidor aceita até 100 projetos por envio. */
const BATCH = 100;

export async function syncNow(token: string): Promise<SyncSummary> {
  const plan = planSync(listStoredProjects(), await listRemote(token));
  for (let i = 0; i < plan.push.length; i += BATCH) await syncRemote(token, plan.push.slice(i, i + BATCH));
  for (const p of plan.pull) saveProject(p);
  return { pushed: plan.push.length, pulled: plan.pull.length, same: plan.same, unreadable: plan.unreadable };
}

export const summaryText = (s: SyncSummary): string => {
  const parts: string[] = [];
  if (s.pushed) parts.push(`${s.pushed} ${s.pushed === 1 ? 'time enviado' : 'times enviados'} para a conta`);
  if (s.pulled) parts.push(`${s.pulled} ${s.pulled === 1 ? 'time baixado' : 'times baixados'} da conta`);
  if (!parts.length) parts.push('Tudo já estava sincronizado');
  if (s.unreadable) parts.push(`${s.unreadable} da conta não puderam ser lidos (formato de outra versão)`);
  return parts.join('; ') + '.';
};
