/**
 * Compartilhar a rotação por arquivo (como o "compartilhar" do Genshin Optimizer): o usuário escolhe o que vai no arquivo
 * (rotação, cenário, buffs de teste e, só se quiser, a equipe com as builds) e quem recebe aplica no próprio time. Os golpes
 * apontam para os membros pelo NOME do personagem, então a rotação encaixa em qualquer time que tenha esses personagens.
 */
import { parseProject, type MemberRef, type RotationProject } from '../../engine';
import { newProjectId } from './persistence';

export const SHARE_KIND = 'astralys-compartilhamento';
export type SharePart = 'rotation' | 'scenario' | 'extras' | 'team';
export const SHARE_PARTS: { id: SharePart; label: string; hint: string }[] = [
  { id: 'rotation', label: 'Rotação', hint: 'Golpes, golpes contínuos, janelas de buff, dano fixo e os interruptores de buff.' },
  { id: 'scenario', label: 'Cenário', hint: 'Duração, nível e RES do inimigo, DEF reduzida e nível dos personagens.' },
  { id: 'extras', label: 'Buffs de teste', hint: 'Os buffs soltos que você pôs no Editar build.' },
  { id: 'team', label: 'Equipe e builds', hint: 'Personagens, armas, sets, peças, constelações e stacks. Sem isto, quem recebe usa o próprio time.' },
];

type Rotation = Pick<RotationProject, 'actions' | 'buffWindows' | 'chains' | 'flatStacks' | 'disabled' | 'enabled' | 'profiles'>;

export interface ShareFile {
  kind: typeof SHARE_KIND;
  version: 1;
  name: string;
  gameVersion: string;
  createdAt: string;
  parts: SharePart[];
  /** Personagens do time de origem, na ordem: os índices da rotação apontam para eles. */
  members: string[];
  rotation?: Rotation;
  scenario?: Pick<RotationProject, 'config' | 'elementMode'>;
  extras?: RotationProject['extras'];
  team?: { members: MemberRef[]; compat: RotationProject['compat'] };
}

export function buildShare(project: RotationProject, parts: SharePart[]): ShareFile {
  const has = (p: SharePart) => parts.includes(p);
  return {
    kind: SHARE_KIND,
    version: 1,
    name: project.name,
    gameVersion: project.gameVersion,
    createdAt: new Date().toISOString(),
    parts,
    members: project.members.map((m) => m.character),
    ...(has('rotation') ? { rotation: { actions: project.actions, buffWindows: project.buffWindows, chains: project.chains, flatStacks: project.flatStacks, disabled: project.disabled, enabled: project.enabled, profiles: project.profiles } } : {}),
    ...(has('scenario') ? { scenario: { config: project.config, elementMode: project.elementMode } } : {}),
    ...(has('extras') ? { extras: project.extras } : {}),
    ...(has('team') ? { team: { members: project.members, compat: project.compat } } : {}),
  };
}

/** Lê um arquivo de compartilhamento; null se o JSON é outra coisa (um projeto inteiro, por exemplo). */
export function parseShare(raw: unknown): ShareFile | null {
  const f = raw as Partial<ShareFile> | null;
  if (!f || typeof f !== 'object' || f.kind !== SHARE_KIND || f.version !== 1) return null;
  if (!Array.isArray(f.parts) || !Array.isArray(f.members) || typeof f.name !== 'string') return null;
  return f as ShareFile;
}

