/**
 * Lê a foto (print) de um artefato do jogo. O reconhecimento de texto roda no navegador (tesseract.js, baixado só
 * quando se usa); o resultado vira um rascunho que o usuário confere no formulário antes de salvar.
 * `parseArtifactText` é puro e testado: entende os nomes dos stats em português e em inglês.
 */
import type { SubKey } from './artifactProcs';
import { SUB_KEYS } from './artifactProcs';

export type SlotKey = 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';
export interface ParsedArtifact {
  setKey: string | null;
  slotKey: SlotKey | null;
  rarity: 4 | 5;
  level: number | null;
  mainStatKey: string | null;
  substats: { key: SubKey; value: number }[];
  /** Avisos para mostrar ao usuário (o que não deu para ler). */
  notes: string[];
}
export interface SetName { name: string; namePt?: string; rarity?: number }

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ELEMENTS = ['pyro', 'hydro', 'electro', 'cryo', 'anemo', 'geo', 'dendro'];

/** Nome do stat (como no jogo, em pt-BR ou inglês) -> chave do GOOD. `percent` diferencia HP de HP%. */
export function statKey(label: string, percent: boolean): string | null {
  const n = plain(label);
  if (/taxa.*crit|crit.*(rate|taxa)/.test(n)) return 'critRate_';
  if (/dano.*crit|crit.*(dmg|dano)/.test(n)) return 'critDMG_';
  if (/recarga|recharge/.test(n)) return 'enerRech_';
  if (/profici|mastery|\bem\b/.test(n)) return 'eleMas';
  if (/cura|heal/.test(n)) return 'heal_';
  if (/fisic|physical/.test(n)) return 'physical_dmg_';
  const el = ELEMENTS.find((e) => n.includes(e));
  if (el && /dano|dmg|bonus/.test(n)) return `${el}_dmg_`;
  if (/\bpv\b|\bhp\b|vida/.test(n)) return percent ? 'hp_' : 'hp';
  if (/\batk\b|\batq\b|ataque|attack/.test(n)) return percent ? 'atk_' : 'atk';
  if (/\bdef\b|defesa|defense/.test(n)) return percent ? 'def_' : 'def';
  return null;
}

const SLOT_WORDS: [SlotKey, RegExp][] = [
  ['flower', /flor|flower/],
  ['plume', /pluma|plume/],
  ['sands', /areia|sands|\beon\b/],
  ['goblet', /calice|goblet|eonot/],
  ['circlet', /diadema|tiara|circlet|logos/],
];

function inferSlot(mainKey: string | null): SlotKey | null {
  if (!mainKey) return null;
  if (mainKey === 'hp') return 'flower';
  if (mainKey === 'atk') return 'plume';
  if (mainKey === 'enerRech_') return 'sands';
  if (mainKey.endsWith('_dmg_')) return 'goblet';
  if (mainKey === 'critRate_' || mainKey === 'critDMG_' || mainKey === 'heal_') return 'circlet';
  return null;
}

/** "14,8" -> 14.8; "4,780" -> 4780. Fixos (HP, ATK, DEF, EM) são inteiros. */
function toNumber(raw: string, percent: boolean): number {
  if (!percent && /^\d{1,3}([.,]\d{3})+$/.test(raw)) return Number(raw.replace(/[.,]/g, ''));
  const n = Number(raw.replace(',', '.'));
  return percent ? n : Math.round(n);
}

/** Palavras do nome do set que aparecem no texto; escolhe o set com mais acertos (mín. 75% das palavras). */
function matchSet(text: string, sets: readonly SetName[]): SetName | null {
  const words = new Set(plain(text).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean));
  let best: { set: SetName; score: number; len: number } | null = null;
  for (const s of sets) {
    for (const nm of [s.name, s.namePt].filter((x): x is string => !!x)) {
      const parts = plain(nm).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 1);
      if (parts.length === 0) continue;
      const hit = parts.filter((w) => words.has(w)).length;
      const score = hit / parts.length;
      if (score >= 0.75 && (!best || score > best.score || (score === best.score && parts.length > best.len))) best = { set: s, score, len: parts.length };
    }
  }
  return best?.set ?? null;
}

export const setKeyOf = (name: string) => name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');

