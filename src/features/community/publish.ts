/** Publicar/despublicar um time na galeria da comunidade (sem conta). */
import { analyzeProject, effectiveDuration, resolveProject, type RotationProject } from '../../engine';
import { publishTeam, unpublishTeam } from '../../online/api';
import type { LoadedData } from '../rotation/data';
import { forgetPublished, publishedOf, rememberPublished } from './published';
import { buildSummary } from './teamSummary';

/** Calcula o time, publica e devolve o id público (o link é `/p/<id>`). */
export async function publishProject(p: RotationProject, data: LoadedData, author: string): Promise<string> {
  const r = resolveProject(p, data.game, data.effects);
  const res = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).optimization.result;
  const resumo = buildSummary(p, { dps: res.totals.dps, dpr: res.totals.avg, duration: effectiveDuration(p), shares: res.members.map((m) => m.share) });
  const { id, edit_token } = await publishTeam({
    nome: p.name, author, version: p.gameVersion, members: p.members.map((m) => m.character), resumo, dados: { ...p, meta: { ...p.meta, shared: false, favorite: false } },
  });
  rememberPublished(p.id, id, edit_token);
  return id;
}

/** Tira o time da galeria (precisa do token guardado neste navegador). */
export async function unpublishProject(projectId: string): Promise<void> {
  const rec = publishedOf(projectId);
  if (!rec) throw new Error('Este time foi publicado em outro navegador; só lá dá para removê-lo.');
  await unpublishTeam(rec.id, rec.token);
  forgetPublished(projectId);
}
