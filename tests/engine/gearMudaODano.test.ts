import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const FILLERS = ['Mavuika', 'Citlali', 'Iansan', 'Bennett'];
const TYPES = ['normal', 'charged', 'skill', 'burst'] as const;
const HOLDER: Record<string, string> = { Sword: 'Kaeya', Claymore: 'Diluc', Polearm: 'Xiangling', Bow: 'Ganyu', Catalyst: 'Lisa' };

/** Assinatura (dano e stats finais de cada golpe) de um time cujo membro 0 recebe `patch`, com os efeitos dados e as etiquetas ligadas. */
function signature(holder: string, patch: Record<string, unknown>, fx: EffectsData, tags: string[]): string {
  const names = [holder, ...FILLERS.filter((n) => n !== holder)].slice(0, 4);
  const actions = names.flatMap((n, member) =>
    TYPES.flatMap((t) => {
      const mv = game.moves.find((m) => m.character === n && m.hitType === t);
      return mv ? [{ member, move: { character: n, talent: t === 'charged' ? 'normal' : t, label: mv.label, variant: 0 } }] : [];
    }),
  );
  const p = {
    ...sampleProject(), compat: 'none', elementMode: 'personagem',
    members: names.map((n, i) => ({ ...defaultMember(n, game), gearManual: false, ...(i === 0 ? patch : {}) })),
    actions: actions.map((a, i) => ({ id: `a${i}`, member: a.member, move: a.move, executions: 1, reaction: 'none', activeTags: tags, tagSource: 'manual', dmgAdjust: 0, time: i })),
    buffWindows: [], disabled: [],
  };
  const r = resolveProject(p as never, game, fx);
  const asm = assembleTeam(r.team);
  return evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions.map((a) => JSON.stringify([a.avg, a.stats])).join('|');
}

/**
 * Efeitos que não mudaram nada neste cenário. A maioria é esperada (energia, cura, recarga de habilidade: Favonius, Sacrificial,
 * Prayers, Maiden Beloved) ou depende de condição que o cenário não liga (Lithic, Predator, golpes extras). Revisar um a um
 * os que não se explicam. A lista só pode ENCOLHER.
 */
const NAO_VERIFICADOS_ARMAS = new Set<string>(["Favonius Sword","The Flute","Sacrificial Sword","Sword of Descension","Amenoma Kageuchi","Kagotsurube Isshin","Prized Isshin Blade","Sword of Narzissenkreuz","Favonius Greatsword","Sacrificial Greatsword","Prototype Archaic","Lithic Blade","Snow-Tombed Starsilver","Lithic Spear","Favonius Lance","Dragonspine Spear","Rightful Reward","Dialogues of the Desert Sages","Favonius Codex","Sacrificial Fragments","Prototype Amber","Eye of Perception","Frostbearer","Ash-Graven Drinking Horn","Favonius Warbow","Sacrificial Bow","The Viridescent Hunt","Predator","End of the Line","Sequence of Solitude"]);
const NAO_VERIFICADOS_SETS = new Set<string>(["Tiny Miracle","Adventurer","Lucky Dog","Traveling Doctor","Maiden Beloved","???","Prayers for Illumination","Prayers for Destiny","Prayers for Wisdom","Prayers to the Firmament","Prayers to Springtime","Ocean-Hued Clam","Deepwood Memories","Song of Days Past"]);

it('cada arma com efeito de stat ou buff muda o resultado em relação a ela sem efeito', () => {
  const dead: string[] = [];
  let checked = 0;
  for (const w of effects.weapons) {
    const g = game.weapons.find((x) => x.name === w.weapon);
    const holder = g && HOLDER[g.type];
    if (!holder) continue;
    const r = w.refinements?.[0] ?? w;
    const tags = (r.buffs ?? []).map((b) => `label:${w.weapon}: ${b.label}`);
    const without = { ...effects, weapons: effects.weapons.filter((x) => x.weapon !== w.weapon) };
    checked++;
    if (signature(holder, { weapon: w.weapon }, effects, tags) === signature(holder, { weapon: w.weapon }, without, tags)) dead.push(w.weapon);
  }
  expect(checked).toBeGreaterThan(150);
  expect(dead.filter((d) => !NAO_VERIFICADOS_ARMAS.has(d))).toEqual([]);
}, 300000);

it('cada set com efeito muda o resultado em relação a ele sem efeito', () => {
  const dead: string[] = [];
  let checked = 0;
  for (const s of effects.sets) {
    const tags = (s.fourPiece?.buffs ?? []).map((b) => `label:${s.set}: ${b.label}`);
    const without = { ...effects, sets: effects.sets.filter((x) => x.set !== s.set) };
    checked++;
    if (signature('Kaeya', { primarySet: s.set, fourPiece: true }, effects, tags) === signature('Kaeya', { primarySet: s.set, fourPiece: true }, without, tags)) dead.push(s.set);
  }
  expect(checked).toBeGreaterThan(50);
  expect(dead.filter((d) => !NAO_VERIFICADOS_SETS.has(d))).toEqual([]);
}, 300000);
