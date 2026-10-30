/**
 * Bases de dados do inventário (como no Genshin Optimizer): várias bases separadas, prévia da importação
 * (novos, atualizados, iguais, fora do arquivo), apagar o que não veio no arquivo e times presos à própria base.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/bases.cjs
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const BASE = process.env.E2E_URL || 'http://localhost:4173';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';
const FIXTURE = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'otimizador.good.json'), 'utf8'));

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };
const file = (name, good) => ({ name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(good)) });

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1100 } })).newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));

  await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  const n = FIXTURE.artifacts.length;

  // 1) primeiro arquivo: base nova
  await page.setInputFiles('input[type=file]', file('amigo.json', FIXTURE));
  check('sem bases, a prévia oferece uma base nova', (await page.inputValue('select[aria-label="Base de destino"]')) === 'new');
  await page.click('.inv-preview .dz-btn.gold');
  await page.waitForSelector('.inv-dbs li');
  check('a base criada aparece "em uso" com a contagem', /em uso/i.test(await page.textContent('.inv-dbs li')) && (await page.textContent('.inv-dbs li')).includes(`${n} artefatos`));

  // 2) segundo arquivo na mesma base: 3 peças a menos, 1 evoluída, 1 nova
  const next = JSON.parse(JSON.stringify(FIXTURE));
  next.artifacts = next.artifacts.slice(3);
  const evo = JSON.parse(JSON.stringify(next.artifacts[0]));
  evo.level = (evo.level ?? 0) + 4;
  evo.substats = [...evo.substats, { key: 'eleMas', value: 99 }];
  next.artifacts[0] = evo;
  next.artifacts.push({ setKey: 'GladiatorsFinale', slotKey: 'flower', rarity: 5, mainStatKey: 'hp', level: 20, location: '', substats: [{ key: 'critRate_', value: 2.7 }] });
  await page.setInputFiles('input[type=file]', file('dele.json', next));
  await page.waitForSelector('.inv-diff');
  const row = async (label) => (await page.locator('.inv-diff tbody tr', { hasText: label }).locator('td').allInnerTexts()).map(Number);
  const [added, updated, same, missing] = await row('Artefatos');
  check('a prévia conta novos, atualizados, iguais e fora do arquivo', added === 1 && updated === 1 && same === n - 3 - 1 && missing === 3, `${added}/${updated}/${same}/${missing}`);

  // 3) apagar o que não veio no arquivo
  await page.check('text=Apagar armas e artefatos da base');
  await page.click('.inv-preview .dz-btn.gold');
  await page.waitForSelector('.inv-dbs li');
  check('apagar o que está fora do arquivo deixa só o que veio', (await page.textContent('.inv-dbs li')).includes(`${n - 3 + 1} artefatos`), (await page.textContent('.inv-dbs li')).slice(0, 80));

  // 4) outra base: separada da primeira
  await page.setInputFiles('input[type=file]', file('outro.json', { ...FIXTURE, artifacts: FIXTURE.artifacts.slice(0, 5) }));
  await page.selectOption('select[aria-label="Base de destino"]', 'new');
  await page.fill('input[aria-label="Nome da nova base"]', 'Amigo');
  await page.click('.inv-preview .dz-btn.gold');
  await page.waitForFunction(() => document.querySelectorAll('.inv-dbs li').length === 2);
  check('a nova base fica em uso e a primeira não mudou', (await page.textContent('.inv-dbs li[data-active]')).includes('5 artefatos') && (await page.locator('.inv-dbs li').first().textContent()).includes(`${n - 3 + 1} artefatos`));
  check('a grade mostra só as peças da base em uso', (await page.locator('.inv-grid .inv-art').count()) === 5);
  await page.click('.inv-dbs li:not([data-active]) >> text=Usar esta');
  await page.waitForFunction((k) => document.querySelectorAll('.inv-grid .inv-art').length === k, n - 3 + 1);
  check('trocar de base troca a grade', true);

  // 5) time preso à base com que foi aberto
  await page.goto(`${BASE}/projeto/exemplo`, { waitUntil: 'networkidle' });
  const bound = await page.evaluate(() => JSON.parse(localStorage.getItem('astralys:base-dos-times') || '{}').exemplo);
  const active = await page.evaluate(() => JSON.parse(localStorage.getItem('astralys:bases')).active);
  check('o time abre ligado à base em uso', bound === active);
  await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle' });
  await page.click('.inv-dbs li:not([data-active]) >> text=Usar esta');
  await page.goto(`${BASE}/projeto/exemplo`, { waitUntil: 'networkidle' });
  check('trocar a base em uso não troca a base do time', (await page.evaluate(() => JSON.parse(localStorage.getItem('astralys:base-dos-times')).exemplo)) === bound);
  check('com mais de uma base, a Equipe oferece escolher a base do time', (await page.locator('select[aria-label="Base de dados deste time"]').count()) === 1);

  // 6) excluir uma base não toca na outra
  await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle' });
  page.once('dialog', (d) => d.accept());
  await page.locator('.inv-dbs li').first().locator('text=Excluir').click();
  await page.waitForFunction(() => document.querySelectorAll('.inv-dbs li').length === 1);
  check('excluir uma base mantém a outra', (await page.locator('.inv-dbs li').count()) === 1);

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
