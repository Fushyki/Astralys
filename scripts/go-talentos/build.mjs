// Gera src/vendor/go/talentos.js a partir de um clone do Genshin Optimizer (MIT).
//   git clone --depth 1 --filter=blob:none --sparse https://github.com/frzyc/genshin-optimizer.git go
//   git -C go sparse-checkout set libs/gi libs/common libs/pando libs/game-opt
//   node scripts/go-talentos/build.mjs <caminho do clone>
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const go = path.resolve(process.argv[2] ?? '');
const CHARS = ['Illuga', 'Zibai'];
const paths = JSON.parse(readFileSync(path.join(go, 'tsconfig.base.json'), 'utf8')).compilerOptions.paths;
const UI = /^@genshin-optimizer\/(common\/(ui|svgicons)|gi\/(i18n|svgicons|assets|ui|db-ui|theme|char-cards|formula-ui))($|\/)/;
const readJson = (rel) => JSON.parse(readFileSync(path.join(go, rel), 'utf8'));

// Nomes em português: os do jogo vêm do GO; as condições escritas pela equipe do GO só existem em inglês.
const OURS = JSON.parse(readFileSync(new URL('./pt.json', import.meta.url), 'utf8'));
const dm = 'libs/gi/dm-localization/assets/locales/pt';
const locale = {
  sheet: readJson('libs/gi/localization/assets/locales/pt/sheet.json'),
  sheet_gen: readJson(`${dm}/sheet_gen.json`),
  statKey_gen: readJson(`${dm}/statKey_gen.json`),
  extra: OURS.extra,
};
for (const c of CHARS) {
  const gen = readJson(`${dm}/char_${c}_gen.json`);
  // Só o que a tela usa: nomes dos talentos e dos números.
  locale[`char_${c}_gen`] = Object.fromEntries(Object.entries(gen).filter(([, v]) => v && typeof v === 'object').map(([k, v]) => [k, { name: v.name, skillParams: v.skillParams, fields: v.fields }]));
  const en = readJson(`libs/gi/localization/assets/locales/en/char_${c}.json`);
  const missing = Object.keys(en).filter((k) => !OURS.chars[c]?.[k]);
  if (missing.length) throw new Error(`pt.json sem tradução de ${c}: ${missing.join(', ')}`);
  locale[`char_${c}`] = OURS.chars[c];
}

const plugin = {
  name: 'go',
  setup(b) {
    b.onResolve({ filter: /^go-locale$/ }, () => ({ path: 'go-locale', namespace: 'locale' }));
    b.onLoad({ filter: /.*/, namespace: 'locale' }, () => ({ contents: JSON.stringify(locale), loader: 'json' }));
    b.onResolve({ filter: /jsx-runtime$/ }, () => ({ path: 'jsx', namespace: 'jsx' }));
    b.onLoad({ filter: /.*/, namespace: 'jsx' }, () => ({ contents: 'export const jsx = (type, props) => ({ props }); export const jsxs = jsx; export const Fragment = "";' }));
    b.onResolve({ filter: /^[^./]/ }, (a) => {
      if (a.kind === 'entry-point' || path.isAbsolute(a.path)) return;
      // `.../sheets/../X` aponta para libs/gi/sheets/src/X sem carregar o índice (que puxa todas as fichas).
      const direct = /^@genshin-optimizer\/gi\/sheets\/\.\.\/(.+)$/.exec(a.path);
      if (direct) {
        const base = path.join(go, 'libs/gi/sheets/src', direct[1]);
        return { path: direct[1] === 'Resonance' ? `${base}.tsx` : path.join(base, 'index.tsx') };
      }
      const target = paths[a.path]?.[0];
      if (target && !UI.test(a.path)) return { path: path.resolve(go, target) };
      return { path: a.path, namespace: 'stub' };
    });
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: `const s = new Proxy(function () {}, {
        get: (t, p) => p === 'prototype' ? t.prototype : p === Symbol.toPrimitive ? () => '' : p === '__esModule' ? false : s,
        apply: () => s, construct: () => s, getPrototypeOf: () => proto });
      const proto = new Proxy(Function.prototype, { get: (t, p) => typeof p === 'symbol' ? t[p] : s });
      module.exports = s;`,
    }));
    // Dados do jogo só dos personagens empacotados (o arquivo inteiro passa de 900 KB).
    b.onLoad({ filter: /allStat_gen\.json$/ }, (a) => {
      const all = JSON.parse(readFileSync(a.path, 'utf8'));
      const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k]).map((k) => [k, o[k]]));
      // Nicole: o motor do GO lê os parâmetros dela ao carregar.
      all.char.data = pick(all.char.data, [...CHARS, 'Nicole']);
      all.char.skillParam = pick(all.char.skillParam, [...CHARS, 'Nicole']);

      all.material = {};
      return { contents: JSON.stringify(all), loader: 'json' };
    });
  },
};

const commit = execFileSync('git', ['-C', go, 'rev-parse', '--short', 'HEAD']).toString().trim();
await esbuild.build({
  entryPoints: [new URL('./adapter.ts', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')],
  outfile: 'src/vendor/go/talentos.js', bundle: true, format: 'esm', platform: 'browser', target: ['chrome109', 'firefox115', 'safari15'],
  jsx: 'automatic', minify: true, legalComments: 'none', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [plugin], logLevel: 'warning',
  banner: { js: `// Gerado por scripts/go-talentos/build.mjs a partir do Genshin Optimizer ${commit} (MIT, ver THIRD_PARTY_NOTICES.md). Não editar.` },
});
console.log(`talentos.js: ${(readFileSync('src/vendor/go/talentos.js').length / 1024).toFixed(0)} KB (GO ${commit}; ${CHARS.join(', ')})`);
