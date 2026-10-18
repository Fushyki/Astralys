/**
 * Interpretação dos textos do Lunaris. Funções puras, testadas em tests/data/.
 *
 * Os multiplicadores chegam como texto por nível, p.ex.:
 *   "80.04%"                          → 80,04% de ATK (sem sufixo = ATK)
 *   "36.48% x2"  /  "14.1%*4"        → 2 / 4 acertos de 36,48% (escala já somada)
 *   "55.04%+73.1%"                   → 2 acertos diferentes (soma dos dois, hits = 2)
 *   "103.2% ATK+206.4% Elemental Mastery" → 1 acerto com escala mista ATK + EM
 *   "120% DEF"  /  "4.87% Max HP x3" → escala em outro atributo
 *   "160% DEF+770"                   → parte fixa somada ao valor
 *   "127.84%/159.68%"                → variantes (ex.: queda baixa/alta)
 *   "(67.2% ATK+134.4% Elemental Mastery)x2" → grupo repetido
 */
import type { HitType, StatKey, Talent } from '../../src/data/schema';

export type ScaleStat = 'atk' | 'hp' | 'def' | 'em';

export interface ParsedHit {
  atk: number;
  hp: number;
  def: number;
  em: number;
  flat: number;
}

export interface ParsedVariant {
  /** Escala TOTAL do golpe (soma dos acertos), em fração: 0.8004 = 80,04%. */
  scale: ParsedHit;
  hits: number;
}

export interface ParsedValue {
  variants: ParsedVariant[];
  qualifier?: string;
}

const NUM = '(\\d+(?:\\.\\d+)?)';
const STAT_WORDS = 'ATK|DEF|Max HP|HP|Elemental Mastery|EM';
const PERCENT_TERM = new RegExp(`^${NUM}\\s*%\\s*(${STAT_WORDS})?\\s*(?:[x*]\\s*(\\d+))?$`, 'i');
const FLAT_TERM = new RegExp(`^${NUM}$`);

function statOf(word: string | undefined): ScaleStat {
  if (!word) return 'atk';
  const w = word.toLowerCase();
  if (w === 'def') return 'def';
  if (w === 'hp' || w === 'max hp') return 'hp';
  if (w === 'em' || w === 'elemental mastery') return 'em';
  return 'atk';
}

const emptyHit = (): ParsedHit => ({ atk: 0, hp: 0, def: 0, em: 0, flat: 0 });

interface Term {
  stat: ScaleStat | 'flat';
  value: number;
  /** Havia sufixo de atributo explícito (ex.: "ATK", "DEF"). */
  explicit: boolean;
  /** Multiplicador do próprio termo ("93.6%x2"): quantos acertos ele representa. */
  repeat: number;
}

function parseTerms(part: string, inheritedStat?: string): Term[] | null {
  const terms: Term[] = [];
  for (const raw of part.split('+')) {
    const t = raw.trim();
    if (!t) return null;
    const pct = PERCENT_TERM.exec(t);
    if (pct) {
      const word = pct[2] ?? inheritedStat;
      terms.push({ stat: statOf(word), value: parseFloat(pct[1]) / 100, explicit: !!pct[2], repeat: pct[3] ? parseInt(pct[3], 10) : 1 });
      continue;
    }
    const flat = FLAT_TERM.exec(t);
    if (flat) {
      terms.push({ stat: 'flat', value: parseFloat(flat[1]), explicit: false, repeat: 1 });
      continue;
    }
    return null;
  }
  return terms.some((t) => t.stat !== 'flat') ? terms : null;
}

function toVariant(terms: Term[], repeat: number): ParsedVariant {
  const scale = emptyHit();
  for (const t of terms) scale[t.stat] += t.value * t.repeat;

  const percentTerms = terms.filter((t) => t.stat !== 'flat');
  const sameStat = percentTerms.every((t) => t.stat === percentTerms[0].stat);
  // "a%+b%" no mesmo atributo = acertos diferentes (somam-se); atributos diferentes = acerto de escala mista.
  const hitsInside = sameStat
    ? percentTerms.reduce((n, t) => n + t.repeat, 0)
    : Math.max(...percentTerms.map((t) => t.repeat));

  if (repeat > 1) for (const k of Object.keys(scale) as (keyof ParsedHit)[]) scale[k] *= repeat;
  return { scale, hits: hitsInside * repeat };
}

