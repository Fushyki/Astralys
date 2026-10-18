/**
 * Redesign, Card (/card/:id): formatos 4:5/16:9/9:16, textos, apelido, cor, e PNG baixado com o tamanho certo.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/r-card.cjs
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
const pngSize = (file) => { const b = fs.readFileSync(file); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true })).newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/404/.test(m.text())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(500);

  await page.goto(`${BASE}/card/exemplo`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.pc');

  check('a aba Vault está ativa', (await page.locator('.dz-nav a[aria-current="page"]').textContent()).includes('Vault'));
  check('abre em 4:5 (1080×1350)', (await page.locator('.pc').evaluate((e) => `${parseInt(e.style.width)}x${parseInt(e.style.height)}`)) === '1080x1350');
  const text = await page.textContent('.pc');
  check('o card mostra DPS 216.600 e 3,79 mi', text.includes('216.600') && text.includes('3,79 mi'), '');
  check('mostra os 4 personagens e a reação (55% vem de Derreter)', ['Mavuika', 'Citlali', 'Iansan', 'Bennett'].every((n) => text.includes(n)) && /55%\s*vem de Derreter/.test(text));
  check('mini linha do tempo com 24 golpes', (await page.locator('.pc-line span').count()) === 24);

  await page.fill('.cd-form input[placeholder*="apelido" i], .cd-form input[placeholder^="Aparece"]', 'Davi');
  check('apelido aparece como "por Davi"', (await page.textContent('.pc-nick')) === 'por Davi');
  await page.fill('.cd-form input[placeholder="Ex.: Meta 7.1"]', 'Meta 5.8');
  check('a etiqueta entra no subtítulo', (await page.textContent('.pc-sub')).includes('Meta 5.8'));
  await page.click('.cd-swatch[aria-label="Cor #8fd3e8"]');
  check('a cor de destaque muda o card', (await page.locator('.pc').evaluate((e) => getComputedStyle(e).getPropertyValue('--accent').trim())) === '#8fd3e8');

  for (const [label, size, cls] of [['16:9', '1600x900', 'pc-wide'], ['9:16', '1080x1920', 'pc-tall'], ['4:5', '1080x1350', 'pc-portrait']]) {
    await page.click(`.dz-seg button:has-text("${label}")`); await settle();
    const dims = await page.locator('.pc').evaluate((e) => `${parseInt(e.style.width)}x${parseInt(e.style.height)}`);
    check(`formato ${label} tem ${size}`, dims === size && (await page.locator(`.pc.${cls}`).count()) === 1, dims);
    await page.screenshot({ path: path.join(OUT, `r-card-${cls}.png`), fullPage: true });
  }

  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('button:has-text("Baixar PNG")')]);
  const file = path.join(OUT, 'r-card-download.png');
  await dl.saveAs(file);
  const sz = pngSize(file);
  check('o PNG baixado tem 1080×1350 e nome com 4x5', sz.w === 1080 && sz.h === 1350 && /4x5\.png$/.test(dl.suggestedFilename()), `${sz.w}×${sz.h} ${dl.suggestedFilename()}`);

  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.pc');
  check('apelido e cor sobrevivem ao recarregar', (await page.textContent('.pc-nick')) === 'por Davi');

  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(500);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.screenshot({ path: path.join(OUT, 'r-card-mobile.png'), fullPage: true });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
