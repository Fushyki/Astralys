// Piloto (#40): cada personagem (90, talentos 10, sem arma nem artefatos, C0 e C6) no GO (sem ligar condições) e no Astralys.
// Uso: bundle.mjs <clone do GO> <entrada com export de gi/sheets, `wr` e uiDataForTeam> <go.cjs>; empacotar este arquivo com o esbuild e
// rodar `node compare.cjs <go.cjs> <saida.json>`.
// shortcut: casa golpes pelo valor (±0,25%; golpes de vários acertos podem somar até 3 golpes do mesmo talento), então há falso
// positivo e negativo; casar por nome se virar teste fixo.
import { readFileSync, writeFileSync } from 'node:fs';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { nakedMember } from '../../src/features/rotation/teamOps';

const go = require(process.argv[2]);
const json = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const noEffects: EffectsData = { ...effects, characters: effects.characters.map((c) => ({ ...c, buffs: [] })) };
const SKIP = ['basic', 'reaction', 'nicole', 'moonsign'];
const TOL = 0.0025;
const STATS: [string, string][] = [['atk', 'atk'], ['hp', 'hp'], ['def', 'def'], ['em', 'eleMas'], ['er', 'enerRech_'], ['critRate', 'critRate_'], ['critDmg', 'critDMG_']];

function ourSide(name: string, constellation: number, fx: EffectsData, data: GameData = game) {
  const moves = game.moves.filter((m) => m.character === name);
  const members = [{ ...nakedMember(name, game), constellation }];
  const actions = moves.map((m) => ({ id: m.id, member: 0, move: { character: name, talent: m.talent, label: m.label, variant: m.variant }, executions: 1, reaction: 'none' as const, activeTags: [], tagSource: 'manual' as const, dmgAdjust: 0, time: 1 }));
  const p = { ...sampleProject(), compat: 'none' as const, members, actions, buffWindows: [], disabled: [], flatStacks: {}, extras: [] };
  const r = resolveProject(p as never, data, fx);
  const res = evaluateRotation({ members: r.team.members, assembly: assembleTeam(r.team, { rolls: [minimumRolls(0)] }), config: r.team.config, rolls: [minimumRolls(0)], flatEffects: r.flatEffects }, r.actions).actions;
  return { moves, res, cfg: r.team.config as any };
}

function matches(value: number, hits: number, theirs: { section: string; value: number }[]) {
  const near = (v: number) => Math.abs(v / value - 1) < TOL;
  if (theirs.some((t) => { for (let k = 1; k <= Math.max(1, hits); k++) if (near(t.value * k)) return true; return false; })) return true;
  if (hits < 2) return false;
  for (const a of theirs) for (const b of theirs) {
    if (a.section !== b.section) continue;
    if (near(a.value + b.value)) return true;
    if (hits >= 3) for (const c of theirs) if (c.section === a.section && near(a.value + b.value + c.value)) return true;
  }
  return false;
}

