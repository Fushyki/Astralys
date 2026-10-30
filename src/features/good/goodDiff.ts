/**
 * Importar um arquivo GOOD para uma base de dados já existente, como o Genshin Optimizer: o arquivo novo é comparado
 * com a base e cada item cai em um grupo (novo, atualizado, igual ou "fora do arquivo"). Depois a importação aplica as
 * escolhas do usuário: atualizar os existentes e apagar o que não veio no arquivo.
 *
 * O GOOD não tem id de peça: a identidade de um artefato é posição + set + raridade + main stat. O mesmo artefato "evolui"
 * (mais nível, substats novos ou mais altos); a arma, por nível e refinamento; o personagem, pela chave.
 */
import { norm, type Good } from './goodImport';

type Art = Good['artifacts'][number];
type Wep = Good['weapons'][number];
type Chr = Good['characters'][number];

export interface Group<T> {
  /** Só no arquivo. */
  added: T[];
  /** Existe nos dois e o arquivo traz uma versão mais nova. */
  updated: { old: T; next: T }[];
  /** Existe nos dois e é o mesmo (o dono pode ter mudado). */
  unchanged: { old: T; next: T }[];
  /** Só na base: não veio no arquivo. */
  missing: T[];
}

export interface GoodDiff {
  artifacts: Group<Art>;
  weapons: Group<Wep>;
  characters: Group<Chr>;
}

export interface ImportOptions {
  /** Troca os itens existentes pela versão mais nova do arquivo. */
  updateExisting: boolean;
  /** Apaga as armas e os artefatos da base que não vieram no arquivo. */
  deleteMissingItems: boolean;
  /** Apaga os personagens da base que não vieram no arquivo. */
  deleteMissingCharacters: boolean;
}

export const DEFAULT_IMPORT: ImportOptions = { updateExisting: true, deleteMissingItems: false, deleteMissingCharacters: false };

const EPS = 1e-6;
const level = (x: { level?: number }) => x.level ?? 0;

const artKey = (a: Art) => `${a.slotKey}|${a.setKey}|${a.rarity}|${a.mainStatKey}`;
const artExact = (a: Art) => `${artKey(a)}|${level(a)}|${[...a.substats].sort((x, y) => x.key.localeCompare(y.key)).map((s) => `${s.key}:${s.value}`).join(',')}`;

/** O artefato novo é o antigo evoluído: mesmo nível ou mais, e cada substat do antigo continua lá, igual ou mais alto. */
function isUpgrade(old: Art, next: Art): boolean {
  if (artKey(old) !== artKey(next) || level(next) < level(old)) return false;
  return old.substats.every((s) => next.substats.some((n) => n.key === s.key && n.value >= s.value - EPS));
}

function matchArtifacts(base: Art[], incoming: Art[]): Group<Art> {
  const out: Group<Art> = { added: [], updated: [], unchanged: [], missing: [] };
  const free = new Set(base.map((_, i) => i));
  const left: Art[] = [];
  // 1) idênticos (qualquer dono)
  const byExact = new Map<string, number[]>();
  base.forEach((a, i) => byExact.set(artExact(a), [...(byExact.get(artExact(a)) ?? []), i]));
  for (const n of incoming) {
    const i = byExact.get(artExact(n))?.shift();
    if (i === undefined) left.push(n);
    else {
      free.delete(i);
      out.unchanged.push({ old: base[i], next: n });
    }
  }
  // 2) evoluídos: o candidato mais próximo em nível
  for (const n of left) {
    let best = -1;
    for (const i of free) if (isUpgrade(base[i], n) && (best < 0 || level(n) - level(base[i]) < level(n) - level(base[best]))) best = i;
    if (best < 0) out.added.push(n);
    else {
      free.delete(best);
      out.updated.push({ old: base[best], next: n });
    }
  }
  out.missing = [...free].map((i) => base[i]);
  return out;
}

