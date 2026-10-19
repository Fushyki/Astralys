/**
 * Redesign, importar/exportar e navegação: planilha .xlsx e .json no Vault, arquivo inválido, home, redirects das rotas antigas e Comparar.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/importar.cjs
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
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true })).newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/404/.test(m.text())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(500);
  const names = () => page.$$eval('.vt-card .name', (e) => e.map((x) => x.textContent));
  const dps = () => page.waitForSelector('[data-testid="team-dps"]', { timeout: 30000 }).then(() => page.textContent('[data-testid="team-dps"]'));

  // Home
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check('a home apresenta as 4 funções', (await page.locator('.in-features li').count()) === 4);
  await page.click('.in-hero a:has-text("Ir ao Vault")');
  await page.waitForSelector('.vt-card');
  check('"Ir ao Vault" abre o Vault', page.url().endsWith('/vault'));
  await page.goto(`${BASE}/endereco-que-nao-existe`, { waitUntil: 'networkidle' });
  check('endereço desconhecido volta para a home', page.url() === `${BASE}/`, page.url());

  // Redirects das rotas antigas
  for (const [from, to] of [['/rotacao', '/vault'], ['/rotacao/exemplo', '/projeto/exemplo/rotacao'], ['/rotacao/exemplo/card', '/card/exemplo'], ['/rotacao/exemplo/recarga', '/projeto/exemplo/recarga']]) {
    await page.goto(`${BASE}${from}`, { waitUntil: 'networkidle' });
    check(`${from} redireciona para ${to}`, page.url() === `${BASE}${to}`, page.url());
  }

  await page.goto(`${BASE}/vault`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.vt-card');
  await page.waitForTimeout(1500);

  // Planilha
  await page.setInputFiles('input[aria-label="Escolher planilha"]', XLSX_FILE);
  await page.waitForURL(/\/projeto\/(?!exemplo)[^/]+$/, { timeout: 30000 });
  await page.waitForSelector('.dz-kpi .v.gold', { timeout: 30000 });
  check('importar a planilha abre o projeto com DPS 216.600', (await page.textContent('.dz-kpi .v.gold')) === '216.600');
  check('o projeto leva o nome do arquivo', /Mavuika_Iansan_Combo2/i.test(await page.textContent('.dz-pagehead .lbl')));
  const importedUrl = page.url();

  await page.click('.dz-nav a:has-text("Vault")'); await page.waitForSelector('.vt-card');
  check('o projeto importado aparece no Vault', (await names()).length === 2, (await names()).join(' | '));

  // Renomear + exportar + reimportar
  await page.click('.vt-card:has-text("Mavuika_Iansan_Combo2") button:has-text("Renomear")');
  await page.fill('input[aria-label="Novo nome do time"]', 'Minha rotação');
  await page.keyboard.press('Enter'); await settle();
  check('renomear', (await names()).includes('Minha rotação'), (await names()).join(' | '));
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('.vt-card:has-text("Minha rotação") button:has-text("Exportar")')]);
  const file = path.join(OUT, 'exportado.json');
  await download.saveAs(file);
  check('exportar baixa um .astralys.json', /\.astralys\.json$/.test(download.suggestedFilename()), download.suggestedFilename());
  await page.setInputFiles('input[aria-label="Escolher projeto"]', file);
  await page.waitForURL(/\/projeto\/(?!exemplo)[^/]+$/, { timeout: 30000 });
  await page.waitForSelector('.dz-kpi .v.gold', { timeout: 30000 });
  check('reimportar o JSON reproduz o mesmo DPS', (await page.textContent('.dz-kpi .v.gold')) === '216.600');

  // Inválido
  await page.goto(`${BASE}/vault`, { waitUntil: 'networkidle' }); await page.waitForSelector('.vt-card');
  const bad = path.join(OUT, 'invalido.json');
  fs.writeFileSync(bad, '{ não é json');
  await page.setInputFiles('input[aria-label="Escolher projeto"]', bad); await settle();
  check('arquivo inválido mostra um erro claro', /JSON válido/.test(await page.$eval('[role="alert"]', (e) => e.textContent).catch(() => '')));

  await page.goto(importedUrl, { waitUntil: 'networkidle' });
  check('o projeto importado reabre pelo endereço', (await page.textContent('.dz-kpi .v.gold')) === '216.600');

  // Comparar
  await page.goto(`${BASE}/comparar?a=exemplo`, { waitUntil: 'networkidle' });
  check('Comparar sem B pede o segundo time', /Escolha dois times/.test(await page.textContent('.dz-page')));
  const options = await page.$$eval('select[aria-label="Time B"] option', (o) => o.map((x) => x.value).filter(Boolean));
  await page.selectOption('select[aria-label="Time B"]', options.find((v) => v !== 'exemplo')); await settle();
  await page.waitForSelector('.cp-verdict', { timeout: 30000 });
  check('Comparar mostra o veredito e as duas tabelas', (await page.locator('.dz-table').count()) === 2, await page.textContent('.cp-verdict'));
  await page.screenshot({ path: path.join(OUT, 'r-comparar.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(400);
  check('Comparar no celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check('home no celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.screenshot({ path: path.join(OUT, 'r-inicio-mobile.png'), fullPage: true });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
