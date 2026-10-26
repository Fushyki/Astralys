/**
 * Aba Otimizar do personagem (mockup Otimizar.dc.html): Build atual, Status em campo, mínimos em chips, equipado inválido,
 * "Mostrar mais" e alturas iguais em 1600 e 1366 px; screenshots em 1600, 1366 e 390.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/otimizar.cjs
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const BASE = process.env.E2E_URL || 'http://localhost:4173';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const FIXTURE = path.join(__dirname, 'fixtures', 'otimizador.good.json');

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));

  // Inventário com as 5 primeiras peças (uma por posição) equipadas no Mavuika
  const good = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const seen = new Set();
  for (const a of good.artifacts) if (!seen.has(a.slotKey)) { seen.add(a.slotKey); a.location = 'Mavuika'; }
  await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.setInputFiles('input[type=file]', { name: 'otimizador.good.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(good)) });
  await page.waitForSelector('.inv-grid .inv-art');
  await page.goto(`${BASE}/projeto/exemplo/personagem/Mavuika?aba=otimizar`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ot-top');

  // ---- Coluna do personagem (um painel) e Build atual ----
  check('a coluna do personagem é um painel só, com a arma no rodapé', (await page.locator('.pc-aside > .oa').count()) === 1 && (await page.locator('.oa .oa-weapon').count()) === 1);
  check('a arma abre o popup de trocar arma', await (async () => { await page.click('.oa-weapon'); const ok = (await page.locator('[role="dialog"][aria-label="Trocar arma"]').count()) === 1; await page.keyboard.press('Escape'); await page.waitForTimeout(150); return ok; })());
  check('Build atual: selo 5/5 peças e 5 linhas', /5\/5 peças/.test(await page.textContent('.ot-top > .dz-panel:first-child .bar-head')) && (await page.locator('.ot-top .ot-cur li').count()) === 5);
  const mains = await page.$$eval('.ot-top .ot-cur li .v', (b) => b.map((x) => x.textContent.trim()));
  check('os main stats saem corretos (flor e pluma inteiros, o resto em %)', /^\d{1,2}\.\d{3}$/.test(mains[0]) && /^\d{3}$/.test(mains[1]) && mains.slice(2).every((m) => /^\d+,\d%$|^\d{2,3}$/.test(m)), mains.join(' | '));
  const stat = (label) => page.textContent(`.ot-top .ot-cur-stats > div:has(dt:text-is("${label}")) dd`);
  const atkFicha = await stat('ATK');
  check('Crit Value aparece nos stats', (await page.locator('.ot-top .ot-cur-stats dt:text-is("Crit Value")').count()) === 1);
  check('o botão "Status em campo" não muda de texto e alterna os stats', await (async () => {
    const btn = page.locator('.ot-field-btn');
    const before = await btn.getAttribute('aria-pressed');
    await btn.click();
    const after = await btn.getAttribute('aria-pressed');
    const atkCampo = await stat('ATK');
    const txt = (await btn.textContent()).trim();
    return before === 'false' && after === 'true' && txt === 'Status em campo' && atkCampo !== atkFicha;
  })(), `${atkFicha}`);
  await page.click('.ot-field-btn');

  // ---- Barra ----
  check('não existe o botão "Buffs do time que entram na busca"', (await page.locator('text=/buffs do time que entram/i').count()) === 0);
  const barH = await page.$eval('.ot-bar-row', (e) => Math.round(e.getBoundingClientRect().height));
  check('a barra de otimização tem 1 linha de controles em 1600 px', barH < 70, `${barH}px`);
  check('os mínimos são chips (sem campos fixos)', (await page.locator('.ot-bar input[aria-label$="mínima"]').count()) === 0 && (await page.locator('.ot-minadd button').count()) === 1);
  check('com o equipado válido a faixa diz "Equipado hoje {valor}"', /^Equipado hoje\s*[\d.]+$/.test((await page.textContent('.ot-eq')).trim()), await page.textContent('.ot-eq'));

  // ---- Busca com equipado válido ----
  await page.click('.ot-bar-row > .dz-btn.gold');
  await page.waitForSelector('.ot-build', { timeout: 120000 });
  const cards = await page.locator('.ot-build').count();
  check('a lista mostra 2 builds e o botão "Mostrar mais · N builds"', cards === 2 && /^Mostrar mais · \d+ builds$/.test((await page.textContent('.ot-more-btn')).trim()), `${cards} cards`);
  await page.click('.ot-more-btn');
  check('"Mostrar mais" mostra os outros na mesma grade de 2 colunas', (await page.locator('.ot-build').count()) > 2);
  check('as peças mostram "troca" ou "equipada"', (await page.locator('.ot-build .piece .top em').count()) >= 10);
  const cmp = await page.$$eval('.ot-build .cmp', (c) => c.map((x) => x.textContent.trim()));
  check('com o equipado válido a comparação é contra o equipado', cmp.length > 0 && cmp.every((t) => /contra o equipado/.test(t)), cmp.join(' | '));
  const mainTexts = await page.$$eval('.ot-build .piece .main b', (b) => b.map((x) => x.textContent.trim()));
  check('nenhum main stat aparece como 0,5% / 0,3%', !mainTexts.some((t) => /^0,[0-9]%$/.test(t)), mainTexts.slice(0, 6).join(' | '));

  // ---- Equipado inválido: mínimo que ele não atinge ----
  const addMin = async (key, value) => {
    await page.click('.ot-minadd button');
    await page.selectOption('select[aria-label="Stat do mínimo"]', key);
    await page.fill('input[aria-label="Valor do mínimo"]', value);
    await page.click('.ot-pop button:has-text("Adicionar")');
  };
  await addMin('cr', '99');
  check('o mínimo vira um chip dourado removível', (await page.locator('.ot-minchip:has(button[aria-label="Remover mínimo de Taxa crítica"])').count()) === 1);
  const bad = (await page.textContent('.ot-eq.bad')).trim();
  check('equipado que não atinge o mínimo: chip vermelho com o valor que tem', /^Equipado hoje não atinge Taxa crítica ≥ 99,0% \(tem \d+,\d%\)$/.test(bad), bad);
  await page.click('.ot-bar-row > .dz-btn.gold');
  await page.waitForSelector('.ot-build', { timeout: 120000 });
  const body = await page.textContent('.ot-results');
  check('sem "−∞" nem "−100%" nos cards', !/∞|−100,00%/.test(body));
  const cmp2 = await page.$$eval('.ot-build .cmp', (c) => c.map((x) => x.textContent.trim()));
  check('o #1 diz "melhor resultado" e os outros comparam com o #1', cmp2[0] === 'melhor resultado' && cmp2.slice(1).every((t) => /contra o #1/.test(t)), cmp2.join(' | '));
  await page.click('button[aria-label="Remover mínimo de Taxa crítica"]');
  check('remover o chip tira o mínimo', (await page.locator('.ot-minchip').count()) === 0);

  // ---- Alturas iguais e screenshots ----
  for (const [w, h] of [[1600, 1000], [1366, 900]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);
    const hs = await page.$$eval('.ot-top > .dz-panel, .pc-aside > .oa', (p) => p.map((x) => Math.round(x.getBoundingClientRect().height)));
    check(`${w}px: coluna do personagem e os 3 painéis têm a mesma altura`, hs.length === 4 && Math.max(...hs) - Math.min(...hs) <= 2, hs.join('/'));
    check(`${w}px: sem rolagem horizontal`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await page.screenshot({ path: path.join(OUT, `otimizar-${w}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  check('390px: sem rolagem horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.screenshot({ path: path.join(OUT, 'otimizar-390.png'), fullPage: true });

  check('sem erros no console', problems.length === 0, problems.slice(0, 3).join(' | '));
  await browser.close();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} verificações OK`);
  process.exit(ok === results.length ? 0 : 1);
})();
