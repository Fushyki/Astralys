/** Publicar/despublicar um time na galeria da comunidade (sem conta). */
import { analyzeProject, effectiveDuration, parseProject, resolveProject, type RotationProject } from '../../engine';
import { getPublic, publishTeam, unpublishTeam } from '../../online/api';
import { cloneProject, loadStoredProject, saveProject } from '../rotation/persistence';
import type { LoadedData } from '../rotation/data';
import { forgetPublished, ownedPublic, publishedOf, rememberPublished } from './published';
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

/** Tira o time da galeria. Só funciona neste navegador, onde está o token de quem publicou (o servidor recusa qualquer outro). */
export async function unpublishPublic(publicId: string): Promise<void> {
  const own = ownedPublic(publicId);
  if (!own) throw new Error('Só quem publicou este time (neste navegador) pode removê-lo.');
  await unpublishTeam(publicId, { editToken: own.token });
  forgetPublished(own.projectId);
  const local = loadStoredProject(own.projectId);
  if (local) saveProject({ ...local, meta: { ...local.meta, shared: false } });
}

export const unpublishProject = (projectId: string): Promise<void> => {
  const rec = publishedOf(projectId);
  if (!rec) throw new Error('Este time foi publicado em outro navegador; só lá dá para removê-lo.');
  return unpublishPublic(rec.id);
};

/** "Utilizar": baixa o time da galeria e salva uma cópia nos seus Times. Devolve o id da cópia. */
export async function useTeam(publicId: string): Promise<string> {
  const meta = await getPublic(publicId);
  const copy = cloneProject(parseProject(meta.dados), meta.nome);
  saveProject({ ...copy, meta: { ...copy.meta, shared: false, favorite: false } });
  return copy.id;
}

const ADMIN = 'astralys.admin';
/** Token do dono do site, guardado só no navegador dele (o servidor confere com `ADMIN_TOKEN`). */
export const adminToken = (): string => {
  try {
    return localStorage.getItem(ADMIN) ?? '';
  } catch {
    return '';
  }
};
export function setAdminToken(t: string): void {
  try {
    if (t) localStorage.setItem(ADMIN, t);
    else localStorage.removeItem(ADMIN);
  } catch {
    /* sem armazenamento: o modo admin não persiste */
  }
}

/** Moderação: o dono do site remove qualquer time da galeria. */
export const removeAsAdmin = (publicId: string): Promise<unknown> => unpublishTeam(publicId, { adminToken: adminToken() });
