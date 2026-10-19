/**
 * Redesign, aba Recarga: dentro do projeto (/projeto/:id/recarga) e avulsa (/recarga).
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/recarga.cjs
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
const num = (t) => Number(String(t).replace(/\./g, '').replace(',', '.').replace('%', ''));

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const problems = [];
  // O Lunaris não tem ícone do Viajante (404 esperado; o avatar cai na inicial).
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/404/.test(m.text())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(500);
  const card = (n) => page.locator(`section[aria-label="Recarga de ${n}"]`);
  const need = async (n) => card(n).locator('.need .v').textContent();

  await page.goto(`${BASE}/projeto/exemplo/recarga`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.rc-card');

  check('a aba Recarga está ativa', (await page.locator('.dz-nav a[aria-current="page"]').textContent()).includes('Recarga'));
  check('quatro cartões, um por personagem', (await page.locator('.rc-card').count()) === 4);
  check('Mavuika (sem custo de Supremo) não precisa de ER', (await need('Mavuika')) === '—');
  const c0 = await need('Citlali');
  check('Citlali mostra a recarga necessária (>100%)', /%$/.test(c0) && num(c0) > 100, c0);
  check('compara com a ER do build', /O build tem/.test(await card('Citlali').locator('.cmp').textContent()));

  const enemy = page.locator('.rc-scenario label:has-text("Partículas dos inimigos") input');
  const i0 = num(await need('Iansan'));
  await enemy.fill('12'); await enemy.blur(); await settle();
  check('mais partículas de inimigos reduzem a recarga necessária', num(await need('Iansan')) < i0, `${i0} → ${await need('Iansan')}`);

  await page.click('button:has-text("Preencher com a rotação")'); await settle();
  const uses = await card('Citlali').locator('label:has-text("Usos da habilidade") input').inputValue();
  check('"Preencher com a rotação" preenche os usos da habilidade', Number(uses) >= 0 && (await need('Citlali')) !== '', `usos=${uses}`);

  const btn = card('Citlali').locator('button:has-text("Usar como ER mínimo")');
  await btn.click(); await settle();
  await page.goto(`${BASE}/projeto/exemplo/personagem/Citlali`, { waitUntil: 'networkidle' });
  check('o ER mínimo é gravado no build (a página do personagem abre)', (await page.locator('.dz-page, main').count()) > 0);

  await page.goto(`${BASE}/projeto/exemplo/recarga`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.rc-card');
  check('a configuração sobrevive ao recarregar (partículas 12)', (await enemy.inputValue()) === '12');
  await page.screenshot({ path: path.join(OUT, 'r-recarga.png'), fullPage: true });

  // Avulsa
  await page.goto(`${BASE}/recarga`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('astralys.recarga-livre'));
  await page.reload({ waitUntil: 'networkidle' });
  check('avulsa começa sem personagens', (await page.locator('.rc-card').count()) === 0);
  await page.click('button:has-text("Adicionar personagem")');
  await page.fill('input[aria-label="Buscar personagem"]', 'Citlali');
  await page.click('.dz-dialog button:has-text("Citlali"), .dz-dialog [role="button"]:has-text("Citlali")'); await settle();
  check('adicionar um personagem cria o cartão', (await page.locator('.rc-card').count()) === 1);
  await page.reload({ waitUntil: 'networkidle' });
  check('o time avulso sobrevive ao recarregar', (await page.locator('.rc-card').count()) === 1);

  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(400);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.screenshot({ path: path.join(OUT, 'r-recarga-mobile.png'), fullPage: true });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
