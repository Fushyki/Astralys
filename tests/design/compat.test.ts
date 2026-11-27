/** Compatibilidade do CSS com os navegadores mínimos (CLAUDE.md, "Leveza e compatibilidade"). */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../..');
const files = (readdirSync(path.join(ROOT, 'src'), { recursive: true }) as string[])
  .filter((f) => f.endsWith('.css'))
  .map((f) => `src/${f.replace(/\\/g, '/')}`)
  .sort();
/** Comentários saem, as quebras de linha ficam (os números de linha continuam certos). */
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));

/**
 * Declarações com color-mix() sem cor sólida de reserva. Valem duas formas:
 * - com var(): a reserva fica numa regra e o color-mix() numa `@supports (... color-mix ...)` depois, no mesmo seletor. Na mesma
 *   regra não funciona: o navegador antigo aceita o var() na leitura, descarta a reserva e a propriedade fica sem cor;
 * - sem var(): a mesma propriedade, sem color-mix(), logo antes na mesma regra.
 */
function semReserva(css: string): { line: number; key: string }[] {
  const found: { line: number; key: string }[] = [];
  const solid = new Set<string>(); // `seletor | propriedade` que já têm cor sólida fora de @supports
  const blocks: { selector: string; prev?: { prop: string; value: string } }[] = [];
  let buf = '', start = 0, line = 1, parens = 0, quote = '';
  const flush = () => {
    const block = blocks[blocks.length - 1];
    const colon = buf.indexOf(':');
    if (block && colon > 0) {
      const prop = buf.slice(0, colon).trim();
      const value = buf.slice(colon + 1).trim();
      const key = `${block.selector} | ${prop}`;
      const guarded = blocks.some((b) => /^@supports (?!not\b).*color-mix\(/.test(b.selector));
      if (!value.includes('color-mix(')) {
        if (!guarded) solid.add(key);
      } else {
        const sameRule = block.prev?.prop === prop && !block.prev.value.includes('color-mix(');
        const covered = guarded ? solid.has(key) : sameRule && !value.includes('var(');
        if (!covered) found.push({ line: start, key });
      }
      block.prev = { prop, value };
    }
    buf = '';
  };
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '\n') line++;
    if (quote) { if (c === '\\') { buf += c + css[++i]; continue; } if (c === quote) quote = ''; }
    else if (c === '"' || c === "'") quote = c;
    else if (c === '(') parens++;
    else if (c === ')') parens--;
    else if (parens === 0 && c === '{') { blocks.push({ selector: buf.trim().replace(/\s+/g, ' ') }); buf = ''; continue; }
    else if (parens === 0 && c === ';') { flush(); continue; }
    else if (parens === 0 && c === '}') { flush(); blocks.pop(); continue; }
    if (!buf.trim() && c.trim()) start = line;
    buf += c;
  }
  return found;
}

/** Arquivos que já usavam `:has(`. É só melhoria: o layout precisa funcionar sem ele. */
const HAS_PERMITIDO = [
  'src/screens/cardpage.css',
  'src/screens/comparar.css',
  'src/screens/personagem.css',
];

/** CSS e TSX de `src/`: tamanho de texto e foco também são declarados nos componentes. */
const fontes = (readdirSync(path.join(ROOT, 'src'), { recursive: true }) as string[])
  .map((f) => `src/${f.replace(/\\/g, '/')}`)
  .filter((f) => /\.(css|tsx)$/.test(f))
  .sort();

