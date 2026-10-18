/**
 * Teste da importação do inventário GOOD: importar, aplicar o build real e avisos.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/good.cjs   (ou npm run e2e)
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const BASE = process.env.E2E_URL || 'http://localhost:4173';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const FIXTURE = path.join(__dirname, 'fixtures', 'inventario.good.json');

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(900);
  const field = (label) => page.locator(`label.ast-field:has(span:text-is("${label}"))`);

  await page.goto(`${BASE}/rotacao/exemplo`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.ast-good');

  check('sem inventário, o painel oferece a importação', (await page.locator('.ast-good button:has-text("Importar inventário GOOD")').count()) === 1);

  // Arquivo inválido
  const bad = path.join(OUT, 'nao-e-good.json');
  fs.writeFileSync(bad, JSON.stringify({ characters: [] }));
  await page.setInputFiles('input[aria-label="Escolher inventário GOOD"]', bad); await settle();
  check('arquivo que não é GOOD mostra erro claro', /não é um inventário GOOD/.test(await page.textContent('.ast-good [role="alert"]')));

  // Importar
  await page.setInputFiles('input[aria-label="Escolher inventário GOOD"]', FIXTURE); await settle();
  const summary = await page.textContent('.ast-good .summary');
  check('mostra o resumo do inventário', /1 personagens, 1 armas e 5 artefatos/.test(summary), summary);

  // Selecionar a Citlali (fora do inventário): botão desativado
  await page.click('.ast-slot-main:has-text("Citlali")'); await settle();
  check('personagem fora do inventário não pode ser aplicado', await page.locator('.ast-good button:has-text("Aplicar o build de Citlali")').isDisabled());

  // Aplicar na Mavuika
  await page.click('.ast-slot-main:has-text("Mavuika")'); await settle();
  await page.click('.ast-good button:has-text("Aplicar o build de Mavuika")'); await page.waitForTimeout(1500);
  const notes = await page.$$eval('.ast-good .notes li', (e) => e.map((x) => x.textContent));
  check('avisa que o build foi aplicado e os limites da importação', /Build de Mavuika aplicado/.test(notes[0] ?? '') && notes.some((n) => /nível da arma/.test(n)), notes[0]);

  const manual = await page.locator('input[name="rolls-0"]').nth(1).isChecked();
  check('o build passa ao modo manual com os rolls reais', manual);
  const crRolls = Number((await field('Taxa Crítica (máx. 30)').locator('input').inputValue().catch(() => '')).replace(',', '.'));
  // 23,7% de Taxa Crítica em substats ÷ 3,3% por roll = 7,18 rolls
  check('os rolls de Taxa Crítica são fracionários (23,7% ÷ 3,3% = 7,18)', Math.abs(crRolls - 7.182) < 0.01, String(crRolls));
  const critStat = await page.$eval('.ast-statbox', (e) => e.textContent);
  check('o painel de stats mostra o build novo', /Taxa Crítica/.test(critStat.replace('í', 'i')) || /Taxa Crítica/.test(critStat));
  const talents = [await field('Normal').locator('input').inputValue(), await field('Habilidade').locator('input').inputValue(), await field('Supremo').locator('input').inputValue()];
  check('os níveis de talento vêm do inventário (9/8/7)', talents.join('/') === '9/8/7', talents.join('/'));
  await page.screenshot({ path: path.join(OUT, 'good.png'), fullPage: false });

  // Persistência do inventário
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.ast-good');
  check('o inventário fica guardado ao recarregar', /5 artefatos/.test(await page.textContent('.ast-good .summary')));

  // Remover
  await page.click('.ast-good button:has-text("Remover o inventário")'); await settle();
  check('remover o inventário volta à importação', (await page.locator('.ast-good button:has-text("Importar inventário GOOD")').count()) === 1);

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
