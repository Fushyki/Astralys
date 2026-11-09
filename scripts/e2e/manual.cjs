/**
 * Alvo "Manual" da aba Otimizar: KQM (otimizado) <-> Manual, 5 peças geradas, edição de uma peça (não vai para o inventário).
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/manual.cjs
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const BASE = process.env.E2E_URL || 'http://localhost:4173';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };

(async () => {
  const browser = await chromium.launch({ channel: process.env.E2E_BROWSER || 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message.slice(0, 200)));
  await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/projeto/exemplo/personagem/Mavuika?aba=otimizar`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ot');
  check('sem inventário o build manual já aparece', (await page.locator('.ot-seg[aria-label="Como montar o build"]').count()) === 1);
  await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle' });
  await page.setInputFiles('input[type=file]', path.join(__dirname, 'fixtures', 'otimizador.good.json'));
  await page.click('.inv-preview .dz-btn.gold');
  await page.waitForSelector('.inv-grid .inv-art');
  const n0 = await page.locator('.inv-grid .inv-art').count();
  await page.goto(`${BASE}/projeto/exemplo/personagem/Mavuika?aba=otimizar`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ot-top');
  await page.click('.ot-seg[aria-label="O que otimizar"] button:has-text("Manual")');
  await page.waitForSelector('.ot-seg[aria-label="Como montar o build"]');
  check('Manual começa em KQM automático', (await page.locator('.ot-seg[aria-label="Como montar o build"] [aria-pressed=true]').textContent()).includes('KQM'));
  await page.click('.ot-seg[aria-label="Como montar o build"] button:has-text("Manual")');
  await page.waitForSelector('.ot-manual li');
  check('geram-se 5 peças', (await page.locator('.ot-manual li .ot-art').count()) === 5 || (await page.locator('.ot-manual li').count()) === 5);
  await page.waitForTimeout(900); // salvamento automático (400 ms)
  await page.reload({ waitUntil: 'networkidle' });
  check('as peças manuais sobrevivem a reabrir o projeto', (await page.locator('.ot-manual li').count()) === 5);
  await page.locator('.ot-manual li').nth(2).locator('button:has-text("Editar")').click();
  await page.waitForSelector('.dz-dialog.aa');
  check('abre o formulário sem a opção de inventário', (await page.locator('.dz-dialog.aa button:has-text("Salvar e adicionar outro")').count()) === 0);
  await page.screenshot({ path: path.join(OUT, 'manual-form.png') });
  await page.click('.dz-dialog.aa button:has-text("Usar")');
  check('peça devolvida ao build', (await page.locator('.ot-manual li').count()) === 5);
  await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle' });
  check('nada foi salvo no inventário', (await page.locator('.inv-grid .inv-art').count()) === n0);
  await page.goto(`${BASE}/projeto/exemplo/personagem/Mavuika?aba=otimizar`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ot-manual li');
  await page.screenshot({ path: path.join(OUT, 'manual.png') });
  await page.click('.ot-seg[aria-label="Como montar o build"] button:has-text("KQM")');
  await page.waitForSelector('.ot-seg[aria-label="Como montar o build"] button:has-text("KQM")[aria-pressed=true]');
  check('volta ao KQM sem peças', (await page.locator('.ot-manual').count()) === 0);
  check('sem erros de página', problems.length === 0, problems.join(' | '));
  await browser.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})();
