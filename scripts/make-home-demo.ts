/**
 * Dados da demonstração da página inicial ("Fio de origem"): o time de exemplo (Mavuika, Citlali, Iansan, Bennett) rodado pelo motor.
 * Cada golpe traz o dano médio e os buffs de time que o cobrem, com o quanto do golpe some sem cada um (`hitBuffRows`).
 * Nada é digitado à mão: `npx tsx scripts/make-home-demo.ts` regenera `src/screens/inicio/demo.json`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../src/engine';
import { effectiveDuration } from '../src/engine/project';
import { sampleForApp } from '../src/features/rotation/persistence';
import { hitBuffRows, laneInfos } from '../src/features/rotation/rotationModel';
import { memberColors } from '../src/design/elements';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(process.cwd(), rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const project = sampleForApp();
const resolved = resolveProject(project, game, effects);
const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });
const result = bundle.optimization.result;
const names = resolved.team.members.map((m) => m.character.name);
const lanes = laneInfos(project, resolved);

const hits = [...project.actions].sort((a, b) => a.time - b.time).map((a) => {
  const r = result.actions.find((x) => x.action.id === a.id);
  const move = game.moves.find((m) => m.character === a.move.character && m.label === a.move.label);
  return {
    id: a.id,
    t: a.time,
    m: a.member,
    kind: a.move.talent,
    label: move?.labelPt ?? a.displayName ?? a.move.label,
    avg: Math.round(r?.avg ?? 0),
    rows: hitBuffRows(project, resolved, bundle, a.id).filter((x) => x.on && x.effect > 0).map((x) => ({ tag: x.tag, effect: Number(x.effect.toFixed(6)) })),
  };
});

const used = new Set(hits.flatMap((h) => h.rows.map((r) => r.tag)));
const windows = project.buffWindows.filter((w) => used.has(w.tag)).map((w) => {
  const lane = lanes.find((l) => l.tag === w.tag);
  return { tag: w.tag, giver: lane?.giver ?? null, name: lane?.label ?? w.tag, value: lane?.value ?? '', start: w.start, end: w.end };
});

const out = {
  members: names.map((name, i) => ({ name, color: memberColors(resolved.team.members.map((m) => m.character.element))[i] })),
  duration: Math.max(...hits.map((h) => h.t)) + 1,
  dps: Math.round(result.totals.avg / effectiveDuration(project)),
  total: Math.round(result.totals.avg),
  hits,
  windows,
};
writeFileSync(path.join(process.cwd(), 'src/screens/inicio/demo.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`${hits.length} golpes, ${windows.length} janelas, total ${out.total}`);
