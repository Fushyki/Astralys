/**
 * Monta um projeto novo a partir dos personagens escolhidos. Puro e testado.
 * Rotação "básica": a habilidade e o supremo de cada personagem, em sequência (um ponto de partida para você ajustar
 * na linha do tempo); "em branco": nenhuma ação.
 */
import type { Move } from '../../data/schema';
import type { GameData, MemberRef, RotationProject } from '../../engine';
import { newProjectId, sampleProject } from './persistence';
import { addAction } from './projectOps';
import { defaultMember } from './teamOps';

export type RotationStart = 'basic' | 'blank';

export interface NewTeamInput {
  name?: string;
  /** Nomes dos personagens (1 a 4, sem repetir), na ordem do time. */
  characters: string[];
  /** Builds já prontos (ex.: da vitrine do jogo); quem não tem usa o build padrão. */
  builds?: Record<string, MemberRef>;
  rotation: RotationStart;
  gameVersion?: string;
}

export const MAX_START_NAME = 120;

/** Primeiro golpe de cada tipo no kit do personagem (o que o Lunaris lista primeiro). */
function firstMove(moves: readonly Move[], character: string, hitType: 'skill' | 'burst'): Move | undefined {
  return moves.find((m) => m.character === character && m.hitType === hitType && m.variant === 0);
}

export function defaultTeamName(characters: string[]): string {
  return characters.join(' · ').slice(0, MAX_START_NAME) || 'Novo time';
}

export function buildNewTeam(input: NewTeamInput, game: Pick<GameData, 'characters' | 'weapons' | 'moves'>): RotationProject {
  const names = [...new Set(input.characters)].slice(0, 4);
  if (names.length === 0) throw new Error('Escolha pelo menos um personagem.');
  const now = new Date().toISOString();
  // O esqueleto (nível do personagem, inimigo, RES) vem do exemplo; o que é do time do exemplo não vem.
  const template = sampleProject();
  let project: RotationProject = {
    ...template,
    id: newProjectId(),
    name: (input.name?.trim() || defaultTeamName(names)).slice(0, MAX_START_NAME),
    gameVersion: input.gameVersion ?? '',
    compat: 'none',
    members: names.map((n) => input.builds?.[n] ?? defaultMember(n, game)),
    extras: [],
    actions: [],
    buffWindows: [],
    chains: {},
    disabled: [],
    enabled: [],
    elementMode: 'kit',
    profiles: {},
    meta: { tags: [], createdAt: now, updatedAt: now },
  };

  if (input.rotation === 'basic') {
    let t = 0.5;
    names.forEach((character, member) => {
      for (const hitType of ['skill', 'burst'] as const) {
        const move = firstMove(game.moves, character, hitType);
        if (!move) continue;
        project = addAction(project, { member, move: { character, talent: move.talent, label: move.label, variant: 0 }, time: t, displayName: move.labelPt });
        t += 1.2;
      }
    });
    project = { ...project, config: { ...project.config, rotationDuration: Math.max(10, Math.ceil(t + 3)) } };
  } else {
    project = { ...project, config: { ...project.config, rotationDuration: 15 } };
  }
  return project;
}