export function parseArtifactText(text: string, sets: readonly SetName[]): ParsedArtifact {
  const notes: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.replace(/[·•*●◆▪]/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
  // Junta "ATK" + "311" (nome e valor em linhas separadas, como o stat principal do jogo).
  const merged: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!/\d/.test(l) && statKey(l, false) && i + 1 < lines.length && /^\+?[\d.,]+\s*%?$/.test(lines[i + 1])) merged.push(`${l} ${lines[++i]}`);
    else merged.push(l);
  }
  const cut = merged.findIndex((l) => /\b[24]\s*-?\s*(piece|pe[cç]as?)\b|conjunto|\bset\b/i.test(plain(l)));
  const body = cut >= 0 ? merged.slice(0, cut) : merged;

  const set = matchSet(text, sets);
  if (!set) notes.push('Não reconheci o set: escolha na lista.');

  let level: number | null = null;
  const stats: { key: string; value: number; percent: boolean }[] = [];
  for (const l of body) {
    const lv = /^\+\s*(\d{1,2})$/.exec(l);
    if (lv && level === null && Number(lv[1]) <= 20) { level = Number(lv[1]); continue; }
    const m = /^(.*?[A-Za-zÀ-ÿ%.'’]{2,}.*?)\s*[+:]?\s*(\d[\d.,]*)\s*(%)?\s*$/.exec(l);
    if (!m) continue;
    const percent = m[3] === '%';
    const key = statKey(m[1], percent);
    if (key) stats.push({ key, value: toNumber(m[2], percent), percent });
  }

  const main = stats[0] ?? null;
  const subs = stats.slice(1).filter((s): s is { key: SubKey; value: number; percent: boolean } => (SUB_KEYS as string[]).includes(s.key)).slice(0, 4);
  if (!main) notes.push('Não achei o stat principal.');
  if (subs.length < 3) notes.push(`Li só ${subs.length} substat(s): confira e complete.`);

  let slotKey: SlotKey | null = null;
  const t = plain(body.join(' '));
  for (const [k, re] of SLOT_WORDS) if (re.test(t)) { slotKey = k; break; }
  slotKey ??= inferSlot(main?.key ?? null);
  if (!slotKey) notes.push('Não reconheci a posição (flor, pluma, areia, cálice ou tiara).');

  return {
    setKey: set ? setKeyOf(set.name) : null,
    slotKey,
    rarity: (set?.rarity ?? 5) >= 5 ? 5 : 4,
    level,
    mainStatKey: main?.key ?? null,
    substats: subs.map(({ key, value }) => ({ key, value })),
    notes,
  };
}

/** Desenha a imagem maior e em tons de cinza; `invert` troca claro e escuro (o OCR lê melhor texto escuro em fundo claro). */
async function prepare(file: Blob, invert: boolean): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = bmp.width < 1400 ? 2 : 1;
  const c = document.createElement('canvas');
  c.width = bmp.width * scale;
  c.height = bmp.height * scale;
  const g = c.getContext('2d');
  if (!g) return file;
  g.filter = `grayscale(1) contrast(1.4)${invert ? ' invert(1)' : ''}`;
  g.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b ?? file), 'image/png'));
}

/** Lê o texto do print. Tenta a imagem normal e a invertida e fica com a que rendeu mais substats. */
export async function readArtifactImage(file: Blob, sets: readonly SetName[], onProgress?: (text: string) => void): Promise<ParsedArtifact> {
  const { createWorker } = await import('tesseract.js');
  onProgress?.('Carregando o leitor de texto…');
  const worker = await createWorker(['eng', 'por'], 1, {
    logger: (m: { status: string; progress: number }) => onProgress?.(`${m.status === 'recognizing text' ? 'Lendo' : 'Preparando'} (${Math.round(m.progress * 100)}%)`),
  });
  try {
    let best: ParsedArtifact | null = null;
    for (const invert of [true, false]) {
      const { data } = await worker.recognize(await prepare(file, invert));
      const p = parseArtifactText(data.text, sets);
      if (!best || p.substats.length > best.substats.length || (p.substats.length === best.substats.length && !best.setKey && p.setKey)) best = p;
      if (best.substats.length === 4 && best.setKey) break;
    }
    return best as ParsedArtifact;
  } finally {
    await worker.terminate();
  }
}
