import { assembleTeam, resolveProject, type EffectsData, type GameData, type RotationProject } from '../../src/engine';

/** Para testes de janela marcada à mão: o mesmo projeto, com as janelas automáticas dos buffs desligadas. */
export function semAuto(project: RotationProject, game: GameData, effects: EffectsData): RotationProject {
  const auto = assembleTeam(resolveProject(project, game, effects).team).buffs.filter((b) => b.auto).map((b) => b.tag);
  return { ...project, autoOff: [...(project.autoOff ?? []), ...auto] };
}
