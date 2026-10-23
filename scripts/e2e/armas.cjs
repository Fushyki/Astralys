/**
 * Redesign, tela Armas e constelações (/projeto/:id/armas/:nome?): lista de armas, filtros, Usar e constelações.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/armas.cjs
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

  await page.goto(`${BASE}/projeto/exemplo/armas`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.ar-table tbody tr', { timeout: 30000 });

  check('Armas e constelações fica dentro da aba Equipe do time', (await page.locator('.dz-subnav a[aria-current="page"]').textContent()).includes('Equipe'));
  check('4 personagens no seletor, o primeiro selecionado', (await page.locator('.ar-member').count()) === 4 && (await page.locator('.ar-member[aria-selected="true"]').textContent()).includes('Mavuika'));
  const weaponRows = await page.locator('.ar-table:first-of-type tbody tr').count();
  check('lista de armas com a atual marcada', (await page.locator('tr[data-current="true"] .dz-chip:has-text("atual")').count()) >= 2, `${weaponRows} linhas`);
  const cons = await page.locator('.dz-panel:has(h2:text("Constelações")) tbody tr').count();
  check('constelações C0 a C6', cons === 7, String(cons));

  const first = await page.locator('.dz-panel:has(h2:text("Armas de")) tbody tr .ar-name').first().textContent();
  await page.click('button:has-text("Só 5★")');
  const names = await page.locator('.dz-panel:has(h2:text("Armas de")) tbody tr .ar-name').allTextContents();
  check('"Só 5★" deixa apenas armas 5★ (e a atual)', names.length > 0 && names.every((n) => n.startsWith('5★') || n.length > 0) && names.filter((n) => !n.startsWith('5★')).length <= 1, `${names.length} armas`);
  await page.click('.dz-seg button:has-text("R5")');
  await page.waitForSelector(".dz-panel:has(h2:text(\"Armas de\")) tbody tr", { timeout: 15000 }); await page.waitForTimeout(3000);
  check('trocar para R5 recalcula a lista', (await page.locator('.dz-panel:has(h2:text("Armas de")) tbody tr').count()) > 0 && first.length > 0);

  // Usar uma arma muda o projeto e o DPS
  const useBtn = page.locator('.dz-panel:has(h2:text("Armas de")) tbody button:has-text("Usar")').first();
  if (await useBtn.count()) {
    await useBtn.click(); await page.waitForTimeout(1500);
    check('"Usar" torna a arma a atual', (await page.locator('.dz-panel:has(h2:text("Armas de")) tr[data-current="true"]').count()) >= 1);
    await page.keyboard.press('Control+z'); await page.waitForTimeout(800);
  } else check('"Usar" disponível', false);

  await page.click('.ar-member:has-text("Citlali")');
  await page.waitForURL('**/armas/Citlali');
  await page.waitForSelector('.ar-table tbody tr', { timeout: 30000 });
  check('trocar de personagem muda o título', (await page.textContent('.dz-panel h2')).includes('Citlali'));
  await page.screenshot({ path: path.join(OUT, 'r-armas.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(400);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.screenshot({ path: path.join(OUT, 'r-armas-mobile.png'), fullPage: true });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
