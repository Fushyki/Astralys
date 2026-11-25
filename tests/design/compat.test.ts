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

/** Declarações com color-mix() sem a mesma propriedade, sem color-mix, logo antes na mesma regra. */
function semReserva(css: string): { line: number; key: string }[] {
  const found: { line: number; key: string }[] = [];
  const blocks: { selector: string; prev?: { prop: string; value: string } }[] = [];
  let buf = '', start = 0, line = 1, parens = 0, quote = '';
  const flush = () => {
    const block = blocks[blocks.length - 1];
    const colon = buf.indexOf(':');
    if (block && colon > 0) {
      const prop = buf.slice(0, colon).trim();
      const value = buf.slice(colon + 1).trim();
      const covered = block.prev?.prop === prop && !block.prev.value.includes('color-mix(');
      // Vários color-mix seguidos não se cobrem: a reserva tem de ser a declaração imediatamente anterior.
      if (value.includes('color-mix(') && !covered) found.push({ line: start, key: `${block.selector} | ${prop}` });
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

/** Casos que já existiam: `arquivo | seletor | propriedade`. NÃO acrescente nada aqui; o Prompt 3 zera a lista. */
const PENDENTES: string[] = [
  `src/design/design.css | .dz-btn.ghost:hover:not(:disabled) | background`,
  `src/design/design.css | .dz-chip.tone | border-color`,
  `src/design/design.css | .dz-chip.tone | background`,
  `src/design/design.css | .dz-table tr[data-current="true"] td | background`,
  `src/design/design.css | :root[data-card-bg='color'] .vt-poster .pc | background`,
  `src/design/design.css | .dz-toast | border`,
  `src/design/design.css | .dz-toast.error | border-color`,
  `src/design/filtros.css | .fx-chip[aria-pressed='true'], .fx-chip.static[data-on='true'] | border-color`,
  `src/design/filtros.css | .fx-chip[aria-pressed='true'], .fx-chip.static[data-on='true'] | background`,
  `src/design/filtros.css | .fx-wide[aria-pressed='true'] | background`,
  `src/screens/armas.css | .ar-member[aria-selected="true"] | background`,
  `src/screens/equipe.css | .eq-buffs .bcard[data-active='true'] | border-color`,
  `src/screens/equipe.css | .eq-buffs .bcard[data-active='true'] | background`,
  `src/screens/equipe.css | .eq-buffs .bc-note | background`,
  `src/screens/equipe.css | .eq-buffs .bc-note | border`,
  `src/screens/inicio/origem.css | .or-demo | background`,
  `src/screens/inventario.css | .aa-note | background`,
  `src/screens/inventario.css | .aa-note | border`,
  `src/screens/otimizador.css | .ot-chip[aria-pressed='true'] | background`,
  `src/screens/otimizador.css | .mp-card:hover | background`,
  `src/screens/otimizador.css | .oa-art | background`,
  `src/screens/otimizador.css | .oa-art .elem | background`,
  `src/screens/personagem.css | .pp-portrait | background`,
  `src/screens/personagem.css | .sc-art | border`,
  `src/screens/personagem.css | .sc-art .art | background`,
  `src/screens/personagem.css | .sc-art .elem | background`,
  `src/screens/personagem.css | .sc-art .elem | border`,
  `src/screens/personagem.css | .cm-node[data-lit="true"] .halo | fill`,
  `src/screens/personagem.css | .cm-node[data-lit="true"] .halo | stroke`,
  `src/screens/personagem.css | .sc-talents .ring:focus-within | box-shadow`,
  `src/screens/personagem.css | .sr .stars i[data-k="on"] | text-shadow`,
  `src/screens/personagem.css | .sr .stars i[data-k="half"] | color`,
  `src/screens/personagens.css | .pe-card | background`,
  `src/screens/recarga.css | .dz-panel.rc-card | background`,
  `src/screens/recarga.css | .rc-saves | border-color`,
  `src/screens/recarga.css | .rc-saved | border`,
  `src/screens/talentos.css | .tl-infusion | border`,
  `src/screens/vault.css | .vt-plus | border`,
  `src/screens/vault.css | .vt-plus | background`,
  `src/screens/vault.css | .vt-plus | box-shadow`,
  `src/screens/vault.css | .vt-plus:hover, .vt-plus:focus-visible | box-shadow`,
  `src/screens/vault.css | .vt-opt | background`,
  `src/screens/vault.css | .vt-opt:hover:not(:disabled), .vt-opt:focus-within | border-color`,
  `src/screens/vault.css | .vt-opt:hover:not(:disabled), .vt-opt:focus-within | background`,
  `src/screens/vault.css | .vt-opt i | border`,
  `src/screens/vault.css | .vt-opt i | background`,
  `src/screens/vault.css | .vt-opt.gold | border-color`,
  `src/screens/vault.css | .vt-opt.gold | background`,
];

/** Arquivos que já usavam `:has(`. É só melhoria: o layout precisa funcionar sem ele. */
const HAS_PERMITIDO = [
  'src/screens/cardpage.css',
  'src/screens/comparar.css',
  'src/screens/personagem.css',
  'src/screens/recarga.css',
  'src/screens/vault.css',
];

describe('compatibilidade do CSS', () => {
  it('o detector pega color-mix sem cor sólida antes', () => {
    const css = `/* x */\n.a { color: red; color: color-mix(in srgb, red 1%, blue); }\n@media (max-width: 1px) {\n  .b { color: red; border: 0;\n    color: color-mix(in srgb, red 1%, blue) }\n}`;
    expect(semReserva(css)).toEqual([{ line: 5, key: '.b | color' }]);
  });

  it('todo color-mix() novo tem uma cor sólida antes, na mesma regra', () => {
    const pending = [...PENDENTES];
    const novos = files.flatMap((file) => semReserva(read(file)).flatMap(({ line, key }) => {
      const i = pending.indexOf(`${file} | ${key}`); // cada pendência vale para um caso só
      if (i < 0) return [`${file}:${line} (${key})`];
      pending.splice(i, 1);
      return [];
    }));
    expect(novos, `color-mix() sem cor sólida antes:\n${novos.join('\n')}`).toEqual([]);
  });

  it(':has() só nos arquivos já permitidos (o layout precisa funcionar sem ele)', () => {
    const novos = files.filter((f) => !HAS_PERMITIDO.includes(f)).flatMap((file) =>
      read(file).split('\n').flatMap((text, i) => (text.includes(':has(') ? [`${file}:${i + 1}`] : [])));
    expect(novos, `:has() em arquivo não permitido:\n${novos.join('\n')}`).toEqual([]);
  });
});
