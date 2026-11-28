/**
 * Leveza: o que a home e o time de exemplo baixam (`dadosDoExemplo` em budget.json) e se o site continua funcionando, em
 * Chromium, Firefox e WebKit.
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
const zlib = require('zlib');

const BASE = process.env.E2E_URL || 'http://localhost:4173';
const ENGINE = process.argv[2] || process.env.E2E_ENGINE || 'chromium';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };
const DATA_CHUNK = /\/assets\/dados-[^/]+\.js/;

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

  // Modo leve: ligado, nada se mexe na home; desligado, o céu segue animado (prova que a conta enxerga as animações).
  const home = async (modo, nome) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    await context.addInitScript((m) => localStorage.setItem('astralys:config:modoleve', m), modo);
    const p = await context.newPage();
    p.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    await p.waitForSelector('.in-sky i');
    await p.waitForTimeout(1000);
    const state = await p.evaluate(() => ({
      leve: document.documentElement.dataset.leve === 'true',
      animacoes: document.getAnimations().length,
      estrelas: [...document.querySelectorAll('.in-sky i')].filter((i) => getComputedStyle(i).display !== 'none').length,
    }));
    await p.screenshot({ path: path.join(OUT, `leveza-${ENGINE}-home-${nome}.png`), fullPage: true });
    await context.close();
    return state;
  };
  const com = await home('on', 'com-modo-leve');
  check('modo leve: nenhuma animação rodando na /', com.leve && com.animacoes === 0, JSON.stringify(com));
  const sem = await home('off', 'sem-modo-leve');
  check('sem o modo leve o céu segue animado e com todas as estrelas', !sem.leve && sem.animacoes > 0 && com.estrelas > 0 && com.estrelas < sem.estrelas / 2, JSON.stringify(sem));

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

  // Visita nova (sem cache): tudo o que é dado do jogo, com o índice dos arquivos, em gzip como no `npm run budget`.
  const first = await (await browser.newContext()).newPage();
  const chunks = [];
  first.on('response', (r) => { if (DATA_CHUNK.test(r.url())) chunks.push(r.body().then((b) => zlib.gzipSync(b).length)); });
  await first.goto(BASE + '/projeto/exemplo', { waitUntil: 'networkidle' });
  await first.waitForSelector('.eq-card');
  await first.waitForTimeout(1000);
  const bytes = (await Promise.all(chunks)).reduce((a, b) => a + b, 0);
  const limit = require('../budget.json').dadosDoExemplo;
  check('dados ao abrir /projeto/exemplo dentro do orçamento', chunks.length > 0 && bytes <= limit, `${bytes} bytes em ${chunks.length} arquivos, limite ${limit}`);
  await first.context().close();

  await open('/projeto/exemplo/rotacao', '[data-testid="live-dps"]');
  const dps = await page.textContent('[data-testid="live-dps"]');
  check('a rotação do exemplo mostra o DPS 152.153', dps === '152.153', dps);
  await shot('rotacao');
  check('zero erros de página (pageerror)', errors.length === 0, errors.join(' | '));

  await browser.close();
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
