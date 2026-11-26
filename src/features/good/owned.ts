/** "Meus" personagens: os do inventário importado e todos os que estão em algum time (o exemplo do site não conta). */
import { norm, type Good } from './goodImport';

export function ownedCharacters(good: Pick<Good, 'characters'> | null, teams: readonly { members: string[]; isSample: boolean }[]): Set<string> {
  return new Set([...(good?.characters ?? []).map((c) => norm(c.key)), ...teams.filter((t) => !t.isSample).flatMap((t) => t.members.map(norm))]);
}
