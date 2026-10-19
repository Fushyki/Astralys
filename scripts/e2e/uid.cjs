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

  await page.goto(`${BASE}/projeto/exemplo/personagem/Bennett?aba=build`, { waitUntil: 'networkidle' });
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
  await page.click('.pc-views button:has-text("Build")'); await settle();
  check('o build real foi aplicado (arma Freedom-Sworn)', /Freedom-Sworn/.test(await page.textContent('.pc-weapon')), (await page.textContent('.pc-weapon')).trim().slice(0, 60));
  check('o set muda para Noblesse Oblige', /Noblesse Oblige/.test(await page.textContent('.pc-good, body')));

  await page.reload({ waitUntil: 'networkidle' });
  await page.click('.pc-views button:has-text("Avançado")'); await settle();
  await page.click('.dz-seg[aria-label="Ferramenta"] button:has-text("Inventário GOOD")'); await settle();
  check('o UID fica lembrado', (await page.inputValue('input[aria-label="UID do jogo"]')) === '100000001');

  // Montar um time: o passo 2 importa o build real pelo UID
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check('o início oferece "Importar o meu build" quando há servidor', (await page.locator('.in-path:has-text("Importar o meu build")').count()) === 1);
  await page.click('.in-path:has-text("Importar o meu build")');
  await page.waitForURL('**/novo?origem=uid');
  await page.click('button[aria-label="Escolher o personagem 1"]');
  await page.waitForSelector('.dz-dialog');
  await page.fill('.dz-dialog input[type="search"]', 'Bennett');
  await page.click('.dz-dialog .pick:has(.n:text-is("Bennett"))');
  await page.click('button:has-text("Continuar")');
  check('vindo de "Importar o meu build" a origem UID já vem marcada', await page.isChecked('input[name="source"] >> nth=1'));
  await page.fill('input[aria-label="UID do jogo"]', '100000001');
  await page.click('.nt-uid button:has-text("Buscar")');
  await page.waitForSelector('.nt-uid .note');
  check('o passo 2 diz de quem veio o build real', /Build real importado de: Bennett/.test(await page.textContent('.nt-uid .note')), (await page.textContent('.nt-uid .note')).trim());
  await page.click('button:has-text("Continuar")');
  await page.click('button:has-text("Criar o time")');
  await page.waitForURL(/\/projeto\/(?!exemplo)[^/]+$/);
  await page.waitForSelector('.eq-card');
  check('o time nasce com a arma real da vitrine (Freedom-Sworn)', /Freedom-Sworn/.test(await page.textContent('.eq-card')), (await page.textContent('.eq-card')).replace(/\s+/g, ' ').slice(0, 120));

  await page.screenshot({ path: path.join(OUT, 'uid-personagem.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(400);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
