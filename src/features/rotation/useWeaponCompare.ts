/** Compara as armas do tipo do personagem no Web Worker (a rotação inteira é reanalisada para cada arma). */
import { useEffect, useRef, useState } from 'react';
import { resolveMember, type ResolvedProject, type RotationProject, type WeaponCandidate, type WeaponCompareRow } from '../../engine';
import type { LoadedData } from './data';
import { EngineClient } from './engineClient';
import { weaponsFor } from './teamOps';

export function useWeaponCompare(project: RotationProject, resolved: ResolvedProject, data: LoadedData, member: number, refinement?: number): { rows: WeaponCompareRow[] | null; error: string | null } {
  const [state, setState] = useState<{ key: string; rows: WeaponCompareRow[] | null; error: string | null }>({ key: '', rows: null, error: null });
  const client = useRef<EngineClient | null>(null);

  useEffect(() => {
    client.current = new EngineClient();
    return () => {
      client.current?.dispose();
      client.current = null;
    };
  }, []);

  const key = `${member}:${refinement ?? 0}`;
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      try {
        const ref = project.members[member];
        const character = data.game.characters.find((c) => c.name === ref?.character);
        if (!ref || !character) return;
        const candidates: WeaponCandidate[] = weaponsFor(character, data.game.weapons).map((w) => ({
          weapon: w.name,
          team: {
            ...resolved.team,
            members: resolved.team.members.map((m, i) =>
              i === member ? resolveMember({ ...ref, weapon: w.name, ...(refinement ? { refinement } : {}) }, data.game, data.effects, project.config.minRollsPerSubstat, project.config.characterLevel, project.compat === 'planilha') : m,
            ),
          },
        }));
        const hasTable = data.effects.weapons.find((e) => e.weapon === ref.weapon)?.refinements;
        if (hasTable) {
          for (const r of [1, 2, 3, 4, 5]) {
            candidates.push({
              weapon: ref.weapon,
              refinement: r,
              team: {
                ...resolved.team,
                members: resolved.team.members.map((m, i) => (i === member ? resolveMember({ ...ref, refinement: r }, data.game, data.effects, project.config.minRollsPerSubstat, project.config.characterLevel, project.compat === 'planilha') : m)),
              },
            });
          }
        }
        for (const c of [0, 1, 2, 3, 4, 5, 6]) {
          candidates.push({
            weapon: ref.weapon,
            constellation: c,
            team: {
              ...resolved.team,
              members: resolved.team.members.map((m, i) => (i === member ? resolveMember({ ...ref, constellation: c || undefined }, data.game, data.effects, project.config.minRollsPerSubstat, project.config.characterLevel, project.compat === 'planilha') : m)),
            },
          });
        }
        client.current
          ?.request<WeaponCompareRow[]>({ type: 'weaponCompare', input: { member, candidates, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient } })
          .then((rows) => !cancelled && setState({ key, rows, error: null }))
          .catch((e) => !cancelled && setState({ key, rows: null, error: e instanceof Error ? e.message : String(e) }));
      } catch (e) {
        setState({ key, rows: null, error: e instanceof Error ? e.message : String(e) });
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [project, resolved, data, member, refinement, key]);

  // Resultado de outro personagem (ou refino) ainda em cálculo não é mostrado.
  return state.key === key ? { rows: state.rows, error: state.error } : { rows: null, error: null };
}
