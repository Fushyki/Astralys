// Piloto (#40): cada personagem (90, C0, talentos 10, sem arma nem artefatos) no GO e no Astralys. Controle: o nosso sem nenhum buff.
// Uso: bundle.mjs <clone do GO> <entrada com export de gi/sheets, `wr` e uiDataForTeam> <go.cjs>; empacotar este arquivo com o esbuild e rodar `node compare.cjs <go.cjs>`.
// shortcut: casa golpes pelo valor mais próximo (±0,5%), então há falsos positivos e negativos; casar por nome se virar teste fixo.
import { readFileSync } from 'node:fs';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { nakedMember } from '../../src/features/rotation/teamOps';

const go = require(process.argv[2]);
const json = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const SKIP = ['basic', 'reaction', 'nicole', 'moonsign'];

const total = { chars: 0, ok: 0, hits: 0, same: 0, byBuff: 0 };
const clean: string[] = [], failed: string[] = [];
const phys = new Set<string>();
for (const name of game.characters.map((c) => c.name).filter((n) => !/^(Aether|Lumine) /.test(n))) try {
  const moves = game.moves.filter((m) => m.character === name);
  const members = [{ ...nakedMember(name, game), constellation: 0 }];
  const actions = moves.map((m) => ({ id: m.id, member: 0, move: { character: name, talent: m.talent, label: m.label, variant: m.variant }, executions: 1, reaction: 'none' as const, activeTags: [], tagSource: 'manual' as const, dmgAdjust: 0, time: 1 }));
  const p = { ...sampleProject(), compat: 'none' as const, members, actions, buffWindows: [], disabled: [], flatStacks: {}, extras: [] };
  const r = resolveProject(p as never, game, effects);
  const run = () => evaluateRotation({ members: r.team.members, assembly: assembleTeam(r.team, { rolls: [minimumRolls(0)] }), config: r.team.config, rolls: [minimumRolls(0)], flatEffects: r.flatEffects }, r.actions).actions;
  const ours = run();
  const noBuffs = resolveProject(p as never, game, { ...effects, characters: effects.characters.map((c) => ({ ...c, buffs: [] })) });
  const bare = evaluateRotation({ members: noBuffs.team.members, assembly: assembleTeam(noBuffs.team, { rolls: [minimumRolls(0)] }), config: noBuffs.team.config, rolls: [minimumRolls(0)], flatEffects: noBuffs.flatEffects }, noBuffs.actions).actions;

  const cfg: any = r.team.config;
  const sheet = go.getCharSheet(name.replace(/[^A-Za-z]/g, ''), 'F');
  const enemyOverride: Record<string, number> = { enemyLevel: cfg.enemyLevel };
  for (const e of ['anemo', 'geo', 'electro', 'hydro', 'pyro', 'cryo', 'dendro', 'physical']) enemyOverride[`${e}_enemyRes_`] = cfg.enemyBaseRes * 100;
  if (!sheet) { failed.push(`${name} (sem ficha no GO)`); continue; }
  const key = name.replace(/[^A-Za-z]/g, '');
  const data = [
    go.wr.dataObjForCharacterNew({ key, level: 90, constellation: 0, ascension: 6, talent: { auto: 10, skill: 10, burst: 10 }, infusionAura: '', customMultiTargets: [], conditional: {}, bonusStats: {}, enemyOverride, hitMode: 'hit', reaction: '' }),
    sheet.data, go.wr.common, go.resonanceData, go.reactionData,
  ];
  const ui = go.uiDataForTeam({ [key]: data }, 'F', key)[key].target;
  const theirs: { id: string; value: number }[] = [];
  for (const [section, nodes] of Object.entries<any>(sheet.data.display)) {
    if (SKIP.includes(section)) continue;
    for (const [key, node] of Object.entries(nodes)) { const value = ui.get(node).value; if (value > 0) theirs.push({ id: `${section}.${key}`, value }); }
  }
  const find = (v: number, hits: number) => theirs.some((t) => [1, hits].some((k) => Math.abs((t.value * k) / v - 1) < 0.005));
  const diff: string[] = [];
  let byBuff = 0;
  ours.forEach((o, i) => {
    const m = moves[i];
    if (!(o.noCrit > 0) || find(o.noCrit, m.hits)) return;
    const viaBuff = find(bare[i].noCrit, m.hits);
    if (viaBuff) { byBuff++; if (o.element === 'Physical') phys.add(name); }
    diff.push(`${m.talent} ${m.label}${m.variant ? ` (v${m.variant})` : ''}${viaBuff ? ' [bate sem nossos buffs]' : ''}`);
  });
  const n = ours.filter((o) => o.noCrit > 0).length;
  total.chars++; total.hits += n; total.same += n - diff.length; total.byBuff += byBuff;
  if (!diff.length) clean.push(name);
  else console.log(`${name} (${diff.length}/${n}): ${diff.join('; ')}`);
} catch (e) { failed.push(`${name}: ${String((e as Error).message).slice(0, 120)}`); }
console.log(`
TOTAL: ${total.chars} personagens, ${total.same}/${total.hits} golpes batem (±0,5%); ${total.byBuff} divergem só por buff nosso ligado por padrão; ${clean.length} personagens sem divergência.`);
console.log('Golpes Físicos que só batem sem os nossos buffs:', [...phys].join(', ') || 'nenhum');
console.log('Falharam:', failed.join(' | ') || 'nenhum');
