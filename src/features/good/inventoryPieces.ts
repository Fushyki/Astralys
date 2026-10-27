/** As 5 peças que um personagem tem equipadas no inventário GOOD importado (null se não tem as 5) e a abertura do projeto com elas. */
import { PIECE_SLOTS, type RotationProject } from '../../engine';
import type { Good, GoodArtifact } from './goodImport';

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
  const members = project.members.map((m) => {
    if (m.pieces?.length || m.piecesChoice === 'generic') return m;
    const pieces = inventoryPiecesOf(good, m.character);
    if (!pieces) return m;
    changed = true;
    return { ...m, pieces };
  });
  return changed ? { ...project, members } : project;
}
