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
/** Quem está em campo: buffs `onCharTag` (ATK fixo de Iansan e Bennett) só valem com a etiqueta do membro. */
const CHARS = [0, 1, 2, 3].map((i) => `char:${i}`);
/** O dono é o membro 0: sem a etiqueta dele, seus buffs `onCharTag` ficam desligados. */
const OTHERS = CHARS.slice(1);
const TYPES = ['normal', 'charged', 'plunge', 'skill', 'burst'] as const;

/** Assinatura do resultado (dano e stats finais de cada golpe): um golpe de cada tipo de cada membro, com as etiquetas dadas ligadas em todos. */
function total(character: string, tags: string[]): string {
  const names = [character, ...FILLERS.filter((n) => n !== character)].slice(0, 4);
  const actions = names.flatMap((n, member) =>
    TYPES.flatMap((t) => {
      const mv = game.moves.find((m) => m.character === n && m.hitType === t);
      return mv ? [{ member, move: { character: n, talent: t === 'charged' || t === 'plunge' ? 'normal' : t, label: mv.label, variant: 0 }, tags }] : [];
    }),
  );
  const p = {
    ...sampleProject(), compat: 'none', elementMode: 'personagem',
    members: names.map((n) => ({ ...defaultMember(n, game), constellation: 6 })),
    actions: actions.map((a, i) => ({ id: `a${i}`, member: a.member, move: a.move, executions: 1, reaction: 'none', activeTags: a.tags, tagSource: 'manual', dmgAdjust: 0, time: i })),
    buffWindows: [], disabled: [],
  };
  const r = resolveProject(p as never, game, effects);
  const asm = assembleTeam(r.team);
  return evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions.map((a) => [a.avg, a.stats]).map((x) => JSON.stringify(x)).join('|');
}

/**
 * Buffs que NÃO mudaram nada neste cenário (time fixo, sem stacks, sem Hexerei/Moonsign, sem reação). Podem ser só condicionados
 * (Gorou pede 2 Geo, Furina pede Fanfarra, Fischl hex pede Hexerei) ou podem ser erro: revisar um a um. A lista só pode ENCOLHER.
 */
const NAO_VERIFICADOS = new Set(["Albedo:a4hs","Albedo:a4hx","Gorou:skill","Shenhe:c4","Nilou:a1","Wriothesley:a1","Mona:c4h","Sucrose:p4s","Sucrose:p4l","Sucrose:c6hex","Wanderer:c2","Chevreuse:a1","Xilonen:c2hydro","Flins:c2res","Aino:c6g","Nefer:c2","Nefer:a1","Durin:a1hex","Jahoda:c6","Columbina:c2lc","Columbina:c2lb","Columbina:c2lcr","Illuga:a1","Illuga:c6","Varka:c4-hydro","Lohen:a4hex","Aether (Dendro):c6h","Lumine (Dendro):c6h","Prune:hex-self","Prune:hex-trig","Mitya:c2em","Mitya:a1","Escoffier:c1","Yanfei:a1","Furina:burst","Lauma:a1a","Fischl:hex-atk","Fischl:hex-em","Fischl:c6atk","Fischl:c6em"]);

it('cada buff em janela dos personagens muda o dano ou os stats quando ligado (salvo os não verificados)', () => {
  const dead: string[] = [];
  let checked = 0;
  for (const e of effects.characters) {
    for (const b of (e.buffs ?? []).filter((x) => x.timed)) {
      checked++;
      if (total(e.character, OTHERS) === total(e.character, [...OTHERS, b.onCharTag ? CHARS[0] : `label:${b.label}`])) dead.push(`${e.character}:${b.id}`);
    }
  }
  expect(total('Mavuika', []).length).toBeGreaterThan(100);
  expect(checked).toBeGreaterThan(200);
  expect(dead.filter((d) => !NAO_VERIFICADOS.has(d))).toEqual([]);
}, 120000);

it('uma etiqueta que não existe não muda nada (o teste não é vazio)', () => {
  expect(total('Mavuika', ['label:Buff que não existe'])).toBe(total('Mavuika', []));
});
