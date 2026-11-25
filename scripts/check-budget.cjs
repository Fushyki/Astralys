/**
 * Orçamento de leveza: mede em gzip o que o build gerou e compara com scripts/budget.json.
 *   npm run build && npm run budget
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const limits = JSON.parse(fs.readFileSync(path.join(__dirname, 'budget.json'), 'utf8'));

const fail = (msg) => { console.error(msg); process.exit(1); };
if (!fs.existsSync(path.join(DIST, 'index.html'))) fail('dist/ não existe. Rode "npm run build" antes.');

const gzip = (file) => zlib.gzipSync(fs.readFileSync(file)).length;
const asset = (url) => path.join(DIST, url.replace(/^\//, ''));

// (a) Rota "/": index.html, o que ele referencia em /assets e os imports estáticos desses JS (import() fica de fora).
// shortcut: o chunk lazy da tela Inicio não entra; quem confere o que "/" baixa de fato é scripts/e2e/leveza.cjs.
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const home = new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)].map((m) => asset(m[1])));
if (![...home].some((f) => f.endsWith('.js'))) fail('Nenhum chunk de entrada encontrado em dist/index.html.');
const STATIC_IMPORT = /(?:^|[;}\n])\s*(?:import|export)\s*(?:[\w$*{}\s,]*?from\s*)?["'](\.[^"']+\.(?:js|css))["']/g;
for (const file of home) { // um Set visita também o que é acrescentado durante o laço
  if (!file.endsWith('.js')) continue;
  for (const m of fs.readFileSync(file, 'utf8').matchAll(STATIC_IMPORT)) home.add(path.resolve(path.dirname(file), m[1]));
}

// (b) e (c)
const chunks = fs.readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.js'));
const dataNames = new Set(['src/data/generated', 'src/effects'].flatMap((dir) =>
  fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))));
const dataChunks = chunks.filter((f) => dataNames.has(f.replace(/-[\w-]{8}\.js$/, '')));
if (dataChunks.length === 0) fail('Nenhum chunk de dados encontrado em dist/assets (os nomes mudaram?).');
const size = (f) => gzip(path.join(DIST, 'assets', f));
const biggest = chunks.map((f) => ({ f, bytes: size(f) })).sort((a, b) => b.bytes - a.bytes)[0];

const measured = {
  rotaInicial: { label: 'JS e CSS da rota /', bytes: [gzip(path.join(DIST, 'index.html')), ...[...home].map(gzip)].reduce((a, b) => a + b, 0) },
  maiorChunk: { label: `maior chunk de JS (${biggest.f})`, bytes: biggest.bytes },
  chunksDeDados: { label: `chunks de dados (${dataChunks.length})`, bytes: dataChunks.reduce((a, f) => a + size(f), 0) },
};

const kb = (n) => `${(n / 1024).toFixed(1).replace('.', ',')} KiB (${n} bytes)`;
let over = 0;
for (const [key, { label, bytes }] of Object.entries(measured)) {
  const limit = limits[key];
  const ok = Number.isFinite(limit) && bytes <= limit;
  if (!ok) over++;
  console.log(`${ok ? 'OK     ' : 'ESTOUROU'} ${key} — ${label}: ${kb(bytes)}, limite ${Number.isFinite(limit) ? kb(limit) : 'ausente em budget.json'}`);
}
if (over) fail(`\n${over} limite(s) estourado(s). Corrija; só aumente scripts/budget.json com o motivo escrito na Issue.`);
