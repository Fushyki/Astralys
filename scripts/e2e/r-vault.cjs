/**
 * Redesign, Vault (/vault): cartões dos times, números do gabarito, busca/filtros, favoritos, duplicar, apagar.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/r-vault.cjs
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
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/404/.test(m.text())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(500);
  const cards = () => page.locator('.vt-card');

  await page.goto(`${BASE}/vault`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.vt-card');

  check('a aba Vault está ativa', (await page.locator('.dz-nav a[aria-current="page"]').textContent()).includes('Vault'));
  check('começa só com o exemplo', (await cards().count()) === 1 && (await cards().first().textContent()).includes('exemplo'));
  await page.waitForFunction(() => /DPS/.test(document.querySelector('.vt-kp')?.textContent ?? ''), null, { timeout: 30000 });
  check('o cartão mostra DPS e DPR do exemplo (216,6 mil e 3,79 mi)', /216[,.]6/.test(await page.textContent('.vt-kp')) && /3[,.]79/.test(await page.textContent('.vt-kp')), (await page.textContent('.vt-kp')).trim());
  check('4 retratos e a barra de participação', (await page.locator('.vt-faces .dz-avatar').count()) === 4 && (await page.locator('.dz-stack').count()) === 1);

  // Novo time -> editor -> volta
  await page.click('button:has-text("Novo time")');
  await page.waitForURL('**/projeto/**');
  check('"Novo time" abre o projeto novo', /\/projeto\/[^/]+$/.test(page.url()) && !page.url().endsWith('/exemplo'));
  await page.waitForSelector('.dz-pagehead');
  await page.click('.dz-header button:has-text("Salvar no Vault")');
  await page.waitForURL('**/vault');
  await page.waitForSelector('.vt-card');
  check('"Salvar no Vault" favorita e leva ao Vault', (await cards().count()) === 2 && (await page.locator('.vt-fav[aria-pressed="true"]').count()) === 1);
  check('o favorito vem primeiro', (await cards().first().locator('.vt-fav[aria-pressed="true"]').count()) === 1);

  // Filtros
  await page.fill('input[aria-label="Buscar times"]', 'zzzz');
  check('busca sem resultado mostra o estado vazio', (await page.locator('.vt-empty').count()) === 1);
  await page.click('button:has-text("Limpar filtros")');
  await page.selectOption('select[aria-label="Elemento"]', 'Cryo');
  check('filtrar por elemento Cryo mantém os times com Citlali', (await cards().count()) === 2);
  await page.selectOption('select[aria-label="Elemento"]', 'Dendro');
  check('filtrar por elemento sem time mostra vazio', (await page.locator('.vt-empty').count()) === 1);
  await page.click('button:has-text("Limpar filtros")');
  await page.click('button:has-text("Favoritos")');
  check('só favoritos mostra 1', (await cards().count()) === 1);
  await page.click('button:has-text("Favoritos")');

  // Duplicar, renomear, apagar
  await cards().first().locator('button:has-text("Duplicar")').click(); await settle();
  check('duplicar cria outro cartão', (await cards().count()) === 3);
  const before = await cards().count();
  await cards().first().locator('button:has-text("Apagar")').click();
  await cards().first().locator('button:has-text("Sim")').click(); await settle();
  check('apagar remove o cartão', (await cards().count()) === before - 1);

  await page.screenshot({ path: path.join(OUT, 'r-vault.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(400);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.screenshot({ path: path.join(OUT, 'r-vault-mobile.png'), fullPage: true });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
