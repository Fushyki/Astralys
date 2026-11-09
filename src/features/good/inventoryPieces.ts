/** As 5 peças que um personagem tem equipadas no inventário GOOD importado (null se não tem as 5) e a abertura do projeto com elas. */
import { PIECE_SLOTS, type RotationProject } from '../../engine';
import { MANUAL_LOCATION } from './kqmPieces';
import { artifactSig, type Good, type GoodArtifact } from './goodImport';

const norm = (s: string | undefined) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function inventoryPiecesOf(good: Good | null | undefined, character: string): GoodArtifact[] | null {
  if (!good) return null;
  const key = good.characters.find((c) => norm(c.key) === norm(character))?.key ?? character;
  const mine = good.artifacts.filter((a) => norm(a.location) === norm(key));
  const by = Object.fromEntries(mine.map((a) => [a.slotKey, a]));
  return PIECE_SLOTS.every((sl) => by[sl]) ? PIECE_SLOTS.map((sl) => by[sl]) : null;
}

/**
 * Abre o projeto com as peças do usuário: o membro que ainda usa o build teórico (sem peças reais) e está no inventário passa a usar
 * as peças dele. Quem voltou ao build genérico de propósito (`piecesChoice: 'generic'`) fica como está.
 */
export function withInventoryPieces(project: RotationProject, good: Good | null | undefined): RotationProject {
  if (!good) return project;
  let changed = false;
  const sigs = new Set(good.artifacts.map(artifactSig));
  const members = project.members.map((m) => {
    if (m.piecesChoice === 'generic') return m;
    // Build manual (peças feitas à mão, só deste time): não é do inventário, então fica.
    if (m.pieces?.length && m.pieces.every((p) => p.location === MANUAL_LOCATION)) return m;
    // Peças que não existem nesta base (vieram de outra) saem: a base em uso manda.
    if (m.pieces?.length && m.pieces.every((p) => sigs.has(artifactSig(p as GoodArtifact)))) return m;
    const pieces = inventoryPiecesOf(good, m.character);
    if (!pieces && !m.pieces?.length) return m;
    changed = true;
    return pieces ? { ...m, pieces } : { ...m, pieces: undefined };
  });
  return changed ? { ...project, members } : project;
}