function matchWeapons(base: Wep[], incoming: Wep[]): Group<Wep> {
  const out: Group<Wep> = { added: [], updated: [], unchanged: [], missing: [] };
  const free = new Set(base.map((_, i) => i));
  const left: Wep[] = [];
  const same = (a: Wep, b: Wep) => norm(a.key) === norm(b.key) && level(a) === level(b) && (a.refinement ?? 1) === (b.refinement ?? 1);
  for (const n of incoming) {
    const i = [...free].find((k) => same(base[k], n));
    if (i === undefined) left.push(n);
    else {
      free.delete(i);
      out.unchanged.push({ old: base[i], next: n });
    }
  }
  for (const n of left) {
    let best = -1;
    for (const i of free) {
      const o = base[i];
      if (norm(o.key) === norm(n.key) && level(n) >= level(o) && (n.refinement ?? 1) >= (o.refinement ?? 1) && (best < 0 || level(n) - level(o) < level(n) - level(base[best]))) best = i;
    }
    if (best < 0) out.added.push(n);
    else {
      free.delete(best);
      out.updated.push({ old: base[best], next: n });
    }
  }
  out.missing = [...free].map((i) => base[i]);
  return out;
}

function matchCharacters(base: Chr[], incoming: Chr[]): Group<Chr> {
  const out: Group<Chr> = { added: [], updated: [], unchanged: [], missing: [] };
  const seen = new Set<string>();
  for (const n of incoming) {
    const o = base.find((c) => norm(c.key) === norm(n.key));
    seen.add(norm(n.key));
    if (!o) out.added.push(n);
    else if (JSON.stringify(o) === JSON.stringify(n)) out.unchanged.push({ old: o, next: n });
    else out.updated.push({ old: o, next: n });
  }
  out.missing = base.filter((c) => !seen.has(norm(c.key)));
  return out;
}

/** Compara o arquivo com a base (base vazia: tudo é novo). */
export function diffGood(base: Good | null, incoming: Good): GoodDiff {
  return {
    artifacts: matchArtifacts(base?.artifacts ?? [], incoming.artifacts),
    weapons: matchWeapons(base?.weapons ?? [], incoming.weapons),
    characters: matchCharacters(base?.characters ?? [], incoming.characters),
  };
}

/**
 * Aplica a importação. Nada que veio do arquivo se perde; o que só existe na base é mantido, a menos que o usuário peça
 * para apagar. Um item mantido que ficaria no mesmo personagem e posição de um item do arquivo perde o dono (uma peça por posição).
 */
export function applyImport(base: Good | null, incoming: Good, opts: ImportOptions = DEFAULT_IMPORT): Good {
  const d = diffGood(base, incoming);
  const takeNew = <T>(g: Group<T>) => [...g.added, ...g.unchanged.map((u) => u.next), ...g.updated.map((u) => (opts.updateExisting ? u.next : u.old))];

  const characters = [...takeNew(d.characters), ...(opts.deleteMissingCharacters ? [] : d.characters.missing)];
  const keptArts = opts.deleteMissingItems ? [] : d.artifacts.missing;
  const keptWeps = opts.deleteMissingItems ? [] : d.weapons.missing;
  const arts = takeNew(d.artifacts);
  const weps = takeNew(d.weapons);

  const taken = new Set(arts.filter((a) => a.location).map((a) => `${norm(a.location)}|${a.slotKey}`));
  const takenW = new Set(weps.filter((w) => w.location).map((w) => norm(w.location)));
  const artifacts = [...arts, ...keptArts.map((a) => (a.location && taken.has(`${norm(a.location)}|${a.slotKey}`) ? { ...a, location: '' } : a))];
  const weapons = [...weps, ...keptWeps.map((w) => (w.location && takenW.has(norm(w.location)) ? { ...w, location: '' } : w))];

  return { ...(base ?? incoming), format: 'GOOD', source: incoming.source ?? base?.source, characters, weapons, artifacts };
}

/** Resumo em números, para a tela de prévia e os testes. */
export function summarize(g: Group<unknown>) {
  return { added: g.added.length, updated: g.updated.length, unchanged: g.unchanged.length, missing: g.missing.length };
}
