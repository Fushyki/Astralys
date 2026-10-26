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
  const wb = await page.$eval('.oa-weapon .art', (e) => [Math.round(e.getBoundingClientRect().width), Math.round(e.getBoundingClientRect().height)]);
  check('o card da arma é um botão com ícone de 76 px e aria-label "Trocar arma (atual: …)"', wb[0] === 76 && wb[1] === 76 && /^Trocar arma \(atual: .+\)$/.test(await page.getAttribute('.oa-weapon', 'aria-label')), wb.join('x'));
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
  const cols = await page.$$eval('.ot-bar-grid > *', (c) => c.map((x) => Math.round(x.getBoundingClientRect().width)));
  check('o painel de otimização tem 2 colunas 66% | 33%', cols.length === 2 && Math.abs(cols[0] / cols[1] - 2) < 0.1, cols.join('/'));
  const lines = await page.$$eval('.ot-bar-cfg .ot-bar-line', (l) => l.length);
  check('a configuração tem 2 linhas (Otimizar/Alvo/Mostrar e Golpe/Reação/Crítico)', lines === 2);
  check('o Golpe fica desativado, sem sumir, fora do alvo "Um golpe"', await page.locator('.ot-movebtn').isDisabled());
  check('os mínimos são chips (sem campos fixos)', (await page.locator('.ot-bar input[aria-label$="mínima"]').count()) === 0 && (await page.locator('.ot-min-add .dz-btn').count()) === 1);
  check('com o equipado válido a faixa diz "Equipado hoje {valor}"', /^Equipado hoje\s*[\d.]+$/.test((await page.textContent('.ot-eq')).trim()), await page.textContent('.ot-eq'));

  // ---- Busca com equipado válido ----
  await page.click('.ot-go-btn');
  await page.waitForSelector('.ot-build', { timeout: 120000 });
  const cards = await page.locator('.ot-build').count();
  check('a lista mostra 2 builds e o botão "Mostrar mais · N builds"', cards === 2 && /^Mostrar mais · \d+ builds$/.test((await page.textContent('.ot-more-btn')).trim()), `${cards} cards`);
  await page.click('.ot-more-btn');
  check('"Mostrar mais" mostra os outros na mesma grade de 2 colunas', (await page.locator('.ot-build').count()) > 2);
  check('as peças mostram "troca" ou "equipada"', (await page.locator('.ot-build .piece .phead em').count()) >= 10);
  const cmp = await page.$$eval('.ot-build .cmp', (c) => c.map((x) => x.textContent.trim()));
  check('com o equipado válido a comparação é contra o equipado', cmp.length > 0 && cmp.every((t) => /contra o equipado/.test(t)), cmp.join(' | '));
  check('cada peça tem a faixa na cor do set e o selo CV com 1 casa', (await page.locator('.ot-build .piece .bar').count()) >= 10 && (await page.$$eval('.ot-build .piece .cv', (c) => c.every((x) => /^CV \d+,\d$/.test(x.textContent.trim())))));
  check('o cabeçalho mostra "{n} trocas" e os sets, sem chip roxo', (await page.locator('.ot-build .sets .swaps').count()) >= 1 && /^\d+ trocas?$/.test((await page.textContent('.ot-build .sets .swaps')).trim()) && (await page.locator('.ot-build .borrow').count()) === 0);
  check('a peça sem dono diz "no inventário"', (await page.locator('.ot-build .piece .foot').count()) >= 1 && /no inventário/.test(await page.textContent('.ot-build .piece .foot')));
  check('o ícone da peça é grande e sem box; o mini ícone é de quem a tem equipada (mesmo o personagem desta aba)', await (async () => {
    const art = await page.$eval('.ot-build .piece .art', (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return [Math.round(r.width), cs.borderTopWidth, cs.backgroundColor]; });
    const owners = await page.$$eval('.ot-build .piece .owner', (o) => o.map((x) => x.getAttribute('aria-label')));
    return art[0] >= 90 && art[1] === '0px' && owners.length >= 1 && owners.every((t) => /^equipada em Mavuika$/.test(t));
  })());
  const mainTexts = await page.$$eval('.ot-build .piece .mv b', (b) => b.map((x) => x.textContent.trim()));
  check('nenhum main stat aparece como 0,5% / 0,3%', !mainTexts.some((t) => /^0,[0-9]%$/.test(t)), mainTexts.slice(0, 6).join(' | '));

  // ---- Artefatos bloqueados ----
  await page.locator('.ot-build').first().locator('.piece').first().click();
  check('clicar no artefato do resultado o tira da otimização (fica marcado)', (await page.locator('.ot-build .piece[data-blocked="true"]').count()) >= 1);
  check('o filtro mostra "Habilitar artefatos bloqueados · 1"', /^Habilitar artefatos bloqueados · 1$/.test((await page.textContent('.ot-unblock')).trim()));
  await page.click('.ot-bar-min .ot-go-btn');
  await page.waitForSelector('.ot-build', { timeout: 120000 });
  check('a busca seguinte não usa o artefato bloqueado (39 peças entram)', /39 peças/.test(await page.textContent('.ot-strip')), await page.textContent('.ot-strip'));
  await page.click('.ot-unblock');
  check('o diálogo lista o artefato bloqueado inteiro', (await page.locator('[role="dialog"][aria-label="Artefatos bloqueados"] .bk').count()) === 1);
  await page.click('.ot-blocked .bk button:has-text("Habilitar")');
  check('habilitar um a um desbloqueia e fecha quando não sobra nenhum', (await page.locator('.ot-blocked').count()) === 0 && (await page.locator('.ot-unblock').count()) === 0);

  // ---- Equipar: o botão vira "Equipado" (bloqueado) e os donos das peças mudam na hora ----
  await page.locator('.ot-build').first().locator('button:has-text("Equipar")').click();
  await page.waitForTimeout(600);
  const firstBtn = page.locator('.ot-build').first().locator('.equip');
  check('depois de equipar, o botão diz "Equipado" e fica bloqueado', (await firstBtn.textContent()).trim() === 'Equipado' && (await firstBtn.isDisabled()));
  const owners = await page.locator('.ot-build').first().locator('.piece .owner').evaluateAll((o) => o.map((x) => x.getAttribute('aria-label')));
  check('o mini ícone das 5 peças passa a ser do personagem que as equipou, na hora', owners.length === 5 && owners.every((t) => t === 'equipada em Mavuika'), owners.join(' | '));
  check('as peças do build equipado viram "equipada"', (await page.locator('.ot-build').first().locator('.piece .phead em:has-text("equipada")').count()) === 5);

  // ---- Equipado inválido: mínimo que ele não atinge ----
  const addMin = async (key, value) => {
    await page.selectOption('select[aria-label="Stat do mínimo"]', key);
    await page.fill('input[aria-label="Valor do mínimo"]', value);
    await page.click('.ot-min-add .dz-btn');
  };
  await addMin('cr', '100.5');
  check('o mínimo vira um chip dourado removível', (await page.locator('.ot-minchip:has(button[aria-label="Remover mínimo de Taxa crítica"])').count()) === 1);
  const bad = (await page.textContent('.ot-eq.bad')).trim();
  check('equipado que não atinge o mínimo: chip vermelho com o valor que tem', /^Equipado hoje não atinge Taxa crítica ≥ 100,5% \(tem \d+,\d%\)$/.test(bad), bad);
  await page.click('.ot-go-btn');
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
  await page.waitForTimeout(800);
  const w390 = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth, [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 4).map((e) => e.tagName + '.' + e.className + '<' + (e.parentElement ? e.parentElement.className : '') + '>' + e.textContent.slice(0, 24) + ':' + Math.round(e.getBoundingClientRect().right))]);
  check('390px: sem rolagem horizontal', w390[0] <= w390[1] + 1, JSON.stringify(w390));
  await page.screenshot({ path: path.join(OUT, 'otimizar-390.png'), fullPage: true });

  check('sem erros no console', problems.length === 0, problems.slice(0, 3).join(' | '));

  // ---- Sets: só linhas inteiras e "Mostrar todos · mais N sets" só com sets escondidos ----
  await page.setViewportSize({ width: 1600, height: 1000 });
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'data', 'generated', 'artifacts.json'), 'utf8'));
  const keys = data.filter((a) => a.rarity >= 4).slice(0, 40).map((a) => a.name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(''));
  const many = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  many.artifacts.forEach((a, i) => { a.setKey = keys[i % keys.length]; });
  await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.setInputFiles('input[type=file]', { name: 'many.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(many)) });
  await page.waitForSelector('.inv-grid .inv-art');
  await page.goto(`${BASE}/projeto/exemplo/personagem/Mavuika?aba=otimizar`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ot-sets-wrap');
  await page.waitForTimeout(500);
  const total = await page.$$eval('.ot-set', (c) => c.length);
  const more = await page.locator('.ot-more-sets').count();
  const cut = await page.evaluate(() => {
    const wrap = document.querySelector('.ot-sets-wrap').getBoundingClientRect();
    const cells = [...document.querySelectorAll('.ot-set')].map((c) => c.getBoundingClientRect());
    return cells.every((c) => c.bottom <= wrap.bottom + 1);
  });
  check('Sets: com sets sobrando aparece "Mostrar todos · mais N sets" e nenhuma linha fica cortada', more === 1 && cut && /^Mostrar todos · mais \d+ sets$/.test((await page.textContent('.ot-more-sets')).trim()), `${total} visíveis`);
  await page.click('.ot-more-sets');
  check('Mostrar todos revela os outros sets', (await page.$$eval('.ot-set', (c) => c.length)) > total);

  await browser.close();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} verificações OK`);
  process.exit(ok === results.length ? 0 : 1);
})();
