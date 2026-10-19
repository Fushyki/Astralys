/**
 * Navegação nova (Times · Personagens · Inventário · Otimizador · Ferramentas), Inventário e Otimizador de artefatos.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/otimizador.cjs
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
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));

  await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // ---- Menu ----
  const nav = await page.$$eval('.dz-nav > a, .dz-header .dz-navbtn', (a) => a.map((x) => x.textContent.trim()));
  check('o menu é Times · Personagens · Inventário · Otimizador · Ferramentas', nav.join('|') === 'Times|Personagens|Inventário|Otimizador|Ferramentas ▾', nav.join('|'));
  check('Inventário está marcado', (await page.getAttribute('.dz-nav a:has-text("Inventário")', 'aria-current')) === 'page');

  // ---- Inventário ----
  check('sem inventário, a tela oferece importar o arquivo', (await page.locator('button:has-text("Escolher arquivo")').count()) === 1);
  await page.setInputFiles('input[type=file]', FIXTURE);
  await page.waitForSelector('.inv-grid .piece');
  const counts = await page.textContent('.inv-import .opt.now b');
  check('importa o arquivo GOOD e mostra a contagem', /40 artefatos/.test(counts), counts);
  check('a grade mostra as peças com imagem do set', (await page.locator('.inv-grid .piece').count()) === 40 && (await page.locator('.inv-grid .piece img').count()) > 0);
  await page.click('.ot-chip:has-text("Areia")');
  check('filtrar por posição deixa só as Areias', (await page.locator('.inv-grid .piece').count()) === 8);
  await page.click('.ot-chip:has-text("Areia")');
  await page.selectOption('select[aria-label="Set"]', { index: 1 });
  check('filtrar por set reduz a lista', (await page.locator('.inv-grid .piece').count()) < 40);
  await page.screenshot({ path: path.join(OUT, 'inventario.png') });

  // ---- Otimizador: escolha do time ----
  await page.click('.dz-nav a:has-text("Otimizador")');
  await page.waitForSelector('.oe-team');
  check('a entrada do otimizador lista os times com retratos clicáveis', (await page.locator('.oe-team .ot-member').count()) >= 4);
  await page.click('.oe-team .ot-member:has(.n:text-is("Mavuika"))');
  await page.waitForSelector('.ot-grid');
  check('abre o otimizador do Mavuika dentro do time', /\/projeto\/exemplo\/otimizador\/Mavuika/.test(page.url()));
  check('os 4 retratos do time escolhem quem otimizar', (await page.locator('.ot-team .ot-member').count()) === 4 && (await page.getAttribute('.ot-member:has(.n:text-is("Mavuika"))', 'aria-selected')) === 'true');
  check('a faixa do time tem 3 telas: Equipe, Rotação e buffs, Dano do time', (await page.$$eval('.dz-subnav nav a', (a) => a.map((x) => x.textContent.replace(/^\d/, '').trim()))).join('|') === 'Equipe|Rotação e buffs|Dano do time');
  check('o foco da build tem 4 opções', (await page.locator('.ot-focus button').count()) === 4);
  const prev = await page.textContent('.ot-go .muted');
  check('mostra quantas peças entram por posição', /40 peças entram \(8 \/ 8 \/ 8 \/ 8 \/ 8/.test(prev), prev);

  // ---- Otimizar (dano do time) ----
  await page.click('.ot-go .dz-btn.gold');
  await page.waitForSelector('.ot-build:not([data-now="true"])', { timeout: 120000 });
  const builds = await page.locator('.ot-build:not([data-now="true"])').count();
  check('a busca devolve até 5 builds', builds >= 1 && builds <= 5, String(builds));
  check('diz que a busca foi completa', /Busca completa/.test(await page.textContent('.ot-summary')));
  check('cada build mostra as 5 peças com imagem e substats', (await page.locator('.ot-build').first().locator('.piece').count()) === 5);
  const vals = await page.$$eval('.ot-build:not([data-now="true"]) .val b', (b) => b.map((x) => Number(x.textContent.replace(/\./g, ''))));
  check('os builds vêm do melhor para o pior', vals.every((v, i) => i === 0 || v <= vals[i - 1]) && vals[0] > 0, vals.join(' > '));
  await page.screenshot({ path: path.join(OUT, 'otimizador.png'), fullPage: true });

  // ---- Equipar ----
  await page.locator('.ot-build:not([data-now="true"])').first().locator('button:has-text("Equipar")').click();
  check('Equipar marca o build como equipado', (await page.locator('.ot-build button:has-text("Equipado")').count()) === 1);

  // ---- Restrição de Recarga ----
  await page.fill('input[aria-label="Recarga mínima"]', '125');
  await page.click('.ot-go .dz-btn.gold');
  await page.waitForSelector('.ot-build, .note', { timeout: 120000 });
  await page.waitForTimeout(500);
  const ers = await page.$$eval('.ot-build:not([data-now="true"]) footer', (f) => f.map((x) => Number((/ER (\d+)%/.exec(x.textContent) || [])[1])));
  check('com Recarga mínima de 125% nenhum build fica abaixo', ers.every((e) => e >= 125), ers.join(',') || 'nenhum cumpre');

  // ---- Foco num stat ----
  await page.fill('input[aria-label="Recarga mínima"]', '');
  await page.click('.ot-focus button:has-text("Um stat")');
  await page.click('.ot-chip:has-text("Maestria")');
  await page.click('.ot-go .dz-btn.gold');
  await page.waitForSelector('.ot-build:not([data-now="true"])', { timeout: 120000 });
  const em = await page.$$eval('.ot-build:not([data-now="true"]) .val b', (b) => b.map((x) => Number(x.textContent.replace(/\./g, ''))));
  check('foco em Maestria: o melhor build tem a maior Maestria', em.length > 0 && em[0] >= Math.max(...em), em.join(' > '));

  // ---- Equipe: clicar no retrato troca o personagem ----
  await page.goto(`${BASE}/projeto/exemplo`, { waitUntil: 'networkidle' });
  await page.locator('.eq-card button.who').nth(1).click();
  await page.waitForSelector('.dz-dialog');
  check('tocar no retrato abre a escolha de personagem', /Trocar/.test(await page.textContent('.dz-dialog')));
  await page.keyboard.press('Escape');
  check('o cartão tem "Ajustar build" e não tem mais "Otimizar artefatos"', (await page.locator('.eq-card a:has-text("Ajustar build")').count()) === 4 && (await page.locator('.eq-card a:has-text("Otimizar artefatos")').count()) === 0);
  await page.click('.eq-card:has(.name:text-is("Citlali")) a:has-text("Ajustar build")');
  await page.waitForSelector('.pc-gear');
  await page.click('a:has-text("Otimizar artefatos")');
  await page.waitForSelector('.ot-grid');
  check('"Otimizar artefatos" fica dentro do ajuste de build e abre o otimizador do personagem', /\/otimizador\/Citlali/.test(page.url()));
  await page.goto(`${BASE}/projeto/exemplo`, { waitUntil: 'networkidle' });
  check('a barra de passos tem 3 passos', /Passo 1 de 3/.test(await page.textContent('.dz-stepbar')));

  // ---- Personagens ----
  await page.click('.dz-nav a:has-text("Personagens")');
  await page.waitForSelector('.pe-card');
  check('Personagens mostra os do inventário', (await page.locator('.pe-card').count()) >= 1 && /Mavuika/.test(await page.textContent('.pe-grid')));
  await page.locator('button:has-text("Todos")').first().click();
  await page.waitForTimeout(300);
  check('"Todos" lista bem mais personagens', (await page.locator('.pe-card').count()) > 50);
  await page.screenshot({ path: path.join(OUT, 'personagens.png') });

  // ---- Ferramentas ----
  await page.click('.dz-navbtn');
  const tools = await page.$$eval('.dz-menu-item', (a) => a.map((x) => x.textContent.trim()));
  check('Ferramentas reúne Recarga e Comparar fora de um time', tools.join('|') === 'Recarga de energia|Comparar dois times', tools.join('|'));
  await page.keyboard.press('Escape');

  // ---- celular ----
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(`${BASE}/projeto/exemplo/otimizador/Mavuika`, { waitUntil: 'networkidle' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check('celular sem rolagem horizontal no otimizador', !overflow);
  await page.screenshot({ path: path.join(OUT, 'otimizador-cel.png') });

  console.log(problems.length ? `\nProblemas de consola:\n${problems.join('\n')}` : '\nProblemas de consola: nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  await browser.close();
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})();
