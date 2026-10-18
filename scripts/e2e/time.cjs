/**
 * Redesign, tela Dano do time (/projeto/:id/time): KPIs do gabarito, curva acumulada, rosca, buffs, leitura rápida e ranking.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/time.cjs
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const BASE = process.env.E2E_URL || 'http://localhost:4173';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));

  await page.goto(`${BASE}/projeto/exemplo/time`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="team-dps"]');

  check('DPS do time é 216.600', (await page.textContent('[data-testid="team-dps"]')) === '216.600');
  check('dano da rotação é 3.790.496', (await page.textContent('[data-testid="team-dpr"]')) === '3.790.496');
  check('a aba "Dano do time" está ativa', (await page.locator('.dz-nav a[aria-current="page"]').textContent()).includes('Dano do time'));
  check('curva acumulada desenhada', (await page.locator('.dz-chart .curve').count()) === 1);
  const marks = await page.$$eval('.dz-chart .mark', (e) => e.map((x) => x.textContent));
  check('o Supremo da Mavuika aparece na curva com +1,24 mi', marks.some((m) => /^Q Mavuika \+1,24 mi$/.test(m)), marks.join(' | '));
  const legend = await page.$$eval('.dz-donut li .n', (e) => e.map((x) => x.textContent));
  check('rosca lista os 4 personagens', legend.length === 4 && legend[0] === 'Mavuika', legend.join(','));
  check('a Mavuika tem 95% no centro da rosca', (await page.textContent('.dz-donut .center')).startsWith('95'));
  const flagged = await page.locator('.tm-bars .dz-chip.warn').count();
  check('buffs sem origem ficam marcados como "a confirmar"', flagged >= 1, `${flagged}`);
  const read = await page.$$eval('.tm-read li', (e) => e.map((x) => x.textContent));
  check('leitura rápida tem 3 frases', read.length === 3 && /Hipercarry: Mavuika/.test(read[0]), read.join(' / '));
  const rows = await page.locator('.tm-top tbody tr').count();
  check('ranking mostra 10 golpes, o maior é o Supremo (200 FS)', rows === 10 && /Supremo \(200 FS\)/.test(await page.textContent('.tm-top tbody tr')));
  check('ações do cabeçalho: comparar e gerar card', (await page.locator('.dz-pagehead a:has-text("Comparar com outro time")').count()) === 1 && (await page.locator('.dz-pagehead a:has-text("Gerar card")').count()) === 1);
  await page.screenshot({ path: path.join(OUT, 'r-time.png'), fullPage: true });

  await page.click('.tm-top tbody tr a'); await page.waitForURL('**/rotacao');
  check('clicar num golpe do ranking abre a linha do tempo', page.url().endsWith('/projeto/exemplo/rotacao'));

  await page.goto(`${BASE}/projeto/exemplo/time`, { waitUntil: 'networkidle' });
  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(400);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.screenshot({ path: path.join(OUT, 'r-time-mobile.png'), fullPage: true });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
