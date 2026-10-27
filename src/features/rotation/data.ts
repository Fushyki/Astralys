/**
 * Carregamento dos dados do jogo no navegador. Os JSON gerados (~1 MB) são importados dinamicamente, então só
 * entram no pacote da rota do editor e não pesam na interface antiga. O TanStack Query guarda o resultado.
 */
import { useQuery } from '@tanstack/react-query';
import type { LevelsData } from '../../data/levels';
import type { ArtifactSet, Character, Move, SyncMeta, Weapon } from '../../data/schema';
import type { CharacterEffect, FlatDamageEffect, SetEffect, SkillParticles, WeaponEffect } from '../../effects/schema';
import type { EffectsData, GameData } from '../../engine';

export interface LoadedData {
  game: GameData;
  effects: EffectsData;
  meta: SyncMeta;
  /** Partículas por uso da habilidade de cada personagem (calculadora de recarga). */
  particles: SkillParticles[];
}

const asDefault = async <T,>(p: Promise<{ default: unknown }>): Promise<T> => (await p).default as T;

export async function loadData(): Promise<LoadedData> {
  const [characters, moves, weapons, artifacts, meta, ec, ew, es, ef, particles, levels] = await Promise.all([
    asDefault<Character[]>(import('../../data/generated/characters.json')),
    asDefault<Move[]>(import('../../data/generated/moves.json')),
    asDefault<Weapon[]>(import('../../data/generated/weapons.json')),
    asDefault<ArtifactSet[]>(import('../../data/generated/artifacts.json')),
    asDefault<SyncMeta>(import('../../data/generated/meta.json')),
    asDefault<CharacterEffect[]>(import('../../effects/characters.json')),
    asDefault<WeaponEffect[]>(import('../../effects/weapons.json')),
    asDefault<SetEffect[]>(import('../../effects/sets.json')),
    asDefault<FlatDamageEffect[]>(import('../../effects/flatDamage.json')),
    asDefault<SkillParticles[]>(import('../../effects/particles.json')),
    asDefault<LevelsData>(import('../../data/generated/levels.json')),
  ]);
  return {
    game: { characters, moves, weapons, artifacts, levels },
    effects: { characters: ec, weapons: ew, sets: es, flatDamage: ef },
    meta,
    particles,
  };
}

export function useGameData() {
  return useQuery({ queryKey: ['game-data'], queryFn: loadData, staleTime: Infinity, gcTime: Infinity });
}
