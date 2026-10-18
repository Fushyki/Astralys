/**
 * Teste do cofre ("Meus projetos"): listar, importar a planilha .xlsx e um .json exportado, duplicar, renomear e apagar.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/cofre.cjs   (ou npm run e2e)
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const BASE = process.env.E2E_URL || 'http://localhost:4173';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const XLSX_FILE = path.resolve(__dirname, '../../reference/Mavuika_Iansan_Combo2.xlsx');

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(500);
  const cards = () => page.$$eval('.ast-project .name', (e) => e.map((x) => x.textContent));

  await page.goto(`${BASE}/rotacao`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.ast-project');

  check('lista começa só com o exemplo', (await cards()).length === 1 && /Exemplo/.test((await cards())[0]), (await cards()).join(' | '));
  await page.screenshot({ path: path.join(OUT, 'cofre.png') });

  // Importar a planilha
  await page.waitForTimeout(1500); // dados do jogo
  await page.setInputFiles('input[aria-label="Escolher planilha"]', XLSX_FILE);
  await page.waitForURL(/\/rotacao\/(?!exemplo)[^/]+$/, { timeout: 30000 });
  await page.waitForSelector('.ast-kpi .v', { timeout: 30000 });
  const dps = await page.$eval('.ast-kpi .v', (e) => e.textContent);
  check('importar a planilha abre o projeto e o DPS bate com a planilha', dps === '216.600', dps);
  const name = await page.textContent('.ast-title h1');
  check('o projeto leva o nome do arquivo', /Mavuika_Iansan_Combo2/i.test(name), name);
  const importedUrl = page.url();

  // Voltar ao cofre
  await page.click('a:has-text("Meus projetos")'); await page.waitForSelector('.ast-project');
  check('o projeto importado aparece na lista', (await cards()).length === 2, (await cards()).join(' | '));

  // Duplicar
  await page.click('.ast-project:has-text("Mavuika_Iansan_Combo2") button:has-text("Duplicar")'); await settle();
  check('duplicar cria uma cópia', (await cards()).length === 3 && (await cards()).some((n) => /cópia/.test(n)), (await cards()).join(' | '));

  // Renomear
  await page.click('.ast-project:has-text("cópia") button:has-text("Renomear")');
  await page.fill('.ast-project input[aria-label="Novo nome do projeto"]', 'Minha rotação');
  await page.keyboard.press('Enter'); await settle();
  check('renomear', (await cards()).includes('Minha rotação'), (await cards()).join(' | '));

  // Exportar e reimportar o JSON
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('.ast-project:has-text("Minha rotação") button:has-text("Exportar")'),
  ]);
  const file = path.join(OUT, 'exportado.json');
  await download.saveAs(file);
  check('exportar baixa um .astralys.json', /\.astralys\.json$/.test(download.suggestedFilename()), download.suggestedFilename());
  await page.setInputFiles('input[aria-label="Escolher projeto"]', file);
  await page.waitForURL(/\/rotacao\/(?!exemplo)[^/]+$/, { timeout: 30000 });
  await page.waitForSelector('.ast-kpi .v', { timeout: 30000 });
  check('reimportar o JSON reproduz o mesmo DPS', (await page.$eval('.ast-kpi .v', (e) => e.textContent)) === '216.600');

  // Arquivo inválido
  await page.goto(`${BASE}/rotacao`, { waitUntil: 'networkidle' }); await page.waitForSelector('.ast-project');
  const bad = path.join(OUT, 'invalido.json');
  fs.writeFileSync(bad, '{ não é json');
  await page.setInputFiles('input[aria-label="Escolher projeto"]', bad); await settle();
  const err = await page.$eval('[role="alert"]', (e) => e.textContent).catch(() => '');
  check('arquivo inválido mostra um erro claro e não quebra', /JSON válido/.test(err), err);

  // Apagar (com confirmação)
  const before = (await cards()).length;
  await page.click('.ast-project:has-text("Minha rotação") button:has-text("Apagar")');
  check('apagar pede confirmação', (await cards()).length === before);
  await page.click('.ast-project:has-text("Minha rotação") button:has-text("Sim")'); await settle();
  check('apagar remove da lista', (await cards()).length === before - 1);

  // Persistência
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.ast-project');
  check('a lista sobrevive ao recarregar', (await cards()).length === before - 1);
  await page.goto(importedUrl, { waitUntil: 'networkidle' }); await page.waitForSelector('.ast-kpi .v');
  check('o projeto importado reabre pelo endereço', (await page.$eval('.ast-kpi .v', (e) => e.textContent)) === '216.600');

  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto(`${BASE}/rotacao`, { waitUntil: 'networkidle' }); await page.waitForSelector('.ast-project');
  check('móvel sem scroll horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
