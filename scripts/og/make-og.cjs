/** Gera public/og.jpg (pré-visualização do link) a partir de scripts/og/og.html. Uso: node scripts/og/make-og.cjs */
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ channel: process.env.E2E_BROWSER || 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('file:///' + path.resolve(__dirname, 'og.html').split(path.sep).join('/'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.resolve(__dirname, '../../public/og.jpg'), type: 'jpeg', quality: 90 });
  await browser.close();
})();
