/**
 * Leveza: o que a home baixa e se o site continua funcionando.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/leveza.cjs
 */
const { chromium } = require('playwright-core');

const BASE = process.env.E2E_URL || 'http://localhost:4173';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };
/** Falha conhecida, com Issue aberta: aparece no relatório mas não derruba o roteiro. */
const expectedFail = (issue, name, ok, extra = '') => {
  if (ok) return check(`${name} (já passa: troque por check() e feche a Issue #${issue})`, true);
  console.log(`ESPERADO FALHAR (Issue #${issue}) ${name}${extra ? ' — ' + extra : ''}`);
};
const DATA_CHUNK = /\/assets\/(characters|moves|weapons|talents|artifacts|levels|sets|particles)-[\w-]{8}\.js/;

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const errors = [];
  const requests = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
  page.on('request', (r) => requests.push(r.url()));

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#root > *');
  await page.waitForTimeout(1000);
  check('a home carrega o JS do site', requests.some((u) => /\/assets\/index-[\w-]{8}\.js/.test(u)));
  const data = requests.filter((u) => DATA_CHUNK.test(u)).map((u) => u.split('/').pop());
  expectedFail(37, 'home não baixa dados do jogo', data.length === 0, data.join(', '));

  await page.goto(`${BASE}/projeto/exemplo/rotacao`, { waitUntil: 'networkidle' });
  const dps = await page.textContent('[data-testid="live-dps"]');
  check('a rotação do exemplo mostra o DPS 96.986', dps === '96.986', dps);
  check('zero erros de página (pageerror)', errors.length === 0, errors.join(' | '));

  await browser.close();
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
