/**
 * Importar pelo UID (Enka.Network, a fonte do akasha.cv): a chamada ao backend é simulada com a vitrine de teste.
 * Precisa do build com a API ligada:
 *   1) VITE_API_URL=http://localhost:8000 npm run build:conta && npx vite preview --outDir dist-conta --port 4174
 *   2) node scripts/e2e/uid.cjs
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const BASE = process.env.E2E_URL || 'http://localhost:4174';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';
const OUT = path.join(__dirname, 'out');
const VITRINE = fs.readFileSync(path.join(__dirname, '..', '..', 'tests', 'fixtures', 'enka-vitrine.json'), 'utf8');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/status of [45][0-9][0-9]|404/.test(m.text())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(600);

  let asked = [];
  await page.route('**/enka/*', async (route) => {
    const uid = route.request().url().split('/enka/')[1];
    asked.push(uid);
    if (uid === '100000404') return route.fulfill({ status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ detail: 'Esse UID não existe no Enka.Network.' }) });
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: VITRINE });
  });

  await page.goto(`${BASE}/projeto/exemplo/personagem/Bennett`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.pc-weapon');
  check('Bennett abre com a arma do exemplo', /Absolution/.test(await page.textContent('.pc-weapon')), (await page.textContent('.pc-weapon')).trim().slice(0, 60));

  await page.click('.dz-panel:has(h2:text-is("Substats (rolls)")) button:has-text("Usar o inventário GOOD")'); await settle();
  check('o painel oferece buscar pelo UID', (await page.locator('input[aria-label="UID do jogo"]').count()) === 1);
  check('o botão fica desligado até o UID ter 9 números', await page.isDisabled('button:has-text("Buscar pelo UID")'));

  await page.fill('input[aria-label="UID do jogo"]', 'abc12'); // letras são ignoradas
  check('só números entram no campo', (await page.inputValue('input[aria-label="UID do jogo"]')) === '12');

  await page.fill('input[aria-label="UID do jogo"]', '100000404');
  await page.click('button:has-text("Buscar pelo UID")');
  await page.waitForSelector('.dz-error');
  check('UID inexistente mostra o erro do servidor', /não existe/.test(await page.textContent('.dz-error')), (await page.textContent('.dz-error')).trim());

  await page.fill('input[aria-label="UID do jogo"]', '100000001');
  await page.click('button:has-text("Buscar pelo UID")');
  await page.waitForSelector('.pc-notes');
  const notes = await page.textContent('.pc-notes');
  check('importa os personagens da vitrine', /2 personagens importados/.test(notes) && /Amber, Bennett/.test(notes), notes.trim().slice(0, 160));
  check('avisa que o Bennett está na vitrine', /Bennett está na vitrine/.test(notes));
  check('o inventário passa a existir', /2 personagens, 2 armas e 10 artefatos/.test(await page.textContent('.pc-good')));
  check('o servidor recebeu o UID certo', asked.includes('100000001'));

  await page.click('button:has-text("Aplicar o build de Bennett")'); await settle();
  check('o build real foi aplicado (arma Freedom-Sworn)', /Freedom-Sworn/.test(await page.textContent('.pc-weapon')), (await page.textContent('.pc-weapon')).trim().slice(0, 60));
  check('o set muda para Noblesse Oblige', /Noblesse Oblige/.test(await page.textContent('.pc-good, body')));

  await page.reload({ waitUntil: 'networkidle' });
  await page.click('.dz-panel:has(h2:text-is("Substats (rolls)")) button:has-text("Usar o inventário GOOD")'); await settle();
  check('o UID fica lembrado', (await page.inputValue('input[aria-label="UID do jogo"]')) === '100000001');

  await page.screenshot({ path: path.join(OUT, 'uid-personagem.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(400);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
