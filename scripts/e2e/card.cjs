/**
 * Teste do card infográfico: renderização, personalização, formatos e exportação PNG.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/card.cjs   (ou npm run e2e)
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
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));

  await page.goto(`${BASE}/rotacao/exemplo`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.ast-kpi .v');
  await page.click('a:has-text("Card infográfico")');
  await page.waitForSelector('.ast-card');
  await page.waitForTimeout(1500);

  const text = await page.$eval('.ast-card', (e) => e.textContent);
  check('o card mostra DPS e DPR do exemplo', /216,6k/.test(text) && /3,79M/.test(text), text.match(/DPS\s*\S+/)?.[0]);
  check('mostra os 4 personagens com participação', ['Mavuika', 'Citlali', 'Iansan', 'Bennett'].every((n) => text.includes(n)) && /95,3%/.test(text));
  check('mostra a sequência de golpes', /Citlali E/.test(text) && /Mavuika/.test(text));
  const faces = await page.$$eval('.ast-card .face img', (imgs) => imgs.filter((i) => i.complete && i.naturalWidth > 0).length);
  check('os 4 retratos carregaram', faces === 4, `${faces}/4`);
  const noOverflow = await page.$eval('.ast-card', (e) => e.scrollWidth <= e.clientWidth + 1 && e.scrollHeight <= e.clientHeight + 1);
  check('o card não transborda', noOverflow);

  // Personalização
  await page.fill('input[placeholder="Ex.: Meta 7.1"]', 'Meta 7.1');
  await page.fill('.ast-cardform label:has-text("Título") input', 'Combo Pyro Natlan');
  await page.waitForTimeout(300);
  const t2 = await page.$eval('.ast-card', (e) => e.textContent);
  check('título e etiqueta personalizados aparecem', /COMBO PYRO NATLAN/i.test(t2) && /Meta 7.1/.test(t2));

  // Persistência da personalização
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.ast-card'); await page.waitForTimeout(1200);
  check('a personalização sobrevive ao recarregar', /Combo Pyro Natlan/i.test(await page.$eval('.ast-card', (e) => e.textContent)));

  // Formato vertical
  await page.check('input[name="fmt"] >> nth=1'); await page.waitForTimeout(500);
  const size = await page.$eval('.ast-card', (e) => [e.offsetWidth, e.offsetHeight]);
  check('formato 9:16 tem 720×1280', size[0] === 720 && size[1] === 1280, size.join('×'));
  check('o card vertical não transborda', await page.$eval('.ast-card', (e) => e.scrollHeight <= e.clientHeight + 1));
  await page.screenshot({ path: path.join(OUT, 'card-vertical.png') });

  // PNG
  await page.check('input[name="fmt"] >> nth=0'); await page.waitForTimeout(500);
  const [d] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("Baixar PNG")')]);
  const file = path.join(OUT, 'card.png');
  await d.saveAs(file);
  const buf = fs.readFileSync(file);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  check('baixar PNG gera a imagem em 2560×1440', buf.slice(1, 4).toString() === 'PNG' && w === 2560 && h === 1440, `${w}×${h}, ${Math.round(buf.length / 1024)} KB`);

  await page.setViewportSize({ width: 400, height: 800 });
  await page.waitForTimeout(500);
  check('móvel sem scroll horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));

  await browser.close();
  const relevant = problems.filter((p) => !/cssRules|inlining remote css|Error while reading CSS/.test(p));
  console.log('\nProblemas de consola:', relevant.length ? '\n' + relevant.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && relevant.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
