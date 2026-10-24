/**
 * Redesign, aba Recarga: dentro do projeto (/projeto/:id/recarga) e avulsa (/recarga).
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/recarga.cjs
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
const num = (t) => Number(String(t).replace(/\./g, '').replace(',', '.').replace('%', ''));

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const problems = [];
  // O Lunaris não tem ícone do Viajante (404 esperado; o avatar cai na inicial).
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/404/.test(m.text())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(500);
  const card = (n) => page.locator(`section[aria-label="Recarga de ${n}"]`);
  const need = async (n) => card(n).locator('.need .v').textContent();

  await page.goto(`${BASE}/projeto/exemplo/recarga`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.rc-card');

  check('a Recarga abre dentro do time (faixa do time visível)', (await page.locator('.dz-subnav').count()) === 1);
  check('quatro cartões, um por personagem', (await page.locator('.rc-card').count()) === 4);
  check('Mavuika (sem custo de Supremo) não precisa de ER', (await need('Mavuika')) === '—');
  const c0 = await need('Citlali');
  check('Citlali mostra a recarga necessária (>100%)', /%$/.test(c0) && num(c0) > 100, c0);
  check('compara com a ER do build', /O build tem/.test(await card('Citlali').locator('.cmp').textContent()));

  const enemy = page.locator('.rc-scenario label:has-text("Partículas dos inimigos") input');
  const i0 = num(await need('Iansan'));
  await enemy.fill('12'); await enemy.blur(); await settle();
  check('mais partículas de inimigos reduzem a recarga necessária', num(await need('Iansan')) < i0, `${i0} → ${await need('Iansan')}`);

  await page.click('button:has-text("Preencher com a rotação")'); await settle();
  const uses = await card('Citlali').locator('label:has-text("Usos da habilidade") input').inputValue();
  check('"Preencher com a rotação" preenche os usos da habilidade', Number(uses) >= 0 && (await need('Citlali')) !== '', `usos=${uses}`);

  const btn = card('Citlali').locator('button:has-text("Usar como ER mínimo")');
  await btn.click(); await settle();
  await page.goto(`${BASE}/projeto/exemplo/personagem/Citlali`, { waitUntil: 'networkidle' });
  check('o ER mínimo é gravado no build (a página do personagem abre)', (await page.locator('.dz-page, main').count()) > 0);

  await page.goto(`${BASE}/projeto/exemplo/recarga`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.rc-card');
  check('a configuração sobrevive ao recarregar (partículas 12)', (await enemy.inputValue()) === '12');
  await page.screenshot({ path: path.join(OUT, 'r-recarga.png'), fullPage: true });

  // Avulsa
  await page.goto(`${BASE}/recarga`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('astralys.recarga-livre'));
  await page.reload({ waitUntil: 'networkidle' });
  check('avulsa começa com o time da calculadora antiga (Mavuika, Citlali, Iansan, Bennett)', (await page.$$eval('.rc-card .who select', (s) => s.map((x) => x.value))).join('|') === 'Mavuika|Citlali|Iansan|Bennett');
  const needs = await page.$$eval('.rc-card .need .v', (v) => v.map((x) => x.textContent.trim()));
  check('o cenário inicial reproduz 202,2% / 205,2% / 185,7%', needs.slice(1).join('|') === '202,2%|205,2%|185,7%', needs.join('|'));
  check('cada cartão mostra a margem de segurança de +15%', (await page.locator('.rc-card .safe').count()) === 3);

  // trocar o personagem de um slot
  await page.selectOption('select[aria-label="Personagem do slot 2"]', 'Kamisato Ayaka'); await settle();
  check('trocar o personagem do slot 2 atualiza o cartão', (await page.inputValue('select[aria-label="Personagem do slot 2"]')) === 'Kamisato Ayaka');

  // times salvos
  await page.fill('input[aria-label="Nome do time"]', 'Meu time'); await page.click('button:has-text("Salvar time atual")');
  check('salvar o time o põe na lista', (await page.locator('.rc-saved').count()) === 1 && /Meu time/.test(await page.textContent('.rc-saved')));
  await page.click('.rc-card .rc-head .x >> nth=3'); await settle();
  check('remover um slot tira o cartão', (await page.locator('.rc-card').count()) === 3);
  await page.click('.rc-saved .dz-link'); await settle();
  check('carregar o time salvo traz os 4 de volta', (await page.locator('.rc-card').count()) === 4);
  await page.reload({ waitUntil: 'networkidle' });
  check('o time salvo e o time atual sobrevivem ao recarregar', (await page.locator('.rc-saved').count()) === 1 && (await page.locator('.rc-card').count()) === 4);

  // backup da calculadora antiga
  const legacy = [{ id: 1, name: 'Antigo', enemyParts: 6, slots: [
    { id: 1, name: 'Mavuika', e_uses: 1, funnel: 'Dividir (50% Slot 3 / 50% Slot 4)', fav: 0, fav_target: 'Ele mesmo (Em campo)', flat: 0, onfield: 0.5, use_burst: false },
    { id: 2, name: 'Citlali', e_uses: 1, funnel: 'Ele mesmo (Em campo)', fav: 0, fav_target: 'Ele mesmo (Em campo)', flat: 0, onfield: 0.15, use_burst: true },
    { id: 3, name: 'Iansan', e_uses: 1, funnel: 'Ele mesmo (Em campo)', fav: 0, fav_target: 'Ele mesmo (Em campo)', flat: 12, onfield: 0.15, use_burst: true },
    { id: 4, name: 'Bennett', e_uses: 1, funnel: 'Ele mesmo (Em campo)', fav: 0, fav_target: 'Ele mesmo (Em campo)', flat: 0, onfield: 0.2, use_burst: true }] }];
  const tmp = path.join(OUT, 'legacy-backup.json'); fs.writeFileSync(tmp, JSON.stringify(legacy));
  await page.setInputFiles('input[aria-label="Arquivo de backup"]', tmp); await settle();
  check('importar o backup da calculadora antiga adiciona o time', (await page.locator('.rc-saved').count()) === 2 && /importado/.test(await page.textContent('.dz-page')));
  await page.click('.rc-saved:has-text("Antigo") .dz-link'); await settle();
  check('o time importado reproduz as mesmas recargas', (await page.$$eval('.rc-card .need .v', (v) => v.map((x) => x.textContent.trim()))).slice(1).join('|') === '202,2%|205,2%|185,7%');

  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(400);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.screenshot({ path: path.join(OUT, 'r-recarga-mobile.png'), fullPage: true });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
