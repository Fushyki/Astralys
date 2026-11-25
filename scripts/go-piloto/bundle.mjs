// Piloto (#40): empacota o motor e fichas do Genshin Optimizer sem a interface. Uso: node bundle.mjs <clone do GO> <entrada> <saida> [esbuild de]
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const [go, entry, outfile, nodeModulesFrom = process.cwd()] = process.argv.slice(2);
const esbuild = createRequire(path.resolve(nodeModulesFrom, 'package.json'))('esbuild');
const paths = JSON.parse(readFileSync(path.join(go, 'tsconfig.base.json'), 'utf8')).compilerOptions.paths;
const UI = /^@genshin-optimizer\/(common\/(ui|svgicons)|gi\/(i18n|svgicons|assets|ui|db-ui|theme|char-cards|formula-ui))($|\/)/;
const stubbed = new Set();

const plugin = {
  name: 'go',
  setup(b) {
    b.onResolve({ filter: /^[^./]/ }, (a) => {
      if (a.kind === 'entry-point' || path.isAbsolute(a.path)) return;
      const target = paths[a.path]?.[0];
      if (target && !UI.test(a.path)) return { path: path.resolve(go, target) };
      stubbed.add(a.path);
      return { path: a.path, namespace: 'stub' };
    });
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: `const s = new Proxy(function () {}, {
        get: (t, p) => p === 'prototype' ? t.prototype : p === Symbol.toPrimitive ? () => '' : p === '__esModule' ? false : s,
        apply: () => s, construct: () => s, getPrototypeOf: () => proto });
      const proto = new Proxy(Function.prototype, { get: (t, p) => typeof p === 'symbol' ? t[p] : s });
      module.exports = s;`,
    }));
  },
};

if (!existsSync(entry)) throw new Error(`Sem entrada: ${entry}`);
const r = await esbuild.build({ entryPoints: [path.resolve(entry)], outfile, bundle: true, platform: 'node', format: 'cjs',
  jsx: 'automatic', minify: process.env.MIN === '1', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [plugin], metafile: true, logLevel: 'warning' });
console.log('stubs:', [...stubbed].join(', '));
const bytes = {};
for (const [f, v] of Object.entries(Object.values(r.metafile.outputs)[0].inputs)) {
  const k = /allStat_gen\.json/.test(f) ? 'dados (allStat_gen)' : /sheets\/src\/Characters/.test(f) ? 'fichas de personagem' : /sheets\/src\/(Weapons|Artifacts)/.test(f) ? 'fichas de arma/set' : 'motor e apoio';
  bytes[k] = (bytes[k] ?? 0) + v.bytesInOutput;
}
console.log('bytes:', JSON.stringify(bytes));
