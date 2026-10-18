/**
 * Teste da comparação A/B de projetos.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/comparar.cjs   (ou npm run e2e)
 */
const { chromium } = require('playwright-core');
const BASE = process.env.E2E_URL || 'http://localhost:4173';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(700);

  await page.goto(`${BASE}/rotacao`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.ast-project');

  // Cópia do exemplo com a arma da Mavuika trocada
  await page.click('.ast-project button:has-text("Duplicar")'); await settle();
  const copyHref = await page.$eval('.ast-project:has-text("cópia") a.name', (a) => a.getAttribute('href'));
  const copyId = copyHref.split('/').pop();
  await page.goto(`${BASE}${copyHref}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ast-kpi .v');
  await page.locator('label.ast-field:has(span:text-is("Arma")) select').selectOption({ label: '5★ Beacon of the Reed Sea' });
  await page.waitForTimeout(1500);

  // Comparar pelo cofre
  await page.goto(`${BASE}/rotacao`, { waitUntil: 'networkidle' }); await page.waitForSelector('.ast-project');
  await page.click('.ast-project[data-id="exemplo"] a:has-text("Comparar")');
  await page.waitForSelector('select[aria-label="Projeto A"]');
  check('o atalho Comparar já escolhe o projeto A', (await page.$eval('select[aria-label="Projeto A"]', (e) => e.value)) === 'exemplo');
  check('sem B, a página pede a escolha', /Escolha dois projetos/.test(await page.textContent('.ast-shell')));

  await page.selectOption('select[aria-label="Projeto B"]', copyId);
  await page.waitForSelector('.ast-compare .verdict'); await settle();
  const verdict = await page.textContent('.ast-compare .verdict');
  check('o veredito diz que A rende mais (a arma do exemplo é melhor)', /^A rende/.test(verdict), verdict);
  const rows = await page.$$eval('.ast-compare > table.ast-cmp tbody tr', (r) => r.map((x) => x.textContent));
  check('mostra DPS, DPR e duração', rows.length === 3 && /DPS/.test(rows[0]) && /DPR/.test(rows[1]), rows[1]?.slice(0, 60));
  const change = await page.$eval('.ast-cmp td.down', (e) => e.textContent);
  check('a variação de B contra A é negativa e em vermelho', /^-|−/.test(change), change);
  const mav = await page.$eval('.ast-scroll .ast-cmp tbody tr:has-text("Mavuika")', (e) => e.textContent);
  check('a tabela por personagem mostra a arma de cada lado', /A Thousand Blazing Suns/.test(mav) && /Beacon of the Reed Sea/.test(mav));

  // Trocar A e B inverte o veredito
  await page.click('button:has-text("Trocar")'); await settle();
  check('trocar A e B inverte o veredito', /^B rende/.test(await page.textContent('.ast-compare .verdict')));
  check('a escolha fica no endereço', page.url().includes(`a=${copyId}`) && page.url().includes('b=exemplo'), page.url().slice(-60));

  // Mesmo projeto dos dois lados = empate
  await page.selectOption('select[aria-label="Projeto B"]', copyId); await settle();
  check('o mesmo projeto nos dois lados dá empate', /mesmo dano/.test(await page.textContent('.ast-compare .verdict')));

  // Projeto inexistente
  await page.goto(`${BASE}/comparar?a=exemplo&b=nao-existe`, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
  check('projeto inexistente mostra erro claro', /não encontrado/.test(await page.textContent('[role="alert"]')));

  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto(`${BASE}/comparar?a=exemplo&b=${copyId}`, { waitUntil: 'networkidle' }); await page.waitForSelector('.ast-compare');
  check('móvel sem scroll horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