const out: any[] = [];
for (const c of game.characters) for (const constellation of [0, 6]) {
  const name = c.name;
  try {
    const traveler = /^(Aether|Lumine) \((\w+)\)/.exec(name);
    const key = traveler ? `Traveler${traveler[2]}` : name.replace(/[^A-Za-z]/g, '');
    const gender = traveler?.[1] === 'Aether' ? 'M' : 'F';
    const sheet = go.getCharSheet(key, gender);
    if (!sheet) { out.push({ name, constellation, error: 'sem ficha no GO' }); continue; }
    const ours = ourSide(name, constellation, effects);
    const bare = ourSide(name, constellation, noEffects);
    const enemyOverride: Record<string, number> = { enemyLevel: ours.cfg.enemyLevel };
    for (const e of ['anemo', 'geo', 'electro', 'hydro', 'pyro', 'cryo', 'dendro', 'physical']) enemyOverride[`${e}_enemyRes_`] = ours.cfg.enemyBaseRes * 100;
    const data = [
      go.wr.dataObjForCharacterNew({ key, level: 90, constellation, ascension: 6, talent: { auto: 10, skill: 10, burst: 10 }, infusionAura: '', customMultiTargets: [], conditional: {}, bonusStats: {}, enemyOverride, hitMode: 'hit', reaction: '' }),
      sheet.data, go.wr.common, go.resonanceData, go.reactionData,
    ];
    const ui = go.uiDataForTeam({ [key]: data }, gender, key)[key].target;
    const theirs: { id: string; section: string; value: number }[] = [];
    for (const [section, nodes] of Object.entries<any>(sheet.data.display)) {
      if (SKIP.includes(section)) continue;
      for (const [k, node] of Object.entries(nodes)) { const value = ui.get(node).value; if (value > 0) theirs.push({ id: `${section}.${k}`, section, value, ele: String(ui.get(node as any).info?.variant ?? '') } as any); }
    }
    // Categoria de cada golpe no GO: dobra o bônus de uma categoria por vez e vê quais golpes mudam.
    const KINDS = ['normal', 'charged', 'plunging', 'skill', 'burst'];
    const kindOf: Record<string, string[]> = {};
    for (const kind of KINDS) {
      const boosted = go.wr.dataObjForCharacterNew({ key, level: 90, constellation, ascension: 6, talent: { auto: 10, skill: 10, burst: 10 }, infusionAura: '', customMultiTargets: [], conditional: {}, bonusStats: { [`${kind}_dmg_`]: 100 }, enemyOverride, hitMode: 'hit', reaction: '' });
      const u = go.uiDataForTeam({ [key]: [boosted, ...data.slice(1)] }, gender, key)[key].target;
      for (const [section, nodes] of Object.entries<any>(sheet.data.display)) {
        if (SKIP.includes(section)) continue;
        for (const [k, node] of Object.entries<any>(nodes)) { if (u.get(node).value > ui.get(node).value * 1.01) (kindOf[`${section}.${k}`] ??= []).push(kind); }
      }
    }
    const goStats = Object.fromEntries(STATS.map(([n, g]) => [n, ui.get(go.wr.input.total[g]).value]));
    const mine: any = (bare.res[0] as any)?.stats ?? {};
    const full: any = (ours.res[0] as any)?.stats ?? {};
    const statDiff = STATS.map(([n]) => ({ n, bare: mine[n], full: full[n], go: goStats[n] })).filter((s) => Math.abs((s.bare ?? 0) - s.go) > Math.max(0.002 * Math.abs(s.go), s.go < 5 ? 0.002 : 1));
    // Troca a base (HP/ATK/DEF) pela do GO: o que sobrar de diferença não vem do atributo base (esse sai em statDiff).
    const fix: any = {};
    for (const [n, field] of [['hp', 'baseHp'], ['atk', 'baseAtk'], ['def', 'baseDef']] as const) {
      const near = [mine[n], full[n]].filter(Boolean).sort((x, y) => Math.abs(x - goStats[n]) - Math.abs(y - goStats[n]))[0];
      const ratio = goStats[n] / near;
      if (Math.abs(ratio - 1) < 0.05) fix[field] = (c as any)[field] * ratio;
    }
    const fixed: GameData = { ...game, characters: game.characters.map((x) => (x.name === name ? { ...x, ...fix } : x)) };
    const ours2 = ourSide(name, constellation, effects, fixed).res, bare2 = ourSide(name, constellation, noEffects, fixed).res;
    // O multiplicador do nível 10 do nosso golpe existe nos parâmetros do GO (sozinho, repetido ou somado até 3)?
    const params: number[] = Object.entries<any>(go.allStats.char.skillParam[go.getCharEle ? key : key] ?? go.allStats.char.skillParam[name.replace(/[^A-Za-z]/g, '')] ?? {}).flatMap(([k, v]) => (k.startsWith('constellation') ? [] : (v ?? []).map((a: any) => (Array.isArray(a) ? a[9] ?? a[0] : a)))).filter((x) => typeof x === 'number' && x > 0 && x < 40);
    const inGo = (x: number, hits: number) => {
      const near = (v: number) => Math.abs(v / x - 1) < 0.0015;
      return params.some((a) => { for (let k = 1; k <= Math.max(1, hits); k++) if (near(a * k)) return true; return params.some((b) => near(a + b) || (hits >= 3 && params.some((d) => near(a + b + d)))); });
    };
    const hits = ours.res.map((o, i) => {
      const m = ours.moves[i];
      if (!(o.noCrit > 0)) return null;
      const status = matches(ours2[i].noCrit, m.hits, theirs) ? 'ok' : matches(bare2[i].noCrit, m.hits, theirs) ? 'buff' : 'diff';
      const scales = Object.entries<any>(m.scale).filter(([k, v]) => k !== 'flat' && v?.[9] > 0).map(([k, v]) => [k, v[9]] as [string, number]);
      const mult = scales.every(([, x]) => inGo(x, m.hits));
      const nearest = theirs.map((t) => ({ id: t.id, ratio: bare2[i].noCrit / t.value })).sort((a, b) => Math.abs(Math.log(a.ratio)) - Math.abs(Math.log(b.ratio)))[0];
      // Elemento: golpes de mesmo valor no GO (mesmo talento) e o elemento deles.
      const same = (theirs as any[]).filter((t) => t.section === (m.talent === 'normal' ? t.section : m.talent) && (m.talent !== 'normal' || ['normal', 'charged', 'plunging'].includes(t.section)) && Math.abs(t.value / ours2[i].noCrit - 1) < TOL);
      const goEle = [...new Set(same.map((t) => t.ele))];
      const goKind = same.length && same.every((t) => kindOf[t.id]) ? [...new Set(same.flatMap((t) => kindOf[t.id]))] : [];
      return { goEle, goKind, hitType: m.hitType, talent: m.talent, label: m.label, variant: m.variant, hits: m.hits, element: o.element, status, mult, scales, ours: +o.noCrit.toFixed(1), bare: +bare.res[i].noCrit.toFixed(1), dmgMult: +(o.breakdown as any).dmgMultiplier.toFixed(4), nearest };
    }).filter(Boolean);
    out.push({ name, constellation, hits, statDiff, theirs: theirs.map((t) => `${t.id}=${t.value.toFixed(1)}`) });
  } catch (e) { out.push({ name, constellation, error: String((e as Error).message).slice(0, 200) }); }
}
writeFileSync(process.argv[3], JSON.stringify(out));
for (const k of [0, 6]) {
  const rows = out.filter((r) => r.constellation === k && !r.error);
  const all = rows.flatMap((r) => r.hits);
  console.log(`C${k}: ${rows.length} personagens, ${all.length} golpes, ok ${all.filter((h) => h.status === 'ok').length}, multiplicador fora do GO ${all.filter((h) => !h.mult).length}, só sem buffs ${all.filter((h) => h.status === 'buff').length}, diferentes ${all.filter((h) => h.status === 'diff').length}; sem diferença: ${rows.filter((r) => r.hits.every((h: any) => h.status === 'ok')).length}`);
}
console.log('Erros:', out.filter((r) => r.error).map((r) => `${r.name} C${r.constellation}: ${r.error}`).join(' | ') || 'nenhum');
console.log('Atributos base diferentes (C0, sem buffs):');
for (const r of out) if (r.constellation === 0 && r.statDiff?.length) console.log(' ', r.name, r.statDiff.map((s: any) => `${s.n} nosso ${+s.bare?.toFixed(3)} (com buffs ${+s.full?.toFixed(3)}) GO ${+s.go.toFixed(3)}`).join('; '));
console.log('Elemento diferente do GO (mesmo valor, outro elemento):');
for (const r of out) if (r.constellation === 0 && r.hits) for (const h of r.hits) if (h.goEle.length && h.goEle.every((e: string) => e && e !== 'invalid' && e !== String(h.element).toLowerCase())) console.log(' ', r.name, '|', h.talent, h.label, 'nosso', h.element, 'GO', h.goEle.join('/'));
console.log('Categoria diferente do GO (mesmo valor):');
for (const r of out) if (r.constellation === 0 && r.hits) { const bad = r.hits.filter((h: any) => h.goKind.length && !h.goKind.includes(h.hitType === 'plunge' ? 'plunging' : h.hitType)); if (bad.length) console.log(' ', r.name, '|', bad.map((h: any) => `${h.talent} ${h.label.replace(/ DMG/, '')}: nosso ${h.hitType}, GO ${h.goKind.join('/')}`).join('; ')); }
