/**
 * Teste da calculadora de recarga: valores, edição, ligação com o build e persistência.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/recarga.cjs   (ou npm run e2e)
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
  const settle = () => page.waitForTimeout(600);
  const card = (n) => page.locator(`.ast-ecard[aria-label="Recarga de ${n}"]`);
  const need = async (n) => card(n).locator('.need .v').textContent();
  const num = (t) => Number(t.replace('%', '').replace(/\./g, '').replace(',', '.'));

  await page.goto(`${BASE}/rotacao/exemplo`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.ast-kpi .v');
  await page.click('a:has-text("Recarga (ER)")');
  await page.waitForSelector('.ast-ecard'); await page.waitForTimeout(1500);

  check('quatro personagens da equipe aparecem', (await page.$$('.ast-ecard')).length === 4);
  check('Mavuika (sem custo de Supremo) não precisa de ER', (await need('Mavuika')) === '—');
  const citlali0 = await need('Citlali');
  check('Citlali mostra a recarga necessária', /%$/.test(citlali0) && num(citlali0) > 100, citlali0);
  check('compara com a ER do build', /O build tem/.test(await card('Citlali').locator('.cmp').textContent()));

  // Editar a energia fixa reduz a necessária
  const flat = card('Citlali').locator('label.ast-field:has(span:text-is("Energia fixa")) input');
  await flat.fill('30'); await flat.blur(); await settle();
  const citlali1 = await need('Citlali');
  check('energia fixa reduz a recarga necessária', num(citlali1) < num(citlali0), `${citlali0} → ${citlali1}`);

  // Mais partículas de inimigos reduz para todos
  const enemy = page.locator('label.ast-field:has(span:text-is("Partículas dos inimigos")) input');
  const iansan0 = await need('Iansan');
  await enemy.fill('12'); await enemy.blur(); await settle();
  check('mais partículas de inimigos reduzem a recarga de todos', num(await need('Iansan')) < num(iansan0), `${iansan0} → ${await need('Iansan')}`);

  // Folga
  await page.selectOption('select[aria-label="Folga sobre a recarga necessária"]', 'high'); await settle();
  const iansanHigh = num(await need('Iansan'));
  await page.selectOption('select[aria-label="Folga sobre a recarga necessária"]', 'low'); await settle();
  check('a folga alta pede mais recarga que a baixa', iansanHigh > num(await need('Iansan')));
  await page.selectOption('select[aria-label="Folga sobre a recarga necessária"]', 'medium'); await settle();

  // Marcar ninguém em campo: tudo fora de campo, mais ER necessária
  const bennett0 = num(await need('Bennett'));
  await card('Bennett').locator('fieldset label:has-text("Bennett") input').uncheck(); await settle();
  check('sem ninguém em campo a recarga necessária sobe', num(await need('Bennett')) > bennett0);
  await card('Bennett').locator('fieldset label:has-text("Bennett") input').check(); await settle();

  // Volta a valores que não saturam em 100% para os testes seguintes
  await flat.fill('5'); await flat.blur(); await enemy.fill('8'); await enemy.blur(); await settle();
  check('os valores de teste não saturam em 100%', num(await need('Citlali')) > 110, await need('Citlali'));

  // Persistência
  const citlaliBefore = num(await need('Citlali'));
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.ast-ecard'); await page.waitForTimeout(1200);
  check('a configuração sobrevive ao recarregar', Math.abs(num(await need('Citlali')) - citlaliBefore) < 0.05, `${citlaliBefore} → ${num(await need('Citlali'))}`);
  check('o valor das partículas dos inimigos foi mantido', (await enemy.inputValue()) === '8');

  // Usar como ER mínimo -> aparece no build
  const target = num(await need('Citlali'));
  await card('Citlali').locator('button:has-text("Usar como ER mínimo")').click(); await settle();
  await page.click('a:has-text("Voltar ao editor")'); await page.waitForSelector('.ast-kpi .v');
  await page.click('.ast-slot-main:has-text("Citlali")'); await settle();
  const minEr = Number((await page.locator('label.ast-field:has(span:text-is("ER mín.")) input').inputValue()).replace(',', '.'));
  check('o ER mínimo do build recebe o valor calculado', Math.abs(minEr - target) < 0.2, `${minEr} vs ${target}`);
  await page.screenshot({ path: path.join(OUT, 'recarga-build.png') });

  await page.goto(`${BASE}/rotacao/exemplo/recarga`, { waitUntil: 'networkidle' }); await page.waitForSelector('.ast-ecard');
  await page.setViewportSize({ width: 400, height: 800 }); await page.waitForTimeout(400);
  check('móvel sem scroll horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