export function downloadShare(file: ShareFile): void {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${file.name.replace(/[^\w-]+/g, '_') || 'rotacao'}.astralys-rotacao.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Troca o índice do membro dentro de um id (etiqueta de buff, fonte desligada...). null = era de um membro que não existe aqui. */
export function remapMemberId(id: string, map: ReadonlyMap<number, number>): string | null {
  const swap = (n: string) => map.get(Number(n));
  let m = /^(gear|char):(\d+)$/.exec(id);
  if (m) { const t = swap(m[2]); return t === undefined ? null : `${m[1]}:${t}`; }
  m = /^m(\d+):(.*)$/.exec(id);
  if (m) { const t = swap(m[1]); return t === undefined ? null : `m${t}:${m[2]}`; }
  m = /^(cbuff-(?:res-|def-)?)(\d+)(-.*)$/.exec(id);
  if (m) { const t = swap(m[2]); return t === undefined ? null : `${m[1]}${t}${m[3]}`; }
  m = /^(gear-|set-res-shred-|res-shred-)(\d+)$/.exec(id);
  if (m) { const t = swap(m[2]); return t === undefined ? null : `${m[1]}${t}`; }
  return id;
}

export interface ShareResult {
  project: RotationProject;
  applied: SharePart[];
  warnings: string[];
}

const keep = (list: string[], map: ReadonlyMap<number, number>) => list.map((t) => remapMemberId(t, map)).filter((t): t is string => t !== null);

/** Aplica ao projeto as partes pedidas do arquivo (a rotação substitui a atual; tudo pode ser desfeito). */
export function applyShare(project: RotationProject, file: ShareFile, which: SharePart[]): ShareResult {
  const warnings: string[] = [];
  const applied: SharePart[] = [];
  let next: RotationProject = { ...project };
  const pick = (p: SharePart) => which.includes(p) && file.parts.includes(p);

  if (pick('team') && file.team) {
    next = { ...next, members: file.team.members, compat: file.team.compat };
    applied.push('team');
  }
  // Rotação do arquivo para os índices deste projeto, pelo nome do personagem (com a equipe do arquivo os índices já batem).
  const map = new Map<number, number>();
  file.members.forEach((name, i) => {
    const at = next.members.findIndex((m) => m.character === name);
    if (at >= 0) map.set(i, at);
  });

  if (pick('rotation') && file.rotation) {
    const r = file.rotation;
    const missing = file.members.filter((_, i) => !map.has(i));
    if (missing.length) warnings.push(`${missing.join(', ')} não está neste time: os golpes e buffs deles ficaram de fora.`);
    const actions = r.actions
      .filter((a) => map.has(a.member))
      .map((a) => ({ ...a, member: map.get(a.member)!, activeTags: keep(a.activeTags, map), ...(a.contributors ? { contributors: a.contributors.map((c) => map.get(c)).filter((c): c is number => c !== undefined) } : {}) }));
    const ids = new Set(actions.map((a) => a.id));
    const buffWindows = r.buffWindows.flatMap((w) => {
      const tag = remapMemberId(w.tag, map);
      if (tag === null) return [];
      return [{ ...w, tag, ...(w.anchor && !ids.has(w.anchor.actionId) ? { anchor: undefined } : {}) }];
    });
    const live = new Set(actions.map((a) => a.chainId).filter(Boolean));
    next = {
      ...next,
      actions,
      buffWindows,
      chains: Object.fromEntries(Object.entries(r.chains).filter(([id]) => live.has(id))),
      flatStacks: r.flatStacks,
      disabled: keep(r.disabled, map),
      enabled: keep(r.enabled, map),
      profiles: Object.fromEntries(Object.entries(r.profiles).map(([name, tags]) => [name, keep(tags, map)])),
    };
    const dropped = r.actions.length - actions.length;
    if (dropped > 0) warnings.push(`${dropped} ${dropped === 1 ? 'golpe ficou' : 'golpes ficaram'} de fora.`);
    applied.push('rotation');
  }
  if (pick('scenario') && file.scenario) {
    next = { ...next, config: file.scenario.config, elementMode: file.scenario.elementMode };
    applied.push('scenario');
  }
  if (pick('extras') && file.extras) {
    next = { ...next, extras: file.extras };
    applied.push('extras');
  }
  next = { ...next, meta: { ...next.meta, updatedAt: new Date().toISOString() } };
  return { project: parseProject(next), applied, warnings };
}

/** Time novo a partir de um arquivo que traz a equipe (para o Vault). */
export function projectFromShare(file: ShareFile, base: RotationProject): ShareResult {
  if (!file.team) throw new Error('Este arquivo só tem a rotação (sem a equipe). Abra um time e use "Importar" na tela de Rotação.');
  return applyShare({ ...base, id: newProjectId(), name: file.name }, file, ['team', 'rotation', 'scenario', 'extras']);
}