/** Interpreta o texto de UM nível de um golpe de dano. Devolve null se o formato não for reconhecido. */
export function parseDamageValue(raw: string): ParsedValue | null {
  let s = String(raw).trim();
  if (!s) return null;

  // Qualificador por unidade: "72% each", "41.92% per Paw", "55.13%/Strike"
  let qualifier: string | undefined;
  const q = /^(.*?)(?:\s+(each)|\s+(per [A-Za-z ]+)|\/([A-Za-z][A-Za-z' -]*))$/i.exec(s);
  if (q && /%/.test(q[1])) {
    qualifier = (q[2] ?? q[3] ?? q[4]).trim();
    s = q[1].trim();
  }

  // Grupo repetido: "(a% ATK+b% EM)x2". Fora de grupos, o "xN" pertence a cada termo.
  let repeat = 1;
  const group = /^\((.*)\)\s*[x*]\s*(\d+)$/i.exec(s);
  if (group) {
    s = group[1];
    repeat = parseInt(group[2], 10);
  }

  // Variantes "a/b/c"; o atributo escrito na última parte vale para as anteriores sem sufixo.
  const parts = s.split('/').map((p) => p.trim());
  const lastWord = new RegExp(`%\\s*(${STAT_WORDS})\\s*$`, 'i').exec(parts[parts.length - 1])?.[1];

  const variants: ParsedVariant[] = [];
  for (const part of parts) {
    const terms = parseTerms(part, lastWord);
    if (!terms) return null;
    variants.push(toVariant(terms, repeat));
  }
  return { variants, qualifier };
}

// ---------- Classificação de rótulos ----------

// Arcos usam "Aimed Shot"; várias habilidades usam "DoT" ou só "Charged Attack" sem a palavra DMG.
const IS_DAMAGE = /\b(DMG|Damage|Aimed Shot|DoT|Charged Attack|Slash)\b/i;
const NOT_DAMAGE =
  /(Bonus|Increase|Decrease|Absorption|Heal|Regenerat|Reduction|Mitigation|Cost|Cooldown|Duration|Interval|Limit|Shield|Threshold|Trigger|Quota|Stamina|Conversion|Consumption|Maximum|Gain|Inherited|\bCD\b)/i;

/** O rótulo descreve dano direto (e não bônus, cura, duração, custo...)? */
export function isDamageLabel(label: string): boolean {
  return IS_DAMAGE.test(label) && !NOT_DAMAGE.test(label);
}

/** O rótulo é claramente algo que não é dano (usado só para filtrar o relatório de candidatos). */
export function isNonDamageLabel(label: string): boolean {
  return NOT_DAMAGE.test(label);
}

/** Tipo de golpe para os bônus de DMG% por tipo (Normal/Carregado/Imersivo/Habilidade/Supremo). */
export function hitTypeFor(label: string, talent: Talent): HitType {
  if (/plunge/i.test(label)) return 'plunge';
  if (/charged|aimed shot/i.test(label)) return 'charged';
  if (talent === 'normal') return 'normal';
  if (/\bnormal attack\b|\b\d+-hit\b/i.test(label)) return 'normal';
  return talent;
}

// ---------- Números simples ----------

/** "12s" → 12. Intervalos ("5/7.5/10s", "6-36s") não são interpretados (null). */
export function parseSeconds(raw: string): number | null {
  const m = /^(\d+(?:\.\d+)?)\s*s$/i.exec(String(raw).trim());
  return m ? parseFloat(m[1]) : null;
}

export function parsePlainNumber(raw: string): number | null {
  const m = /^(\d+(?:\.\d+)?)$/.exec(String(raw).trim());
  return m ? parseFloat(m[1]) : null;
}

// ---------- Stats de ascensão / substat ----------

const ELEMENT_BONUS: Record<string, StatKey> = {
  Physical: 'Physical%', Pyro: 'Pyro%', Hydro: 'Hydro%', Anemo: 'Anemo%',
  Electro: 'Electro%', Dendro: 'Dendro%', Cryo: 'Cryo%', Geo: 'Geo%',
};

/** Converte a chave/valor do Lunaris ("CRIT DMG%": 38.4) para o stat normalizado (CD: 0.384). */
export function normalizeStat(key: string, value: number): { stat: StatKey; value: number } | null {
  const pct = value / 100;
  switch (key) {
    case 'CRIT Rate%': return { stat: 'CR', value: pct };
    case 'CRIT DMG%': return { stat: 'CD', value: pct };
    case 'ATK%': return { stat: 'ATK%', value: pct };
    case 'HP%': return { stat: 'HP%', value: pct };
    case 'DEF%': return { stat: 'DEF%', value: pct };
    case 'Energy Recharge%': return { stat: 'ER', value: pct };
    case 'Healing Bonus%': return { stat: 'Healing', value: pct };
    case 'Elemental Mastery': return { stat: 'EM', value };
  }
  const el = /^(\w+) DMG Bonus%$/.exec(key);
  if (el && ELEMENT_BONUS[el[1]]) return { stat: ELEMENT_BONUS[el[1]], value: pct };
  return null;
}
