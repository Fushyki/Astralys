/**
 * Redesign, Vault (/vault): cartões dos times, números do gabarito, busca/filtros, favoritos, duplicar, apagar.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/vault.cjs
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
  const cards = () => page.locator('.vt-card');
  // "Novo time" abre o passo a passo: escolhe a Citlali, mantém o build padrão e a rotação básica.
  const createTeam = async (name) => {
    await page.click('button:has-text("Novo time")');
    await page.waitForURL('**/novo');
    await page.click('button[aria-label="Escolher o personagem 1"]');
    await page.waitForSelector('.dz-dialog');
    await page.fill('.dz-dialog input[type="search"]', 'Citlali');
    await page.click('.dz-dialog .pick:has(.n:text-is("Citlali"))');
    await page.fill('.nt-name input', name);
    await page.click('button:has-text("Continuar")');
    await page.click('button:has-text("Continuar")');
    await page.click('button:has-text("Criar o time")');
    await page.waitForURL(/\/projeto\/(?!exemplo)[^/]+$/);
  };
  // O Vault só mostra os cards: as ações ficam nos menus (⋯ de cada card e "Importar e sincronizar" no topo).
  const openCardMenu = (card) => card.locator('button[aria-haspopup="menu"]').click();
  const pickCard = async (card, item) => { await openCardMenu(card); await card.getByRole('menuitem', { name: item, exact: true }).click(); };
  const openHeaderMenu = () => page.click('.dz-pagehead button[aria-haspopup="menu"]');
  const pickHeader = async (item) => { await openHeaderMenu(); await page.getByRole('menuitem', { name: item, exact: true }).click(); };

  await page.goto(`${BASE}/vault`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.vt-card');

  check('a aba Times está ativa', (await page.locator('.dz-nav a[aria-current="page"]').textContent()).includes('Times'));
  check('começa só com o exemplo', (await cards().count()) === 1 && /Exemplo/.test(await cards().first().getAttribute('data-name')));
  await page.waitForSelector('.vt-card .pc', { timeout: 30000 });
  const poster = (await page.textContent('.vt-card .pc')).replace(/\s+/g, ' ');
  check('o cartão é o card do time (DPS 216.600 e dano 3,79 mi)', /216\.600/.test(poster) && /3,79\s*mi/.test(poster), poster.slice(0, 120));
  check('o card mostra os 4 retratos e as barras de participação', (await page.locator('.vt-card .pc-face').count()) === 4 && (await page.locator('.vt-card .pc-bar').count()) >= 4);
  // Escolher qual card aparece na tela Times
  await openCardMenu(cards().first());
  await cards().first().getByRole('menuitemradio', { name: /16:9/ }).click(); await page.waitForTimeout(900);
  check('o card da tela Times pode ser trocado para 16:9', (await page.locator('.vt-card .pc.pc-wide').count()) === 1 && (await page.locator('.vt-card .pc.pc-portrait').count()) === 0);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.vt-card .pc');
  check('a escolha do card sobrevive ao recarregar', (await page.locator('.vt-card .pc.pc-wide').count()) === 1);
  await openCardMenu(cards().first());
  await cards().first().getByRole('menuitemradio', { name: /9:16/ }).click(); await page.waitForTimeout(900);
  check('também aceita o 9:16', (await page.locator('.vt-card .pc.pc-tall').count()) === 1);
  await openCardMenu(cards().first());
  await cards().first().getByRole('menuitemradio', { name: /4:5/ }).click(); await page.waitForTimeout(900);
  check('e volta ao 4:5', (await page.locator('.vt-card .pc.pc-portrait').count()) === 1);
  check('o card cabe na largura do cartão (miniatura escalada)', await page.evaluate(() => { const c = document.querySelector('.vt-card'); const p = document.querySelector('.vt-card .pc-box'); return !!c && !!p && p.getBoundingClientRect().width <= c.getBoundingClientRect().width + 1; }));

  // Novo time -> editor -> volta
  await createTeam('Novo time');
  check('"Novo time" abre o projeto novo', /\/projeto\/[^/]+$/.test(page.url()) && !page.url().endsWith('/exemplo'));
  await page.waitForSelector('.dz-pagehead');
  await page.click('.dz-subnav button:has-text("Salvar nos Times")');
  await page.waitForURL('**/vault');
  await page.waitForSelector('.vt-card');
  check('"Salvar nos Times" favorita e leva aos Times', (await cards().count()) === 2 && (await page.locator('.vt-fav[aria-pressed="true"]').count()) === 1);
  check('o favorito vem primeiro', (await cards().first().locator('.vt-fav[aria-pressed="true"]').count()) === 1);

  // Filtros
  await page.fill('input[aria-label="Buscar times"]', 'zzzz');
  check('busca sem resultado mostra o estado vazio', (await page.locator('.vt-empty').count()) === 1);
  await page.click('button:has-text("Limpar filtros")');
  await page.selectOption('select[aria-label="Elemento"]', 'Cryo');
  check('filtrar por elemento Cryo mantém os times com Citlali', (await cards().count()) === 2);
  await page.selectOption('select[aria-label="Elemento"]', 'Dendro');
  check('filtrar por elemento sem time mostra vazio', (await page.locator('.vt-empty').count()) === 1);
  await page.click('button:has-text("Limpar filtros")');
  await page.click('button:has-text("Favoritos")');
  check('só favoritos mostra 1', (await cards().count()) === 1);
  await page.click('button:has-text("Favoritos")');
  const patchOptions = await page.locator('select[aria-label="Patch"] option').allTextContents();
  check('o filtro de patch lista a versão dos times', patchOptions.some((t) => /^Patch [0-9]/.test(t)), patchOptions.join(' | '));
  await page.selectOption('select[aria-label="Patch"]', { index: 1 });
  check('filtrar pelo patch atual mantém os dois times', (await cards().count()) === 2);
  await page.click('button:has-text("Limpar filtros")');

  check('o cartão não tem botões soltos, só o card, o favorito e o menu', (await cards().first().locator('button').count()) === 2 && (await cards().first().locator('a').count()) === 1);
  check('o título aparece uma vez só (dentro do card)', (await cards().first().locator('h1').count()) === 1);
  await openHeaderMenu();
  check('o menu do topo reúne importar e sincronizar', (await page.getByRole('menuitem').count()) >= 2);
  await page.keyboard.press('Escape');
  check('Esc fecha o menu', (await page.getByRole('menuitem').count()) === 0);

  // Duplicar, renomear, apagar
  await pickCard(cards().first(), 'Duplicar'); await settle();
  check('duplicar cria outro cartão', (await cards().count()) === 3);
  const before = await cards().count();
  await openCardMenu(cards().first());
  await cards().first().getByRole('menuitem', { name: 'Apagar', exact: true }).click();
  await cards().first().getByRole('menuitem', { name: 'Sim', exact: true }).click(); await settle();
  check('apagar remove o cartão', (await cards().count()) === before - 1);

  await page.screenshot({ path: path.join(OUT, 'r-vault.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(400);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.screenshot({ path: path.join(OUT, 'r-vault-mobile.png'), fullPage: true });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
