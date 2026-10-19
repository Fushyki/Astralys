/**
 * Passos do projeto: barra "Passo N de 4" com o botão do próximo, abas numeradas e o menu "Mais".
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/passos.cjs
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
  const bar = () => page.textContent('.dz-stepbar');

  await page.goto(`${BASE}/projeto/exemplo`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.dz-stepbar');

  const tabs = await page.$$eval('.dz-nav a', (a) => a.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
  check('as 4 primeiras abas são os passos numerados', tabs.slice(0, 4).join('|') === '1Equipe|2Personagens|3Rotação e buffs|4Dano do time', tabs.join('|'));
  check('o passo 1 explica o que fazer e oferece o próximo', /Passo 1 de 4/.test(await bar()) && (await page.locator('.dz-stepbar a:has-text("Próximo passo: Ajustar os personagens")').count()) === 1);
  check('no passo 1 não há botão de voltar', (await page.locator('.dz-stepbar a:has-text("←")').count()) === 0);

  await page.click('.dz-stepbar a:has-text("Próximo passo")');
  await page.waitForURL(/personagem\/Mavuika/);
  await settle();
  check('o passo 2 é a tela do personagem', /Passo 2 de 4/.test(await bar()) && (await page.getAttribute('.dz-nav a:has-text("Personagens")', 'aria-current')) === 'page');
  await page.click('.dz-stepbar a:has-text("Próximo passo")');
  await page.waitForURL(/rotacao/);
  await settle();
  check('o passo 3 é a rotação, com voltar para os personagens', /Passo 3 de 4/.test(await bar()) && (await page.locator('.dz-stepbar a:has-text("← Personagens")').count()) === 1);
  await page.click('.dz-stepbar a:has-text("Próximo passo")');
  await page.waitForURL(/\/time/);
  await settle();
  check('o passo 4 é o resultado e leva ao Card', /Passo 4 de 4/.test(await bar()) && (await page.locator('.dz-stepbar a:has-text("Gerar o Card")').count()) === 1);
  await page.screenshot({ path: path.join(OUT, 'r-passos-time.png') });

  // Voltar pelo botão
  await page.click('.dz-stepbar a:has-text("← Rotação")');
  await page.waitForURL(/rotacao/);
  check('"← Rotação" volta um passo', /Passo 3 de 4/.test(await bar()));

  // Menu "Mais": telas de apoio
  await page.click('button[aria-label="Mais telas do projeto"]');
  const items = await page.$$eval('[role="menuitem"]', (e) => e.map((x) => x.textContent.trim()));
  check('"Mais" reúne Armas, Recarga, Comparar e Card', items.join('|') === 'Armas e constelações|Recarga de energia|Comparar com outro time|Card para compartilhar', items.join('|'));
  await page.keyboard.press('Escape');
  check('Esc fecha o menu "Mais"', (await page.locator('[role="menuitem"]').count()) === 0);
  await page.click('button[aria-label="Mais telas do projeto"]');
  await page.click('[role="menuitem"]:has-text("Armas e constelações")');
  await page.waitForURL(/armas/);
  await settle();
  check('Armas aparece como aba enquanto você está nela, sem a barra de passos', (await page.locator('.dz-nav a[aria-current="page"]').textContent()).includes('Armas') && (await page.locator('.dz-stepbar').count()) === 0);

  // Celular
  await page.goto(`${BASE}/projeto/exemplo`, { waitUntil: 'networkidle' });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForSelector('.dz-stepbar');
  await page.waitForTimeout(500);
  check('celular sem rolagem horizontal da página (com a barra de passos)', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.screenshot({ path: path.join(OUT, 'r-passos-mobile.png') });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