/** Tamanhos abaixo de 12 px: em CSS (`font-size`, `font`, mínimo do `clamp`, fração de em/rem) e em `fontSize` no TSX. `0` esconde o texto de propósito. */
function textoPequeno(source: string): string[] {
  const px = [
    /font-size\s*:\s*(?:clamp\(\s*)?([\d.]+)px/g,
    /(?<![-\w])font\s*:\s*(?:(?:[a-z]+|\d{3})\s+)*(?:clamp\(\s*)?([\d.]+)px/g,
    /fontSize\s*[:=]\s*[{"'\s]*([\d.]+)(?:px)?(?![\w.%])/g,
  ].flatMap((re) => [...source.matchAll(re)].filter((m) => Number(m[1]) > 0 && Number(m[1]) < 12).map((m) => m[0]));
  return [...px, ...(source.match(/font-size\s*:\s*0?\.\d+r?em/g) ?? [])];
}

const semContorno = (source: string) => /outline\s*:\s*['"]?(none|0)(?![\w.])/.test(source) && !source.includes(':focus-visible');

describe('legibilidade e teclado', () => {
  it('os detectores pegam cada forma', () => {
    for (const ruim of ['a { font-size: 11px }', 'a { font: 600 10px/16px var(--x) }', 'a { font: italic 700 11.5px serif }', 'a { font-size: clamp(9px, 2vw, 20px) }', 'a { font-size: .85em }', '<text fontSize="11">', '<span style={{ fontSize: 10 }}>', "style={{ fontSize: '9px' }}"]) {
      expect(textoPequeno(ruim), ruim).toHaveLength(1);
    }
    for (const ok of ['a { font-size: 12px }', 'a { font-size: 0 }', 'a { font: 600 var(--fs-1) serif }', 'a { font-size: max(var(--fs-1), .85em) }', 'a { font-size: 1.2em }', '<text fontSize="14">', "style={{ fontSize: 'var(--fs-1)' }}"]) {
      expect(textoPequeno(ok), ok).toEqual([]);
    }
    expect(semContorno('a:focus { outline: none }')).toBe(true);
    expect(semContorno('a:focus { outline: 0; }\nb:focus-visible { outline: 2px solid }')).toBe(false);
    expect(semContorno('a { outline: 0.5px solid }')).toBe(false);
  });

  it('nenhum texto abaixo de 12 px (menos nos rótulos dos cards exportados como imagem)', () => {
    const novos = fontes.filter((f) => !f.startsWith('src/screens/card/')).flatMap((file) => textoPequeno(read(file)).map((t) => `${file}: ${t}`));
    expect(novos, `texto abaixo de 12 px (use var(--fs-1) ou maior):\n${novos.join('\n')}`).toEqual([]);
  });

  it('todo outline removido tem um :focus-visible no mesmo arquivo', () => {
    const novos = fontes.filter((file) => semContorno(read(file)));
    expect(novos, 'outline: none sem :focus-visible (use o contorno ouro)').toEqual([]);
  });
});

describe('compatibilidade do CSS', () => {
  it('o detector exige a reserva certa para cada caso', () => {
    const ok = `.a { color: red; color: color-mix(in srgb, red 1%, blue); }
.b { color: red; }
@supports (color: color-mix(in srgb, red, blue)) { .b { color: color-mix(in srgb, var(--x) 1%, blue); } }`;
    expect(semReserva(ok)).toEqual([]);
    const ruim = `
.a { color: red; color: color-mix(in srgb, var(--x) 1%, blue); }
@media (max-width: 1px) {
  .b { border: 0;
    color: color-mix(in srgb, red 1%, blue) }
}
@supports (color: color-mix(in srgb, red, blue)) { .c { color: color-mix(in srgb, var(--x) 1%, blue); } }`;
    expect(semReserva(ruim).map((c) => `${c.line} ${c.key}`)).toEqual(['2 .a | color', '5 .b | color', '7 .c | color']);
  });

  it('todo color-mix() tem uma cor sólida de reserva', () => {
    const novos = files.flatMap((file) => semReserva(read(file)).map(({ line, key }) => `${file}:${line} (${key})`));
    expect(novos, `color-mix() sem cor sólida de reserva:\n${novos.join('\n')}`).toEqual([]);
  });

  it(':focus-visible não divide a regra com outros seletores (o Safari 15.0 a 15.3 descartaria a regra inteira)', () => {
    const novos = files.flatMap((file) => (read(file).match(/[^{};]+(?=\{)/g) ?? []).filter((selector) => {
      const parts = selector.split(',');
      return parts.some((p) => p.includes(':focus-visible')) && !parts.every((p) => p.includes(':focus-visible'));
    }).map((selector) => `${file}: ${selector.trim()}`));
    expect(novos, `separe o :focus-visible numa regra própria:\n${novos.join('\n')}`).toEqual([]);
  });

  it('biblioteca pesada só entra por import() dinâmico', () => {
    const estatico = /^(?:import|export)\s+(?!type\b)(?:[^;'"()]*?\bfrom\s+)?['"](html-to-image|tesseract\.js|xlsx)['"]/m;
    for (const ruim of ["import { toPng } from 'html-to-image';", 'import {\n  a,\n} from "xlsx";', "import 'tesseract.js';"]) expect(ruim).toMatch(estatico);
    for (const ok of ["import type { WorkBook } from 'xlsx';", "export async function f() {\n  await import('tesseract.js')"]) expect(ok).not.toMatch(estatico);
    const novos = (readdirSync(path.join(ROOT, 'src'), { recursive: true }) as string[])
      .filter((f) => /\.tsx?$/.test(f) && estatico.test(read(`src/${f}`)));
    expect(novos, 'import estático de biblioteca pesada').toEqual([]);
  });

  it(':has() só nos arquivos já permitidos (o layout precisa funcionar sem ele)', () => {
    const novos = files.filter((f) => !HAS_PERMITIDO.includes(f)).flatMap((file) =>
      read(file).split('\n').flatMap((text, i) => (text.includes(':has(') ? [`${file}:${i + 1}`] : [])));
    expect(novos, `:has() em arquivo não permitido:\n${novos.join('\n')}`).toEqual([]);
  });
});
