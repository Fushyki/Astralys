/**
 * Carregamento dos dados do jogo no navegador. As listas (personagens, armas, sets…) vêm inteiras; golpes e efeitos de
 * personagem vêm um arquivo por personagem, só dos times que a tela mostra. O TanStack Query guarda o resultado.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { LevelsData } from '../../data/levels';
import type { ArtifactSet, Character, Move, SyncMeta, Weapon } from '../../data/schema';
import type { CharacterEffect, FlatDamageEffect, SetEffect, SkillParticles, WeaponEffect } from '../../effects/schema';
import type { EffectsData, GameData, RotationProject } from '../../engine';

export interface LoadedData {
  game: GameData;
  effects: EffectsData;
  meta: SyncMeta;
  /** Partículas por uso da habilidade de cada personagem (calculadora de recarga). */
  particles: SkillParticles[];
  /** Personagens cujos golpes e efeitos estão em `game.moves` e `effects.characters`. */
  kits: ReadonlySet<string>;
}

const asDefault = async <T,>(p: Promise<{ default: unknown }>): Promise<T> => (await p).default as T;

/** Nomes (sem repetir) dos personagens dos times. */
export const teamNames = (...projects: (Pick<RotationProject, 'members'> | null | undefined)[]): string[] =>
  [...new Set(projects.flatMap((p) => p?.members.map((m) => m.character) ?? []))].sort();

/** Os golpes e efeitos de todos estes personagens já foram carregados? (Sem isso o motor não monta o time.) */
export const covers = (data: LoadedData, characters: readonly string[]): boolean => characters.every((n) => data.kits.has(n));

export async function loadData(characters: readonly string[]): Promise<LoadedData> {
  const { appFile } = await import('./dataFiles');
  const list = appFile<Character[]>('characters');
  const kits = list.then((all) =>
    Promise.all(
      all
        .filter((c) => characters.includes(c.name))
        .map(async (c) => ({ moves: await appFile<Move[]>(`moves/${c.id}`), effects: await appFile<CharacterEffect[]>(`effects/${c.id}`) })),
    ),
  );
  const [all, own, weapons, artifacts, meta, ew, es, ef, particles, levels] = await Promise.all([
    list,
    kits,
    appFile<Weapon[]>('weapons'),
    appFile<ArtifactSet[]>('artifacts'),
    asDefault<SyncMeta>(import('../../data/generated/meta.json')),
    asDefault<WeaponEffect[]>(import('../../effects/weapons.json')),
    asDefault<SetEffect[]>(import('../../effects/sets.json')),
    asDefault<FlatDamageEffect[]>(import('../../effects/flatDamage.json')),
    asDefault<SkillParticles[]>(import('../../effects/particles.json')),
    asDefault<LevelsData>(import('../../data/generated/levels.json')),
  ]);
  return {
    game: { characters: all, moves: own.flatMap((k) => k.moves), weapons, artifacts, levels },
    effects: { characters: own.flatMap((k) => k.effects), weapons: ew, sets: es, flatDamage: ef },
    meta,
    particles,
    kits: new Set(characters),
  };
}

/** `data` pronto para estes times: o mesmo, se já cobre; senão carrega o que falta. */
export const dataFor = async (data: LoadedData, ...projects: RotationProject[]): Promise<LoadedData> =>
  covers(data, teamNames(...projects)) ? data : loadData(teamNames(...projects));

/**
 * `characters`: de quem os golpes e efeitos são precisos (vazio = só as listas). Enquanto um personagem novo carrega, `data`
 * continua o anterior: quem vai calcular confere com `covers`.
 */
export function useGameData(characters: readonly string[], enabled = true) {
  const names = [...new Set(characters)].sort();
  return useQuery({ queryKey: ['game-data', ...names], queryFn: () => loadData(names), staleTime: Infinity, gcTime: Infinity, enabled, placeholderData: keepPreviousData });
}
