/**
 * Leveza: o que a home baixa e se o site continua funcionando, em Chromium, Firefox e WebKit.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/leveza.cjs                 (Edge instalado; E2E_BROWSER troca o canal)
 *      node scripts/e2e/leveza.cjs firefox         (ou E2E_ENGINE=chromium|firefox|webkit)
 *      npm run e2e:motores                         (os três)
 * Firefox e WebKit precisam ser baixados uma vez, na mesma versão do playwright-core instalado:
 *   npx playwright@1.64.1 install firefox webkit
 * São as versões ATUAIS dos motores: não provam o comportamento no Firefox 115 nem no Safari 15.
 * Screenshots em scripts/e2e/out/leveza-<motor>-<tela>.png.
 */
const playwright = require('playwright-core');
const path = require('path');
const fs = require('fs');

const BASE = process.env.E2E_URL || 'http://localhost:4173';
const ENGINE = process.argv[2] || process.env.E2E_ENGINE || 'chromium';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };
const DATA_CHUNK = /\/assets\/(characters|moves|weapons|talents|artifacts|levels|sets|particles)-[\w-]{8}\.js/;

(async () => {
  if (!['chromium', 'firefox', 'webkit'].includes(ENGINE)) throw new Error(`motor desconhecido: ${ENGINE} (use chromium, firefox ou webkit)`);
  console.log(`== ${ENGINE}`);
  const browser = await playwright[ENGINE].launch(ENGINE === 'chromium' ? { channel: CHANNEL, headless: true } : { headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const errors = [];
  const requests = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
  page.on('request', (r) => requests.push(r.url()));
  const open = async (url, selector) => {
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await page.waitForSelector(selector);
    await page.waitForTimeout(1000);
  };
  const shot = (name) => page.screenshot({ path: path.join(OUT, `leveza-${ENGINE}-${name}.png`), fullPage: true });

  await open('/', '#root a');
  check('a home carrega o JS do site', requests.some((u) => /\/assets\/index-[\w-]{8}\.js/.test(u)));
  const data = requests.filter((u) => DATA_CHUNK.test(u)).map((u) => u.split('/').pop());
  check('home não baixa dados do jogo', data.length === 0, data.join(', '));
  await shot('home');

  await open('/vault', '.vt-card .pc');
  await shot('vault');
  await page.click('.vt-card [aria-haspopup="menu"]');
  check('o menu do time abre e fica por cima dos cards', await page.$eval('.dz-menu-list', (m) => [...m.querySelectorAll('.dz-menu-item')].every((item) => {
    const r = item.getBoundingClientRect();
    item.scrollIntoView({ block: 'nearest' });
    const s = item.getBoundingClientRect();
    return r.width > 0 && item.contains(document.elementFromPoint(s.x + s.width / 2, s.y + s.height / 2));
  })));

  await open('/projeto/exemplo', '.eq-card');
  await shot('equipe');

  await open('/projeto/exemplo/rotacao', '[data-testid="live-dps"]');
  const dps = await page.textContent('[data-testid="live-dps"]');
  check('a rotação do exemplo mostra o DPS 96.986', dps === '96.986', dps);
  await shot('rotacao');
  check('zero erros de página (pageerror)', errors.length === 0, errors.join(' | '));

  await browser.close();
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
