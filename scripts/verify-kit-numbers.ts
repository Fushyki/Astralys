/**
 * Verificador de número (Fase 3 da curadoria do kit): todo valor numérico de um efeito de ARMA tem que existir no
 * Lunaris, no refino certo (um parâmetro `params[i]`, um múltiplo inteiro dele de 2 a 20, ou um número escrito
 * na descrição). Sem isso o efeito falha. Uso: `npx tsx scripts/verify-kit-numbers.ts [Arma ...]`.
 *
 * Limite: confere o valor, não a condição nem o alvo (isso é o leitor independente e a comparação com o GO).
 * shortcut: só armas por enquanto; personagens e sets usam outra estrutura de nível/parte, ampliar na Fase 5.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { CharacterEffect, WeaponEffect } from '../src/effects/schema';

const root = process.cwd();
const read = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
interface Ref { description: string; params: number[] }
const weapons = read<{ name: string; passive: { refinements: Ref[] } | null }[]>('src/data/generated/weapons.json');
const effects = read<WeaponEffect[]>('src/effects/weapons.json');
const effectsChars = read<CharacterEffect[]>('src/effects/characters.json');

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b)) + 1e-9;
/** Valores que o texto do refino autoriza: params, múltiplos inteiros (stacks), e números da descrição (12% → 0,12 e 12). */
function allowed(ref: Ref): number[] {
  const out: number[] = [];
  for (const p of ref.params) {
    if (!p) continue;
    for (let k = 1; k <= 20; k++) out.push(p * k);
  }
  for (const m of ref.description.matchAll(/\d+(?:[.,]\d+)?/g)) {
    const n = Number(m[0].replace(',', '.'));
    out.push(n, n / 100);
    for (let k = 2; k <= 20; k++) out.push(n * k, (n / 100) * k);
  }
  return out;
}

function numbersOf(x: unknown, trail = ''): [string, number][] {
  if (typeof x === 'number') return x === 0 ? [] : [[trail, x]];
  if (Array.isArray(x)) return x.flatMap((v, i) => numbersOf(v, `${trail}[${i}]`));
  if (x && typeof x === 'object') {
    return Object.entries(x as Record<string, unknown>)
      .filter(([k]) => !['stacks', 'max', 'duration', 'minConstellation', 'step', 'default', 'unit', 'team'].includes(k))
      .flatMap(([k, v]) => numbersOf(v, trail ? `${trail}.${k}` : k));
  }
  return [];
}

export interface Failure { weapon: string; refinement: number; path: string; value: number }

export function verifyWeapon(effect: WeaponEffect): Failure[] {
  const w = weapons.find((x) => x.name === effect.weapon);
  if (!w?.passive) return [];
  const out: Failure[] = [];
  const perRef = effect.refinements ?? [];
  perRef.forEach((r, i) => {
    const ref = w.passive!.refinements[i];
    if (!ref) return;
    const ok = allowed(ref);
    for (const [p, v] of numbersOf(r)) {
      if (!ok.some((a) => close(a, v) || close(a, -v))) out.push({ weapon: effect.weapon, refinement: i + 1, path: p, value: v });
    }
  });
  return out;
}

interface Talents { character: { name?: string } | string; passives: unknown; constellations: unknown; skills: unknown }
const talents = read<Talents[]>('src/data/generated/talents.json');
/** Mantissa: tira as potências de 10 (coeficiente por ponto de stat, ex.: 0,1% por 1000 de HP = 0,000001). */
const mantissa = (v: number) => Number((Math.abs(v) / 10 ** Math.floor(Math.log10(Math.abs(v)))).toPrecision(9));
const SCALED = /(perPoint|capPerHit)$/;

/**
 * Personagens: cada número dos buffs tem que existir no texto das passivas, constelações ou kit do personagem
 * (também em x/100, x/10 e múltiplos de 1 a 20).
 * shortcut: confere contra o personagem inteiro, não contra o nó exato do buff (o buff não guarda o nó); apertar quando o buff guardar `src`.
 */
export function verifyCharacter(effect: CharacterEffect): Failure[] {
  const t = talents.find((x) => (typeof x.character === 'string' ? x.character : x.character.name) === effect.character);
  if (!t) return [];
  const ok: number[] = [];
  for (const m of JSON.stringify([t.passives, t.constellations, t.skills]).matchAll(/\d+(?:\.\d+)?/g)) {
    const n = Number(m[0]);
    for (let k = 1; k <= 20; k++) ok.push(n * k, (n / 100) * k, (n / 10) * k);
  }
  const okMant = ok.filter((a) => a > 0).map(mantissa);
  const out: Failure[] = [];
  for (const b of effect.buffs ?? []) {
    for (const [p, v] of numbersOf(b)) {
      if (/(^|\.)(level|note|label|id)(\.|$)/.test(p)) continue;
      const fine = SCALED.test(p) ? okMant.some((a) => close(a, mantissa(v))) : ok.some((a) => close(a, v) || close(a, -v));
      if (!fine) out.push({ weapon: `${effect.character} ${b.id}`, refinement: 0, path: p, value: v });
    }
  }
  return out;
}

if (process.argv[1]?.endsWith('verify-kit-numbers.ts')) {
  const only = process.argv.slice(2);
  const list = effects.filter((e) => !only.length || only.includes(e.weapon));
  const fails = list.flatMap(verifyWeapon);
  const bad = new Set(fails.map((f) => f.weapon));
  console.log(`${list.length} armas conferidas, ${bad.size} com número que o Lunaris não autoriza.`);
  for (const f of fails.slice(0, 40)) console.log(`  ${f.weapon} R${f.refinement} ${f.path} = ${f.value}`);
  if (fails.length > 40) console.log(`  ... mais ${fails.length - 40}`);
  process.exitCode = fails.length ? 1 : 0;
  const chars = effectsChars.filter((e) => !only.length || only.includes(e.character)).flatMap(verifyCharacter);
  console.log(`${effectsChars.length} personagens conferidos, ${chars.length} números que o Lunaris não autoriza.`);
  for (const f of chars.slice(0, 40)) console.log(`  ${f.weapon} ${f.path} = ${f.value}`);
  if (chars.length) process.exitCode = 1;
}
